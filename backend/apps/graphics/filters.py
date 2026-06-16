import django_filters
from apps.graphics.models import AffiliateGraphic

class AffiliateGraphicFilter(django_filters.FilterSet):
    # Filter by affiliate ID
    affiliate = django_filters.NumberFilter(field_name='affiliate_id')
    # Filter by affiliate coupon code (case-insensitive)
    coupon_code = django_filters.CharFilter(field_name='affiliate__coupon_code', lookup_expr='iexact')
    # Filter by graphic type (case-insensitive)
    graphic_type = django_filters.CharFilter(lookup_expr='iexact')

    class Meta:
        model = AffiliateGraphic
        fields = ['affiliate', 'coupon_code', 'graphic_type']
