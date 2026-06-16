import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bulk_file_affiliate.settings')

application = get_asgi_application()
