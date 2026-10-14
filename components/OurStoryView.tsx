'use client';

import React from 'react';
import { useToccoStore } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { toWhatsAppNumber } from '@/lib/utils';
import AlamelsgadLogo, { AlamelsgadMark } from './AlamelsgadLogo';
import Image from '@/components/SafeImage';
import { Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Truck, Ruler, MapPin, MessageCircle } from 'lucide-react';

export default function OurStoryView() {
  const { navigateTo, settings } = useToccoStore();
  const { t, isRtl } = useLanguage();

  const whatsappNumber = settings.contact?.whatsapp || BRAND_CONFIG.whatsappNumber;
  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(whatsappNumber)}`;

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div id="our-story-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Philosophy Header */}
        <div className="py-8 sm:py-16 border-b border-[#EAE3D8] max-w-4xl space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3">
            <AlamelsgadMark size={40} />
            <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
              {t('فلسفة عالم السجاد', 'The Alamelsgad Philosophy')}
            </span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-[#251811] leading-tight">
            {t('لمسة تغير شكل بيتك', 'A touch that transforms your home')} <br />
            <span className="text-[#A27B5C] font-normal text-2xl sm:text-4xl">
              {t('أصالة السجاد ودفء المنزل العصري', 'Authentic carpets, modern warmth')}
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-[#5C4A3E] font-light leading-relaxed">
            {t(
              'تأسس عالم السجاد ليكون وجهة كل باحث عن التميز والراحة في بيته. نؤمن بأن السجاد ليس مجرد قطعة أثاث تكميلية، بل هو الأساس الذي يربط بين عناصر الغرفة ويمنح المكان هويته ودفئه الخاص.',
              'Alamelsgad was founded to offer discerning Egyptian homes exquisite floorings that connect comfort, authenticity, and refined interior aesthetics.'
            )}
          </p>
        </div>

        {/* Chapter 1: Turkish & Oriental Craftsmanship */}
        <div className="py-12 sm:py-20 border-b border-[#EAE3D8] grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
              {t('الفصل الأول · النسيج والريادة', 'Chapter 01 · Authentic Weaves')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#251811] tracking-tight">
              {t('خيوط تركية وشرقية بأعلى كثافة وجودة', 'High-Density Turkish & Oriental Weaves')}
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-[#5C4A3E] font-normal leading-relaxed">
              <p>
                {t(
                  'نحرص على انتقاء السجاد المصنوع من خيوط عالية الجودة والمقاومة للهبوط والاهتراء، مع ثبات الألوان ضد الغسيل المتكرر وأشعة الشمس.',
                  'We carefully select carpets made of resilient, dense fibers that resist matting and maintain vibrant colors across seasons.'
                )}
              </p>
              <p>
                {t(
                  'من السجاد التركي الحريري الناعم إلى السجاد الشرقي التراثي وبدائل السجاد خفيفة الوزن، نوفر خيارات متكاملة تلبي مختلف الأذواق والميزانيات.',
                  'From plush Turkish textures to heritage oriental patterns and washable alternatives, we cater to every room in your residence.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-[#E8DEC0]">
                <span className="font-bold text-xs text-[#251811] block mb-1">
                  {t('نعومة وملمس فائق', 'Ultra-Soft Pile')}
                </span>
                <p className="text-[11px] text-[#7A6A5E]">
                  {t('خيوط ناعمة ومريحة للأقدام صالحة لغرف الأطفال والمعيشة.', 'Comfortable plush fibers for salons and bedrooms.')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#E8DEC0]">
                <span className="font-bold text-xs text-[#251811] block mb-1">
                  {t('سهولة التنظيف', 'Stain Resistant')}
                </span>
                <p className="text-[11px] text-[#7A6A5E]">
                  {t('معالجة خاصة تمنع امتصاص البقع وتسهل العناية اليومية.', 'Easy daily care and quick-dry properties.')}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative h-[280px] sm:h-[480px] rounded-2xl overflow-hidden shadow-lg border border-[#E8DEC0]">
            <Image
              src="https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1200&q=85"
              alt="تفاصيل سجاد فاخر"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Chapter 2: ARAWAL Custom Runners */}
        <div className="py-12 sm:py-20 border-b border-[#EAE3D8] grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 relative h-[280px] sm:h-[480px] rounded-2xl overflow-hidden shadow-lg border border-[#E8DEC0]">
            <Image
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85"
              alt="أروال وممرات بالمتر"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
            <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
              {t('الفصل الثاني · رولات الأروال', 'Chapter 02 · Arawal Runner Rolls')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#251811] tracking-tight">
              {t('رولات أروال بالمتر: عروض معتمدة وسرفلة احترافية', 'Arawal Runner Rolls: Standard Widths by Meter')}
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-[#5C4A3E] font-normal leading-relaxed">
              <p>
                {t(
                  'الممرات والمطابخ والغرف الطولية نوفر لها رولات أروال بالمتر بعروضها المعتمدة فقط (60، 80، 100، 120 سم) لتختار الطول المناسب لمساحتك بكل سهولة.',
                  'For hallways, kitchens, and corridors, we offer Arawal runner rolls in standard 60, 80, 100, and 120 cm widths, purchased directly by your required length in meters.'
                )}
              </p>
              <p>
                {t(
                  'تتم عملية القص وسرفلة الأطراف بحرفية تامة في ورشنا لضمان عدم تساقط الخيوط أو تلف الجوانب مع الاستخدام الطويل.',
                  'Every cut is professionally bound and serged to ensure durability without edge fraying.'
                )}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigateTo('shop')}
                className="px-7 py-3 rounded-full bg-[#251811] hover:bg-[#3D291D] text-white text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 shadow-md"
              >
                <span>{t('تصفح تشكيلة الأروال الآن', 'Shop Custom Runners')}</span>
                <ArrowIcon className="w-4 h-4 text-[#C49F74]" />
              </button>
            </div>
          </div>
        </div>

        {/* Chapter 3: Showroom & Visit */}
        <div className="py-12 sm:py-20 text-center max-w-3xl mx-auto space-y-6">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EB] border border-[#E8DEC0] flex items-center justify-center mx-auto text-[#A27B5C]">
            <MapPin className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#251811]">
            {t('شرفونا بزيارة معرض عالم السجاد', 'Visit Our Showroom in Mansoura')}
          </h2>

          <p className="text-xs sm:text-base text-[#5C4A3E] leading-relaxed font-light">
            {t(
              'ندعوكم لزيارة معرضنا بالمنصورة لمعاينة السجاد عن قرب وتجربة نعومة الخامات، أو طلب أي سجادة مباشرة عبر الموقع لتصلكم حتى باب البيت في أي محافظة بمصر.',
              'We invite you to touch and feel our carpet textures at our Mansoura showroom or order conveniently online with nationwide Egyptian home delivery.'
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={BRAND_CONFIG.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-[#A27B5C] hover:bg-[#865F3E] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{t('موقع المعرض على خرائط جوجل', 'Showroom Google Maps Location')}</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('تواصل مع فريق المبيعات عبر واتساب', 'Chat on WhatsApp')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
