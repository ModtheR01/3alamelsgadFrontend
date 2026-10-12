'use client';

import React from 'react';
import { Product, Category } from '@/types';
import { BackendOrder, BackendOrderStatus } from '@/types/order';
import { BackendSubcategory } from '@/types/category';
import { BackendOffer } from '@/types/offer';
import {
  Package,
  ShoppingBag,
  Users,
  Plus,
  ArrowLeft,
  Tag,
  Eye,
  Layers,
  FolderTree,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import { DashboardSection } from './AdminLayout';

interface OverviewSectionProps {
  products: Product[];
  categories: Category[];
  subcategories?: BackendSubcategory[];
  orders: BackendOrder[];
  offers?: BackendOffer[];
  totalUsers?: number | null;
  isUsersLoading?: boolean;
  isOrdersLoading?: boolean;
  onNavigateSection: (section: DashboardSection) => void;
  onOpenAddProduct: () => void;
  onOpenAddCategory?: () => void;
  onOpenAddSubcategory?: () => void;
  onOpenAddOffer?: () => void;
  onSelectOrder: (order: BackendOrder) => void;
  onRefreshData?: () => void;
}

export default function OverviewSection({
  products,
  categories,
  subcategories = [],
  orders,
  offers = [],
  totalUsers = null,
  isUsersLoading = false,
  isOrdersLoading = false,
  onNavigateSection,
  onOpenAddProduct,
  onOpenAddCategory,
  onOpenAddSubcategory,
  onOpenAddOffer,
  onSelectOrder,
  onRefreshData,
}: OverviewSectionProps) {
  // Compute Real Order Status Counts from backend responses
  const totalOrders = orders.length;

  const unconfirmedOrders = orders.filter(
    (o) => o.status === 'NOT_CONFIRMED' || (o.status as string) === 'unconfirmed'
  ).length;

  const confirmedOrders = orders.filter(
    (o) =>
      o.status === 'CONFIRMED' ||
      (o.status as string) === 'confirmed' ||
      o.status === 'DELIVERED' ||
      (o.status as string) === 'delivered'
  ).length;

  const preparingOrders = orders.filter(
    (o) =>
      (o.status as string) === 'PREPARING' ||
      (o.status as string) === 'preparing' ||
      (o.status as string) === 'in_production'
  ).length;

  const shippedOrders = orders.filter(
    (o) => (o.status as string) === 'SHIPPED' || (o.status as string) === 'shipped'
  ).length;

  const deliveredOrders = orders.filter(
    (o) => (o.status as string) === 'DELIVERED' || (o.status as string) === 'delivered'
  ).length;

  const cancelledOrders = orders.filter(
    (o) => o.status === 'CANCELLED' || (o.status as string) === 'cancelled'
  ).length;

  // Real Active Offers Count: is_active is true and current date falls within starts_at / ends_at
  const now = new Date();
  const activeOffersCount = offers.filter((o) => {
    if (!o.is_active) return false;
    if (o.starts_at && new Date(o.starts_at) > now) return false;
    if (o.ends_at && new Date(o.ends_at) < now) return false;
    return true;
  }).length;

  // Reliable Paid Revenue: Calculated ONLY from orders with confirmed payment records (payment.status === 'PAID')
  const paidOrders = orders.filter((o) => o.payment?.status === 'PAID');
  const hasPaymentData = orders.some((o) => o.payment !== undefined && o.payment !== null);
  const totalPaidRevenue = paidOrders.reduce((sum, o) => {
    const amt = Number(o.payment?.amount || o.total_price || 0);
    return sum + amt;
  }, 0);

  // Recent 5 Orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 5);

  // Real Store Overview Cards (Strictly from Real Backend Data)
  const storeOverviewCards = [
    {
      title: 'إجمالي المستخدمين',
      value:
        isUsersLoading
          ? '...'
          : totalUsers !== null && totalUsers !== undefined
          ? totalUsers.toLocaleString()
          : 'غير متوفر',
      subtitle:
        isUsersLoading
          ? 'جاري التحميل...'
          : totalUsers !== null && totalUsers !== undefined
          ? 'حساب مسجل بالمتجر'
          : 'يتطلب صلاحية مدير (Admin)',
      icon: Users,
      accentBg: 'bg-indigo-50/70',
      accentText: 'text-indigo-700',
      accentBorder: 'border-indigo-100',
      action: () => onNavigateSection('users'),
    },
    {
      title: 'إجمالي الطلبات',
      value: isOrdersLoading ? '...' : totalOrders.toLocaleString(),
      subtitle:
        unconfirmedOrders > 0
          ? `${unconfirmedOrders} طلب بانتظار المراجعة`
          : 'جميع الطلبات المسجلة',
      icon: ShoppingBag,
      accentBg: 'bg-amber-50/70',
      accentText: 'text-amber-800',
      accentBorder: 'border-amber-100',
      action: () => onNavigateSection('orders'),
    },
    {
      title: 'الطلبات المؤكدة والمنجزة',
      value: isOrdersLoading ? '...' : confirmedOrders.toLocaleString(),
      subtitle:
        totalOrders > 0
          ? `${Math.round((confirmedOrders / totalOrders) * 100)}% من إجمالي الطلبات`
          : 'لا توجد طلبات بعد',
      icon: CheckCircle2,
      accentBg: 'bg-blue-50/70',
      accentText: 'text-blue-800',
      accentBorder: 'border-blue-100',
      action: () => onNavigateSection('orders'),
    },
    {
      title: 'الإيرادات المسددة (PAID)',
      value:
        isOrdersLoading
          ? '...'
          : hasPaymentData && paidOrders.length > 0
          ? `${totalPaidRevenue.toLocaleString('ar-EG')} ج.م`
          : hasPaymentData
          ? '0 ج.م'
          : 'غير متوفر',
      subtitle:
        hasPaymentData && paidOrders.length > 0
          ? `مسددة فعلياً في ${paidOrders.length} طلب`
          : hasPaymentData
          ? 'لم تؤكد مدفوعات بعد'
          : 'بيانات الدفع غير متاحة',
      icon: CreditCard,
      accentBg: 'bg-emerald-50/70',
      accentText: 'text-emerald-800',
      accentBorder: 'border-emerald-100',
      action: () => onNavigateSection('orders'),
    },
    {
      title: 'إجمالي المنتجات',
      value: products.length.toLocaleString(),
      subtitle: `${categories.length} تصنيف · ${subcategories.length} فرعي`,
      icon: Package,
      accentBg: 'bg-[#FAF5EB]',
      accentText: 'text-[#8C5E3C]',
      accentBorder: 'border-[#EAE3D8]',
      action: () => onNavigateSection('products'),
    },
    {
      title: 'العروض النشطة',
      value: activeOffersCount.toLocaleString(),
      subtitle: offers.length > 0 ? `من أصل ${offers.length} عروض` : 'لا توجد عروض',
      icon: Tag,
      accentBg: 'bg-rose-50/70',
      accentText: 'text-rose-800',
      accentBorder: 'border-rose-100',
      action: () => onNavigateSection('offers'),
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_CONFIRMED':
      case 'unconfirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            غير مؤكد
          </span>
        );
      case 'CONFIRMED':
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
            مؤكد
          </span>
        );
      case 'PROCESSING':
      case 'PREPARING':
      case 'preparing':
      case 'in_production':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
            قيد التجهيز
          </span>
        );
      case 'SHIPPED':
      case 'shipped':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">
            تم الشحن
          </span>
        );
      case 'DELIVERED':
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            تم التسليم
          </span>
        );
      case 'CANCELLED':
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
            ملغي
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

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
              نظرة عامة على المتجر
            </h1>
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                disabled={isOrdersLoading}
                className="p-1.5 rounded-lg border border-[#EAE3D8] bg-white hover:bg-[#FAF8F5] text-[#8C7A6B] hover:text-[#241710] transition-colors disabled:opacity-50"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isOrdersLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            متابعة فورية للمنتجات، دورة حياة الطلبات، والتصنيفات في معرض عالم السجاد.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddProduct}
            className="px-3.5 py-2 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#EED8BE]" />
            <span>إضافة منتج</span>
          </button>

          <button
            onClick={() => onNavigateSection('orders')}
            className="px-3.5 py-2 rounded-xl bg-[#FAF5EB] hover:bg-[#F2E8D7] border border-[#E8DEC0] text-[#241710] text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-[#A27B5C]" />
            <span>عرض الطلبات</span>
          </button>

          <button
            onClick={() => onNavigateSection('users')}
            className="px-3.5 py-2 rounded-xl bg-[#FAF5EB] hover:bg-[#F2E8D7] border border-[#E8DEC0] text-[#241710] text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Users className="w-4 h-4 text-[#A27B5C]" />
            <span>إدارة المستخدمين</span>
          </button>
        </div>
      </div>

      {/* 6 Real Store Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {storeOverviewCards.map((card, idx) => {
          const Icon = card.icon;

          return (
            <div
              key={idx}
              onClick={card.action}
              role="button"
              tabIndex={0}
              className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden cursor-pointer hover:shadow-md hover:border-[#D4C3B3] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#A27B5C]/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${card.accentBg} ${card.accentText} border ${card.accentBorder}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-[#7A695B] truncate mb-1">
                  {card.title}
                </h3>
                <p className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight leading-none">
                  {card.value}
                </p>
                <p className="text-[10px] text-[#8C7A6B] mt-1.5 truncate">
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Status Distribution & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Distribution */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#241710]">توزيع حالات الطلبات</h3>
            <span className="text-xs text-[#8C7A6B] font-mono font-bold">
              {totalOrders} طلب
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                label: 'طلبات غير مؤكدة',
                count: unconfirmedOrders,
                color: 'bg-amber-400',
                pct: totalOrders > 0 ? Math.round((unconfirmedOrders / totalOrders) * 100) : 0,
              },
              {
                label: 'طلبات مؤكدة / منجزة',
                count: confirmedOrders,
                color: 'bg-blue-500',
                pct: totalOrders > 0 ? Math.round((confirmedOrders / totalOrders) * 100) : 0,
              },
              {
                label: 'قيد التجهيز',
                count: preparingOrders,
                color: 'bg-purple-500',
                pct: totalOrders > 0 ? Math.round((preparingOrders / totalOrders) * 100) : 0,
              },
              {
                label: 'تم الشحن',
                count: shippedOrders,
                color: 'bg-cyan-500',
                pct: totalOrders > 0 ? Math.round((shippedOrders / totalOrders) * 100) : 0,
              },
              {
                label: 'تم التسليم',
                count: deliveredOrders,
                color: 'bg-emerald-500',
                pct: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
              },
              {
                label: 'ملغاة',
                count: cancelledOrders,
                color: 'bg-rose-400',
                pct: totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0,
              },
            ].map((st, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#5C4A3E] font-medium">{st.label}</span>
                  <span className="text-[#241710] font-bold">
                    {st.count} <span className="text-[10px] text-[#8C7A6B]">({st.pct}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF5EB] overflow-hidden">
                  <div
                    className={`h-full ${st.color} rounded-full transition-all duration-500`}
                    style={{ width: `${st.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {unconfirmedOrders > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span>لديك {unconfirmedOrders} طلب بانتظار مراجعة التحويل وتأكيد الدفع</span>
              <button
                onClick={() => onNavigateSection('orders')}
                className="font-bold underline hover:text-amber-950 text-[11px]"
              >
                مراجعة الآن
              </button>
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#241710]">أحدث الطلبات المستلمة</h3>
              <p className="text-[11px] text-[#8C7A6B]">آخر الطلبات التي تم إنشاؤها عبر المتجر</p>
            </div>

            <button
              onClick={() => onNavigateSection('orders')}
              className="text-xs font-bold text-[#A27B5C] hover:text-[#241710] flex items-center gap-1 transition-colors"
            >
              <span>كافة الطلبات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8C7A6B] bg-[#FAF8F5] rounded-xl border border-dashed border-[#EAE3D8]">
              لا توجد طلبات مسجلة حتى الآن.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="border-b border-[#EAE3D8] text-[#8C7A6B] text-[10px] font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 text-right">رقم الطلب</th>
                    <th className="py-2.5 px-3 text-right">العميل</th>
                    <th className="py-2.5 px-3 text-right">الحالة</th>
                    <th className="py-2.5 px-3 text-right">القيمة</th>
                    <th className="py-2.5 px-3 text-left">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {recentOrders.map((ord) => {
                    const custName = ord.user
                      ? `${ord.user.first_name || ''} ${ord.user.last_name || ''}`.trim() || ord.user.phone
                      : 'عميل المتجر';
                    const custPhone = ord.user?.phone || '';
                    const totalVal = Number(ord.total_price || 0);

                    return (
                      <tr key={ord.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#241710]">
                          #{ord.order_number || ord.id}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#241710]">{custName}</p>
                          {custPhone && <p className="text-[10px] text-[#8C7A6B] font-mono">{custPhone}</p>}
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(ord.status)}</td>
                        <td className="py-3 px-3 font-bold text-[#241710]">
                          {totalVal.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 px-3 text-left">
                          <button
                            onClick={() => onSelectOrder(ord)}
                            className="px-3 py-1.5 rounded-lg bg-[#FAF5EB] hover:bg-[#F2E8D7] text-[#241710] font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#A27B5C]" />
                            <span>تفاصيل</span>
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
      </div>

      {/* Bottom Row: Categories & Subcategories Showcase */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#241710]">الهيكل التصنيفي للمنتجات</h3>
            <p className="text-[11px] text-[#8C7A6B]">
              التصنيفات الرئيسية والتصنيفات الفرعية المربوطة بها في المتجر
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateSection('categories')}
              className="text-xs font-bold text-[#A27B5C] hover:text-[#241710] flex items-center gap-1"
            >
              <span>التصنيفات الرئيسية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[#D8CEBF]">|</span>
            <button
              onClick={() => onNavigateSection('subcategories')}
              className="text-xs font-bold text-[#A27B5C] hover:text-[#241710] flex items-center gap-1"
            >
              <span>التصنيفات الفرعية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const childSubs = subcategories.filter(
              (s) =>
                String(s.category_id) === String(cat.id) ||
                (idx + 1 === s.category_id)
            );

            return (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-[#EAE3D8] shrink-0 p-1 flex items-center justify-center">
                    <Image
                      src={cat.image || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&q=80'}
                      alt={cat.name_ar || cat.name || cat.name_en || ''}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-[#241710] truncate">{cat.name_ar || cat.name || cat.name_en}</h4>
                    <p className="text-[10px] text-[#8C7A6B]">
                      {childSubs.length} تصنيفات فرعية
                    </p>
                  </div>
                </div>

                {childSubs.length > 0 && (
                  <div className="pt-2 border-t border-[#EAE3D8]/60 space-y-1">
                    {childSubs.slice(0, 3).map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-1.5 text-[11px] text-[#5C4A3E]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A27B5C]" />
                        <span className="truncate">{sub.name_ar || sub.name || sub.name_en}</span>
                      </div>
                    ))}
                    {childSubs.length > 3 && (
                      <p className="text-[10px] text-[#8C7A6B]">
                        + {childSubs.length - 3} تصنيفات فرعية إضافية
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
