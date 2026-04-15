from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .models import Package, ITRRequest, Document, Payment, ITRStatusLog

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password", "phone_number", "first_name", "last_name"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = ["id", "name", "description", "price", "benefits", "is_popular", "is_active"]


class ITRStatusLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ITRStatusLog
        fields = ["id", "status", "note", "created_at"]


class ITRRequestSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    package_name = serializers.CharField(source="package.name", read_only=True)
    package_price = serializers.DecimalField(source="package.price", max_digits=10, decimal_places=2, read_only=True)
    timeline = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = ITRRequest
        fields = [
            "id",
            "user",
            "package",
            "package_name",
            "package_price",
            "request_number",
            "service_mode",
            "request_status",
            "payment_status",
            "razorpay_order_id",
            "notes",
            "created_at",
            "updated_at",
            "timeline",
            "progress",
        ]
        read_only_fields = ["user", "request_number", "payment_status", "request_status", "timeline", "progress"]

    def get_timeline(self, obj):
        order = [
            "PENDING",
            "DOCUMENTS_SUBMITTED",
            "UNDER_REVIEW",
            "DOCUMENT_VERIFIED",
            "FILED",
            "COMPLETED",
        ]
        status_index = order.index(obj.request_status) if obj.request_status in order else 0
        data = []
        for index, status in enumerate(order):
            data.append({
                "key": status,
                "label": status.replace("_", " ").title(),
                "done": index <= status_index,
                "active": index == status_index,
            })
        if obj.request_status == "REJECTED":
            data.append({"key": "REJECTED", "label": "Rejected", "done": True, "active": True})
        return data

    def get_progress(self, obj):
        mapping = {
            "PENDING": 15,
            "DOCUMENTS_SUBMITTED": 35,
            "UNDER_REVIEW": 55,
            "DOCUMENT_VERIFIED": 75,
            "FILED": 90,
            "COMPLETED": 100,
            "REJECTED": 100,
        }
        return mapping.get(obj.request_status, 0)

    def create(self, validated_data):
        user = self.context["request"].user
        itr = ITRRequest.objects.create(
            user=user,
            payment_status="UNPAID",
            request_status="PENDING",
            **validated_data,
        )
        ITRStatusLog.objects.create(itr_request=itr, status="PENDING", note="Request created")

        if user.email:
            send_mail(
                subject="Your ITR request has been created",
                message=(
                    f"Hello {user.username},\n\n"
                    f"Your ITR request {itr.request_number} has been created successfully.\n\n"
                    f"Service mode: {itr.service_mode}\n"
                    f"Payment status: {itr.payment_status}\n\n"
                    f"Thank you,\nTaxologer"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        return itr


class DocumentUploadSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Document
        fields = ["id", "itr_request", "document_type", "file", "file_url", "verification_status", "uploaded_at"]
        read_only_fields = ["verification_status", "uploaded_at", "file_url"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else ""

    def validate(self, data):
        request_obj = data["itr_request"]
        user = self.context["request"].user
        file = data.get("file")

        if request_obj.user != user and user.role != "ADMIN":
            raise serializers.ValidationError("You cannot upload documents for this request.")

        if not file:
            raise serializers.ValidationError({"file": "File is required."})

        max_size = 10 * 1024 * 1024
        if file.size > max_size:
            raise serializers.ValidationError({"file": "File size must be under 10MB."})

        allowed_types = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "application/pdf",
        ]
        content_type = getattr(file, "content_type", "")
        if content_type and content_type not in allowed_types:
            raise serializers.ValidationError({"file": "Only JPG, PNG, WEBP, and PDF files are allowed."})

        return data

    def create(self, validated_data):
        document = super().create(validated_data)
        request_obj = document.itr_request

        required_docs = ["PAN", "AADHAAR", "BANK_STATEMENT"]
        uploaded_docs = list(
            Document.objects.filter(
                itr_request=request_obj,
                document_type__in=required_docs
            ).values_list("document_type", flat=True)
        )

        if all(doc in uploaded_docs for doc in required_docs):
            if request_obj.request_status == "PENDING":
                request_obj.request_status = "DOCUMENTS_SUBMITTED"
                request_obj.save(update_fields=["request_status", "updated_at"])
                ITRStatusLog.objects.create(
                    itr_request=request_obj,
                    status="DOCUMENTS_SUBMITTED",
                    note="Required documents uploaded",
                )

        return document


class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["id", "document_type", "file", "file_url", "verification_status", "uploaded_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else ""


class PaymentSerializer(serializers.Serializer):
    request_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=["ONLINE", "COD"])

    def validate(self, data):
        try:
            request_obj = ITRRequest.objects.get(id=data["request_id"], user=self.context["request"].user)
        except ITRRequest.DoesNotExist:
            raise serializers.ValidationError("Invalid request.")

        if request_obj.payment_status == "PAID":
            raise serializers.ValidationError("Already paid.")

        data["request_obj"] = request_obj
        return data

    def save(self):
        request_obj = self.validated_data["request_obj"]
        method = self.validated_data["payment_method"]

        if method == "ONLINE":
            request_obj.payment_status = "PAID"
            Payment.objects.create(
                request=request_obj,
                payment_method="ONLINE",
                amount=request_obj.package.price,
                payment_status="SUCCESS",
            )
        elif method == "COD":
            request_obj.payment_status = "COD"
            Payment.objects.create(
                request=request_obj,
                payment_method="COD",
                amount=request_obj.package.price,
                payment_status="COD_PENDING",
            )

        request_obj.save(update_fields=["payment_status", "updated_at"])
        return request_obj


class UserProfileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "name",
        ]

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone_number"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6)
