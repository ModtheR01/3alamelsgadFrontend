'use client';

import React, { useState, useMemo } from 'react';
import { BackendOrder, BackendOrderStatus } from '@/types/order';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Cog,
  Truck,
  CheckCheck,
  XCircle,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  DollarSign,
  User as UserIcon,
  X,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { toWhatsAppNumber } from '@/lib/utils';
import { BRAND_CONFIG } from '@/lib/brandConfig';

interface OrdersSectionProps {
  orders: BackendOrder[];
  isLoading: boolean;
  onRefreshOrders: () => Promise<void>;
  onUpdateOrderStatus: (orderId: number | string, newStatus: BackendOrderStatus) => Promise<void>;
  selectedOrderForModal: BackendOrder | null;
  setSelectedOrderForModal: (order: BackendOrder | null) => void;
}

export const ORDER_WORKFLOW: {
  status: BackendOrderStatus;
  label: string;
  labelAr: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    status: 'NOT_CONFIRMED',
    label: 'Unconfirmed',
    labelAr: 'بانتظار التأكيد ومراجعة الدفع',
    color: 'text-amber-800',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
  },
  {
    status: 'CONFIRMED',
    label: 'Confirmed',
    labelAr: 'تم تأكيد الدفع والطلب',
    color: 'text-blue-800',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
  },
  {
    status: 'PREPARING' as any,
    label: 'Preparing',
    labelAr: 'قيد التجهيز والسرفلة',
    color: 'text-purple-800',
    bg: 'bg-purple-100',
    border: 'border-purple-300',
  },
  {
    status: 'SHIPPED' as any,
    label: 'Shipped',
    labelAr: 'تم الشحن مع مندوب التوصيل',
    color: 'text-indigo-800',
    bg: 'bg-indigo-100',
    border: 'border-indigo-300',
  },
  {
    status: 'DELIVERED' as any,
    label: 'Delivered',
    labelAr: 'تم التسليم بنجاح للعميل',
    color: 'text-emerald-800',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
  },
  {
    status: 'CANCELLED',
    label: 'Cancelled',
    labelAr: 'طلب ملغي',
    color: 'text-rose-800',
    bg: 'bg-rose-100',
    border: 'border-rose-300',
  },
];

export default function OrdersSection({
  orders,
  isLoading,
  onRefreshOrders,
  onUpdateOrderStatus,
  selectedOrderForModal,
  setSelectedOrderForModal,
}: OrdersSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Updating order status state
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [statusActionSuccess, setStatusActionSuccess] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ord.order_number?.toLowerCase().includes(q) ||
        String(ord.id).includes(q) ||
        ord.user?.first_name?.toLowerCase().includes(q) ||
        ord.user?.last_name?.toLowerCase().includes(q) ||
        ord.user?.phone?.includes(q) ||
        ord.user?.email?.toLowerCase().includes(q) ||
        ord.shipping_address?.city?.toLowerCase().includes(q);

      const isUnconfirmed = ord.status === 'NOT_CONFIRMED' || (ord.status as string) === 'unconfirmed';
      const isConfirmed = ord.status === 'CONFIRMED' || (ord.status as string) === 'confirmed';
      const isPreparing = (ord.status as string) === 'PREPARING' || (ord.status as string) === 'preparing' || (ord.status as string) === 'in_production';
      const isShipped = (ord.status as string) === 'SHIPPED' || (ord.status as string) === 'shipped';
      const isDelivered = (ord.status as string) === 'DELIVERED' || (ord.status as string) === 'delivered';
      const isCancelled = ord.status === 'CANCELLED' || (ord.status as string) === 'cancelled';

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'NOT_CONFIRMED' && isUnconfirmed) ||
        (statusFilter === 'CONFIRMED' && isConfirmed) ||
        (statusFilter === 'PREPARING' && isPreparing) ||
        (statusFilter === 'SHIPPED' && isShipped) ||
        (statusFilter === 'DELIVERED' && isDelivered) ||
        (statusFilter === 'CANCELLED' && isCancelled);

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleStatusChange = async (orderId: number, nextStatus: BackendOrderStatus) => {
    setUpdatingOrderId(orderId);
    setStatusActionError(null);
    setStatusActionSuccess(null);
    try {
      await onUpdateOrderStatus(orderId, nextStatus);
      setStatusActionSuccess(`Order #${orderId} status updated to ${nextStatus}`);
      setTimeout(() => setStatusActionSuccess(null), 3000);
      if (selectedOrderForModal && selectedOrderForModal.id === orderId) {
        setSelectedOrderForModal({
          ...selectedOrderForModal,
          status: nextStatus,
        });
      }
    } catch (err: any) {
      setStatusActionError(err?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Helper to detect payment method details
  const getOrderPaymentInfo = (order: BackendOrder) => {
    const notes = order.customer_notes || '';
    const isVodafone = /vodafone|فودافون/i.test(notes);
    const isInstapay = /instapay|انستاباي/i.test(notes);
    const isCod = /cash|دفع عند الاستلام|cod/i.test(notes);

    const method = isVodafone ? 'Vodafone Cash' : isInstapay ? 'InstaPay' : isCod ? 'Cash on Delivery' : 'InstaPay / Mobile Wallet';

    // Payment option selection:
    // Option 1: Shipping fees only in advance
    // Option 2: Full order amount + shipping in advance
    const isShippingOnly = /شحن فقط|shipping only|deposit only|عربون/i.test(notes);
    const paymentOption = isShippingOnly
      ? 'Paying shipping fees only in advance (دفع مصاريف الشحن مسبقاً، والباقي عند الاستلام)'
      : 'Full order amount + shipping in advance (سداد كامل قيمة الطلب والشحن مسبقاً)';

    const total = Number(order.total_price || 0);
    const depositPct = Number(order.deposit_percentage || 50);
    const depositAmt = Number(order.deposit_amount || (total * depositPct) / 100);

    return {
      method,
      paymentOption,
      isShippingOnly,
      total,
      depositAmt,
      depositPct,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#241710] tracking-tight">
            Orders & Payment Verification
          </h1>
          <p className="text-xs text-[#8C7A6B]">
            Review incoming orders, verify customer deposits, and transition status across the fulfillment pipeline.
          </p>
        </div>

        <button
          onClick={onRefreshOrders}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-white border border-[#EAE3D8] hover:bg-[#F5EFE6] text-xs font-semibold text-[#241710] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {statusActionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusActionSuccess}</span>
        </div>
      )}

      {statusActionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{statusActionError}</span>
        </div>
      )}

      {/* Toolbar: Search & Filters */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute top-3 start-3 text-[#8C7A6B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer, phone, city..."
              className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#A89A8E] focus:outline-none focus:border-[#241710]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="NOT_CONFIRMED">Unconfirmed (بانتظار التأكيد)</option>
              <option value="CONFIRMED">Confirmed (مؤكد)</option>
              <option value="PREPARING">Preparing (قيد التجهيز)</option>
              <option value="SHIPPED">Shipped (خرج للشحن)</option>
              <option value="DELIVERED">Delivered (تم التسليم)</option>
              <option value="CANCELLED">Cancelled (ملغي)</option>
            </select>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-end text-xs text-[#8C7A6B]">
            <span>
              Showing <strong className="text-[#241710]">{filteredOrders.length}</strong> of{' '}
              <strong className="text-[#241710]">{orders.length}</strong> orders
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-[#D5C6B5] mx-auto" />
            <p className="text-sm font-semibold text-[#241710]">No orders found</p>
            <p className="text-xs text-[#8C7A6B]">Try adjusting your search criteria or refresh the orders list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4 text-start">Order Number</th>
                  <th className="py-3 px-3 text-start">Date & Time</th>
                  <th className="py-3 px-3 text-start">Customer Information</th>
                  <th className="py-3 px-3 text-start">Delivery Location</th>
                  <th className="py-3 px-3 text-start">Items</th>
                  <th className="py-3 px-3 text-start">Total Amount</th>
                  <th className="py-3 px-3 text-start">Current Status</th>
                  <th className="py-3 px-4 text-end">Action & Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {filteredOrders.map((ord) => {
                  const isUnconfirmed = ord.status === 'NOT_CONFIRMED' || (ord.status as string) === 'unconfirmed';
                  const isConfirmed = ord.status === 'CONFIRMED' || (ord.status as string) === 'confirmed';
                  const isCancelled = ord.status === 'CANCELLED' || (ord.status as string) === 'cancelled';
                  const { method } = getOrderPaymentInfo(ord);

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        isUnconfirmed ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#241710]">
                        <span className="block">#{ord.order_number?.slice(0, 8) || ord.id}</span>
                        {isUnconfirmed && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded">
                            Action Required
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-[#5C4A3E]">
                        <p className="font-medium">
                          {new Date(ord.created_at || '').toLocaleDateString('en-GB')}
                        </p>
                        <p className="text-[10px] text-[#8C7A6B]">
                          {new Date(ord.created_at || '').toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#241710]">
                          {ord.user?.first_name} {ord.user?.last_name}
                        </p>
                        <a
                          href={`tel:${ord.user?.phone}`}
                          className="text-[11px] text-[#8C7A6B] hover:text-[#241710] font-mono block"
                        >
                          {ord.user?.phone || '—'}
                        </a>
                      </td>

                      {/* Destination / Address */}
                      <td className="py-3 px-3 text-[#5C4A3E]">
                        <p className="font-semibold text-[#241710]">{ord.shipping_address?.city || 'Egypt'}</p>
                        <p className="text-[10px] text-[#8C7A6B] truncate max-w-[140px]">
                          {ord.shipping_address?.street || ord.shipping_address?.title || 'Standard Delivery'}
                        </p>
                      </td>

                      {/* Items Count */}
                      <td className="py-3 px-3 text-[#5C4A3E]">
                        <span className="font-bold text-[#241710]">{ord.items?.length || 0}</span> item
                        {(ord.items?.length || 0) !== 1 ? 's' : ''}
                      </td>

                      {/* Total Price */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#241710]">
                          {Number(ord.total_price || 0).toLocaleString()} EGP
                        </p>
                        <span className="text-[10px] text-[#8C7A6B] block truncate max-w-[110px]">
                          {method}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isUnconfirmed
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isConfirmed
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {isUnconfirmed ? 'Unconfirmed' : ord.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-end">
                        <button
                          onClick={() => setSelectedOrderForModal(ord)}
                          className="px-3 py-1.5 rounded-xl bg-[#241710] hover:bg-[#3D281C] text-white text-xs font-semibold transition-colors shadow-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ORDER DETAILS & PAYMENT CONFIRMATION MODAL ================= */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 p-5 sm:p-7 space-y-6 shadow-2xl border border-[#EAE3D8] max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D8]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#241710]">
                    Order #{selectedOrderForModal.order_number?.slice(0, 8) || selectedOrderForModal.id}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedOrderForModal.status === 'NOT_CONFIRMED' || (selectedOrderForModal.status as string) === 'unconfirmed'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : selectedOrderForModal.status === 'CONFIRMED'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {selectedOrderForModal.status === 'NOT_CONFIRMED' ? 'Unconfirmed' : selectedOrderForModal.status}
                  </span>
                </div>
                <p className="text-xs text-[#8C7A6B] mt-0.5">
                  Placed on {new Date(selectedOrderForModal.created_at || '').toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1.5 rounded-lg text-[#8C7A6B] hover:bg-[#F5EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CRITICAL BUSINESS RULE SECTION: PAYMENT CONFIRMATION BOX */}
            {(() => {
              const { method, paymentOption, isShippingOnly, total, depositAmt, depositPct } =
                getOrderPaymentInfo(selectedOrderForModal);
              const isUnconfirmed =
                selectedOrderForModal.status === 'NOT_CONFIRMED' ||
                (selectedOrderForModal.status as string) === 'unconfirmed';

              return (
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isUnconfirmed
                      ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                      : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-amber-800" />
                      <h4 className="text-sm font-bold text-[#241710]">
                        Payment Details & Verification Status
                      </h4>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isUnconfirmed
                          ? 'bg-amber-200 text-amber-950 border border-amber-400'
                          : 'bg-emerald-200 text-emerald-950'
                      }`}
                    >
                      {isUnconfirmed ? 'Payment Verification Pending' : 'Payment Confirmed'}
                    </span>
                  </div>

                  {/* Payment Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-[#EAE3D8]">
                      <span className="text-[10px] text-[#8C7A6B] block">Payment Method</span>
                      <strong className="text-sm text-[#241710]">{method}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[#EAE3D8]">
                      <span className="text-[10px] text-[#8C7A6B] block">Total Order Amount</span>
                      <strong className="text-sm text-[#241710]">{total.toLocaleString()} EGP</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[#EAE3D8]">
                      <span className="text-[10px] text-[#8C7A6B] block">Advance Requirement</span>
                      <strong className="text-sm text-amber-900">
                        {isShippingOnly ? 'Shipping Fee Only' : `${depositAmt.toLocaleString()} EGP (${depositPct}%)`}
                      </strong>
                    </div>
                  </div>

                  {/* Payment Option Selected by Customer */}
                  <div className="p-3 rounded-xl bg-white border border-[#EAE3D8] text-xs space-y-1">
                    <span className="text-[10px] text-[#8C7A6B] uppercase font-bold tracking-wider">
                      Customer Payment Option Selection:
                    </span>
                    <p className="font-semibold text-[#241710]">{paymentOption}</p>
                  </div>

                  {/* Confirmation Action Button */}
                  {isUnconfirmed && (
                    <div className="pt-3 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-amber-900">
                        <strong>Rule:</strong> Only confirm this order once the bank, Vodafone Cash, or InstaPay deposit receipt has been validated.
                      </p>

                      <button
                        type="button"
                        disabled={updatingOrderId === selectedOrderForModal.id}
                        onClick={() => handleStatusChange(selectedOrderForModal.id, 'CONFIRMED')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm Payment & Order</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Customer Information & Shipping Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-2">
                <div className="flex items-center gap-2 text-[#241710] font-bold">
                  <UserIcon className="w-4 h-4 text-[#A27B5C]" />
                  <span>Customer Contact Details</span>
                </div>
                <p className="font-semibold text-[#241710]">
                  {selectedOrderForModal.user?.first_name} {selectedOrderForModal.user?.last_name}
                </p>
                <div className="space-y-1 text-[#5C4A3E]">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#8C7A6B]" />
                    <a
                      href={`tel:${selectedOrderForModal.user?.phone}`}
                      className="hover:underline font-mono"
                    >
                      {selectedOrderForModal.user?.phone || '—'}
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#8C7A6B]" />
                    <span>{selectedOrderForModal.user?.email || '—'}</span>
                  </p>
                </div>

                {selectedOrderForModal.user?.phone && (
                  <div className="pt-2">
                    <a
                      href={`https://wa.me/${toWhatsAppNumber(selectedOrderForModal.user.phone)}?text=${encodeURIComponent(
                        `مرحباً ${selectedOrderForModal.user.first_name}، نتواصل معك بخصوص طلبك من عالم السجاد #${selectedOrderForModal.order_number || selectedOrderForModal.id}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-[11px] font-bold hover:bg-[#20ba5a] transition-colors"
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                )}
              </div>

              {/* Shipping Destination Box */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-2">
                <div className="flex items-center gap-2 text-[#241710] font-bold">
                  <MapPin className="w-4 h-4 text-[#A27B5C]" />
                  <span>Delivery Destination</span>
                </div>
                <p className="font-semibold text-[#241710]">
                  {selectedOrderForModal.shipping_address?.city || 'Cairo'}, Egypt
                </p>
                <p className="text-[#5C4A3E]">
                  {selectedOrderForModal.shipping_address?.street || 'Standard Street Address'}
                </p>
                {selectedOrderForModal.shipping_address?.building_number && (
                  <p className="text-[#8C7A6B]">
                    Building: {selectedOrderForModal.shipping_address.building_number}, Apt:{' '}
                    {selectedOrderForModal.shipping_address.apartment_number || '—'}
                  </p>
                )}
              </div>
            </div>

            {/* Ordered Products List */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#241710]">
                Ordered Pieces & Options ({selectedOrderForModal.items?.length || 0})
              </h4>

              <div className="rounded-xl border border-[#EAE3D8] divide-y divide-[#EAE3D8] overflow-hidden">
                {selectedOrderForModal.items?.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 text-xs bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#EAE3D8] flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-[#A27B5C]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#241710]">{item.product_name}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-[#8C7A6B] mt-0.5">
                          {item.color_name && (
                            <span className="flex items-center gap-1">
                              {item.color_hex_code && (
                                <span
                                  className="w-2 h-2 rounded-full border border-black/20"
                                  style={{ backgroundColor: item.color_hex_code }}
                                />
                              )}
                              Color: {item.color_name}
                            </span>
                          )}
                          {item.selected_finish && <span>Finish: {item.selected_finish}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <p className="font-bold text-[#241710]">
                        {Number(item.subtotal || item.product_price).toLocaleString()} EGP
                      </p>
                      <p className="text-[10px] text-[#8C7A6B]">
                        Qty: {item.quantity} × {Number(item.product_price).toLocaleString()} EGP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Status Workflow Progression */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-3">
              <label className="block text-xs uppercase tracking-wider font-bold text-[#241710]">
                Advance Order Pipeline Status
              </label>

              <div className="flex flex-wrap gap-2">
                {ORDER_WORKFLOW.map((wf) => {
                  const isCurrent = selectedOrderForModal.status === wf.status;
                  return (
                    <button
                      key={wf.status}
                      type="button"
                      disabled={updatingOrderId === selectedOrderForModal.id}
                      onClick={() => handleStatusChange(selectedOrderForModal.id, wf.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        isCurrent
                          ? `${wf.bg} ${wf.color} ${wf.border} shadow-xs ring-2 ring-black/10`
                          : 'bg-white text-[#8C7A6B] border-[#EAE3D8] hover:border-[#D5C6B5]'
                      }`}
                    >
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{wf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end border-t border-[#EAE3D8]">
              <button
                type="button"
                onClick={() => setSelectedOrderForModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#241710] text-white text-xs font-semibold hover:bg-[#3D281C]"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
