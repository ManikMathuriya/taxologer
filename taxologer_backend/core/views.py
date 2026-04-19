from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.http import HttpResponse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from openai import OpenAI
import os
import razorpay

from .models import Package, ITRRequest, Document, Payment
from .serializers import (
    RegisterSerializer,
    PackageSerializer,
    ITRRequestSerializer,
    DocumentSerializer,
    PaymentSerializer,
    UserSerializer,
)

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
            return Response(
                {"error": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": full_name,
                    "email": user.email,
                    "role": user.role,
                    "phone_number": user.phone_number,
                },
            }
        )


class PackageListView(generics.ListAPIView):
    queryset = Package.objects.filter(is_active=True).order_by("price")
    serializer_class = PackageSerializer
    permission_classes = [AllowAny]


class CreateITRRequestView(generics.CreateAPIView):
    queryset = ITRRequest.objects.all()
    serializer_class = ITRRequestSerializer
    permission_classes = [IsAuthenticated]


class MyITRRequestsView(generics.ListAPIView):
    serializer_class = ITRRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            ITRRequest.objects.filter(user=self.request.user)
            .select_related("package")
            .prefetch_related("documents")
            .order_by("-created_at")
        )


class AllITRRequestsView(generics.ListAPIView):
    serializer_class = ITRRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != "ADMIN":
            return ITRRequest.objects.none()

        return (
            ITRRequest.objects.select_related("package", "user")
            .prefetch_related("documents")
            .all()
            .order_by("-created_at")
        )


class UpdateITRStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        request_id = request.data.get("request_id")
        status_value = request.data.get("status")

        valid_statuses = [
            "PENDING",
            "DOCUMENTS_SUBMITTED",
            "UNDER_REVIEW",
            "DOCUMENT_VERIFIED",
            "FILED",
            "COMPLETED",
            "REJECTED",
        ]

        if status_value not in valid_statuses:
            return Response({"error": "Invalid status"}, status=400)

        try:
            itr = ITRRequest.objects.get(id=request_id)
        except ITRRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

        itr.request_status = status_value
        itr.save(update_fields=["request_status"])

        if itr.user.email:
            send_mail(
                subject="Your Taxologer request status has been updated",
                message=(
                    f"Hello {itr.user.username},\n\n"
                    f"Your request {itr.request_number} status is now: {itr.request_status}\n\n"
                    f"Thank you,\nTaxologer"
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[itr.user.email],
                fail_silently=True,
            )

        return Response(
            {
                "message": "Status updated successfully",
                "new_status": itr.request_status,
            }
        )


class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        itr_request_id = request.data.get("itr_request")
        document_type = request.data.get("document_type")
        file = request.FILES.get("file")

        if not itr_request_id or not document_type or not file:
            return Response(
                {"error": "itr_request, document_type, and file are required"},
                status=400,
            )

        try:
            itr_request = ITRRequest.objects.get(id=itr_request_id)
        except ITRRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

        if request.user.role != "ADMIN" and itr_request.user != request.user:
            return Response({"error": "Not allowed"}, status=403)

        document = Document.objects.create(
            itr_request=itr_request,
            document_type=document_type,
            file=file,
        )

        if itr_request.request_status == "PENDING":
            itr_request.request_status = "DOCUMENTS_SUBMITTED"
            itr_request.save(update_fields=["request_status"])

        serializer = DocumentSerializer(document, context={"request": request})
        return Response(
            {
                "message": "Document uploaded successfully",
                "document": serializer.data,
            },
            status=201,
        )


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


class VerifyDocumentsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        request_id = request.data.get("request_id")

        try:
            itr = ITRRequest.objects.get(id=request_id)
        except ITRRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

        Document.objects.filter(itr_request=itr).update(verification_status="VERIFIED")
        itr.request_status = "DOCUMENT_VERIFIED"
        itr.save(update_fields=["request_status"])

        if itr.user.email:
            send_mail(
                subject="Your documents have been verified",
                message=(
                    f"Hello {itr.user.username},\n\n"
                    f"Your documents for request {itr.request_number} have been verified.\n\n"
                    f"Thank you,\nTaxologer"
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[itr.user.email],
                fail_silently=True,
            )

        return Response(
            {
                "message": "Documents verified successfully",
                "request_status": itr.request_status,
            }
        )


class PaymentView(generics.CreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


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

    amount = int(float(itr_request.final_price or itr_request.package.price) * 100)

    client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )

    order = client.order.create(
        {
            "amount": amount,
            "currency": "INR",
            "payment_capture": 1,
        }
    )

    payment, _ = Payment.objects.get_or_create(
        itr_request=itr_request,
        defaults={
            "amount": itr_request.final_price or itr_request.package.price,
            "payment_method": "RAZORPAY",
            "razorpay_order_id": order["id"],
            "status": "CREATED",
        },
    )

    if payment.razorpay_order_id != order["id"]:
        payment.razorpay_order_id = order["id"]
        payment.amount = itr_request.final_price or itr_request.package.price
        payment.status = "CREATED"
        payment.save()

    return Response(
        {
            "order_id": order["id"],
            "amount": amount,
            "razorpay_key": settings.RAZORPAY_KEY_ID,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    razorpay_order_id = request.data.get("razorpay_order_id")
    razorpay_payment_id = request.data.get("razorpay_payment_id")
    razorpay_signature = request.data.get("razorpay_signature")

    client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )

    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )

        payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
        itr = payment.itr_request

        if itr.user != request.user:
            return Response({"error": "Not allowed"}, status=403)

        payment.razorpay_payment_id = razorpay_payment_id
        payment.status = "SUCCESS"
        payment.save()

        itr.payment_status = "PAID"
        itr.save(update_fields=["payment_status"])

        if itr.user.email:
            send_mail(
                subject="Payment Successful",
                message=(
                    f"Hello {itr.user.username},\n\n"
                    f"Your payment for request {itr.request_number} was successful.\n"
                    f"Paid amount: ₹{itr.final_price or itr.package.price}\n\n"
                    f"Thank you,\nTaxologer"
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[itr.user.email],
                fail_silently=True,
            )

        return Response({"message": "Payment verified successfully"})

    except Payment.DoesNotExist:
        return Response({"error": "Payment record not found"}, status=404)
    except Exception:
        return Response({"error": "Payment verification failed"}, status=400)


class UserDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = ITRRequest.objects.filter(user=user).select_related("package").order_by("-created_at")

        recent = ITRRequestSerializer(
            qs[:5],
            many=True,
            context={"request": request},
        ).data

        data = {
            "user": UserSerializer(user).data,
            "total_requests": qs.count(),
            "pending_requests": qs.filter(request_status="PENDING").count(),
            "completed_requests": qs.filter(request_status="COMPLETED").count(),
            "paid_requests": qs.filter(payment_status="PAID").count(),
            "recent_requests": recent,
            "available_packages": PackageSerializer(
                Package.objects.filter(is_active=True).order_by("price"),
                many=True,
            ).data,
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


class PartnerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "PARTNER":
            return Response({"error": "Access denied"}, status=403)

        qs = ITRRequest.objects.filter(user=request.user).select_related("package").order_by("-created_at")

        recent = ITRRequestSerializer(
            qs[:10],
            many=True,
            context={"request": request},
        ).data

        return Response(
            {
                "partner": UserSerializer(request.user).data,
                "total_requests": qs.count(),
                "pending_requests": qs.filter(request_status="PENDING").count(),
                "completed_requests": qs.filter(request_status="COMPLETED").count(),
                "paid_requests": qs.filter(payment_status="PAID").count(),
                "total_revenue": sum(float(item.final_price or 0) for item in qs),
                "recent_requests": recent,
            }
        )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user

        user.first_name = request.data.get("first_name", user.first_name)
        user.last_name = request.data.get("last_name", user.last_name)
        user.email = request.data.get("email", user.email)
        user.phone_number = request.data.get("phone_number", user.phone_number)
        user.save()

        return Response(
            {
                "message": "Profile updated successfully",
                "data": UserSerializer(user).data,
            }
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"error": "Old password and new password are required"},
                status=400,
            )

        user = request.user
        if not user.check_password(old_password):
            return Response({"error": "Old password is incorrect"}, status=400)

        user.password = make_password(new_password)
        user.save()

        return Response({"message": "Password changed successfully"})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email is required"}, status=400)

        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.id))
            token = default_token_generator.make_token(user)

            frontend_url = os.getenv("FRONTEND_URL", "https://taxologer.online")
            reset_link = f"{frontend_url}/reset-password/{uid}/{token}/"

            send_mail(
                "Password Reset",
                f"Click the link to reset password: {reset_link}",
                getattr(settings, "DEFAULT_FROM_EMAIL", None),
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
            if not password:
                return Response({"error": "Password is required"}, status=400)

            user.password = make_password(password)
            user.save()

            return Response({"message": "Password reset successful"})
        except Exception:
            return Response({"error": "Invalid request"}, status=400)


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