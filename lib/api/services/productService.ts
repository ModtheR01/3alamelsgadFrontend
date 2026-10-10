import { apiClient } from '../client';
import { PaginatedResponse, SearchParams, unwrapResults } from '../pagination';
import {
  BackendProduct,
  BackendSize,
  BackendArwal,
  BackendArwalWidth,
  ProductCreateRequest,
  ProductUpdateRequest,
  ArwalCreateRequest,
} from '@/types/product';

export const productService = {
  /**
   * Get all active products, optionally filtered with `?search=`
   * GET /api/products/
   */
  async getProducts(params: SearchParams = {}): Promise<BackendProduct[]> {
    const response = await apiClient.get<PaginatedResponse<BackendProduct>>('/products/', {
      params: { page_size: 100, ...params },
    });
    return unwrapResults<BackendProduct>(response);
  },

  /**
   * Get a single product by ID
   * GET /api/products/<id>/
   */
  async getProduct(id: number): Promise<BackendProduct> {
    return apiClient.get<BackendProduct>(`/products/${id}/`);
  },

  /**
   * Create a new product
   * POST /api/products/
   */
  async createProduct(data: ProductCreateRequest): Promise<BackendProduct> {
    const payload: Record<string, any> = {
      name_ar: (data.name_ar || data.name || '').trim(),
      name_en: (data.name_en || data.name || '').trim(),
      description_ar: (data.description_ar || data.description || '').trim(),
      description_en: (data.description_en || data.description || '').trim(),
      price: data.price,
      subcategory_ids: data.subcategory_ids,
      size_ids: data.size_ids || [],
      color_ids: data.color_ids || [],
    };
    return apiClient.post<BackendProduct>('/products/', payload);
  },

  /**
   * Update a product
   * PUT /api/products/<id>/ or PATCH /api/products/<id>/
   */
  async updateProduct(
    id: number,
    data: ProductUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PATCH'
  ): Promise<BackendProduct> {
    const payload: Record<string, any> = {};
    if (data.name_ar || data.name) payload.name_ar = (data.name_ar || data.name || '').trim();
    if (data.name_en || data.name) payload.name_en = (data.name_en || data.name || '').trim();
    if (data.description_ar !== undefined || data.description !== undefined) {
      payload.description_ar = (data.description_ar ?? data.description ?? '').trim();
    }
    if (data.description_en !== undefined || data.description !== undefined) {
      payload.description_en = (data.description_en ?? data.description ?? '').trim();
    }
    if (data.price !== undefined) payload.price = data.price;
    if (data.subcategory_ids !== undefined) payload.subcategory_ids = data.subcategory_ids;
    if (data.size_ids !== undefined) payload.size_ids = data.size_ids;
    if (data.color_ids !== undefined) payload.color_ids = data.color_ids;

    if (method === 'PUT') {
      return apiClient.put<BackendProduct>(`/products/${id}/`, payload);
    }
    return apiClient.patch<BackendProduct>(`/products/${id}/`, payload);
  },

  /**
   * Soft delete a product (sets deleted_at timestamp)
   * DELETE /api/products/<id>/
   */
  async deleteProduct(id: number): Promise<void> {
    return apiClient.delete<void>(`/products/${id}/`);
  },

  /**
   * Permanently delete a product
   * DELETE /api/products/<id>/hard-delete/
   */
  async hardDeleteProduct(id: number): Promise<void> {
    return apiClient.delete<void>(`/products/${id}/hard-delete/`);
  },

  /**
   * Restore a soft-deleted product
   * POST /api/products/<id>/restore/
   */
  async restoreProduct(id: number): Promise<{ detail: string }> {
    return apiClient.post<{ detail: string }>(`/products/${id}/restore/`, {});
  },

  /**
   * Get all soft-deleted products
   * GET /api/products/deleted/
   */
  async getDeletedProducts(): Promise<BackendProduct[]> {
    const response = await apiClient.get<PaginatedResponse<BackendProduct>>('/products/deleted/', {
      params: { page_size: 100 },
    });
    return unwrapResults<BackendProduct>(response);
  },

  /**
   * Get all sizes configured in the system
   * GET /api/products/sizes/
   */
  async getSizes(): Promise<BackendSize[]> {
    const response = await apiClient.get<PaginatedResponse<BackendSize>>('/products/sizes/', {
      params: { page_size: 100 },
    });
    return unwrapResults<BackendSize>(response);
  },

  /**
   * Get all Arwal products (أروال بالمتر)
   * GET /api/arwals/
   */
  async getArwals(params: SearchParams = {}): Promise<BackendArwal[]> {
    const response = await apiClient.get<PaginatedResponse<BackendArwal>>('/arwals/', {
      params: { page_size: 100, ...params },
    });
    return unwrapResults<BackendArwal>(response);
  },

  /**
   * Get a single Arwal by ID
   * GET /api/arwals/<id>/
   */
  async getArwal(id: number): Promise<BackendArwal> {
    return apiClient.get<BackendArwal>(`/arwals/${id}/`);
  },

  /**
   * Get Arwal available widths (e.g. 60, 80, 100, 120 cm)
   * GET /api/arwals/widths/
   */
  async getArwalWidths(): Promise<BackendArwalWidth[]> {
    const response = await apiClient.get<BackendArwalWidth[]>('/arwals/widths/');
    return Array.isArray(response) ? response : [];
  },

  /**
   * Create a new Arwal product
   * POST /api/arwals/
   */
  async createArwal(data: ArwalCreateRequest): Promise<BackendArwal> {
    return apiClient.post<BackendArwal>('/arwals/', data);
  },

  /**
   * Update an Arwal product
   * PATCH /api/arwals/<id>/
   */
  async updateArwal(id: number, data: Partial<ArwalCreateRequest>): Promise<BackendArwal> {
    return apiClient.patch<BackendArwal>(`/arwals/${id}/`, data);
  },

  /**
   * Delete an Arwal product
   * DELETE /api/arwals/<id>/
   */
  async deleteArwal(id: number): Promise<void> {
    return apiClient.delete<void>(`/arwals/${id}/`);
  },
};
