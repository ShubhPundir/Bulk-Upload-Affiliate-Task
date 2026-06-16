from django.urls import path
from apps.graphics.views import AffiliateMyGraphicsView, AffiliateDownloadGraphicsView

urlpatterns = [
    path('my-graphics/', AffiliateMyGraphicsView.as_view(), name='affiliate-my-graphics'),
    path('my-graphics/download/', AffiliateDownloadGraphicsView.as_view(), name='affiliate-my-graphics-download'),
]
