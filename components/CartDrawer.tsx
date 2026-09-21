'use client';

import React from 'react';
import { useToccoStore } from '@/lib/store';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import Image from '@/components/SafeImage';

export default function CartDrawer() {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    updateCartItemNote,
    cartSubtotal,
    cartDepositAmount,
    cartRemainingAmount,
    cartDiscountTotal,
    cartFreeShipping,
    navigateTo,
    settings,
  } = useToccoStore();

  if (!isCartDrawerOpen) return null;

  const handleCheckout = () => {
    setIsCartDrawerOpen(false);
    navigateTo('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-[#EAE4DC] animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-[#EAE4DC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#643D26]" />
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-[#1C1A19]">
                Design Bag ({cart.length})
              </h2>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-[#736B63] hover:text-[#1C1A19] rounded-full hover:bg-[#EFEBE3] transition-colors"
              aria-label="Close Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Items List or Empty State */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#EFEBE3] flex items-center justify-center text-[#8F8880]">
                  <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-medium text-[#1C1A19]">Your bag is empty</p>
                  <p className="text-xs text-[#736B63] max-w-[240px]">
                    Explore our distinctive fiberglass furniture and sculptural objects.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigateTo('shop');
                  }}
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-widest font-medium hover:bg-[#332F2D] transition-colors"
                >
                  Discover Pieces
                </button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="pb-4 sm:pb-6 border-b border-[#EAE4DC] flex flex-col gap-2.5 sm:gap-3 group"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Image Thumbnail */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-[#EFEBE3] shrink-0 border border-[#E2DDD3]">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-xs sm:text-sm font-medium text-[#1C1A19] truncate">
                              {item.productName}
                            </h3>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-[#8F8880] hover:text-[#B85D38] p-1 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#736B63]">
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                                style={{ backgroundColor: item.selectedColor.hex }}
                              />
                              {item.selectedColor.name}
                            </span>
                            <span>•</span>
                            <span>{item.selectedFinish}</span>
                            {item.selectedSize && (
                              <>
                                <span>•</span>
                                <span>{item.selectedSize.name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-[#D8CEBF] rounded-full bg-white px-2 py-0.5">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-medium text-[#1C1A19]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <p className="text-xs sm:text-sm font-semibold text-[#1C1A19]">
                            {item.discountAmount ? (
                              <span className="flex flex-col items-end">
                                <span className="text-[10px] text-[#8F8880] line-through font-normal">
                                  {(item.originalSubtotal ?? item.unitPrice * item.quantity).toLocaleString()} EGP
                                </span>
                                <span>{(item.subtotal ?? item.unitPrice * item.quantity).toLocaleString()} EGP</span>
                              </span>
                            ) : (
                              `${(item.subtotal ?? item.unitPrice * item.quantity).toLocaleString()} EGP`
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {item.offerName && (
                      <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5EBE6] text-[#B85D38] text-[10px] font-medium uppercase tracking-wider">
                        {item.offerName}
                      </span>
                    )}

                    {/* Order Note per item */}
                    <div className="pt-0.5">
                      <input
                        type="text"
                        value={item.customNote || ''}
                        onChange={(e) => updateCartItemNote(item.id, e.target.value)}
                        placeholder="Add note (e.g. dimensions, color tint)..."
                        className="w-full text-[11px] sm:text-xs px-2.5 py-1.5 bg-[#F2EDE4] rounded-md border border-[#E0D8CB] placeholder-[#948D85] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer: 50% Deposit Breakdown & Checkout CTA */}
          {cart.length > 0 && (
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-t border-[#EAE4DC] bg-[#FAF8F5] space-y-3 sm:space-y-4">
              {/* Deposit notice callout */}
              <div className="p-3 rounded-lg bg-[#F5F0E8] border border-[#E6DDCE] flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#643D26] shrink-0 mt-0.5" />
                <div className="text-[11px] sm:text-xs text-[#524B45] leading-relaxed">
                  <span className="font-semibold text-[#1C1A19]">
                    {settings.depositPercentage}% Handcrafted Deposit:
                  </span>{' '}
                  Initiates workshop casting. Remaining 50% paid upon delivery inspection.
                </div>
              </div>

              {/* Price calculations */}
              <div className="space-y-1 text-xs text-[#524B45]">
                {cartDiscountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Offer Savings</span>
                    <span className="font-medium">-{cartDiscountTotal.toLocaleString()} EGP</span>
                  </div>
                )}
                {cartFreeShipping && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Total Order Value</span>
                  <span className="font-medium text-[#1C1A19]">{cartSubtotal.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between font-semibold text-xs sm:text-sm text-[#643D26] pt-0.5">
                  <span>{settings.depositPercentage}% Deposit Due Today</span>
                  <span>{cartDepositAmount.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-[10px] sm:text-[11px] text-[#736B63]">
                  <span>Remaining 50% upon delivery</span>
                  <span>{cartRemainingAmount.toLocaleString()} EGP</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                id="cart-proceed-checkout-btn"
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#332F2D] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
