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
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
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

  const goToSlide = React.useCallback(
    (nextIndex: number) => {
      if (nextIndex === currentSlide) return;
      setPrevSlide(currentSlide);
      setCurrentSlide(nextIndex);
    },
    [currentSlide]
  );

  // Auto-play slideshow with smooth cinematic timing
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      goToSlide((currentSlide + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused, currentSlide, slides.length, goToSlide]);

  // Swipe and drag support with direction locking and touch protection
  const touchStartX = React.useRef(0);
  const touchStartY = React.useRef(0);
  const touchEndX = React.useRef(0);
  const touchEndY = React.useRef(0);
  const mouseStartX = React.useRef(0);
  const isMouseDown = React.useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    // Only trigger if horizontal swipe is dominant over vertical page scroll
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX > 0) {
        // Swiped left
        goToSlide((currentSlide + 1) % slides.length);
      } else {
        // Swiped right
        goToSlide((currentSlide - 1 + slides.length) % slides.length);
      }
    }
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
  };

  const handleHeroMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    isMouseDown.current = true;
    mouseStartX.current = e.clientX;
  };

  const handleHeroMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    const diff = mouseStartX.current - e.clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        goToSlide((currentSlide + 1) % slides.length);
      } else {
        goToSlide((currentSlide - 1 + slides.length) % slides.length);
      }
    }
  };

  return (
    <section
      id="homepage-hero-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        isMouseDown.current = false;
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleHeroMouseDown}
      onMouseUp={handleHeroMouseUp}
      className="relative min-h-[74vh] sm:min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#1A1009] select-none cursor-grab active:cursor-grabbing touch-pan-y"
    >
      {/* Background Slides with Cinema Crossfade & Ken Burns Slow Zoom */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentSlide;
        const isPrevious = idx === prevSlide;

        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity ease-in-out ${
              isActive
                ? 'opacity-100 z-10'
                : isPrevious
                ? 'opacity-0 z-0'
                : 'opacity-0 -z-10'
            }`}
            style={{
              transitionDuration: '1400ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
          >
            {/* Background Image with Cinematic Ken Burns subtle slow motion */}
            <div
              className={`relative w-full h-full transform-gpu ${
                isActive
                  ? idx % 2 === 0
                    ? 'animate-ken-burns'
                    : 'animate-ken-burns-alt'
                  : 'scale-100'
              }`}
            >
              <Image
                src={slide.image}
                alt="عالم السجاد - سجاد فاخر"
                fill
                priority={idx === 0}
                className="object-cover object-[center_65%] sm:object-center brightness-[0.88] contrast-[1.04]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Subtle Balanced Gradient: Keeps the carpets & rooms luminous and vivid while ensuring crisp text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#120B06]/85 via-black/25 to-black/20" />
          </div>
        );
      })}

      {/* Main Slide Content - Headline */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white flex flex-col items-center justify-center pt-16 sm:pt-24 pb-20 sm:pb-28">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.3] sm:leading-[1.18] text-white max-w-3xl drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] transition-all">
          {t('عالم السجاد.. لمسة جمال بيتك عندنا', 'Alamelsgad.. The Touch of Beauty for Your Home')}
        </h1>
      </div>

      {/* Primary Action Button - At the bottom of the picture with high-end professional styling */}
      <div className="absolute bottom-6 sm:bottom-10 inset-x-0 z-20 flex items-center justify-center px-4 pointer-events-auto">
        <button
          id="hero-shop-cta-btn"
          onClick={() => navigateTo('shop')}
          className="group px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/35 hover:border-white/70 text-white text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2.5 active:scale-95 touch-manipulation cursor-pointer"
        >
          <span className="drop-shadow-sm">{t('تسوق التشكيلة الآن', 'Shop the Collection')}</span>
          <div className="w-5 h-5 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center transition-colors shrink-0">
            <ArrowRight className={`w-3 h-3 text-white transition-transform duration-300 ${isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
          </div>
        </button>
      </div>
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
    <section id="categories-showcase-section" className="pt-6 sm:pt-10 pb-4 sm:pb-6 bg-white">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10 space-y-1.5 sm:space-y-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#A27B5C]">
            {t('المجموعات والتشكيلات', 'Curated Collections')}
          </span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#241710] tracking-tight">
            {t('اختر ما يناسب مساحة منزلك', 'Explore Collections for Every Room')}
          </h2>
          <p className="text-xs sm:text-sm text-[#736357] font-normal leading-relaxed">
            {t(
              'كل تشكيلة صُممت بعناية لتجمع بين المتانة العالية والراحة والملمس الذي يزين أرضياتك.',
              'Each collection balances durability, tactile comfort, and visual warmth for your spaces.'
            )}
          </p>
        </div>

        {/* 4 Cards Grid - 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {collections.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigateTo('shop')}
              className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#FBF9F5] border border-[#EAE3D8] hover:border-[#D5C6B5] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
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
                <span className="absolute top-2 sm:top-3 start-2 sm:start-3 bg-[#1F150F]/85 backdrop-blur-xs text-[#EED8BE] text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                  {t(cat.tagAr, cat.tagEn)}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-base font-bold text-[#241710] group-hover:text-[#A27B5C] transition-colors leading-snug">
                    {t(cat.titleAr, cat.titleEn)}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#7A6A5E] leading-relaxed line-clamp-2">
                    {t(cat.descAr, cat.descEn)}
                  </p>
                </div>

                <div className="pt-2 sm:pt-3 border-t border-[#EFE7DC] flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#A27B5C]">
                  <span>{t('تصفح التشكيلة', 'Explore Pieces')}</span>
                  <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
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
    <section id="story-teaser-section" className="pt-6 sm:pt-10 pb-12 sm:pb-16 bg-white border-b border-[#EAE3D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 items-center">
          {/* Quote & Brand Vision (6 cols) */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5">
            <div className="w-11 h-11 rounded-full bg-[#FAF5EB] border border-[#EAE3D8] flex items-center justify-center">
              <AlamelsgadMark size={36} />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#A27B5C]">
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

export { default as NewArrivalSection } from './NewArrivalSection';

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
