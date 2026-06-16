from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from apps.affiliates.models import Affiliate
from apps.affiliates.serializers import AffiliateSerializer
from apps.affiliates.services.affiliate_service import AffiliateService
from apps.common.permissions import IsAdminUser

class AffiliateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing, creating, retrieving, updating and deleting Affiliates.
    Only accessible by Admin.
    """
    queryset = Affiliate.objects.all().order_by('-created_at')
    serializer_class = AffiliateSerializer
    permission_classes = [IsAdminUser]

class AffiliateSearchView(APIView):
    """
    API view for searching affiliates by email, coupon, or name.
    Only accessible by Admin.
    """
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Search Affiliates",
        description="Search active and inactive affiliates by name, email, or coupon code.",
        parameters=[
            OpenApiParameter(name='q', description='General search query (matches name, email, coupon)', required=False, type=str),
            OpenApiParameter(name='name', description='Search by name', required=False, type=str),
            OpenApiParameter(name='email', description='Search by email', required=False, type=str),
            OpenApiParameter(name='coupon', description='Search by coupon code', required=False, type=str),
        ],
        responses={200: AffiliateSerializer(many=True)}
    )
    def get(self, request):
        query = request.query_params.get('q')
        name = request.query_params.get('name')
        email = request.query_params.get('email')
        coupon = request.query_params.get('coupon')
        
        affiliates = AffiliateService.search_affiliates(
            query_str=query,
            email=email,
            coupon=coupon,
            name=name
        )
        
        serializer = AffiliateSerializer(affiliates, many=True)
        return Response(serializer.data, status=status.HTTP_OK)
