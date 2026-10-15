'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BackendSize, SizeCreateRequest, SizeUpdateRequest } from '@/types/product';
import { sizeService } from '@/lib/api/services/sizeService';
import { normalizeApiError } from '@/lib/api/errors';
import {
  Ruler,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  X,
  Maximize2,
  Info,
} from 'lucide-react';

interface SizesSectionProps {
  onRequestDeleteConfirm: (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmLabel?: string;
      cancelLabel?: string;
      variant?: 'danger' | 'warning' | 'info';
      icon?: 'delete' | 'archive' | 'restore';
    }
  ) => void;
  isAdmin?: boolean;
}

export default function SizesSection({
  onRequestDeleteConfirm,
  isAdmin = false,
}: SizesSectionProps) {
  const [sizes, setSizes] = useState<BackendSize[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<BackendSize | null>(null);
  const [formWidth, setFormWidth] = useState('');
  const [formLength, setFormLength] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const fetchSizes = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await sizeService.getSizes();
      setSizes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      setApiError(normalized.message);
      setSizes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  const filteredSizes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sizes;
    return sizes.filter((s) => {
      const wStr = String(s.width);
      const lStr = String(s.length);
      const dims = `${wStr} × ${lStr}`;
      const dimsX = `${wStr}x${lStr}`;
      return (
        wStr.includes(q) ||
        lStr.includes(q) ||
        dims.includes(q) ||
        dimsX.includes(q)
      );
    });
  }, [sizes, searchQuery]);

  const handleOpenAdd = () => {
    setEditingSize(null);
    setFormWidth('');
    setFormLength('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (size: BackendSize) => {
    setEditingSize(size);
    setFormWidth(String(size.width));
    setFormLength(String(size.length));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const width = parseFloat(formWidth.trim());
    const length = parseFloat(formLength.trim());

    if (isNaN(width) || width <= 0) {
      setFormError('يرجى إدخال عرض صحيح بالسنتيمتر أكبر من ٠ (مثال: 160 أو 200).');
      return;
    }

    if (isNaN(length) || length <= 0) {
      setFormError('يرجى إدخال طول صحيح بالسنتيمتر أكبر من ٠ (مثال: 220 أو 300).');
      return;
    }

    // Check duplicate locally if creating
    const isDuplicate = sizes.some(
      (s) =>
        (!editingSize || s.id !== editingSize.id) &&
        parseFloat(String(s.width)) === width &&
        parseFloat(String(s.length)) === length
    );

    if (isDuplicate) {
      setFormError('هذا المقاس (العرض والطول) مسجل بالفعل في قاعدة البيانات.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingSize) {
        const updateData: SizeUpdateRequest = { width, length };
        const updated = await sizeService.updateSize(editingSize.id, updateData);
        setSizes((prev) =>
          prev.map((s) => (s.id === editingSize.id ? updated : s))
        );
        showToast('تم تحديث أبعاد المقاس بنجاح.');
      } else {
        const createData: SizeCreateRequest = { width, length };
        const created = await sizeService.createSize(createData);
        setSizes((prev) => [...prev, created]);
        showToast('تمت إضافة المقاس الجديد بنجاح إلى قاعدة البيانات.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      const msg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.width?.[0] ||
        err?.response?.data?.length?.[0] ||
        err?.response?.data?.detail ||
        normalized.message ||
        'حدث خطأ أثناء حفظ المقاس.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSize = (size: BackendSize) => {
    const sizeLabel = `${size.width} × ${size.length} سم`;
    onRequestDeleteConfirm(
      `حذف المقاس "${sizeLabel}"`,
      `هل أنت متأكد من رغبتك في حذف المقاس "${sizeLabel}" نهائياً من قاعدة البيانات؟ لن يمكن التراجع عن هذا الإجراء، ولن يكتمل الحذف إذا كان المقاس مرتبطاً بطلبات أو سلات عملاء نشطة.`,
      async () => {
        await sizeService.deleteSize(size.id);
        setSizes((prev) => prev.filter((s) => s.id !== size.id));
        showToast(`تم حذف المقاس "${sizeLabel}" بنجاح.`);
      },
      {
        confirmLabel: 'نعم، حذف المقاس',
        cancelLabel: 'إلغاء',
        variant: 'danger',
        icon: 'delete',
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight flex items-center gap-2">
            <Ruler className="w-6 h-6 text-[#A27B5C]" />
            <span>إدارة مقاسات المنتجات</span>
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            إدارة أبعاد ومقاسات السجاد الجاهز (العرض × الطول بالسنتيمتر) المتاحة للربط مع منتجات المتجر.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchSizes}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[#EAE3D8] bg-white text-[#5C4A3E] hover:bg-[#FAF8F5] transition-colors disabled:opacity-50"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#A27B5C]' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#EED8BE]" />
            <span>إضافة مقاس جديد</span>
          </button>
        </div>
      </div>

      {/* Distinction Info Banner */}
      <div className="p-3.5 rounded-2xl bg-[#FAF5EB] border border-[#E8DEC0] flex items-start gap-3 text-xs text-[#5C4A3E]">
        <Info className="w-4 h-4 text-[#A27B5C] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-extrabold text-[#241710]">
            تنبيه تنظيمي حول مقاسات السجاد العادي مقابل أروال الممرات (Arwal):
          </p>
          <p className="text-[11px] leading-relaxed">
            المقاسات المسجلة هنا مخصصة للسجاد الجاهز وتحدد الأبعاد الثابتة (العرض × الطول). أما منتجات أروال الممرات (الأروال بالمتر) فلها نظام تسعير مستقل للمتر الطولي يعتمد على عروض قياسية محددة مسبقاً (60، 80، 100، 120 سم) يتم ضبطها مباشرة من قسم المنتجات.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {apiError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-bold">{apiError}</span>
          </div>
          <button
            onClick={fetchSizes}
            className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* Toolbar / Search */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute top-3 start-3 text-[#8C7A6B] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مقاس (مثال: 160، 200، 200 × 300)..."
            className="w-full ps-9 pe-3 py-2.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710]"
          />
        </div>

        <span className="text-xs text-[#8C7A6B]">
          المقاسات المسجلة: <strong className="text-[#241710] font-bold">{sizes.length}</strong> مقاس
        </span>
      </div>

      {/* Sizes Grid / Table / Loading / Empty */}
      {isLoading ? (
        <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs p-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#A27B5C] mx-auto" />
          <p className="text-xs text-[#8C7A6B] font-bold">جاري تحميل قائمة المقاسات من الخادم...</p>
        </div>
      ) : sizes.length === 0 && !apiError ? (
        <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EB] text-[#A27B5C] flex items-center justify-center mx-auto">
            <Ruler className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#241710]">لا توجد مقاسات مسجلة حالياً في النظام</p>
          <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
            يمكنك إضافة مقاسات جديدة (العرض والطول بالسنتيمتر) لتكون متاحة للاختيار عند إضافة وتعديل منتجات السجاد.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold shadow-xs hover:bg-[#3D291D] transition-colors"
          >
            إضافة أول مقاس الآن
          </button>
        </div>
      ) : filteredSizes.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs p-12 text-center text-xs text-[#8C7A6B]">
          لا توجد مقاسات مطابقة لكلمة البحث «{searchQuery}».
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSizes.map((size) => {
            const widthNum = parseFloat(String(size.width));
            const lengthNum = parseFloat(String(size.length));
            const areaM2 = ((widthNum * lengthNum) / 10000).toFixed(2);

            return (
              <div
                key={size.id}
                className="group p-4 rounded-2xl bg-white border border-[#EAE3D8] hover:border-[#D8CEBF] hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                {/* Visual Dimension Diagram Card */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8]/80 flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0] flex items-center justify-center">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="font-black text-sm text-[#241710] font-sans" dir="ltr">
                      {size.width} × {size.length} cm
                    </span>
                    <p className="text-[10px] text-[#8C7A6B]">
                      المساحة التقريبية: <strong className="text-[#241710]">{areaM2} م²</strong>
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#5C4A3E]">
                    <span className="text-[11px] font-bold">العرض:</span>
                    <span className="font-extrabold text-[#241710]" dir="ltr">
                      {size.width} سم
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#5C4A3E]">
                    <span className="text-[11px] font-bold">الطول:</span>
                    <span className="font-extrabold text-[#241710]" dir="ltr">
                      {size.length} سم
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-[#F5EFE6] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#A89F91] font-mono">
                    ID #{size.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(size)}
                      className="p-1.5 rounded-lg text-[#5C4A3E] hover:text-[#241710] hover:bg-[#FAF5EB] transition-colors border border-transparent hover:border-[#E8DEC0]"
                      title="تعديل أبعاد المقاس"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteSize(size)}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
                      title="حذف المقاس"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Size Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-[#EAE3D8] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#EAE3D8] flex items-center justify-between bg-[#FBF9F5]">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#A27B5C]" />
                <h2 className="text-sm font-extrabold text-[#241710]">
                  {editingSize ? 'تعديل أبعاد المقاس' : 'إضافة مقاس جديد للمتجر'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#241710] hover:bg-[#F5EFE6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Dimensions Input Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#5C4A3E]">
                    العرض (سم): <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formWidth}
                    onChange={(e) => setFormWidth(e.target.value)}
                    placeholder="مثال: 160 أو 200"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#5C4A3E]">
                    الطول (سم): <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formLength}
                    onChange={(e) => setFormLength(e.target.value)}
                    placeholder="مثال: 220 أو 300"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>
              </div>

              {/* Live Preview of Dimension */}
              {formWidth && formLength && !isNaN(parseFloat(formWidth)) && !isNaN(parseFloat(formLength)) && (
                <div className="p-3 rounded-xl bg-[#FAF5EB] border border-[#E8DEC0] text-center space-y-1">
                  <span className="text-[11px] text-[#8C7A6B]">معاينة المقاس الناتج:</span>
                  <div className="font-black text-sm text-[#241710]" dir="ltr">
                    {formWidth} × {formLength} سم
                  </div>
                  <p className="text-[10px] text-[#A27B5C] font-bold">
                    المساحة الإجمالية: {((parseFloat(formWidth) * parseFloat(formLength)) / 10000).toFixed(2)} متر مربع
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#EAE3D8] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-[#EAE3D8] bg-white text-[#5C4A3E] text-xs font-bold hover:bg-[#FAF8F5] transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold hover:bg-[#3D291D] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>{editingSize ? 'حفظ التعديلات' : 'إضافة المقاس'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
