'use client';

import React, { useEffect } from 'react';
import { StoreProvider, useToccoStore } from '@/lib/store';
import { toWhatsAppNumber } from '@/lib/utils';
import { AuthProvider } from '@/lib/context/AuthContext';
import { useAuth } from '@/lib/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import BannersSection from '@/components/BannersSection';
import {
  HomeHero,
  SignaturePiecesSection,
  StoryTeaserSection,
  CategoriesShowcase,
  CollaborationsSection,
  CustomDesignTeaser,
  ProjectsAndInstagramSection,
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

function ToccoApp() {
  const { activeView, navigateTo, settings } = useToccoStore();
  const { user, isLoading } = useAuth();

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

  const whatsappConciergeUrl = `https://wa.me/${toWhatsAppNumber(settings.contact.whatsapp)}?text=${encodeURIComponent(
    'Hello Tocco House, I am inquiring about your handcrafted fiberglass design pieces.'
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1A19]">
      {/* Navigation */}
      <Navbar />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeView === 'home' && (
          <div>
            <HomeHero />
            <BannersSection />
            <SignaturePiecesSection />
            <StoryTeaserSection />
            <CategoriesShowcase />
            <CustomDesignTeaser />
            <CollaborationsSection />
            <ProjectsAndInstagramSection />
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

      {/* Footer (hidden in admin to keep CMS focused) */}
      {activeView !== 'admin' && <Footer />}

      {/* Slide-over Bag Drawer */}
      <CartDrawer />

      {/* Floating Atelier WhatsApp Concierge (visible everywhere except Admin) */}
      {activeView !== 'admin' && (
        <aside
          aria-label="Atelier Concierge"
          className="fixed bottom-6 right-6 z-40"
        >
          <a
            id="floating-whatsapp-concierge"
            href={whatsappConciergeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with Tocco House Atelier Concierge on WhatsApp"
            className="group flex items-center justify-center p-3 rounded-full bg-[#1C1A19] text-white shadow-xl hover:bg-[#332F2D] active:scale-95 transition-all border border-white/10"
            title="Chat with Tocco House Atelier Concierge"
          >
            <MessageCircle className="w-5 h-5 text-[#25D366]" aria-hidden="true" />
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
        <ToccoApp />
      </AuthProvider>
    </StoreProvider>
  );
}
