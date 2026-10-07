'use client';

import React from 'react';
import { Product, Category } from '@/types';
import { BackendOrder, BackendOrderStatus } from '@/types/order';
import {
  Package,
  FolderTree,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Cog,
  Truck,
  CheckCheck,
  XCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Tag,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import { DashboardSection } from './AdminLayout';

interface OverviewSectionProps {
  products: Product[];
  categories: Category[];
  orders: BackendOrder[];
  onNavigateSection: (section: DashboardSection) => void;
  onOpenAddProduct: () => void;
  onOpenAddCategory: () => void;
  onOpenAddOffer: () => void;
  onSelectOrder: (order: BackendOrder) => void;
}

export default function OverviewSection({
  products,
  categories,
  orders,
  onNavigateSection,
  onOpenAddProduct,
  onOpenAddCategory,
  onOpenAddOffer,
  onSelectOrder,
}: OverviewSectionProps) {
  // Compute Order Status Counts
  const totalOrders = orders.length;

  const unconfirmedOrders = orders.filter(
    (o) => o.status === 'NOT_CONFIRMED' || (o.status as string) === 'unconfirmed'
  ).length;

  const confirmedOrders = orders.filter(
    (o) => o.status === 'CONFIRMED' || (o.status as string) === 'confirmed'
  ).length;

  const preparingOrders = orders.filter(
    (o) => (o.status as string) === 'PREPARING' || (o.status as string) === 'preparing' || (o.status as string) === 'in_production'
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

  // Recent 5 Orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 5);

  // Recent 5 Products
  const recentProducts = [...products].slice(0, 5);

  const metricCards = [
    {
      title: 'Total Products',
      titleAr: 'إجمالي المنتجات',
      count: products.length,
      icon: Package,
      color: 'bg-stone-100 text-stone-800',
      action: () => onNavigateSection('products'),
    },
    {
      title: 'Total Categories',
      titleAr: 'إجمالي التصنيفات',
      count: categories.length,
      icon: FolderTree,
      color: 'bg-stone-100 text-stone-800',
      action: () => onNavigateSection('categories'),
    },
    {
      title: 'Total Orders',
      titleAr: 'إجمالي الطلبات',
      count: totalOrders,
      icon: ShoppingBag,
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      action: () => onNavigateSection('orders'),
    },
    {
      title: 'Unconfirmed Orders',
      titleAr: 'بانتظار التأكيد',
      count: unconfirmedOrders,
      icon: Clock,
      color: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      highlight: unconfirmedOrders > 0,
      action: () => onNavigateSection('orders'),
    },
    {
      title: 'Confirmed Orders',
      titleAr: 'طلبات مؤكدة',
      count: confirmedOrders,
      icon: CheckCircle2,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      action: () => onNavigateSection('orders'),
    },
    {
      title: 'In Preparation',
      titleAr: 'قيد التجهيز والسرفلة',
      count: preparingOrders,
      icon: Cog,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      action: () => onNavigateSection('orders'),
    },
    {
      title: 'Shipped Orders',
      titleAr: 'خرجت للشحن',
      count: shippedOrders,
      icon: Truck,
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      action: () => onNavigateSection('orders'),
    },
    {
      title: 'Delivered Orders',
      titleAr: 'تم التسليم بنجاح',
      count: deliveredOrders,
      icon: CheckCheck,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      action: () => onNavigateSection('orders'),
    },
    {
      title: 'Cancelled Orders',
      titleAr: 'طلبات ملغاة',
      count: cancelledOrders,
      icon: XCircle,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      action: () => onNavigateSection('orders'),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#241710] tracking-tight">
            Overview & Store Metrics
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            Real-time status of products, orders, inventory, and logistics.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddProduct}
            className="px-3.5 py-2 rounded-xl bg-[#241710] text-white hover:bg-[#3D281C] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>

          <button
            onClick={onOpenAddCategory}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#EAE3D8] hover:bg-[#F5EFE6] text-[#241710] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>

          <button
            onClick={onOpenAddOffer}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#EAE3D8] hover:bg-[#F5EFE6] text-[#241710] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Add Offer</span>
          </button>

          <button
            onClick={() => onNavigateSection('orders')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-300 hover:bg-amber-500/20 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Orders</span>
          </button>
        </div>
      </div>

      {/* Unconfirmed Orders Callout (if any) */}
      {unconfirmedOrders > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {unconfirmedOrders} Unconfirmed Order{unconfirmedOrders > 1 ? 's' : ''} Require Payment Review
              </p>
              <p className="text-[11px] text-amber-800">
                Verify that customer deposit or shipping payment has been received before confirming.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateSection('orders')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
          >
            Review Unconfirmed Orders
          </button>
        </div>
      )}

      {/* 9 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className={`p-4 sm:p-5 rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                card.highlight ? 'ring-2 ring-amber-400 border-amber-300' : 'border-[#EAE3D8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8C7A6B]">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#241710] tracking-tight">
                  {card.count}
                </span>
                <span className="text-[10px] text-[#A27B5C] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Distribution Bar */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#241710]">Order Status Distribution</h3>
            <span className="text-[11px] text-[#8C7A6B] font-mono">{totalOrders} total</span>
          </div>

          {totalOrders === 0 ? (
            <p className="text-xs text-[#8C7A6B] py-8 text-center">No orders recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Unconfirmed', count: unconfirmedOrders, color: 'bg-amber-400' },
                { label: 'Confirmed', count: confirmedOrders, color: 'bg-blue-500' },
                { label: 'In Preparation', count: preparingOrders, color: 'bg-purple-500' },
                { label: 'Shipped', count: shippedOrders, color: 'bg-indigo-500' },
                { label: 'Delivered', count: deliveredOrders, color: 'bg-emerald-500' },
                { label: 'Cancelled', count: cancelledOrders, color: 'bg-rose-400' },
              ].map((item, i) => {
                const percentage = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#5C4A3E] font-medium">{item.label}</span>
                      <span className="text-[#241710] font-bold">
                        {item.count} <span className="text-[10px] text-[#8C7A6B] font-normal">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F5EFE6] overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#241710]">Recent Orders</h3>
              <p className="text-[11px] text-[#8C7A6B]">Latest customer orders placed on storefront</p>
            </div>
            <button
              onClick={() => onNavigateSection('orders')}
              className="text-xs font-semibold text-[#A27B5C] hover:text-[#241710] flex items-center gap-1"
            >
              All orders <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-[#D5C6B5] mx-auto" />
              <p className="text-xs text-[#8C7A6B]">No recent orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="border-b border-[#EAE3D8] text-[#8C7A6B] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 pe-4 text-start">Order Number</th>
                    <th className="py-2.5 px-3 text-start">Customer</th>
                    <th className="py-2.5 px-3 text-start">Status</th>
                    <th className="py-2.5 px-3 text-start">Total</th>
                    <th className="py-2.5 ps-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {recentOrders.map((ord) => {
                    const isUnconfirmed = ord.status === 'NOT_CONFIRMED' || (ord.status as string) === 'unconfirmed';
                    const isConfirmed = ord.status === 'CONFIRMED' || (ord.status as string) === 'confirmed';
                    const isCancelled = ord.status === 'CANCELLED' || (ord.status as string) === 'cancelled';

                    return (
                      <tr key={ord.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 pe-4 font-mono font-bold text-[#241710]">
                          #{ord.order_number?.slice(0, 8) || ord.id}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-[#241710]">
                            {ord.user?.first_name} {ord.user?.last_name}
                          </p>
                          <p className="text-[10px] text-[#8C7A6B] font-mono">{ord.user?.phone || '—'}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                              isUnconfirmed
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isConfirmed
                                ? 'bg-blue-100 text-blue-800'
                                : isCancelled
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isUnconfirmed ? 'Unconfirmed' : ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#241710]">
                          {Number(ord.total_price || 0).toLocaleString()} EGP
                        </td>
                        <td className="py-3 ps-3 text-end">
                          <button
                            onClick={() => onSelectOrder(ord)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF5EB] hover:bg-[#F2E8D7] text-[#A27B5C] font-semibold text-[11px] transition-colors"
                          >
                            View
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

      {/* Recent Products Showcase */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#241710]">Catalogue Highlights</h3>
            <p className="text-[11px] text-[#8C7A6B]">Latest products active in the storefront</p>
          </div>
          <button
            onClick={() => onNavigateSection('products')}
            className="text-xs font-semibold text-[#A27B5C] hover:text-[#241710] flex items-center gap-1"
          >
            All products <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {recentProducts.map((p) => {
            const cat = categories.find((c) => c.id === p.categoryId);
            return (
              <div
                key={p.id}
                className="p-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] space-y-2 group hover:border-[#D5C6B5] transition-all"
              >
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#EFEBE3]">
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  {p.isArawal && (
                    <span className="absolute top-1 start-1 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Arwal
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#241710] truncate">{p.name}</p>
                  <p className="text-[10px] text-[#8C7A6B] truncate">{cat?.name || '—'}</p>
                  <p className="text-xs font-bold text-[#A27B5C] mt-1">
                    {p.price?.toLocaleString()} EGP
                    {p.isArawal && <span className="text-[9px] font-normal text-[#8C7A6B]"> / meter</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
