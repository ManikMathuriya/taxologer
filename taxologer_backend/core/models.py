from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator


class User(AbstractUser):
    ROLE_CHOICES = (
        ("USER", "User"),
        ("ADMIN", "Admin"),
    )

    phone_number = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="USER")

    def __str__(self):
        return self.username


class Package(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    benefits = models.JSONField(default=list, blank=True)
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ITRRequest(models.Model):
    SERVICE_MODE = (
        ("WHATSAPP", "WhatsApp"),
        ("UPLOAD", "Upload"),
    )

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("DOCUMENTS_SUBMITTED", "Documents Submitted"),
        ("UNDER_REVIEW", "Under Review"),
        ("DOCUMENT_VERIFIED", "Document Verified"),
        ("FILED", "Filed"),
        ("REJECTED", "Rejected"),
        ("COMPLETED", "Completed"),
    )

    PAYMENT_STATUS = (
        ("UNPAID", "Unpaid"),
        ("PAID", "Paid"),
        ("COD", "Cash on Delivery"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="itr_requests")
    package = models.ForeignKey("Package", on_delete=models.CASCADE)
    request_number = models.CharField(max_length=20, unique=True, blank=True)
    service_mode = models.CharField(max_length=20, choices=SERVICE_MODE, default="UPLOAD")
    request_status = models.CharField(max_length=25, choices=STATUS_CHOICES, default="PENDING")
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS, default="UNPAID")
    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.request_number:
            year = self.created_at.year if self.created_at else None
            if year is None:
                from django.utils import timezone
                year = timezone.now().year
            last_request = ITRRequest.objects.order_by("id").last()
            new_id = 1 if not last_request else last_request.id + 1
            self.request_number = f"ITR-{year}-{new_id:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.request_number


class ITRStatusLog(models.Model):
    itr_request = models.ForeignKey(ITRRequest, on_delete=models.CASCADE, related_name="status_logs")
    status = models.CharField(max_length=25, choices=ITRRequest.STATUS_CHOICES)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.itr_request.request_number} - {self.status}"


class Document(models.Model):
    DOCUMENT_TYPES = (
        ("PAN", "PAN Card"),
        ("AADHAAR", "Aadhaar Card"),
        ("BANK_STATEMENT", "Bank Statement"),
        ("FORM16", "Form 16"),
        ("BUSINESS_PROOF", "Business Proof"),
    )

    VERIFICATION_STATUS = (
        ("PENDING", "Pending"),
        ("VERIFIED", "Verified"),
        ("REJECTED", "Rejected"),
    )

    itr_request = models.ForeignKey(ITRRequest, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(
        upload_to="documents/%Y/%m/%d/",
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "pdf", "webp"])]
    )
    verification_status = models.CharField(max_length=10, choices=VERIFICATION_STATUS, default="PENDING")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document_type} - {self.itr_request.request_number}"


class Payment(models.Model):
    PAYMENT_METHODS = (
        ("ONLINE", "Online"),
        ("COD", "Cash on Delivery"),
    )

    PAYMENT_STATUS = (
        ("INITIATED", "Initiated"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
        ("COD_PENDING", "COD Pending"),
    )

    request = models.ForeignKey(ITRRequest, on_delete=models.CASCADE, related_name="payments")
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.request.request_number} - {self.payment_status}"


class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.id}"


class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    message = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message {self.id}"
