export interface BackendGovernorate {
  id: number;
  name_ar: string;
  name_en: string;
  shipping_price: string | number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GovernorateCreateRequest {
  name_ar: string;
  name_en: string;
  shipping_price: number | string;
  is_active?: boolean;
}

export interface GovernorateUpdateRequest {
  name_ar?: string;
  name_en?: string;
  shipping_price?: number | string;
  is_active?: boolean;
}

export interface GovernorateShipping {
  id: string | number;
  nameAr: string;
  nameEn: string;
  name_ar?: string;
  name_en?: string;
  shippingCost: number; // in EGP
  shipping_price?: string | number;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
  isActive: boolean;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingUpdatePayload {
  shippingCost?: number;
  shipping_price?: string | number;
  name_ar?: string;
  name_en?: string;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
  isActive?: boolean;
  is_active?: boolean;
}
