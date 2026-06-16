from typing import Any, Dict
from apps.activity_logs.models import ActivityLog

class LogService:
    @staticmethod
    def log_action(action: str, entity_type: str, entity_id: str, user: str, metadata: Dict[str, Any] = None) -> ActivityLog:
        """
        Creates a new activity log entry.
        """
        return ActivityLog.objects.create(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user=user,
            metadata=metadata or {}
        )
