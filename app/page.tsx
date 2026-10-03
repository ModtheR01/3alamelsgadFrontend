'use client';

import React, { useEffect } from 'react';
import { StoreProvider, useToccoStore } from '@/lib/store';
import { AuthProvider, useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import {
  HomeHero,
  CategoriesShowcase,
  StoryTeaserSection,
  CustomersReviewsSection,
} from '@/components/HomeSections';
import ShopCatalog from '@/components/ShopCatalog';
import ProductDetailView from '@/components/ProductDetailView';
import CustomDesignView from '@/components/CustomDesignView';
import B2BView from '@/components/B2BView';
import OurStoryView from '@/components/OurStoryView';
import EventsView from '@/components/EventsView';
import ProjectsView from '@/components/ProjectsView';
import CheckoutView from '@/components/CheckoutView';
import OrderConfirmationView from '@/components/OrderConfirmationView';
import AccountView from '@/components/AccountView';
import AdminDashboard from '@/components/AdminDashboard';
import {
  ShippingView,
  ReturnsView,
  FaqView,
  ContactView,
  PrivacyView,
  TermsView,
} from '@/components/ContentPages';
import { MessageCircle } from 'lucide-react';

function AlamelsgadApp() {
  const { activeView, navigateTo, syncGuestCart } = useToccoStore();
  const { user, isLoading } = useAuth();
  const { t, isRtl } = useLanguage();

  // Push locally-held guest cart items into backend cart once a user signs in
  const wasAuthenticated = React.useRef(false);
  useEffect(() => {
    if (user && !wasAuthenticated.current) {
      syncGuestCart();
    }
    wasAuthenticated.current = Boolean(user);
  }, [user, syncGuestCart]);

  const canAccessAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  useEffect(() => {
    if (!isLoading && activeView === 'admin' && !canAccessAdmin) {
      navigateTo('home');
    }
  }, [activeView, canAccessAdmin, isLoading, navigateTo]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView]);

  // Read URL query parameters on initial mount if any
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const routeParam = params.get('route');
      const productParam = params.get('product');

      if (productParam) {
        navigateTo('product', { productId: productParam });
      } else if (routeParam) {
        navigateTo(routeParam as any);
      }
    }
  }, [navigateTo]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#21160F]">
      {/* Navigation */}
      <Navbar />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeView === 'home' && (
          <div>
            <HomeHero />
            <CategoriesShowcase />
            <StoryTeaserSection />
            <CustomersReviewsSection />
          </div>
        )}

        {activeView === 'shop' && <ShopCatalog />}

        {activeView === 'product' && <ProductDetailView />}

        {activeView === 'custom-design' && <CustomDesignView />}

        {activeView === 'b2b' && <B2BView />}

        {activeView === 'our-story' && <OurStoryView />}

        {activeView === 'events' && <EventsView />}

        {activeView === 'projects' && <ProjectsView />}

        {activeView === 'checkout' && <CheckoutView />}

        {activeView === 'confirmation' && <OrderConfirmationView />}

        {activeView === 'account' && <AccountView />}

        {activeView === 'admin' && canAccessAdmin && <AdminDashboard />}

        {activeView === 'shipping' && <ShippingView />}

        {activeView === 'returns' && <ReturnsView />}

        {activeView === 'faq' && <FaqView />}

        {activeView === 'contact' && <ContactView />}

        {activeView === 'privacy' && <PrivacyView />}

        {activeView === 'terms' && <TermsView />}
      </main>

      {/* Footer */}
      {activeView !== 'admin' && <Footer />}

      {/* Slide-over Shopping Bag Drawer */}
      <CartDrawer />

      {/* Floating Official Alamelsgad WhatsApp Concierge Button */}
      {activeView !== 'admin' && (
        <aside
          aria-label="خدمة عملاء عالم السجاد"
          className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} z-40`}
        >
          <a
            id="floating-whatsapp-concierge"
            href={BRAND_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تواصل مع عالم السجاد عبر واتساب"
            className="group flex items-center gap-2 p-3.5 rounded-full bg-[#25D366] text-white shadow-2xl hover:bg-[#20BA5A] active:scale-95 transition-all border border-white/20"
            title="تواصل معنا عبر واتساب"
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline text-xs font-bold font-sans">
              {t('محادثة واتساب', 'WhatsApp')}
            </span>
          </a>
        </aside>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <AuthProvider>
        <AlamelsgadApp />
      </AuthProvider>
    </StoreProvider>
  );
}
