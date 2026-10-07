export interface GovernorateShipping {
  id: string;
  nameAr: string;
  nameEn: string;
  shippingCost: number; // in EGP
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  isActive: boolean;
  notes?: string;
}

export interface ShippingUpdatePayload {
  shippingCost?: number;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
  isActive?: boolean;
}
