/**
 * Product, Color, Size, Arwal, and ProductImage Types
 * Matching Django REST Framework Models & Serializers
 */

export interface BackendColor {
  id: number;
  name?: string;
  name_ar?: string;
  name_en?: string;
  hex_code: string;
  created_at?: string;
  updated_at?: string;
}

export interface ColorCreateRequest {
  name_ar?: string;
  name_en?: string;
  name?: string;
  hex_code: string;
}

export interface ColorUpdateRequest {
  name_ar?: string;
  name_en?: string;
  name?: string;
  hex_code?: string;
}

export interface BackendSize {
  id: number;
  width: number;
  length: number;
  created_at?: string;
  updated_at?: string;
}

export interface SizeCreateRequest {
  width: number;
  length: number;
}

export interface BackendArwalWidth {
  id: number;
  width: number;
}

export interface BackendProductImage {
  id: number;
  product: number;
  image: string; // Cloudinary secure_url
  public_id: string; // Cloudinary public_id
  is_primary: boolean;
  sort_order: number;
  created_at?: string;
}

export interface ProductImageCreateRequest {
  product: number;
  image: string;
  public_id?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProductImageUpdateRequest {
  product?: number;
  image?: string;
  public_id?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface SetPrimaryImageResponse {
  detail: string;
  image: BackendProductImage;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export type FinishOption = 'MATTE' | 'GLOSSY';

export interface BackendCatalogSubcategory {
  id: number;
  name_ar: string;
  name_en: string;
}

export interface BackendProduct {
  id: number;
  name?: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  price: string | number;
  subcategory?: BackendCatalogSubcategory;
  subcategory_ids?: number[];
  sizes?: BackendSize[];
  size_ids?: number[];
  colors?: BackendColor[];
  color_ids?: number[];
  images?: BackendProductImage[];
  primary_image?: BackendProductImage | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  // Optional frontend helper fields
  dimensions?: string;
  delivery_days?: number | null;
  material?: string;
  finish?: FinishOption[];
  faq?: FAQItem[];
  featured?: boolean;
}

export interface BackendArwal {
  id: number;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price_per_length: string | number;
  subcategory?: BackendCatalogSubcategory;
  widths: BackendArwalWidth[];
  colors: BackendColor[];
  images: BackendProductImage[];
  primary_image?: BackendProductImage | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ArwalCreateRequest {
  subcategory_id: number;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  price_per_length: string | number;
  width_ids: number[];
  color_ids: number[];
}

export interface ProductCreateRequest {
  name?: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  price: string | number;
  subcategory_ids: number[];
  size_ids?: number[];
  color_ids?: number[];

  // Optional frontend metadata fields
  dimensions?: string;
  delivery_days?: number | null;
  material?: string;
  finish?: FinishOption[];
  faq?: FAQItem[];
  featured?: boolean;
}

export interface ProductUpdateRequest {
  name?: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  price?: string | number;
  subcategory_ids?: number[];
  size_ids?: number[];
  color_ids?: number[];

  // Optional frontend metadata fields
  dimensions?: string;
  delivery_days?: number | null;
  material?: string;
  finish?: FinishOption[];
  faq?: FAQItem[];
  featured?: boolean;
}
