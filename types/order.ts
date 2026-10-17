/**
 * Backend Orders API Types & Data Contracts
 * Strictly complies with the Django REST Framework Orders API specification.
 */
import { BackendPayment } from './payment';

export type BackendOrderStatus =
  | 'NOT_CONFIRMED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'ELECTRONIC_WALLET' | 'INSTAPAY';
export type PaymentType = 'SHIPPING_ONLY' | 'FULL_ORDER';

export interface BackendShippingAddress {
  title: string;
  shipping_governorate_name_ar?: string;
  shipping_governorate_name_en?: string;
  country?: string;
  city: string;
  street: string;
  building_number: string;
  apartment_number: string;
}

export interface BackendOrderItem {
  id: number;
  item_type?: 'product' | 'arwal';
  product?: number;
  product_id?: number;
  product_name?: string;
  product_name_ar?: string;
  product_name_en?: string;
  product_price?: string;
  unit_price?: string;
  color_name?: string | null;
  color_name_ar?: string | null;
  color_name_en?: string | null;
  color_hex_code?: string | null;
  selected_finish?: 'MATTE' | 'GLOSSY' | null;
  size_width?: number;
  size_length?: number;
  arwal?: number;
  arwal_name_ar?: string;
  arwal_name_en?: string;
  width?: number;
  length?: string;
  price_per_length?: string;
  quantity: number;
  subtotal: string;
}

export interface BackendOrderBundleItem {
  id: number;
  offer_id: number;
  name_ar: string;
  name_en: string;
  bundle_price: string;
  quantity: number;
  products: {
    product_id: number;
    name_ar: string;
    name_en: string;
    quantity: number;
  }[];
  arwals: {
    arwal_id: number;
    name_ar: string;
    name_en: string;
    quantity: number;
  }[];
}

export interface BackendOrderUser {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  role?: string;
}

export interface BackendOrder {
  id: number;
  order_number: string; // UUID
  user?: BackendOrderUser;
  address_id?: number;
  shipping_address: BackendShippingAddress;
  shipping_governorate_name_ar?: string;
  shipping_governorate_name_en?: string;
  status: BackendOrderStatus;
  customer_notes: string;
  subtotal?: string;
  discount_amount?: string;
  shipping_amount?: string;
  total_price: string;
  deposit_percentage?: string;
  deposit_amount?: string;
  items: BackendOrderItem[];
  bundles?: BackendOrderBundleItem[];
  payment?: BackendPayment | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  address_id: number;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  customer_notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: BackendOrderStatus;
}

export const VALID_ORDER_STATUSES: BackendOrderStatus[] = [
  'NOT_CONFIRMED',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export const ORDER_STATUS_LABELS: Record<BackendOrderStatus, string> = {
  NOT_CONFIRMED: 'غير مؤكد',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
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
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#1D4ED8]',
    border: 'border-[#93C5FD]',
  },
  PROCESSING: {
    bg: 'bg-[#FAF5FF]',
    text: 'text-[#7E22CE]',
    border: 'border-[#D8B4FE]',
  },
  SHIPPED: {
    bg: 'bg-[#ECFEFF]',
    text: 'text-[#0E7490]',
    border: 'border-[#A5F3FC]',
  },
  DELIVERED: {
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
