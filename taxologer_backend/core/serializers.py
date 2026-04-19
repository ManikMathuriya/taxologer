from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Package,
    ITRRequest,
    Document,
    Payment,
)

User = get_user_model()


# =========================
# USER SERIALIZERS
# =========================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
        ]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
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
        ]


# =========================
# PACKAGE SERIALIZER
# =========================
class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = "__all__"


# =========================
# DOCUMENT SERIALIZER
# =========================
class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "file",
            "file_url",
            "document_type",
            "verification_status",
            "uploaded_at",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


# =========================
# ITR REQUEST SERIALIZER
# =========================
class ITRRequestSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source="package.name", read_only=True)
    user = serializers.CharField(source="user.username", read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = ITRRequest
        fields = [
            "id",
            "request_number",
            "package",
            "package_name",
            "user",
            "service_mode",
            "request_status",
            "payment_status",
            "discount_code",
            "discount_amount",
            "final_price",
            "created_at",
            "documents",
        ]

    # 🔥 CREATE LOGIC WITH DISCOUNT
    def create(self, validated_data):
        request = self.context["request"]
        user = request.user

        package = validated_data.get("package")
        price = float(package.price)

        code = request.data.get("discount_code")
        discount = 0

        # ✅ DISCOUNT LOGIC
        if code:
            if price == 499:
                discount = 200
            elif price == 599:
                discount = 300

        final_price = price - discount

        # ✅ GENERATE REQUEST NUMBER
        import uuid
        request_number = f"REQ-{uuid.uuid4().hex[:8].upper()}"

        itr = ITRRequest.objects.create(
            user=user,
            request_number=request_number,
            discount_code=code,
            discount_amount=discount,
            final_price=final_price,
            payment_status="UNPAID",
            request_status="PENDING",
            **validated_data,
        )

        return itr


# =========================
# PAYMENT SERIALIZER
# =========================
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"


# =========================
# DASHBOARD SERIALIZER (USER)
# =========================
class UserDashboardSerializer(serializers.Serializer):
    total_requests = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    completed_requests = serializers.IntegerField()
    paid_requests = serializers.IntegerField()
    recent_requests = serializers.ListField()


# =========================
# ADMIN DASHBOARD SERIALIZER
# =========================
class AdminDashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_requests = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    completed_requests = serializers.IntegerField()
    paid_requests = serializers.IntegerField()