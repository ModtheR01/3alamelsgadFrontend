'use client';

import React, { useState, useMemo } from 'react';
import { Category } from '@/types';
import { BackendSubcategory } from '@/types/category';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  FolderTree,
  X,
  Check,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import CloudinaryImageField from '@/components/CloudinaryImageField';

interface SubcategoriesSectionProps {
  categories: Category[];
  subcategories: BackendSubcategory[];
  onSaveSubcategory: (sub: {
    id?: number | string;
    category_id: number | string;
    name: string;
    image?: string | null;
    public_id?: string | null;
  }) => Promise<void>;
  onDeleteSubcategory: (id: number | string) => Promise<void>;
  onRequestDeleteConfirm: (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>
  ) => void;
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
}

export default function SubcategoriesSection({
  categories,
  subcategories,
  onSaveSubcategory,
  onDeleteSubcategory,
  onRequestDeleteConfirm,
  isModalOpen: controlledModalOpen,
  setIsModalOpen: setControlledModalOpen,
}: SubcategoriesSectionProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = controlledModalOpen !== undefined ? controlledModalOpen : internalModalOpen;
  const setIsModalOpen = setControlledModalOpen || setInternalModalOpen;

  const [editingSubcategory, setEditingSubcategory] = useState<BackendSubcategory | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    category_id: string | number;
    image: string;
    public_id?: string;
  }>({
    name: '',
    category_id: categories[0]?.id || 1,
    image: '',
    public_id: undefined,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentFilter, setSelectedParentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'hierarchy' | 'table'>('hierarchy');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper to map category_id to Category object
  const getCategoryInfo = React.useCallback(
    (catId: number | string) => {
      return categories.find(
        (c, idx) =>
          String(c.id) === String(catId) ||
          idx + 1 === Number(catId)
      );
    },
    [categories]
  );

  // Filtered Subcategories
  const filteredSubcategories = useMemo(() => {
    return subcategories.filter((sub) => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const parentCat = getCategoryInfo(sub.category_id);
      const matchesParent =
        selectedParentFilter === 'all' ||
        String(sub.category_id) === String(selectedParentFilter) ||
        (parentCat && String(parentCat.id) === String(selectedParentFilter));

      return matchesSearch && matchesParent;
    });
  }, [subcategories, searchQuery, selectedParentFilter, getCategoryInfo]);

  // Group subcategories by parent category for the visual hierarchy view
  const subcategoriesByCategory = useMemo(() => {
    const map = new Map<string, { category: Category; subs: BackendSubcategory[] }>();

    categories.forEach((cat, idx) => {
      const matchingSubs = subcategories.filter(
        (sub) =>
          String(sub.category_id) === String(cat.id) ||
          Number(sub.category_id) === idx + 1
      );

      // Apply search / parent filters if active
      const filteredMatchingSubs = matchingSubs.filter((sub) => {
        const matchesSearch = !searchQuery.trim() || sub.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const matchesParent = selectedParentFilter === 'all' || String(cat.id) === String(selectedParentFilter);
        return matchesSearch && matchesParent;
      });

      if (selectedParentFilter === 'all' || String(cat.id) === String(selectedParentFilter)) {
        map.set(cat.id, {
          category: cat,
          subs: filteredMatchingSubs,
        });
      }
    });

    return map;
  }, [categories, subcategories, searchQuery, selectedParentFilter]);

  const handleOpenAdd = (defaultParentId?: string | number) => {
    setEditingSubcategory(null);
    setFormData({
      name: '',
      category_id: defaultParentId || categories[0]?.id || 1,
      image: '',
      public_id: undefined,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: BackendSubcategory) => {
    setEditingSubcategory(sub);
    setFormData({
      name: sub.name,
      category_id: sub.category_id,
      image: sub.image || '',
      public_id: sub.public_id || undefined,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('يرجى إدخال اسم التصنيف الفرعي');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await onSaveSubcategory({
        id: editingSubcategory?.id,
        category_id: formData.category_id,
        name: formData.name.trim(),
        image: formData.image || null,
        public_id: formData.public_id || null,
      });
      setIsModalOpen(false);
      setEditingSubcategory(null);
    } catch (err: any) {
      setFormError(err?.message || 'تعذر حفظ التصنيف الفرعي');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (sub: BackendSubcategory) => {
    onRequestDeleteConfirm(
      'حذف التصنيف الفرعي',
      `هل أنت متأكد من رغبتك في حذف التصنيف الفرعي «${sub.name}» نهائياً من المتجر؟`,
      () => onDeleteSubcategory(sub.id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
              إدارة التصنيفات الفرعية
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
              {subcategories.length} تصنيف فرعي
            </span>
          </div>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            هيكلة وتصنيف معروضات المتجر هرمياً (التصنيف الرئيسي └── التصنيف الفرعي) لسهولة التصفح والفلترة.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="px-4 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#EED8BE]" />
          <span>إضافة تصنيف فرعي جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن تصنيف فرعي بالاسم..."
            className="w-full ps-9 pe-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-xs text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710] transition-colors"
          />
          <Search className="w-4 h-4 text-[#8C7A6B] absolute start-3 top-3 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Parent Category Filter */}
          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <Filter className="w-4 h-4 text-[#A27B5C] shrink-0" />
            <select
              value={selectedParentFilter}
              onChange={(e) => setSelectedParentFilter(e.target.value)}
              className="w-full md:w-56 px-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-xs font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
            >
              <option value="all">جميع التصنيفات الرئيسية</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE3D8]">
            <button
              type="button"
              onClick={() => setViewMode('hierarchy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'hierarchy'
                  ? 'bg-white text-[#241710] shadow-xs'
                  : 'text-[#8C7A6B] hover:text-[#241710]'
              }`}
            >
              عرض الشجرة
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#241710] shadow-xs'
                  : 'text-[#8C7A6B] hover:text-[#241710]'
              }`}
            >
              جدول التفاصيل
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: VISUAL HIERARCHY TREE VIEW (Category └── Subcategory) */}
      {viewMode === 'hierarchy' && (
        <div className="space-y-4">
          {Array.from(subcategoriesByCategory.entries()).map(([catId, { category, subs }]) => (
            <div
              key={catId}
              className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4 hover:border-[#D8CEBF] transition-all"
            >
              {/* Category Root Row */}
              <div className="flex items-center justify-between pb-3 border-b border-[#FAF5EB]">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#FAF5EB] border border-[#E8DEC0] shrink-0">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A27B5C]">
                        <FolderTree className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[#241710]">{category.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
                        تصنيف رئيسي
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8C7A6B] mt-0.5">
                      {subs.length} تصنيف فرعي تابع
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAdd(category.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF5EB] hover:bg-[#F2E8D7] text-[#241710] border border-[#E8DEC0] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#A27B5C]" />
                  <span>إضافة فرعي له</span>
                </button>
              </div>

              {/* Subcategories Tree Branches */}
              {subs.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#EAE3D8] text-center text-xs text-[#8C7A6B]">
                  لا توجد تصنيفات فرعية مسجلة تحت هذا التصنيف بعد.
                  <button
                    onClick={() => handleOpenAdd(category.id)}
                    className="font-bold text-[#A27B5C] underline ms-2 hover:text-[#241710]"
                  >
                    أضف أول تصنيف فرعي الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pe-2 ps-4">
                  {subs.map((sub, sIdx) => {
                    const isLast = sIdx === subs.length - 1;

                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F5EFE6] border border-[#EAE3D8] transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          {/* Tree Branch Symbol */}
                          <div className="text-[#A27B5C] font-mono text-sm shrink-0 flex items-center select-none font-bold">
                            <span className="text-base">{isLast ? '└──' : '├──'}</span>
                          </div>

                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white border border-[#EAE3D8] shrink-0">
                            {sub.image ? (
                              <Image
                                src={sub.image}
                                alt={sub.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#A27B5C]">
                                <Layers className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#241710]">{sub.name}</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Check className="w-2.5 h-2.5" />
                                <span>نشط</span>
                              </span>
                            </div>
                            <span className="text-[10px] text-[#8C7A6B] font-mono">
                              معرف #{sub.id}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sub)}
                            className="p-1.5 rounded-lg text-[#5C4A3E] hover:text-[#241710] hover:bg-white transition-colors"
                            title="تعديل التصنيف الفرعي"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sub)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                            title="حذف التصنيف الفرعي"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODE 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs overflow-hidden">
          {filteredSubcategories.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5EB] text-[#A27B5C] flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#241710]">لا توجد تصنيفات فرعية مطابقة</h3>
              <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
                لم نعثر على أي تصنيف فرعي يطابق البحث أو الفلتر المحدد. اضغط على «إضافة تصنيف فرعي جديد» للبدء.
              </p>
              <button
                onClick={() => handleOpenAdd()}
                className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold"
              >
                إضافة تصنيف فرعي الآن
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-right">التصنيف الفرعي</th>
                    <th className="py-3 px-4 text-right">التصنيف الرئيسي التابع له</th>
                    <th className="py-3 px-4 text-right">المسار الهرمي</th>
                    <th className="py-3 px-4 text-right">الحالة</th>
                    <th className="py-3 px-4 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {filteredSubcategories.map((sub) => {
                    const parentCat = getCategoryInfo(sub.category_id);
                    const parentName = parentCat?.name || `تصنيف #${sub.category_id}`;

                    return (
                      <tr key={sub.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        {/* Subcategory Details & Image */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#FAF5EB] border border-[#EAE3D8] shrink-0">
                              {sub.image ? (
                                <Image
                                  src={sub.image}
                                  alt={sub.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#A27B5C]">
                                  <Layers className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#241710] text-xs">{sub.name}</p>
                              <span className="text-[10px] text-[#8C7A6B] font-mono">
                                معرف #{sub.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Parent Category */}
                        <td className="py-3.5 px-4 font-bold text-[#241710]">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF5EB] text-[#241710] border border-[#E8DEC0]">
                            <FolderTree className="w-3.5 h-3.5 text-[#A27B5C]" />
                            <span>{parentName}</span>
                          </div>
                        </td>

                        {/* Hierarchy Breadcrumb */}
                        <td className="py-3.5 px-4 text-[#5C4A3E]">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-[#8C7A6B]">{parentName}</span>
                            <span className="text-[#A27B5C] font-bold">←</span>
                            <span className="font-bold text-[#241710]">{sub.name}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>نشط في المتجر</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-left">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sub)}
                              className="p-1.5 rounded-lg text-[#5C4A3E] hover:text-[#241710] hover:bg-[#F5EFE6] transition-colors"
                              title="تعديل التصنيف الفرعي"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(sub)}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                              title="حذف التصنيف الفرعي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Subcategory Modal */}
      {isModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#EAE3D8] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D8]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF5EB] text-[#A27B5C]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#241710]">
                    {editingSubcategory ? 'تعديل التصنيف الفرعي' : 'إضافة تصنيف فرعي جديد'}
                  </h3>
                  <p className="text-[11px] text-[#8C7A6B]">
                    حدد التصنيف الرئيسي المناسب لتنظيم منتجات المتجر
                  </p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Parent Category Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">
                  التصنيف الرئيسي التابع له <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-xs font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#8C7A6B]">
                  سيتم إدراج هذا التصنيف الفرعي داخل قسم هذا التصنيف في قائمة المتجر والفلترة.
                </p>
              </div>

              {/* Subcategory Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">
                  اسم التصنيف الفرعي <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: سجاد تركي مودرن، أروال ممرات ٨٠ سم، بديل السجاد..."
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-xs font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
                />
              </div>

              {/* Subcategory Image Upload */}
              <div className="space-y-2 pt-2 border-t border-[#EAE3D8]">
                <CloudinaryImageField
                  label="صورة التصنيف الفرعي (اختياري)"
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  onUploadResult={(result) =>
                    setFormData((prev) => ({
                      ...prev,
                      image: result.secure_url || result.url,
                      public_id: result.public_id,
                    }))
                  }
                  folder="alamelsgad-subcategories"
                />
              </div>

              {/* Action Buttons */}
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
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التصنيف الفرعي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
