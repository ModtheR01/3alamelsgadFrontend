/**
 * Shopping Cart & Cart Item Types
 * Matching Django REST Framework Models & Serializers
 * (CartViewSet, CartItemViewSet, ArwalCartItemViewSet, CartBundleSelectionSerializer)
 */

export interface BackendCartOffer {
  id: number;
  name: string;
  offer_type: string;
  percentage?: string;
  bundle_price?: string;
}

export interface ColorCartOption {
  id: number;
  name_ar: string;
  name_en: string;
  hex_code: string;
}

export interface SizeCartOption {
  id: number;
  width: number;
  length: number;
}

export interface ArwalWidthCartOption {
  id: number;
  width: number;
}

export interface BackendProductCartItem {
  id: number;
  product: {
    id: number;
    name_ar: string;
    name_en: string;
  };
  selected_color: ColorCartOption | null;
  selected_size: SizeCartOption | null;
  quantity: number;
  unit_price: string;
  total_price: string;
  is_available: boolean;
  original_subtotal?: string;
  percentage_discounted_quantity?: number;
  discount_amount?: string;
  subtotal?: string;
  applied_offers?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface BackendArwalCartItem {
  id: number;
  arwal: {
    id: number;
    name_ar: string;
    name_en: string;
  };
  selected_color: ColorCartOption | null;
  selected_width: ArwalWidthCartOption | null;
  selected_length: string; // Decimal representation, e.g. "3.50"
  quantity: number;
  price_per_length: string;
  unit_price: string;
  total_price: string;
  is_available: boolean;
  original_subtotal?: string;
  discount_amount?: string;
  subtotal?: string;
  applied_offers?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface BackendCartBundleProduct {
  product_id: number;
  name_ar: string;
  name_en: string;
  quantity: number;
}

export interface BackendCartBundleArwal {
  arwal_id: number;
  name_ar: string;
  name_en: string;
  quantity: number;
}

export interface BackendCartBundle {
  id: number;
  offer_id: number;
  name_ar: string;
  name_en: string;
  bundle_price: string;
  quantity: number;
  products: BackendCartBundleProduct[];
  arwals: BackendCartBundleArwal[];
}

// Legacy alias for components expecting flat items
export interface BackendCartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: string | number;
  color_id: number | null;
  color_name: string | null;
  color_hex_code: string | null;
  selected_finish?: 'MATTE' | 'GLOSSY' | null;
  quantity: number;
  original_subtotal?: string;
  discount_amount?: string;
  subtotal?: string;
  offer?: BackendCartOffer | null;
}

export interface CartItemCreateRequest {
  product_id: number;
  selected_color_id: number;
  selected_size_id: number;
  quantity: number;
  selected_finish?: 'MATTE' | 'GLOSSY' | null;
}

export interface ArwalCartItemCreateRequest {
  arwal_id: number;
  selected_color_id: number;
  selected_width_id: number;
  selected_length: number | string;
  quantity: number;
}

export interface CartBundleSelectionRequest {
  bundle_offer_id: number;
  quantity?: number;
}

export interface CartItemUpdateRequest {
  quantity: number;
}

export interface BackendCart {
  id: number;
  product_items: BackendProductCartItem[];
  arwal_items: BackendArwalCartItem[];
  bundles: BackendCartBundle[];
  subtotal: string | number;
  discount: string | number;
  total: string | number;
  created_at?: string;
  updated_at?: string;

  // Convenience aliases for backward compatibility with frontend legacy store
  items?: BackendCartItem[];
  arwals?: BackendArwalCartItem[];
  original_total?: string;
  discount_amount?: string;
  total_price?: string;
  free_shipping?: boolean;
}
