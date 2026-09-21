'use client';

import React from 'react';
import { useToccoStore } from '@/lib/store';
import { ToccoMark } from './ToccoLogo';
import Image from '@/components/SafeImage';
import { Sparkles, ArrowRight, ShieldCheck, Sun, Compass } from 'lucide-react';

export default function OurStoryView() {
  const { navigateTo } = useToccoStore();

  return (
    <div id="our-story-page" className="pt-20 sm:pt-28 pb-20 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Editorial Brand Manifesto Header */}
        <div className="py-8 sm:py-16 border-b border-[#EAE4DC] max-w-4xl space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ToccoMark size={30} fillColor="#FFFFFF" circleBg="#5E3B26" />
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
              The Tocco House Philosophy
            </span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-normal tracking-tight text-[#1C1A19] leading-[1.15]">
            Objects with character. <br />
            <span className="text-[#643D26]">The touch that elevates.</span>
          </h1>

          <p className="text-sm sm:text-xl text-[#524B45] font-light leading-relaxed">
            Tocco House was founded in Cairo as an antidote to disposable mass production. 
            We approach furniture not as background utilities, but as bold architectural sculptures 
            with emotional resonance.
          </p>
        </div>

        {/* Chapter 1: The Medium of Fiberglass */}
        <div className="py-10 sm:py-20 border-b border-[#EAE4DC] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[#8F8880]">
              Chapter 01 · The Medium
            </span>
            <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
              Why Fiberglass?
            </h2>
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-base text-[#524B45] font-light leading-relaxed">
              <p>
                Natural stone cracks under thermal shock. Timber bends in coastal moisture. 
                Fiberglass grants absolute freedom of form—allowing us to cast continuous, 
                seamless curves and weightless silhouettes that traditional materials simply cannot achieve.
              </p>
              <p>
                By impregnating woven glass fibers with high-grade marine resins, our pieces exhibit 
                the structural strength of steel with a fraction of the mass. They inhabit outdoor 
                pool terraces in Sahel and refined salon interiors in Cairo with equal ease.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4 text-xs text-[#1C1A19]">
              <div className="p-3 sm:p-4 rounded-xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-1">
                <span className="font-semibold block uppercase tracking-wider text-[11px] sm:text-xs">Zero Seams</span>
                <p className="text-[#736B63] text-[10px] sm:text-[11px] leading-relaxed">Continuous monocoque shells with no visible joinery.</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-1">
                <span className="font-semibold block uppercase tracking-wider text-[11px] sm:text-xs">Mediterranean Proof</span>
                <p className="text-[#736B63] text-[10px] sm:text-[11px] leading-relaxed">Resistant to salt spray, direct UV sunlight, and moisture.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative h-[280px] sm:h-[520px] rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85"
              alt="Sculptural fiberglass form"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Chapter 2: The Cairo Atelier & Hand Craftsmanship */}
        <div className="py-10 sm:py-20 border-b border-[#EAE4DC] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 relative h-[280px] sm:h-[520px] rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85"
              alt="Artisans finishing fiberglass surfaces in Cairo atelier"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4 sm:space-y-6">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[#8F8880]">
              Chapter 02 · The Atelier
            </span>
            <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
              Hands that Mold and Sand
            </h2>
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-base text-[#524B45] font-light leading-relaxed">
              <p>
                Every Tocco House piece originates in our Cairo workshop. From the creation of the 
                rigid structural master mould to the meticulous multi-stage hand-sanding process, 
                our craftsmen invest over forty hours into each individual object.
              </p>
              <p>
                Whether treated with a soft matte tactile glaze, an opulent automotive high-gloss 
                lacquer, or a granular mineral travertine coat, the human hand is present in every contour.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#FAF8F5] border border-[#D8CEBF] space-y-1.5 sm:space-y-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#643D26] block">
                The 50% Handcrafted Deposit
              </span>
              <p className="text-[11px] sm:text-xs text-[#524B45] leading-relaxed font-light">
                Because we refuse to warehouse generic inventory, every order triggers a dedicated 
                casting run. The 50% deposit directly commissions the materials and artisanal labor 
                for your specific piece.
              </p>
            </div>
          </div>
        </div>

        {/* Chapter 3: Objects for Discerning Spaces */}
        <div className="py-12 sm:py-20 text-center max-w-3xl mx-auto space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
            Designed to elevate your everyday ritual.
          </h2>
          <p className="text-xs sm:text-base text-[#736B63] font-light leading-relaxed">
            From the shores of Sidi Abdel Rahman to the historic high-ceilinged apartments of 
            Zamalek, Tocco House pieces are conversation starters that anchor residential and 
            hospitality interiors.
          </p>

          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigateTo('shop')}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-[0.25em] font-medium hover:bg-[#332F2D] transition-all"
            >
              Explore the Archive
            </button>
            <button
              onClick={() => navigateTo('custom-design')}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full border border-[#D8CEBF] text-[#1C1A19] text-xs uppercase tracking-[0.25em] font-medium hover:border-[#1C1A19] transition-all"
            >
              Commission Bespoke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
