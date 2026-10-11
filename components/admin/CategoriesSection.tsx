import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Category } from '@/types';
import { BackendCategory } from '@/types/category';
import { categoryService } from '@/lib/api/services/categoryService';
import { normalizeApiError } from '@/lib/api/errors';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  RefreshCw,
  Check,
  X,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import CloudinaryImageField from '@/components/CloudinaryImageField';

interface CategoriesSectionProps {
  categories: Category[];
  productCountsByCategory: Record<string, number>;
  onSaveCategory: (category: Category) => Promise<void> | void;
  onDeleteCategory: (categoryId: string) => Promise<void> | void;
  onHardDeleteCategory?: (categoryId: string) => Promise<void> | void;
  onRestoreCategory?: (categoryId: string) => Promise<void> | void;
  isAdmin?: boolean;
  onRequestDeleteConfirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmLabel?: string;
      cancelLabel?: string;
      variant?: 'danger' | 'warning' | 'info';
      icon?: 'delete' | 'archive' | 'restore';
    }
  ) => void;
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
  onHardDeleteCategory,
  onRestoreCategory,
  isAdmin = false,
  onRequestDeleteConfirm,
  editingCategory,
  setEditingCategory,
  isModalOpen,
  setIsModalOpen,
}: CategoriesSectionProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [archivedCategories, setArchivedCategories] = useState<BackendCategory[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [archivedError, setArchivedError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchArchivedCategories = useCallback(async () => {
    setIsLoadingArchived(true);
    setArchivedError(null);
    try {
      const data = await categoryService.getDeletedCategories();
      setArchivedCategories(data || []);
    } catch (err: any) {
      setArchivedError(normalizeApiError(err).message);
      setArchivedCategories([]);
    } finally {
      setIsLoadingArchived(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'archived') {
      fetchArchivedCategories();
    }
  }, [activeTab, fetchArchivedCategories]);

  const filteredArchivedCategories = useMemo(() => {
    return archivedCategories.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const name = c.name || c.name_ar || c.name_en || '';
      return (
        !q ||
        name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q))
      );
    });
  }, [archivedCategories, searchQuery]);

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
          <FolderTree className="w-4 h-4" />
          <span>التصنيفات النشطة</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {categories.length}
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
          {archivedCategories.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-900 font-mono">
              {archivedCategories.length}
            </span>
          )}
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
            placeholder={
              activeTab === 'active'
                ? 'ابحث عن تصنيف رئيسي نشط بالاسم أو الوصف...'
                : 'ابحث في التصنيفات المؤرشفة...'
            }
            className="w-full ps-9 pe-3 py-2.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710]"
          />
        </div>

        <span className="text-xs text-[#8C7A6B]">
          الإجمالي:{' '}
          <strong className="text-[#241710]">
            {activeTab === 'active' ? categories.length : archivedCategories.length}
          </strong>{' '}
          {activeTab === 'active' ? 'تصنيف نشط' : 'تصنيف في الأرشيف'}
        </span>
      </div>

      {/* ACTIVE CATEGORIES TAB */}
      {activeTab === 'active' && (
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
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg text-[#241710] hover:bg-[#F5EFE6] transition-colors"
                        title="تعديل التصنيف"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Archive (Soft delete) */}
                      <button
                        type="button"
                        onClick={() =>
                          onRequestDeleteConfirm(
                            `أرشفة التصنيف: «${cat.name}»`,
                            'هل ترغب في نقل هذا التصنيف إلى الأرشيف وإخفائه من المتجر؟ ستبقى بياناته وصوره محفوظة، ويمكنك استعادته في أي وقت لاحقاً.',
                            async () => {
                              await onDeleteCategory(cat.id);
                              if (archivedCategories.length > 0) {
                                fetchArchivedCategories().catch(() => {});
                              }
                            },
                            {
                              confirmLabel: 'أرشفة ونقل للأرشيف',
                              variant: 'warning',
                              icon: 'archive',
                            }
                          )
                        }
                        className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                        title="أرشفة التصنيف (حفظ بالأرشيف وإخفاء)"
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      {/* Permanent Hard Delete (Admin only) */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            onRequestDeleteConfirm(
                              `حذف نهائي للتصنيف: «${cat.name}»`,
                              'تحذير: سيتم حذف هذا التصنيف نهائياً من قاعدة البيانات وإزالة جميع صوره المرتبطة على السحابة (Cloudinary) بشكل دائم. لا يمكن التراجع عن هذا الإجراء.',
                              async () => {
                                if (onHardDeleteCategory) {
                                  await onHardDeleteCategory(cat.id);
                                } else {
                                  await categoryService.hardDeleteCategory(Number(cat.id));
                                }
                              },
                              {
                                confirmLabel: 'حذف نهائي دائم',
                                variant: 'danger',
                                icon: 'delete',
                              }
                            )
                          }
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="حذف نهائي دائم (مدير النظام فقط)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ARCHIVED CATEGORIES TAB */}
      {activeTab === 'archived' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                التصنيفات المؤرشفة مخفية من المتجر العام ولكن صورها وبياناتها محفوظة بالكامل. يمكنك استعادتها في أي وقت، أو حذفها نهائياً لتنظيف السحابة.
              </span>
            </div>
            <button
              type="button"
              onClick={fetchArchivedCategories}
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
              جاري تحميل التصنيفات المؤرشفة...
            </div>
          ) : filteredArchivedCategories.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-[#EAE3D8] text-center space-y-2">
              <Archive className="w-8 h-8 text-[#8C7A6B] mx-auto opacity-40" />
              <p className="text-sm font-bold text-[#241710]">لا توجد تصنيفات مؤرشفة</p>
              <p className="text-xs text-[#8C7A6B]">جميع التصنيفات الرئيسية نشطة ومعروضة حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArchivedCategories.map((archived) => {
                const catName = archived.name || archived.name_ar || archived.name_en || `تصنيف #${archived.id}`;
                return (
                  <div
                    key={archived.id}
                    className="rounded-2xl border border-amber-200/90 bg-white overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#FAF8F5]">
                      {archived.image ? (
                        <Image
                          src={archived.image}
                          alt={catName}
                          fill
                          className="object-contain p-2 grayscale contrast-75"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <FolderTree className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-3 start-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white flex items-center gap-1 shadow-xs">
                          <Archive className="w-3 h-3" />
                          <span>مؤرشف</span>
                        </span>
                      </div>
                      <div className="absolute bottom-3 start-3 end-3 bg-black/60 backdrop-blur-xs p-2 rounded-xl text-white">
                        <h3 className="font-bold text-xs">{catName}</h3>
                        <p className="text-[10px] text-white/70 font-mono mt-0.5">{archived.slug || `معرف #${archived.id}`}</p>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="text-[11px] text-[#8C7A6B]">
                        تاريخ الأرشفة: {archived.deleted_at ? new Date(archived.deleted_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                      </div>

                      <div className="pt-3 border-t border-[#F5EFE6] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onRequestDeleteConfirm(
                              `استعادة التصنيف: «${catName}»`,
                              'هل ترغب في استعادة هذا التصنيف وإعادته إلى قائمة التصنيفات النشطة والمعروضة في المتجر؟',
                              async () => {
                                if (onRestoreCategory) {
                                  await onRestoreCategory(String(archived.id));
                                } else {
                                  await categoryService.restoreCategory(archived.id);
                                }
                                await fetchArchivedCategories();
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
                          <span>استعادة التصنيف</span>
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              onRequestDeleteConfirm(
                                `حذف نهائي للتصنيف المؤرشف: «${catName}»`,
                                'تحذير: سيتم حذف هذا التصنيف المؤرشف وجميع صوره على Cloudinary بشكل نهائي ولا يمكن استعادته أبداً.',
                                async () => {
                                  if (onHardDeleteCategory) {
                                    await onHardDeleteCategory(String(archived.id));
                                  } else {
                                    await categoryService.hardDeleteCategory(archived.id);
                                  }
                                  await fetchArchivedCategories();
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
