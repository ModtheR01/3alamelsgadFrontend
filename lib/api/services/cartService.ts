import { apiClient } from '../client';
import {
  BackendCart,
  BackendCartItem,
  CartItemCreateRequest,
  CartItemUpdateRequest,
} from '@/types/cart';

export const cartService = {
  /**
   * Get the current authenticated user's cart
   * GET /api/cart/
   */
  async getCart(): Promise<BackendCart> {
    return apiClient.get<BackendCart>('/cart/');
  },

  /**
   * Clear all items from the current user's cart
   * DELETE /api/cart/ (Returns 204 No Content)
   */
  async clearCart(): Promise<void> {
    return apiClient.delete<void>('/cart/');
  },

  /**
   * Get list of items in cart
   * GET /api/cart/items/
   */
  async getCartItems(): Promise<BackendCartItem[]> {
    return apiClient.get<BackendCartItem[]>('/cart/items/');
  },

  /**
   * Add item to cart (or increase quantity if product + color already in cart)
   * POST /api/cart/items/
   */
  async addItem(data: CartItemCreateRequest): Promise<BackendCartItem> {
    return apiClient.post<BackendCartItem>('/cart/items/', data);
  },

  /**
   * Update quantity of a cart item
   * PATCH /api/cart/items/<id>/ (Explicitly PATCH, never PUT)
   */
  async updateItem(id: number, data: CartItemUpdateRequest): Promise<BackendCartItem> {
    return apiClient.patch<BackendCartItem>(`/cart/items/${id}/`, data);
  },

  /**
   * Remove single item from cart
   * DELETE /api/cart/items/<id>/ (Returns 204 No Content)
   */
  async removeItem(id: number): Promise<void> {
    return apiClient.delete<void>(`/cart/items/${id}/`);
  },
};
