'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface OffersSectionProps {
  offers: BackendOffer[];
  products: Product[];
  isLoading: boolean;
  onSaveOffer: (offerData: OfferCreateRequest, offerId?: number) => Promise<void>;
  onDeleteOffer: (offerId: number) => Promise<void>;
  onRequestDeleteConfirm: (title: string, message: string, onConfirm: () => void | Promise<void>) => void;
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
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bundleProductQuantities, setBundleProductQuantities] = useState<Record<number, number>>({});
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingOfferId(null);
    setOfferName('');
    setOfferType('PERCENTAGE');
    setPercentageValue('20');
    setBundlePriceValue('1000');
    setSelectedProductIds([]);
    setBundleProductQuantities({});
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
    const pIds = prods.map((p: any) => p.product_id);
    setSelectedProductIds(pIds);
    const qtys: Record<number, number> = {};
    prods.forEach((p: any) => {
      qtys[p.product_id] = p.quantity || 1;
    });
    setBundleProductQuantities(qtys);
    setStartsAt(offer.starts_at ? offer.starts_at.slice(0, 10) : '');
    setEndsAt(offer.ends_at ? offer.ends_at.slice(0, 10) : '');
    setIsActive(offer.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleProduct = (numId: number) => {
    if (selectedProductIds.includes(numId)) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== numId));
      const nextQtys = { ...bundleProductQuantities };
      delete nextQtys[numId];
      setBundleProductQuantities(nextQtys);
    } else {
      setSelectedProductIds([...selectedProductIds, numId]);
      setBundleProductQuantities({ ...bundleProductQuantities, [numId]: 1 });
    }
  };

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

    if (selectedProductIds.length === 0) {
      setFormError('يرجى اختيار منتج واحد على الأقل ينطبق عليه هذا العرض.');
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
      products: selectedProductIds.map((id) => ({
        product_id: id,
        quantity: bundleProductQuantities[id] || 1,
      })),
      offer_products: selectedProductIds.map((id) => ({
        product_id: id,
        ...(offerType === 'BUNDLE' ? { quantity: bundleProductQuantities[id] || 1 } : {}),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
            العروض والخصومات الترويجية
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            إنشاء حملات الخصم بالنسب المئوية (مثل خصم ٢٠٪) أو باقات المنتجات بسعر موحد (مثل ٣ مشايات بـ ١٠٠٠ ج.م).
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
              يمكنك إنشاء عروض الخصم المئوي أو باقات المنتجات لتشجيع عملاء المتجر على الشراء.
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
                    <h3 className="font-bold text-sm text-[#241710]">{offer.name_ar || offer.name || offer.name_en}</h3>
                    <div className="mt-2 text-2xl font-black text-[#A27B5C]">
                      {isPercentage && `خصم ${offer.percentage}٪`}
                      {isBundle && `${Number(offer.bundle_price || 0).toLocaleString('ar-EG')} ج.م`}
                    </div>
                  </div>

                  <div className="text-xs text-[#5C4A3E] space-y-1.5 pt-3 border-t border-[#F5EFE6]">
                    <p className="flex items-center justify-between">
                      <span className="text-[#8C7A6B]">المنتجات المشمولة:</span>
                      <strong className="text-[#241710]">
                        {(offer.products || (offer as any).offer_products)?.length || 0} منتج
                      </strong>
                    </p>
                    {offer.starts_at && (
                      <p className="text-[11px] text-[#8C7A6B] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#A27B5C]" />
                        <span>
                          ساري من {offer.starts_at.slice(0, 10)} {offer.ends_at ? `إلى ${offer.ends_at.slice(0, 10)}` : ''}
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
          <div className="bg-white rounded-2xl max-w-xl w-full my-8 p-6 space-y-5 shadow-2xl border border-[#EAE3D8] max-h-[92vh] overflow-y-auto text-right">
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
                  placeholder="مثال: خصم ٢٠٪ على السجاد التركي، أو باقة ٣ مشايات بـ ١٠٠٠ جنيه"
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

              {/* Applicable Products Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#241710]">
                    المنتجات المشمولة في العرض ({selectedProductIds.length} محددة) <span className="text-rose-600">*</span>
                  </label>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-[#EAE3D8] divide-y divide-[#F5EFE6] p-2 bg-[#FAF8F5]">
                  {products.map((p, idx) => {
                    const numId = parseInt(p.id.replace(/\D/g, ''), 10) || idx + 1;
                    const isSelected = selectedProductIds.includes(numId);

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleProduct(numId)}
                        className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          isSelected ? 'bg-amber-100/70 font-bold' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-amber-600"
                          />
                          <span className="truncate text-[#241710]">{p.name_ar || p.name || p.name_en}</span>
                        </div>
                        <span className="text-[11px] text-[#8C7A6B] shrink-0 font-bold">
                          {p.price?.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dates & Active Toggle */}
              <div className="grid grid-cols-2 gap-3">
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

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="offer-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#241710]"
                />
                <label htmlFor="offer-active" className="text-xs font-bold text-[#241710] cursor-pointer">
                  تفعيل العرض فوراً في المتجر
                </label>
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
