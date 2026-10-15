'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BackendColor, ColorCreateRequest, ColorUpdateRequest } from '@/types/product';
import { colorService } from '@/lib/api/services/colorService';
import { normalizeApiError } from '@/lib/api/errors';
import {
  Palette,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  X,
  Copy,
} from 'lucide-react';

interface ColorsSectionProps {
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

export default function ColorsSection({
  onRequestDeleteConfirm,
  isAdmin = false,
}: ColorsSectionProps) {
  const [colors, setColors] = useState<BackendColor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<BackendColor | null>(null);
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formHexCode, setFormHexCode] = useState('#241710');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const fetchColors = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await colorService.getColors();
      setColors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      setApiError(normalized.message);
      setColors([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  const filteredColors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return colors;
    return colors.filter((c) => {
      const ar = (c.name_ar || c.name || '').toLowerCase();
      const en = (c.name_en || '').toLowerCase();
      const hex = (c.hex_code || '').toLowerCase();
      return ar.includes(q) || en.includes(q) || hex.includes(q);
    });
  }, [colors, searchQuery]);

  const handleOpenAdd = () => {
    setEditingColor(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormHexCode('#241710');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (color: BackendColor) => {
    setEditingColor(color);
    setFormNameAr(color.name_ar || color.name || '');
    setFormNameEn(color.name_en || '');
    setFormHexCode(color.hex_code.startsWith('#') ? color.hex_code : `#${color.hex_code}`);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCopyHex = (hex: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 2000);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    let hex = formHexCode.trim().toUpperCase();
    if (!hex.startsWith('#')) {
      hex = `#${hex}`;
    }

    if (!/^#[0-9A-F]{6}$/i.test(hex)) {
      setFormError('يرجى تحديد كود لون سداسي صحيح مكون من 6 خانات (مثال: #A27B5C).');
      return;
    }

    const nameAr = formNameAr.trim();
    const nameEn = formNameEn.trim();

    if (!nameAr && !nameEn) {
      setFormError('يرجى إدخال اسم اللون بالعربية أو بالإنجليزية على الأقل.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingColor) {
        const updateData: ColorUpdateRequest = {
          name_ar: nameAr || nameEn,
          name_en: nameEn || nameAr,
          hex_code: hex,
        };
        const updated = await colorService.updateColor(editingColor.id, updateData);
        setColors((prev) =>
          prev.map((c) => (c.id === editingColor.id ? updated : c))
        );
        showToast('تم تحديث بيانات اللون بنجاح.');
      } else {
        const createData: ColorCreateRequest = {
          name_ar: nameAr || nameEn,
          name_en: nameEn || nameAr,
          hex_code: hex,
        };
        const created = await colorService.createColor(createData);
        setColors((prev) => [created, ...prev]);
        showToast('تمت إضافة اللون الجديد بنجاح إلى قاعدة البيانات.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      const msg =
        err?.response?.data?.hex_code?.[0] ||
        err?.response?.data?.name_ar?.[0] ||
        err?.response?.data?.name_en?.[0] ||
        err?.response?.data?.detail ||
        normalized.message ||
        'حدث خطأ أثناء حفظ اللون.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteColor = (color: BackendColor) => {
    const colorLabel = color.name_ar || color.name || color.name_en || color.hex_code;
    onRequestDeleteConfirm(
      `حذف اللون "${colorLabel}"`,
      `هل أنت متأكد من رغبتك في حذف اللون "${colorLabel}" (${color.hex_code}) نهائياً من قاعدة البيانات؟ لن يمكن التراجع عن هذا الإجراء، ولن يكتمل الحذف إذا كان اللون مرتبطاً بطلبات عملاء.`,
      async () => {
        await colorService.deleteColor(color.id);
        setColors((prev) => prev.filter((c) => c.id !== color.id));
        showToast(`تم حذف اللون "${colorLabel}" بنجاح.`);
      },
      {
        confirmLabel: 'نعم، حذف اللون',
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
            <Palette className="w-6 h-6 text-[#A27B5C]" />
            <span>إدارة ألوان المنتجات</span>
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            إدارة وتخصيص باليتة الألوان المعتمدة للمنتجات في المتجر، مع المعاينة الحية للأكواد اللونية (HEX).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchColors}
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
            <span>إضافة لون جديد</span>
          </button>
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
            onClick={fetchColors}
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
            placeholder="ابحث عن لون بالاسم العربي، الإنجليزي، أو كود HEX..."
            className="w-full ps-9 pe-3 py-2.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710]"
          />
        </div>

        <span className="text-xs text-[#8C7A6B]">
          الألوان المسجلة: <strong className="text-[#241710] font-bold">{colors.length}</strong> لون
        </span>
      </div>

      {/* Colors Grid / Table / Loading / Empty */}
      {isLoading ? (
        <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs p-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#A27B5C] mx-auto" />
          <p className="text-xs text-[#8C7A6B] font-bold">جاري تحميل قائمة الألوان من الخادم...</p>
        </div>
      ) : colors.length === 0 && !apiError ? (
        <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EB] text-[#A27B5C] flex items-center justify-center mx-auto">
            <Palette className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#241710]">لا توجد ألوان مسجلة حالياً في النظام</p>
          <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
            يمكنك إضافة ألوان جديدة لتكون متاحة فوراً عند إنشاء وتعديل منتجات السجاد.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold shadow-xs hover:bg-[#3D291D] transition-colors"
          >
            إضافة أول لون الآن
          </button>
        </div>
      ) : filteredColors.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs p-12 text-center text-xs text-[#8C7A6B]">
          لا توجد ألوان مطابقة لكلمة البحث «{searchQuery}».
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredColors.map((color) => {
            const hex = color.hex_code.startsWith('#') ? color.hex_code : `#${color.hex_code}`;
            const isCopied = copiedHex === hex;

            return (
              <div
                key={color.id}
                className="group p-4 rounded-2xl bg-white border border-[#EAE3D8] hover:border-[#D8CEBF] hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                {/* Visual Preview Swatch Block */}
                <div className="relative">
                  <div
                    className="w-full h-24 rounded-xl shadow-inner border border-black/10 transition-transform group-hover:scale-[1.01]"
                    style={{ backgroundColor: hex }}
                  />
                  <button
                    onClick={() => handleCopyHex(hex)}
                    className="absolute bottom-2 end-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold flex items-center gap-1 hover:bg-black/80 transition-colors"
                    title="نسخ كود HEX"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5 text-[#EED8BE]" />
                        <span>{hex}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Color Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-sm text-[#241710] truncate">
                      {color.name_ar || color.name || hex}
                    </h3>
                    <div
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  </div>

                  {color.name_en && (
                    <p className="text-xs text-[#8C7A6B] font-medium font-sans truncate" dir="ltr">
                      {color.name_en}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-[#F5EFE6] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#A89F91] font-mono">
                    ID #{color.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(color)}
                      className="p-1.5 rounded-lg text-[#5C4A3E] hover:text-[#241710] hover:bg-[#FAF5EB] transition-colors border border-transparent hover:border-[#E8DEC0]"
                      title="تعديل بيانات اللون"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteColor(color)}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
                      title="حذف اللون"
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

      {/* Add / Edit Color Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-[#EAE3D8] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#EAE3D8] flex items-center justify-between bg-[#FBF9F5]">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#A27B5C]" />
                <h2 className="text-sm font-extrabold text-[#241710]">
                  {editingColor ? 'تعديل بيانات اللون' : 'إضافة لون جديد للمتجر'}
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

              {/* Color Visual Preview & Picker */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-3">
                <label className="block text-xs font-bold text-[#5C4A3E]">
                  معاينة اللون واختيار كود HEX:
                </label>
                <div className="flex items-center gap-3">
                  {/* Native Color Picker Circle */}
                  <div className="relative">
                    <input
                      type="color"
                      value={formHexCode.startsWith('#') && formHexCode.length === 7 ? formHexCode : '#241710'}
                      onChange={(e) => setFormHexCode(e.target.value.toUpperCase())}
                      className="w-14 h-14 rounded-2xl border-2 border-white shadow-md cursor-pointer shrink-0"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-[#241710]">
                        كود HEX:
                      </span>
                      <input
                        type="text"
                        value={formHexCode}
                        onChange={(e) => setFormHexCode(e.target.value.toUpperCase())}
                        placeholder="#241710"
                        maxLength={7}
                        className="flex-1 px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-white border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                        dir="ltr"
                      />
                    </div>
                    <p className="text-[10px] text-[#8C7A6B]">
                      انقر على المربع اللوني لاختيار اللون بصرياً أو أدخل كود HEX يدوياً.
                    </p>
                  </div>
                </div>
              </div>

              {/* Arabic Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#5C4A3E]">
                  اسم اللون بالعربية: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  placeholder="مثال: بيج كلاسيكي، كحلي ملكي، رمادي دافئ"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                />
              </div>

              {/* English Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#5C4A3E]">
                  اسم اللون بالإنجليزية (اختياري):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="e.g. Classic Beige, Royal Navy, Warm Gray"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                />
              </div>

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
                    <span>{editingColor ? 'حفظ التعديلات' : 'إضافة اللون'}</span>
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
