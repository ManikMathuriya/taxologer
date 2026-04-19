from django.core.management.base import BaseCommand
from yourapp.models import Package

class Command(BaseCommand):
    help = "Seed default packages"

    def handle(self, *args, **kwargs):
        if Package.objects.exists():
            self.stdout.write(self.style.WARNING("Packages already exist"))
            return

        Package.objects.create(
            name="Basic",
            description="Simple ITR filing",
            price=499,
            benefits=["Basic Filing", "Email Support"],
            is_popular=False,
            is_active=True,
        )

        Package.objects.create(
            name="Standard",
            description="ITR with document review",
            price=599,
            benefits=["Document Review", "Priority Support"],
            is_popular=True,
            is_active=True,
        )

        Package.objects.create(
            name="Premium",
            description="Complete tax assistance",
            price=1999,
            benefits=["Full Support", "Dedicated CA"],
            is_popular=False,
            is_active=True,
        )

        self.stdout.write(self.style.SUCCESS("Packages created successfully"))