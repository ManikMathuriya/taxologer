from django.db import models
from django.contrib.auth.models import AbstractUser


# =========================
# USER MODEL
# =========================
class User(AbstractUser):
    ROLE_CHOICES = (
        ("USER", "User"),
        ("ADMIN", "Admin"),
        ("PARTNER", "Partner"),
    )

    phone_number = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="USER")

    def __str__(self):
        return f"{self.username} ({self.role})"


# =========================
# PACKAGE MODEL
# =========================
class Package(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    benefits = models.JSONField(default=list, blank=True)

    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# =========================
# ITR REQUEST MODEL
# =========================
class ITRRequest(models.Model):
    SERVICE_MODE_CHOICES = (
        ("UPLOAD", "Upload Documents"),
        ("WHATSAPP", "WhatsApp Support"),
    )

    REQUEST_STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("DOCUMENTS_SUBMITTED", "Documents Submitted"),
        ("UNDER_REVIEW", "Under Review"),
        ("DOCUMENT_VERIFIED", "Document Verified"),
        ("FILED", "Filed"),
        ("COMPLETED", "Completed"),
        ("REJECTED", "Rejected"),
    )

    PAYMENT_STATUS_CHOICES = (
        ("UNPAID", "Unpaid"),
        ("PAID", "Paid"),
        ("FAILED", "Failed"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="itr_requests")
    package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True)

    request_number = models.CharField(max_length=100, unique=True, blank=True)

    service_mode = models.CharField(max_length=20, choices=SERVICE_MODE_CHOICES)

    request_status = models.CharField(
        max_length=30,
        choices=REQUEST_STATUS_CHOICES,
        default="PENDING",
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="UNPAID",
    )

    # 💰 PRICING
    discount_code = models.CharField(max_length=50, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.request_number} - {self.user.username}"


# =========================
# DOCUMENT MODEL
# =========================
class Document(models.Model):
    DOCUMENT_TYPE_CHOICES = (
        ("PAN", "PAN"),
        ("AADHAAR", "AADHAAR"),
        ("FORM16", "FORM16"),
        ("OTHER", "Other"),
    )

    VERIFICATION_STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("VERIFIED", "Verified"),
    )

    itr_request = models.ForeignKey(
        ITRRequest,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    file = models.FileField(upload_to="documents/")
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)

    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default="PENDING",
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document_type} - {self.itr_request.request_number}"


# =========================
# PAYMENT MODEL
# =========================
class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ("RAZORPAY", "Razorpay"),
    )

    itr_request = models.OneToOneField(
        ITRRequest,
        on_delete=models.CASCADE,
        related_name="payment"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default="RAZORPAY",
    )

    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True)

    status = models.CharField(max_length=20, default="CREATED")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment - {self.itr_request.request_number}"


# =========================
# CHAT SYSTEM
# =========================
class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_sessions")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ChatSession {self.id} - {self.user.username}"


class ChatMessage(models.Model):
    SENDER_CHOICES = (
        ("USER", "User"),
        ("BOT", "Bot"),
    )

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")

    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.message[:30]}"