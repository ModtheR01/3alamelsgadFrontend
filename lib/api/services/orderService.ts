import { apiClient } from '../client';
import { PaginatedResponse, SearchParams, unwrapResults } from '../pagination';
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
   * In DRF OrderViewSet.get_queryset():
   * Users with non-admin roles automatically get only their own orders via GET /api/orders/.
   * Endpoint: GET /api/orders/
   */
  async getMyOrders(): Promise<BackendOrder[]> {
    const response = await apiClient.get<PaginatedResponse<BackendOrder>>('/orders/', {
      params: { page_size: 100 },
    });
    return unwrapResults<BackendOrder>(response);
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
    return unwrapResults<BackendOrder>(response);
  },

  /**
   * Retrieves a single order by its ID.
   * Endpoint: GET /api/orders/{id}/
   */
  async getOrder(id: number | string): Promise<BackendOrder> {
    return apiClient.get<BackendOrder>(`/orders/${id}/`);
  },

  /**
   * Creates an order from the user's cart using the specified address and payment parameters.
   * Backend CheckoutSerializer expects { address_id, payment_method, payment_type, customer_notes? }.
   * Endpoint: POST /api/orders/
   */
  async createOrder(data: CreateOrderRequest): Promise<BackendOrder> {
    return apiClient.post<BackendOrder>('/orders/', {
      address_id: data.address_id,
      payment_method: data.payment_method,
      payment_type: data.payment_type,
      customer_notes: data.customer_notes || '',
    });
  },

  /**
   * Updates an order's status.
   * Admin and Moderator access only.
   * Endpoint: PATCH /api/orders/{id}/status/
   * NOTE: Strict state machine transitions apply. Payment must be PAID before transitioning beyond NOT_CONFIRMED.
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
