'use client';

import React, { useState, useMemo } from 'react';
import { Product, Category, ProductColor } from '@/types';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Eye,
  Star,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Ruler,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import CloudinaryImageUploader from '@/components/CloudinaryImageUploader';

interface ProductsSectionProps {
  products: Product[];
  categories: Category[];
  depositPercentage: number;
  onSaveProduct: (product: Product) => Promise<void> | void;
  onDeleteProduct: (productId: string) => Promise<void> | void;
  onToggleFeatured: (productId: string) => void;
  onRequestDeleteConfirm: (title: string, message: string, onConfirm: () => void | Promise<void>) => void;
  editingProduct: Product | null;
  setEditingProduct: (p: Product | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const ALLOWED_ARWAL_WIDTHS = [60, 80, 100, 120] as const;

export default function ProductsSection({
  products,
  categories,
  depositPercentage,
  onSaveProduct,
  onDeleteProduct,
  onToggleFeatured,
  onRequestDeleteConfirm,
  editingProduct,
  setEditingProduct,
  isModalOpen,
  setIsModalOpen,
}: ProductsSectionProps) {
  // Filters, Search, Sort & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'NORMAL' | 'ARWAL'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View Details Modal state
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.material.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      const matchesType =
        selectedType === 'ALL' ||
        (selectedType === 'ARWAL' && p.isArawal) ||
        (selectedType === 'NORMAL' && !p.isArawal);

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [products, searchQuery, selectedCategory, selectedType]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'PRICE_DESC') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [filteredProducts, sortBy]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      slug: `product-${Date.now()}`,
      name: '',
      categoryId: categories[0]?.id || '',
      subcategoryIds: [],
      description: '',
      price: 2500,
      originalPrice: undefined,
      discountPercentage: undefined,
      images: [
        'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85',
      ],
      dimensions: '200x300 سم',
      material: 'صوف تركي فاخر ومقاوم للبقع',
      finishes: ['MATTE'],
      colors: [{ id: 'col-1', name: 'بيج وكريمي', hex: '#EBE3D5' }],
      sizes: [],
      faq: [],
      leadTime: 'شحن سريع لجميع المحافظات',
      shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
      isFeatured: false,
      isPublished: true,
      inStock: true,
      allowsCustomization: false,
      isArawal: false,
      arawalUnitPricePerMeter: undefined,
      availableWidths: undefined,
      createdAt: new Date().toISOString(),
    };
    setEditingProduct(newProduct);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsModalOpen(true);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      setFormError('Product name is required.');
      return;
    }

    if (editingProduct.isArawal) {
      if (!editingProduct.arawalUnitPricePerMeter || editingProduct.arawalUnitPricePerMeter <= 0) {
        setFormError('Please set a valid price per unit of length (per meter) for the Arwal product.');
        return;
      }
      if (!editingProduct.availableWidths || editingProduct.availableWidths.length === 0) {
        setFormError('Please select at least one allowed width (60, 80, 100, or 120 cm).');
        return;
      }
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await onSaveProduct(editingProduct);
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  // Image Management Handlers
  const handleAddImageUrl = (url: string) => {
    if (!editingProduct || !url.trim()) return;
    setEditingProduct({
      ...editingProduct,
      images: [...editingProduct.images, url.trim()],
    });
  };

  const [manualImageUrl, setManualImageUrl] = useState('');

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#241710] tracking-tight">
            Products & Catalogue Management
          </h1>
          <p className="text-xs text-[#8C7A6B]">
            Configure normal carpets and customized Arwal rolls (عروض 60، 80، 100، 120 سم).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#241710] text-white hover:bg-[#3D281C] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute top-3 start-3 text-[#8C7A6B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, weave, material..."
              className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#A89A8E] focus:outline-none focus:border-[#241710]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
            >
              <option value="ALL">All Product Types</option>
              <option value="NORMAL">Normal Carpets & Rugs</option>
              <option value="ARWAL">Arwal Rolls (بالطول والمتر)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
            >
              <option value="NEWEST">Sort: Newest First</option>
              <option value="PRICE_ASC">Sort: Price (Low to High)</option>
              <option value="PRICE_DESC">Sort: Price (High to Low)</option>
              <option value="NAME">Sort: Product Name</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-[11px] text-[#8C7A6B] pt-1">
          <span>
            Showing <strong className="text-[#241710]">{paginatedProducts.length}</strong> of{' '}
            <strong className="text-[#241710]">{filteredProducts.length}</strong> products
          </span>

          {(searchQuery || selectedCategory !== 'ALL' || selectedType !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedType('ALL');
                setCurrentPage(1);
              }}
              className="text-[#A27B5C] font-semibold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table (Responsive with Mobile-card fallback) */}
      <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs overflow-hidden">
        {paginatedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Package className="w-10 h-10 text-[#D5C6B5] mx-auto" />
            <p className="text-sm font-semibold text-[#241710]">No products found</p>
            <p className="text-xs text-[#8C7A6B]">Try adjusting your search criteria or add a new piece.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4 text-start">Product</th>
                  <th className="py-3 px-3 text-start">Category</th>
                  <th className="py-3 px-3 text-start">Type & Widths</th>
                  <th className="py-3 px-3 text-start">Price / Meter</th>
                  <th className="py-3 px-3 text-start">Featured</th>
                  <th className="py-3 px-3 text-start">Stock</th>
                  <th className="py-3 px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {paginatedProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-[#EFEBE3] overflow-hidden shrink-0 border border-[#EAE3D8]">
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <p className="font-bold text-[#241710] truncate">{p.name}</p>
                            <p className="text-[10px] text-[#8C7A6B] truncate font-mono">{p.dimensions || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-[#5C4A3E]">
                        {cat?.name || '—'}
                      </td>

                      {/* Product Type & Allowed Widths */}
                      <td className="py-3 px-3">
                        {p.isArawal ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                              Arwal Roll
                            </span>
                            <p className="text-[10px] text-[#8C7A6B]">
                              Widths: {p.availableWidths?.join(', ') || '60, 80, 100, 120'} cm
                            </p>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                            Normal Carpet
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#241710]">
                          {p.price?.toLocaleString()} EGP
                          {p.isArawal && <span className="text-[10px] text-[#8C7A6B] font-normal"> / m</span>}
                        </p>
                        <p className="text-[10px] text-[#8C7A6B]">
                          Deposit: {Math.round(((p.price || 0) * depositPercentage) / 100).toLocaleString()} EGP
                        </p>
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onToggleFeatured(p.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.isFeatured
                              ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                              : 'text-[#D5C6B5] hover:text-[#8C7A6B]'
                          }`}
                          title="Toggle featured showcase"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>

                      {/* Stock Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.inStock
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 rounded-lg text-[#5C4A3E] hover:bg-[#F5EFE6] transition-colors"
                            title="View product details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-[#241710] hover:bg-[#F5EFE6] transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              onRequestDeleteConfirm(
                                `Delete Product: "${p.name}"`,
                                'Are you sure you want to delete this piece? It will be removed from customer catalogue archive.',
                                () => onDeleteProduct(p.id)
                              )
                            }
                            className="p-1.5 rounded-lg text-[#9E4A2B] hover:bg-rose-50 transition-colors"
                            title="Delete product"
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#EAE3D8] flex items-center justify-between">
            <span className="text-xs text-[#8C7A6B]">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-[#EAE3D8] bg-white text-xs font-semibold text-[#5C4A3E] hover:bg-[#F5EFE6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-[#EAE3D8] bg-white text-xs font-semibold text-[#5C4A3E] hover:bg-[#F5EFE6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT PRODUCT MODAL ================= */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 p-5 sm:p-7 space-y-6 shadow-2xl border border-[#EAE3D8] max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D8]">
              <div>
                <h3 className="text-lg font-bold text-[#241710]">
                  {editingProduct.id.startsWith('prod-') ? 'Add New Product' : 'Edit Product'}
                </h3>
                <p className="text-xs text-[#8C7A6B]">
                  Fill in standard product fields or configure special Arwal parameters.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8C7A6B] hover:bg-[#F5EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProductForm} className="space-y-6">
              {/* Product Type Selector: Normal vs Arwal (CORE REQUIREMENT) */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-3">
                <label className="block text-xs uppercase tracking-wider font-bold text-[#241710]">
                  Product Type & Sizing Behavior *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      !editingProduct.isArawal
                        ? 'bg-white border-[#241710] shadow-xs ring-1 ring-[#241710]'
                        : 'bg-white/60 border-[#EAE3D8] hover:border-[#D5C6B5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="productType"
                      checked={!editingProduct.isArawal}
                      onChange={() =>
                        setEditingProduct({
                          ...editingProduct,
                          isArawal: false,
                          availableWidths: undefined,
                          arawalUnitPricePerMeter: undefined,
                        })
                      }
                      className="mt-0.5 text-[#241710]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#241710]">Normal Carpet / Rug</p>
                      <p className="text-[11px] text-[#8C7A6B] mt-0.5">
                        Fixed dimensions piece (e.g. 200x300 cm, 160x220 cm) with standard piece pricing.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      editingProduct.isArawal
                        ? 'bg-amber-50/80 border-amber-500 shadow-xs ring-1 ring-amber-500'
                        : 'bg-white/60 border-[#EAE3D8] hover:border-[#D5C6B5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="productType"
                      checked={Boolean(editingProduct.isArawal)}
                      onChange={() =>
                        setEditingProduct({
                          ...editingProduct,
                          isArawal: true,
                          availableWidths: [60, 80, 100, 120],
                          arawalUnitPricePerMeter: editingProduct.arawalUnitPricePerMeter || editingProduct.price,
                          dimensions: 'عروض 60، 80، 100، 120 سم',
                        })
                      }
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Arwal Roll (أروال بالمتر)</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Sold by length. Allowed widths strictly limited to 60, 80, 100, and 120 cm.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Arwal Configuration Panel (ONLY when Arwal is selected) */}
                {editingProduct.isArawal && (
                  <div className="pt-3 border-t border-[#EAE3D8] space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-[#241710] mb-1">
                        Allowed Widths (اختر العروض المتاحة لهذا الرول) *
                      </label>
                      <p className="text-[11px] text-[#8C7A6B] mb-2.5">
                        Strict policy: Only 60, 80, 100, and 120 cm are permitted. Toggle which widths are enabled in stock.
                      </p>

                      <div className="flex flex-wrap gap-2.5">
                        {ALLOWED_ARWAL_WIDTHS.map((width) => {
                          const isEnabled = (editingProduct.availableWidths || []).includes(width);
                          return (
                            <button
                              type="button"
                              key={width}
                              onClick={() => {
                                const currentWidths = editingProduct.availableWidths || [];
                                const nextWidths = isEnabled
                                  ? currentWidths.filter((w) => w !== width)
                                  : [...currentWidths, width].sort((a, b) => a - b);
                                setEditingProduct({
                                  ...editingProduct,
                                  availableWidths: nextWidths,
                                  dimensions: nextWidths.map((w) => `${w} سم`).join('، '),
                                });
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                isEnabled
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : 'bg-white text-[#8C7A6B] border-[#EAE3D8] hover:border-[#D5C6B5]'
                              }`}
                            >
                              {isEnabled && <Check className="w-3.5 h-3.5" />}
                              <span>{width} cm</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#241710] mb-1">
                          Price Per Unit of Length (سعر المتر الطولي بالجنيه) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={editingProduct.arawalUnitPricePerMeter || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setEditingProduct({
                              ...editingProduct,
                              arawalUnitPricePerMeter: val,
                              price: val,
                            });
                          }}
                          placeholder="e.g. 450 EGP per meter"
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#241710] mb-1">
                          Calculated Customer Example
                        </label>
                        <p className="text-xs text-[#5C4A3E] p-2.5 rounded-xl bg-white border border-[#EAE3D8]">
                          A 3.5 meter runner will compute to:{' '}
                          <strong className="text-amber-800">
                            {((editingProduct.arawalUnitPricePerMeter || 0) * 3.5).toLocaleString()} EGP
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Fields: Name, Category, Price, Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#241710]">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. سجاد صالون كلاسيك تركي ملكي"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">Category *</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">
                    {editingProduct.isArawal ? 'Unit Price (EGP / meter)' : 'Standard Price (EGP) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingProduct.price || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        price: val,
                        arawalUnitPricePerMeter: editingProduct.isArawal ? val : undefined,
                      });
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">Dimensions *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.dimensions}
                    onChange={(e) => setEditingProduct({ ...editingProduct, dimensions: e.target.value })}
                    placeholder="e.g. 200x300 سم or عروض 60، 80، 100، 120 سم"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#241710]">Material / Weave</label>
                  <input
                    type="text"
                    value={editingProduct.material}
                    onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                    placeholder="e.g. حرير بامبو طبيعي، أصواف تركية عالية الكثافة"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#241710]">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Detailed customer specifications and fabric highlights..."
                  className="w-full text-xs p-3 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
                />
              </div>

              {/* Product Images Management (CORE REQUIREMENT) */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] space-y-4">
                <CloudinaryImageUploader
                  productId={editingProduct.id}
                  images={editingProduct.images}
                  onImagesChange={(imgs) => setEditingProduct({ ...editingProduct, images: imgs })}
                  maxImages={8}
                />

                {/* Manual Image URL Input fallback */}
                <div className="pt-2 border-t border-[#EAE3D8] space-y-2">
                  <p className="text-[11px] font-semibold text-[#8C7A6B]">
                    Or attach an image by web URL:
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="url"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="flex-1 w-full text-xs px-3 py-2 rounded-xl border border-[#EAE3D8] bg-white text-[#241710]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (manualImageUrl.trim()) {
                          handleAddImageUrl(manualImageUrl);
                          setManualImageUrl('');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-[#EAE3D8] text-xs font-semibold text-[#241710] hover:bg-[#F5EFE6]"
                    >
                      Add Image URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock and Featured Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#241710]">
                  <input
                    type="checkbox"
                    checked={editingProduct.inStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                    className="rounded text-[#241710]"
                  />
                  <span>Mark as In-Stock (متاح للتسليم والشحن الفوري)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#241710]">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>Showcase on Homepage (مميز في الصفحة الرئيسية)</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#EAE3D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE3D8] text-xs font-semibold text-[#5C4A3E] hover:bg-[#F5EFE6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#241710] text-white hover:bg-[#3D281C] text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW PRODUCT DETAILS MODAL ================= */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-[#EAE3D8]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D8]">
              <h3 className="text-base font-bold text-[#241710]">{viewingProduct.name}</h3>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-lg text-[#8C7A6B] hover:bg-[#F5EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8]">
              <Image
                src={viewingProduct.images[0]}
                alt={viewingProduct.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF8F5] space-y-0.5">
                <span className="text-[10px] text-[#8C7A6B]">Price</span>
                <p className="font-bold text-[#241710]">
                  {viewingProduct.price?.toLocaleString()} EGP
                  {viewingProduct.isArawal && ' / meter'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] space-y-0.5">
                <span className="text-[10px] text-[#8C7A6B]">Type</span>
                <p className="font-bold text-[#241710]">
                  {viewingProduct.isArawal ? 'Arwal Roll (أروال بالمتر)' : 'Standard Carpet'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] space-y-0.5">
                <span className="text-[10px] text-[#8C7A6B]">Dimensions</span>
                <p className="font-bold text-[#241710]">{viewingProduct.dimensions}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] space-y-0.5">
                <span className="text-[10px] text-[#8C7A6B]">Material</span>
                <p className="font-bold text-[#241710]">{viewingProduct.material || 'Standard weave'}</p>
              </div>
            </div>

            <p className="text-xs text-[#5C4A3E] leading-relaxed p-3 rounded-xl bg-[#FAF8F5]">
              {viewingProduct.description || 'No description provided.'}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE3D8]">
              <button
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  handleOpenEdit(p);
                }}
                className="px-4 py-2 rounded-xl bg-[#241710] text-white text-xs font-semibold"
              >
                Edit Piece
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
