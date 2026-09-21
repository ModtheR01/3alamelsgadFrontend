'use client';

import React, { useState, useEffect } from 'react';
import { useToccoStore, AppView } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import ToccoLogo from './ToccoLogo';
import { ShoppingBag, User, Search, Menu, X, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function Navbar() {
  const {
    activeView,
    navigateTo,
    cartItemsCount,
    setIsCartDrawerOpen,
    searchQuery,
    setSearchQuery,
  } = useToccoStore();

  const { user } = useAuth();

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

  const navLinks: { label: string; view: AppView }[] = [
    { label: 'Shop', view: 'shop' },
    { label: 'Collections', view: 'collections' },
    { label: 'Our Story', view: 'our-story' },
    { label: 'Custom Design', view: 'custom-design' },
    { label: 'Events', view: 'events' },
    { label: 'Projects', view: 'projects' },
  ];

  const handleNavClick = (view: AppView) => {
    navigateTo(view);
    setMobileMenuOpen(false);
  };

  const isTransparent = !isScrolled && activeView === 'home' && !mobileMenuOpen && !isSearchOpen;

  return (
    <header
      id="main-navigation-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? 'bg-transparent border-b border-transparent shadow-none'
          : 'bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE4DC] shadow-[0_2px_12px_rgba(40,25,15,0.03)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <button
          id="nav-logo-btn"
          onClick={() => handleNavClick('home')}
          className="group flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#643D26]"
          aria-label="Tocco House Home"
        >
          <ToccoLogo size="sm" showSubtitle={false} theme={isTransparent ? 'light' : 'dark'} />
        </button>

        {/* Center: Editorial Navigation Links (Desktop) */}
        <nav
          id="desktop-nav-links"
          className="hidden md:flex items-center gap-8 text-[13px] tracking-[0.18em] uppercase font-medium"
        >
          {navLinks.map((link) => {
            const isActive = activeView === link.view;
            return (
              <button
                key={link.view}
                id={`nav-link-${link.view}`}
                onClick={() => handleNavClick(link.view)}
                className={`relative py-1 transition-colors duration-200 ${
                  isTransparent
                    ? isActive
                      ? 'text-white font-semibold'
                      : 'text-white/85 hover:text-white'
                    : isActive
                    ? 'text-[#1C1A19] font-semibold'
                    : 'text-[#4A4540] hover:text-[#1C1A19]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[1.5px] animate-in fade-in duration-200 ${
                      isTransparent ? 'bg-white' : 'bg-[#643D26]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-4">
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
                : 'text-[#4A4540] hover:text-[#1C1A19] hover:bg-[#F2EDE4]'
            }`}
            title="Search Catalog"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Account Portal */}
          <button
            id="nav-account-btn"
            onClick={() => handleNavClick('account')}
            className={`p-2 sm:px-3 sm:py-2 rounded-full transition-colors focus:outline-none touch-manipulation flex items-center gap-1.5 ${
              isTransparent
                ? 'text-white/90 hover:text-white hover:bg-white/10'
                : activeView === 'account'
                ? 'text-[#643D26] bg-[#EFEBE3]'
                : 'text-[#4A4540] hover:text-[#1C1A19] hover:bg-[#F2EDE4]'
            }`}
            title="Customer Account & Order Tracking"
            aria-label="Account"
          >
            <div className="relative">
              <User className="w-4 h-4" />
              {user && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            {user && (
              <span className="hidden sm:inline-block text-[11px] font-medium tracking-normal capitalize truncate max-w-[90px]">
                {user.first_name}
              </span>
            )}
          </button>

          {/* Cart Bag */}
          <button
            id="nav-cart-btn"
            onClick={() => setIsCartDrawerOpen(true)}
            className={`relative p-2.5 rounded-full transition-colors focus:outline-none touch-manipulation ${
              isTransparent
                ? 'text-white/90 hover:text-white hover:bg-white/10'
                : 'text-[#4A4540] hover:text-[#1C1A19] hover:bg-[#F2EDE4]'
            }`}
            title="View Shopping Bag"
            aria-label="Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartItemsCount > 0 && (
              <span
                id="cart-badge-count"
                className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-[#643D26] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs ring-1 ring-white/30"
              >
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Admin Dashboard CMS Toggle (Desktop) */}
          <button
            id="nav-admin-btn"
            onClick={() => handleNavClick('admin')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-[11px] tracking-wider uppercase font-medium rounded-full border transition-all duration-200 ${
              isTransparent
                ? 'text-white border-white/40 bg-white/10 backdrop-blur-xs hover:bg-white/20 hover:border-white/70'
                : activeView === 'admin'
                ? 'bg-[#1C1A19] text-white border-[#1C1A19]'
                : 'text-[#643D26] border-[#D8CEBF] bg-[#F5F1EA] hover:border-[#643D26]'
            }`}
            title="Manage Catalogue, Orders & CMS"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Admin CMS</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2.5 rounded-full focus:outline-none touch-manipulation transition-colors ${
              isTransparent
                ? 'text-white hover:bg-white/10'
                : 'text-[#4A4540] hover:text-[#1C1A19] hover:bg-[#F2EDE4]'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Inline Search Drawer / Dropdown */}
      {isSearchOpen && (
        <div
          id="nav-search-bar"
          className="border-t border-[#EAE4DC] bg-[#FAF8F5] px-4 py-3 animate-in slide-in-from-top-2 duration-200 shadow-inner"
        >
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="w-4 h-4 text-[#736B63] shrink-0" />
            <input
              id="catalog-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== 'shop') navigateTo('shop');
              }}
              placeholder="Search pieces, categories, mineral finishes..."
              className="w-full bg-transparent text-xs sm:text-sm text-[#1C1A19] placeholder-[#8F8880] focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#736B63] hover:text-[#1C1A19] uppercase tracking-wider shrink-0"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-xs text-[#736B63] hover:text-[#1C1A19] p-1 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Navigation Full Screen Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-[#FAF8F5] z-50 flex flex-col justify-between p-6 shadow-2xl overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="space-y-6">
            {/* Quick Search on Mobile */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  navigateTo('shop');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-white border border-[#D8CEBF] rounded-full px-4 py-2.5 pl-10 text-xs text-[#1C1A19] placeholder-[#8F8880] focus:outline-none focus:border-[#643D26]"
              />
              <Search className="w-4 h-4 text-[#736B63] absolute left-3.5 top-3" />
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col space-y-1 text-sm tracking-[0.2em] uppercase font-medium text-[#4A4540]">
              {navLinks.map((link) => {
                const isActive = activeView === link.view;
                return (
                  <button
                    key={link.view}
                    onClick={() => handleNavClick(link.view)}
                    className={`text-left py-3 px-3 rounded-xl transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-[#EFEBE3] text-[#643D26] font-semibold'
                        : 'hover:bg-[#F5F2EB] text-[#332F2D]'
                    }`}
                  >
                    <span>{link.label}</span>
                    <span className="text-[10px] tracking-widest text-[#8F8880]">→</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions inside Mobile Drawer */}
          <div className="pt-6 border-t border-[#EAE4DC] space-y-3">
            <button
              onClick={() => handleNavClick('admin')}
              className="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-[#F2EDE4] text-xs uppercase tracking-widest font-medium text-[#643D26]"
            >
              <span className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4" />
                Admin CMS Studio
              </span>
              <span className="text-[10px] text-[#8F8880]">Manage</span>
            </button>

            <div className="flex items-center justify-between pt-2 text-xs text-[#8F8880]">
              <span>Tocco House Cairo</span>
              <span>Handcrafted in Egypt</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
