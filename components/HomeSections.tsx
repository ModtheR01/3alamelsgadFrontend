'use client';

import React from 'react';
import { useToccoStore } from '@/lib/store';
import { Product, Category, Collection } from '@/types';
import { ToccoMark } from './ToccoLogo';
import { ArrowRight, Sparkles, MessageCircle, ArrowUpRight, Compass, ShieldCheck, SunMedium } from 'lucide-react';
import Image from '@/components/SafeImage';

export function HomeHero() {
  const { navigateTo, settings } = useToccoStore();

  return (
    <section id="homepage-hero" className="relative min-h-[85vh] sm:min-h-[92vh] flex items-center justify-center pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden bg-[#FAF8F5]">
      {/* Background Architectural Canvas / Image with subtle overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={settings.homepage.heroImage}
          alt="Tocco House Architectural Sanctuary"
          fill
          priority
          className="object-cover object-center brightness-[0.88] contrast-[1.03]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A19]/85 via-[#1C1A19]/35 to-[#1C1A19]/25" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center text-white flex flex-col items-center space-y-6 sm:space-y-8">
        {/* Minimal Editorial Brand Display */}
        <div className="space-y-3 sm:space-y-4 max-w-3xl">
          <p className="text-[11px] sm:text-sm font-medium uppercase tracking-[0.3em] sm:tracking-[0.35em] text-[#EBE3D5]/90">
            TOCCO HOUSE · CAIRO
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-normal tracking-tight leading-[1.12] sm:leading-[1.08] text-white">
            {settings.homepage.heroHeading}
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-[#E5DED4] font-light max-w-2xl mx-auto leading-relaxed pt-1 sm:pt-2 px-2">
            {settings.homepage.heroSubheading}
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-2 sm:pt-4 w-full sm:w-auto flex items-center justify-center">
          <button
            id="hero-discover-story-btn"
            onClick={() => navigateTo('our-story')}
            className="w-full sm:w-auto px-7 py-3.5 sm:px-9 sm:py-4 rounded-full bg-[#FAF8F5] text-[#1C1A19] text-xs uppercase tracking-[0.22em] font-medium hover:bg-white hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span>{settings.homepage.heroCtaText || 'Discover Tocco House'}</span>
            <ArrowRight className="w-4 h-4 text-[#643D26]" />
          </button>
        </div>

        {/* Quiet Brand Pill Statement */}
        <div className="pt-4 sm:pt-8 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.28em] text-[#D4CCC2]/80 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span>Fiberglass Sculptural Furniture</span>
          <span>·</span>
          <span>Indoor & Outdoor</span>
          <span>·</span>
          <span>Egyptian Craftsmanship</span>
        </div>
      </div>
    </section>
  );
}

export function FeaturedCollectionSection() {
  const { collections, navigateTo } = useToccoStore();
  const featured = collections.find((c) => c.isFeatured) || collections[0];

  if (!featured) return null;

  return (
    <section id="featured-collection-section" className="py-14 sm:py-24 bg-[#FAF8F5] border-b border-[#EAE4DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          {/* Editorial Image Showcase (7 cols) */}
          <div className="lg:col-span-7 relative h-72 sm:h-[450px] lg:h-[580px] rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(40,25,15,0.06)] group">
            <Image
              src={featured.coverImage}
              alt={featured.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            {/* Tag on image */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#FAF8F5]/90 backdrop-blur-sm text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-medium text-[#1C1A19]">
              Curated Edition
            </div>
          </div>

          {/* Editorial Content (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-medium text-[#B85D38]">
                Featured Collection
              </span>
              <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
                {featured.name}
              </h2>
            </div>

            <p className="text-[#524B45] text-sm sm:text-base leading-relaxed font-light">
              {featured.description}
            </p>

            <div className="pt-2 border-t border-[#EAE4DC] flex items-center justify-between text-[11px] sm:text-xs text-[#736B63] uppercase tracking-wider">
              <span>Weatherproof Resin</span>
              <span>•</span>
              <span>UV-Stable Glaze</span>
              <span>•</span>
              <span>Made in Cairo</span>
            </div>

            <div className="pt-2 sm:pt-4">
              <button
                onClick={() => navigateTo('collections', { collectionId: featured.id })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#332F2D] transition-all group"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SignaturePiecesSection() {
  const { products, navigateTo, addToCart, settings } = useToccoStore();
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <section id="signature-pieces-section" className="py-14 sm:py-24 bg-[#F5F2EB] border-b border-[#E8E1D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-medium text-[#B85D38]">
              Sculptural Archive
            </span>
            <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
              Signature Pieces
            </h2>
            <p className="text-xs sm:text-sm text-[#736B63] font-light max-w-lg">
              Distinctive silhouettes cast in reinforced fiberglass. Crafted to transform residential
              and architectural environments.
            </p>
          </div>

          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1A19] hover:text-[#B85D38] transition-colors self-start md:self-auto"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Products Grid: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {featuredProducts.map((product) => {
            const isPriceOnDemand = product.pricingMode === 'on_demand';

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#EAE4DC] hover:shadow-[0_8px_30px_rgba(30,20,10,0.06)] transition-all duration-300"
              >
                {/* Image Showcase */}
                <div
                  className="relative aspect-[4/5] bg-[#EFEBE3] overflow-hidden cursor-pointer"
                  onClick={() => navigateTo('product', { productId: product.id })}
                >
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Lead Time Badge */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/90 backdrop-blur-sm text-[9px] sm:text-[10px] uppercase tracking-wider text-[#524B45] font-medium">
                    {product.leadTime.split(' ')[0]} {product.leadTime.split(' ')[1]}
                  </div>

                  {/* Pricing Mode Badge */}
                  {isPriceOnDemand && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#1C1A19] text-white text-[9px] sm:text-[10px] uppercase tracking-wider font-medium">
                      Bespoke
                    </div>
                  )}
                </div>

                {/* Information */}
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider text-[#8F8880] mb-1">
                      <span className="truncate">{product.material.split(',')[0]}</span>
                    </div>
                    <h3
                      onClick={() => navigateTo('product', { productId: product.id })}
                      className="text-xs sm:text-base font-normal text-[#1C1A19] group-hover:text-[#643D26] transition-colors cursor-pointer line-clamp-1"
                    >
                      {product.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#736B63] line-clamp-2 mt-1 font-light hidden sm:block">
                      {product.shortDescription}
                    </p>
                  </div>

                  {/* Pricing & Interaction */}
                  <div className="pt-2 sm:pt-3 border-t border-[#EAE4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      {isPriceOnDemand ? (
                        <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#643D26] block">
                          On Demand
                        </span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-semibold text-[#1C1A19]">
                            {product.price?.toLocaleString()} EGP
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-[#8F8880]">
                            Deposit: {((product.price || 0) * 0.5).toLocaleString()} EGP
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigateTo('product', { productId: product.id })}
                      className="w-full sm:w-auto text-center px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-[#D8CEBF] text-[10px] sm:text-[11px] uppercase tracking-wider font-medium text-[#1C1A19] hover:bg-[#1C1A19] hover:text-white hover:border-[#1C1A19] transition-all"
                    >
                      View Piece
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function StoryTeaserSection() {
  const { navigateTo } = useToccoStore();

  return (
    <section id="story-teaser-section" className="py-14 sm:py-24 bg-[#FAF8F5] border-b border-[#EAE4DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          {/* Quote & Brand Vision (6 cols) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#EFEBE3] flex items-center justify-center">
              <ToccoMark size={24} fillColor="#643D26" circleBg="transparent" hasCircle={false} />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#1C1A19] leading-tight sm:leading-[1.15]">
                «Designed to be noticed. <br />
                <span className="text-[#643D26]">Made to be lived with.»</span>
              </h2>
              <p className="text-sm sm:text-lg text-[#524B45] font-light leading-relaxed">
                Tocco House is an Egyptian contemporary design brand where each piece is sculpted
                like an architectural monument. We reject mass production in favor of fluid
                fiberglass forms, mineral pigment glazes, and bold Mediterranean presence.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-4 border-t border-[#EAE4DC]">
              <div>
                <span className="block text-lg sm:text-2xl font-light text-[#1C1A19]">100%</span>
                <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#736B63] leading-tight block">
                  Handmade in Cairo
                </span>
              </div>
              <div>
                <span className="block text-lg sm:text-2xl font-light text-[#1C1A19]">UV-Proof</span>
                <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#736B63] leading-tight block">
                  Marine Gelcoat
                </span>
              </div>
              <div>
                <span className="block text-lg sm:text-2xl font-light text-[#1C1A19]">50%</span>
                <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#736B63] leading-tight block">
                  Artisan Deposit
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigateTo('our-story')}
                className="inline-flex items-center gap-2.5 text-xs uppercase tracking-[0.25em] font-semibold text-[#1C1A19] hover:text-[#643D26] group transition-colors"
              >
                <span>Read Our Atelier Story</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Visual Showcase (6 cols) */}
          <div className="lg:col-span-6 relative h-64 sm:h-[450px] lg:h-[520px] rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(40,25,15,0.06)]">
            <Image
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"
              alt="Tocco House Atelier Space"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white text-[10px] sm:text-xs tracking-wider uppercase flex justify-between items-center">
              <span>Raw Mineral Glazes · High-Tensile Resins</span>
              <span>Cairo Atelier</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoriesShowcase() {
  const { categories, navigateTo } = useToccoStore();
  const visibleCategories = categories.filter((c) => c.isVisible);

  return (
    <section id="categories-showcase-section" className="py-14 sm:py-24 bg-[#FAF8F5] border-b border-[#EAE4DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-2 sm:space-y-3">
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-medium text-[#B85D38]">
            Architectural Spaces
          </span>
          <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
            Categories of Form
          </h2>
          <p className="text-xs sm:text-sm text-[#736B63] font-light">
            Every object serves a purpose while standing alone as contemporary sculptural art.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {visibleCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => navigateTo('shop', { categoryId: category.id })}
              className="group relative h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A19]/80 via-[#1C1A19]/25 to-transparent transition-opacity group-hover:from-[#1C1A19]/90" />

              <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-end text-white space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#EBE3D5] font-medium">
                  Discovery
                </span>
                <h3 className="text-xl sm:text-2xl font-normal tracking-wide text-white group-hover:translate-x-1 transition-transform">
                  {category.name}
                </h3>
                <p className="text-xs text-[#D1CBC3] font-light line-clamp-2 max-w-xs opacity-90">
                  {category.description}
                </p>
                <div className="pt-1 sm:pt-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#FAF8F5] group-hover:text-[#D97750] transition-colors">
                  <span>Explore Objects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CollaborationsSection() {
  const { collaborations } = useToccoStore();

  if (!collaborations.length) return null;

  return (
    <section id="homepage-collaborations" className="py-12 sm:py-16 bg-white border-y border-[#EAE4DC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#B85D38] font-medium mb-2">
            Trusted Collaborations
          </p>
          <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-[#1C1A19]">
            Brands & Partners Who Trust Tocco House
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-14">
          {collaborations.map((collaboration) => (
            <div
              key={collaboration.id}
              title={collaboration.title}
              className="relative w-24 h-12 sm:w-32 sm:h-16 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <Image
                src={collaboration.image}
                alt={collaboration.title}
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CustomDesignTeaser() {
  const { navigateTo, settings } = useToccoStore();

  const whatsappUrl = `https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    "Hello Tocco House, I have a custom design piece in mind and would like to consult with your design studio."
  )}`;

  return (
    <section id="custom-design-teaser-section" className="py-14 sm:py-24 bg-[#1C1A19] text-[#FAF8F5] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-medium text-[#B85D38]">
              Atelier Concierge
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight">
              Have something in mind? <br />
              <span className="text-[#EAE4DC]">Let’s make it yours.</span>
            </h2>
            <p className="text-sm sm:text-base text-[#B8AFA6] font-light max-w-xl leading-relaxed">
              We collaborate with architects, interior designers, and discerning private collectors to
              produce bespoke fiberglass forms. From custom dining proportions to monumental
              garden totems and corporate reception centerpieces.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button
                onClick={() => navigateTo('custom-design')}
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-[#FAF8F5] text-[#1C1A19] text-xs uppercase tracking-[0.25em] font-medium hover:bg-white transition-all shadow-md text-center"
              >
                Create a Custom Design
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-[#2A2624] text-white border border-[#443E3A] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#383330] transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Discuss on WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden border border-[#332F2D]">
            <Image
              src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85"
              alt="Custom fiberglass fabrication at Tocco House"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-3 sm:p-4 rounded-lg bg-black/60 backdrop-blur-md text-xs text-[#EBE3D5] flex items-center justify-between">
              <span>Bespoke Dimensions & RAL Colors</span>
              <span className="font-mono text-[#B85D38]">Atelier Direct</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProjectsAndInstagramSection() {
  const { projects, navigateTo, settings } = useToccoStore();

  return (
    <section id="projects-journal-section" className="py-14 sm:py-24 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-medium text-[#B85D38]">
              In Real Living Spaces
            </span>
            <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
              In Their Space
            </h2>
            <p className="text-xs sm:text-sm text-[#736B63] font-light max-w-lg">
              Selected installations photographed across North Coast waterfront villas, Zamalek
              salons, and coastal residences.
            </p>
          </div>

          <button
            onClick={() => navigateTo('projects')}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1A19] hover:text-[#B85D38] transition-colors self-start md:self-auto"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {projects.slice(0, 3).map((project) => (
            <div
              key={project.id}
              onClick={() => navigateTo('projects')}
              className="group cursor-pointer space-y-3 sm:space-y-4"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#EFEBE3] border border-[#EAE4DC] shadow-sm">
                <Image
                  src={project.coverImage}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#1C1A19]/80 backdrop-blur-sm text-[9px] sm:text-[10px] uppercase tracking-wider text-white">
                  {project.location.split(',')[0]}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#8F8880]">
                  {project.subtitle} · {project.year}
                </span>
                <h3 className="text-base sm:text-lg font-normal text-[#1C1A19] group-hover:text-[#643D26] transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-[#736B63] line-clamp-2 font-light">
                  {project.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Refined Instagram Section */}
        <div className="mt-12 sm:mt-20 pt-10 sm:pt-16 border-t border-[#EAE4DC] flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-medium text-[#736B63]">
              Daily Inspiration & Moments
            </span>
            <h4 className="text-lg sm:text-xl font-normal text-[#1C1A19]">
              Follow the Cairo Studio on Instagram
            </h4>
          </div>

          <a
            href={`https://instagram.com/${settings.contact.instagramHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#D8CEBF] text-xs uppercase tracking-[0.2em] font-medium text-[#1C1A19] hover:bg-[#1C1A19] hover:text-white hover:border-[#1C1A19] transition-all"
          >
            <span>{settings.contact.instagramHandle}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
