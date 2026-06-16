from django.db.models import Q, QuerySet
from apps.affiliates.models import Affiliate

class AffiliateService:
    @staticmethod
    def search_affiliates(query_str: str = None, email: str = None, coupon: str = None, name: str = None) -> QuerySet:
        """
        Searches affiliates based on a general query string or specific fields (email, coupon, name).
        """
        queryset = Affiliate.objects.all()
        
        if query_str:
            queryset = queryset.filter(
                Q(first_name__icontains=query_str) |
                Q(last_name__icontains=query_str) |
                Q(email__icontains=query_str) |
                Q(coupon_code__icontains=query_str)
            )
            return queryset
            
        if email:
            queryset = queryset.filter(email__icontains=email)
        if coupon:
            queryset = queryset.filter(coupon_code__icontains=coupon)
        if name:
            queryset = queryset.filter(
                Q(first_name__icontains=name) | Q(last_name__icontains=name)
            )
            
        return queryset
