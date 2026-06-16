from rest_framework import serializers
from apps.graphics.models import AffiliateGraphic
from apps.affiliates.serializers import AffiliateSerializer
from apps.graphics.services.s3_service import S3StorageService

class AffiliateGraphicSerializer(serializers.ModelSerializer):
    affiliate_details = AffiliateSerializer(source='affiliate', read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = AffiliateGraphic
        fields = [
            'id',
            'affiliate',
            'affiliate_details',
            'graphic_type',
            'original_filename',
            'stored_filename',
            's3_key',
            'file_size',
            'file_url',
            'download_url',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'stored_filename', 's3_key', 'file_url', 'download_url', 'created_at', 'updated_at']

    def get_download_url(self, obj: AffiliateGraphic) -> str:
        """
        Dynamically generates a presigned download URL for S3 
        or returns the local path fallback.
        """
        try:
            storage_service = S3StorageService()
            url = storage_service.generate_download_url(obj.s3_key)
            return url or obj.file_url
        except Exception:
            return obj.file_url
