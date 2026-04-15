from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from django.conf import settings
from django.http import HttpResponse
import razorpay
import openai

from openai import OpenAI
import os

from .models import Package, ITRRequest, Document, Payment, ITRStatusLog
from .serializers import (
    RegisterSerializer,
    PackageSerializer,
    ITRRequestSerializer,
    DocumentUploadSerializer,
    DocumentSerializer,
    PaymentSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def home(request):
    return HttpResponse("Taxologer Backend is Running")


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "username": user.username,
                "name": full_name,
                "email": user.email,
                "role": user.role,
            },
            "role": user.role,
            "username": user.username,
        })


class PackageListView(generics.ListAPIView):
    queryset = Package.objects.filter(is_active=True).order_by("price")
    serializer_class = PackageSerializer
    permission_classes = [IsAuthenticated]


class CreateITRRequestView(generics.CreateAPIView):
    queryset = ITRRequest.objects.all()
    serializer_class = ITRRequestSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DocumentUploadView(generics.CreateAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentUploadSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        return Response({
            "message": "Document uploaded successfully",
            "document": DocumentSerializer(document, context={"request": request}).data,
        }, status=status.HTTP_201_CREATED)


class PaymentView(generics.GenericAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_obj = serializer.save()
        return Response({
            "message": "Payment processed successfully",
            "payment_status": request_obj.payment_status,
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_payment_order(request):
    request_id = request.data.get("request_id")

    try:
        itr_request = ITRRequest.objects.get(id=request_id, user=request.user)
    except ITRRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    if itr_request.payment_status == "PAID":
        return Response({"error": "Already paid"}, status=400)

    amount = int(float(itr_request.package.price) * 100)

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    order = client.order.create({
        "amount": amount,
        "currency": "INR",
        "payment_capture": 1,
    })

    itr_request.razorpay_order_id = order["id"]
    itr_request.save(update_fields=["razorpay_order_id", "updated_at"])

    Payment.objects.create(
        request=itr_request,
        payment_method="ONLINE",
        amount=itr_request.package.price,
        payment_status="INITIATED",
        transaction_id=order["id"],
    )

    return Response({
        "order_id": order["id"],
        "amount": amount,
        "razorpay_key": settings.RAZORPAY_KEY_ID,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    razorpay_order_id = request.data.get("razorpay_order_id")
    razorpay_payment_id = request.data.get("razorpay_payment_id")
    razorpay_signature = request.data.get("razorpay_signature")

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        })

        itr = ITRRequest.objects.get(razorpay_order_id=razorpay_order_id, user=request.user)
        itr.payment_status = "PAID"
        itr.save(update_fields=["payment_status", "updated_at"])

        Payment.objects.filter(request=itr, transaction_id=razorpay_order_id).update(
            payment_status="SUCCESS",
            transaction_id=razorpay_payment_id,
        )

        return Response({"message": "Payment verified successfully"})
    except Exception:
        return Response({"error": "Payment verification failed"}, status=400)


class MyITRRequestsView(generics.ListAPIView):
    serializer_class = ITRRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ITRRequest.objects.filter(user=self.request.user).select_related("package").order_by("-created_at")


class AllITRRequestsView(generics.ListAPIView):
    serializer_class = ITRRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "ADMIN":
            return ITRRequest.objects.select_related("package", "user").all().order_by("-created_at")
        return ITRRequest.objects.none()


class UpdateITRStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        request_id = request.data.get("request_id")
        status_value = request.data.get("status")
        note = request.data.get("note", "")

        try:
            itr = ITRRequest.objects.get(id=request_id)
        except ITRRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

        valid_statuses = [choice[0] for choice in ITRRequest.STATUS_CHOICES]
        if status_value not in valid_statuses:
            return Response({"error": "Invalid status"}, status=400)

        itr.request_status = status_value
        itr.save(update_fields=["request_status", "updated_at"])
        ITRStatusLog.objects.create(itr_request=itr, status=status_value, note=note or "Status updated by admin")

        if itr.user.email:
            send_mail(
                subject="Your Taxologer request status has been updated",
                message=(
                    f"Hello {itr.user.username},\n\n"
                    f"Your request {itr.request_number} status has been updated.\n\n"
                    f"New status: {itr.request_status}\n\n"
                    f"Thank you,\nTaxologer"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[itr.user.email],
                fail_silently=True,
            )

        return Response({"message": "Status updated successfully", "new_status": status_value})


class UserDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = ITRRequest.objects.filter(user=user)
        latest = qs.select_related("package").order_by("-created_at")[:5]
        data = {
            "user": UserProfileSerializer(user).data,
            "total_requests": qs.count(),
            "pending_requests": qs.filter(request_status="PENDING").count(),
            "completed_requests": qs.filter(request_status="COMPLETED").count(),
            "paid_requests": qs.filter(payment_status="PAID").count(),
            "recent_requests": ITRRequestSerializer(latest, many=True, context={"request": request}).data,
        }
        return Response(data)


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        data = {
            "total_users": User.objects.count(),
            "total_requests": ITRRequest.objects.count(),
            "pending_requests": ITRRequest.objects.filter(request_status="PENDING").count(),
            "completed_requests": ITRRequest.objects.filter(request_status="COMPLETED").count(),
            "paid_requests": ITRRequest.objects.filter(payment_status="PAID").count(),
        }
        return Response(data)


class RequestDocumentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, request_id):
        try:
            if request.user.role == "ADMIN":
                itr_request = ITRRequest.objects.get(id=request_id)
            else:
                itr_request = ITRRequest.objects.get(id=request_id, user=request.user)
        except ITRRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

        documents = Document.objects.filter(itr_request=itr_request).order_by("-uploaded_at")
        serializer = DocumentSerializer(documents, many=True, context={"request": request})
        return Response(serializer.data)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully", "data": serializer.data})
        return Response(serializer.errors, status=400)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"error": "Old password is incorrect"}, status=400)
            user.password = make_password(serializer.data.get("new_password"))
            user.save()
            return Response({"message": "Password changed successfully"})
        return Response(serializer.errors, status=400)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.id))
            token = default_token_generator.make_token(user)
            reset_link = f"http://127.0.0.1:8000/api/reset-password/{uid}/{token}/"
            send_mail(
                "Password Reset",
                f"Click the link to reset password: {reset_link}",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=True,
            )
            return Response({"message": "Password reset link sent to email"})
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist"}, status=404)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uid, token):
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(id=user_id)
            if not default_token_generator.check_token(user, token):
                return Response({"error": "Invalid token"}, status=400)
            password = request.data.get("password")
            user.password = make_password(password)
            user.save()
            return Response({"message": "Password reset successful"})
        except Exception:
            return Response({"error": "Invalid request"}, status=400)


class VerifyDocumentsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_id = request.data.get("request_id")
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        try:
            itr = ITRRequest.objects.get(id=request_id)
        except ITRRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

        Document.objects.filter(itr_request=itr).update(verification_status="VERIFIED")
        itr.request_status = "DOCUMENT_VERIFIED"
        itr.save(update_fields=["request_status", "updated_at"])
        ITRStatusLog.objects.create(itr_request=itr, status="DOCUMENT_VERIFIED", note="Documents verified by admin")

        if itr.user.email:
            send_mail(
                subject="Your documents have been verified",
                message=(
                    f"Hello {itr.user.username},\n\n"
                    f"Your documents for request {itr.request_number} have been verified successfully.\n\n"
                    f"Current status: {itr.request_status}\n\n"
                    f"Thank you,\nTaxologer"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[itr.user.email],
                fail_silently=True,
            )

        return Response({"message": "Documents verified successfully", "request_status": itr.request_status})


@api_view(["POST"])
@permission_classes([AllowAny])
def chatbot_view(request):
    user_message = request.data.get("message", "").strip()

    if not user_message:
        return Response({"reply": "Please ask something."}, status=400)

    try:
        api_key = getattr(settings, "GROQ_API_KEY", "") or os.getenv("GROQ_API_KEY", "")
        if not api_key:
            return Response(
                {"reply": "Groq API key is missing in backend settings."},
                status=500,
            )

        client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Taxologer AI assistant. "
                        "Help Indian users with ITR filing, packages, document uploads, "
                        "payments, and service tracking. Keep answers short, clear, and helpful."
                    ),
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ],
            temperature=0.4,
        )

        reply = response.choices[0].message.content
        return Response({"reply": reply})

    except Exception as e:
        return Response(
            {"reply": f"Chatbot backend error: {str(e)}"},
            status=500,
        )