'use client';

import React, { useState, useMemo } from 'react';
import { Product, Category, ProductColor } from '@/types';
import { BackendSubcategory } from '@/types/category';
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
  Ruler,
  AlertCircle,
  FolderTree,
  Layers,
  Sparkles,
  UploadCloud,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import { uploadDirectToCloudinary } from '@/lib/api/cloudinary';

interface ProductsSectionProps {
  products: Product[];
  categories: Category[];
  subcategories?: BackendSubcategory[];
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
  subcategories = [],
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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'NORMAL' | 'ARWAL'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View Details Modal state
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Manual Image URL input state
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Color management inputs
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#241710');

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'ALL' || String(p.categoryId) === String(selectedCategory);

      const matchesSubcategory =
        selectedSubcategory === 'ALL' ||
        (Array.isArray(p.subcategoryIds) && p.subcategoryIds.some((sId) => String(sId) === String(selectedSubcategory)));

      const matchesType =
        selectedType === 'ALL' ||
        (selectedType === 'ARWAL' && p.isArawal) ||
        (selectedType === 'NORMAL' && !p.isArawal);

      return matchesSearch && matchesCategory && matchesSubcategory && matchesType;
    });
  }, [products, searchQuery, selectedCategory, selectedSubcategory, selectedType]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'PRICE_DESC') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'NAME') return a.name.localeCompare(b.name, 'ar');
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [filteredProducts, sortBy]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    const firstCat = categories[0]?.id || 'cat-turkish';
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      slug: `product-${Date.now()}`,
      name: '',
      categoryId: firstCat,
      subcategoryIds: [],
      description: '',
      price: 3500,
      originalPrice: undefined,
      discountPercentage: undefined,
      images: [
        'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85',
      ],
      dimensions: '200x300 سم',
      material: 'صوف تركي فاخر فائق النعومة ومقاوم للبقع',
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
    setManualImageUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setManualImageUrl('');
    setIsModalOpen(true);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      setFormError('اسم المنتج مطلوب.');
      return;
    }

    if (editingProduct.isArawal) {
      if (!editingProduct.arawalUnitPricePerMeter || editingProduct.arawalUnitPricePerMeter <= 0) {
        setFormError('يرجى تحديد سعر المتر الطولي لمنتج الأروال.');
        return;
      }
      if (!editingProduct.availableWidths || editingProduct.availableWidths.length === 0) {
        setFormError('يرجى تفعيل عرض واحد على الأقل للأروال (60 أو 80 أو 100 أو 120 سم).');
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
      setFormError(err?.message || 'تعذر حفظ المنتج');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImageUrl = (url: string) => {
    if (!editingProduct || !url.trim()) return;
    const cleanUrl = url.trim();
    const newDraft = {
      image: cleanUrl,
      is_primary: editingProduct.images.length === 0,
      sort_order: editingProduct.images.length,
    };
    setEditingProduct({
      ...editingProduct,
      images: [...editingProduct.images, cleanUrl],
      imageRecords: [...(editingProduct.imageRecords || []), newDraft],
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    if (!editingProduct) return;
    const images = [...editingProduct.images];
    const [selected] = images.splice(index, 1);
    images.unshift(selected);

    let imageRecords = editingProduct.imageRecords ? [...editingProduct.imageRecords] : [];
    if (imageRecords.length === editingProduct.images.length) {
      const [selectedRecord] = imageRecords.splice(index, 1);
      imageRecords.unshift(selectedRecord);
      imageRecords = imageRecords.map((rec, idx) => ({
        ...rec,
        is_primary: idx === 0,
        sort_order: idx,
      }));
    }

    setEditingProduct({ ...editingProduct, images, imageRecords });
  };

  const handleRemoveImage = (index: number) => {
    if (!editingProduct) return;
    const images = editingProduct.images.filter((_, i) => i !== index);
    let imageRecords = editingProduct.imageRecords
      ? editingProduct.imageRecords.filter((_, i) => i !== index)
      : undefined;
    if (imageRecords) {
      imageRecords = imageRecords.map((rec, idx) => ({
        ...rec,
        is_primary: idx === 0,
        sort_order: idx,
      }));
    }
    setEditingProduct({ ...editingProduct, images, imageRecords });
  };

  const handleImageFileUpload = async (files: FileList | File[]) => {
    if (!editingProduct) return;
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    if (editingProduct.images.length + fileArray.length > 8) {
      setFormError('الحد الأقصى لعدد صور المنتج هو 8 صور.');
      return;
    }

    setIsImageUploading(true);
    setImageUploadProgress(0);
    setFormError(null);

    try {
      const uploadedUrls: string[] = [];
      const newDrafts: { image: string; public_id: string; is_primary: boolean; sort_order: number }[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        try {
          const res = await uploadDirectToCloudinary(file, {
            folder: 'alamelsgad-products',
            onProgress: (p) => setImageUploadProgress(Math.round(((i + p / 100) / fileArray.length) * 100)),
          });
          const url = res.secure_url || res.url;
          uploadedUrls.push(url);
          newDrafts.push({
            image: url,
            public_id: res.public_id,
            is_primary: editingProduct.images.length === 0 && i === 0,
            sort_order: editingProduct.images.length + i,
          });
        } catch (uploadError: any) {
          const msg = uploadError?.message || 'فشل رفع الصورة إلى Cloudinary.';
          setFormError(msg);
          break;
        }
      }

      if (uploadedUrls.length > 0) {
        setEditingProduct({
          ...editingProduct,
          images: [...editingProduct.images, ...uploadedUrls],
          imageRecords: [...(editingProduct.imageRecords || []), ...newDrafts],
        });
      }
    } finally {
      setIsImageUploading(false);
      setImageUploadProgress(0);
    }
  };

  const handleAddColor = () => {
    if (!editingProduct || !newColorName.trim()) return;
    const newCol: ProductColor = {
      id: `col-${Date.now()}`,
      name: newColorName.trim(),
      hex: newColorHex,
    };
    setEditingProduct({
      ...editingProduct,
      colors: [...(editingProduct.colors || []), newCol],
    });
    setNewColorName('');
  };

  const handleRemoveColor = (id: string) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      colors: (editingProduct.colors || []).filter((c) => c.id !== id),
    });
  };

  // Subcategories belonging to currently selected category in modal
  const modalAvailableSubcategories = useMemo(() => {
    if (!editingProduct) return [];
    return subcategories.filter(
      (sub) =>
        String(sub.category_id) === String(editingProduct.categoryId) ||
        categories.findIndex((c) => String(c.id) === String(editingProduct.categoryId)) + 1 === Number(sub.category_id)
    );
  }, [editingProduct, subcategories, categories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
              إدارة المنتجات والأروال
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
              {products.length} منتج
            </span>
          </div>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            إدارة كتالوج السجاد، المقاسات، الألوان، وضبط تسعير رولات الأروال بالمتر.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#EED8BE]" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ابحث عن منتج بالاسم، الخامة، أو الوصف..."
              className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710] transition-colors"
            />
            <Search className="w-4 h-4 text-[#8C7A6B] absolute start-3 top-2.5 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-[#A27B5C] shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('ALL');
                setCurrentPage(1);
              }}
              className="w-full md:w-44 px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
            >
              <option value="ALL">جميع التصنيفات الرئيسية</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter (if category selected) */}
          {selectedCategory !== 'ALL' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Layers className="w-4 h-4 text-[#A27B5C] shrink-0" />
              <select
                value={selectedSubcategory}
                onChange={(e) => {
                  setSelectedSubcategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-44 px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
              >
                <option value="ALL">جميع التصنيفات الفرعية</option>
                {subcategories
                  .filter(
                    (s) =>
                      String(s.category_id) === String(selectedCategory) ||
                      categories.findIndex((c) => String(c.id) === String(selectedCategory)) + 1 === Number(s.category_id)
                  )
                  .map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full md:w-36 px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
          >
            <option value="ALL">جميع الأنواع</option>
            <option value="NORMAL">سجاد عادي</option>
            <option value="ARWAL">أروال بالمتر</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8C7A6B] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full md:w-36 px-2.5 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] font-bold text-[#241710] focus:outline-none focus:border-[#241710]"
            >
              <option value="NEWEST">الأحدث إضافة</option>
              <option value="PRICE_ASC">السعر: من الأقل</option>
              <option value="PRICE_DESC">السعر: من الأعلى</option>
              <option value="NAME">الاسم أبجدياً</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs overflow-hidden">
        {sortedProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF5EB] text-[#A27B5C] flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#241710]">لا توجد منتجات مطابقة</h3>
            <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
              لم نعثر على أي منتج يطابق معايير البحث والفلترة المحددة.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold"
            >
              إضافة منتج جديد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-right">المنتج</th>
                  <th className="py-3 px-4 text-right">التصنيف</th>
                  <th className="py-3 px-4 text-right">النوع / المقاسات</th>
                  <th className="py-3 px-4 text-right">السعر</th>
                  <th className="py-3 px-4 text-right">المخزون والتمييز</th>
                  <th className="py-3 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {paginatedProducts.map((p) => {
                  const categoryName = categories.find((c) => String(c.id) === String(p.categoryId))?.name || 'عام';
                  const primaryImg = p.images?.[0] || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&q=80';

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      {/* Product Image & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF5EB] border border-[#EAE3D8] shrink-0">
                            <Image
                              src={primaryImg}
                              alt={p.name}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {p.images.length > 1 && (
                              <span className="absolute bottom-1 end-1 bg-black/60 text-white text-[9px] px-1 rounded font-bold font-mono">
                                +{p.images.length - 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#241710] text-xs leading-snug">{p.name}</p>
                            <span className="text-[10px] text-[#8C7A6B] font-mono">
                              معرف #{p.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF5EB] text-[#241710] text-[11px] font-bold border border-[#E8DEC0]">
                          <FolderTree className="w-3 h-3 text-[#A27B5C]" />
                          <span>{categoryName}</span>
                        </span>
                      </td>

                      {/* Type & Sizing */}
                      <td className="py-3 px-4">
                        {p.isArawal ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                              <Ruler className="w-3 h-3 text-amber-700" />
                              <span>رول أروال بالمتر</span>
                            </span>
                            <p className="text-[10px] text-[#8C7A6B]">
                              عرض: {p.availableWidths?.join('، ') || '60, 80, 100, 120'} سم
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-bold text-[10px]">
                              سجاد عادي
                            </span>
                            <p className="text-[10px] text-[#8C7A6B] font-mono">{p.dimensions || '200x300 سم'}</p>
                          </div>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        {p.isArawal ? (
                          <div>
                            <span className="font-bold text-[#241710] text-xs">
                              {(p.arawalUnitPricePerMeter || p.price || 0).toLocaleString('ar-EG')} ج.م
                            </span>
                            <span className="text-[10px] text-[#8C7A6B] block">/ متر طولي</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-[#241710] text-xs">
                              {(p.price || 0).toLocaleString('ar-EG')} ج.م
                            </span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[10px] text-[#8C7A6B] line-through block font-mono">
                                {p.originalPrice.toLocaleString('ar-EG')} ج.م
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stock & Featured */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.inStock
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {p.inStock ? 'متوفر بالمخزن' : 'نفد المخزون'}
                          </span>

                          <button
                            type="button"
                            onClick={() => onToggleFeatured(p.id)}
                            className={`p-1 rounded-lg transition-colors ${
                              p.isFeatured
                                ? 'text-amber-500 bg-amber-50'
                                : 'text-stone-300 hover:text-amber-400'
                            }`}
                            title={p.isFeatured ? 'إلغاء التمييز' : 'تمييز المنتج بالصفحة الرئيسية'}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-left">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 rounded-lg text-[#5C4A3E] hover:text-[#241710] hover:bg-[#F5EFE6] transition-colors"
                            title="معاينة تفاصيل المنتج"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-[#241710] hover:bg-[#F5EFE6] transition-colors"
                            title="تعديل المنتج"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onRequestDeleteConfirm(
                                `حذف المنتج: «${p.name}»`,
                                'هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من قاعدة البيانات؟',
                                () => onDeleteProduct(p.id)
                              )
                            }
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="حذف المنتج"
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

        {/* Pagination Footer */}
        {sortedProducts.length > itemsPerPage && (
          <div className="p-4 border-t border-[#EAE3D8] flex items-center justify-between text-xs text-[#8C7A6B]">
            <span>
              عرض صفحة <strong className="text-[#241710]">{currentPage}</strong> من{' '}
              <strong className="text-[#241710]">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-xl border border-[#EAE3D8] text-xs font-bold text-[#241710] disabled:opacity-40 hover:bg-[#FAF8F5] transition-colors flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-xl border border-[#EAE3D8] text-xs font-bold text-[#241710] disabled:opacity-40 hover:bg-[#FAF8F5] transition-colors flex items-center gap-1"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal - Compact Professional Two-Column Redesign */}
      {isModalOpen && editingProduct && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EAE3D8] overflow-hidden text-right">
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAE3D8] bg-[#FAF8F5]/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-white border border-[#EAE3D8] text-[#A27B5C] shadow-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#241710] leading-none">
                    {editingProduct.name ? `تعديل: ${editingProduct.name}` : 'إضافة منتج جديد للكتالوج'}
                  </h3>
                  <span className="text-[10px] text-[#8C7A6B] font-medium mt-1 block">
                    بيانات المنتج والتسعير والتصنيفات والألوان
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#241710] hover:bg-[#F5EFE6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              id="product-form"
              onSubmit={handleSubmitProductForm}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5"
            >
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold">{formError}</span>
                </div>
              )}

              {/* Two-Column Grid on Desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                {/* Column 1: Main Info & Pricing (7 cols on lg) */}
                <div className="lg:col-span-7 space-y-3.5">
                  {/* Card 1: Primary Details */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5]/70 border border-[#EAE3D8] space-y-3">
                    <h4 className="text-xs font-black text-[#241710] flex items-center gap-1.5 pb-2 border-b border-[#EAE3D8]/70">
                      <Package className="w-3.5 h-3.5 text-[#A27B5C]" />
                      <span>بيانات المنتج الأساسية</span>
                    </h4>

                    {/* Product Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#241710]">
                        اسم المنتج <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            name: e.target.value,
                            slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                          })
                        }
                        placeholder="مثال: سجاد تبريز كلاسيك فاخر، رول ممرات تركي..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                      />
                    </div>

                    {/* Category & Subcategory Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#241710]">
                          التصنيف الرئيسي <span className="text-rose-600">*</span>
                        </label>
                        <select
                          required
                          value={editingProduct.categoryId}
                          onChange={(e) => {
                            setEditingProduct({
                              ...editingProduct,
                              categoryId: e.target.value,
                              subcategoryIds: [],
                            });
                          }}
                          className="w-full px-2.5 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
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
                          التصنيف الفرعي
                        </label>
                        <select
                          value={editingProduct.subcategoryIds?.[0] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingProduct({
                              ...editingProduct,
                              subcategoryIds: val ? [val] : [],
                            });
                          }}
                          className="w-full px-2.5 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                        >
                          <option value="">-- اختياري: اختر الفرعي --</option>
                          {modalAvailableSubcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Product Type Toggle */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[11px] font-bold text-[#8C7A6B]">
                        نوع تسعير وسلوك المنتج:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, isArawal: false })}
                          className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                            !editingProduct.isArawal
                              ? 'bg-white border-[#241710] ring-1 ring-[#241710] shadow-xs'
                              : 'bg-white/60 border-[#EAE3D8] text-[#5C4A3E] hover:bg-white'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              !editingProduct.isArawal
                                ? 'border-[#241710] bg-[#241710]'
                                : 'border-[#D8CEBF]'
                            }`}
                          >
                            {!editingProduct.isArawal && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <div>
                            <p className="font-bold text-xs text-[#241710] leading-none">سجاد عادي</p>
                            <span className="text-[10px] text-[#8C7A6B] mt-0.5 block">يباع بالقطعة بمقاس محدد</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              isArawal: true,
                              availableWidths: editingProduct.availableWidths || [60, 80, 100, 120],
                              arawalUnitPricePerMeter: editingProduct.arawalUnitPricePerMeter || editingProduct.price || 450,
                            })
                          }
                          className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                            editingProduct.isArawal
                              ? 'bg-amber-50 border-amber-600 ring-1 ring-amber-600 shadow-xs'
                              : 'bg-white/60 border-[#EAE3D8] text-[#5C4A3E] hover:bg-white'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              editingProduct.isArawal
                                ? 'border-amber-600 bg-amber-600'
                                : 'border-[#D8CEBF]'
                            }`}
                          >
                            {editingProduct.isArawal && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <div>
                            <p className="font-bold text-xs text-amber-950 leading-none">رول أروال (بالمتر)</p>
                            <span className="text-[10px] text-amber-800 mt-0.5 block">يباع بالطول حسب طلب العميل</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Conditional Pricing: Normal Carpet */}
                    {!editingProduct.isArawal && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-[#241710]">
                            السعر الحالي (ج.م) <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={editingProduct.price || ''}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                            }
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-[#241710]">
                            السعر قبل الخصم
                          </label>
                          <input
                            type="number"
                            value={editingProduct.originalPrice || ''}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                originalPrice: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            placeholder="اختياري"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-[#241710]">
                            المقاس الافتراضي
                          </label>
                          <input
                            type="text"
                            value={editingProduct.dimensions || ''}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, dimensions: e.target.value })
                            }
                            placeholder="مثال: 200x300 سم"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Conditional Pricing: Arwal Rolls */}
                    {editingProduct.isArawal && (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-amber-950">
                              سعر المتر الطولي (ج.م / متر) <span className="text-rose-600">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={editingProduct.arawalUnitPricePerMeter || ''}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  arawalUnitPricePerMeter: Number(e.target.value),
                                  price: Number(e.target.value),
                                })
                              }
                              placeholder="مثال: 450"
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-white text-[#241710] font-bold focus:outline-none focus:border-amber-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-amber-950">
                              العروض المتاحة حصرياً (سم):
                            </label>
                            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                              {ALLOWED_ARWAL_WIDTHS.map((width) => {
                                const isChecked = (editingProduct.availableWidths || []).includes(width);
                                return (
                                  <button
                                    key={width}
                                    type="button"
                                    onClick={() => {
                                      const currentWidths = editingProduct.availableWidths || [];
                                      const updated = isChecked
                                        ? currentWidths.filter((w) => w !== width)
                                        : [...currentWidths, width];
                                      setEditingProduct({
                                        ...editingProduct,
                                        availableWidths: updated,
                                      });
                                    }}
                                    className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                                      isChecked
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                        : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400'
                                    }`}
                                  >
                                    {width} سم
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Description & Specifications */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5]/70 border border-[#EAE3D8] space-y-3">
                    <h4 className="text-xs font-black text-[#241710] flex items-center gap-1.5 pb-2 border-b border-[#EAE3D8]/70">
                      <FolderTree className="w-3.5 h-3.5 text-[#A27B5C]" />
                      <span>الوصف ومواصفات التوصيل</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#241710]">
                          الخامة والنسيج
                        </label>
                        <input
                          type="text"
                          value={editingProduct.material || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, material: e.target.value })
                          }
                          placeholder="مثال: صوف تركي فاخر، مقاوم للبقع"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#241710]">
                          مدة التوصيل والشحن
                        </label>
                        <input
                          type="text"
                          value={editingProduct.shippingTime || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, shippingTime: e.target.value })
                          }
                          placeholder="مثال: توصيل خلال ٢-٤ أيام عمل"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#241710]">
                        الوصف التعريفي للمنتج
                      </label>
                      <textarea
                        rows={2}
                        value={editingProduct.description}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, description: e.target.value })
                        }
                        placeholder="نبذة عن السجادة وتنسيقها في غرف المعيشة والصالون..."
                        className="w-full text-xs p-2.5 rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Images, Colors & Toggles (5 cols on lg) */}
                <div className="lg:col-span-5 space-y-3.5">
                  {/* Card 3: Compact Product Images Manager */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5]/70 border border-[#EAE3D8] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D8]/70">
                      <h4 className="text-xs font-black text-[#241710] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#A27B5C]" />
                        <span>صور المنتج ({editingProduct.images.length}/8)</span>
                      </h4>
                      <span className="text-[10px] text-[#8C7A6B]">الصورة الأولى هي الغلاف</span>
                    </div>

                    {/* Compact Upload Bar */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageFileUpload(e.target.files)}
                        disabled={isImageUploading}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImageUploading || editingProduct.images.length >= 8}
                        className="flex-1 py-2 px-3 rounded-xl border border-dashed border-[#A27B5C] bg-white hover:bg-[#FAF5EB] text-xs font-bold text-[#241710] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {isImageUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A27B5C]" />
                            <span>جاري الرفع ({imageUploadProgress}%)...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5 text-[#A27B5C]" />
                            <span>+ إضافة صور من جهازك</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Compact Image URL input */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={manualImageUrl}
                        onChange={(e) => setManualImageUrl(e.target.value)}
                        placeholder="أو الصق رابط صورة مباشر..."
                        className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (manualImageUrl.trim()) {
                            handleAddImageUrl(manualImageUrl);
                            setManualImageUrl('');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-[#EAE3D8] text-[11px] font-bold text-[#241710] hover:bg-[#FAF8F5] shrink-0"
                      >
                        إضافة
                      </button>
                    </div>

                    {/* Image Thumbnails Grid */}
                    {editingProduct.images.length === 0 ? (
                      <div className="py-4 text-center text-xs text-[#8C7A6B] bg-white rounded-xl border border-dashed border-[#EAE3D8]">
                        لا توجد صور مرفوعة للمنتج بعد
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 pt-1 max-h-48 overflow-y-auto">
                        {editingProduct.images.map((imgUrl, idx) => {
                          const isPrimary = idx === 0;

                          return (
                            <div
                              key={`${imgUrl}-${idx}`}
                              className={`group relative aspect-square rounded-lg overflow-hidden border bg-white shadow-2xs transition-all ${
                                isPrimary
                                  ? 'border-[#241710] ring-2 ring-[#241710]/20'
                                  : 'border-[#EAE3D8] hover:border-[#A27B5C]'
                              }`}
                            >
                              <Image
                                src={imgUrl}
                                alt={`صورة ${idx + 1}`}
                                fill
                                className="object-cover"
                              />

                              {/* Primary Cover Badge */}
                              {isPrimary && (
                                <span className="absolute top-1 start-1 z-10 px-1.5 py-0.5 rounded-md bg-[#241710] text-[#FAF5EB] text-[9px] font-bold flex items-center gap-0.5 shadow-xs">
                                  <Star className="w-2 h-2 fill-current text-[#EED8BE]" />
                                  <span>الغلاف</span>
                                </span>
                              )}

                              {/* Hover Action Controls */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                                {!isPrimary && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryImage(idx)}
                                    className="p-1 rounded-md bg-white text-[#241710] hover:bg-amber-50"
                                    title="تعيين كغلاف رئيسي"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="p-1 rounded-md bg-white text-rose-600 hover:bg-rose-50"
                                  title="حذف الصورة"
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

                  {/* Card 4: Colors Management */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5]/70 border border-[#EAE3D8] space-y-2.5">
                    <h4 className="text-xs font-black text-[#241710] flex items-center gap-1.5 pb-2 border-b border-[#EAE3D8]/70">
                      <Sparkles className="w-3.5 h-3.5 text-[#A27B5C]" />
                      <span>خيارات الألوان المتاحة ({editingProduct.colors?.length || 0})</span>
                    </h4>

                    {/* Color Chips */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(editingProduct.colors || []).map((col) => (
                        <div
                          key={col.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-[#EAE3D8] text-[11px] font-bold text-[#241710] shadow-2xs"
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(col.id)}
                            className="text-[#8C7A6B] hover:text-rose-600 ms-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Color Compact Inline Row */}
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#EAE3D8]/60">
                      <input
                        type="text"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        placeholder="اسم اللون (مثال: كحلي ملكي)"
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                      />
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-[#EAE3D8] cursor-pointer shrink-0"
                      />
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="px-3 py-1.5 rounded-lg bg-[#241710] text-[#FAF5EB] text-xs font-bold shrink-0 hover:bg-[#3D291D] transition-colors"
                      >
                        + إضافة
                      </button>
                    </div>
                  </div>

                  {/* Card 5: Inventory & Featured Toggles */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5]/70 border border-[#EAE3D8] space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#241710]">
                      <input
                        type="checkbox"
                        checked={editingProduct.inStock}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, inStock: e.target.checked })
                        }
                        className="rounded text-[#241710]"
                      />
                      <span>متوفر في المخزن للبيع الفوري</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#241710]">
                      <input
                        type="checkbox"
                        checked={editingProduct.isFeatured}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                        }
                        className="rounded text-[#241710]"
                      />
                      <span>تمييز المنتج في واجهة المتجر الرئيسية</span>
                    </label>
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Actions Footer (Fixed Sticky Bar at Bottom) */}
            <div className="px-5 py-3 border-t border-[#EAE3D8] bg-white flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-[#8C7A6B] hidden sm:inline">
                {editingProduct.name ? 'تعديل المنتج الحالي بالمتجر' : 'منتج جديد سيتم نشره فور الحفظ'}
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#736B63] hover:bg-[#F5EFE6] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="product-form"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ المنتج بالكتالوج'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingProduct && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-[#EAE3D8] shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D8]">
              <h3 className="text-base font-bold text-[#241710]">{viewingProduct.name}</h3>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-stone-100 border border-[#EAE3D8]">
              <Image
                src={viewingProduct.images[0]}
                alt={viewingProduct.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F5EFE6]">
                <span className="text-[#8C7A6B]">السعر:</span>
                <span className="font-bold text-[#241710]">
                  {viewingProduct.isArawal
                    ? `${(viewingProduct.arawalUnitPricePerMeter || viewingProduct.price).toLocaleString('ar-EG')} ج.م / متر`
                    : `${viewingProduct.price.toLocaleString('ar-EG')} ج.م`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F5EFE6]">
                <span className="text-[#8C7A6B]">النوع:</span>
                <span className="font-bold text-[#241710]">
                  {viewingProduct.isArawal ? 'رول أروال بالمتر' : 'سجاد عادي'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F5EFE6]">
                <span className="text-[#8C7A6B]">الخامة:</span>
                <span className="font-bold text-[#241710]">{viewingProduct.material || 'صوف تركي فاخر'}</span>
              </div>
              <div className="py-1">
                <span className="text-[#8C7A6B] block mb-1">الوصف:</span>
                <p className="text-[#5C4A3E] leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE3D8]">
                  {viewingProduct.description || 'لا يوجد وصف.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAE3D8] flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
