from django.core.management.base import BaseCommand
from apps.affiliates.models import Affiliate

class Command(BaseCommand):
    help = 'Seeds initial affiliates for preview matching testing'

    def handle(self, *args, **kwargs):
        affiliates_data = [
            {
                'id': 101,
                'first_name': 'John',
                'last_name': 'Doe',
                'email': 'john@example.com',
                'coupon_code': 'SAVE20',
                'is_active': True,
            },
            {
                'id': 102,
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane@example.com',
                'coupon_code': 'WINTER50',
                'is_active': True,
            },
            {
                'id': 103,
                'first_name': 'Bob',
                'last_name': 'Johnson',
                'email': 'bob@example.com',
                'coupon_code': 'FIRST10',
                'is_active': False,  # Inactive
            },
            {
                'id': 104,
                'first_name': 'Alice',
                'last_name': 'Brown',
                'email': 'alice@example.com',
                'coupon_code': 'SUMMER15',
                'is_active': True,
            },
        ]

        self.stdout.write('Seeding affiliates...')
        for data in affiliates_data:
            affiliate, created = Affiliate.objects.update_or_create(
                id=data['id'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'email': data['email'],
                    'coupon_code': data['coupon_code'],
                    'is_active': data['is_active'],
                }
            )
            status = 'created' if created else 'updated'
            self.stdout.write(f"Affiliate '{affiliate.first_name} {affiliate.last_name}' (ID: {affiliate.id}, Code: {affiliate.coupon_code}) {status}.")

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
