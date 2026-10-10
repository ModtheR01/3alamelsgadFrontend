import { apiClient } from '../client';
import { PaginatedResponse, SearchParams, unwrapResults } from '../pagination';
import {
  BackendCategory,
  BackendSubcategory,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  SubcategoryCreateRequest,
  SubcategoryUpdateRequest,
} from '@/types/category';

export const categoryService = {
  /**
   * Get all active categories, optionally filtered with `?search=`
   * GET /categories/
   */
  async getCategories(params: SearchParams = {}): Promise<BackendCategory[]> {
    const response = await apiClient.get<PaginatedResponse<BackendCategory>>('/categories/', {
      params: { page_size: 100, ...params },
    });
    return unwrapResults<BackendCategory>(response);
  },

  /**
   * Get a single category by ID
   * GET /categories/<id>/
   */
  async getCategory(id: number): Promise<BackendCategory> {
    return apiClient.get<BackendCategory>(`/categories/${id}/`);
  },

  /**
   * Create a new category
   * POST /categories/
   */
  async createCategory(data: CategoryCreateRequest): Promise<BackendCategory> {
    const payload = {
      name_ar: (data.name_ar || data.name || '').trim(),
      name_en: (data.name_en || data.name || '').trim(),
      image: data.image ?? null,
      public_id: data.public_id ?? null,
    };
    return apiClient.post<BackendCategory>('/categories/', payload);
  },

  /**
   * Update a category
   * PUT /categories/<id>/ or PATCH /categories/<id>/
   */
  async updateCategory(
    id: number,
    data: CategoryUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PATCH'
  ): Promise<BackendCategory> {
    const payload: Record<string, any> = {};
    if (data.name_ar || data.name) payload.name_ar = (data.name_ar || data.name || '').trim();
    if (data.name_en || data.name) payload.name_en = (data.name_en || data.name || '').trim();
    if (data.image !== undefined) payload.image = data.image;
    if (data.public_id !== undefined) payload.public_id = data.public_id;
    if (method === 'PUT') {
      return apiClient.put<BackendCategory>(`/categories/${id}/`, payload);
    }
    return apiClient.patch<BackendCategory>(`/categories/${id}/`, payload);
  },

  /**
   * Soft delete a category (marks deleted_at timestamp)
   * DELETE /categories/<id>/
   */
  async deleteCategory(id: number): Promise<{ detail: string }> {
    return apiClient.delete<{ detail: string }>(`/categories/${id}/`);
  },

  /**
   * Permanently hard delete a category
   * Protected by models.PROTECT if subcategories exist
   * DELETE /categories/<id>/hard-delete/
   */
  async hardDeleteCategory(id: number): Promise<{ detail: string }> {
    return apiClient.delete<{ detail: string }>(`/categories/${id}/hard-delete/`);
  },

  /**
   * Restore a soft-deleted category
   * POST /categories/<id>/restore/
   */
  async restoreCategory(id: number): Promise<{ detail: string } & BackendCategory> {
    return apiClient.post<{ detail: string } & BackendCategory>(`/categories/${id}/restore/`, {});
  },

  /**
   * Get all soft-deleted categories
   * GET /categories/deleted/
   */
  async getDeletedCategories(): Promise<BackendCategory[]> {
    const response = await apiClient.get<PaginatedResponse<BackendCategory>>('/categories/deleted/', {
      params: { page_size: 100 },
    });
    return unwrapResults<BackendCategory>(response);
  },
};

export const subcategoryService = {
  /**
   * Get all active subcategories, optionally filtered with `?search=`
   * (matches subcategory name or parent category name)
   * GET /subcategories/
   */
  async getSubcategories(params: SearchParams = {}): Promise<BackendSubcategory[]> {
    const response = await apiClient.get<PaginatedResponse<BackendSubcategory>>('/subcategories/', {
      params: { page_size: 100, ...params },
    });
    return unwrapResults<BackendSubcategory>(response);
  },

  /**
   * Get a single subcategory by ID
   * GET /subcategories/<id>/
   */
  async getSubcategory(id: number): Promise<BackendSubcategory> {
    return apiClient.get<BackendSubcategory>(`/subcategories/${id}/`);
  },

  /**
   * Create a new subcategory
   * POST /subcategories/
   */
  async createSubcategory(data: SubcategoryCreateRequest): Promise<BackendSubcategory> {
    const payload = {
      category_id: data.category_id,
      name_ar: (data.name_ar || data.name || '').trim(),
      name_en: (data.name_en || data.name || '').trim(),
      image: data.image ?? null,
      public_id: data.public_id ?? null,
    };
    return apiClient.post<BackendSubcategory>('/subcategories/', payload);
  },

  /**
   * Update a subcategory
   * PUT /subcategories/<id>/ or PATCH /subcategories/<id>/
   */
  async updateSubcategory(
    id: number,
    data: SubcategoryUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PATCH'
  ): Promise<BackendSubcategory> {
    const payload: Record<string, any> = {};
    if (data.category_id !== undefined) payload.category_id = data.category_id;
    if (data.name_ar || data.name) payload.name_ar = (data.name_ar || data.name || '').trim();
    if (data.name_en || data.name) payload.name_en = (data.name_en || data.name || '').trim();
    if (data.image !== undefined) payload.image = data.image;
    if (data.public_id !== undefined) payload.public_id = data.public_id;
    if (method === 'PUT') {
      return apiClient.put<BackendSubcategory>(`/subcategories/${id}/`, payload);
    }
    return apiClient.patch<BackendSubcategory>(`/subcategories/${id}/`, payload);
  },

  /**
   * Soft delete a subcategory (marks deleted_at timestamp)
   * DELETE /subcategories/<id>/
   */
  async deleteSubcategory(id: number): Promise<{ detail: string }> {
    return apiClient.delete<{ detail: string }>(`/subcategories/${id}/`);
  },

  /**
   * Permanently hard delete a subcategory
   * DELETE /subcategories/<id>/hard-delete/
   */
  async hardDeleteSubcategory(id: number): Promise<{ detail: string }> {
    return apiClient.delete<{ detail: string }>(`/subcategories/${id}/hard-delete/`);
  },

  /**
   * Restore a soft-deleted subcategory
   * POST /subcategories/<id>/restore/
   */
  async restoreSubcategory(id: number): Promise<{ detail: string } & BackendSubcategory> {
    return apiClient.post<{ detail: string } & BackendSubcategory>(`/subcategories/${id}/restore/`, {});
  },

  /**
   * Get all soft-deleted subcategories
   * GET /subcategories/deleted/
   */
  async getDeletedSubcategories(): Promise<BackendSubcategory[]> {
    const response = await apiClient.get<PaginatedResponse<BackendSubcategory>>('/subcategories/deleted/', {
      params: { page_size: 100 },
    });
    return unwrapResults<BackendSubcategory>(response);
  },
};
