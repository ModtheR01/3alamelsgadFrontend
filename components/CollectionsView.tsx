'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import Image from '@/components/SafeImage';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';

export default function CollectionsView() {
  const {
    collections,
    products,
    selectedCollectionId,
    navigateTo,
  } = useToccoStore();

  const [activeCollectionId, setActiveCollectionId] = useState<string>(
    selectedCollectionId || collections[0]?.id || ''
  );

  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) || collections[0];

  // Products belonging to the active collection
  const collectionProducts = products.filter(
    (p) => p.collectionId === activeCollection?.id && p.isPublished
  );

  return (
    <div id="collections-page" className="pt-20 sm:pt-28 pb-20 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="py-6 sm:py-12 border-b border-[#EAE4DC] space-y-2 sm:space-y-4">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
            Curated Themes
          </span>
          <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-[#1C1A19]">
            Collections
          </h1>
          <p className="text-xs sm:text-base text-[#736B63] font-light max-w-2xl leading-relaxed">
            Each collection explores a distinct dialogue between sculptural form, Mediterranean
            light, and architectural character.
          </p>
        </div>

        {/* Collection Selector Tabs */}
        <div className="py-4 sm:py-6 border-b border-[#EAE4DC] flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
          {collections.map((col) => {
            const isSelected = activeCollection?.id === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setActiveCollectionId(col.id)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#1C1A19] text-white shadow-sm'
                    : 'bg-[#EFEBE3] text-[#524B45] hover:bg-[#E5DFD4]'
                }`}
              >
                {col.name}
              </button>
            );
          })}
        </div>

        {/* Active Collection Editorial Feature */}
        {activeCollection && (
          <div className="py-6 sm:py-12 space-y-8 sm:space-y-16">
            {/* Cinematic Hero Card for Collection */}
            <div className="relative h-[280px] sm:h-[420px] md:h-[500px] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-[#EAE4DC]">
              <Image
                src={activeCollection.coverImage}
                alt={activeCollection.name}
                fill
                priority
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A19]/90 via-[#1C1A19]/40 to-transparent" />

              <div className="absolute inset-0 p-5 sm:p-12 flex flex-col justify-end text-white max-w-3xl space-y-2 sm:space-y-3">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#D97750] font-medium">
                  {activeCollection.subtitle}
                </span>
                <h2 className="text-2xl sm:text-5xl font-normal tracking-tight text-white">
                  {activeCollection.name}
                </h2>
                <p className="text-xs sm:text-base text-[#EBE3D5] font-light leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {activeCollection.description}
                </p>
              </div>
            </div>

            {/* Pieces within this collection */}
            <div className="space-y-4 sm:space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-2xl font-normal text-[#1C1A19]">
                    Pieces in this Collection ({collectionProducts.length})
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#736B63] font-light">
                    Hand-cast to order in our Cairo atelier.
                  </p>
                </div>
              </div>

              {collectionProducts.length === 0 ? (
                <div className="py-12 text-center text-xs sm:text-sm text-[#736B63]">
                  No pieces currently assigned to this collection. Check back soon.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                  {collectionProducts.map((product) => {
                    return (
                      <div
                        key={product.id}
                        onClick={() => navigateTo('product', { productId: product.id })}
                        className="group bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#EAE4DC] hover:shadow-[0_8px_30px_rgba(30,20,10,0.06)] transition-all cursor-pointer flex flex-col"
                      >
                        <div className="relative aspect-[4/5] bg-[#EFEBE3] overflow-hidden">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                          <div>
                            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8F8880] block truncate">
                              {product.material.split(',')[0]}
                            </span>
                            <h4 className="text-xs sm:text-base font-medium sm:font-normal text-[#1C1A19] group-hover:text-[#643D26] transition-colors truncate">
                              {product.name}
                            </h4>
                            <p className="hidden sm:block text-xs text-[#736B63] line-clamp-2 mt-1 font-light">
                              {product.description}
                            </p>
                          </div>

                          <div className="pt-2 sm:pt-3 border-t border-[#EAE4DC] flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-semibold text-[#1C1A19]">
                              {product.price?.toLocaleString()} EGP
                            </span>

                            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#736B63] group-hover:text-[#1C1A19] transition-colors flex items-center gap-1">
                              <span>Details</span>
                              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
