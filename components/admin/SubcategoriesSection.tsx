import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Category } from '@/types';
import { BackendSubcategory } from '@/types/category';
import { subcategoryService } from '@/lib/api/services/categoryService';
import { normalizeApiError } from '@/lib/api/errors';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  RefreshCw,
  FolderTree,
  X,
  Check,
  CornerDownLeft,
  Sparkles,
  AlertTriangle,
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
    name_ar?: string;
    name_en?: string;
    image?: string | null;
    public_id?: string | null;
  }) => Promise<void>;
  onDeleteSubcategory: (id: number | string) => Promise<void>;
  onHardDeleteSubcategory?: (id: number | string) => Promise<void>;
  onRestoreSubcategory?: (id: number | string) => Promise<void>;
  isAdmin?: boolean;
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
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
}

export default function SubcategoriesSection({
  categories,
  subcategories,
  onSaveSubcategory,
  onDeleteSubcategory,
  onHardDeleteSubcategory,
  onRestoreSubcategory,
  isAdmin = false,
  onRequestDeleteConfirm,
  isModalOpen: controlledModalOpen,
  setIsModalOpen: setControlledModalOpen,
}: SubcategoriesSectionProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [archivedSubcategories, setArchivedSubcategories] = useState<BackendSubcategory[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [archivedError, setArchivedError] = useState<string | null>(null);

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = controlledModalOpen !== undefined ? controlledModalOpen : internalModalOpen;
  const setIsModalOpen = setControlledModalOpen || setInternalModalOpen;

  const [editingSubcategory, setEditingSubcategory] = useState<BackendSubcategory | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    name_ar: string;
    name_en: string;
    category_id: string | number;
    image: string;
    public_id?: string;
  }>({
    name: '',
    name_ar: '',
    name_en: '',
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
      const subName = sub?.name || sub?.name_ar || sub?.name_en || '';
      const matchesSearch = subName.toLowerCase().includes(searchQuery.toLowerCase().trim());
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
        const subName = sub?.name || sub?.name_ar || sub?.name_en || '';
        const matchesSearch = !searchQuery.trim() || subName.toLowerCase().includes(searchQuery.toLowerCase().trim());
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
      name_ar: '',
      name_en: '',
      category_id: defaultParentId || categories[0]?.id || 1,
      image: '',
      public_id: undefined,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: BackendSubcategory) => {
    setEditingSubcategory(sub);
    const subNameAr = sub.name_ar || sub.name || '';
    const subNameEn = sub.name_en || '';
    setFormData({
      name: subNameAr,
      name_ar: subNameAr,
      name_en: subNameEn,
      category_id: sub.category_id,
      image: sub.image || '',
      public_id: sub.public_id || undefined,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const nameAr = (formData.name_ar || formData.name || '').trim();
    const nameEn = (formData.name_en || nameAr).trim();
    if (!nameAr) {
      setFormError('يرجى إدخال اسم التصنيف الفرعي باللغة العربية');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await onSaveSubcategory({
        id: editingSubcategory?.id,
        category_id: formData.category_id,
        name: nameAr,
        name_ar: nameAr,
        name_en: nameEn,
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

  const fetchArchivedSubcategories = useCallback(async () => {
    setIsLoadingArchived(true);
    setArchivedError(null);
    try {
      const data = await subcategoryService.getDeletedSubcategories();
      setArchivedSubcategories(data || []);
    } catch (err: any) {
      setArchivedError(normalizeApiError(err).message);
      setArchivedSubcategories([]);
    } finally {
      setIsLoadingArchived(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'archived') {
      fetchArchivedSubcategories();
    }
  }, [activeTab, fetchArchivedSubcategories]);

  const filteredArchivedSubcategories = useMemo(() => {
    return archivedSubcategories.filter((sub) => {
      const subName = sub?.name || sub?.name_ar || sub?.name_en || '';
      const matchesSearch = subName.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const parentCat = getCategoryInfo(sub.category_id);
      const matchesParent =
        selectedParentFilter === 'all' ||
        String(sub.category_id) === String(selectedParentFilter) ||
        (parentCat && String(parentCat.id) === String(selectedParentFilter));
      return matchesSearch && matchesParent;
    });
  }, [archivedSubcategories, searchQuery, selectedParentFilter, getCategoryInfo]);

  const handleArchive = (sub: BackendSubcategory) => {
    const subName = sub.name || sub.name_ar || sub.name_en || `تصنيف #${sub.id}`;
    onRequestDeleteConfirm(
      `أرشفة التصنيف الفرعي: «${subName}»`,
      `هل أنت متأكد من رغبتك في أرشفة هذا التصنيف الفرعي؟ سيتم إخفاؤه من واجهة المتجر مع الاحتفاظ ببياناته وصوره وإمكانية استعادته لاحقاً.`,
      async () => {
        await onDeleteSubcategory(sub.id);
        if (archivedSubcategories.length > 0) {
          fetchArchivedSubcategories().catch(() => {});
        }
      },
      {
        confirmLabel: 'أرشفة ونقل للأرشيف',
        variant: 'warning',
        icon: 'archive',
      }
    );
  };

  const handleHardDelete = (sub: BackendSubcategory) => {
    const subName = sub.name || sub.name_ar || sub.name_en || `تصنيف #${sub.id}`;
    onRequestDeleteConfirm(
      `حذف نهائي للتصنيف الفرعي: «${subName}»`,
      `تحذير: سيتم حذف هذا التصنيف الفرعي نهائياً من قاعدة البيانات وإزالة جميع صوره المرتبطة على السحابة (Cloudinary) بشكل دائم. تأكد من عدم وجود منتجات مرتبطة به.`,
      async () => {
        if (onHardDeleteSubcategory) {
          await onHardDeleteSubcategory(sub.id);
        } else {
          await subcategoryService.hardDeleteSubcategory(Number(sub.id));
        }
      },
      {
        confirmLabel: 'حذف نهائي دائم',
        variant: 'danger',
        icon: 'delete',
      }
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE3D8] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-[#241710] text-[#FAF5EB] shadow-xs'
              : 'text-[#736B63] hover:text-[#241710] hover:bg-[#FAF8F5]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>التصنيفات الفرعية النشطة</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {subcategories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'archived'
              ? 'bg-[#241710] text-[#FAF5EB] shadow-xs'
              : 'text-[#736B63] hover:text-[#241710] hover:bg-[#FAF8F5]'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>الأرشيف والمحذوفات</span>
          {archivedSubcategories.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-900 font-mono">
              {archivedSubcategories.length}
            </span>
          )}
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

      {/* ACTIVE SUBCATEGORIES TAB */}
      {activeTab === 'active' && (
        <>
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
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#E8DEC0] shrink-0 p-1 flex items-center justify-center">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-contain"
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

                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] shrink-0 p-0.5 flex items-center justify-center">
                            {sub.image ? (
                              <Image
                                src={sub.image}
                                alt={sub.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#A27B5C]">
                                <Layers className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#241710]">
                                {sub.name_ar || sub.name || sub.name_en || `تصنيف #${sub.id}`}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Check className="w-2.5 h-2.5" />
                                <span>نشط</span>
                              </span>
                            </div>
                            {sub.name_en && sub.name_en !== (sub.name_ar || sub.name) && (
                              <span className="text-[10px] text-[#8C7A6B] block font-medium" dir="ltr">
                                {sub.name_en}
                              </span>
                            )}
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
                            onClick={() => handleArchive(sub)}
                            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors"
                            title="أرشفة التصنيف الفرعي (حفظ بالأرشيف وإخفاء)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleHardDelete(sub)}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                              title="حذف نهائي دائم (مدير النظام فقط)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] shrink-0 p-1 flex items-center justify-center">
                              {sub.image ? (
                                <Image
                                  src={sub.image}
                                  alt={sub.name}
                                  fill
                                  className="object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#A27B5C]">
                                  <Layers className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#241710] text-xs">
                                {sub.name_ar || sub.name || sub.name_en || `تصنيف #${sub.id}`}
                              </p>
                              {sub.name_en && sub.name_en !== (sub.name_ar || sub.name) && (
                                <span className="text-[10px] text-[#8C7A6B] block font-medium" dir="ltr">
                                  {sub.name_en}
                                </span>
                              )}
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
                            <span className="font-bold text-[#241710]">
                              {sub.name || sub.name_ar || sub.name_en || `تصنيف #${sub.id}`}
                            </span>
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
                              onClick={() => handleArchive(sub)}
                              className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors"
                              title="أرشفة التصنيف الفرعي"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleHardDelete(sub)}
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                                title="حذف نهائي دائم (مدير النظام فقط)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
    </>
  )}

      {/* ARCHIVED SUBCATEGORIES TAB */}
      {activeTab === 'archived' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                التصنيفات الفرعية المؤرشفة محفوظة في النظام ومخفية عن معروضات المتجر. يمكنك استعادتها أو حذفها نهائياً لتنظيف السحابة.
              </span>
            </div>
            <button
              type="button"
              onClick={fetchArchivedSubcategories}
              disabled={isLoadingArchived}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingArchived ? 'animate-spin' : ''}`} />
              <span>تحديث الأرشيف</span>
            </button>
          </div>

          {archivedError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
              {archivedError}
            </div>
          )}

          {isLoadingArchived ? (
            <div className="p-12 text-center text-xs text-[#8C7A6B]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#A27B5C] mb-2" />
              جاري تحميل التصنيفات الفرعية المؤرشفة...
            </div>
          ) : filteredArchivedSubcategories.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-[#EAE3D8] text-center space-y-2">
              <Archive className="w-8 h-8 text-[#8C7A6B] mx-auto opacity-40" />
              <p className="text-sm font-bold text-[#241710]">لا توجد تصنيفات فرعية مؤرشفة</p>
              <p className="text-xs text-[#8C7A6B]">جميع التصنيفات الفرعية نشطة ومعروضة حالياً في المتجر.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 text-right">التصنيف الفرعي</th>
                      <th className="py-3 px-4 text-right">التصنيف الرئيسي</th>
                      <th className="py-3 px-4 text-right">تاريخ الأرشفة</th>
                      <th className="py-3 px-4 text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5EFE6]">
                    {filteredArchivedSubcategories.map((sub) => {
                      const parentCat = getCategoryInfo(sub.category_id);
                      const parentName = parentCat?.name || `تصنيف #${sub.category_id}`;
                      const subName = sub.name || sub.name_ar || sub.name_en || `تصنيف #${sub.id}`;

                      return (
                        <tr key={sub.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] shrink-0 p-0.5 flex items-center justify-center">
                                {sub.image ? (
                                  <Image
                                    src={sub.image}
                                    alt={subName}
                                    fill
                                    className="object-contain grayscale"
                                  />
                                ) : (
                                  <Layers className="w-4 h-4 text-[#A27B5C]" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-[#241710] block">{subName}</span>
                                <span className="text-[10px] text-[#8C7A6B] font-mono">معرف #{sub.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-[#241710]">
                            <span className="px-2.5 py-1 rounded-lg bg-[#FAF5EB] text-[#241710] border border-[#E8DEC0] text-xs">
                              {parentName}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-xs text-[#8C7A6B]">
                            {sub.deleted_at ? new Date(sub.deleted_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                          </td>

                          <td className="py-3.5 px-4 text-left">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  onRequestDeleteConfirm(
                                    `استعادة التصنيف الفرعي: «${subName}»`,
                                    'هل ترغب في استعادة هذا التصنيف الفرعي وإعادته إلى قائمة التصنيفات النشطة؟',
                                    async () => {
                                      if (onRestoreSubcategory) {
                                        await onRestoreSubcategory(sub.id);
                                      } else {
                                        await subcategoryService.restoreSubcategory(Number(sub.id));
                                      }
                                      setArchivedSubcategories((prev) => prev.filter((s) => String(s.id) !== String(sub.id)));
                                      fetchArchivedSubcategories().catch(() => {});
                                    },
                                    {
                                      confirmLabel: 'تأكيد الاستعادة',
                                      variant: 'info',
                                      icon: 'restore',
                                    }
                                  )
                                }
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>استعادة</span>
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRequestDeleteConfirm(
                                      `حذف نهائي للتصنيف الفرعي المؤرشف: «${subName}»`,
                                      'تحذير: سيتم حذف هذا التصنيف الفرعي المؤرشف وجميع صوره على Cloudinary بشكل نهائي ولا يمكن استعادته أبداً.',
                                      async () => {
                                        if (onHardDeleteSubcategory) {
                                          await onHardDeleteSubcategory(sub.id);
                                        } else {
                                          await subcategoryService.hardDeleteSubcategory(Number(sub.id));
                                        }
                                        setArchivedSubcategories((prev) => prev.filter((s) => String(s.id) !== String(sub.id)));
                                        fetchArchivedSubcategories().catch(() => {});
                                      },
                                      {
                                        confirmLabel: 'حذف نهائي دائم',
                                        variant: 'danger',
                                        icon: 'delete',
                                      }
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف نهائي</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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

              {/* Subcategory Name (Bilingual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">
                    الاسم بالعربية <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={formData.name_ar}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        name_ar: e.target.value,
                      })
                    }
                    placeholder="مثال: سجاد تركي مودرن..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-xs font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">
                    الاسم بالإنجليزية (English Name)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="e.g. Modern Turkish Carpets..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-xs font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>
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
