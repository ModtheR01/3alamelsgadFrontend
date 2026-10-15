import { apiClient } from '../client';
import { PaginatedResponse, unwrapResults } from '../pagination';
import {
  BackendColor,
  ColorCreateRequest,
  ColorUpdateRequest,
} from '@/types/product';

export const colorService = {
  /**
   * Get all colors
   * GET /api/products/colors/
   */
  async getColors(): Promise<BackendColor[]> {
    const response = await apiClient.get<PaginatedResponse<BackendColor> | BackendColor[]>('/products/colors/', {
      params: { page_size: 100 },
    });
    return unwrapResults<BackendColor>(response);
  },

  /**
   * Get a single color by ID
   * GET /api/products/colors/<id>/
   */
  async getColor(id: number): Promise<BackendColor> {
    return apiClient.get<BackendColor>(`/products/colors/${id}/`);
  },

  /**
   * Create a new color
   * POST /api/products/colors/
   */
  async createColor(data: ColorCreateRequest): Promise<BackendColor> {
    let hex = (data.hex_code || '').trim();
    if (!hex.startsWith('#')) {
      hex = `#${hex}`;
    }
    const nameAr = (data.name_ar || data.name || hex).trim();
    const nameEn = (data.name_en || data.name || hex).trim();
    return apiClient.post<BackendColor>('/products/colors/', {
      name_ar: nameAr,
      name_en: nameEn,
      hex_code: hex.toUpperCase(),
    });
  },

  /**
   * Create or retrieve a shared customer color
   * POST /api/products/colors/custom/
   */
  async createCustomColor(hex_code: string): Promise<BackendColor> {
    return apiClient.post<BackendColor>('/products/colors/custom/', { hex_code });
  },

  /**
   * Update a color
   * PUT /api/products/colors/<id>/ or PATCH /api/products/colors/<id>/
   */
  async updateColor(
    id: number,
    data: ColorUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PATCH'
  ): Promise<BackendColor> {
    const payload: Record<string, any> = {};
    if (data.name_ar !== undefined) payload.name_ar = data.name_ar.trim();
    if (data.name_en !== undefined) payload.name_en = data.name_en.trim();
    if (data.name !== undefined && data.name_ar === undefined) payload.name_ar = data.name.trim();
    if (data.hex_code !== undefined) {
      let hex = data.hex_code.trim();
      if (!hex.startsWith('#')) hex = `#${hex}`;
      payload.hex_code = hex.toUpperCase();
    }
    if (method === 'PUT') {
      return apiClient.put<BackendColor>(`/products/colors/${id}/`, payload);
    }
    return apiClient.patch<BackendColor>(`/products/colors/${id}/`, payload);
  },

  /**
   * Delete a color
   * DELETE /api/products/colors/<id>/
   */
  async deleteColor(id: number): Promise<void> {
    return apiClient.delete<void>(`/products/colors/${id}/`);
  },
};
