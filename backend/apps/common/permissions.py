from rest_framework import authentication
from rest_framework import exceptions
from rest_framework.permissions import BasePermission

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
        if not role:
            return None
        
        role = role.lower()
        if role == 'admin':
            return (MockUser('admin'), None)
        elif role == 'affiliate':
            affiliate_id = request.headers.get('X-Affiliate-ID') or request.META.get('HTTP_X_AFFILIATE_ID')
            if not affiliate_id:
                raise exceptions.AuthenticationFailed('X-Affiliate-ID header is required for affiliate role')
            
            # Lazy import to avoid circular dependencies
            from apps.affiliates.models import Affiliate
            try:
                affiliate = Affiliate.objects.get(id=affiliate_id, is_active=True)
                return (MockUser('affiliate', affiliate), None)
            except (Affiliate.DoesNotExist, ValueError):
                raise exceptions.AuthenticationFailed('Invalid or inactive affiliate')
        return None

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        if hasattr(request, 'user') and hasattr(request.user, 'role'):
            return request.user.role == 'admin'
        # Default to True since Admin APIs require no authentication
        return True

class IsAffiliateUser(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request, 'user') and hasattr(request.user, 'role') and request.user.role == 'affiliate'
