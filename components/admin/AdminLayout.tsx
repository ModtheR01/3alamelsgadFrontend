'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Tag,
  Truck,
  Sparkles,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Shield,
  User as UserIcon,
  Bell,
  Search,
} from 'lucide-react';

export type DashboardSection =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'offers'
  | 'shipping'
  | 'ai-images'
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
  const { isRtl } = useLanguage();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const roleLabel = (user?.role || '').toLowerCase() === 'moderator' ? 'Moderator' : 'Admin';
  const userName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email || 'Admin';

  const navItems: {
    id: DashboardSection;
    label: string;
    labelAr: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      labelAr: 'لوحة المؤشرات',
      icon: LayoutDashboard,
    },
    {
      id: 'products',
      label: 'Products',
      labelAr: 'المنتجات والأروال',
      icon: Package,
    },
    {
      id: 'categories',
      label: 'Categories',
      labelAr: 'التصنيفات',
      icon: FolderTree,
    },
    {
      id: 'orders',
      label: 'Orders',
      labelAr: 'الطلبات',
      icon: ShoppingBag,
      badge: unconfirmedOrderCount > 0 ? unconfirmedOrderCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'offers',
      label: 'Offers',
      labelAr: 'العروض والخصومات',
      icon: Tag,
    },
    {
      id: 'shipping',
      label: 'Shipping',
      labelAr: 'شحن المحافظات',
      icon: Truck,
    },
    {
      id: 'ai-images',
      label: 'Product Images / AI',
      labelAr: 'استوديو الصور والذكاء',
      icon: Sparkles,
    },
    {
      id: 'settings',
      label: 'Settings',
      labelAr: 'إعدادات المتجر',
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigateTo('home');
    } catch {
      navigateTo('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#241710] flex flex-col antialiased">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE3D8] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-[#5C4A3E] hover:bg-[#F5EFE6] transition-colors"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-[#241710] tracking-tight">
                {BRAND_CONFIG.nameAr}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
                {roleLabel}
              </span>
            </div>
            <p className="text-[10px] text-[#8C7A6B]">Admin Control Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('home')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#5C4A3E] bg-[#F5EFE6] hover:bg-[#EAE0D2] flex items-center gap-1 transition-colors"
            title="Return to storefront"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-e border-[#EAE3D8] transition-all duration-300 select-none z-30 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#EAE3D8] flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#241710] text-[#EED8BE] flex items-center justify-center font-black text-sm shadow-sm">
                  ع
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#241710] leading-none">
                      {BRAND_CONFIG.nameAr}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
                      {roleLabel}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8C7A6B] font-medium">Control Center</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-9 h-9 rounded-xl bg-[#241710] text-[#EED8BE] flex items-center justify-center font-black text-sm">
                ع
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#241710] hover:bg-[#F5EFE6] transition-colors"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-[#241710] text-white shadow-xs'
                      : 'text-[#5C4A3E] hover:bg-[#F5EFE6] hover:text-[#241710]'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#EED8BE]' : 'text-[#8C7A6B]'}`} />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isSidebarCollapsed && item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-amber-500 text-white'}`}>
                      {item.badge}
                    </span>
                  )}

                  {isSidebarCollapsed && item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Storefront Return (Footer of Sidebar) */}
          <div className="p-3 border-t border-[#EAE3D8] space-y-2 bg-[#FBF9F5]/60">
            {!isSidebarCollapsed ? (
              <div className="px-2 py-2 rounded-xl bg-white border border-[#EAE3D8] flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0] flex items-center justify-center font-bold text-xs shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[#241710] truncate">{userName}</p>
                    <p className="text-[10px] text-[#8C7A6B] capitalize font-medium">{roleLabel}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-[#9E4A2B] hover:bg-rose-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full py-2 flex justify-center text-[#9E4A2B] hover:bg-rose-50 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {!isSidebarCollapsed && (
              <button
                onClick={() => navigateTo('home')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-[#F5EFE6] border border-[#EAE3D8] text-xs font-semibold text-[#5C4A3E] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Return to Storefront</span>
              </button>
            )}
          </div>
        </aside>

        {/* Mobile Drawer Backdrop & Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl z-10">
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#EAE3D8] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#241710] text-[#EED8BE] flex items-center justify-center font-black text-sm">
                    ع
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[#241710]">{BRAND_CONFIG.nameAr}</span>
                    <p className="text-[10px] text-[#8C7A6B]">Admin Dashboard</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#8C7A6B] hover:bg-[#F5EFE6]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#241710] text-white'
                          : 'text-[#5C4A3E] hover:bg-[#F5EFE6]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#EED8BE]' : 'text-[#8C7A6B]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-amber-500 text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#EAE3D8] space-y-3 bg-[#FAF8F5]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#241710]">{userName}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {roleLabel}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-[#9E4A2B] hover:bg-rose-50"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('home');
                  }}
                  className="w-full py-2.5 rounded-xl bg-white border border-[#EAE3D8] text-xs font-semibold text-[#5C4A3E] flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Exit to Storefront</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#FAF8F5]">
          {/* Desktop Top Sub-header */}
          <div className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-[#EAE3D8] shrink-0">
            <div className="flex items-center gap-3 text-xs text-[#8C7A6B]">
              <span>Dashboard</span>
              <span>/</span>
              <span className="font-bold text-[#241710] capitalize">{activeSection.replace('-', ' ')}</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateTo('home')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#5C4A3E] bg-[#F5EFE6] hover:bg-[#EAE0D2] flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#8C7A6B]" />
                <span>View Live Storefront</span>
              </button>
            </div>
          </div>

          {/* Children Content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
