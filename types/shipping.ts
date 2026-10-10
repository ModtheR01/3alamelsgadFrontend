export interface GovernorateShipping {
  id: string | number;
  nameAr: string;
  nameEn: string;
  name_ar?: string;
  name_en?: string;
  shippingCost: number; // in EGP
  shipping_price?: string | number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  isActive: boolean;
  is_active?: boolean;
  notes?: string;
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
