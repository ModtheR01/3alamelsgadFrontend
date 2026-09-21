import { apiClient } from '../client';
import {
  BackendOrder,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
} from '@/types/order';

/**
 * Orders API Service
 * Encapsulates all backend interactions for the real Orders API.
 * Uses apiClient with credentials: 'include' and automatic token refresh.
 */
export const orderService = {
  /**
   * Retrieves the current customer's orders.
   * Endpoint: GET /api/orders/my-orders/
   */
  async getMyOrders(): Promise<BackendOrder[]> {
    return apiClient.get<BackendOrder[]>('/orders/my-orders/');
  },

  /**
   * Retrieves all orders across the store.
   * Admin and Moderator access only.
   * Endpoint: GET /api/orders/
   */
  async getAllOrders(): Promise<BackendOrder[]> {
    return apiClient.get<BackendOrder[]>('/orders/');
  },

  /**
   * Retrieves a single order by its ID.
   * Endpoint: GET /api/orders/{id}/
   */
  async getOrder(id: number | string): Promise<BackendOrder> {
    return apiClient.get<BackendOrder>(`/orders/${id}/`);
  },

  /**
   * Creates an order from the user's cart using the specified address.
   * Only sends { address_id }. The backend computes items, prices, and clears cart.
   * Endpoint: POST /api/orders/
   */
  async createOrder(data: CreateOrderRequest): Promise<BackendOrder> {
    return apiClient.post<BackendOrder>('/orders/', {
      address_id: data.address_id,
    });
  },

  /**
   * Updates an order's status.
   * Admin and Moderator access only.
   * Endpoint: PATCH /api/orders/{id}/status/
   * NOTE: Do NOT use PUT or general PATCH on /orders/{id}/.
   */
  async updateOrderStatus(
    id: number | string,
    data: UpdateOrderStatusRequest
  ): Promise<BackendOrder> {
    return apiClient.patch<BackendOrder>(`/orders/${id}/status/`, {
      status: data.status,
    });
  },
};
