'use client';

import React, { useState, useMemo } from 'react';
import { Category } from '@/types';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
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
      setFormError('Category title is required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await onSaveCategory(editingCategory);
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save category');
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
            Categories & Collections
          </h1>
          <p className="text-xs text-[#8C7A6B]">
            Manage storefront collection groups, thumbnails, and display ordering.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#241710] text-white hover:bg-[#3D281C] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute top-3 start-3 text-[#8C7A6B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#A89A8E] focus:outline-none focus:border-[#241710]"
          />
        </div>

        <span className="text-xs text-[#8C7A6B]">
          Total: <strong className="text-[#241710]">{categories.length}</strong> categories
        </span>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const productCount = productCountsByCategory[cat.id] || 0;

          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-[#EAE3D8] bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Category Cover */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#FAF8F5]">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute top-2 start-2 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cat.isVisible !== false
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-stone-500/90 text-white'
                    }`}
                  >
                    {cat.isVisible !== false ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <div className="absolute bottom-2 start-3 text-white">
                  <h3 className="font-bold text-sm leading-tight drop-shadow-sm">{cat.name}</h3>
                  <p className="text-[10px] text-white/80 font-mono mt-0.5">{cat.slug}</p>
                </div>
              </div>

              {/* Category Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-[#5C4A3E] line-clamp-2">
                  {cat.description || 'No description provided.'}
                </p>

                <div className="pt-2 border-t border-[#F5EFE6] flex items-center justify-between text-xs">
                  <span className="text-[#8C7A6B]">
                    Pieces: <strong className="text-[#241710]">{productCount}</strong> products
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg text-[#241710] hover:bg-[#F5EFE6] transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        onRequestDeleteConfirm(
                          `Delete Category: "${cat.name}"`,
                          'Are you sure you want to delete this category? Products assigned to it will remain in inventory.',
                          () => onDeleteCategory(cat.id)
                        )
                      }
                      className="p-1.5 rounded-lg text-[#9E4A2B] hover:bg-rose-50 transition-colors"
                      title="Delete Category"
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

      {/* ================= ADD / EDIT CATEGORY MODAL ================= */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#EAE3D8]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D8]">
              <h3 className="text-base font-bold text-[#241710]">
                {editingCategory.id.startsWith('cat-') ? 'Add Category' : 'Edit Category'}
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

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. سجاد تركي فاخر"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">Slug / Identifier</label>
                <input
                  type="text"
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  placeholder="e.g. turkish-luxury"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
                />
              </div>

              <div className="space-y-1">
                <CloudinaryImageField
                  label="Category Cover Image"
                  value={editingCategory.image}
                  onChange={(url) => setEditingCategory({ ...editingCategory, image: url })}
                  folder="alamelsgad-categories"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#241710]">
                  <input
                    type="checkbox"
                    checked={editingCategory.isVisible !== false}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isVisible: e.target.checked })}
                    className="rounded text-[#241710]"
                  />
                  <span>Active & Visible in Storefront</span>
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
                  {isSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
