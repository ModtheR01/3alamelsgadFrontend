'use client';

import React, { useState, useMemo } from 'react';
import { Category } from '@/types';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import CloudinaryImageField from '@/components/CloudinaryImageField';

interface CategoriesSectionProps {
  categories: Category[];
  productCountsByCategory: Record<string, number>;
  onSaveCategory: (category: Category) => Promise<void> | void;
  onDeleteCategory: (categoryId: string) => Promise<void> | void;
  onRequestDeleteConfirm: (title: string, message: string, onConfirm: () => void | Promise<void>) => void;
  editingCategory: Category | null;
  setEditingCategory: (c: Category | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export default function CategoriesSection({
  categories,
  productCountsByCategory,
  onSaveCategory,
  onDeleteCategory,
  onRequestDeleteConfirm,
  editingCategory,
  setEditingCategory,
  isModalOpen,
  setIsModalOpen,
}: CategoriesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
      );
    });
  }, [categories, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      slug: `category-${Date.now()}`,
      description: '',
      image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
      isFeatured: false,
      isVisible: true,
      displayOrder: categories.length + 1,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory({ ...category });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editingCategory.name.trim()) {
      setFormError('اسم التصنيف الرئيسي مطلوب.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await onSaveCategory(editingCategory);
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (err: any) {
      setFormError(err?.message || 'تعذر حفظ التصنيف');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
              إدارة التصنيفات الرئيسية
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
              {categories.length} تصنيف
            </span>
          </div>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            إدارة مجموعات السجاد وتحديد صور الغلاف والظهور في القائمة الرئيسية للمتجر.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#241710] text-[#FAF5EB] hover:bg-[#3D291D] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#EED8BE]" />
          <span>إضافة تصنيف رئيسي جديد</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute top-3 start-3 text-[#8C7A6B] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن تصنيف رئيسي بالاسم أو الوصف..."
            className="w-full ps-9 pe-3 py-2.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710]"
          />
        </div>

        <span className="text-xs text-[#8C7A6B]">
          الإجمالي: <strong className="text-[#241710]">{categories.length}</strong> تصنيف رئيسي
        </span>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map((cat) => {
          const productCount = productCountsByCategory[cat.id] || 0;

          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-[#EAE3D8] bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Category Cover Image */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#FAF8F5]">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500 p-2"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute top-3 start-3 flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cat.isVisible !== false
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-600 text-white'
                    }`}
                  >
                    {cat.isVisible !== false ? 'ظاهر بالمتجر' : 'مخفي'}
                  </span>
                  {cat.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      مميز
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 start-3 end-3 text-white">
                  <h3 className="font-bold text-sm leading-tight drop-shadow-sm">{cat.name}</h3>
                  <p className="text-[10px] text-white/80 font-mono mt-0.5">{cat.slug}</p>
                </div>
              </div>

              {/* Category Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-[#5C4A3E] line-clamp-2 leading-relaxed">
                  {cat.description || 'لا يوجد وصف مضاف لهذا التصنيف.'}
                </p>

                <div className="pt-3 border-t border-[#F5EFE6] flex items-center justify-between text-xs">
                  <span className="text-[#8C7A6B]">
                    عدد المنتجات: <strong className="text-[#241710] font-bold">{productCount}</strong> منتج
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg text-[#241710] hover:bg-[#F5EFE6] transition-colors"
                      title="تعديل التصنيف"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        onRequestDeleteConfirm(
                          `حذف التصنيف: «${cat.name}»`,
                          'هل أنت متأكد من رغبتك في حذف هذا التصنيف؟ ستبقى المنتجات المرتبطة به في النظام.',
                          () => onDeleteCategory(cat.id)
                        )
                      }
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="حذف التصنيف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && editingCategory && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#EAE3D8] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D8]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF5EB] text-[#A27B5C]">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#241710]">
                    {editingCategory.name ? 'تعديل التصنيف الرئيسي' : 'إضافة تصنيف رئيسي جديد'}
                  </h3>
                  <p className="text-[11px] text-[#8C7A6B]">بيانات التصنيف وصورة الغلاف في المتجر</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#241710] hover:bg-[#F5EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">
                  اسم التصنيف <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  placeholder="مثال: سجاد تركي فاخر، سجاد شرقي وأصيل..."
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-xs font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">
                  الرابط الدائم (Slug)
                </label>
                <input
                  type="text"
                  value={editingCategory.slug}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-xs font-mono text-[#241710] focus:outline-none focus:border-[#241710]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">
                  الوصف التعريفي
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      description: e.target.value,
                    })
                  }
                  placeholder="وصف مختصر يظهر للعملاء في صفحة التشكيلات..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-xs text-[#241710] focus:outline-none focus:border-[#241710]"
                />
              </div>

              {/* Cover Image */}
              <div className="pt-2 border-t border-[#EAE3D8] space-y-2">
                <CloudinaryImageField
                  label="صورة غلاف التصنيف"
                  value={editingCategory.image}
                  onChange={(url) => setEditingCategory({ ...editingCategory, image: url })}
                  onUploadResult={(result) =>
                    setEditingCategory({
                      ...editingCategory,
                      image: result.secure_url || result.url,
                      public_id: result.public_id,
                    })
                  }
                  folder="alamelsgad-categories"
                />
              </div>

              {/* Visibility and Featured Options */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EAE3D8]">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#241710]">
                  <input
                    type="checkbox"
                    checked={editingCategory.isVisible !== false}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        isVisible: e.target.checked,
                      })
                    }
                    className="rounded text-[#241710]"
                  />
                  <span>ظاهر في المتجر</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#241710]">
                  <input
                    type="checkbox"
                    checked={editingCategory.isFeatured}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        isFeatured: e.target.checked,
                      })
                    }
                    className="rounded text-[#241710]"
                  />
                  <span>تصنيف مميز في الصفحة الرئيسية</span>
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
                  className="px-5 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التصنيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
