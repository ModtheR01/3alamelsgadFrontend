'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GovernorateShipping } from '@/types/shipping';
import { shippingService } from '@/lib/api/services/shippingService';
import {
  Truck,
  Search,
  Edit2,
  Check,
  X,
  RotateCcw,
  Clock,
  MapPin,
  Save,
} from 'lucide-react';

export default function ShippingSection() {
  const [governorates, setGovernorates] = useState<GovernorateShipping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editMinDays, setEditMinDays] = useState<string>('2');
  const [editMaxDays, setEditMaxDays] = useState<string>('4');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    shippingService
      .getGovernorates()
      .then((data) => {
        if (active) setGovernorates(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredGovernorates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return governorates.filter(
      (g) =>
        !q ||
        g.nameAr.toLowerCase().includes(q) ||
        g.nameEn.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q)
    );
  }, [governorates, searchQuery]);

  const handleStartEdit = (gov: GovernorateShipping) => {
    setEditingId(gov.id);
    setEditPrice(String(gov.shippingCost));
    setEditMinDays(String(gov.deliveryDaysMin || 2));
    setEditMaxDays(String(gov.deliveryDaysMax || 4));
  };

  const handleSaveEdit = async (govId: string) => {
    setIsUpdating(true);
    try {
      const updated = await shippingService.updateGovernorate(govId, {
        shippingCost: Number(editPrice),
        deliveryDaysMin: Number(editMinDays),
        deliveryDaysMax: Number(editMaxDays),
      });

      setGovernorates((prev) => prev.map((g) => (g.id === govId ? updated : g)));
      setEditingId(null);
      setToastMessage('تم تحديث تسعيرة الشحن للمحافظة بنجاح.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'تعذر تحديث تسعيرة الشحن');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('هل أنت متأكد من رغبتك في إعادة ضبط تسعيرات الشحن لكافة المحافظات إلى القيم الافتراضية؟')) {
      const reset = shippingService.resetToDefaults();
      setGovernorates(reset);
      setToastMessage('تمت استعادة تسعيرات الشحن الافتراضية بنجاح.');
      setTimeout(() => setToastMessage(null), 3000);
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
            تحديد تكلفة الشحن ومدة التوصيل التقديرية لجميع محافظات جمهورية مصر العربية.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3D8] hover:bg-[#F5EFE6] text-xs font-bold text-[#5C4A3E] flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#A27B5C]" />
          <span>استعادة الأسعار الافتراضية</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
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
          المحافظات المشمولة: <strong className="text-[#241710] font-bold">{governorates.length}</strong> محافظة
        </span>
      </div>

      {/* Governorates Table */}
      <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#8C7A6B]">جاري تحميل بيانات الشحن...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-right">المحافظة</th>
                  <th className="py-3 px-3 text-right">الاسم بالإنجليزية</th>
                  <th className="py-3 px-3 text-right">تكلفة الشحن (ج.م)</th>
                  <th className="py-3 px-3 text-right">مدة التوصيل التقديرية</th>
                  <th className="py-3 px-3 text-right">حالة التغطية</th>
                  <th className="py-3 px-4 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {filteredGovernorates.map((gov) => {
                  const isEditing = editingId === gov.id;

                  return (
                    <tr key={gov.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      {/* Name Arabic */}
                      <td className="py-3.5 px-4 font-bold text-[#241710]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#A27B5C]" />
                          <span>{gov.nameAr}</span>
                        </div>
                      </td>

                      {/* Name English */}
                      <td className="py-3.5 px-3 text-[#5C4A3E] font-medium font-mono text-[11px]">{gov.nameEn}</td>

                      {/* Shipping Cost */}
                      <td className="py-3.5 px-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 max-w-[120px]">
                            <input
                              type="number"
                              min={0}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 px-2 py-1 text-xs rounded-lg border border-[#241710] bg-white font-bold"
                            />
                            <span className="text-[11px] text-[#8C7A6B]">ج.م</span>
                          </div>
                        ) : (
                          <span className="font-black text-[#241710] text-sm">
                            {gov.shippingCost} ج.م
                          </span>
                        )}
                      </td>

                      {/* Delivery Days */}
                      <td className="py-3.5 px-3 text-[#5C4A3E]">
                        {isEditing ? (
                          <div className="flex items-center gap-1 max-w-[150px]">
                            <input
                              type="number"
                              min={1}
                              max={14}
                              value={editMinDays}
                              onChange={(e) => setEditMinDays(e.target.value)}
                              className="w-12 px-1.5 py-1 text-xs rounded-lg border border-[#EAE3D8] text-center font-bold"
                            />
                            <span>إلى</span>
                            <input
                              type="number"
                              min={1}
                              max={14}
                              value={editMaxDays}
                              onChange={(e) => setEditMaxDays(e.target.value)}
                              className="w-12 px-1.5 py-1 text-xs rounded-lg border border-[#EAE3D8] text-center font-bold"
                            />
                            <span className="text-[10px] text-[#8C7A6B]">أيام</span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#8C7A6B]" />
                            <span>
                              {gov.deliveryDaysMin} إلى {gov.deliveryDaysMax} أيام عمل
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>متاح للشحن</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-left">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={isUpdating}
                              onClick={() => handleSaveEdit(gov.id)}
                              className="px-3 py-1 rounded-lg bg-[#241710] text-[#FAF5EB] font-bold text-xs hover:bg-[#3D291D] transition-colors shadow-xs"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-lg text-[#8C7A6B] hover:bg-[#F5EFE6]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(gov)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF5EB] hover:bg-[#F2E8D7] text-[#A27B5C] font-bold text-xs flex items-center gap-1 ms-auto transition-colors border border-[#E8DEC0]"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>تعديل التسعيرة</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
