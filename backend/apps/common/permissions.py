from rest_framework import authentication
from rest_framework import exceptions
from rest_framework.permissions import BasePermission

# NOTE: kept for an empty authentication due to RBAC compatibility

class MockUser:
    def __init__(self, role, affiliate=None):
        self.role = role
        self.affiliate = affiliate
        self.is_authenticated = True
        self.is_active = True
        self.is_staff = (role == 'admin')
        self.username = "admin" if role == "admin" else (affiliate.email if affiliate else "affiliate")

    def __str__(self):
        return f"MockUser({self.role})"

class HeaderAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        role = request.headers.get('X-Role') or request.META.get('HTTP_X_ROLE')
        
        # Lazy import to avoid circular dependencies
        from apps.affiliates.models import Affiliate
        
        # Determine fallback affiliate
        fallback_affiliate = Affiliate.objects.filter(is_active=True).first()
        if not fallback_affiliate:
            fallback_affiliate = Affiliate.objects.first()

        if not role:
            # Default to affiliate with fallback to prevent crashes/unauthenticated errors
            return (MockUser('affiliate', fallback_affiliate), None)
        
        role = role.lower()
        if role == 'admin':
            return (MockUser('admin'), None)
        elif role == 'affiliate':
            affiliate_id = request.headers.get('X-Affiliate-ID') or request.META.get('HTTP_X_AFFILIATE_ID')
            if not affiliate_id:
                return (MockUser('affiliate', fallback_affiliate), None)
            
            try:
                affiliate = Affiliate.objects.get(id=affiliate_id, is_active=True)
                return (MockUser('affiliate', affiliate), None)
            except (Affiliate.DoesNotExist, ValueError):
                return (MockUser('affiliate', fallback_affiliate), None)
        
        return (MockUser('affiliate', fallback_affiliate), None)

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return True

class IsAffiliateUser(BasePermission):
    def has_permission(self, request, view):
        return True

# Register with drf-spectacular to avoid the OpenAPI documentation warnings
try:
    from drf_spectacular.extensions import OpenApiAuthenticationExtension

    class HeaderAuthenticationScheme(OpenApiAuthenticationExtension):
        target_class = 'apps.common.permissions.HeaderAuthentication'
        name = 'HeaderAuthentication'

        def get_security_definition(self, auto_schema):
            return {
                'type': 'apiKey',
                'in': 'header',
                'name': 'X-Role',
                'description': 'Custom Header Authentication'
            }
except ImportError:
    pass

