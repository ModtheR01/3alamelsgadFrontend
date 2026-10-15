import { apiClient } from '../client';
import {
  BackendProductImage,
  ProductImageCreateRequest,
  ProductImageUpdateRequest,
  SetPrimaryImageResponse,
} from '@/types/product';

export const productImageService = {
  /**
   * Get product images (optionally filtered by product ID)
   * GET /api/products/images/
   */
  async getProductImages(productId?: number): Promise<BackendProductImage[]> {
    const images = await apiClient.get<BackendProductImage[]>('/products/images/');
    return productId ? images.filter((image) => image.product === productId) : images;
  },

  /**
   * Get single product image
   * GET /api/products/images/<id>/
   */
  async getProductImage(id: number): Promise<BackendProductImage> {
    return apiClient.get<BackendProductImage>(`/products/images/${id}/`);
  },

  /**
   * Create product image record in backend after direct Cloudinary upload
   * POST /api/products/images/
   */
  async createProductImage(data: ProductImageCreateRequest): Promise<BackendProductImage> {
    return apiClient.post<BackendProductImage>('/products/images/', data);
  },

  /**
   * Update product image
   * PUT /api/products/images/<id>/ or PATCH /api/products/images/<id>/
   */
  async updateProductImage(
    id: number,
    data: ProductImageUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PATCH'
  ): Promise<BackendProductImage> {
    if (method === 'PUT') {
      return apiClient.put<BackendProductImage>(`/products/images/${id}/`, data);
    }
    return apiClient.patch<BackendProductImage>(`/products/images/${id}/`, data);
  },

  /**
   * Delete product image record from backend
   * DELETE /api/products/images/<id>/
   */
  async deleteProductImage(id: number): Promise<void> {
    return apiClient.delete<void>(`/products/images/${id}/`);
  },

  /**
   * Set primary image for product
   * POST /api/products/images/<id>/set-primary/
   */
  async setPrimaryImage(id: number): Promise<SetPrimaryImageResponse> {
    return apiClient.post<SetPrimaryImageResponse>(`/products/images/${id}/set-primary/`, {});
  },

  /**
   * Create arwal image record in backend after direct Cloudinary upload
   * POST /api/arwal-images/
   */
  async createArwalImage(data: {
    arwal: number;
    image: string;
    public_id?: string;
    is_primary?: boolean;
    sort_order?: number;
  }): Promise<BackendProductImage> {
    return apiClient.post<BackendProductImage>('/arwal-images/', data);
  },

  /**
   * Delete arwal image record from backend
   * DELETE /api/arwal-images/<id>/
   */
  async deleteArwalImage(id: number): Promise<void> {
    return apiClient.delete<void>(`/arwal-images/${id}/`);
  },
};
