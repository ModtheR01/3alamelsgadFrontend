import { apiClient } from '../client';
import { BackendPayment } from '@/types/payment';

export const paymentService = {
  /**
   * Updates payment status.
   * Endpoint: PATCH /api/payments/<payment_id>/status/
   * Requires Admin permissions.
   * Setting status to "PAID" automatically moves the order from NOT_CONFIRMED to CONFIRMED.
   */
  async updatePaymentStatus(
    paymentId: number | string,
    status: 'PAID' | 'NOT PAID'
  ): Promise<BackendPayment> {
    return apiClient.patch<BackendPayment>(`/payments/${paymentId}/status/`, {
      status,
    });
  },
};
