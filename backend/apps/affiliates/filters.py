import django_filters
from apps.affiliates.models import Affiliate

class AffiliateFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="first_name", lookup_expr='icontains')
    email = django_filters.CharFilter(lookup_expr='icontains')
    coupon = django_filters.CharFilter(field_name="coupon_code", lookup_expr='iexact')

    class Meta:
        model = Affiliate
        fields = ['is_active']
