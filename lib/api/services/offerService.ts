import { apiClient } from '../client';
import { PaginatedResponse, unwrapResults } from '../pagination';
import {
  BackendOffer,
  OfferCreateRequest,
  OfferUpdateRequest,
} from '@/types/offer';

/**
 * Normalizes backend offer response to ensure bilingual fields and product relations
 * conform to frontend expectations.
 */
export function normalizeBackendOffer(raw: any): BackendOffer {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const resolvedName = raw.name || raw.name_ar || raw.name_en || '';
  const rawTargetList = Array.isArray(raw.products) && raw.products.length > 0
    ? raw.products
    : Array.isArray(raw.offer_products)
    ? raw.offer_products
    : [];

  const products = rawTargetList.map((p: any) => ({
    id: p.id || p.product_id,
    product_id: p.product_id,
    size_id: p.size_id ?? (p.size?.id ?? null),
    size_name: p.size_name || (p.size ? `${p.size.width} × ${p.size.length} سم` : ''),
    product_name: p.product_name || '',
    product_price: p.product_price || 0,
    quantity: p.quantity || 1,
  }));

  return {
    ...raw,
    name: resolvedName,
    name_ar: raw.name_ar || resolvedName,
    name_en: raw.name_en || resolvedName,
    products,
    offer_products: raw.offer_products || products,
  };
}

/**
 * Builds the exact API payload expected by Django REST Framework's OfferSerializer.
 * - Maps entered Arabic title to `name_ar` (and falls back to `name_en`).
 * - Formats target products under `offer_products` including `size_id`.
 * - Strips quantities for percentage offers and ensures quantities for bundle offers.
 * - Excludes `bundle_price` for percentage offers and excludes `percentage` for bundle offers.
 */
export function buildOfferPayload(
  data: OfferCreateRequest | OfferUpdateRequest
): Record<string, any> {
  const payload: Record<string, any> = {};

  const nameAr = data.name_ar || data.name;
  if (nameAr !== undefined) {
    const trimmedAr = nameAr.trim();
    payload.name_ar = trimmedAr;
    payload.name_en = (data.name_en || trimmedAr).trim();
  } else if (data.name_en !== undefined) {
    payload.name_en = data.name_en.trim();
  }

  if (data.offer_type !== undefined) {
    payload.offer_type = data.offer_type;
  }

  if (data.is_active !== undefined) {
    payload.is_active = data.is_active;
  }

  if (data.starts_at !== undefined) {
    payload.starts_at = data.starts_at;
  }

  if (data.ends_at !== undefined) {
    payload.ends_at = data.ends_at;
  }

  const effectiveType = data.offer_type;
  if (effectiveType === 'PERCENTAGE') {
    if (data.percentage !== undefined && data.percentage !== null) {
      payload.percentage = data.percentage;
    }
  } else if (effectiveType === 'BUNDLE') {
    if (data.bundle_price !== undefined && data.bundle_price !== null) {
      payload.bundle_price = data.bundle_price;
    }
  } else {
    if (data.percentage !== undefined && data.percentage !== null) {
      payload.percentage = data.percentage;
    }
    if (data.bundle_price !== undefined && data.bundle_price !== null) {
      payload.bundle_price = data.bundle_price;
    }
  }

  const rawTargets = data.offer_products || data.products;
  if (rawTargets !== undefined && Array.isArray(rawTargets)) {
    payload.offer_products = rawTargets.map((target) => {
      const item: Record<string, any> = { product_id: target.product_id };
      if (target.size_id !== undefined && target.size_id !== null) {
        item.size_id = target.size_id;
      }
      if (effectiveType === 'BUNDLE') {
        item.quantity = target.quantity || 1;
      }
      return item;
    });
  }

  return payload;
}

export const offerService = {
  async getOffers(): Promise<BackendOffer[]> {
    const response = await apiClient.get<PaginatedResponse<BackendOffer>>('/offers/', {
      params: { page_size: 100 },
    });
    return unwrapResults<BackendOffer>(response).map(normalizeBackendOffer);
  },

  async getOffer(id: number): Promise<BackendOffer> {
    const response = await apiClient.get<BackendOffer>(`/offers/${id}/`);
    return normalizeBackendOffer(response);
  },

  async createOffer(data: OfferCreateRequest): Promise<BackendOffer> {
    const payload = buildOfferPayload(data);
    const response = await apiClient.post<BackendOffer>('/offers/', payload);
    return normalizeBackendOffer(response);
  },

  async updateOffer(id: number, data: OfferUpdateRequest): Promise<BackendOffer> {
    const payload = buildOfferPayload(data);
    const response = await apiClient.patch<BackendOffer>(`/offers/${id}/`, payload);
    return normalizeBackendOffer(response);
  },

  async deleteOffer(id: number): Promise<void> {
    await apiClient.delete<void>(`/offers/${id}/`);
  },
};
