from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.graphics.views import AdminGraphicViewSet

router = DefaultRouter()
router.register(r'', AdminGraphicViewSet, basename='admin-graphic')

urlpatterns = [
    path('', include(router.urls)),
]
