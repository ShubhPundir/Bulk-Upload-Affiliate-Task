from rest_framework import serializers
from apps.affiliates.models import Affiliate

class AffiliateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Affiliate
        fields = [
            'id', 
            'first_name', 
            'last_name', 
            'email', 
            'coupon_code', 
            'is_active', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
