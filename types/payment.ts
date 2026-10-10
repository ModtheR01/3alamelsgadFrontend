/**
 * Payment Types matching Django REST Framework payment app
 * Endpoints: PATCH /api/payments/<payment_id>/status/
 */

export type BackendPaymentMethod = 'CASH_ON_DELIVERY' | 'ELECTRONIC_WALLET' | 'INSTAPAY';
export type BackendPaymentType = 'SHIPPING_ONLY' | 'FULL_ORDER';
export type BackendPaymentStatus = 'PENDING' | 'PAID' | 'NOT PAID';

export interface BackendPayment {
  id: number;
  order?: number;
  method: BackendPaymentMethod;
  payment_type: BackendPaymentType;
  amount: string;
  status: BackendPaymentStatus;
  confirmed_by?: number | null;
  confirmed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentStatusUpdateRequest {
  status: 'PAID' | 'NOT PAID';
}
