'use client';

import React, { useState, useEffect } from 'react';
import { useToccoStore } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Phone,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import { AlamelsgadMark } from './AlamelsgadLogo';

// High-fidelity luxury carpet photography assets
const CARPET_ASSETS = {
  heroSlide1: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1920&q=85',
  heroSlide2: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1920&q=85',
  heroSlide3: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=85',
  turkish: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=800&q=80',
  oriental: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
  alternatives: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
  arawal: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  showroom: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
};

/**
 * 1. HERO SLIDESHOW (Harir EG Inspired Slideshow)
 * Features auto-play, slick arrow controls, and clean luxury typography
 * Pagination numbers and dots indicators removed as requested.
 */
export function HomeHero() {
  const { navigateTo } = useToccoStore();
  const { t, isRtl } = useLanguage();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 0,
      image: CARPET_ASSETS.heroSlide1,
      badgeAr: 'تشكيلة ٢٠٢٦ الفاخرة',
      badgeEn: 'Luxury 2026 Collection',
      titleAr: 'أفخم تشكيلات السجاد التركي والشرقي',
      titleEn: 'Fine Turkish & Oriental Carpets',
      subtitleAr: 'تصاميم استثنائية وأصواف تركية فائقة الكثافة تضفي على صالوناتك الدفء والجاذبية.',
      subtitleEn: 'Exceptional craftsmanship, high density weaves, and timeless luxury for your living spaces.',
      ctaPrimaryAr: 'تسوق التشكيلة الآن',
      ctaPrimaryEn: 'Shop Collection',
      ctaSecondaryAr: 'وصل حديثاً',
      ctaSecondaryEn: 'New Arrivals',
    },
    {
      id: 1,
      image: CARPET_ASSETS.heroSlide2,
      badgeAr: 'الأروال والمشايات بالمتر',
      badgeEn: 'Runner Rolls by Length',
      titleAr: 'رولات أروال ومشايات تناسب مقاساتك',
      titleEn: 'Runner Rolls Tailored to Your Length',
      subtitleAr: 'نوفر لك خيارات عرض متعددة مع تحديد الطول المطلوب بدقة متناهية لممراتك ومداخلك.',
      subtitleEn: 'Curated widths sold by exact meter length to complement any corridor or entryway.',
      ctaPrimaryAr: 'استعراض الأروال بالمتر',
      ctaPrimaryEn: 'Explore Runners',
      ctaSecondaryAr: 'الأسعار والمواصفات',
      ctaSecondaryEn: 'Specs & Prices',
    },
    {
      id: 2,
      image: CARPET_ASSETS.heroSlide3,
      badgeAr: 'بدائل السجاد العصرية',
      badgeEn: 'Modern Carpet Alternatives',
      titleAr: 'بدائل سجاد خفيفة، أنيقة، وعملية',
      titleEn: 'Modern, Washable & Practical Carpets',
      subtitleAr: 'خفيفة الوزن، سهلة التنظيف، وتدوم لسنوات بثبات عالٍ ومظهر يخطف الأنظار.',
      subtitleEn: 'Lightweight, washable, non-slip alternatives designed for seamless everyday living.',
      ctaPrimaryAr: 'اكتشف بدائل السجاد',
      ctaPrimaryEn: 'Browse Alternatives',
      ctaSecondaryAr: 'معرض المنصورة',
      ctaSecondaryEn: 'Visit Showroom',
    },
  ];

  // Auto-play slideshow
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const ArrowPrev = isRtl ? ChevronRight : ChevronLeft;
  const ArrowNext = isRtl ? ChevronLeft : ChevronRight;
  const activeSlide = slides[currentSlide];

  return (
    <section
      id="homepage-hero-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative min-h-[82vh] sm:min-h-[88vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#1A1009] select-none"
    >
      {/* Background Slides with Crossfade */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100 z-0 scale-100' : 'opacity-0 -z-10 scale-105 pointer-events-none'
          }`}
          style={{ transitionProperty: 'opacity, transform' }}
        >
          <Image
            src={slide.image}
            alt={slide.titleAr}
            fill
            priority={idx === 0}
            className="object-cover object-center brightness-[0.42] contrast-[1.08]"
            referrerPolicy="no-referrer"
          />
          {/* Subtle Luxury Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#150D07] via-[#150D07]/45 to-[#150D07]/30" />
        </div>
      ))}

      {/* Main Slide Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white flex flex-col items-center pt-24 sm:pt-28 pb-16">

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.18] sm:leading-[1.14] text-white max-w-4xl drop-shadow-sm transition-all duration-700">
          {t(activeSlide.titleAr, activeSlide.titleEn)}
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-lg md:text-xl text-[#E8DED3] font-light max-w-2xl mx-auto leading-relaxed">
          {t(activeSlide.subtitleAr, activeSlide.subtitleEn)}
        </p>

        {/* Action Buttons */}
        <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => navigateTo('shop')}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-white hover:bg-[#F4ECE1] text-[#1F150F] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2.5 active:scale-95 group"
          >
            <span>{t(activeSlide.ctaPrimaryAr, activeSlide.ctaPrimaryEn)}</span>
            <ArrowRight className={`w-4 h-4 text-[#A27B5C] transition-transform duration-200 ${isRtl ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          </button>

        </div>
      </div>

      {/* Slide Navigation Controls (Prev/Next) */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        aria-label="Previous Slide"
        className="absolute start-4 sm:start-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/25 hover:bg-black/55 text-white/90 hover:text-white border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 group"
      >
        <ArrowPrev className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        aria-label="Next Slide"
        className="absolute end-4 sm:end-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/25 hover:bg-black/55 text-white/90 hover:text-white border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 group"
      >
        <ArrowNext className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
      </button>
    </section>
  );
}

/**
 * 2. CATEGORIES SHOWCASE (Curated Collections)
 */
export function CategoriesShowcase() {
  const { navigateTo } = useToccoStore();
  const { t, isRtl } = useLanguage();

  const collections = [
    {
      id: 'turkish',
      titleAr: 'سجاد تركي فاخر',
      titleEn: 'Luxury Turkish Carpets',
      descAr: 'نعومة فائقة وألوان عصرية بتصاميم تناسب الصالونات وغرف المعيشة.',
      descEn: 'Ultra-soft pile and contemporary motifs crafted for living rooms.',
      image: CARPET_ASSETS.turkish,
      tagAr: 'الأكثر طلباً',
      tagEn: 'Bestseller',
    },
    {
      id: 'oriental',
      titleAr: 'سجاد شرقي وأصيل',
      titleEn: 'Oriental & Classic Rugs',
      descAr: 'نقوش كلاسيكية وزخارف تراثية غنية بالفخامة والأناقة الخالدة.',
      descEn: 'Timeless oriental patterns with rich heritage and enduring craftsmanship.',
      image: CARPET_ASSETS.oriental,
      tagAr: 'أصالة وفخامة',
      tagEn: 'Classic Heritage',
    },
    {
      id: 'arawal',
      titleAr: 'رولات أروال ومشايات',
      titleEn: 'Runner Rolls by Length',
      descAr: 'تشكيلة راقية من رولات الأروال والمشايات بمختلف العروض تباع بالطول المطلوب.',
      descEn: 'Hallway runners and custom cut rolls sold by meter length.',
      image: CARPET_ASSETS.arawal,
      tagAr: 'تباع بالطول',
      tagEn: 'Sold by Length',
    },
    {
      id: 'alternatives',
      titleAr: 'بدائل السجاد العصرية',
      titleEn: 'Modern Carpet Alternatives',
      descAr: 'خفيفة الوزن، سهلة التنظيف، ومقاومة للانزلاق بأسعار اقتصادية وعملية.',
      descEn: 'Lightweight, washable, non-slip alternatives for daily comfort.',
      image: CARPET_ASSETS.alternatives,
      tagAr: 'عملي ومقاوم',
      tagEn: 'Easy Care',
    },
  ];

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section id="categories-showcase-section" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A27B5C]">
            {t('المجموعات والتشكيلات', 'Curated Collections')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#241710] tracking-tight">
            {t('اختر ما يناسب مساحة منزلك', 'Explore Collections for Every Room')}
          </h2>
          <p className="text-xs sm:text-sm text-[#736357] font-normal leading-relaxed">
            {t(
              'كل تشكيلة صُممت بعناية لتجمع بين المتانة العالية والراحة والملمس الذي يزين أرضياتك.',
              'Each collection balances durability, tactile comfort, and visual warmth for your spaces.'
            )}
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigateTo('shop')}
              className="group relative rounded-2xl overflow-hidden bg-[#FBF9F5] border border-[#EAE3D8] hover:border-[#D5C6B5] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Image Container with Consistent Aspect Ratio */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFE9DF]">
                <Image
                  src={cat.image}
                  alt={cat.titleAr}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="absolute top-3 start-3 bg-[#1F150F]/85 backdrop-blur-xs text-[#EED8BE] text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {t(cat.tagAr, cat.tagEn)}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#241710] group-hover:text-[#A27B5C] transition-colors">
                    {t(cat.titleAr, cat.titleEn)}
                  </h3>
                  <p className="text-xs text-[#7A6A5E] leading-relaxed line-clamp-2">
                    {t(cat.descAr, cat.descEn)}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EFE7DC] flex items-center justify-between text-xs font-bold text-[#A27B5C]">
                  <span>{t('تصفح التشكيلة', 'Explore Pieces')}</span>
                  <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 3. BRAND STORY & SHOWROOM HIGHLIGHT
 */
export function StoryTeaserSection() {
  const { navigateTo } = useToccoStore();
  const { t, isRtl } = useLanguage();

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section id="story-teaser-section" className="py-16 sm:py-24 bg-white border-b border-[#EAE3D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 items-center">
          {/* Quote & Brand Vision (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-full bg-[#FAF5EB] border border-[#EAE3D8] flex items-center justify-center">
              <AlamelsgadMark size={40} />
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#A27B5C]">
                {t('معرضنا وقصة علامتنا', 'Our Heritage & Showroom')}
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#241710] leading-tight">
                {t(
                  '«السجاد ليس مجرد غطاء للأرضيات، بل هو روح البيت ولمسته التي تجمع بين الأصالة والراحة.»',
                  '«A carpet is not merely a floor covering, but the soul of a home connecting warmth with quiet luxury.»'
                )}
              </h2>
              <p className="text-sm sm:text-base text-[#5C4A3E] font-light leading-relaxed">
                {t(
                  'في عالم السجاد، نسعى جاهدين لاختيار أجود الخامات التركية والشرقية وبدائل السجاد التي تلائم أجواء البيوت العصرية. نؤمن بأن كل غرفة تستحق سجادة تمنحها هوية دافئة وتصميماً مريحاً يرحب بكل ضيف.',
                  'At Alamelsgad, we curate only high-pile, tightly woven Turkish and Oriental rugs and modern alternatives that endure beautifully and bring authentic warmth.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 border-t border-[#EAE3D8]">
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-[#241710]">100%</span>
                <span className="text-[11px] text-[#7A6A5E] block font-medium">
                  {t('جودة وخيوط معتمدة', 'Certified Weaves')}
                </span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-[#241710]">27+</span>
                <span className="text-[11px] text-[#7A6A5E] block font-medium">
                  {t('محافظة في مصر', 'Egyptian Governorates')}
                </span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-[#241710]">10–11</span>
                <span className="text-[11px] text-[#7A6A5E] block font-medium">
                  {t('يومياً في معرضنا', 'Daily Showroom Hours')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigateTo('our-story')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#241710] hover:text-[#A27B5C] transition-colors"
              >
                <span>{t('تعرف على قصة عالم السجاد', 'Discover Our Story')}</span>
                <ArrowIcon className="w-4 h-4 text-[#A27B5C]" />
              </button>

              <span className="text-[#C49F74]">·</span>

              <a
                href={BRAND_CONFIG.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A27B5C] hover:underline"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('موقع المعرض على خرائط جوجل', 'View Mansoura Showroom')}</span>
              </a>
            </div>
          </div>

          {/* Showroom Visual (6 cols) */}
          <div className="lg:col-span-6 relative h-72 sm:h-[460px] rounded-3xl overflow-hidden shadow-xl border border-[#EAE3D8]">
            <Image
              src={CARPET_ASSETS.showroom}
              alt="معرض عالم السجاد بالمنصورة"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <div className="absolute bottom-5 inset-x-5 text-white flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-sm block">{t('معرض عالم السجاد · المنصورة', 'Alamelsgad Showroom · Mansoura')}</span>
                <span className="text-[11px] text-white/80">{t('يومياً من 10 صباحاً حتى 11 مساءً', 'Daily from 10 AM to 11 PM')}</span>
              </div>
              <a
                href={`tel:${BRAND_CONFIG.phone}`}
                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#1F150F] backdrop-blur-xs font-bold transition-all flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>{t('اتصل الآن', 'Call Us')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 4. CUSTOMER TESTIMONIALS (Verified Testimonials)
 */
export function CustomersReviewsSection() {
  const { t } = useLanguage();

  const reviews = [
    {
      nameAr: 'م. أحمد خليل',
      nameEn: 'Eng. Ahmed Khalil',
      cityAr: 'القاهرة (التجمع الخامس)',
      cityEn: 'Cairo',
      stars: 5,
      reviewAr: 'السجاد التركي خامته ممتازة وألوانه مطابقة للصور تماماً. التوصيل كان سريعاً والمعاينة قبل الدفع أعطتني راحة واطمئناناً كبيراً.',
      reviewEn: 'The Turkish rug weave is exceptional and looks exactly like the images. Safe delivery and preview before payment made it worry-free.',
    },
    {
      nameAr: 'د. سارة محمود',
      nameEn: 'Dr. Sarah Mahmoud',
      cityAr: 'المنصورة',
      cityEn: 'Mansoura',
      stars: 5,
      reviewAr: 'الأروال بالمتر كانت الحل المثالي لممرات الشقة، تم قصها وتشطيبها بحرفية عالية جداً وخامتها ثقيلة وتتحمل الاستخدام اليومي.',
      reviewEn: 'The custom runner rolls fit my hallway dimensions seamlessly. High quality finishing and durable texture.',
    },
    {
      nameAr: 'أ. طارق الشربيني',
      nameEn: 'Tarek El-Sherbini',
      cityAr: 'الإسكندرية',
      cityEn: 'Alexandria',
      stars: 5,
      reviewAr: 'تعامل راقٍ جداً عبر الواتساب، طلبت بديل سجاد وسجادة صالون، والقطع وصلت بحالة ممتازة حتى باب البيت في الإسكندرية.',
      reviewEn: 'Top-tier customer support on WhatsApp. My living room carpet arrived in pristine condition right to my doorstep.',
    },
  ];

  return (
    <section id="customers-saying-section" className="py-16 sm:py-20 bg-[#FAF7F2] border-b border-[#EAE3D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A27B5C]">
            {t('ثقة عملائنا', 'Verified Testimonials')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#241710] tracking-tight">
            {t('آراء عملائنا وتجاربهم', 'Customers Are Saying')}
          </h2>
          <p className="text-xs sm:text-sm text-[#736357]">
            {t(
              'نفخر بثقة آلاف العملاء في مختلف المحافظات بخدمتنا وجودة سجادنا.',
              'Thousands of satisfied homes across all Egyptian governorates.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-[#C49F74]">
                  {[...Array(rev.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#4A3B30] leading-relaxed italic">
                  «{t(rev.reviewAr, rev.reviewEn)}»
                </p>
              </div>

              <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#241710]">{t(rev.nameAr, rev.nameEn)}</h4>
                  <span className="text-[10px] text-[#8A796B]">{t(rev.cityAr, rev.cityEn)}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {t('شراء مؤكد', 'Verified Buyer')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Deprecated / Removed sections: exported as null to prevent broken imports
export function ValueTrustRibbon() {
  return null;
}

export function SignaturePiecesSection() {
  return null;
}

export function NewsletterSection() {
  return null;
}

export function ProjectsAndInstagramSection() {
  return null;
}

export function BannersSection() {
  return null;
}

export function CustomDesignTeaser() {
  return null;
}

export function CollaborationsSection() {
  return null;
}
