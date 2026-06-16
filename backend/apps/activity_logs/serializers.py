from rest_framework import serializers
from apps.activity_logs.models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'action',
            'entity_type',
            'entity_id',
            'user',
            'metadata',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
