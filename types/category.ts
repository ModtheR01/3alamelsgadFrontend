/**
 * Category & Subcategory Types matching Django REST Framework Serializers
 */

export interface BackendCategory {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  image: string | null;
  public_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendSubcategoryCategory {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  image: string | null;
  public_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendSubcategory {
  id: number;
  category_id: number;
  category?: BackendSubcategoryCategory;
  name: string;
  name_ar?: string;
  name_en?: string;
  image: string | null;
  public_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CategoryCreateRequest {
  name: string;
  name_ar?: string;
  name_en?: string;
  image?: string | null;
  public_id?: string | null;
}

export interface CategoryUpdateRequest {
  name?: string;
  name_ar?: string;
  name_en?: string;
  image?: string | null;
  public_id?: string | null;
}

export interface SubcategoryCreateRequest {
  category_id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  image?: string | null;
  public_id?: string | null;
}

export interface SubcategoryUpdateRequest {
  category_id?: number;
  name?: string;
  name_ar?: string;
  name_en?: string;
  image?: string | null;
  public_id?: string | null;
}

export interface ApiResponseDetail {
  detail: string;
}
