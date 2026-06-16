import uuid
from django.db import models

class ActivityLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=100)  # e.g., graphic_upload, graphic_delete, bulk_upload_completion
    entity_type = models.CharField(max_length=100)  # e.g., AffiliateGraphic, BulkUpload
    entity_id = models.CharField(max_length=255, null=True, blank=True)
    user = models.CharField(max_length=255)  # e.g., "Admin", "Affiliate: 12"
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} on {self.entity_type} ({self.created_at})"
