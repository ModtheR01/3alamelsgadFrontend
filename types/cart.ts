/**
 * Shopping Cart & Cart Item Types
 * Matching Django REST Framework Models & Serializers
 */

export interface BackendCartColor {
  id: number;
  name: string;
  hex_code: string;
}

export interface BackendCartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: string | number;
  product_image: string | null;
  color_id?: number | null;
  selected_color: BackendCartColor | null;
  quantity: number;
  subtotal: string | number;
  created_at: string;
  updated_at: string;
}

export interface CartItemCreateRequest {
  product_id: number;
  color_id?: number | null;
  quantity: number;
}

export interface CartItemUpdateRequest {
  quantity: number;
}

export interface BackendCart {
  id: number;
  items: BackendCartItem[];
  total_items: number;
  total_price: string | number;
  created_at: string;
  updated_at: string;
}
