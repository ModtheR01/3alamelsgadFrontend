import { apiClient } from '../client';
import { PaginatedResponse, unwrapResults } from '../pagination';
import { GovernorateShipping, ShippingUpdatePayload } from '@/types/shipping';
import { BRAND_CONFIG } from '@/lib/brandConfig';

const LOCAL_STORAGE_KEY = 'alamelsgad_shipping_governorates';

function normalizeGovernorate(raw: any): GovernorateShipping {
  const priceNum =
    raw.shipping_price !== undefined && raw.shipping_price !== null
      ? Number(raw.shipping_price)
      : raw.shippingCost ?? 0;
  const isActive =
    raw.is_active !== undefined ? Boolean(raw.is_active) : raw.isActive ?? true;
  const nameAr = raw.name_ar || raw.nameAr || '';
  const nameEn = raw.name_en || raw.nameEn || '';

  return {
    id: raw.id,
    nameAr,
    nameEn,
    name_ar: nameAr,
    name_en: nameEn,
    shippingCost: priceNum,
    shipping_price: raw.shipping_price ?? priceNum,
    deliveryDaysMin:
      raw.deliveryDaysMin ?? (nameEn.toLowerCase().includes('dakahlia') ? 1 : 2),
    deliveryDaysMax:
      raw.deliveryDaysMax ?? (nameEn.toLowerCase().includes('dakahlia') ? 3 : 5),
    isActive,
    is_active: isActive,
    notes: raw.notes,
  };
}

function getInitialGovernorates(): GovernorateShipping[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeGovernorate);
        }
      }
    } catch {
      // Fallback
    }
  }

  return BRAND_CONFIG.governorates.map((gov) => ({
    id: gov.id,
    nameAr: gov.nameAr,
    nameEn: gov.nameEn,
    name_ar: gov.nameAr,
    name_en: gov.nameEn,
    shippingCost: gov.shippingCost,
    shipping_price: gov.shippingCost,
    deliveryDaysMin: gov.id === 'dakahlia' ? 1 : 2,
    deliveryDaysMax: gov.id === 'dakahlia' ? 3 : 5,
    isActive: true,
    is_active: true,
  }));
}

function persistLocally(items: GovernorateShipping[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }
}

export const shippingService = {
  /**
   * Get all governorates shipping configurations.
   * Connects to GET /api/user/governorates/ in Django REST Framework.
   */
  async getGovernorates(): Promise<GovernorateShipping[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<any> | any[]>(
        '/user/governorates/',
        { params: { page_size: 100 } }
      );
      const results = unwrapResults<any>(response);
      if (Array.isArray(results) && results.length > 0) {
        const normalized = results.map(normalizeGovernorate);
        persistLocally(normalized);
        return normalized;
      }
    } catch {
      // Fallback to cached or local brand config if offline
    }

    return getInitialGovernorates();
  },

  /**
   * Update shipping rate or delivery estimates for a specific governorate.
   * Connects to PATCH /api/user/governorates/<id>/ (Admin only)
   */
  async updateGovernorate(
    id: string | number,
    payload: ShippingUpdatePayload
  ): Promise<GovernorateShipping> {
    const backendPayload: Record<string, any> = {};
    if (payload.shippingCost !== undefined) {
      backendPayload.shipping_price = String(payload.shippingCost);
    } else if (payload.shipping_price !== undefined) {
      backendPayload.shipping_price = String(payload.shipping_price);
    }
    if (payload.isActive !== undefined) {
      backendPayload.is_active = payload.isActive;
    } else if (payload.is_active !== undefined) {
      backendPayload.is_active = payload.is_active;
    }
    if (payload.name_ar) backendPayload.name_ar = payload.name_ar;
    if (payload.name_en) backendPayload.name_en = payload.name_en;

    try {
      const updated = await apiClient.patch<any>(
        `/user/governorates/${id}/`,
        backendPayload
      );
      const normalized = normalizeGovernorate({ ...payload, ...updated });
      const current = getInitialGovernorates();
      const next = current.map((item) =>
        String(item.id) === String(id) ? { ...item, ...normalized } : item
      );
      persistLocally(next);
      return normalized;
    } catch {
      // Offline/demo fallback
      const current = getInitialGovernorates();
      const target = current.find((item) => String(item.id) === String(id));
      if (!target) throw new Error('Governorate not found');

      const updated: GovernorateShipping = normalizeGovernorate({
        ...target,
        ...payload,
      });

      const next = current.map((item) =>
        String(item.id) === String(id) ? updated : item
      );
      persistLocally(next);
      return updated;
    }
  },

  /**
   * Reset all governorates to standard factory defaults
   */
  resetToDefaults(): GovernorateShipping[] {
    const defaults = BRAND_CONFIG.governorates.map((gov) => ({
      id: gov.id,
      nameAr: gov.nameAr,
      nameEn: gov.nameEn,
      name_ar: gov.nameAr,
      name_en: gov.nameEn,
      shippingCost: gov.shippingCost,
      shipping_price: gov.shippingCost,
      deliveryDaysMin: gov.id === 'dakahlia' ? 1 : 2,
      deliveryDaysMax: gov.id === 'dakahlia' ? 3 : 5,
      isActive: true,
      is_active: true,
    }));
    persistLocally(defaults);
    return defaults;
  },
};
