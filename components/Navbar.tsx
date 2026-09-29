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
      {/* Top micro announcement bar (Luxury e-commerce banner) */}
      <div className="bg-[#1C120B] text-[#EDE6DC] text-[11px] sm:text-xs py-1.5 px-4 border-b border-[#2C1D13]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#D2C3B4]">
            <Truck className="w-3.5 h-3.5 text-[#C49F74] shrink-0" />
            <span className="hidden sm:inline font-medium">
              {t('شحن وتوصيل لجميع المحافظات · معاينة السجاد قبل الاستلام', 'Fast shipping to all Egyptian governorates · Inspection upon delivery')}
            </span>
            <span className="sm:hidden font-medium">
              {t('شحن ومعاينة لكافة المحافظات', 'Shipping across Egypt')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="hidden md:inline text-[#C49F74]">
              {t('معرض المنصورة: يومياً من ١٠ ص حتى ١١ م', 'Mansoura Showroom: Daily 10 AM - 11 PM')}
            </span>
            <a
              href={BRAND_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#EFEBE4] hover:text-[#25D366] transition-colors font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="font-mono">{BRAND_CONFIG.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Identity / Logo */}
        <button
          id="nav-logo-btn"
          onClick={() => handleNavClick('home')}
          className="group flex items-center text-start focus:outline-none touch-manipulation"
          aria-label="عالم السجاد - Alamelsgad"
        >
          <AlamelsgadLogo
            size="md"
            variant="horizontal"
            theme={isTransparent ? 'light' : 'dark'}
            showTagline={true}
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
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className={`px-2.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 border ${
              isTransparent
                ? 'text-white border-white/20 hover:bg-white/10'
                : 'text-[#473428] border-[#E8DEC0] bg-[#FAF5EB] hover:bg-[#F2E8D7]'
            }`}
            title={t('تغيير اللغة إلى English', 'Switch to Arabic')}
            aria-label="Toggle language"
          >
            <Languages className="w-3.5 h-3.5 text-[#A27B5C]" />
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
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
            className={`p-2.5 rounded-full transition-colors focus:outline-none touch-manipulation ${
              isTransparent
                ? 'text-white/90 hover:text-white hover:bg-white/10'
                : 'text-[#5C4A3E] hover:text-[#241710] hover:bg-[#EFE7DC]'
            }`}
            title={t('البحث في السجاد', 'Search Carpets')}
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* User Account Portal */}
          <button
            id="nav-account-btn"
            onClick={() => handleNavClick('account')}
            className={`p-2 sm:px-3 sm:py-2 rounded-full transition-colors focus:outline-none touch-manipulation flex items-center gap-1.5 ${
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
              <User className="w-4 h-4" />
              {user && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            {user && (
              <span className="hidden sm:inline-block text-[11px] font-medium tracking-normal truncate max-w-[90px]">
                {user.first_name || user.email}
              </span>
            )}
          </button>

          {/* Shopping Bag Trigger */}
          <button
            id="nav-cart-btn"
            onClick={() => setIsCartDrawerOpen(true)}
            className={`relative p-2.5 rounded-full transition-colors focus:outline-none touch-manipulation flex items-center justify-center ${
              isTransparent
                ? 'text-white hover:bg-white/10'
                : 'text-[#241710] hover:bg-[#EFE7DC]'
            }`}
            title={t('سلة المشتريات', 'Shopping Cart')}
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#A27B5C] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors focus:outline-none touch-manipulation ${
              isTransparent
                ? 'text-white hover:bg-white/10'
                : 'text-[#241710] hover:bg-[#EFE7DC]'
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
