/**
 * Shopping Cart & Cart Item Types
 * Matching Django REST Framework Models & Serializers
 */

export interface BackendCartOffer {
  id: number;
  name: string;
  offer_type: string;
  percentage?: string;
  bundle_price?: string;
}

export interface BackendCartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: string | number;
  color_id: number | null;
  color_name: string | null;
  color_hex_code: string | null;
  selected_finish: 'MATTE' | 'GLOSSY' | null;
  quantity: number;
  // Only present on responses from POST/PATCH /cart/items/ and GET /cart/
  original_subtotal?: string;
  discount_amount?: string;
  subtotal?: string;
  offer?: BackendCartOffer | null;
}

export interface CartItemCreateRequest {
  product_id: number;
  selected_color_id?: number | null;
  selected_finish?: 'MATTE' | 'GLOSSY' | null;
  quantity: number;
}

export interface CartItemUpdateRequest {
  quantity: number;
}

export interface BackendCart {
  id: number;
  items: BackendCartItem[];
  original_total: string;
  discount_amount: string;
  total_price: string;
  free_shipping: boolean;
  created_at: string;
  updated_at: string;
}
