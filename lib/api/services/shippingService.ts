import { apiClient } from '../client';
import { PaginatedResponse, unwrapResults } from '../pagination';
import {
  BackendGovernorate,
  GovernorateCreateRequest,
  GovernorateShipping,
  GovernorateUpdateRequest,
  ShippingUpdatePayload,
} from '@/types/shipping';

/**
 * Normalizes backend Governorate model into the frontend GovernorateShipping shape.
 */
export function normalizeGovernorate(raw: any): GovernorateShipping {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const nameAr = (raw.name_ar || raw.nameAr || '').trim();
  const nameEn = (raw.name_en || raw.nameEn || '').trim();
  const priceNum =
    raw.shipping_price !== undefined && raw.shipping_price !== null
      ? Number(raw.shipping_price)
      : raw.shippingCost !== undefined
      ? Number(raw.shippingCost)
      : 0;

  const isActive =
    raw.is_active !== undefined
      ? Boolean(raw.is_active)
      : raw.isActive !== undefined
      ? Boolean(raw.isActive)
      : true;

  return {
    id: raw.id,
    nameAr,
    nameEn,
    name_ar: nameAr,
    name_en: nameEn,
    shippingCost: priceNum,
    shipping_price: raw.shipping_price !== undefined ? raw.shipping_price : String(priceNum),
    isActive,
    is_active: isActive,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    notes: raw.notes,
  };
}

export const shippingService = {
  /**
   * Get all real governorates from the backend database.
   * Connects to GET /api/user/governorates/ (DRF DefaultPagination envelope).
   */
  async getGovernorates(): Promise<GovernorateShipping[]> {
    const response = await apiClient.get<PaginatedResponse<BackendGovernorate> | BackendGovernorate[]>(
      '/user/governorates/',
      { params: { page_size: 100 } }
    );
    const results = unwrapResults<BackendGovernorate>(response);
    return results.map(normalizeGovernorate);
  },

  /**
   * Get a single governorate by ID.
   * GET /api/user/governorates/<id>/
   */
  async getGovernorate(id: string | number): Promise<GovernorateShipping> {
    const response = await apiClient.get<BackendGovernorate>(`/user/governorates/${id}/`);
    return normalizeGovernorate(response);
  },

  /**
   * Create a new governorate in the backend database.
   * Connects to POST /api/user/governorates/ (Admin only).
   */
  async createGovernorate(data: GovernorateCreateRequest): Promise<GovernorateShipping> {
    const payload = {
      name_ar: data.name_ar.trim(),
      name_en: data.name_en.trim(),
      shipping_price: String(data.shipping_price),
      is_active: data.is_active ?? true,
    };

    const response = await apiClient.post<BackendGovernorate>('/user/governorates/', payload);
    return normalizeGovernorate(response);
  },

  /**
   * Update shipping rate or details for a specific governorate.
   * Connects to PATCH /api/user/governorates/<id>/ (Admin only).
   */
  async updateGovernorate(
    id: string | number,
    payload: GovernorateUpdateRequest | ShippingUpdatePayload
  ): Promise<GovernorateShipping> {
    const backendPayload: Record<string, any> = {};

    if (payload.name_ar !== undefined) {
      backendPayload.name_ar = payload.name_ar.trim();
    }
    if (payload.name_en !== undefined) {
      backendPayload.name_en = payload.name_en.trim();
    }
    if (payload.shipping_price !== undefined) {
      backendPayload.shipping_price = String(payload.shipping_price);
    } else if ((payload as ShippingUpdatePayload).shippingCost !== undefined) {
      backendPayload.shipping_price = String((payload as ShippingUpdatePayload).shippingCost);
    }
    if (payload.is_active !== undefined) {
      backendPayload.is_active = Boolean(payload.is_active);
    } else if ((payload as ShippingUpdatePayload).isActive !== undefined) {
      backendPayload.is_active = Boolean((payload as ShippingUpdatePayload).isActive);
    }

    const updated = await apiClient.patch<BackendGovernorate>(
      `/user/governorates/${id}/`,
      backendPayload
    );
    return normalizeGovernorate(updated);
  },

  /**
   * Delete an unreferenced governorate from the backend database.
   * DELETE /api/user/governorates/<id>/ (Admin only).
   */
  async deleteGovernorate(id: string | number): Promise<void> {
    await apiClient.delete<void>(`/user/governorates/${id}/`);
  },
};
