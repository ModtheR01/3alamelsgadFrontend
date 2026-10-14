'use client';

import React from 'react';
import { useToccoStore } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { X, Plus, Minus, Trash2, ArrowRight, ArrowLeft, ShieldCheck, ShoppingBag, Ruler } from 'lucide-react';
import Image from '@/components/SafeImage';

export default function CartDrawer() {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartDiscountTotal,
    cartFreeShipping,
    navigateTo,
    settings,
  } = useToccoStore();

  const { t, isRtl, getName } = useLanguage();

  if (!isCartDrawerOpen) return null;

  const handleCheckout = () => {
    setIsCartDrawerOpen(false);
    navigateTo('checkout');
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className={`fixed inset-y-0 ${isRtl ? 'left-0' : 'right-0'} max-w-full flex ${isRtl ? 'pr-0 sm:pr-10' : 'pl-0 sm:pl-10'}`}>
        <div className="w-screen max-w-full sm:max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-x border-[#EAE3D8] animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[#EAE3D8] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#A27B5C]" />
              <h2 className="text-sm font-bold text-[#251811]">
                {t('سلة المشتريات', 'Shopping Bag')} ({cart.length})
              </h2>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-[#8A796B] hover:text-[#251811] rounded-full hover:bg-[#EFE9DF] transition-colors"
              aria-label="Close Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Items List or Empty State */}
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#EFE9DF] flex items-center justify-center text-[#8A796B]">
                  <ShoppingBag className="w-7 h-7 text-[#A27B5C]" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-[#251811]">
                    {t('سلة المشتريات فارغة', 'Your bag is empty')}
                  </p>
                  <p className="text-xs text-[#8A796B] max-w-[240px]">
                    {t('تصفح تشكيلات السجاد التركي، الشرقي، وبدائل السجاد والأروال.', 'Discover luxury Turkish and oriental carpets.')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigateTo('shop');
                  }}
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#251811] text-white text-xs font-bold hover:bg-[#3D291D] transition-colors"
                >
                  {t('تصفح التشكيلات', 'Browse Collections')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#E8DEC0] flex flex-col gap-2.5 shadow-xs"
                  >
                    <div className="flex gap-3">
                      {/* Image Thumbnail */}
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#EFE9DF] shrink-0 border border-[#E0D5C6]">
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
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-xs sm:text-sm font-bold text-[#251811] leading-tight">
                              {item.productName}
                            </h3>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-[#9C8A7C] hover:text-red-600 p-1 transition-colors shrink-0"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* ARAWAL Badge & Dimension Specs */}
                          {item.arawalConfig ? (
                            <div className="mt-1.5 p-2 rounded-lg bg-[#FAF5EB] border border-[#E8DEC0] text-[11px] text-[#5C4A3E] space-y-0.5">
                              <div className="flex items-center gap-1 font-bold text-[#A27B5C]">
                                <Ruler className="w-3 h-3" />
                                <span>{t('رول أروال بالمتر:', 'Arawal Roll by Meter:')}</span>
                              </div>
                              <div className="flex items-center justify-between text-[#251811]">
                                <span>
                                  {t('العرض:', 'Width:')} <strong>{item.arawalConfig.width} {t('سم', 'cm')}</strong>
                                </span>
                                <span>
                                  {t('الطول:', 'Length:')} <strong>{item.arawalConfig.lengthMeters} {t('متر', 'm')}</strong>
                                </span>
                              </div>
                              <div className="text-[10px] text-[#8A796B]">
                                {t('سعر المتر:', 'Rate:')} {item.arawalConfig.unitPricePerMeter.toLocaleString()} {t('ج.م/متر', 'EGP/m')}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#7A6A5E]">
                              {item.selectedColor && (
                                <span className="flex items-center gap-1">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                                    style={{ backgroundColor: item.selectedColor.hex }}
                                  />
                                  {getName(item.selectedColor)}
                                </span>
                              )}
                              {item.selectedSize && (
                                <>
                                  <span>•</span>
                                  <span>{item.selectedSize.name}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Price & Quantity Adjuster */}
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#F2EDE5]">
                          <div className="flex items-center border border-[#DFD5C7] rounded-full bg-[#FAF8F5] px-2 py-0.5">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-[#7A6A5E] hover:text-[#251811]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-[#251811]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-[#7A6A5E] hover:text-[#251811]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-end">
                            <span className="text-xs sm:text-sm font-extrabold text-[#251811]">
                              {(item.subtotal || item.unitPrice * item.quantity).toLocaleString()} {t('ج.م', 'EGP')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Totals & Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-[#EAE3D8] bg-white space-y-4">
              {/* Discount Notice if applicable */}
              {cartDiscountTotal > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>{t('إجمالي الخصم:', 'Discount:')}</span>
                  <span className="font-bold">-{cartDiscountTotal.toLocaleString()} {t('ج.م', 'EGP')}</span>
                </div>
              )}

              {/* Subtotal */}
              <div className="flex justify-between items-baseline text-sm">
                <span className="text-[#665448] font-medium">{t('إجمالي المنتجات:', 'Products Subtotal:')}</span>
                <span className="font-extrabold text-base text-[#251811]">
                  {cartSubtotal.toLocaleString()} {t('ج.م', 'EGP')}
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-4 rounded-full bg-[#251811] hover:bg-[#3D291D] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
              >
                <span>{t('متابعة إتمام الطلب', 'Proceed to Checkout')}</span>
                <ArrowIcon className="w-4 h-4 text-[#C49F74]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
