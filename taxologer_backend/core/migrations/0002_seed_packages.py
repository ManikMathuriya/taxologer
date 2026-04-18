from django.db import migrations


def seed_packages(apps, schema_editor):
    Package = apps.get_model("core", "Package")

    Package.objects.update_or_create(
        name="ITR 1 (Salaried person)",
        defaults={
            "description": "Perfect for salaried individuals who want fast and reliable tax filing.",
            "price": 499,
            "benefits": [
                "Verified document support",
                "Fast processing",
                "Secure upload",
                "Expert assistance",
            ],
        },
    )

    Package.objects.update_or_create(
        name="ITR (For Business Individual)",
        defaults={
            "description": "Built for business individuals who need deeper filing support and financial review.",
            "price": 599,
            "benefits": [
                "24/hr. call support",
                "Computation",
                "TDS info",
                "Balance sheet",
                "Delivery at door step",
                "Verified document",
            ],
        },
    )


def unseed_packages(apps, schema_editor):
    Package = apps.get_model("core", "Package")
    Package.objects.filter(
        name__in=[
            "ITR 1 (Salaried person)",
            "ITR (For Business Individual)",
        ]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_packages, unseed_packages),
    ]