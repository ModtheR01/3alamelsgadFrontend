export type OfferType = 'PERCENTAGE' | 'BUNDLE' | 'FREE_SHIPPING';

export interface OfferProduct {
  id: number;
  product_id: number;
  product_name: string;
  product_price: string | number;
  quantity: number;
}

export interface BackendOffer {
  id: number;
  name: string;
  offer_type: OfferType;
  percentage: string | number | null;
  bundle_price: string | number | null;
  products: OfferProduct[];
  original_price: string | number;
  discount_amount: string | number;
  offer_price: string | number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfferProductRequest {
  product_id: number;
  quantity: number;
}

export interface OfferCreateRequest {
  name: string;
  offer_type: OfferType;
  percentage?: number | string | null;
  bundle_price?: number | string | null;
  products: OfferProductRequest[];
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
}

export type OfferUpdateRequest = Partial<OfferCreateRequest>;
