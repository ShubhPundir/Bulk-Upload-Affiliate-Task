import os
import json
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from typing import List, Dict, Any, Tuple
from apps.graphics.models import AffiliateGraphic
from apps.graphics.services.s3_service import S3StorageService
from apps.common.services.matching_service import MatchingService
from apps.activity_logs.services.log_service import LogService
from apps.affiliates.models import Affiliate

class GraphicService:
    @staticmethod
    def preview_upload(files: List[Any]) -> List[Dict[str, Any]]:
        """
        Preview upload: analyzes filenames, matches affiliates, returns preview status.
        No database records are created or S3 files uploaded.
        """
        results = []
        for file in files:
            filename = file.name
            
            # Perform filename matching logic
            match_info = MatchingService.match_affiliate(filename)
            
            # Validate file size (5MB limit)
            # 5MB = 5 * 1024 * 1024 bytes = 5,242,880 bytes
            max_size = 5 * 1024 * 1024
            if file.size > max_size:
                match_info['status'] = 'ERROR'
                match_info['errors'].append(f"File size exceeds maximum limit of 5MB (actual: {file.size / (1024*1024):.2f}MB).")
                
            # Validate file type
            ext = os.path.splitext(filename)[1].lower().strip('.')
            allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
            if ext not in allowed_extensions:
                match_info['status'] = 'ERROR'
                match_info['errors'].append(f"Unsupported file format '{ext}'. Supported formats: jpg, jpeg, png, webp.")
                
            results.append(match_info)
            
        return results

    @staticmethod
    @transaction.atomic
    def bulk_save(files: Dict[str, Any], mappings: List[Dict[str, Any]], user_identifier: str = "Admin") -> List[AffiliateGraphic]:
        """
        Uploads files to S3/local storage and saves database records.
        files: Dictionary of filename -> UploadedFile object.
        mappings: Approved file mapping details.
        """
        storage_service = S3StorageService()
        saved_graphics = []
        
        for mapping in mappings:
            filename = mapping.get('file_name')
            affiliate_id = mapping.get('affiliate_id')
            graphic_type = mapping.get('graphic_type', 'graphic')
            
            # Lookup file in uploaded files dict
            file_obj = files.get(filename)
            if not file_obj:
                # If name mismatch, check if key is in files (sometimes files are keyed by field names)
                # We can iterate to match by file name
                for f_key, f_val in files.items():
                    if f_val.name == filename:
                        file_obj = f_val
                        break
                        
            if not file_obj:
                raise ValueError(f"File '{filename}' was not uploaded or missing in payload.")
                
            # Validate affiliate existence
            try:
                affiliate = Affiliate.objects.get(id=affiliate_id)
            except (Affiliate.DoesNotExist, ValueError):
                raise ValueError(f"Affiliate with ID {affiliate_id} not found.")
                
            # Prefix stored filename: {affiliate_id}_{original_filename}
            stored_filename = f"{affiliate_id}_{filename}"
            
            # Upload to S3 (or fallback)
            upload_res = storage_service.upload_file(file_obj, affiliate_id, stored_filename)
            s3_key = upload_res['s3_key']
            file_url = upload_res['file_url']
            
            # Create graphic record
            graphic = AffiliateGraphic.objects.create(
                affiliate=affiliate,
                graphic_type=graphic_type,
                original_filename=filename,
                stored_filename=stored_filename,
                s3_key=s3_key,
                file_size=file_obj.size,
                file_url=file_url
            )
            
            # Log individual graphic upload
            LogService.log_action(
                action="graphic_upload",
                entity_type="AffiliateGraphic",
                entity_id=str(graphic.id),
                user=user_identifier,
                metadata={
                    "affiliate_id": affiliate.id,
                    "coupon_code": affiliate.coupon_code,
                    "original_filename": filename,
                    "stored_filename": stored_filename,
                    "file_size": file_obj.size,
                    "s3_key": s3_key
                }
            )
            saved_graphics.append(graphic)
            
        # Log bulk completion
        LogService.log_action(
            action="bulk_upload_completion",
            entity_type="BulkUpload",
            entity_id=None,
            user=user_identifier,
            metadata={
                "count": len(saved_graphics),
                "graphics": [
                    {
                        "id": str(g.id),
                        "original_filename": g.original_filename,
                        "stored_filename": g.stored_filename
                    } for g in saved_graphics
                ]
            }
        )
        
        return saved_graphics

    @staticmethod
    @transaction.atomic
    def soft_delete_graphic(graphic_id: str, user_identifier: str = "Admin") -> bool:
        """
        Soft deletes the graphic record from DB, deletes physical file from S3, and records audit log.
        """
        try:
            # retrieve from Active graphics
            graphic = AffiliateGraphic.objects.get(id=graphic_id)
        except AffiliateGraphic.DoesNotExist:
            raise ValueError(f"Graphic with ID {graphic_id} does not exist or is already deleted.")
            
        storage_service = S3StorageService()
        
        # Delete from S3 storage
        storage_service.delete_file(graphic.s3_key)
        
        # Soft delete in database
        graphic.is_deleted = True
        graphic.deleted_at = timezone.now()
        graphic.save()
        
        # Log graphic deletion
        LogService.log_action(
            action="graphic_delete",
            entity_type="AffiliateGraphic",
            entity_id=str(graphic.id),
            user=user_identifier,
            metadata={
                "affiliate_id": graphic.affiliate.id,
                "coupon_code": graphic.affiliate.coupon_code,
                "original_filename": graphic.original_filename,
                "stored_filename": graphic.stored_filename,
                "s3_key": graphic.s3_key
            }
        )
        
        return True
