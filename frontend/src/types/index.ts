export interface Affiliate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  coupon_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateGraphic {
  id: string;
  affiliate: number;
  affiliate_details?: Affiliate;
  graphic_type: string;
  original_filename: string;
  stored_filename: string;
  s3_key: string;
  file_size: number;
  file_url: string;
  download_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PreviewResult {
  file_name: string;
  affiliate_id: number | null;
  affiliate_name: string | null;
  coupon_code: string | null;
  graphic_type: string;
  status: 'MATCHED' | 'ERROR';
  errors: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
