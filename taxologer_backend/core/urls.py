from django.urls import path
from .views import *

urlpatterns = [

    # =========================
    # AUTH
    # =========================
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),

    # =========================
    # PACKAGES
    # =========================
    path("packages/", PackageListView.as_view()),

    # =========================
    # ITR REQUESTS
    # =========================
    path("create-request/", CreateITRRequestView.as_view()),
    path("my-itr-requests/", MyITRRequestsView.as_view()),

    # ADMIN
    path("admin/itr-requests/", AllITRRequestsView.as_view()),
    path("admin/update-status/", UpdateITRStatusView.as_view()),
    path("admin/dashboard/", AdminDashboardView.as_view()),
    path("admin/verify-documents/", VerifyDocumentsView.as_view()),

    # =========================
    # DOCUMENTS
    # =========================
    path("upload-document/", DocumentUploadView.as_view()),
    path("request/<int:request_id>/documents/", RequestDocumentsView.as_view()),

    # =========================
    # PAYMENTS
    # =========================
    path("payment/", PaymentView.as_view()),
    path("create-payment-order/", create_payment_order),
    path("verify-payment/", verify_payment),

    # =========================
    # DASHBOARD
    # =========================
    path("dashboard/", UserDashboardView.as_view()),

    # PARTNER
    path("partner/dashboard/", PartnerDashboardView.as_view()),

    # =========================
    # PROFILE
    # =========================
    path("profile/", UserProfileView.as_view()),
    path("profile/update/", UpdateProfileView.as_view()),
    path("change-password/", ChangePasswordView.as_view()),

    # PASSWORD RESET
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("reset-password/<uid>/<token>/", ResetPasswordView.as_view()),

    # =========================
    # CHATBOT
    # =========================
    path("chatbot/", chatbot_view),
]