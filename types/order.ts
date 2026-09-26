/**
 * Backend Orders API Types & Data Contracts
 * Strictly complies with the Django REST Framework Orders API specification.
 */

export type BackendOrderStatus = 'NOT_CONFIRMED' | 'CONFIRMED' | 'CANCELLED';

export interface BackendShippingAddress {
  title: string;
  country: string;
  city: string;
  street: string;
  building_number: string;
  apartment_number: string;
}

export interface BackendOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: string;
  color_name: string | null;
  color_hex_code: string | null;
  selected_finish?: 'MATTE' | 'GLOSSY' | null;
  quantity: number;
  subtotal: string;
}

export interface BackendOrderUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface BackendOrder {
  id: number;
  order_number: string; // UUID
  user: BackendOrderUser;
  address_id: number;
  shipping_address: BackendShippingAddress;
  status: BackendOrderStatus;
  customer_notes: string;
  total_price: string;
  deposit_percentage: string;
  deposit_amount: string;
  items: BackendOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  address_id: number;
  customer_notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: BackendOrderStatus;
}

export const VALID_ORDER_STATUSES: BackendOrderStatus[] = [
  'NOT_CONFIRMED',
  'CONFIRMED',
  'CANCELLED',
];

export const ORDER_STATUS_LABELS: Record<BackendOrderStatus, string> = {
  NOT_CONFIRMED: 'Not Confirmed',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<
  BackendOrderStatus,
  { bg: string; text: string; border: string }
> = {
  NOT_CONFIRMED: {
    bg: 'bg-[#FFF8E6]',
    text: 'text-[#B7791F]',
    border: 'border-[#F6E05E]',
  },
  CONFIRMED: {
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#15803D]',
    border: 'border-[#86EFAC]',
  },
  CANCELLED: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#B91C1C]',
    border: 'border-[#FECACA]',
  },
};
