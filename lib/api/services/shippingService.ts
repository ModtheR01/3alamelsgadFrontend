import { apiClient } from '../client';
import { GovernorateShipping, ShippingUpdatePayload } from '@/types/shipping';
import { BRAND_CONFIG } from '@/lib/brandConfig';

const LOCAL_STORAGE_KEY = 'alamelsgad_shipping_governorates';

function getInitialGovernorates(): GovernorateShipping[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
  }

  return BRAND_CONFIG.governorates.map((gov) => ({
    id: gov.id,
    nameAr: gov.nameAr,
    nameEn: gov.nameEn,
    shippingCost: gov.shippingCost,
    deliveryDaysMin: gov.id === 'dakahlia' ? 1 : 2,
    deliveryDaysMax: gov.id === 'dakahlia' ? 3 : 5,
    isActive: true,
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
   * Connects to GET /api/shipping/governorates/ when available in Django,
   * otherwise uses clean stored configuration.
   */
  async getGovernorates(): Promise<GovernorateShipping[]> {
    try {
      const remote = await apiClient.get<GovernorateShipping[]>('/shipping/governorates/');
      if (Array.isArray(remote) && remote.length > 0) {
        persistLocally(remote);
        return remote;
      }
    } catch {
      // Backend endpoint not yet mounted in Django REST API; fallback to stored configuration
    }

    return getInitialGovernorates();
  },

  /**
   * Update shipping rate or delivery estimates for a specific governorate.
   * Connects to PATCH /api/shipping/governorates/<id>/
   */
  async updateGovernorate(id: string, payload: ShippingUpdatePayload): Promise<GovernorateShipping> {
    try {
      const updated = await apiClient.patch<GovernorateShipping>(`/shipping/governorates/${id}/`, payload);
      const current = getInitialGovernorates();
      const next = current.map((item) => (item.id === id ? { ...item, ...updated } : item));
      persistLocally(next);
      return updated;
    } catch {
      // Offline/demo fallback
      const current = getInitialGovernorates();
      const target = current.find((item) => item.id === id);
      if (!target) throw new Error('Governorate not found');

      const updated: GovernorateShipping = {
        ...target,
        ...payload,
      };

      const next = current.map((item) => (item.id === id ? updated : item));
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
      shippingCost: gov.shippingCost,
      deliveryDaysMin: gov.id === 'dakahlia' ? 1 : 2,
      deliveryDaysMax: gov.id === 'dakahlia' ? 3 : 5,
      isActive: true,
    }));
    persistLocally(defaults);
    return defaults;
  },
};
