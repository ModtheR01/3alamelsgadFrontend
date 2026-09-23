import { apiClient } from '../client';
import { PaginatedResponse, SearchParams } from '../pagination';
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
    const response = await apiClient.get<PaginatedResponse<BackendOrder>>('/orders/my-orders/', {
      params: { page_size: 100 },
    });
    return response.results;
  },

  /**
   * Retrieves all orders across the store, optionally filtered with `?search=`
   * (matches order number, customer email/phone/name, or status).
   * Admin and Moderator access only.
   * Endpoint: GET /api/orders/
   */
  async getAllOrders(params: SearchParams = {}): Promise<BackendOrder[]> {
    const response = await apiClient.get<PaginatedResponse<BackendOrder>>('/orders/', {
      params: { page_size: 100, ...params },
    });
    return response.results;
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
   * Sends { address_id, customer_notes? }. The backend computes items, prices, and clears cart.
   * Endpoint: POST /api/orders/
   */
  async createOrder(data: CreateOrderRequest): Promise<BackendOrder> {
    return apiClient.post<BackendOrder>('/orders/', {
      address_id: data.address_id,
      customer_notes: data.customer_notes,
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
