'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from '@/components/SafeImage';
import {
  BackendCategory,
  BackendSubcategory,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  SubcategoryCreateRequest,
  SubcategoryUpdateRequest,
} from '@/types/category';
import { categoryService, subcategoryService } from '@/lib/api/services/categoryService';
import { normalizeApiError, NormalizedError } from '@/lib/api/errors';
import { useToccoStore } from '@/lib/store';
import CloudinaryImageField from '@/components/CloudinaryImageField';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonCardGrid } from '@/components/DashboardSkeleton';
import {
  Folder,
  FolderPlus,
  Layers,
  Trash2,
  Edit2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Image as ImageIcon,
  X,
  Plus,
  RefreshCw,
  Archive,
  ArrowRight,
  Info,
} from 'lucide-react';

type ManagementTab = 'categories' | 'subcategories' | 'deleted';

export default function CategoriesManagement() {
  const { categories: storeCategories, saveCategory: syncStoreCategory, deleteCategory: syncDeleteStoreCategory } = useToccoStore();

  // State
  const [activeTab, setActiveTab] = useState<ManagementTab>('categories');
  const [activeCategories, setActiveCategories] = useState<BackendCategory[]>([]);
  const [activeSubcategories, setActiveSubcategories] = useState<BackendSubcategory[]>([]);
  const [deletedCategories, setDeletedCategories] = useState<BackendCategory[]>([]);
  const [deletedSubcategories, setDeletedSubcategories] = useState<BackendSubcategory[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedParentFilter, setSelectedParentFilter] = useState<string>('all');
  const [deletedViewMode, setDeletedViewMode] = useState<'categories' | 'subcategories'>('categories');

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormMode, setCategoryFormMode] = useState<'create' | 'edit'>('create');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<CategoryCreateRequest>({
    name: '',
    image: '',
    public_id: '',
  });
  const [categoryFormErrors, setCategoryFormErrors] = useState<Record<string, string[]>>({});

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [subcategoryFormMode, setSubcategoryFormMode] = useState<'create' | 'edit'>('create');
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<number | null>(null);
  const [subcategoryFormData, setSubcategoryFormData] = useState<SubcategoryCreateRequest>({
    category_id: 1,
    name: '',
    image: '',
    public_id: '',
  });
  const [subcategoryFormErrors, setSubcategoryFormErrors] = useState<Record<string, string[]>>({});

  // Delete confirmation modals
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'category' | 'subcategory';
    mode: 'soft' | 'hard';
    id: number;
    name: string;
    hasSubcategories?: boolean;
    subcategoriesCount?: number;
  } | null>(null);

  // Reload function. Pass the current search text to filter categories/subcategories
  // server-side via `?search=`; deleted lists are always fetched in full.
  const loadData = useCallback(async (search: string) => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const searchParams = search ? { search } : undefined;
      const [cats, subcats, delCats, delSubcats] = await Promise.all([
        categoryService.getCategories(searchParams),
        subcategoryService.getSubcategories(searchParams),
        categoryService.getDeletedCategories(),
        subcategoryService.getDeletedSubcategories(),
      ]);

      setActiveCategories(cats);
      setActiveSubcategories(subcats);
      setDeletedCategories(delCats);
      setDeletedSubcategories(delSubcats);
    } catch (err: any) {
      const norm = normalizeApiError(err);
      setErrorBanner(norm.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load immediately on mount, then debounce reloads as the search box changes.
  const didMount = useRef(false);
  useEffect(() => {
    const query = searchQuery.trim();
    if (!didMount.current) {
      didMount.current = true;
      loadData(query);
      return;
    }
    const handle = setTimeout(() => loadData(query), 350);
    return () => clearTimeout(handle);
  }, [searchQuery, loadData]);

  // Flash notifications
  const notifySuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const notifyError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 6000);
  };

  // Map of category_id to Category for fast lookup
  const categoryMap = useMemo(() => {
    const map = new Map<number, BackendCategory>();
    activeCategories.forEach((c) => map.set(c.id, c));
    deletedCategories.forEach((c) => map.set(c.id, c));
    return map;
  }, [activeCategories, deletedCategories]);

  // Subcategories count per category
  const subcategoryCounts = useMemo(() => {
    const map = new Map<number, number>();
    activeSubcategories.forEach((s) => {
      map.set(s.category_id, (map.get(s.category_id) || 0) + 1);
    });
    return map;
  }, [activeSubcategories]);

  const allSubcategoryCounts = useMemo(() => {
    const map = new Map<number, number>();
    [...activeSubcategories, ...deletedSubcategories].forEach((sub) => {
      map.set(sub.category_id, (map.get(sub.category_id) || 0) + 1);
    });
    return map;
  }, [activeSubcategories, deletedSubcategories]);

  // Categories/subcategories are already filtered server-side by `?search=`;
  // the parent-category dropdown is a separate, client-side-only filter.
  const filteredActiveCategories = activeCategories;

  const filteredActiveSubcategories = useMemo(() => {
    return activeSubcategories.filter((sub) => {
      if (selectedParentFilter !== 'all' && sub.category_id !== Number(selectedParentFilter)) {
        return false;
      }
      return true;
    });
  }, [activeSubcategories, selectedParentFilter]);

  
  const filteredDeletedCategories = useMemo(() => {
    return deletedCategories.filter((cat) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return cat.name.toLowerCase().includes(q);
    });
  }, [deletedCategories, searchQuery]);

  const filteredDeletedSubcategories = useMemo(() => {
    return deletedSubcategories.filter((sub) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const parentName = categoryMap.get(sub.category_id)?.name || '';
      return sub.name.toLowerCase().includes(q) || parentName.toLowerCase().includes(q);
    });
  }, [deletedSubcategories, searchQuery, categoryMap]);

  // ==========================================
  // Category Modal Handlers
  // ==========================================
  const handleOpenCreateCategory = () => {
    setCategoryFormMode('create');
    setEditingCategoryId(null);
    setCategoryFormData({ name: '', image: '', public_id: '' });
    setCategoryFormErrors({});
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: BackendCategory) => {
    setCategoryFormMode('edit');
    setEditingCategoryId(cat.id);
    setCategoryFormData({
      name: cat.name,
      image: cat.image || '',
      public_id: cat.public_id || '',
    });
    setCategoryFormErrors({});
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setCategoryFormErrors({});

    try {
      if (categoryFormMode === 'create') {
        const created = await categoryService.createCategory({
          name: categoryFormData.name.trim(),
          image: categoryFormData.image?.trim() || null,
          public_id: categoryFormData.public_id?.trim() || null,
        });
        notifySuccess(`Category "${created.name}" created successfully.`);
      } else if (editingCategoryId) {
        const updated = await categoryService.updateCategory(
          editingCategoryId,
          {
            name: categoryFormData.name.trim(),
            image: categoryFormData.image?.trim() || null,
            public_id: categoryFormData.public_id?.trim() || null,
          },
          'PATCH'
        );
        notifySuccess(`Category "${updated.name}" updated successfully.`);
      }

      setIsCategoryModalOpen(false);
      await loadData(searchQuery.trim());
    } catch (err: any) {
      const norm = normalizeApiError(err);
      if (norm.fieldErrors && Object.keys(norm.fieldErrors).length > 0) {
        setCategoryFormErrors(norm.fieldErrors);
      } else {
        notifyError(norm.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // Subcategory Modal Handlers
  // ==========================================
  const handleOpenCreateSubcategory = (defaultCategoryId?: number) => {
    setSubcategoryFormMode('create');
    setEditingSubcategoryId(null);
    const initialCatId = defaultCategoryId || (activeCategories.length > 0 ? activeCategories[0].id : 1);
    setSubcategoryFormData({
      category_id: initialCatId,
      name: '',
      image: '',
      public_id: '',
    });
    setSubcategoryFormErrors({});
    setIsSubcategoryModalOpen(true);
  };

  const handleOpenEditSubcategory = (sub: BackendSubcategory) => {
    setSubcategoryFormMode('edit');
    setEditingSubcategoryId(sub.id);
    setSubcategoryFormData({
      category_id: sub.category_id,
      name: sub.name,
      image: sub.image || '',
      public_id: sub.public_id || '',
    });
    setSubcategoryFormErrors({});
    setIsSubcategoryModalOpen(true);
  };

  const handleSubmitSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setSubcategoryFormErrors({});

    try {
      if (subcategoryFormMode === 'create') {
        const created = await subcategoryService.createSubcategory({
          category_id: Number(subcategoryFormData.category_id),
          name: subcategoryFormData.name.trim(),
          image: subcategoryFormData.image?.trim() || null,
          public_id: subcategoryFormData.public_id?.trim() || null,
        });
        notifySuccess(`Subcategory "${created.name}" created successfully.`);
      } else if (editingSubcategoryId) {
        const updated = await subcategoryService.updateSubcategory(
          editingSubcategoryId,
          {
            category_id: Number(subcategoryFormData.category_id),
            name: subcategoryFormData.name.trim(),
            image: subcategoryFormData.image?.trim() || null,
            public_id: subcategoryFormData.public_id?.trim() || null,
          },
          'PATCH'
        );
        notifySuccess(`Subcategory "${updated.name}" updated successfully.`);
      }

      setIsSubcategoryModalOpen(false);
      await loadData(searchQuery.trim());
    } catch (err: any) {
      const norm = normalizeApiError(err);
      if (norm.fieldErrors && Object.keys(norm.fieldErrors).length > 0) {
        setSubcategoryFormErrors(norm.fieldErrors);
      } else {
        notifyError(norm.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // Delete / Soft Delete / Hard Delete
  // ==========================================
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (
      itemToDelete.type === 'category' &&
      itemToDelete.mode === 'hard' &&
      itemToDelete.hasSubcategories
    ) {
      notifyError(
        `Cannot permanently delete category "${itemToDelete.name}" because it still contains ${itemToDelete.subcategoriesCount || 'one or more'} subcategories. Delete or reassign the subcategories first.`
      );
      return;
    }

    setActionLoading(true);

    try {
      if (itemToDelete.type === 'category') {
        if (itemToDelete.mode === 'soft') {
          await categoryService.deleteCategory(itemToDelete.id);
          notifySuccess(`Category "${itemToDelete.name}" soft-deleted. It can be restored from Archives.`);
        } else {
          await categoryService.hardDeleteCategory(itemToDelete.id);
          notifySuccess(`Category "${itemToDelete.name}" permanently deleted.`);
        }
      } else {
        if (itemToDelete.mode === 'soft') {
          await subcategoryService.deleteSubcategory(itemToDelete.id);
          notifySuccess(`Subcategory "${itemToDelete.name}" soft-deleted. It can be restored from Archives.`);
        } else {
          await subcategoryService.hardDeleteSubcategory(itemToDelete.id);
          notifySuccess(`Subcategory "${itemToDelete.name}" permanently deleted.`);
        }
      }

      setItemToDelete(null);
      await loadData(searchQuery.trim());
    } catch (err: any) {
      const norm = normalizeApiError(err);
      const isCategoryHardDelete = itemToDelete.type === 'category' && itemToDelete.mode === 'hard';
      const message = isCategoryHardDelete && norm.message === 'An unexpected error occurred. Please try again.'
        ? `Cannot permanently delete category "${itemToDelete.name}". The backend rejected the deletion because this category still has related records, most commonly subcategories. Delete or reassign them first, then try again.`
        : norm.message;
      notifyError(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // Restore Handlers
  // ==========================================
  const handleRestoreCategory = async (cat: BackendCategory) => {
    setActionLoading(true);
    try {
      const res = await categoryService.restoreCategory(cat.id);
      notifySuccess(res.detail || `Category "${cat.name}" restored successfully.`);
      await loadData(searchQuery.trim());
    } catch (err: any) {
      const norm = normalizeApiError(err);
      notifyError(norm.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreSubcategory = async (sub: BackendSubcategory) => {
    setActionLoading(true);
    try {
      const res = await subcategoryService.restoreSubcategory(sub.id);
      notifySuccess(res.detail || `Subcategory "${sub.name}" restored successfully.`);
      await loadData(searchQuery.trim());
    } catch (err: any) {
      const norm = normalizeApiError(err);
      notifyError(norm.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div id="categories-management-container" className="space-y-6 overflow-x-hidden">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE4DC]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-normal tracking-tight text-[#1C1A19]">
              Categories & Subcategories
            </h2>
          </div>
          <p className="text-xs text-[#736B63] mt-0.5">
            Manage architectural product taxonomy, assign subcategories, and handle soft/hard deletions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(searchQuery.trim())}
            disabled={loading}
            title="Reload from API"
            className="p-2 rounded-full border border-[#D8CEBF] text-[#524B45] hover:text-[#1C1A19] hover:bg-[#EFEBE3] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateCategory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D] transition-colors shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => handleOpenCreateSubcategory()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#1C1A19] text-[#1C1A19] hover:bg-[#1C1A19] hover:text-white text-xs uppercase tracking-wider font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subcategory</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Subtabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 border-b md:border-b-0 border-[#EAE4DC] pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('categories')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
              activeTab === 'categories'
                ? 'bg-[#1C1A19] text-white shadow-sm'
                : 'bg-[#EFEBE3] text-[#524B45] hover:bg-[#E5DFD4]'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Categories</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {activeCategories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('subcategories')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
              activeTab === 'subcategories'
                ? 'bg-[#1C1A19] text-white shadow-sm'
                : 'bg-[#EFEBE3] text-[#524B45] hover:bg-[#E5DFD4]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subcategories</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {activeSubcategories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('deleted')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
              activeTab === 'deleted'
                ? 'bg-[#B85D38] text-white shadow-sm'
                : 'bg-[#EFEBE3] text-[#524B45] hover:bg-[#E5DFD4]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Deleted Archives</span>
            {(deletedCategories.length > 0 || deletedSubcategories.length > 0) && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/25 text-[10px]">
                {deletedCategories.length + deletedSubcategories.length}
              </span>
            )}
          </button>
        </div>

        {/* Search & Parent Filter */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'subcategories' && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#736B63]" />
              <select
                value={selectedParentFilter}
                onChange={(e) => setSelectedParentFilter(e.target.value)}
                className="bg-white border border-[#D8CEBF] text-xs text-[#1C1A19] rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="all">All Parent Categories</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8F8880] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === 'categories'
                  ? 'Search categories...'
                  : activeTab === 'subcategories'
                  ? 'Search subcategories...'
                  : 'Search archives...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D8CEBF] bg-white text-xs text-[#1C1A19] placeholder:text-[#8F8880] focus:outline-none focus:border-[#1C1A19]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8F8880] hover:text-[#1C1A19]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <SkeletonCardGrid count={6} imageAspectClassName="aspect-[16/9]" />
      )}

      {/* ----------------- TAB 1: ACTIVE CATEGORIES ----------------- */}
      {!loading && activeTab === 'categories' && (
        <div className="space-y-4">
          {filteredActiveCategories.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#D8CEBF] space-y-3">
              <Folder className="w-8 h-8 mx-auto text-[#8F8880]" />
              <p className="text-sm font-medium text-[#1C1A19]">No categories found</p>
              <p className="text-xs text-[#736B63] max-w-sm mx-auto">
                {searchQuery
                  ? 'No categories match your search criteria. Try a different query.'
                  : 'There are no active categories created yet. Click "Add Category" to create your first one.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleOpenCreateCategory}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Category</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredActiveCategories.map((cat) => {
                const subCount = subcategoryCounts.get(cat.id) || 0;
                const assignedSubcategories = activeSubcategories.filter((s) => s.category_id === cat.id);

                return (
                  <div
                    key={cat.id}
                    className="p-5 rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4 flex flex-col justify-between hover:border-[#D8CEBF] transition-all"
                  >
                    <div className="space-y-3">
                      {/* Image Thumbnail with Fallback */}
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#EFEBE3] border border-[#EAE4DC]">
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8F8880] space-y-1">
                            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                            <span className="text-[10px] uppercase tracking-wider">No Image Set</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-medium text-[#1C1A19]">{cat.name}</h4>
                          <span className="text-[11px] font-medium text-[#B85D38] bg-[#F5EBE6] px-2 py-0.5 rounded-full">
                            {subCount} {subCount === 1 ? 'subcategory' : 'subcategories'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8F8880]">
                          Created: {new Date(cat.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Subcategories tags preview */}
                      {assignedSubcategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {assignedSubcategories.slice(0, 4).map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EAE4DC] text-[#524B45] text-[10px]"
                            >
                              {s.name}
                            </span>
                          ))}
                          {assignedSubcategories.length > 4 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-[#736B63]">
                              +{assignedSubcategories.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#8F8880] italic pt-1">
                          No subcategories assigned yet.
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#EAE4DC] flex justify-between items-center text-xs">
                      <button
                        onClick={() => handleOpenCreateSubcategory(cat.id)}
                        className="text-[#524B45] hover:text-[#1C1A19] inline-flex items-center gap-1 font-medium text-[11px]"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Sub</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1.5 text-[#524B45] hover:text-[#1C1A19] hover:bg-[#EFEBE3] rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({
                              type: 'category',
                              mode: 'soft',
                              id: cat.id,
                              name: cat.name,
                              subcategoriesCount: subCount,
                            })
                          }
                          className="p-1.5 text-[#B85D38] hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Archive Category"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({
                              type: 'category',
                              mode: 'hard',
                              id: cat.id,
                              name: cat.name,
                              hasSubcategories: (allSubcategoryCounts.get(cat.id) || 0) > 0,
                              subcategoriesCount: allSubcategoryCounts.get(cat.id) || 0,
                            })
                          }
                          className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Permanently Delete"
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
        </div>
      )}

      {/* ----------------- TAB 2: ACTIVE SUBCATEGORIES ----------------- */}
      {!loading && activeTab === 'subcategories' && (
        <div className="space-y-4">
          {filteredActiveSubcategories.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#D8CEBF] space-y-3">
              <Layers className="w-8 h-8 mx-auto text-[#8F8880]" />
              <p className="text-sm font-medium text-[#1C1A19]">No subcategories found</p>
              <p className="text-xs text-[#736B63] max-w-sm mx-auto">
                {searchQuery || selectedParentFilter !== 'all'
                  ? 'No subcategories match your current search/filter.'
                  : 'There are no active subcategories yet. Click "Add Subcategory" to create one.'}
              </p>
              <button
                onClick={() => handleOpenCreateSubcategory()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Subcategory</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredActiveSubcategories.map((sub) => {
                const parentCat = categoryMap.get(sub.category_id);

                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4 flex flex-col justify-between hover:border-[#D8CEBF] transition-all"
                  >
                    <div className="space-y-3">
                      {/* Thumbnail with Fallback */}
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#EFEBE3] border border-[#EAE4DC]">
                        {sub.image ? (
                          <Image
                            src={sub.image}
                            alt={sub.name}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8F8880] space-y-1">
                            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                            <span className="text-[10px] uppercase tracking-wider">No Image Set</span>
                          </div>
                        )}
                      </div>

                      {/* Subcategory Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-base font-medium text-[#1C1A19] truncate">{sub.name}</h4>
                          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#EFEBE3] text-[#1C1A19] text-[10px] font-medium">
                            {parentCat?.name || `Cat #${sub.category_id}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8F8880]">
                          Updated: {new Date(sub.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#EAE4DC] flex justify-between items-center text-xs">
                      <span className="text-[11px] font-mono text-[#736B63]">
                        category_id: {sub.category_id}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditSubcategory(sub)}
                          className="p-1.5 text-[#524B45] hover:text-[#1C1A19] hover:bg-[#EFEBE3] rounded-lg transition-colors"
                          title="Edit Subcategory"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({
                              type: 'subcategory',
                              mode: 'soft',
                              id: sub.id,
                              name: sub.name,
                            })
                          }
                          className="p-1.5 text-[#B85D38] hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Archive Subcategory"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({
                              type: 'subcategory',
                              mode: 'hard',
                              id: sub.id,
                              name: sub.name,
                            })
                          }
                          className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Permanently Delete"
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
        </div>
      )}

      {/* ----------------- TAB 3: DELETED ARCHIVES ----------------- */}
      {!loading && activeTab === 'deleted' && (
        <div className="space-y-6">
          {/* Sub-selector for Archives */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setDeletedViewMode('categories')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
                deletedViewMode === 'categories'
                  ? 'bg-[#1C1A19] text-white'
                  : 'bg-white border border-[#D8CEBF] text-[#736B63]'
              }`}
            >
              Deleted Categories ({deletedCategories.length})
            </button>
            <button
              onClick={() => setDeletedViewMode('subcategories')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
                deletedViewMode === 'subcategories'
                  ? 'bg-[#1C1A19] text-white'
                  : 'bg-white border border-[#D8CEBF] text-[#736B63]'
              }`}
            >
              Deleted Subcategories ({deletedSubcategories.length})
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium">Archive Restoration & Soft Deletion Info</p>
              <p className="text-[#87502B] leading-relaxed">
                Items in this archive are hidden from active catalog views. You can restore an item back to
                active status, or permanently remove it with a hard delete. Note: A subcategory cannot be restored
                if its parent category remains deleted.
              </p>
            </div>
          </div>

          {deletedViewMode === 'categories' ? (
            filteredDeletedCategories.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#D8CEBF] space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <p className="text-sm font-medium text-[#1C1A19]">No deleted categories</p>
                <p className="text-xs text-[#736B63]">All categories in the database are currently active.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDeletedCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3 opacity-80">
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#EFEBE3] grayscale">
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#8F8880]">
                            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-rose-700 text-white text-[10px] font-medium tracking-wide uppercase">
                          Soft Deleted
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-medium text-[#1C1A19]">{cat.name}</h4>
                        <p className="text-[11px] text-[#8F8880]">Category ID: {cat.id}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EAE4DC] flex justify-between items-center text-xs">
                      <button
                        onClick={() => handleRestoreCategory(cat)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore Category</span>
                      </button>

                      <button
                        onClick={() =>
                          setItemToDelete({
                            type: 'category',
                            mode: 'hard',
                            id: cat.id,
                            name: cat.name,
                            hasSubcategories: (allSubcategoryCounts.get(cat.id) || 0) > 0,
                            subcategoriesCount: allSubcategoryCounts.get(cat.id) || 0,
                          })
                        }
                        className="p-1.5 text-rose-600 hover:text-rose-900 rounded-lg"
                          title="Permanently Delete"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredDeletedSubcategories.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#D8CEBF] space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
              <p className="text-sm font-medium text-[#1C1A19]">No deleted subcategories</p>
              <p className="text-xs text-[#736B63]">All subcategories are currently active.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDeletedSubcategories.map((sub) => {
                const parentCat = categoryMap.get(sub.category_id);
                const isParentDeleted = Boolean(deletedCategories.some((c) => c.id === sub.category_id));

                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3 opacity-80">
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#EFEBE3] grayscale">
                        {sub.image ? (
                          <Image
                            src={sub.image}
                            alt={sub.name}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#8F8880]">
                            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-rose-700 text-white text-[10px] font-medium tracking-wide uppercase">
                          Soft Deleted
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-medium text-[#1C1A19]">{sub.name}</h4>
                          <span className="text-[10px] text-[#736B63] bg-[#EFEBE3] px-2 py-0.5 rounded-full">
                            {parentCat?.name || `Cat #${sub.category_id}`}
                          </span>
                        </div>
                        {isParentDeleted && (
                          <p className="text-[10px] text-amber-700 font-medium">
                            Warning: Parent category is also deleted
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EAE4DC] flex justify-between items-center text-xs">
                      <button
                        onClick={() => handleRestoreSubcategory(sub)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore Sub</span>
                      </button>

                      <button
                        onClick={() =>
                          setItemToDelete({
                            type: 'subcategory',
                            mode: 'hard',
                            id: sub.id,
                            name: sub.name,
                          })
                        }
                        className="p-1.5 text-rose-600 hover:text-rose-900 rounded-lg"
                        title="Permanently Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: CREATE / EDIT CATEGORY */}
      {/* ========================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 my-8 border border-[#EAE4DC] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE4DC]">
              <h3 className="text-base font-medium text-[#1C1A19]">
                {categoryFormMode === 'create' ? 'Add New Category' : 'Edit Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#8F8880] hover:text-[#1C1A19]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block text-[#1C1A19] font-medium mb-1">
                  Category Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tables, Chairs & Loungers..."
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className={`w-full p-2.5 rounded-lg border ${
                    categoryFormErrors['name'] ? 'border-rose-500 bg-rose-50/40' : 'border-[#D8CEBF]'
                  } text-[#1C1A19] focus:outline-none focus:border-[#1C1A19]`}
                />
                {categoryFormErrors['name'] && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {categoryFormErrors['name'].join(' ')}
                  </p>
                )}
              </div>

              {/* Image upload with preview */}
              <div>
                <CloudinaryImageField
                  label="Cover Image"
                  value={categoryFormData.image || ''}
                  folder="tocco/categories"
                  onChange={(image) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      image,
                      public_id: image ? categoryFormData.public_id : '',
                    })
                  }
                  onUploadResult={(result) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      image: result.secure_url || result.url,
                      public_id: result.public_id,
                    })
                  }
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-[#EAE4DC] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63] hover:text-[#1C1A19]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D] transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: CREATE / EDIT SUBCATEGORY */}
      {/* ========================================== */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 my-8 border border-[#EAE4DC] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE4DC]">
              <h3 className="text-base font-medium text-[#1C1A19]">
                {subcategoryFormMode === 'create' ? 'Add New Subcategory' : 'Edit Subcategory'}
              </h3>
              <button
                onClick={() => setIsSubcategoryModalOpen(false)}
                className="text-[#8F8880] hover:text-[#1C1A19]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSubcategory} className="space-y-4 text-xs">
              {/* Parent Category Selection */}
              <div>
                <label className="block text-[#1C1A19] font-medium mb-1">
                  Parent Category <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={subcategoryFormData.category_id}
                  onChange={(e) =>
                    setSubcategoryFormData({
                      ...subcategoryFormData,
                      category_id: Number(e.target.value),
                    })
                  }
                  className={`w-full p-2.5 rounded-lg border ${
                    subcategoryFormErrors['category_id']
                      ? 'border-rose-500 bg-rose-50/40'
                      : 'border-[#D8CEBF]'
                  } text-[#1C1A19] focus:outline-none focus:border-[#1C1A19]`}
                >
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (ID: {cat.id})
                    </option>
                  ))}
                </select>
                {subcategoryFormErrors['category_id'] && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {subcategoryFormErrors['category_id'].join(' ')}
                  </p>
                )}
              </div>

              {/* Subcategory Name */}
              <div>
                <label className="block text-[#1C1A19] font-medium mb-1">
                  Subcategory Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dining Tables, Monolithic Pedestals..."
                  value={subcategoryFormData.name}
                  onChange={(e) =>
                    setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })
                  }
                  className={`w-full p-2.5 rounded-lg border ${
                    subcategoryFormErrors['name'] ? 'border-rose-500 bg-rose-50/40' : 'border-[#D8CEBF]'
                  } text-[#1C1A19] focus:outline-none focus:border-[#1C1A19]`}
                />
                {subcategoryFormErrors['name'] && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {subcategoryFormErrors['name'].join(' ')}
                  </p>
                )}
              </div>

              {/* Image upload with preview */}
              <div>
                <CloudinaryImageField
                  label="Image"
                  value={subcategoryFormData.image || ''}
                  folder="tocco/subcategories"
                  onChange={(image) =>
                    setSubcategoryFormData({
                      ...subcategoryFormData,
                      image,
                      public_id: image ? subcategoryFormData.public_id : '',
                    })
                  }
                  onUploadResult={(result) =>
                    setSubcategoryFormData({
                      ...subcategoryFormData,
                      image: result.secure_url || result.url,
                      public_id: result.public_id,
                    })
                  }
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-[#EAE4DC] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSubcategoryModalOpen(false)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63] hover:text-[#1C1A19]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D] transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: DELETE CONFIRMATION */}
      {/* ========================================== */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title={itemToDelete?.mode === 'hard' ? `Delete Permanently: "${itemToDelete.name}"` : `Archive: "${itemToDelete?.name || ''}"`}
        description={itemToDelete?.mode === 'hard'
          ? `This will permanently delete the ${itemToDelete?.type || 'item'} and cannot be undone.`
          : `This will hide the ${itemToDelete?.type || 'item'} from the live catalogue. You can restore it later from Deleted Archives.`}
        confirmLabel={itemToDelete?.mode === 'hard' ? 'Delete Permanently' : 'Archive'}
        variant={itemToDelete?.mode === 'hard' ? 'danger' : 'warning'}
        icon={itemToDelete?.mode === 'hard' ? 'delete' : 'archive'}
        confirmDisabled={Boolean(itemToDelete?.type === 'category' && itemToDelete.mode === 'hard' && itemToDelete.hasSubcategories)}
        isLoading={actionLoading}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      >
        {itemToDelete?.mode === 'hard' && itemToDelete.type === 'category' && itemToDelete.hasSubcategories && (
          <div className="space-y-2 text-rose-900 bg-rose-50 p-3.5 rounded-xl border border-rose-200">
            <p className="font-semibold text-rose-950">Cannot delete this category yet.</p>
            <p>
              It still contains {itemToDelete.subcategoriesCount || 'one or more'} subcategories. Delete or reassign them first.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
