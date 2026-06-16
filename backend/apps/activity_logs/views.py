from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from apps.activity_logs.models import ActivityLog
from apps.activity_logs.serializers import ActivityLogSerializer
from apps.common.permissions import IsAdminUser

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for Activity Logs, only accessible by Admin.
    Supports filtering, search, and dynamic metadata options.
    """
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = ActivityLog.objects.all().order_by('-created_at')
        
        # Searching
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(action__icontains=search) |
                Q(entity_type__icontains=search) |
                Q(entity_id__icontains=search) |
                Q(user__icontains=search)
            )
            
        # Action filter
        action_param = self.request.query_params.get('action')
        if action_param:
            queryset = queryset.filter(action=action_param)
            
        # Entity type filter
        entity_type_param = self.request.query_params.get('entity_type')
        if entity_type_param:
            queryset = queryset.filter(entity_type=entity_type_param)
            
        # User filter
        user_param = self.request.query_params.get('user')
        if user_param:
            queryset = queryset.filter(user__icontains=user_param)
            
        return queryset

    @action(detail=False, methods=['get'], url_path='options')
    def get_options(self, request):
        """
        Returns unique actions, entity types, and users to populate dropdown filters on frontend.
        """
        actions = ActivityLog.objects.values_list('action', flat=True).distinct()
        entity_types = ActivityLog.objects.values_list('entity_type', flat=True).distinct()
        users = ActivityLog.objects.values_list('user', flat=True).distinct()
        return Response({
            'actions': sorted(list(set(filter(None, actions)))),
            'entity_types': sorted(list(set(filter(None, entity_types)))),
            'users': sorted(list(set(filter(None, users)))),
        })

