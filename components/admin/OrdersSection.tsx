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
  MapPin,
  CreditCard,
  User as UserIcon,
  X,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import { toWhatsAppNumber } from '@/lib/utils';
import { BRAND_CONFIG } from '@/lib/brandConfig';

interface OrdersSectionProps {
  orders: BackendOrder[];
  isLoading: boolean;
  onRefreshOrders: () => Promise<void>;
  onUpdateOrderStatus: (orderId: number | string, newStatus: BackendOrderStatus) => Promise<void>;
  onConfirmPayment?: (order: BackendOrder) => Promise<void>;
  selectedOrderForModal: BackendOrder | null;
  setSelectedOrderForModal: (order: BackendOrder | null) => void;
}

export const ORDER_WORKFLOW: {
  status: BackendOrderStatus;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    status: 'NOT_CONFIRMED',
    label: 'غير مؤكد (بانتظار التحويل)',
    color: 'text-amber-900',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
  },
  {
    status: 'CONFIRMED',
    label: 'مؤكد (تم التحقق من الدفع)',
    color: 'text-blue-900',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
  },
  {
    status: 'PROCESSING',
    label: 'قيد التجهيز والسرفلة',
    color: 'text-purple-900',
    bg: 'bg-purple-100',
    border: 'border-purple-300',
  },
  {
    status: 'SHIPPED' as any,
    label: 'تم الشحن مع المندوب',
    color: 'text-cyan-900',
    bg: 'bg-cyan-100',
    border: 'border-cyan-300',
  },
  {
    status: 'DELIVERED' as any,
    label: 'تم التسليم بنجاح للعميل',
    color: 'text-emerald-900',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
  },
  {
    status: 'CANCELLED',
    label: 'طلب ملغي',
    color: 'text-rose-900',
    bg: 'bg-rose-100',
    border: 'border-rose-300',
  },
];

export default function OrdersSection({
  orders,
  isLoading,
  onRefreshOrders,
  onUpdateOrderStatus,
  onConfirmPayment,
  selectedOrderForModal,
  setSelectedOrderForModal,
}: OrdersSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
        ord.shipping_address?.city?.toLowerCase().includes(q);

      const isUnconfirmed =
        ord.status === 'NOT_CONFIRMED' || (ord.status as string) === 'unconfirmed';
      const isConfirmed =
        ord.status === 'CONFIRMED' || (ord.status as string) === 'confirmed';
      const isPreparing =
        ord.status === 'PROCESSING' ||
        (ord.status as string) === 'PREPARING' ||
        (ord.status as string) === 'preparing' ||
        (ord.status as string) === 'in_production';
      const isShipped =
        (ord.status as string) === 'SHIPPED' || (ord.status as string) === 'shipped';
      const isDelivered =
        (ord.status as string) === 'DELIVERED' || (ord.status as string) === 'delivered';
      const isCancelled =
        ord.status === 'CANCELLED' || (ord.status as string) === 'cancelled';

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'NOT_CONFIRMED' && isUnconfirmed) ||
        (statusFilter === 'CONFIRMED' && isConfirmed) ||
        (statusFilter === 'PROCESSING' && isPreparing) ||
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
      setStatusActionSuccess('تم تحديث حالة الطلب بنجاح.');
      if (selectedOrderForModal && selectedOrderForModal.id === orderId) {
        setSelectedOrderForModal({ ...selectedOrderForModal, status: nextStatus });
      }
      setTimeout(() => setStatusActionSuccess(null), 3000);
    } catch (err: any) {
      setStatusActionError(err?.message || 'تعذر تحديث حالة الطلب');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleConfirmPaymentClick = async () => {
    if (!selectedOrderForModal) return;
    setUpdatingOrderId(selectedOrderForModal.id);
    setStatusActionError(null);
    setStatusActionSuccess(null);
    try {
      if (onConfirmPayment) {
        await onConfirmPayment(selectedOrderForModal);
      } else {
        await onUpdateOrderStatus(selectedOrderForModal.id, 'CONFIRMED');
      }
      setStatusActionSuccess('تم تأكيد الدفع وتحديث حالة الطلب إلى (مؤكد).');
      setSelectedOrderForModal({
        ...selectedOrderForModal,
        status: 'CONFIRMED',
        payment: selectedOrderForModal.payment
          ? { ...selectedOrderForModal.payment, status: 'PAID' }
          : undefined,
      });
      setTimeout(() => setStatusActionSuccess(null), 3000);
    } catch (err: any) {
      setStatusActionError(err?.message || 'تعذر تأكيد الدفع');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_CONFIRMED':
      case 'unconfirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>غير مؤكد</span>
          </span>
        );
      case 'CONFIRMED':
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-700" />
            <span>مؤكد</span>
          </span>
        );
      case 'PROCESSING':
      case 'PREPARING':
      case 'preparing':
      case 'in_production':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200 inline-flex items-center gap-1">
            <Cog className="w-3 h-3 text-purple-700" />
            <span>قيد التجهيز</span>
          </span>
        );
      case 'SHIPPED':
      case 'shipped':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-200 inline-flex items-center gap-1">
            <Truck className="w-3 h-3 text-cyan-700" />
            <span>تم الشحن</span>
          </span>
        );
      case 'DELIVERED':
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCheck className="w-3 h-3 text-emerald-700" />
            <span>تم التسليم</span>
          </span>
        );
      case 'CANCELLED':
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200 inline-flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-700" />
            <span>ملغي</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
            {status}
          </span>
        );
    }
  };

  const parseOrderPayment = (order: BackendOrder) => {
    const total = Number(order.total_price || 0);
    const notes = order.customer_notes || '';
    let method = 'إنستاباي / محفظة إلكترونية';
    if (/vodafone/i.test(notes)) method = 'فودافون كاش';
    else if (/instapay/i.test(notes)) method = 'إنستاباي (InstaPay)';
    else if (/bank/i.test(notes)) method = 'تحويل بنكي';
    return { method, total };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
              إدارة الطلبات وتأكيد الدفع
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
              {orders.length} طلب
            </span>
          </div>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            مراجعة تحويلات العملاء وتأكيد الدفع ومتابعة مراحل التجهيز والشحن حتى التسليم.
          </p>
        </div>

        <button
          onClick={onRefreshOrders}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-white border border-[#EAE3D8] text-[#241710] hover:bg-[#FAF8F5] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {statusActionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusActionSuccess}</span>
        </div>
      )}

      {statusActionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{statusActionError}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الطلب، اسم العميل، الهاتف، أو المدينة..."
            className="w-full ps-9 pe-4 py-2.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710] transition-colors"
          />
          <Search className="w-4 h-4 text-[#8C7A6B] absolute start-3 top-3 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#A27B5C] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2.5 text-xs font-bold rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="NOT_CONFIRMED">غير مؤكد (بانتظار التحويل)</option>
            <option value="CONFIRMED">مؤكد</option>
            <option value="PROCESSING">قيد التجهيز</option>
            <option value="SHIPPED">تم الشحن</option>
            <option value="DELIVERED">تم التسليم</option>
            <option value="CANCELLED">ملغي</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF5EB] text-[#A27B5C] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#241710]">لا توجد طلبات مطابقة</h3>
            <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
              لم يتم العثور على أي طلب يطابق البحث أو الفلتر المحدد.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-right">رقم الطلب</th>
                  <th className="py-3 px-4 text-right">العميل</th>
                  <th className="py-3 px-4 text-right">المدينة / العنوان</th>
                  <th className="py-3 px-4 text-right">الحالة</th>
                  <th className="py-3 px-4 text-right">إجمالي الطلب</th>
                  <th className="py-3 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {filteredOrders.map((ord) => {
                  const custName = ord.user
                    ? `${ord.user.first_name || ''} ${ord.user.last_name || ''}`.trim() || ord.user.phone
                    : 'عميل المتجر';
                  const custPhone = ord.user?.phone || '';
                  const city = ord.shipping_address?.city || 'غير محدد';
                  const totalVal = Number(ord.total_price || 0);
                  const isUnconfirmed = ord.status === 'NOT_CONFIRMED' || (ord.status as string) === 'unconfirmed';

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-[#FAF8F5]/80 transition-colors ${
                        isUnconfirmed ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Order Number & Date */}
                      <td className="py-3 px-4 font-mono font-bold text-[#241710]">
                        #{ord.order_number || ord.id}
                        <span className="block text-[10px] text-[#8C7A6B] font-sans font-normal mt-0.5">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString('ar-EG') : 'حديثاً'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#241710]">{custName}</p>
                        {custPhone && (
                          <a
                            href={`https://wa.me/${toWhatsAppNumber(custPhone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-700 hover:underline font-mono inline-flex items-center gap-1 mt-0.5"
                          >
                            <MessageCircle className="w-3 h-3 text-[#25D366]" />
                            <span>{custPhone}</span>
                          </a>
                        )}
                      </td>

                      {/* City */}
                      <td className="py-3 px-4 text-[#5C4A3E]">
                        <span className="font-semibold text-xs text-[#241710] block">{city}</span>
                        <span className="text-[10px] text-[#8C7A6B] truncate max-w-[160px] block">
                          {ord.shipping_address?.street || ''}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(ord.status)}
                      </td>

                      {/* Total Price */}
                      <td className="py-3 px-4 font-bold text-[#241710] text-xs">
                        {totalVal.toLocaleString('ar-EG')} ج.م
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-left">
                        <button
                          onClick={() => setSelectedOrderForModal(ord)}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF5EB] hover:bg-[#F2E8D7] text-[#241710] font-bold text-xs inline-flex items-center gap-1.5 transition-colors border border-[#E8DEC0]"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#A27B5C]" />
                          <span>عرض وتأكيد</span>
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

      {/* Detailed Order & Payment Confirmation Modal (Requirement 10) */}
      {selectedOrderForModal && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-7 space-y-6 border border-[#EAE3D8] shadow-2xl my-8 text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D8]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FAF5EB] text-[#A27B5C]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-[#241710]">
                      تفاصيل الطلب #{selectedOrderForModal.order_number || selectedOrderForModal.id}
                    </h3>
                    {getStatusBadge(selectedOrderForModal.status)}
                  </div>
                  <p className="text-[11px] text-[#8C7A6B]">
                    تاريخ الطلب:{' '}
                    {selectedOrderForModal.created_at
                      ? new Date(selectedOrderForModal.created_at).toLocaleString('ar-EG')
                      : 'حديثاً'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#241710] hover:bg-[#F5EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: بيانات العميل */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-2.5">
              <h4 className="text-xs font-black uppercase text-[#A27B5C] flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                <span>بيانات العميل</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#8C7A6B] block">اسم العميل:</span>
                  <span className="font-bold text-[#241710]">
                    {selectedOrderForModal.user
                      ? `${selectedOrderForModal.user.first_name || ''} ${selectedOrderForModal.user.last_name || ''}`.trim() || 'عميل المتجر'
                      : 'عميل المتجر'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C7A6B] block">رقم الهاتف:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-[#241710] font-mono">
                      {selectedOrderForModal.user?.phone || 'غير مسجل'}
                    </span>
                    {selectedOrderForModal.user?.phone && (
                      <a
                        href={`https://wa.me/${toWhatsAppNumber(selectedOrderForModal.user.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1 hover:bg-emerald-200"
                      >
                        <MessageCircle className="w-3 h-3 text-[#25D366]" />
                        <span>محادثة واتساب</span>
                      </a>
                    )}
                  </div>
                </div>
                {selectedOrderForModal.customer_notes && (
                  <div className="sm:col-span-2 pt-1 border-t border-[#EAE3D8]/60">
                    <span className="text-[#8C7A6B] block mb-0.5 font-bold">ملاحظات العميل:</span>
                    <p className="text-[#5C4A3E] bg-white p-2.5 rounded-lg border border-[#EAE3D8]">
                      {selectedOrderForModal.customer_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: المنتجات المطلوبة */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-[#A27B5C] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>المنتجات المطلوبة في هذا الطلب</span>
              </h4>

              <div className="border border-[#EAE3D8] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-[#FAF8F5] text-[#8C7A6B] text-[10px] font-bold border-b border-[#EAE3D8]">
                    <tr>
                      <th className="py-2.5 px-3">المنتج</th>
                      <th className="py-2.5 px-3">المواصفات / اللون</th>
                      <th className="py-2.5 px-3">الكمية</th>
                      <th className="py-2.5 px-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5EFE6]">
                    {(selectedOrderForModal.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF8F5]/50">
                        <td className="py-2.5 px-3 font-bold text-[#241710]">
                          {item.product_name}
                        </td>
                        <td className="py-2.5 px-3 text-[#5C4A3E]">
                          {item.color_name && (
                            <span className="inline-flex items-center gap-1 bg-[#FAF5EB] px-2 py-0.5 rounded text-[11px] font-bold text-[#241710]">
                              {item.color_hex_code && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/10"
                                  style={{ backgroundColor: item.color_hex_code }}
                                />
                              )}
                              <span>{item.color_name}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#241710]">
                          {item.quantity} قطع
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#241710] text-left">
                          {Number(item.subtotal || item.product_price || 0).toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: الدفع وتأكيد الحجز (Payment Confirmation Rule) */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-800" />
                  <span>بيانات الدفع ومراجعة التحويل</span>
                </h4>
                <span className="text-[11px] font-bold text-amber-900">
                  طريقة التحويل: {parseOrderPayment(selectedOrderForModal).method}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs text-[#5C4A3E] space-y-2">
                <p className="leading-relaxed">
                  <strong>قاعدة العمل:</strong> يبدأ أي طلب كـ <strong>«غير مؤكد»</strong>. يقوم المشرف
                  بمراجعة إشعار التحويل البنكي أو إنستاباي أو فودافون كاش، وبمجرد التأكد من استلام المبلغ
                  يتم الضغط على زر التأكيد أدناه لنقله إلى <strong>«مؤكد»</strong> تمهيداً للتجهيز والشحن.
                </p>

                {selectedOrderForModal.status === 'NOT_CONFIRMED' ||
                (selectedOrderForModal.status as string) === 'unconfirmed' ? (
                  <button
                    type="button"
                    onClick={handleConfirmPaymentClick}
                    disabled={updatingOrderId === selectedOrderForModal.id}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد استلام الدفع وتغيير حالة الطلب إلى (مؤكد)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>تم التحقق من استلام الدفع بالفعل لهذا الطلب</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4 & 5: الشحن وملخص الطلب */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shipping Information */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-2">
                <h4 className="text-xs font-black uppercase text-[#A27B5C] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>عنوان التوصيل والشحن</span>
                </h4>
                <div className="text-xs text-[#241710] space-y-1">
                  <p>
                    <strong className="text-[#8C7A6B]">المحافظة / المدينة:</strong>{' '}
                    {selectedOrderForModal.shipping_address?.city || 'غير محدد'}
                  </p>
                  <p>
                    <strong className="text-[#8C7A6B]">الشارع:</strong>{' '}
                    {selectedOrderForModal.shipping_address?.street || '-'}
                  </p>
                  <p>
                    <strong className="text-[#8C7A6B]">العمارة / الشقة:</strong>{' '}
                    عمارة {selectedOrderForModal.shipping_address?.building_number || '-'}، شقة{' '}
                    {selectedOrderForModal.shipping_address?.apartment_number || '-'}
                  </p>
                </div>
              </div>

              {/* Order Financial Summary */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-2">
                <h4 className="text-xs font-black uppercase text-[#A27B5C] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>ملخص الحساب الإجمالي</span>
                </h4>
                <div className="text-xs space-y-1.5 pt-1">
                  <div className="flex justify-between text-[#5C4A3E]">
                    <span>قيمة المنتجات:</span>
                    <span className="font-bold font-mono">
                      {Number(selectedOrderForModal.total_price || 0).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5C4A3E]">
                    <span>مصاريف الشحن:</span>
                    <span className="font-bold text-emerald-700">شحن سريع</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#EAE3D8] text-sm font-black text-[#241710]">
                    <span>الإجمالي النهائي:</span>
                    <span>
                      {Number(selectedOrderForModal.total_price || 0).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: تحديث حالة الطلب (Order Lifecycle Status) */}
            <div className="p-4 rounded-xl bg-white border border-[#EAE3D8] space-y-3">
              <h4 className="text-xs font-black uppercase text-[#241710] flex items-center gap-1.5">
                <Cog className="w-3.5 h-3.5 text-[#A27B5C]" />
                <span>تحديث حالة الطلب في دورة الشحن</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ORDER_WORKFLOW.map((wf) => {
                  const isCurrent =
                    selectedOrderForModal.status === wf.status ||
                    (selectedOrderForModal.status as string) === wf.status.toLowerCase();

                  return (
                    <button
                      key={wf.status}
                      type="button"
                      disabled={isCurrent || updatingOrderId === selectedOrderForModal.id}
                      onClick={() => handleStatusChange(selectedOrderForModal.id, wf.status)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                        isCurrent
                          ? 'bg-[#241710] text-[#FAF5EB] border-[#241710] shadow-xs'
                          : 'bg-[#FAF8F5] text-[#5C4A3E] border-[#EAE3D8] hover:border-[#241710]'
                      }`}
                    >
                      {wf.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#EAE3D8] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderForModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold hover:bg-[#3D291D] transition-colors"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
