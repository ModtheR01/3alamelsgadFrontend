export type OfferType = 'PERCENTAGE' | 'BUNDLE' | 'FREE_SHIPPING';

export interface OfferProduct {
  id?: number;
  product_id: number;
  size_id?: number | null;
  size_name?: string;
  product_name?: string;
  product_price?: string | number;
  quantity?: number;
}

export interface BackendOfferProductTarget {
  product_id: number;
  size_id?: number | null;
  size_name?: string;
  quantity?: number;
  size?: { id: number; width: string; length: string };
}

export interface BackendOfferArwalTarget {
  arwal_id: number;
  quantity?: number;
}

export interface BackendOffer {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  offer_type: OfferType;
  percentage: string | number | null;
  bundle_price: string | number | null;
  products: OfferProduct[];
  offer_products?: BackendOfferProductTarget[];
  offer_arwals?: BackendOfferArwalTarget[];
  original_price?: string | number;
  discount_amount?: string | number;
  offer_price?: string | number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OfferProductRequest {
  product_id: number;
  size_id?: number | null;
  quantity?: number;
}

export interface OfferCreateRequest {
  name?: string;
  name_ar?: string;
  name_en?: string;
  offer_type: OfferType;
  percentage?: number | string | null;
  bundle_price?: number | string | null;
  products?: OfferProductRequest[];
  offer_products?: OfferProductRequest[];
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
}

export type OfferUpdateRequest = Partial<OfferCreateRequest>;
