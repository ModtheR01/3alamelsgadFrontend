'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Layers,
  ShoppingBag,
  Tag,
  Truck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Store,
  Sparkles,
  RefreshCw,
  Users,
} from 'lucide-react';
import { normalizeApiError } from '@/lib/api/errors';

export type DashboardSection =
  | 'overview'
  | 'products'
  | 'categories'
  | 'subcategories'
  | 'offers'
  | 'ai-images'
  | 'orders'
  | 'shipping'
  | 'users'
  | 'settings';

interface AdminLayoutProps {
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  children: React.ReactNode;
  orderCount?: number;
  unconfirmedOrderCount?: number;
}

export default function AdminLayout({
  activeSection,
  onSelectSection,
  children,
  orderCount = 0,
  unconfirmedOrderCount = 0,
}: AdminLayoutProps) {
  const { navigateTo } = useToccoStore();
  const { user, logout } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const roleLabel = (user?.role || '').toLowerCase() === 'moderator' ? 'مشرف النظام' : 'مدير النظام (Admin)';
  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email || 'إدارة عالم السجاد';

  // Grouped Navigation for Clear Structure
  const navGroups: {
    groupTitle: string;
    items: {
      id: DashboardSection;
      label: string;
      icon: React.ElementType;
      badge?: number;
      badgeColor?: string;
    }[];
  }[] = [
    {
      groupTitle: 'الرئيسية',
      items: [
        {
          id: 'overview',
          label: 'نظرة عامة',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupTitle: 'إدارة المتجر',
      items: [
        {
          id: 'products',
          label: 'المنتجات والأروال',
          icon: Package,
        },
        {
          id: 'categories',
          label: 'التصنيفات الرئيسية',
          icon: FolderTree,
        },
        {
          id: 'subcategories',
          label: 'التصنيفات الفرعية',
          icon: Layers,
        },
        {
          id: 'offers',
          label: 'العروض والخصومات',
          icon: Tag,
        },
        {
          id: 'ai-images',
          label: 'استوديو الصور بالذكاء الاصطناعي',
          icon: Sparkles,
        },
      ],
    },
    {
      groupTitle: 'الطلبات والمبيعات',
      items: [
        {
          id: 'orders',
          label: 'الطلبات',
          icon: ShoppingBag,
          badge: unconfirmedOrderCount > 0 ? unconfirmedOrderCount : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
      ],
    },
    {
      groupTitle: 'الشحن والتوصيل',
      items: [
        {
          id: 'shipping',
          label: 'الشحن والمحافظات',
          icon: Truck,
        },
      ],
    },
    {
      groupTitle: 'النظام والمستخدمون',
      items: [
        {
          id: 'users',
          label: 'إدارة المستخدمين',
          icon: Users,
        },
        {
          id: 'settings',
          label: 'إعدادات المتجر',
          icon: Settings,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        navigateTo('home');
      }
    } catch (err) {
      alert(`فشل تسجيل الخروج: ${normalizeApiError(err).message}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getSectionTitle = (id: DashboardSection) => {
    switch (id) {
      case 'overview':
        return 'نظرة عامة وإحصائيات';
      case 'products':
        return 'إدارة المنتجات وتحديد مقاسات الأروال';
      case 'categories':
        return 'إدارة التصنيفات الرئيسية';
      case 'subcategories':
        return 'إدارة التصنيفات الفرعية والتصنيف الهرمي';
      case 'orders':
        return 'إدارة الطلبات وتأكيد الدفع';
      case 'offers':
        return 'العروض وكوبونات الخصم';
      case 'ai-images':
        return 'استوديو معالجة صور المنتجات بالذكاء الاصطناعي';
      case 'shipping':
        return 'تعريفة الشحن ومحافظات الجمهورية';
      case 'users':
        return 'إدارة المستخدمين وصلاحيات الحسابات';
      case 'settings':
        return 'إعدادات الحسابات ووسائل الدفع';
      default:
        return 'لوحة التحكم';
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FBF9F5] text-[#241710] flex flex-col font-sans antialiased text-right selection:bg-[#241710] selection:text-[#EED8BE]">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE3D8] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-[#5C4A3E] hover:bg-[#F5EFE6] transition-colors"
            aria-label="القائمة الجانبية"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-[#241710] tracking-tight">
                {BRAND_CONFIG.nameAr}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
                لوحة الإدارة
              </span>
            </div>
            <p className="text-[10px] text-[#8C7A6B]">{getSectionTitle(activeSection)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('home')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#241710] bg-[#FAF5EB] hover:bg-[#F2E8D7] border border-[#E8DEC0] flex items-center gap-1.5 transition-colors"
            title="الانتقال إلى واجهة المتجر"
          >
            <Store className="w-3.5 h-3.5 text-[#A27B5C]" />
            <span className="hidden sm:inline">معاينة المتجر</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Positioned on the Right in RTL) */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-l border-[#EAE3D8] transition-all duration-300 select-none z-30 shadow-xs ${
            isSidebarCollapsed ? 'w-20' : 'w-72'
          }`}
        >
          {/* Sidebar Brand Header */}
          <div className="p-4 border-b border-[#EAE3D8] flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#241710] text-[#EED8BE] flex items-center justify-center font-black text-base shadow-sm">
                  ع
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-[#241710] leading-none">
                      {BRAND_CONFIG.nameAr}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8C7A6B] font-semibold mt-0.5 block">لوحة تحكم الإدارة</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-10 h-10 rounded-xl bg-[#241710] text-[#EED8BE] flex items-center justify-center font-black text-base">
                ع
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#241710] hover:bg-[#F5EFE6] transition-colors"
              title={isSidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            >
              {isSidebarCollapsed ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links Grouped */}
          <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-none">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                {!isSidebarCollapsed && (
                  <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#A27B5C] mb-1.5">
                    {group.groupTitle}
                  </p>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectSection(item.id)}
                        title={item.label}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                          isActive
                            ? 'bg-[#241710] text-[#FAF5EB] shadow-xs'
                            : 'text-[#5C4A3E] hover:bg-[#FAF8F5] hover:text-[#241710]'
                        } ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-[#EED8BE]' : 'text-[#8C7A6B]'
                            }`}
                          />
                          {!isSidebarCollapsed && <span>{item.label}</span>}
                        </div>

                        {!isSidebarCollapsed && item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.badgeColor || 'bg-amber-500 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {isSidebarCollapsed && item.badge !== undefined && (
                          <span className="absolute top-2 start-2 w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile & Storefront Return */}
          <div className="p-3 border-t border-[#EAE3D8] space-y-2 bg-[#FBF9F5]/70">
            {!isSidebarCollapsed ? (
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-white border border-[#EAE3D8] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0] flex items-center justify-center font-bold text-xs shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#241710] truncate">{userName}</p>
                      <p className="text-[10px] text-[#8C7A6B] font-medium">{roleLabel}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="تسجيل الخروج"
                  >
                    {isLoggingOut ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-700" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => navigateTo('home')}
                  className="w-full py-2 px-3 rounded-xl bg-[#FAF5EB] hover:bg-[#F2E8D7] border border-[#E8DEC0] text-[#241710] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Store className="w-3.5 h-3.5 text-[#A27B5C]" />
                  <span>معاينة المتجر للعملاء</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => navigateTo('home')}
                  className="w-full py-2 flex justify-center text-[#241710] hover:bg-[#FAF5EB] rounded-xl transition-colors"
                  title="معاينة المتجر"
                >
                  <Store className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full py-2 flex justify-center text-rose-700 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="تسجيل الخروج"
                >
                  {isLoggingOut ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-rose-700" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 start-0 w-80 max-w-[85%] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-start duration-200">
              <div className="p-4 border-b border-[#EAE3D8] flex items-center justify-between bg-[#FBF9F5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#241710] text-[#EED8BE] flex items-center justify-center font-black text-sm">
                    ع
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#241710]">{BRAND_CONFIG.nameAr}</h3>
                    <p className="text-[10px] text-[#8C7A6B]">لوحة تحكم الإدارة</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#8C7A6B] hover:bg-[#F5EFE6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                {navGroups.map((group) => (
                  <div key={group.groupTitle} className="space-y-1">
                    <p className="px-3 text-[10px] uppercase font-bold text-[#A27B5C] mb-1">
                      {group.groupTitle}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;

                        return (
                          <button
                            key={`mobile-${item.id}`}
                            onClick={() => {
                              onSelectSection(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-[#241710] text-[#FAF5EB] shadow-xs'
                                : 'text-[#5C4A3E] hover:bg-[#FAF8F5]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${isActive ? 'text-[#EED8BE]' : 'text-[#8C7A6B]'}`} />
                              <span>{item.label}</span>
                            </div>

                            {item.badge !== undefined && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-[#EAE3D8] bg-[#FBF9F5] space-y-2">
                <button
                  onClick={() => {
                    navigateTo('home');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#EAE3D8] text-[#241710] text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <Store className="w-4 h-4 text-[#A27B5C]" />
                  <span>معاينة متجر العملاء</span>
                </button>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full py-2 px-3 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-700" />
                      <span>جاري تسجيل الخروج...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Desktop Breadcrumb / Header Bar */}
          <div className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-[#EAE3D8]">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8C7A6B]">لوحة التحكم</span>
              <span className="text-[#D8CEBF]">/</span>
              <span className="font-bold text-[#241710]">{getSectionTitle(activeSection)}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('home')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#241710] bg-[#FAF5EB] hover:bg-[#F2E8D7] border border-[#E8DEC0] flex items-center gap-1.5 transition-colors"
                title="معاينة المتجر"
              >
                <Store className="w-3.5 h-3.5 text-[#A27B5C]" />
                <span>معاينة المتجر</span>
              </button>
            </div>
          </div>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
