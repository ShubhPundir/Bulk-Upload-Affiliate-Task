import os
import re
from typing import Dict, Any, List

class MatchingService:
    @staticmethod
    def parse_filename(filename: str) -> Dict[str, Any]:
        """
        Parses a filename to extract lookup type and lookup value.
        Rules:
        - Remove file extension.
        - Ignore case-insensitive suffixes: _banner, _graphic, _logo.
        - If the remaining part starts with a numeric value, lookup by ID.
        - Otherwise, lookup by coupon code.
        """
        # Split extension
        name, _ = os.path.splitext(filename)
        
        # Remove suffix case-insensitively
        name_clean = re.sub(r'_(banner|graphic|logo)$', '', name, flags=re.IGNORECASE)
        
        # Check if the name starts with digits
        match_num = re.match(r'^(\d+)', name_clean)
        
        if match_num:
            affiliate_id = int(match_num.group(1))
            return {
                'lookup_type': 'id',
                'lookup_value': affiliate_id,
                'clean_name': name_clean,
            }
        else:
            return {
                'lookup_type': 'coupon_code',
                'lookup_value': name_clean,
                'clean_name': name_clean,
            }

    @staticmethod
    def match_affiliate(filename: str) -> Dict[str, Any]:
        """
        Matches a filename to an Affiliate record.
        """
        from apps.affiliates.models import Affiliate
        
        parsed = MatchingService.parse_filename(filename)
        lookup_type = parsed['lookup_type']
        lookup_value = parsed['lookup_value']
        
        affiliate = None
        status = 'MATCHED'
        errors: List[str] = []
        
        if lookup_type == 'id':
            try:
                # Use lookup_value (which is an int)
                affiliate = Affiliate.objects.get(id=lookup_value)
                if not affiliate.is_active:
                    status = 'ERROR'
                    errors.append(f"Affiliate with ID '{lookup_value}' is inactive.")
            except Affiliate.DoesNotExist:
                status = 'ERROR'
                errors.append(f"Affiliate with ID '{lookup_value}' not found.")
            except ValueError:
                status = 'ERROR'
                errors.append(f"Invalid Affiliate ID '{lookup_value}'.")
        else:
            # Coupon code lookup (case-insensitive)
            try:
                affiliate = Affiliate.objects.get(coupon_code__iexact=str(lookup_value))
                if not affiliate.is_active:
                    status = 'ERROR'
                    errors.append(f"Affiliate with coupon code '{lookup_value}' is inactive.")
            except Affiliate.DoesNotExist:
                status = 'ERROR'
                errors.append(f"Affiliate with coupon code '{lookup_value}' not found.")
                
        # Determine graphic_type from suffix
        name, _ = os.path.splitext(filename)
        graphic_type = 'graphic'  # Default type
        if re.search(r'_banner$', name, flags=re.IGNORECASE):
            graphic_type = 'banner'
        elif re.search(r'_logo$', name, flags=re.IGNORECASE):
            graphic_type = 'logo'
        elif re.search(r'_graphic$', name, flags=re.IGNORECASE):
            graphic_type = 'graphic'
            
        return {
            'file_name': filename,
            'affiliate_id': affiliate.id if affiliate else None,
            'affiliate_name': f"{affiliate.first_name} {affiliate.last_name}" if affiliate else None,
            'coupon_code': affiliate.coupon_code if affiliate else None,
            'graphic_type': graphic_type,
            'status': status,
            'errors': errors
        }
