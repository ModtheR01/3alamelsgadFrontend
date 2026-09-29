'use client';

import React from 'react';
import { useToccoStore, AppView } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import AlamelsgadLogo from './AlamelsgadLogo';
import {
  MessageCircle,
  Instagram,
  MapPin,
  Phone,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export default function Footer() {
  const { navigateTo } = useToccoStore();
  const { t } = useLanguage();

  const handleLink = (view: AppView) => {
    navigateTo(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="main-site-footer"
      className="bg-[#1F150F] text-[#EDE6DC] pt-14 sm:pt-16 pb-20 sm:pb-14 border-t border-[#33241A]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Links & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 pb-12 sm:pb-16 border-b border-[#35251B]">
          {/* Brand Presentation (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <AlamelsgadLogo size="md" variant="horizontal" theme="light" showTagline={true} />

            <p className="text-[#B5A596] text-xs sm:text-sm leading-relaxed max-w-md">
              {t(
                'عالم السجاد: العلامة المصرية المتخصصة في تقديم أرقى تشكيلات السجاد التركي، السجاد الشرقي، بدائل السجاد، والأروال بالمتر. نحرص على تقديم الجودة والفخامة واللمسة الدافئة التي تليق بكل ركن في بيتك.',
                'Alamelsgad: The premier Egyptian brand specializing in luxurious Turkish carpets, oriental rugs, carpet alternatives, and custom runner rolls by the meter. Bringing elegance, warmth, and quiet luxury to your home.'
              )}
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-2">
              {/* WhatsApp */}
              <a
                href={BRAND_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#2B1D15] hover:bg-[#25D366] text-[#D8C7B5] hover:text-white flex items-center justify-center transition-all"
                title="WhatsApp"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              {/* Instagram */}
              <a
                href={BRAND_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#2B1D15] hover:bg-[#E1306C] text-[#D8C7B5] hover:text-white flex items-center justify-center transition-all"
                title="Instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>

              {/* Facebook */}
              <a
                href={BRAND_CONFIG.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#2B1D15] hover:bg-[#1877F2] text-[#D8C7B5] hover:text-white flex items-center justify-center transition-all"
                title="Facebook"
                aria-label="Facebook"
              >
                <span className="font-bold text-xs">f</span>
              </a>

              {/* TikTok */}
              <a
                href={BRAND_CONFIG.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#2B1D15] hover:bg-black text-[#D8C7B5] hover:text-white flex items-center justify-center transition-all"
                title="TikTok"
                aria-label="TikTok"
              >
                <span className="font-bold text-[11px]">TT</span>
              </a>

              {/* Google Maps Showroom */}
              <a
                href={BRAND_CONFIG.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#2B1D15] hover:bg-[#C49F74] text-[#D8C7B5] hover:text-white flex items-center justify-center transition-all"
                title="Google Maps Location"
                aria-label="Google Maps"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#C49F74] font-bold">
              {t('أقسام السجاد', 'Carpet Collections')}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#C8BCB0]">
              <li>
                <button
                  onClick={() => handleLink('shop')}
                  className="hover:text-white transition-colors"
                >
                  {t('جميع التشكيلات والمجموعات', 'All Collections')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('shop')}
                  className="hover:text-white transition-colors"
                >
                  {t('السجاد التركي الفاخر', 'Luxury Turkish Carpets')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('shop')}
                  className="hover:text-white transition-colors"
                >
                  {t('السجاد الشرقي والكلاسيك', 'Oriental & Classic Rugs')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('shop')}
                  className="hover:text-white transition-colors"
                >
                  {t('بدائل السجاد العصرية', 'Modern Carpet Alternatives')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('shop')}
                  className="hover:text-white transition-colors font-medium text-[#C49F74]"
                >
                  {t('الأروال والمشايات بالمتر', 'Custom Arawal Runners')}
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#C49F74] font-bold">
              {t('خدمة العملاء', 'Customer Service')}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#C8BCB0]">
              <li>
                <button
                  onClick={() => handleLink('shipping')}
                  className="hover:text-white transition-colors"
                >
                  {t('الشحن والمحافظات', 'Shipping & Delivery')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('returns')}
                  className="hover:text-white transition-colors"
                >
                  {t('سياسة الاستبدال', 'Returns Policy')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('faq')}
                  className="hover:text-white transition-colors"
                >
                  {t('الأسئلة الشائعة', 'FAQs')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('contact')}
                  className="hover:text-white transition-colors"
                >
                  {t('تواصل معنا', 'Contact Us')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLink('account')}
                  className="hover:text-white transition-colors"
                >
                  {t('تتبع الطلبات', 'Track Order')}
                </button>
              </li>
            </ul>
          </div>

          {/* Showroom & Contact (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#C49F74] font-bold">
              {t('معرضنا', 'Showroom')}
            </h4>
            <div className="space-y-3 text-xs text-[#B5A596]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C49F74] shrink-0 mt-0.5" />
                <a
                  href={BRAND_CONFIG.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors leading-relaxed"
                >
                  {t(BRAND_CONFIG.addressAr, BRAND_CONFIG.addressEn)}
                  <ArrowUpRight className="w-3 h-3 inline ms-1 text-[#C49F74]" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C49F74] shrink-0" />
                <a
                  href={`tel:${BRAND_CONFIG.phone}`}
                  className="hover:text-white transition-colors font-medium"
                >
                  {BRAND_CONFIG.phoneDisplay}
                </a>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#C49F74] shrink-0 mt-0.5" />
                <span>{t(BRAND_CONFIG.hoursAr, BRAND_CONFIG.hoursEn)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Tagline */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A796B]">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} {t('عالم السجاد. جميع الحقوق محفوظة.', 'Alamelsgad. All rights reserved.')}</span>
            <span>·</span>
            <span className="text-[#C49F74]">{t(BRAND_CONFIG.taglineAr, BRAND_CONFIG.taglineEn)}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => handleLink('privacy')} className="hover:text-white transition-colors">
              {t('سياسة الخصوصية', 'Privacy Policy')}
            </button>
            <span>·</span>
            <button onClick={() => handleLink('terms')} className="hover:text-white transition-colors">
              {t('الشروط والأحكام', 'Terms & Conditions')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
