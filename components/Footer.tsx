'use client';

import React from 'react';
import { useToccoStore, AppView } from '@/lib/store';
import ToccoLogo, { ToccoMark } from './ToccoLogo';
import { MessageCircle, Instagram, Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const { navigateTo, settings } = useToccoStore();

  const handleLink = (view: AppView) => {
    navigateTo(view);
  };

  const whatsappUrl = `https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    'Hello Tocco House, I would like to enquire about your design pieces.'
  )}`;

  return (
    <footer id="main-site-footer" className="bg-[#1C1A19] text-[#FAF8F5] pt-16 sm:pt-20 pb-24 sm:pb-12 border-t border-[#2E2B29]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 pb-12 sm:pb-16 border-b border-[#2E2B29]">
          {/* Brand Column (5 cols) */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3">
              <ToccoMark size={40} fillColor="#FFFFFF" circleBg="#4A2E1C" />
              <div className="flex flex-col leading-tight">
                <span className="text-lg sm:text-xl font-medium tracking-[0.25em] uppercase text-white">
                  TOCCO HOUSE
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-[#B8AFA6]">
                  The Touch That Elevates
                </span>
              </div>
            </div>

            <p className="text-[#A8A199] text-xs sm:text-sm leading-relaxed max-w-md">
              A contemporary Egyptian design house creating distinctive fiberglass furniture,
              architectural objects, and sculptural focal pieces. Designed to be noticed. Made to be
              lived with.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs tracking-wider uppercase text-[#C4BCB3]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B85D38]" />
                Cairo Atelier
              </span>
              <span>·</span>
              <span>Mediterranean Living</span>
              <span>·</span>
              <span>Worldwide Crating</span>
            </div>
          </div>

          {/* Explore Links (2 cols) */}
          <div className="space-y-3 sm:space-y-4 lg:col-span-2">
            <h4 className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#8F8880] font-semibold">
              Explore
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-[#D1CBC3]">
              <li>
                <button
                  onClick={() => handleLink('shop')}
                  className="hover:text-white transition-colors"
                >
                  Shop Catalog
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('collections')}
                  className="hover:text-white transition-colors"
                >
                  Curated Collections
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('our-story')}
                  className="hover:text-white transition-colors"
                >
                  Our Story & Atelier
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('custom-design')}
                  className="hover:text-white transition-colors"
                >
                  Custom Design
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('events')}
                  className="hover:text-white transition-colors"
                >
                  Exhibitions & Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('projects')}
                  className="hover:text-white transition-colors"
                >
                  In Their Space (Projects)
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care (2 cols) */}
          <div className="space-y-3 sm:space-y-4 lg:col-span-2">
            <h4 className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#8F8880] font-semibold">
              Customer Care
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-[#D1CBC3]">
              <li>
                <button
                  onClick={() => handleLink('shipping')}
                  className="hover:text-white transition-colors"
                >
                  Shipping & Delivery
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('returns')}
                  className="hover:text-white transition-colors"
                >
                  Returns & Guarantee
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('faq')}
                  className="hover:text-white transition-colors"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('account')}
                  className="hover:text-white transition-colors"
                >
                  Order Status & Tracking
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('contact')}
                  className="hover:text-white transition-colors"
                >
                  Atelier Concierge
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & WhatsApp (3 cols) */}
          <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-3">
            <h4 className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#8F8880] font-semibold">
              Atelier & Contact
            </h4>
            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-[#D1CBC3]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B85D38] shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">{settings.contact.atelierAddress}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B85D38] shrink-0" />
                <span className="text-xs font-mono">{settings.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B85D38] shrink-0" />
                <span className="text-xs font-mono">{settings.contact.email}</span>
              </div>

              {/* Direct WhatsApp Concierge CTA */}
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#2A2624] hover:bg-[#383330] text-xs uppercase tracking-wider text-white border border-[#403A36] transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp Concierge</span>
                  <ArrowUpRight className="w-3 h-3 text-[#A8A199]" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-xs text-[#8F8880] text-center sm:text-left">
          <p>© {new Date().getFullYear()} Tocco House LLC. All rights reserved. Handcrafted in Egypt.</p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => handleLink('privacy')}
              className="hover:text-[#D1CBC3] transition-colors"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <button
              onClick={() => handleLink('terms')}
              className="hover:text-[#D1CBC3] transition-colors"
            >
              Terms & Conditions
            </button>
            <span>·</span>
            <a
              href="https://instagram.com/tocco_house"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#D1CBC3] transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@tocco_house</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
