import { apiClient } from '../client';
import {
  BackendProduct,
  ProductCreateRequest,
  ProductUpdateRequest,
} from '@/types/product';

export const productService = {
  /**
   * Get all active products
   * GET /api/products/
   */
  async getProducts(): Promise<BackendProduct[]> {
    return apiClient.get<BackendProduct[]>('/products/');
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
    return apiClient.post<BackendProduct>('/products/', data);
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
    if (method === 'PUT') {
      return apiClient.put<BackendProduct>(`/products/${id}/`, data);
    }
    return apiClient.patch<BackendProduct>(`/products/${id}/`, data);
  },

  /**
   * Soft delete a product (sets deleted_at timestamp)
   * DELETE /api/products/<id>/
   */
  async deleteProduct(id: number): Promise<{ detail: string }> {
    return apiClient.delete<{ detail: string }>(`/products/${id}/`);
  },

  /**
   * Permanently delete a product
   * DELETE /api/products/<id>/hard-delete/
   */
  async hardDeleteProduct(id: number): Promise<{ detail: string }> {
    return apiClient.delete<{ detail: string }>(`/products/${id}/hard-delete/`);
  },

  /**
   * Restore a soft-deleted product
   * POST /api/products/<id>/restore/
   */
  async restoreProduct(id: number): Promise<{ detail: string } & BackendProduct> {
    return apiClient.post<{ detail: string } & BackendProduct>(`/products/${id}/restore/`, {});
  },

  /**
   * Get all soft-deleted products
   * GET /api/products/deleted/
   */
  async getDeletedProducts(): Promise<BackendProduct[]> {
    return apiClient.get<BackendProduct[]>('/products/deleted/');
  },
};
