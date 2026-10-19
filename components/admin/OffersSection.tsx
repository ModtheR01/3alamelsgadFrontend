'use client';

import React, { useState, useMemo } from 'react';
import { Product } from '@/types';
import { BackendOffer, OfferCreateRequest, OfferType } from '@/types/offer';
import {
  Tag,
  Plus,
  Percent,
  Package,
  Calendar,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Minus,
  Layers,
} from 'lucide-react';

interface OffersSectionProps {
  offers: BackendOffer[];
  products: Product[];
  isLoading: boolean;
  onSaveOffer: (offerData: OfferCreateRequest, offerId?: number) => Promise<void>;
  onDeleteOffer: (offerId: number) => Promise<void>;
  onRequestDeleteConfirm: (title: string, message: string, onConfirm: () => void | Promise<void>) => void;
}

interface SelectedTarget {
  productId: number;
  sizeId: number | null;
  quantity: number;
}

export default function OffersSection({
  offers,
  products,
  isLoading,
  onSaveOffer,
  onDeleteOffer,
  onRequestDeleteConfirm,
}: OffersSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);

  // Form State
  const [offerName, setOfferName] = useState('');
  const [offerType, setOfferType] = useState<OfferType>('PERCENTAGE');
  const [percentageValue, setPercentageValue] = useState<string>('20');
  const [bundlePriceValue, setBundlePriceValue] = useState<string>('1000');
  const [selectedTargets, setSelectedTargets] = useState<Record<string, SelectedTarget>>({});
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Search filter for products in modal
  const [searchQuery, setSearchQuery] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Only ordinary carpet products participate in size-specific offers
  const ordinaryProducts = useMemo(() => {
    return (products || []).filter((p) => !p.isArawal);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return ordinaryProducts;
    const query = searchQuery.trim().toLowerCase();
    return ordinaryProducts.filter((p) => {
      const nameAr = (p.name_ar || p.name || '').toLowerCase();
      const nameEn = (p.name_en || '').toLowerCase();
      return nameAr.includes(query) || nameEn.includes(query);
    });
  }, [ordinaryProducts, searchQuery]);

  const handleOpenAdd = () => {
    setEditingOfferId(null);
    setOfferName('');
    setOfferType('PERCENTAGE');
    setPercentageValue('20');
    setBundlePriceValue('1000');
    setSelectedTargets({});
    setSearchQuery('');
    setStartsAt(new Date().toISOString().slice(0, 10));
    setEndsAt('');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: BackendOffer) => {
    setEditingOfferId(offer.id);
    setOfferName(offer.name_ar || offer.name || offer.name_en || '');
    setOfferType(offer.offer_type);
    setPercentageValue(offer.percentage ? String(offer.percentage) : '20');
    setBundlePriceValue(offer.bundle_price ? String(offer.bundle_price) : '1000');

    const prods = offer.products || (offer as any).offer_products || [];
    const restoredTargets: Record<string, SelectedTarget> = {};

    prods.forEach((p: any) => {
      const pId = Number(p.product_id);
      const sId =
        p.size_id !== undefined && p.size_id !== null
          ? Number(p.size_id)
          : p.size?.id !== undefined && p.size?.id !== null
          ? Number(p.size.id)
          : null;
      const qty = p.quantity || 1;

      if (sId !== null) {
        restoredTargets[`${pId}_${sId}`] = {
          productId: pId,
          sizeId: sId,
          quantity: qty,
        };
      } else {
        // Legacy offer targeting product without explicit size_id
        const matchedProduct = products.find(
          (prod) => parseInt(prod.id.replace(/\D/g, ''), 10) === pId
        );
        if (matchedProduct?.sizes && matchedProduct.sizes.length > 0) {
          // Expand to all sizes so admin sees and can adjust individual sizes
          matchedProduct.sizes.forEach((s) => {
            const sizeNum = parseInt(s.id.replace(/\D/g, ''), 10);
            restoredTargets[`${pId}_${sizeNum}`] = {
              productId: pId,
              sizeId: sizeNum,
              quantity: qty,
            };
          });
        } else {
          restoredTargets[`${pId}_null`] = {
            productId: pId,
            sizeId: null,
            quantity: qty,
          };
        }
      }
    });

    setSelectedTargets(restoredTargets);
    setSearchQuery('');
    setStartsAt(offer.starts_at ? offer.starts_at.slice(0, 10) : '');
    setEndsAt(offer.ends_at ? offer.ends_at.slice(0, 10) : '');
    setIsActive(offer.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleSize = (productId: number, sizeId: number) => {
    const key = `${productId}_${sizeId}`;
    setSelectedTargets((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          productId,
          sizeId,
          quantity: 1,
        };
      }
      return next;
    });
  };

  const handleToggleAllSizesForProduct = (product: Product) => {
    const pId = parseInt(product.id.replace(/\D/g, ''), 10);
    if (!product.sizes || product.sizes.length === 0) return;

    const areAllSelected = product.sizes.every((s) => {
      const sId = parseInt(s.id.replace(/\D/g, ''), 10);
      return Boolean(selectedTargets[`${pId}_${sId}`]);
    });

    setSelectedTargets((prev) => {
      const next = { ...prev };
      product.sizes!.forEach((s) => {
        const sId = parseInt(s.id.replace(/\D/g, ''), 10);
        const key = `${pId}_${sId}`;
        if (areAllSelected) {
          delete next[key];
        } else {
          next[key] = {
            productId: pId,
            sizeId: sId,
            quantity: prev[key]?.quantity || 1,
          };
        }
      });
      return next;
    });
  };

  const handleUpdateQuantity = (productId: number, sizeId: number, delta: number) => {
    const key = `${productId}_${sizeId}`;
    setSelectedTargets((prev) => {
      if (!prev[key]) return prev;
      const currentQty = prev[key].quantity || 1;
      const nextQty = Math.max(1, currentQty + delta);
      return {
        ...prev,
        [key]: {
          ...prev[key],
          quantity: nextQty,
        },
      };
    });
  };

  // Calculate total original value for bundle preview
  const bundleOriginalTotal = useMemo(() => {
    if (offerType !== 'BUNDLE') return 0;
    let sum = 0;
    Object.values(selectedTargets).forEach((target) => {
      const product = products.find(
        (p) => parseInt(p.id.replace(/\D/g, ''), 10) === target.productId
      );
      if (product) {
        if (target.sizeId !== null && product.sizes) {
          const sizeObj = product.sizes.find(
            (s) => parseInt(s.id.replace(/\D/g, ''), 10) === target.sizeId
          );
          const price = sizeObj?.originalPrice ?? sizeObj?.price ?? product.price ?? 0;
          sum += price * (target.quantity || 1);
        } else {
          const price = product.originalPrice ?? product.price ?? 0;
          sum += price * (target.quantity || 1);
        }
      }
    });
    return sum;
  }, [selectedTargets, products, offerType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerName.trim()) {
      setFormError('اسم العرض الترويجي مطلوب.');
      return;
    }

    if (offerType === 'PERCENTAGE' && (!percentageValue || Number(percentageValue) <= 0)) {
      setFormError('يرجى تحديد نسبة خصم صحيحة (مثال: 20%).');
      return;
    }

    if (offerType === 'BUNDLE' && (!bundlePriceValue || Number(bundlePriceValue) <= 0)) {
      setFormError('يرجى تحديد السعر الإجمالي للباقة بالجنيه.');
      return;
    }

    const targetList = Object.values(selectedTargets);
    if (targetList.length === 0) {
      setFormError('يرجى اختيار مقاس أو منتج واحد على الأقل ينطبق عليه هذا العرض.');
      return;
    }

    const trimmedTitle = offerName.trim();
    const payload: OfferCreateRequest = {
      name: trimmedTitle,
      name_ar: trimmedTitle,
      name_en: trimmedTitle,
      offer_type: offerType,
      percentage: offerType === 'PERCENTAGE' ? Number(percentageValue) : null,
      bundle_price: offerType === 'BUNDLE' ? Number(bundlePriceValue) : null,
      products: targetList.map((t) => ({
        product_id: t.productId,
        size_id: t.sizeId,
        quantity: offerType === 'BUNDLE' ? t.quantity || 1 : 1,
      })),
      offer_products: targetList.map((t) => ({
        product_id: t.productId,
        size_id: t.sizeId,
        ...(offerType === 'BUNDLE' ? { quantity: t.quantity || 1 } : {}),
      })),
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      is_active: isActive,
    };

    setIsSaving(true);
    setFormError(null);
    try {
      await onSaveOffer(payload, editingOfferId || undefined);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'تعذر حفظ العرض');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTargetsCount = Object.keys(selectedTargets).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
            العروض والخصومات الترويجية
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            إنشاء حملات الخصم بالنسب المئوية بمستوى المقاسات أو باقات المنتجات بسعر موحد مع تحديد المقاسات الفعلية والأسعار.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#EED8BE]" />
          <span>إضافة عرض جديد</span>
        </button>
      </div>

      {/* Offers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-3 bg-white rounded-2xl border border-[#EAE3D8] shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FAF5EB] text-[#A27B5C] flex items-center justify-center mx-auto">
              <Tag className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#241710]">لا توجد عروض ترويجية نشطة حالياً</p>
            <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
              يمكنك إنشاء عروض الخصم المئوي بالمقاس أو باقات المنتجات لتشجيع عملاء المتجر على الشراء.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold"
            >
              إنشاء أول عرض الآن
            </button>
          </div>
        ) : (
          offers.map((offer) => {
            const isPercentage = offer.offer_type === 'PERCENTAGE';
            const isBundle = offer.offer_type === 'BUNDLE';
            const offerTargets = offer.products || (offer as any).offer_products || [];

            return (
              <div
                key={offer.id}
                className="p-5 rounded-2xl border border-[#EAE3D8] bg-white shadow-xs hover:border-[#D8CEBF] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isPercentage
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-purple-100 text-purple-900 border border-purple-300'
                      }`}
                    >
                      {isPercentage ? 'خصم نسبة مئوية' : 'باقة بسعر موحد'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        offer.is_active
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {offer.is_active ? 'نشط بالمتجر' : 'معطل'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#241710]">
                      {offer.name_ar || offer.name || offer.name_en}
                    </h3>
                    <div className="mt-2 text-2xl font-black text-[#A27B5C]">
                      {isPercentage && `خصم ${offer.percentage}٪`}
                      {isBundle && `${Number(offer.bundle_price || 0).toLocaleString('ar-EG')} ج.م`}
                    </div>
                  </div>

                  <div className="text-xs text-[#5C4A3E] space-y-2 pt-3 border-t border-[#F5EFE6]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8C7A6B]">المشمول بالعرض:</span>
                      <strong className="text-[#241710]">
                        {offerTargets.length} {offerTargets.length === 1 ? 'عنصر/مقاس' : 'عناصر/مقاسات'}
                      </strong>
                    </div>

                    {/* Preview list of targets with sizes */}
                    {offerTargets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {offerTargets.slice(0, 3).map((target: any, tIdx: number) => {
                          const sizeLabel =
                            target.size_name ||
                            (target.size ? `${target.size.width} × ${target.size.length} سم` : '');
                          const prodName =
                            target.product_name ||
                            products.find(
                              (p) => parseInt(p.id.replace(/\D/g, ''), 10) === target.product_id
                            )?.name_ar ||
                            'منتج';
                          return (
                            <span
                              key={tIdx}
                              className="inline-flex items-center gap-1 text-[10px] bg-[#FAF8F5] border border-[#EAE3D8] text-[#5C4A3E] px-2 py-0.5 rounded-lg truncate max-w-[200px]"
                            >
                              <span className="truncate">{prodName}</span>
                              {sizeLabel && (
                                <span className="text-[#A27B5C] font-semibold shrink-0">
                                  ({sizeLabel})
                                </span>
                              )}
                              {isBundle && target.quantity && target.quantity > 1 && (
                                <span className="text-purple-700 font-bold shrink-0">
                                  ×{target.quantity}
                                </span>
                              )}
                            </span>
                          );
                        })}
                        {offerTargets.length > 3 && (
                          <span className="text-[10px] text-[#8C7A6B] font-bold px-1 py-0.5">
                            +{offerTargets.length - 3} أخرى
                          </span>
                        )}
                      </div>
                    )}

                    {offer.starts_at && (
                      <p className="text-[11px] text-[#8C7A6B] flex items-center gap-1.5 pt-1">
                        <Clock className="w-3.5 h-3.5 text-[#A27B5C]" />
                        <span>
                          ساري من {offer.starts_at.slice(0, 10)}{' '}
                          {offer.ends_at ? `إلى ${offer.ends_at.slice(0, 10)}` : ''}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F5EFE6] flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(offer)}
                    className="p-1.5 rounded-lg text-[#5C4A3E] hover:text-[#241710] hover:bg-[#FAF8F5] transition-colors"
                    title="تعديل العرض"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      onRequestDeleteConfirm(
                        `حذف العرض: «${offer.name_ar || offer.name || offer.name_en}»`,
                        'هل أنت متأكد من رغبتك في حذف هذا العرض الترويجي؟ لن يتم تطبيق الخصم في سلة المشتريات بعد الحذف.',
                        () => onDeleteOffer(offer.id)
                      )
                    }
                    className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                    title="حذف العرض"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= ADD / EDIT OFFER MODAL ================= */}
      {isModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 p-6 space-y-5 shadow-2xl border border-[#EAE3D8] max-h-[92vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D8]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF5EB] text-[#A27B5C]">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#241710]">
                  {editingOfferId ? 'تعديل العرض الترويجي' : 'إنشاء عرض ترويجي جديد'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#241710] hover:bg-[#F5EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">
                  عنوان العرض <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  placeholder="مثال: خصم ٢٠٪ على مقاسات السجاد الكلاسيك، أو باقة ٣ قطع بـ ١٠٠٠ جنيه"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                />
              </div>

              {/* Offer Type Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#241710]">
                  نوع العرض الترويجي <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-bold transition-all ${
                      offerType === 'PERCENTAGE'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                        : 'bg-[#FAF8F5] border-[#EAE3D8] text-[#5C4A3E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="offerType"
                      checked={offerType === 'PERCENTAGE'}
                      onChange={() => setOfferType('PERCENTAGE')}
                      className="text-amber-600"
                    />
                    <span>خصم نسبة مئوية (٪)</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-bold transition-all ${
                      offerType === 'BUNDLE'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-500'
                        : 'bg-[#FAF8F5] border-[#EAE3D8] text-[#5C4A3E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="offerType"
                      checked={offerType === 'BUNDLE'}
                      onChange={() => setOfferType('BUNDLE')}
                      className="text-purple-600"
                    />
                    <span>باقة منتجات (سعر موحد)</span>
                  </label>
                </div>
              </div>

              {/* Value Input */}
              {offerType === 'PERCENTAGE' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">
                    نسبة الخصم المئوية (٪) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={percentageValue}
                    onChange={(e) => setPercentageValue(e.target.value)}
                    placeholder="20"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">
                    السعر الإجمالي للباقة (ج.م) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={bundlePriceValue}
                    onChange={(e) => setBundlePriceValue(e.target.value)}
                    placeholder="1000"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                  />
                </div>
              )}

              {/* ================= APPLICABLE PRODUCTS & SIZES SELECTOR ================= */}
              <div className="space-y-2 pt-2 border-t border-[#F5EFE6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-[#241710]">
                    المنتجات والمقاسات المشمولة في العرض ({selectedTargetsCount} مقاس محدد){' '}
                    <span className="text-rose-600">*</span>
                  </label>

                  {/* Search products filter */}
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 text-[#8C7A6B] absolute right-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث في المنتجات..."
                      className="w-full text-[11px] pr-8 pl-2.5 py-1.5 rounded-lg border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
                    />
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-xl border border-[#EAE3D8] p-2 bg-[#FAF8F5] space-y-3">
                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8C7A6B]">
                      {ordinaryProducts.length === 0
                        ? 'لا توجد منتجات سجاد عادية متاحة.'
                        : 'لا توجد منتجات مطابقة لكلمة البحث.'}
                    </div>
                  ) : (
                    filteredProducts.map((p, idx) => {
                      const numId = parseInt(p.id.replace(/\D/g, ''), 10) || idx + 1;
                      const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;

                      // Count selected sizes for this product
                      const selectedSizesForProduct = hasSizes
                        ? p.sizes!.filter((s) => {
                            const sId = parseInt(s.id.replace(/\D/g, ''), 10);
                            return Boolean(selectedTargets[`${numId}_${sId}`]);
                          })
                        : [];
                      const areAllSizesSelected =
                        hasSizes && selectedSizesForProduct.length === p.sizes!.length;

                      return (
                        <div
                          key={p.id}
                          className="rounded-xl border border-[#EAE3D8] bg-white overflow-hidden shadow-2xs"
                        >
                          {/* Product Header */}
                          <div className="p-3 bg-[#FAF8F5] border-b border-[#F0EAE1] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#EFE9DF] shrink-0 overflow-hidden flex items-center justify-center text-[#8C7A6B]">
                                {p.images && p.images[0] ? (
                                  <img
                                    src={p.images[0]}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Layers className="w-4 h-4 text-[#A27B5C]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-[#241710] truncate">
                                  {p.name_ar || p.name || p.name_en}
                                </h4>
                                <span className="text-[10px] text-[#8C7A6B]">
                                  {hasSizes
                                    ? selectedSizesForProduct.length > 0
                                      ? `تم تحديد ${selectedSizesForProduct.length} من ${p.sizes!.length} مقاسات`
                                      : `${p.sizes!.length} مقاسات متوفرة`
                                    : 'بدون مقاسات مسجلة'}
                                </span>
                              </div>
                            </div>

                            {/* Select All Sizes Toggle Button */}
                            {hasSizes && (
                              <button
                                type="button"
                                onClick={() => handleToggleAllSizesForProduct(p)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                                  areAllSizesSelected
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                    : 'bg-[#FAF5EB] text-[#A27B5C] border border-[#EAE3D8] hover:bg-[#F2ECE3]'
                                }`}
                              >
                                {areAllSizesSelected ? 'إلغاء تحديد الكل' : 'تحديد كل المقاسات'}
                              </button>
                            )}
                          </div>

                          {/* Sizes List or No-Size Message */}
                          {!hasSizes ? (
                            <div className="p-3 bg-amber-50/60 border-t border-amber-100/80 text-[11px] text-amber-900 flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>
                                لا توجد مقاسات مسجلة لهذا المنتج. يرجى إضافة مقاسات وأسعار للمنتج أولاً من قسم المنتجات.
                              </span>
                            </div>
                          ) : (
                            <div className="divide-y divide-[#F5EFE6]">
                              {p.sizes!.map((s) => {
                                const sId = parseInt(s.id.replace(/\D/g, ''), 10);
                                const isSelected = Boolean(selectedTargets[`${numId}_${sId}`]);
                                const actualPrice = s.originalPrice ?? s.price;
                                const sizeDimensions =
                                  s.width && s.length
                                    ? `${s.width} × ${s.length} سم`
                                    : s.dimensions || s.name;

                                // Computed discount values for percentage offers
                                const pctVal = Number(percentageValue) || 0;
                                const hasPrice = actualPrice !== undefined && actualPrice !== null;
                                const discountAmount =
                                  hasPrice && pctVal > 0 ? Math.round((actualPrice * pctVal) / 100) : 0;
                                const discountedPrice =
                                  hasPrice && pctVal > 0 ? Math.max(0, actualPrice - discountAmount) : 0;

                                const currentQty = selectedTargets[`${numId}_${sId}`]?.quantity || 1;

                                return (
                                  <div
                                    key={s.id}
                                    className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                                      isSelected
                                        ? offerType === 'PERCENTAGE'
                                          ? 'bg-amber-50/70'
                                          : 'bg-purple-50/70'
                                        : 'hover:bg-[#FAF8F5]'
                                    }`}
                                  >
                                    {/* Checkbox and size info */}
                                    <label
                                      onClick={() => handleToggleSize(numId, sId)}
                                      className="flex items-center gap-2.5 cursor-pointer select-none grow min-w-0"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className={`rounded transition-all ${
                                          offerType === 'PERCENTAGE'
                                            ? 'text-amber-600 focus:ring-amber-500'
                                            : 'text-purple-600 focus:ring-purple-500'
                                        }`}
                                      />
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-[#241710] flex items-center gap-2">
                                          <span>{sizeDimensions}</span>
                                          {hasPrice ? (
                                            <span className="text-[#8C7A6B] font-semibold">
                                              — {actualPrice.toLocaleString('ar-EG')} ج.م
                                            </span>
                                          ) : (
                                            <span className="text-rose-600 font-semibold text-[10px]">
                                              (السعر غير مسجل)
                                            </span>
                                          )}
                                        </div>

                                        {/* Dynamic Discount Preview for Percentage Offer */}
                                        {offerType === 'PERCENTAGE' && isSelected && hasPrice && pctVal > 0 && (
                                          <div className="text-[11px] text-amber-900 font-bold mt-0.5 flex items-center gap-1.5">
                                            <span>
                                              السعر بعد الخصم:{' '}
                                              <strong className="text-amber-800 font-black">
                                                {discountedPrice.toLocaleString('ar-EG')} ج.م
                                              </strong>
                                            </span>
                                            <span className="text-amber-700 text-[10px] font-normal">
                                              (توفير {discountAmount.toLocaleString('ar-EG')} ج.م)
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </label>

                                    {/* Bundle Quantity Selector */}
                                    {offerType === 'BUNDLE' && isSelected && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 shrink-0 bg-white px-2.5 py-1 rounded-xl border border-purple-200 self-end sm:self-center"
                                      >
                                        <span className="text-[10px] font-bold text-purple-900">
                                          الكمية بالباقة:
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateQuantity(numId, sId, -1)}
                                            disabled={currentQty <= 1}
                                            className="w-5 h-5 rounded-md bg-[#FAF8F5] hover:bg-purple-100 disabled:opacity-40 text-purple-900 flex items-center justify-center font-bold"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="w-6 text-center text-xs font-black text-[#241710]">
                                            {currentQty}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateQuantity(numId, sId, 1)}
                                            className="w-5 h-5 rounded-md bg-[#FAF8F5] hover:bg-purple-100 text-purple-900 flex items-center justify-center font-bold"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bundle Value Preview Bar */}
                {offerType === 'BUNDLE' && selectedTargetsCount > 0 && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>إجمالي القيمة الأصلية للقطع المحددة:</span>
                      <span>{bundleOriginalTotal.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div className="flex items-center justify-between font-black text-purple-950 pt-1 border-t border-purple-200/60">
                      <span>سعر الباقة الموحد المعروض:</span>
                      <span className="text-base text-purple-800">
                        {Number(bundlePriceValue || 0).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                    {bundleOriginalTotal > Number(bundlePriceValue || 0) && (
                      <div className="text-[11px] text-emerald-800 font-bold text-left pt-0.5">
                        توفير للعميل:{' '}
                        {(bundleOriginalTotal - Number(bundlePriceValue || 0)).toLocaleString('ar-EG')} ج.م
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">تاريخ بدء العرض</label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">تاريخ الانتهاء (اختياري)</label>
                  <input
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAE3D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#736B63] hover:bg-[#F5EFE6] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold shadow-xs disabled:opacity-50 transition-all"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ العرض الترويجي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
