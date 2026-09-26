'use client';

import React, { useState, useMemo } from 'react';
import { useToccoStore } from '@/lib/store';
import { normalizeApiError } from '@/lib/api/errors';
import { colorService } from '@/lib/api/services/colorService';
import { toWhatsAppNumber } from '@/lib/utils';
import { ProductFinish, ProductColor, ProductSize } from '@/types';
import { BackendColor } from '@/types/product';
import Image from '@/components/SafeImage';
import {
  ArrowLeft,
  MessageCircle,
  ShieldCheck,
  Truck,
  Sparkles,
  Check,
  Layers,
  Ruler,
  Maximize2,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';

export default function ProductDetailView() {
  const {
    selectedProductId,
    getProductById,
    navigateTo,
    addToCart,
    categories,
    settings,
  } = useToccoStore();

  const product = useMemo(() => {
    return selectedProductId ? getProductById(selectedProductId) : null;
  }, [selectedProductId, getProductById]);

  // Active state for configurable attributes
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedFinish, setSelectedFinish] = useState<ProductFinish>(
    product?.finishes[0] || 'MATTE'
  );
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    product?.colors[0] || { id: 'c-default', name: 'Default', hex: '#643D26' }
  );
  const [sharedColors, setSharedColors] = useState<BackendColor[]>([]);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isSharedColorsLoading, setIsSharedColorsLoading] = useState(false);
  const [isCustomColorSelected, setIsCustomColorSelected] = useState(false);
  const [isCreatingCustomColor, setIsCreatingCustomColor] = useState(false);
  const [customColorDraft, setCustomColorDraft] = useState('#A1B2C3');
  const [hasChosenCustomColor, setHasChosenCustomColor] = useState(false);
  const [customColorError, setCustomColorError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    product?.sizes?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // If no product selected, offer redirect to shop
  if (!product) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-lg text-[#1C1A19]">Piece not found</p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-widest"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);

  const toggleColorMenu = async () => {
    if (isColorMenuOpen) {
      setIsColorMenuOpen(false);
      return;
    }
    setIsColorMenuOpen(true);
    setCustomColorError(null);
    setIsSharedColorsLoading(true);
    try {
      setSharedColors(await colorService.getColors());
    } catch (err) {
      setCustomColorError(normalizeApiError(err).message);
    } finally {
      setIsSharedColorsLoading(false);
    }
  };

  const selectSharedColor = (color: BackendColor) => {
    setSelectedColor({ id: String(color.id), name: color.name, hex: color.hex_code });
    setIsCustomColorSelected(true);
    setIsColorMenuOpen(false);
    setCustomColorError(null);
  };

  const createCustomColor = async (hexCode: string) => {
    setIsCreatingCustomColor(true);
    setCustomColorError(null);
    try {
      const color = await colorService.createCustomColor(hexCode.toUpperCase());
      setSharedColors((current) =>
        current.some((item) => item.id === color.id) ? current : [color, ...current]
      );
      selectSharedColor(color);
    } catch (err) {
      setCustomColorError(normalizeApiError(err).message);
    } finally {
      setIsCreatingCustomColor(false);
    }
  };

  // Base price + size price delta
  const unitPrice = (product.price || 0) + (selectedSize?.priceDelta || 0);
  const depositRatio = settings.depositPercentage / 100;
  const depositDue = Math.round(unitPrice * depositRatio);
  const remainingDue = unitPrice - depositDue;

  // WhatsApp Enquiry URL with contextual product prefill
  const whatsappPrefill = `Hello Tocco House, I am inquiring about the "${product.name}".
Finish: ${selectedFinish}
Color: ${selectedColor.name}
${selectedSize ? `Size: ${selectedSize.name} (${selectedSize.dimensions})` : ''}
Could you please provide pricing and production details?`;

  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(settings.contact.whatsapp)}?text=${encodeURIComponent(
    whatsappPrefill
  )}`;

  const handleAddToCart = async () => {
    setCartError(null);
    setIsAddingToCart(true);
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0],
        unitPrice,
        selectedFinish,
        selectedColor,
        selectedSize,
        quantity,
      });

      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2000);
    } catch (err) {
      setCartError(normalizeApiError(err).message);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div id="product-detail-page" className="pt-20 sm:pt-28 pb-32 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation - scrollable on small screens */}
        <div className="py-2.5 sm:py-4 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs uppercase tracking-wider text-[#736B63] overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => navigateTo('shop')}
            className="flex items-center gap-1 hover:text-[#1C1A19] transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </button>
          <span>/</span>
          {category && (
            <>
              <button
                onClick={() => navigateTo('shop', { categoryId: category.id })}
                className="hover:text-[#1C1A19] transition-colors shrink-0"
              >
                {category.name}
              </button>
              <span>/</span>
            </>
          )}
          <span className="text-[#1C1A19] font-medium truncate max-w-[160px] sm:max-w-xs">{product.name}</span>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 pt-4 sm:pt-6">
          {/* Left: Product Imagery Showcase (7 cols) */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            {/* Primary Main Image with High Resolution */}
            <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-2xl overflow-hidden bg-[#EFEBE3] border border-[#EAE4DC] shadow-[0_12px_36px_rgba(40,25,15,0.06)]">
              <Image
                src={product.images[selectedImageIdx] || product.images[0]}
                alt={product.name}
                fill
                priority
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] sm:text-[11px] uppercase tracking-wider text-[#524B45] font-medium">
                {product.material.split(',')[0]}
              </div>
            </div>

            {/* Gallery Thumbnails (if multiple images exist) */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      selectedImageIdx === idx
                        ? 'border-[#643D26] opacity-100 shadow-sm'
                        : 'border-[#EAE4DC] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Craftsmanship & Material Details Accordion / Specs */}
            <div className="pt-4 sm:pt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#1C1A19]">
                  <Layers className="w-4 h-4 text-[#643D26]" />
                  <span>Material & Casting</span>
                </div>
                <p className="text-xs text-[#524B45] leading-relaxed font-light">
                  {product.material}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#1C1A19]">
                  <Ruler className="w-4 h-4 text-[#643D26]" />
                  <span>Dimensions & Weight</span>
                </div>
                <p className="text-xs text-[#524B45] leading-relaxed font-mono">
                  {product.dimensions}
                  {product.height && <span className="block mt-0.5">Height: {product.height} cm</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Specifications, Selection & Order Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            {/* Title & Tagline */}
            <div className="space-y-1.5 sm:space-y-2 pb-4 sm:pb-6 border-b border-[#EAE4DC]">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-medium text-[#B85D38]">
                {category?.name || 'Sculptural Object'}
              </span>
              <h1 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
                {product.name}
              </h1>
            </div>

            {/* Pricing Presentation */}
            <div className="space-y-2">
              <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-baseline gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl font-normal text-[#1C1A19]">
                      {unitPrice.toLocaleString()} EGP
                    </span>
                    <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[#736B63]">
                      Incl. Tax
                    </span>
                  </div>

                  {/* Deposit Callout */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-[#F5F0E8] border border-[#E6DDCE] space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#643D26]">
                      <span>{settings.depositPercentage}% Handcrafted Deposit:</span>
                      <span>{depositDue.toLocaleString()} EGP</span>
                    </div>
                    <p className="text-[11px] text-[#524B45] leading-normal">
                      Initiates raw casting in our Cairo atelier. The remaining balance ({remainingDue.toLocaleString()} EGP) is due upon delivery inspection.
                    </p>
                  </div>
              </div>
            </div>

            {/* Configurable Attribute: Finishes */}
            {product.finishes.length > 0 && (
              <div className="space-y-2.5 sm:space-y-3">
                <label className="block text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1A19]">
                  Finish: <span className="text-[#643D26] font-normal">{selectedFinish}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {product.finishes.map((finish) => (
                    <button
                      key={finish}
                      onClick={() => setSelectedFinish(finish)}
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-[11px] sm:text-xs uppercase tracking-wider font-medium transition-all ${
                        selectedFinish === finish
                          ? 'border-[#643D26] bg-[#F5EFEB] text-[#643D26] shadow-xs'
                          : 'border-[#D8CEBF] bg-[#FAF8F5] text-[#524B45] hover:border-[#1C1A19]'
                      }`}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Configurable Attribute: Color Swatches */}
            {(product.colors.length > 0 || product.allowsCustomization) && (
              <div className="space-y-2.5 sm:space-y-3">
                <label className="block text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1A19]">
                  Color: <span className="text-[#643D26] font-normal">{selectedColor.name}</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {product.colors.map((color) => {
                    const isChosen = selectedColor.id === color.id;
                    return (
                      <button
                        key={color.id}
                        onClick={() => {
                          setSelectedColor(color);
                          setIsCustomColorSelected(false);
                        }}
                        className={`group relative p-1 rounded-full border-2 transition-all touch-manipulation ${
                          isChosen ? 'border-[#643D26] scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        title={color.name}
                        aria-label={`Select color ${color.name}`}
                      >
                        <span
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full block border border-black/15 shadow-xs"
                          style={{ backgroundColor: color.hex }}
                        />
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => void toggleColorMenu()}
                    className={`group relative grid h-10 w-10 place-items-center rounded-full border-2 transition-all touch-manipulation ${
                      isCustomColorSelected ? 'border-[#643D26] scale-110' : 'border-[#D8CEBF] hover:border-[#643D26]'
                    }`}
                    title="Choose a custom color"
                    aria-label="Choose a custom color"
                    aria-expanded={isColorMenuOpen}
                  >
                    {isCustomColorSelected ? (
                      <span
                        className="h-7 w-7 rounded-full border border-black/15"
                        style={{ backgroundColor: selectedColor.hex }}
                      />
                    ) : (
                      <Plus className="h-4 w-4 text-[#643D26]" />
                    )}
                  </button>
                </div>
                {isColorMenuOpen && (
                  <div className="space-y-3 rounded-xl border border-[#EAE4DC] bg-white p-4">
                    <p className="text-[11px] text-[#736B63]">Explore more color options</p>
                    {isSharedColorsLoading ? (
                      <div className="flex justify-center py-2" aria-label="Loading shared colors">
                        <Loader2 className="h-4 w-4 animate-spin text-[#643D26]" />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {sharedColors.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => selectSharedColor(color)}
                            className={`grid h-9 w-9 place-items-center rounded-full border-2 transition-transform hover:scale-110 ${
                              selectedColor.id === String(color.id) ? 'border-[#643D26]' : 'border-[#D8CEBF]'
                            }`}
                            style={{ backgroundColor: color.hex_code }}
                            title={color.hex_code}
                            aria-label={`Select ${color.hex_code}`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col gap-2.5 border-t border-[#EAE4DC] pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[11px] text-[#736B63]">Looking for something more specific?</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#D8CEBF] bg-white px-3 py-2 text-[10px] uppercase tracking-wider text-[#1C1A19] hover:bg-[#FAF8F5]">
                          <span className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ backgroundColor: customColorDraft }} />
                          <span>Choose color</span>
                          <input
                            type="color"
                            value={customColorDraft}
                            aria-label="Pick a custom color"
                            disabled={isCreatingCustomColor}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            onChange={(event) => {
                              setCustomColorDraft(event.target.value.toUpperCase());
                              setHasChosenCustomColor(true);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void createCustomColor(customColorDraft)}
                          disabled={!hasChosenCustomColor || isCreatingCustomColor}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1C1A19] px-3 py-2 text-[10px] uppercase tracking-wider text-white hover:bg-[#332F2D] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {isCreatingCustomColor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          <span>{isCreatingCustomColor ? 'Adding...' : 'Add one'}</span>
                        </button>
                      </div>
                    </div>
                    {customColorError && (
                      <p role="alert" className="text-[11px] text-[#A33B2B]">{customColorError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Configurable Attribute: Sizes (if applicable) */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5 sm:space-y-3">
                <label className="block text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1A19]">
                  Size Dimension:
                </label>
                <div className="space-y-2">
                  {product.sizes.map((sz) => {
                    const isChosen = selectedSize?.id === sz.id;
                    return (
                      <button
                        key={sz.id}
                        onClick={() => setSelectedSize(sz)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isChosen
                            ? 'border-[#643D26] bg-[#F5EFEB]'
                            : 'border-[#D8CEBF] bg-[#FAF8F5] hover:border-[#1C1A19]'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#1C1A19] uppercase tracking-wider">
                            {sz.name}
                          </p>
                          <p className="text-[11px] text-[#736B63] font-mono">{sz.dimensions}</p>
                        </div>
                        {sz.priceDelta !== 0 && (
                          <span className="text-xs font-medium text-[#643D26]">
                            +{sz.priceDelta.toLocaleString()} EGP
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Production & Delivery Timeline */}
            <div className="pt-2 border-t border-[#EAE4DC] flex flex-col gap-2 text-xs text-[#524B45]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#643D26]" />
                <span>
                  <strong className="text-[#1C1A19]">Estimated manufacturing & delivery:</strong>{' '}
                  {product.deliveryDays ? `${product.deliveryDays} days` : product.leadTime}
                </span>
              </div>
            </div>

            {/* Primary Action Button (Desktop & in-page) */}
            <div className="pt-2 sm:pt-4 space-y-3">
              <div className="flex gap-2.5 sm:gap-3">
                  {/* Quantity */}
                  <div className="flex items-center border border-[#D8CEBF] rounded-full bg-white px-2.5 sm:px-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-2.5 sm:px-3 text-xs font-semibold text-[#1C1A19]">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    id="add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="flex-1 py-3.5 sm:py-4 rounded-full bg-[#1C1A19] text-white text-[11px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.25em] font-medium hover:bg-[#332F2D] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : addedAnimation ? (
                      <>
                        <Check className="w-4 h-4 text-[#25D366]" />
                        <span>Added to Design Bag</span>
                      </>
                    ) : (
                      <span>Add to Cart · {settings.depositPercentage}% Deposit</span>
                    )}
                  </button>
              </div>

              {/* Add to Cart Error */}
              {cartError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="font-medium text-red-800">{cartError}</p>
                </div>
              )}



              {/* Direct Concierge Inquiry secondary link */}
              <div className="text-center pt-1 sm:pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] uppercase tracking-wider text-[#736B63] hover:text-[#643D26] inline-flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3 h-3 text-[#25D366]" />
                  <span>Have questions? Inquire on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="pt-6 border-t border-[#EAE4DC] space-y-3">
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1A19]">
                The Narrative
              </h3>
              <p className="text-xs sm:text-sm text-[#524B45] font-light leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
