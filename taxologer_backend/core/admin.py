from django.contrib import admin
from .models import (
    User,
    Package,
    ITRRequest,
    Document,
    Payment,
    ChatSession,
    ChatMessage
)

admin.site.register(User)
admin.site.register(Package)
admin.site.register(ITRRequest)
admin.site.register(Document)
admin.site.register(Payment)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)