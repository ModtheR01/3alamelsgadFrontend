'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useToccoStore, AppView } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import AlamelsgadLogo from './AlamelsgadLogo';
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  Languages,
  MessageCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  LogOut,
  RefreshCw,
  FolderTree,
} from 'lucide-react';
import { normalizeApiError } from '@/lib/api/errors';

export default function Navbar() {
  const {
    activeView,
    navigateTo,
    cartItemsCount,
    setIsCartDrawerOpen,
    searchQuery,
    setSearchQuery,
    categories,
    selectedCategoryId,
  } = useToccoStore();

  const { user, logout } = useAuth();
  const { language, toggleLanguage, t, isRtl } = useLanguage();

  const userRole = (user?.role || '').toLowerCase();
  const canAccessAdmin = userRole === 'admin' || userRole === 'moderator';

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click or Escape key
  useEffect(() => {
    if (!userDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      // After successful server logout and state cleanup, redirect to storefront home
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/';
      } else {
        navigateTo('home');
      }
    } catch (err) {
      const message = normalizeApiError(err).message;
      alert(t(`فشل تسجيل الخروج: ${message}`, `Logout failed: ${message}`));
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Display the first four actual categories returned by the backend
  const displayCategories = useMemo(() => {
    return (categories || []).filter((c) => c.isVisible !== false).slice(0, 4);
  }, [categories]);

  const handleNavClick = (view: AppView, categoryId?: string) => {
    if (view === 'shop' && categoryId) {
      navigateTo(view, { categoryId });
    } else {
      navigateTo(view);
    }
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const isTransparent = !isScrolled && activeView === 'home' && !mobileMenuOpen && !isSearchOpen;
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <header
      id="main-navigation-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? 'bg-transparent border-b border-transparent shadow-none'
          : 'bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#EAE3D8] shadow-[0_2px_12px_rgba(35,23,15,0.04)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand Identity / Logo */}
        <button
          id="nav-logo-btn"
          onClick={() => handleNavClick('home')}
          className="group flex items-center text-start focus:outline-none touch-manipulation shrink-0"
          aria-label="عالم السجاد - Alamelsgad"
        >
          <AlamelsgadLogo
            size="md"
            variant="horizontal"
            theme={isTransparent ? 'light' : 'dark'}
            showTagline={false}
          />
        </button>

        {/* Center: Desktop Navigation Links (Dynamic Backend Categories) */}
        <nav
          id="desktop-nav-links"
          className="hidden lg:flex items-center gap-5 xl:gap-7 text-[13px] font-semibold tracking-normal"
        >
          {/* Home */}
          <button
            id="nav-link-home"
            onClick={() => handleNavClick('home')}
            className={`relative py-1.5 transition-colors duration-200 ${
              isTransparent
                ? activeView === 'home'
                  ? 'text-white font-bold'
                  : 'text-white/85 hover:text-white'
                : activeView === 'home'
                ? 'text-[#241710] font-bold'
                : 'text-[#5C4A3E] hover:text-[#241710]'
            }`}
          >
            <span>{t('الرئيسية', 'Home')}</span>
            {activeView === 'home' && (
              <span
                className={`absolute bottom-0 inset-x-0 h-[2px] rounded-full animate-in fade-in duration-200 ${
                  isTransparent ? 'bg-white' : 'bg-[#A27B5C]'
                }`}
              />
            )}
          </button>

          {/* All Carpets / Catalog */}
          <button
            id="nav-link-shop-all"
            onClick={() => handleNavClick('shop')}
            className={`relative py-1.5 transition-colors duration-200 ${
              isTransparent
                ? 'text-white/85 hover:text-white'
                : activeView === 'shop' && !selectedCategoryId
                ? 'text-[#241710] font-bold'
                : 'text-[#5C4A3E] hover:text-[#241710]'
            }`}
          >
            <span>{t('كل السجاد', 'All Carpets')}</span>
            {activeView === 'shop' && !selectedCategoryId && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] rounded-full animate-in fade-in duration-200 bg-[#A27B5C]" />
            )}
          </button>

          {/* Dynamic Categories (First 4 from Backend) */}
          {displayCategories.map((cat) => {
            const isCatActive = activeView === 'shop' && selectedCategoryId === String(cat.id);
            return (
              <button
                key={cat.id}
                id={`nav-link-cat-${cat.id}`}
                onClick={() => handleNavClick('shop', cat.id)}
                className={`relative py-1.5 transition-colors duration-200 truncate max-w-[150px] ${
                  isTransparent
                    ? 'text-white/85 hover:text-white'
                    : isCatActive
                    ? 'text-[#241710] font-bold'
                    : 'text-[#5C4A3E] hover:text-[#241710]'
                }`}
                title={cat.name}
              >
                <span>{cat.name}</span>
                {isCatActive && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] rounded-full animate-in fade-in duration-200 bg-[#A27B5C]" />
                )}
              </button>
            );
          })}

          {/* Showroom */}
          <button
            id="nav-link-contact"
            onClick={() => handleNavClick('contact')}
            className={`relative py-1.5 transition-colors duration-200 ${
              isTransparent
                ? 'text-white/85 hover:text-white'
                : activeView === 'contact'
                ? 'text-[#241710] font-bold'
                : 'text-[#5C4A3E] hover:text-[#241710]'
            }`}
          >
            <span>{t('معرض المنصورة', 'Showroom')}</span>
            {activeView === 'contact' && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] rounded-full animate-in fade-in duration-200 bg-[#A27B5C]" />
            )}
          </button>
        </nav>

        {/* Right: Actions (Language Switcher, Search, Account/User Dropdown, Cart, Mobile Toggle) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide transition-colors flex items-center justify-center gap-1 border shrink-0 min-w-[28px] h-7 sm:h-auto ${
              isTransparent
                ? 'text-white border-white/30 bg-black/20 hover:bg-white/10'
                : 'text-[#473428] border-[#E8DEC0] bg-[#FAF5EB] hover:bg-[#F2E8D7]'
            }`}
            title={t('تغيير اللغة إلى English', 'Switch to Arabic')}
            aria-label="Toggle language"
          >
            <Languages className="hidden sm:inline-block w-3.5 h-3.5 text-[#A27B5C]" />
            {language === 'ar' ? (
              <>
                <span className="sm:hidden font-bold text-[11px] leading-none">EN</span>
                <span className="hidden sm:inline">English</span>
              </>
            ) : (
              <>
                <span className="sm:hidden font-bold text-[11px] leading-none">ع</span>
                <span className="hidden sm:inline">عربي</span>
              </>
            )}
          </button>

          {/* Search Toggle */}
          <button
            id="nav-search-toggle-btn"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (activeView !== 'shop' && !isSearchOpen) {
                navigateTo('shop');
              }
            }}
            className={`p-1.5 sm:p-2.5 rounded-full transition-colors focus:outline-none touch-manipulation shrink-0 ${
              isTransparent
                ? 'text-white/90 hover:text-white hover:bg-white/10'
                : 'text-[#5C4A3E] hover:text-[#241710] hover:bg-[#EFE7DC]'
            }`}
            title={t('البحث في السجاد', 'Search Carpets')}
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Admin / Moderator Dashboard Direct Access Pill */}
          {canAccessAdmin && (
            <a
              id="nav-admin-dashboard-link"
              href="/dashboard"
              className={`hidden sm:flex items-center gap-1.5 p-1.5 px-3 py-1.5 rounded-full transition-all focus:outline-none touch-manipulation text-xs font-bold shrink-0 shadow-xs ${
                isTransparent
                  ? 'bg-amber-400/25 text-amber-200 border border-amber-300/40 hover:bg-amber-400/40'
                  : 'bg-[#241710] text-[#EED8BE] hover:bg-[#3D291D] border border-[#3D291D]'
              }`}
              title={t('لوحة التحكم الإدارية', 'Admin Dashboard')}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#EED8BE]" />
              <span>{t('لوحة التحكم', 'Dashboard')}</span>
            </a>
          )}

          {/* User Account Portal / Dropdown (Phase 1) */}
          {user ? (
            <div ref={userDropdownRef} className="relative">
              <button
                id="nav-account-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
                className={`p-1.5 sm:px-3 sm:py-2 rounded-full transition-colors focus:outline-none touch-manipulation flex items-center gap-1.5 shrink-0 ${
                  isTransparent
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : userDropdownOpen || activeView === 'account'
                    ? 'text-[#A27B5C] bg-[#EFE7DC]'
                    : 'text-[#5C4A3E] hover:text-[#241710] hover:bg-[#EFE7DC]'
                }`}
                title={t('حسابي والخيارات', 'My Account & Options')}
                aria-label="Account menu"
              >
                <div className="relative">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 ring-1 sm:ring-2 ring-white" />
                </div>
                <span className="hidden md:inline-block text-[11px] font-medium tracking-normal truncate max-w-[90px]">
                  {user.first_name || user.phone}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 text-[#8C7A6B] ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute end-0 top-full mt-2 w-64 rounded-2xl bg-white border border-[#EAE3D8] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-right"
                  dir="rtl"
                >
                  {/* User Profile Summary */}
                  <div className="px-4 py-2.5 border-b border-[#F0EAE1]">
                    <p className="text-xs font-bold text-[#241710] truncate">
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.phone}
                    </p>
                    <p className="text-[10px] text-[#8C7A6B] truncate font-mono mt-0.5">
                      {user.phone ? `هاتف: ${user.phone}` : user.email || 'عميل المتجر'}
                    </p>
                    <div className="mt-1.5">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          userRole === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : userRole === 'moderator'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-[#FAF5EB] text-[#8C7A6B] border border-[#E8DEC0]'
                        }`}
                      >
                        {userRole === 'admin'
                          ? 'مدير النظام (Admin)'
                          : userRole === 'moderator'
                          ? 'مشرف النظام'
                          : 'عميل المتجر'}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1">
                    <button
                      role="menuitem"
                      id="dropdown-account-link"
                      onClick={() => handleNavClick('account')}
                      className="w-full px-4 py-2 text-start text-xs font-semibold text-[#3D2C20] hover:bg-[#FAF8F5] hover:text-[#241710] flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-[#A27B5C]" />
                      <span>{t('حسابي والطلبات', 'My Account & Orders')}</span>
                    </button>

                    {canAccessAdmin && (
                      <a
                        role="menuitem"
                        id="dropdown-dashboard-link"
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full px-4 py-2 text-start text-xs font-semibold text-[#3D2C20] hover:bg-[#FAF8F5] hover:text-[#241710] flex items-center gap-2.5 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#A27B5C]" />
                        <span>{t('لوحة تحكم الإدارة (Dashboard)', 'Admin Dashboard')}</span>
                      </a>
                    )}
                  </div>

                  {/* Phase 1 Logout inside dropdown */}
                  <div className="pt-1 border-t border-[#F0EAE1]">
                    <button
                      role="menuitem"
                      id="dropdown-logout-btn"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full px-4 py-2 text-start text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                    >
                      {isLoggingOut ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <LogOut className="w-4 h-4 text-rose-600" />
                      )}
                      <span>
                        {isLoggingOut ? t('جاري تسجيل الخروج...', 'Logging out...') : t('تسجيل الخروج', 'Log Out')}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="nav-account-btn"
              onClick={() => handleNavClick('account')}
              className={`p-1.5 sm:px-3 sm:py-2 rounded-full transition-colors focus:outline-none touch-manipulation flex items-center gap-1.5 shrink-0 ${
                isTransparent
                  ? 'text-white/90 hover:text-white hover:bg-white/10'
                  : activeView === 'account'
                  ? 'text-[#A27B5C] bg-[#EFE7DC]'
                  : 'text-[#5C4A3E] hover:text-[#241710] hover:bg-[#EFE7DC]'
              }`}
              title={t('تسجيل الدخول / حسابي', 'Sign In / Account')}
              aria-label="Account"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline-block text-[11px] font-medium tracking-normal">
                {t('تسجيل الدخول', 'Sign In')}
              </span>
            </button>
          )}

          {/* Shopping Bag Trigger */}
          <button
            id="nav-cart-btn"
            onClick={() => setIsCartDrawerOpen(true)}
            className={`relative p-1.5 sm:p-2.5 rounded-full transition-colors focus:outline-none touch-manipulation flex items-center justify-center shrink-0 ${
              isTransparent
                ? 'text-white hover:bg-white/10'
                : 'text-[#241710] hover:bg-[#EFE7DC]'
            }`}
            title={t('سلة المشتريات', 'Shopping Cart')}
            aria-label="Cart"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#A27B5C] text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            id="nav-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-1.5 sm:p-2.5 rounded-full transition-colors focus:outline-none lg:hidden touch-manipulation shrink-0 ${
              isTransparent
                ? 'text-white hover:bg-white/10'
                : 'text-[#241710] hover:bg-[#EFE7DC]'
            }`}
            title={t('القائمة الرئيسية', 'Main Menu')}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
            ) : (
              <Menu className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar on Top */}
      {isSearchOpen && (
        <div className="bg-[#FAF6F0] border-t border-b border-[#E8DEC0] px-4 py-3 sm:px-8 animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="w-5 h-5 text-[#8A7565]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                'ابحث عن سجاد تركي، شرقي، أروال بالمتر، بدائل سجاد...',
                'Search Turkish carpets, oriental rugs, custom runners, alternatives...'
              )}
              className="w-full bg-transparent text-sm sm:text-base text-[#241710] placeholder-[#9C8A7C] focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#8A7565] hover:text-[#241710] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FBF9F5] border-b border-[#EAE3D8] shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="px-5 pt-4 pb-6 space-y-4">
            {/* Direct Search in Mobile Menu */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('ابحث عن سجاد أو رول...', 'Search carpets or runners...')}
                className="w-full px-4 py-2.5 pe-10 bg-[#EFEBE3] text-sm rounded-xl border border-[#DFD7CB] text-[#241710] placeholder-[#8F7D70] focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
              />
              <Search className="w-4 h-4 text-[#8F7D70] absolute top-3.5 end-3 pointer-events-none" />
            </div>

            {/* Admin / Moderator Mobile Direct Access */}
            {canAccessAdmin && (
              <a
                href="/dashboard"
                id="nav-mobile-admin-link"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#241710] text-[#EED8BE] flex items-center justify-between text-xs font-bold shadow-xs border border-[#3D291D]"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#EED8BE]" />
                  <span>{t('لوحة تحكم الإدارة (Dashboard)', 'Admin Dashboard')}</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/15 text-white">
                  {user?.role}
                </span>
              </a>
            )}

            {/* User Session & Logout in Mobile Menu */}
            {user ? (
              <div className="p-3 rounded-xl bg-[#FAF5EB] border border-[#E8DEC0] space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-[#241710] text-[#EED8BE] flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#241710] truncate">
                        {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.phone}
                      </p>
                      <p className="text-[10px] text-[#8C7A6B] truncate">
                        {user.phone ? `هاتف: ${user.phone}` : user.email || 'عميل المتجر'}
                      </p>
                    </div>
                  </div>

                  <button
                    id="nav-mobile-logout-btn"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-xs"
                    title={t('تسجيل الخروج', 'Log Out')}
                  >
                    {isLoggingOut ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>{isLoggingOut ? t('جاري...', 'Logging out...') : t('تسجيل الخروج', 'Logout')}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#EAE3D8] flex gap-2">
                  <button
                    onClick={() => handleNavClick('account')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-[#EAE3D8] text-xs font-bold text-[#241710] text-center"
                  >
                    {t('حسابي والطلبات', 'My Account & Orders')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('account')}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#FAF5EB] border border-[#E8DEC0] text-[#241710] flex items-center justify-center gap-2 text-xs font-bold shadow-xs hover:bg-[#F2E8D7] transition-colors"
              >
                <User className="w-4 h-4 text-[#A27B5C]" />
                <span>{t('تسجيل الدخول / حساب جديد', 'Sign In / Register')}</span>
              </button>
            )}

            {/* Navigation Links (Dynamic Backend Categories) */}
            <div className="space-y-1 divide-y divide-[#EFE8DD]/70">
              {/* Home */}
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full py-2.5 flex items-center justify-between text-start text-sm font-semibold transition-colors ${
                  activeView === 'home' ? 'text-[#A27B5C]' : 'text-[#241710] hover:text-[#A27B5C]'
                }`}
              >
                <span>{t('الرئيسية', 'Home')}</span>
                <ArrowIcon className="w-4 h-4 text-[#9C8A7C]" />
              </button>

              {/* All Carpets */}
              <button
                onClick={() => handleNavClick('shop')}
                className={`w-full py-2.5 flex items-center justify-between text-start text-sm font-semibold transition-colors ${
                  activeView === 'shop' && !selectedCategoryId
                    ? 'text-[#A27B5C]'
                    : 'text-[#241710] hover:text-[#A27B5C]'
                }`}
              >
                <span>{t('كل السجاد والتشكيلات', 'All Carpets & Collections')}</span>
                <ArrowIcon className="w-4 h-4 text-[#9C8A7C]" />
              </button>

              {/* Backend Categories */}
              {categories.slice(0, 6).map((cat) => {
                const isCatActive = activeView === 'shop' && selectedCategoryId === String(cat.id);
                return (
                  <button
                    key={`mobile-cat-${cat.id}`}
                    onClick={() => handleNavClick('shop', cat.id)}
                    className={`w-full py-2.5 flex items-center justify-between text-start text-sm font-semibold transition-colors ${
                      isCatActive ? 'text-[#A27B5C]' : 'text-[#241710] hover:text-[#A27B5C]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FolderTree className="w-3.5 h-3.5 text-[#A27B5C]" />
                      <span>{cat.name}</span>
                    </span>
                    <ArrowIcon className="w-4 h-4 text-[#9C8A7C]" />
                  </button>
                );
              })}

              {/* Showroom */}
              <button
                onClick={() => handleNavClick('contact')}
                className={`w-full py-2.5 flex items-center justify-between text-start text-sm font-semibold transition-colors ${
                  activeView === 'contact' ? 'text-[#A27B5C]' : 'text-[#241710] hover:text-[#A27B5C]'
                }`}
              >
                <span>{t('معرض المنصورة', 'Showroom')}</span>
                <ArrowIcon className="w-4 h-4 text-[#9C8A7C]" />
              </button>
            </div>

            {/* Quick Contact & Showroom Links in Mobile Menu */}
            <div className="pt-3 border-t border-[#EAE3D8] flex flex-col gap-2.5 text-xs text-[#5C4A3E]">
              <a
                href={BRAND_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#EFE8DD] text-[#241710] font-medium"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>{t('تواصل عبر واتساب:', 'Chat on WhatsApp:')} {BRAND_CONFIG.phoneDisplay}</span>
              </a>
              <a
                href={BRAND_CONFIG.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#EFE8DD] text-[#241710] font-medium"
              >
                <MapPin className="w-4 h-4 text-[#A27B5C]" />
                <span>{t('موقع المعرض على خرائط جوجل', 'Showroom on Google Maps')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
