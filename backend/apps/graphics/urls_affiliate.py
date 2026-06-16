from django.urls import path
from apps.graphics.views import AffiliateMyGraphicsView, AffiliateDownloadGraphicsView, AffiliateLatestGraphicView

urlpatterns = [
    path('my-graphics/', AffiliateMyGraphicsView.as_view(), name='affiliate-my-graphics'),
    path('my-graphics/latest/', AffiliateLatestGraphicView.as_view(), name='affiliate-my-graphics-latest'),
    path('my-graphics/download/', AffiliateDownloadGraphicsView.as_view(), name='affiliate-my-graphics-download'),
]
