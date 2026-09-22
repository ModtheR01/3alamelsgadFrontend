'use client';

import React, { useState, useMemo } from 'react';
import { useToccoStore } from '@/lib/store';
import { Product } from '@/types';
import Image from '@/components/SafeImage';
import { Search, Filter, SlidersHorizontal, ArrowRight, MessageCircle } from 'lucide-react';

export default function ShopCatalog() {
  const {
    products,
    categories,
    selectedCategoryId,
    navigateTo,
    searchQuery,
    setSearchQuery,
    settings,
  } = useToccoStore();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(
    selectedCategoryId || 'all'
  );
  const [activeFinishFilter, setActiveFinishFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Must be published
      if (!product.isPublished) return false;

      // Category filter
      if (activeCategoryFilter !== 'all' && product.categoryId !== activeCategoryFilter) {
        return false;
      }

      // Finish filter
      if (activeFinishFilter !== 'all' && !product.finishes.includes(activeFinishFilter as any)) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        const matchesMaterial = product.material.toLowerCase().includes(q);
        const matchesColor = product.colors.some((c) => c.name.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesMaterial && !matchesColor) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'price-asc') {
        return (a.price || 999999) - (b.price || 999999);
      }
      if (sortBy === 'price-desc') {
        return (b.price || 0) - (a.price || 0);
      }
      // 'featured'
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, activeCategoryFilter, activeFinishFilter, searchQuery, sortBy]);

  const visibleCategories = categories.filter((c) => c.isVisible);

  return (
    <div id="shop-catalog-page" className="pt-20 sm:pt-28 pb-16 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="py-6 sm:py-12 border-b border-[#EAE4DC] space-y-2 sm:space-y-4">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] font-medium text-[#B85D38]">
            Catalog of Objects
          </span>
          <h1 className="text-2xl sm:text-5xl font-normal tracking-tight text-[#1C1A19]">
            The Collection
          </h1>
          <p className="text-xs sm:text-base text-[#736B63] font-light max-w-2xl leading-relaxed">
            Each fiberglass piece is hand-laminated and hand-glazed in our Cairo atelier. 
            All objects require a {settings.depositPercentage}% deposit to initiate artisanal casting.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="py-4 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-[#EAE4DC]">
          {/* Category Chips - smooth touch scrolling */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-all ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#1C1A19] text-white'
                  : 'bg-[#EFEBE3] text-[#524B45] hover:bg-[#E5DFD4]'
              }`}
            >
              All Objects ({products.filter((p) => p.isPublished).length})
            </button>

            {visibleCategories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id && p.isPublished).length;
              const isSelected = activeCategoryFilter === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#1C1A19] text-white'
                      : 'bg-[#EFEBE3] text-[#524B45] hover:bg-[#E5DFD4]'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Secondary Finish & Sort Selectors */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
            {/* Finish Filter */}
            <select
              value={activeFinishFilter}
              onChange={(e) => setActiveFinishFilter(e.target.value)}
              className="w-full sm:w-auto bg-[#FAF8F5] border border-[#D8CEBF] text-[11px] sm:text-xs uppercase tracking-wider text-[#1C1A19] rounded-full px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="all">All Finishes</option>
              <option value="Matte">Matte Glaze</option>
              <option value="Glossy">High-Gloss Marine</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-[#FAF8F5] border border-[#D8CEBF] text-[11px] sm:text-xs uppercase tracking-wider text-[#1C1A19] rounded-full px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Releases</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active search banner if query present */}
        {searchQuery && (
          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-[#F2EDE4] flex items-center justify-between text-xs text-[#524B45]">
            <span>Matching &ldquo;{searchQuery}&rdquo; ({filteredProducts.length} pieces)</span>
            <button
              onClick={() => setSearchQuery('')}
              className="font-medium text-[#B85D38] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Products Grid: 2 columns on mobile, 3 columns on desktop */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 sm:py-24 text-center space-y-4">
            <p className="text-base sm:text-lg text-[#1C1A19] font-medium">No design pieces found</p>
            <p className="text-xs sm:text-sm text-[#736B63] max-w-sm mx-auto font-light">
              Try adjusting your category or finish filters to explore our available objects.
            </p>
            <button
              onClick={() => {
                setActiveCategoryFilter('all');
                setActiveFinishFilter('all');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-widest font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 pt-6 sm:pt-10">
            {filteredProducts.map((product) => {
              const whatsappUrl = `https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hello Tocco House, I am interested in inquiring about the "${product.name}".`
              )}`;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-[#FAF8F5] rounded-xl sm:rounded-2xl overflow-hidden border border-[#EAE4DC] hover:shadow-[0_12px_40px_rgba(40,25,15,0.07)] transition-all duration-300"
                >
                  {/* Image Presentation */}
                  <div
                    onClick={() => navigateTo('product', { productId: product.id })}
                    className="relative aspect-[4/5] bg-[#EFEBE3] overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1">
                      <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-sm text-[8px] sm:text-[10px] uppercase tracking-wider text-[#524B45] font-medium shadow-2xs">
                        {product.deliveryDays ? `${product.deliveryDays} days` : product.leadTime}
                      </span>
                    </div>

                  </div>

                  {/* Product Info Block */}
                  <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-4">
                    <div className="space-y-1 sm:space-y-2">
                      {/* Available Colors Palette Swatches */}
                      <div className="flex items-center gap-1">
                        {product.colors.slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            title={c.name}
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-black/15 shadow-2xs inline-block"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                        {product.colors.length > 3 && (
                          <span className="text-[9px] sm:text-[10px] text-[#8F8880] font-mono">
                            +{product.colors.length - 3}
                          </span>
                        )}
                        <span className="text-[9px] sm:text-[11px] text-[#8F8880] ml-1 sm:ml-2 truncate">
                          {product.finishes[0]}
                        </span>
                      </div>

                      <h3
                        onClick={() => navigateTo('product', { productId: product.id })}
                        className="text-xs sm:text-lg font-normal text-[#1C1A19] group-hover:text-[#643D26] transition-colors cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-[#736B63] line-clamp-2 font-light leading-relaxed hidden sm:block">
                        {product.description}
                      </p>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-2 sm:pt-4 border-t border-[#EAE4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-base font-semibold text-[#1C1A19]">
                            {product.price?.toLocaleString()} EGP
                          </span>
                          <span className="text-[8px] sm:text-[10px] text-[#8F8880]">
                            Deposit: {Math.round((product.price || 0) * settings.depositPercentage / 100).toLocaleString()} EGP
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigateTo('product', { productId: product.id })}
                        className="w-full sm:w-auto text-center px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#D8CEBF] text-[9px] sm:text-[11px] uppercase tracking-wider font-medium text-[#1C1A19] hover:bg-[#1C1A19] hover:text-white hover:border-[#1C1A19] transition-all"
                      >
                        View Piece
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
