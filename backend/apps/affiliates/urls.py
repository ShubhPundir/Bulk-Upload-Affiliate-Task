from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.affiliates.views import AffiliateViewSet, AffiliateSearchView

router = DefaultRouter()
router.register(r'manage', AffiliateViewSet, basename='affiliate-manage')

urlpatterns = [
    path('search/', AffiliateSearchView.as_view(), name='affiliate-search'),
    path('', include(router.urls)),
]
