'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GovernorateShipping } from '@/types/shipping';
import { shippingService } from '@/lib/api/services/shippingService';
import { normalizeApiError } from '@/lib/api/errors';
import {
  Search,
  Edit2,
  Check,
  X,
  MapPin,
  Plus,
  AlertCircle,
  RefreshCw,
  Power,
} from 'lucide-react';

export default function ShippingSection() {
  const [governorates, setGovernorates] = useState<GovernorateShipping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formPrice, setFormPrice] = useState('50');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const fetchGovernorates = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await shippingService.getGovernorates();
      setGovernorates(data || []);
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      setApiError(normalized.message);
      setGovernorates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGovernorates();
  }, [fetchGovernorates]);

  const filteredGovernorates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return governorates;
    return governorates.filter((g) => {
      const ar = (g.name_ar || g.nameAr || '').toLowerCase();
      const en = (g.name_en || g.nameEn || '').toLowerCase();
      const idStr = String(g.id).toLowerCase();
      return ar.includes(q) || en.includes(q) || idStr.includes(q);
    });
  }, [governorates, searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormPrice('50');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (gov: GovernorateShipping) => {
    setEditingId(gov.id);
    setFormNameAr(gov.name_ar || gov.nameAr || '');
    setFormNameEn(gov.name_en || gov.nameEn || '');
    setFormPrice(String(gov.shipping_price ?? gov.shippingCost ?? '50'));
    setFormIsActive(gov.is_active ?? gov.isActive ?? true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleActiveQuick = async (gov: GovernorateShipping) => {
    const newStatus = !(gov.is_active ?? gov.isActive);
    try {
      const updated = await shippingService.updateGovernorate(gov.id, {
        is_active: newStatus,
      });
      setGovernorates((prev) =>
        prev.map((g) => (String(g.id) === String(gov.id) ? updated : g))
      );
      showToast(
        newStatus
          ? `تم تفعيل محافظة ${gov.name_ar || gov.nameAr} بنجاح.`
          : `تم تعطيل محافظة ${gov.name_ar || gov.nameAr}.`
      );
    } catch (err: any) {
      alert(normalizeApiError(err).message);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAr = formNameAr.trim();
    const trimmedEn = formNameEn.trim();
    const parsedPrice = Number(formPrice);

    if (!trimmedAr) {
      setFormError('اسم المحافظة بالعربي مطلوب.');
      return;
    }

    if (!trimmedEn) {
      setFormError('اسم المحافظة بالإنجليزي مطلوب.');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('يرجى إدخال تكلفة شحن صحيحة (٠ جنيه أو أكثر).');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingId !== null) {
        const updated = await shippingService.updateGovernorate(editingId, {
          name_ar: trimmedAr,
          name_en: trimmedEn,
          shipping_price: parsedPrice,
          is_active: formIsActive,
        });
        setGovernorates((prev) =>
          prev.map((g) => (String(g.id) === String(editingId) ? updated : g))
        );
        showToast('تم تحديث بيانات المحافظة وتسعيرة الشحن بنجاح.');
      } else {
        const created = await shippingService.createGovernorate({
          name_ar: trimmedAr,
          name_en: trimmedEn,
          shipping_price: parsedPrice,
          is_active: formIsActive,
        });
        setGovernorates((prev) => [created, ...prev]);
        showToast('تم إضافة المحافظة الجديدة بنجاح.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      setFormError(normalized.message);
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
            تعريفة الشحن ومحافظات الجمهورية
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            إدارة محافظات الجمهورية المسجلة وتحديد تكلفة الشحن وحالة التفعيل في المتجر.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#EED8BE]" />
          <span>إضافة محافظة جديدة</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {apiError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-bold">{apiError}</span>
          </div>
          <button
            onClick={fetchGovernorates}
            className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute top-3 start-3 text-[#8C7A6B] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن محافظة (القاهرة، الإسكندرية، الدقهلية، المنصورة...)"
            className="w-full ps-9 pe-3 py-2.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710]"
          />
        </div>

        <span className="text-xs text-[#8C7A6B]">
          المحافظات المسجلة: <strong className="text-[#241710] font-bold">{governorates.length}</strong> محافظة
        </span>
      </div>

      {/* Governorates Table / Empty / Loading State */}
      <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#A27B5C] mx-auto" />
            <p className="text-xs text-[#8C7A6B] font-bold">جاري تحميل بيانات الشحن من الخادم...</p>
          </div>
        ) : governorates.length === 0 && !apiError ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF5EB] text-[#A27B5C] flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#241710]">لا توجد محافظات مسجلة حالياً في قاعدة البيانات</p>
            <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
              يمكنك إضافة محافظات الجمهورية وتحديد تسعيرة الشحن لكل محافظة ليتم احتسابها عند إتمام الطلب.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold shadow-xs hover:bg-[#3D291D] transition-colors"
            >
              إضافة أول محافظة الآن
            </button>
          </div>
        ) : filteredGovernorates.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8C7A6B]">
            لا توجد محافظات مطابقة لكلمة البحث «{searchQuery}».
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-right">المحافظة (بالعربي)</th>
                  <th className="py-3 px-3 text-right">الاسم بالإنجليزية</th>
                  <th className="py-3 px-3 text-right">تكلفة الشحن (ج.م)</th>
                  <th className="py-3 px-3 text-right">حالة التغطية</th>
                  <th className="py-3 px-4 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {filteredGovernorates.map((gov) => {
                  const isActive = gov.is_active ?? gov.isActive;

                  return (
                    <tr key={gov.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      {/* Name Arabic */}
                      <td className="py-3.5 px-4 font-bold text-[#241710]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#A27B5C]" />
                          <span>{gov.name_ar || gov.nameAr}</span>
                        </div>
                      </td>

                      {/* Name English */}
                      <td className="py-3.5 px-3 text-[#5C4A3E] font-medium font-mono text-[11px]">
                        {gov.name_en || gov.nameEn}
                      </td>

                      {/* Shipping Cost */}
                      <td className="py-3.5 px-3">
                        <span className="font-black text-[#241710] text-sm">
                          {Number(gov.shipping_price ?? gov.shippingCost ?? 0).toLocaleString('ar-EG')} ج.م
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggleActiveQuick(gov)}
                          title={isActive ? 'تعطيل المحافظة' : 'تفعيل المحافظة'}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 transition-colors ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          <Power className={`w-2.5 h-2.5 ${isActive ? 'text-emerald-600' : 'text-stone-400'}`} />
                          <span>{isActive ? 'متاح للشحن' : 'معطل'}</span>
                        </button>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-left">
                        <button
                          onClick={() => handleOpenEdit(gov)}
                          className="px-3 py-1.5 rounded-lg bg-[#FAF5EB] hover:bg-[#F2E8D7] text-[#A27B5C] font-bold text-xs flex items-center gap-1.5 ms-auto transition-colors border border-[#E8DEC0]"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT GOVERNORATE MODAL ================= */}
      {isModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full my-8 p-6 space-y-5 shadow-2xl border border-[#EAE3D8] max-h-[92vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D8]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF5EB] text-[#A27B5C]">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#241710]">
                  {editingId !== null ? 'تعديل بيانات المحافظة' : 'إضافة محافظة جديدة'}
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
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Name Arabic */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">
                  اسم المحافظة بالعربي <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  placeholder="مثال: الدقهلية"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                />
              </div>

              {/* Name English */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">
                  اسم المحافظة بالإنجليزي <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="مثال: Dakahlia"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                />
              </div>

              {/* Shipping Price */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">
                  تكلفة الشحن بالجنيه المصري (ج.م) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="50"
                    className="w-full text-xs px-3.5 py-2.5 pe-12 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                  />
                  <span className="absolute end-3 top-2.5 text-xs text-[#8C7A6B] font-bold pointer-events-none">
                    ج.م
                  </span>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="governorate-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-[#241710]"
                />
                <label
                  htmlFor="governorate-active"
                  className="text-xs font-bold text-[#241710] cursor-pointer"
                >
                  تفعيل المحافظة وإتاحتها للشحن في المتجر فوراً
                </label>
              </div>

              {/* Actions */}
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
                  {isSaving ? 'جاري الحفظ...' : editingId !== null ? 'حفظ التعديلات' : 'إضافة المحافظة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
