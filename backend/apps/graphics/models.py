import uuid
from django.db import models
from django.utils import timezone
from apps.affiliates.models import Affiliate

class ActiveGraphicQuerySet(models.QuerySet):
    def delete(self):
        """Bulk soft-delete."""
        return self.update(is_deleted=True, deleted_at=timezone.now())

class ActiveGraphicManager(models.Manager):
    def get_queryset(self):
        return ActiveGraphicQuerySet(self.model, using=self._db).filter(is_deleted=False)

class AffiliateGraphic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE, related_name='graphics')
    graphic_type = models.CharField(max_length=50)  # banner, logo, graphic
    original_filename = models.CharField(max_length=255)
    stored_filename = models.CharField(max_length=255)
    s3_key = models.CharField(max_length=512)
    file_size = models.BigIntegerField()  # in bytes
    file_url = models.URLField(max_length=1024)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Managers
    objects = ActiveGraphicManager()
    all_objects = models.Manager()  # Fallback for admin or auditing if ever required

    def delete(self, using=None, keep_parents=False):
        """Soft-delete an instance."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(using=using)

    def hard_delete(self, using=None, keep_parents=False):
        """Hard-delete an instance from the database."""
        super().delete(using=using, keep_parents=keep_parents)

    def __str__(self):
        return f"{self.original_filename} ({self.graphic_type}) -> Affiliate: {self.affiliate_id}"
