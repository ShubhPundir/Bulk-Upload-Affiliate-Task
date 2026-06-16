import json
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from apps.graphics.models import AffiliateGraphic
from apps.graphics.serializers import AffiliateGraphicSerializer
from apps.graphics.filters import AffiliateGraphicFilter
from apps.graphics.services.graphic_service import GraphicService
from apps.graphics.services.s3_service import S3StorageService
from apps.common.permissions import IsAdminUser, IsAffiliateUser

class AdminGraphicViewSet(viewsets.ModelViewSet):
    """
    Admin operations for managing promotional graphics.
    Allows listing with filters/pagination, previewing bulk uploads, 
    bulk saving, and soft deleting graphics.
    """
    queryset = AffiliateGraphic.objects.all().order_by('-created_at')
    serializer_class = AffiliateGraphicSerializer
    filterset_class = AffiliateGraphicFilter
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Preview Bulk Upload Filenames",
        description="Analyzes uploaded files, performs matching, and returns the status for preview.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'files': {
                        'type': 'array',
                        'items': {'type': 'string', 'format': 'binary'}
                    }
                }
            }
        },
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=False, methods=['post'], url_path='preview-upload')
    def preview_upload(self, request):
        files = list(request.FILES.values())
        if not files:
            return Response({"error": "No files uploaded."}, status=status.HTTP_400_BAD_REQUEST)
            
        results = GraphicService.preview_upload(files)
        return Response(results, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Bulk Save Graphics",
        description="Accepts approved mappings and file objects, uploads them to S3 and creates DB records.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'mappings': {
                        'type': 'string',
                        'description': 'JSON string list of mappings, e.g. [{"file_name": "123_banner.png", "affiliate_id": 1, "graphic_type": "banner"}]'
                    },
                    'files': {
                        'type': 'array',
                        'items': {'type': 'string', 'format': 'binary'}
                    }
                }
            }
        },
        responses={201: AffiliateGraphicSerializer(many=True)}
    )
    @action(detail=False, methods=['post'], url_path='bulk-save')
    def bulk_save(self, request):
        mappings_raw = request.data.get('mappings')
        if not mappings_raw:
            return Response({"error": "Mappings field is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Parse JSON if passed as string (common in multipart-form-data)
        if isinstance(mappings_raw, str):
            try:
                mappings = json.loads(mappings_raw)
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON format in mappings field."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            mappings = mappings_raw
            
        if not isinstance(mappings, list):
            return Response({"error": "Mappings must be a list of objects."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Extract files dictionary keyed by file name, handling multi-value fields correctly
        files_list = []
        for key in request.FILES:
            files_list.extend(request.FILES.getlist(key))
        files_dict = {f.name: f for f in files_list}
        
        try:
            saved_graphics = GraphicService.bulk_save(
                files=files_dict,
                mappings=mappings,
                user_identifier="Admin"
            )
            serializer = self.get_serializer(saved_graphics, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        """
        Soft deletes the graphic and removes the physical object from storage.
        """
        instance = self.get_object()
        try:
            GraphicService.soft_delete_graphic(str(instance.id), user_identifier="Admin")
            return Response({"message": "Graphic soft-deleted and file removed from storage successfully."}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to delete: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AffiliateMyGraphicsView(APIView):
    """
    Returns active promotional graphics for the logged-in affiliate.
    """
    permission_classes = [IsAffiliateUser]
    
    @extend_schema(
        summary="List Active Graphics for Affiliate",
        description="Returns list of active graphics assigned to the currently logged in affiliate.",
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        affiliate = request.user.affiliate
        graphics = AffiliateGraphic.objects.filter(affiliate=affiliate).order_by('-created_at')
        serializer = AffiliateGraphicSerializer(graphics, many=True)
        return Response({"graphics": serializer.data}, status=status.HTTP_200_OK)


class AffiliateDownloadGraphicsView(APIView):
    """
    Returns presigned download URLs for the requested graphic IDs.
    """
    permission_classes = [IsAffiliateUser]
    
    @extend_schema(
        summary="Download Graphics for Affiliate",
        description="Returns a list of presigned download URLs for the specified graphic IDs. Only allows graphics owned by the logged-in affiliate.",
        parameters=[
            OpenApiParameter(name='ids', description='Comma-separated graphic UUIDs, e.g. uuid1,uuid2', required=True, type=str),
        ],
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        affiliate = request.user.affiliate
        ids_str = request.query_params.get('ids', '')
        if not ids_str:
            return Response({"error": "No graphic IDs provided."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Parse IDs list
        ids = [i.strip() for i in ids_str.split(',') if i.strip()]
        
        # Query active graphics matching IDs and belonging to the logged-in affiliate
        graphics = AffiliateGraphic.objects.filter(id__in=ids, affiliate=affiliate)
        
        # Check permissions: if count matches, the user owns all of them
        found_ids = {str(g.id) for g in graphics}
        unauthorized_or_missing = set(ids) - found_ids
        if unauthorized_or_missing:
            return Response(
                {
                    "error": "Access denied or invalid graphic IDs.",
                    "invalid_ids": list(unauthorized_or_missing)
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        storage_service = S3StorageService()
        downloads = []
        
        for g in graphics:
            download_url = storage_service.generate_download_url(g.s3_key)
            downloads.append({
                "id": str(g.id),
                "original_filename": g.original_filename,
                "download_url": download_url
            })
            
        return Response({"downloads": downloads}, status=status.HTTP_200_OK)


class AffiliateLatestGraphicView(APIView):
    """
    Returns the single latest marketing graphic for the affiliate.
    """
    permission_classes = []
    
    @extend_schema(
        summary="Get Latest Graphic for Affiliate",
        description="Returns the single latest active graphic assigned to the affiliate.",
        responses={200: AffiliateGraphicSerializer}
    )
    def get(self, request):
        affiliate = getattr(request.user, 'affiliate', None)
        if not affiliate:
            # Fallback to headers or database if not authenticated
            affiliate_id = request.headers.get('X-Affiliate-ID') or request.META.get('HTTP_X_AFFILIATE_ID') or request.query_params.get('affiliate_id')
            from apps.affiliates.models import Affiliate
            if affiliate_id:
                try:
                    affiliate = Affiliate.objects.get(id=affiliate_id)
                except (Affiliate.DoesNotExist, ValueError):
                    pass
            if not affiliate:
                affiliate = Affiliate.objects.filter(is_active=True).first()
                if not affiliate:
                    affiliate = Affiliate.objects.first()

        if not affiliate:
            return Response({"error": "No affiliate found"}, status=status.HTTP_404_NOT_FOUND)

        graphic = AffiliateGraphic.objects.filter(affiliate=affiliate).order_by('-created_at').first()
        if not graphic:
            return Response({"message": "No graphics found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AffiliateGraphicSerializer(graphic)
        return Response(serializer.data, status=status.HTTP_200_OK)

