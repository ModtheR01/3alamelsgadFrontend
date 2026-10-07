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
    setOfferName(offer.name);
    setOfferType(offer.offer_type);
    setPercentageValue(offer.percentage ? String(offer.percentage) : '20');
    setBundlePriceValue(offer.bundle_price ? String(offer.bundle_price) : '1000');
    const pIds = offer.products.map((p) => p.product_id);
    setSelectedProductIds(pIds);
    const qtys: Record<number, number> = {};
    offer.products.forEach((p) => {
      qtys[p.product_id] = p.quantity;
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
      setFormError('Offer name is required.');
      return;
    }

    if (offerType === 'PERCENTAGE' && (!percentageValue || Number(percentageValue) <= 0)) {
      setFormError('Please provide a valid percentage discount value.');
      return;
    }

    if (offerType === 'BUNDLE' && (!bundlePriceValue || Number(bundlePriceValue) <= 0)) {
      setFormError('Please provide a bundle fixed price.');
      return;
    }

    if (selectedProductIds.length === 0) {
      setFormError('Please select at least one applicable product.');
      return;
    }

    const payload: OfferCreateRequest = {
      name: offerName.trim(),
      offer_type: offerType,
      percentage: offerType === 'PERCENTAGE' ? Number(percentageValue) : null,
      bundle_price: offerType === 'BUNDLE' ? Number(bundlePriceValue) : null,
      products: selectedProductIds.map((id) => ({
        product_id: id,
        quantity: bundleProductQuantities[id] || 1,
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
      setFormError(err?.message || 'Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#241710] tracking-tight">
            Offers & Campaign Discounts
          </h1>
          <p className="text-xs text-[#8C7A6B]">
            Create percentage discounts (e.g. 20% OFF) or fixed-price bundles (e.g. 3 products for 1000 EGP).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#241710] text-white hover:bg-[#3D281C] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Offer</span>
        </button>
      </div>

      {/* Offers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-3 bg-white rounded-2xl border border-[#EAE3D8]">
            <Tag className="w-10 h-10 text-[#D5C6B5] mx-auto" />
            <p className="text-sm font-semibold text-[#241710]">No active offers</p>
            <p className="text-xs text-[#8C7A6B]">Create promotional percentage discounts or product bundles.</p>
          </div>
        ) : (
          offers.map((offer) => {
            const isPercentage = offer.offer_type === 'PERCENTAGE';
            const isBundle = offer.offer_type === 'BUNDLE';

            return (
              <div
                key={offer.id}
                className="p-5 rounded-2xl border border-[#EAE3D8] bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPercentage
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-purple-100 text-purple-900 border border-purple-300'
                      }`}
                    >
                      {isPercentage ? 'Percentage Discount' : 'Fixed Price Bundle'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        offer.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {offer.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#241710]">{offer.name}</h3>
                    <div className="mt-2 text-2xl font-extrabold text-[#A27B5C]">
                      {isPercentage && `${offer.percentage}% OFF`}
                      {isBundle && `${Number(offer.bundle_price || 0).toLocaleString()} EGP`}
                    </div>
                  </div>

                  <div className="text-xs text-[#5C4A3E] space-y-1 pt-2 border-t border-[#F5EFE6]">
                    <p>
                      <strong>Products:</strong> {offer.products?.length || 0} pieces assigned
                    </p>
                    {offer.starts_at && (
                      <p className="text-[11px] text-[#8C7A6B] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Valid: {offer.starts_at.slice(0, 10)} {offer.ends_at ? `to ${offer.ends_at.slice(0, 10)}` : ''}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F5EFE6] flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(offer)}
                    className="p-1.5 rounded-lg text-[#241710] hover:bg-[#F5EFE6]"
                    title="Edit offer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      onRequestDeleteConfirm(
                        `Delete Offer: "${offer.name}"`,
                        'Are you sure you want to delete this promotional offer? Discount will no longer apply in customer cart.',
                        () => onDeleteOffer(offer.id)
                      )
                    }
                    className="p-1.5 rounded-lg text-[#9E4A2B] hover:bg-rose-50"
                    title="Delete offer"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full my-8 p-5 sm:p-7 space-y-5 shadow-2xl border border-[#EAE3D8] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D8]">
              <h3 className="text-base font-bold text-[#241710]">
                {editingOfferId ? 'Edit Offer' : 'Create New Promotional Offer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#8C7A6B] hover:bg-[#F5EFE6]"
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
                <label className="block text-xs font-bold text-[#241710]">Offer Name *</label>
                <input
                  type="text"
                  required
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  placeholder="e.g. خصم 20% على السجاد التركي or باقة 3 مشايات بـ 1000 جنيه"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
                />
              </div>

              {/* Offer Type Selection (CORE REQUIREMENT) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">Offer Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-semibold ${
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
                    <span>Percentage Discount (e.g. 20%)</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-semibold ${
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
                    <span>Product Bundle (Fixed Price)</span>
                  </label>
                </div>
              </div>

              {/* Value Input */}
              {offerType === 'PERCENTAGE' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">Discount Percentage (%) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={percentageValue}
                    onChange={(e) => setPercentageValue(e.target.value)}
                    placeholder="20"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">Bundle Fixed Price (EGP) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={bundlePriceValue}
                    onChange={(e) => setBundlePriceValue(e.target.value)}
                    placeholder="1000"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
                  />
                </div>
              )}

              {/* Applicable Products Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#241710]">
                    Select Applicable Products ({selectedProductIds.length} selected) *
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
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          isSelected ? 'bg-amber-100/70 font-semibold' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-amber-600"
                          />
                          <span className="truncate text-[#241710]">{p.name}</span>
                        </div>
                        <span className="text-[11px] text-[#8C7A6B] shrink-0">
                          {p.price?.toLocaleString()} EGP
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dates & Active Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">Start Date</label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="offer-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <label htmlFor="offer-active" className="text-xs font-semibold text-[#241710] cursor-pointer">
                  Activate Offer Now
                </label>
              </div>

              <div className="pt-3 border-t border-[#EAE3D8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3D8] text-xs font-semibold text-[#5C4A3E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#241710] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
