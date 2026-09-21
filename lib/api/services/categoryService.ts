import { apiClient } from '../client';
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
   * Get all active categories
   * GET /categories/
   */
  async getCategories(): Promise<BackendCategory[]> {
    return apiClient.get<BackendCategory[]>('/categories/');
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
    return apiClient.post<BackendCategory>('/categories/', data);
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
    if (method === 'PUT') {
      return apiClient.put<BackendCategory>(`/categories/${id}/`, data);
    }
    return apiClient.patch<BackendCategory>(`/categories/${id}/`, data);
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
    return apiClient.get<BackendCategory[]>('/categories/deleted/');
  },
};

export const subcategoryService = {
  /**
   * Get all active subcategories
   * GET /subcategories/
   */
  async getSubcategories(): Promise<BackendSubcategory[]> {
    return apiClient.get<BackendSubcategory[]>('/subcategories/');
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
    return apiClient.post<BackendSubcategory>('/subcategories/', data);
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
    if (method === 'PUT') {
      return apiClient.put<BackendSubcategory>(`/subcategories/${id}/`, data);
    }
    return apiClient.patch<BackendSubcategory>(`/subcategories/${id}/`, data);
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
    return apiClient.get<BackendSubcategory[]>('/subcategories/deleted/');
  },
};
