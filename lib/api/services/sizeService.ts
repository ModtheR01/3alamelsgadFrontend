import { apiClient } from '../client';
import { PaginatedResponse, SearchParams, unwrapResults } from '../pagination';
import {
  BackendSize,
  SizeCreateRequest,
  SizeUpdateRequest,
} from '@/types/product';

export const sizeService = {
  /**
   * Get all sizes
   * GET /api/products/sizes/
   */
  async getSizes(params: SearchParams = {}): Promise<BackendSize[]> {
    const response = await apiClient.get<PaginatedResponse<BackendSize> | BackendSize[]>('/products/sizes/', {
      params: { page_size: 100, ...params },
    });
    return unwrapResults<BackendSize>(response);
  },

  /**
   * Get a single size by ID
   * GET /api/products/sizes/<id>/
   */
  async getSize(id: number): Promise<BackendSize> {
    return apiClient.get<BackendSize>(`/products/sizes/${id}/`);
  },

  /**
   * Create a new size
   * POST /api/products/sizes/
   */
  async createSize(data: SizeCreateRequest): Promise<BackendSize> {
    return apiClient.post<BackendSize>('/products/sizes/', {
      width: Number(data.width),
      length: Number(data.length),
    });
  },

  /**
   * Update a size
   * PUT /api/products/sizes/<id>/ or PATCH /api/products/sizes/<id>/
   */
  async updateSize(
    id: number,
    data: SizeUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PATCH'
  ): Promise<BackendSize> {
    const payload: Record<string, any> = {};
    if (data.width !== undefined) payload.width = Number(data.width);
    if (data.length !== undefined) payload.length = Number(data.length);

    if (method === 'PUT') {
      return apiClient.put<BackendSize>(`/products/sizes/${id}/`, payload);
    }
    return apiClient.patch<BackendSize>(`/products/sizes/${id}/`, payload);
  },

  /**
   * Delete a size
   * DELETE /api/products/sizes/<id>/
   */
  async deleteSize(id: number): Promise<void> {
    return apiClient.delete<void>(`/products/sizes/${id}/`);
  },
};
