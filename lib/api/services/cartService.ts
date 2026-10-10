import { apiClient } from '../client';
import {
  BackendCart,
  BackendProductCartItem,
  BackendArwalCartItem,
  BackendCartBundle,
  CartItemCreateRequest,
  CartItemUpdateRequest,
  ArwalCartItemCreateRequest,
  CartBundleSelectionRequest,
} from '@/types/cart';

export const cartService = {
  /**
   * Get the current authenticated user's cart
   * GET /api/cart/
   */
  async getCart(): Promise<BackendCart> {
    const rawCart = await apiClient.get<BackendCart>('/cart/');

    const product_items = Array.isArray(rawCart?.product_items) ? rawCart.product_items : [];
    const arwal_items = Array.isArray(rawCart?.arwal_items) ? rawCart.arwal_items : [];
    const bundles = Array.isArray(rawCart?.bundles) ? rawCart.bundles : [];

    const subtotal = rawCart?.subtotal ?? '0.00';
    const discount = rawCart?.discount ?? '0.00';
    const total = rawCart?.total ?? '0.00';

    // Populate legacy items array for backwards compatibility
    const legacyItems = product_items.map((pi) => ({
      id: pi.id,
      product_id: pi.product?.id,
      product_name: pi.product?.name_ar || pi.product?.name_en || '',
      product_price: pi.unit_price,
      color_id: pi.selected_color?.id ?? null,
      color_name: pi.selected_color?.name_ar || pi.selected_color?.name_en || null,
      color_hex_code: pi.selected_color?.hex_code ?? null,
      quantity: pi.quantity,
      original_subtotal: pi.original_subtotal,
      discount_amount: pi.discount_amount,
      subtotal: pi.subtotal,
      offer: pi.applied_offers?.[0] ?? null,
    }));

    return {
      id: rawCart?.id ?? 0,
      product_items,
      arwal_items,
      bundles,
      subtotal,
      discount,
      total,
      created_at: rawCart?.created_at,
      updated_at: rawCart?.updated_at,
      items: legacyItems,
      original_total: String(subtotal),
      discount_amount: String(discount),
      total_price: String(total),
      free_shipping: false,
    };
  },

  /**
   * Clear all items, arwal items, and bundles from the current user's cart
   * DELETE /api/cart/clear/
   */
  async clearCart(): Promise<{ detail: string; deleted_items: number }> {
    return apiClient.delete<{ detail: string; deleted_items: number }>('/cart/clear/');
  },

  /**
   * Get list of regular product items in cart
   * GET /api/cart/items/
   */
  async getCartItems(): Promise<BackendProductCartItem[]> {
    return apiClient.get<BackendProductCartItem[]>('/cart/items/');
  },

  /**
   * Add regular product item to cart
   * POST /api/cart/items/
   */
  async addItem(data: CartItemCreateRequest): Promise<BackendProductCartItem> {
    return apiClient.post<BackendProductCartItem>('/cart/items/', {
      product_id: data.product_id,
      selected_color_id: data.selected_color_id,
      selected_size_id: data.selected_size_id,
      quantity: data.quantity,
    });
  },

  /**
   * Update quantity of a regular cart item
   * PATCH /api/cart/items/<id>/
   */
  async updateItem(id: number, data: CartItemUpdateRequest): Promise<BackendProductCartItem> {
    return apiClient.patch<BackendProductCartItem>(`/cart/items/${id}/`, {
      quantity: data.quantity,
    });
  },

  /**
   * Remove single regular item from cart
   * DELETE /api/cart/items/<id>/ (Returns 204 No Content)
   */
  async removeItem(id: number): Promise<void> {
    return apiClient.delete<void>(`/cart/items/${id}/`);
  },

  /**
   * Add Arwal item to cart
   * POST /api/cart/arwal-items/
   */
  async addArwalItem(data: ArwalCartItemCreateRequest): Promise<BackendArwalCartItem> {
    return apiClient.post<BackendArwalCartItem>('/cart/arwal-items/', {
      arwal_id: data.arwal_id,
      selected_color_id: data.selected_color_id,
      selected_width_id: data.selected_width_id,
      selected_length: data.selected_length,
      quantity: data.quantity,
    });
  },

  /**
   * Update quantity of an Arwal cart item
   * PATCH /api/cart/arwal-items/<id>/
   */
  async updateArwalItem(id: number, data: { quantity: number }): Promise<BackendArwalCartItem> {
    return apiClient.patch<BackendArwalCartItem>(`/cart/arwal-items/${id}/`, {
      quantity: data.quantity,
    });
  },

  /**
   * Remove Arwal item from cart
   * DELETE /api/cart/arwal-items/<id>/ (Returns 204 No Content)
   */
  async removeArwalItem(id: number): Promise<void> {
    return apiClient.delete<void>(`/cart/arwal-items/${id}/`);
  },

  /**
   * Add bundle offer to cart
   * POST /api/cart/selected-bundles/
   */
  async addBundle(data: CartBundleSelectionRequest): Promise<BackendCartBundle> {
    return apiClient.post<BackendCartBundle>('/cart/selected-bundles/', {
      bundle_offer_id: data.bundle_offer_id,
      quantity: data.quantity ?? 1,
    });
  },

  /**
   * Update quantity of a bundle in cart
   * PATCH /api/cart/selected-bundles/<bundle_offer_id>/
   */
  async updateBundle(bundleOfferId: number, data: { quantity: number }): Promise<BackendCartBundle> {
    return apiClient.patch<BackendCartBundle>(`/cart/selected-bundles/${bundleOfferId}/`, {
      quantity: data.quantity,
    });
  },

  /**
   * Remove bundle from cart
   * DELETE /api/cart/selected-bundles/<bundle_offer_id>/ (Returns 204 No Content)
   */
  async removeBundle(bundleOfferId: number): Promise<void> {
    return apiClient.delete<void>(`/cart/selected-bundles/${bundleOfferId}/`);
  },
};
