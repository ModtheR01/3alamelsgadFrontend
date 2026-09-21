'use client';

import React from 'react';
import { useToccoStore, AppView } from '@/lib/store';
import { Home, Compass, Sparkles, ShoppingBag, MessageCircle } from 'lucide-react';

export default function MobileBottomNav() {
  const {
    activeView,
    navigateTo,
    cartItemsCount,
    setIsCartDrawerOpen,
    settings,
  } = useToccoStore();

  // Hide in admin CMS so it doesn't collide with table/form controls
  if (activeView === 'admin') {
    return null;
  }

  const whatsappUrl = `https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    'Hello Tocco House Atelier Concierge, I would like to inquire about your pieces.'
  )}`;

  const tabs: {
    id: string;
    label: string;
    icon: React.ElementType;
    action: () => void;
    isActive: boolean;
    badge?: number;
  }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => navigateTo('home'),
      isActive: activeView === 'home',
    },
    {
      id: 'shop',
      label: 'Catalog',
      icon: Compass,
      action: () => navigateTo('shop'),
      isActive: activeView === 'shop' || activeView === 'product',
    },
    {
      id: 'custom',
      label: 'Bespoke',
      icon: Sparkles,
      action: () => navigateTo('custom-design'),
      isActive: activeView === 'custom-design',
    },
    {
      id: 'bag',
      label: 'Bag',
      icon: ShoppingBag,
      action: () => setIsCartDrawerOpen(true),
      isActive: false,
      badge: cartItemsCount,
    },
    {
      id: 'concierge',
      label: 'Concierge',
      icon: MessageCircle,
      action: () => window.open(whatsappUrl, '_blank'),
      isActive: false,
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation-bar"
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-lg border-t border-[#EAE4DC] shadow-[0_-4px_24px_rgba(40,25,15,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-15 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isCurrent = tab.isActive;
          const isConcierge = tab.id === 'concierge';

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={tab.action}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 relative transition-all duration-200 touch-manipulation focus:outline-none ${
                isCurrent ? 'text-[#643D26]' : 'text-[#736B63] hover:text-[#1C1A19]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isCurrent ? 'scale-110 stroke-[2.2]' : 'stroke-[1.7]'
                  } ${isConcierge ? 'text-[#25D366]' : ''}`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 bg-[#643D26] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
                {isConcierge && (
                  <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                )}
              </div>
              <span
                className={`text-[9px] uppercase tracking-wider mt-1 transition-all ${
                  isCurrent ? 'font-semibold text-[#643D26]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
              {isCurrent && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-[#643D26] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
