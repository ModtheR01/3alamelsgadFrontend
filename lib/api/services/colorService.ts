import { apiClient } from '../client';
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
    return apiClient.get<BackendColor[]>('/products/colors/');
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
    return apiClient.post<BackendColor>('/products/colors/', data);
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
    if (method === 'PUT') {
      return apiClient.put<BackendColor>(`/products/colors/${id}/`, data);
    }
    return apiClient.patch<BackendColor>(`/products/colors/${id}/`, data);
  },

  /**
   * Delete a color
   * DELETE /api/products/colors/<id>/
   */
  async deleteColor(id: number): Promise<void | { detail: string }> {
    return apiClient.delete<void | { detail: string }>(`/products/colors/${id}/`);
  },
};
