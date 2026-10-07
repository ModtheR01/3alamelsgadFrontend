'use client';

import React, { useState, useEffect } from 'react';
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
  Phone,
  MessageCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar() {
  const {
    activeView,
    navigateTo,
    cartItemsCount,
    setIsCartDrawerOpen,
    searchQuery,
    setSearchQuery,
    categories,
  } = useToccoStore();

  const { user } = useAuth();
  const { language, toggleLanguage, t, isRtl } = useLanguage();

  const userRole = (user?.role || '').toLowerCase();
  const canAccessAdmin = userRole === 'admin' || userRole === 'moderator';

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { labelAr: string; labelEn: string; view: AppView; highlight?: boolean }[] = [
    { labelAr: 'الرئيسية', labelEn: 'Home', view: 'home' },
    { labelAr: 'كل السجاد', labelEn: 'All Carpets', view: 'shop' },
    { labelAr: 'سجاد تركي فاخر', labelEn: 'Turkish Carpets', view: 'shop' },
    { labelAr: 'سجاد شرقي أصيل', labelEn: 'Oriental Rugs', view: 'shop' },
    { labelAr: 'رولات أروال بالمتر', labelEn: 'Runner Rolls', view: 'shop', highlight: true },
    { labelAr: 'بدائل السجاد', labelEn: 'Modern Alternatives', view: 'shop' },
    { labelAr: 'معرض المنصورة', labelEn: 'Showroom', view: 'contact' },
  ];

  const handleNavClick = (view: AppView, categoryId?: string) => {
    if (view === 'shop' && categoryId) {
      navigateTo(view, { categoryId });
    } else {
      navigateTo(view);
    }
    setMobileMenuOpen(false);
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

        {/* Center: Desktop Navigation Links */}
        <nav
          id="desktop-nav-links"
          className="hidden lg:flex items-center gap-6 xl:gap-8 text-[13px] font-semibold tracking-normal"
        >
          {navLinks.map((link) => {
            const isActive = activeView === link.view;
            return (
              <button
                key={`${link.view}-${link.labelEn}`}
                id={`nav-link-${link.view}`}
                onClick={() => handleNavClick(link.view)}
                className={`relative py-1.5 transition-colors duration-200 ${
                  link.highlight ? 'text-[#A27B5C] hover:text-[#7A5437]' : ''
                } ${
                  isTransparent
                    ? isActive
                      ? 'text-white font-bold'
                      : 'text-white/85 hover:text-white'
                    : isActive
                    ? 'text-[#241710] font-bold'
                    : 'text-[#5C4A3E] hover:text-[#241710]'
                }`}
              >
                <span>{language === 'ar' ? link.labelAr : link.labelEn}</span>
                {isActive && (
                  <span
                    className={`absolute bottom-0 inset-x-0 h-[2px] rounded-full animate-in fade-in duration-200 ${
                      isTransparent ? 'bg-white' : 'bg-[#A27B5C]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions (Search, Language Switcher, Account, Cart, Mobile Toggle) */}
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

          {/* Admin / Moderator Dashboard Direct Access */}
          {canAccessAdmin && (
            <a
              id="nav-admin-dashboard-link"
              href="/dashboard"
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-full transition-all focus:outline-none touch-manipulation flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-xs ${
                isTransparent
                  ? 'bg-amber-400/25 text-amber-200 border border-amber-300/40 hover:bg-amber-400/40'
                  : 'bg-[#241710] text-[#EED8BE] hover:bg-[#3D291D] border border-[#3D291D]'
              }`}
              title={t('لوحة التحكم الإدارية', 'Admin Dashboard')}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#EED8BE]" />
              <span className="hidden sm:inline">{t('لوحة التحكم', 'Dashboard')}</span>
            </a>
          )}

          {/* User Account Portal */}
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
            title={t('حسابي والطلبات', 'My Account & Orders')}
            aria-label="Account"
          >
            <div className="relative">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {user && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 ring-1 sm:ring-2 ring-white" />
              )}
            </div>
            {user && (
              <span className="hidden md:inline-block text-[11px] font-medium tracking-normal truncate max-w-[90px]">
                {user.first_name || user.email}
              </span>
            )}
          </button>

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

            {/* Navigation Links */}
            <div className="space-y-1 divide-y divide-[#EFE8DD]/70">
              {navLinks.map((link) => (
                <button
                  key={`mobile-${link.view}-${link.labelEn}`}
                  onClick={() => handleNavClick(link.view)}
                  className={`w-full py-3 flex items-center justify-between text-start text-sm font-semibold transition-colors ${
                    activeView === link.view
                      ? 'text-[#A27B5C]'
                      : 'text-[#241710] hover:text-[#A27B5C]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {language === 'ar' ? link.labelAr : link.labelEn}
                    {link.highlight && (
                      <span className="text-[10px] bg-[#A27B5C]/15 text-[#865F3E] px-2 py-0.5 rounded font-normal">
                        {t('حسب طلبك', 'Custom')}
                      </span>
                    )}
                  </span>
                  <ArrowIcon className="w-4 h-4 text-[#9C8A7C]" />
                </button>
              ))}
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
