import os
import boto3
import logging
from django.conf import settings
from django.core.files.storage import default_storage
from botocore.exceptions import ClientError
from botocore.client import Config
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class S3StorageService:
    def __init__(self):
        self.bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        self.access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
        self.secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
        self.region = getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
        
        # Determine whether to use S3 or fall back to local storage
        self.use_s3 = bool(self.bucket_name and self.access_key and self.secret_key)
        
        if self.use_s3:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    region_name=self.region,
                    config=Config(signature_version='s3v4')
                )
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {e}. Falling back to local storage.")
                self.use_s3 = False

    def upload_file(self, file_obj: Any, affiliate_id: Any, filename: str) -> Dict[str, str]:
        """
        Uploads a file to S3 or local storage in the structure affiliate-graphics/{affiliate_id}/filename.
        Returns the key and URL of the uploaded file.
        """
        s3_key = f"affiliate-graphics/{affiliate_id}/{filename}"
        
        if self.use_s3:
            try:
                # Seek to start of file to avoid empty uploads
                if hasattr(file_obj, 'seek'):
                    file_obj.seek(0)
                
                self.s3_client.upload_fileobj(
                    file_obj,
                    self.bucket_name,
                    s3_key
                )
                
                file_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"
                return {
                    's3_key': s3_key,
                    'file_url': file_url
                }
            except ClientError as e:
                logger.error(f"Failed S3 upload: {e}")
                raise e
        else:
            # Local filesystem fallback
            # Reset pointer
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
                
            relative_path = os.path.join('affiliate-graphics', str(affiliate_id), filename)
            # Ensure parent directories exist
            full_dir = os.path.join(settings.MEDIA_ROOT, 'affiliate-graphics', str(affiliate_id))
            os.makedirs(full_dir, exist_ok=True)
            
            # Save using django default storage (which auto-renames if conflicts exist)
            # But we want to use the exact stored_filename we calculated, so if it already exists, let's remove it first
            if default_storage.exists(relative_path):
                default_storage.delete(relative_path)
                
            saved_path = default_storage.save(relative_path, file_obj)
            file_url = f"{settings.MEDIA_URL.rstrip('/')}/{saved_path.replace(os.sep, '/')}"
            return {
                's3_key': saved_path,
                'file_url': file_url
            }

    def delete_file(self, s3_key: str) -> bool:
        """
        Deletes a file from S3 or local storage.
        """
        if self.use_s3:
            try:
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=s3_key
                )
                return True
            except ClientError as e:
                logger.error(f"Failed S3 delete for key {s3_key}: {e}")
                return False
        else:
            if default_storage.exists(s3_key):
                default_storage.delete(s3_key)
                return True
            return False

    def generate_download_url(self, s3_key: str, expires_in: int = 3600) -> Optional[str]:
        """
        Generates a presigned download URL for S3 or a local media URL path for fallback storage.
        """
        if self.use_s3:
            try:
                url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': self.bucket_name,
                        'Key': s3_key
                    },
                    ExpiresIn=expires_in
                )
                return url
            except ClientError as e:
                logger.error(f"Failed generating S3 presigned URL: {e}")
                return None
        else:
            # Local storage URL fallback
            if default_storage.exists(s3_key):
                return f"{settings.MEDIA_URL.rstrip('/')}/{s3_key.replace(os.sep, '/')}"
            return None
