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
  NewArrivalSection,
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
            <NewArrivalSection />
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
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.8-1.501-1.788-1.677-2.089-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.3-.502.101-.2.05-.376-.025-.526-.075-.15-.678-1.634-.929-2.239-.245-.589-.494-.509-.678-.518-.176-.009-.377-.01-.578-.01-.201 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.201 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.23 1.379.197 1.898.12.578-.087 1.78-.727 2.03-1.43.251-.703.251-1.306.176-1.43-.075-.125-.276-.201-.577-.351zM12.04 21.73h-.008a9.71 9.71 0 0 1-4.954-1.353l-.355-.211-3.682.966.983-3.59-.231-.368A9.707 9.707 0 0 1 2.33 12.04c0-5.367 4.366-9.733 9.736-9.733 2.6 0 5.044 1.013 6.882 2.852 1.839 1.84 2.85 4.285 2.849 6.885 0 5.368-4.367 9.686-9.757 9.686zm8.307-18.04A11.666 11.666 0 0 0 12.039.25C5.539.25.253 5.536.25 12.04a11.688 11.688 0 0 0 1.567 5.869L0 24l6.257-1.642a11.678 11.678 0 0 0 5.776 1.523h.005c6.498 0 11.787-5.288 11.79-11.793a11.72 11.72 0 0 0-3.481-8.398z" />
            </svg>
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
