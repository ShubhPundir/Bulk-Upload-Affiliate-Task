from rest_framework import viewsets
from apps.activity_logs.models import ActivityLog
from apps.activity_logs.serializers import ActivityLogSerializer
from apps.common.permissions import IsAdminUser

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for Activity Logs, only accessible by Admin.
    """
    queryset = ActivityLog.objects.all().order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminUser]
