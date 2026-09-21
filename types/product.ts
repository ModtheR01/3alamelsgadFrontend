/**
 * Product, Color, and ProductImage Types
 * Matching Django REST Framework Models & Serializers
 */

export interface BackendColor {
  id: number;
  name: string;
  hex_code: string;
  created_at: string;
  updated_at: string;
}

export interface ColorCreateRequest {
  name: string;
  hex_code: string;
}

export interface ColorUpdateRequest {
  name?: string;
  hex_code?: string;
}

export interface BackendProductImage {
  id: number;
  product: number;
  image: string; // Cloudinary secure_url
  public_id: string; // Cloudinary public_id
  is_primary: boolean;
  sort_order: number;
  created_at: string;
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

export interface BackendProduct {
  id: number;
  name: string;
  description: string;
  dimensions: string;
  price: string | number;
  delivery_days: number | null;
  material: string;
  finish: FinishOption[];
  faq: FAQItem[];
  subcategory_ids: number[];
  colors: BackendColor[];
  images: BackendProductImage[];
  featured: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductCreateRequest {
  name: string;
  description?: string;
  dimensions?: string;
  price: string | number;
  delivery_days?: number | null;
  material?: string;
  finish?: FinishOption[];
  faq?: FAQItem[];
  subcategory_ids: number[];
  color_ids?: number[];
  featured?: boolean;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  dimensions?: string;
  price?: string | number;
  delivery_days?: number | null;
  material?: string;
  finish?: FinishOption[];
  faq?: FAQItem[];
  subcategory_ids?: number[];
  color_ids?: number[];
  featured?: boolean;
}
