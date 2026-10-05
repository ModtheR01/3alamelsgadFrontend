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
            <AlamelsgadLogo size="md" variant="horizontal" theme="light" showTagline={false} />

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
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.8-1.501-1.788-1.677-2.089-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.3-.502.101-.2.05-.376-.025-.526-.075-.15-.678-1.634-.929-2.239-.245-.589-.494-.509-.678-.518-.176-.009-.377-.01-.578-.01-.201 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.201 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.23 1.379.197 1.898.12.578-.087 1.78-.727 2.03-1.43.251-.703.251-1.306.176-1.43-.075-.125-.276-.201-.577-.351zM12.04 21.73h-.008a9.71 9.71 0 0 1-4.954-1.353l-.355-.211-3.682.966.983-3.59-.231-.368A9.707 9.707 0 0 1 2.33 12.04c0-5.367 4.366-9.733 9.736-9.733 2.6 0 5.044 1.013 6.882 2.852 1.839 1.84 2.85 4.285 2.849 6.885 0 5.368-4.367 9.686-9.757 9.686zm8.307-18.04A11.666 11.666 0 0 0 12.039.25C5.539.25.253 5.536.25 12.04a11.688 11.688 0 0 0 1.567 5.869L0 24l6.257-1.642a11.678 11.678 0 0 0 5.776 1.523h.005c6.498 0 11.787-5.288 11.79-11.793a11.72 11.72 0 0 0-3.481-8.398z" />
                </svg>
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
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
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
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.9-4.49V8.41a8.3 8.3 0 0 0 5.07 1.73V6.69h-1.2Z" />
                </svg>
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
