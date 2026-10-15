import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Archive,
  RotateCcw,
  RefreshCw,
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
import { productService } from '@/lib/api/services/productService';
import { BackendProduct, BackendSize, BackendColor, BackendArwal } from '@/types/product';
import { normalizeApiError } from '@/lib/api/errors';

interface ProductsSectionProps {
  products: Product[];
  categories: Category[];
  subcategories?: BackendSubcategory[];
  onSaveProduct: (product: Product) => Promise<void> | void;
  onDeleteProduct: (productId: string) => Promise<void> | void;
  onHardDeleteProduct?: (productId: string) => Promise<void> | void;
  onRestoreProduct?: (productId: string) => Promise<void> | void;
  isAdmin?: boolean;
  onToggleFeatured: (productId: string) => void;
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
  editingProduct: Product | null;
  setEditingProduct: (p: Product | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const ALLOWED_ARWAL_WIDTHS = [60, 80, 100, 120] as const;

export function getProductTypeLabel(
  product: {
    isArawal?: boolean;
    subcategoryIds?: (string | number)[];
    subcategory?: { id?: number | string; name_ar?: string; name?: string; name_en?: string };
  } | null | undefined,
  subcategories: BackendSubcategory[] = []
): string {
  if (!product) return 'سجاد بالقطعة';
  if (product.isArawal) {
    return 'رول أروال بالمتر';
  }
  const subcatNameFromProduct = product.subcategory?.name_ar || product.subcategory?.name;
  if (subcatNameFromProduct) {
    return subcatNameFromProduct;
  }
  const subcatId = product.subcategoryIds?.[0] ?? product.subcategory?.id;
  if (subcatId !== undefined && subcatId !== null && subcatId !== '') {
    const matched = subcategories.find((s) => String(s.id) === String(subcatId));
    const name = matched?.name_ar || matched?.name;
    if (name) {
      return name;
    }
  }
  return 'سجاد بالقطعة';
}

export default function ProductsSection({
  products,
  categories,
  subcategories = [],
  onSaveProduct,
  onDeleteProduct,
  onHardDeleteProduct,
  onRestoreProduct,
  isAdmin = false,
  onToggleFeatured,
  onRequestDeleteConfirm,
  editingProduct,
  setEditingProduct,
  isModalOpen,
  setIsModalOpen,
}: ProductsSectionProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [archivedProducts, setArchivedProducts] = useState<BackendProduct[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [archivedError, setArchivedError] = useState<string | null>(null);

  const fetchArchivedProducts = useCallback(async () => {
    setIsLoadingArchived(true);
    setArchivedError(null);
    try {
      const [deletedProducts, deletedArwals] = await Promise.all([
        productService.getDeletedProducts().catch(() => [] as BackendProduct[]),
        productService.getDeletedArwals().catch(() => [] as BackendArwal[]),
      ]);
      const mappedDeletedArwals: BackendProduct[] = deletedArwals.map((a) => ({
        id: a.id,
        name: a.name_ar || a.name_en,
        name_ar: a.name_ar,
        name_en: a.name_en,
        price: a.price_per_length,
        deleted_at: a.deleted_at,
        images: a.images,
        isArawal: true,
      } as any));
      setArchivedProducts([...(deletedProducts || []), ...mappedDeletedArwals]);
    } catch (err: any) {
      setArchivedError(normalizeApiError(err).message);
      setArchivedProducts([]);
    } finally {
      setIsLoadingArchived(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'archived') {
      fetchArchivedProducts();
    }
  }, [activeTab, fetchArchivedProducts]);
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

  // Size management state
  const [availableSizes, setAvailableSizes] = useState<BackendSize[]>([]);
  const [isLoadingSizes, setIsLoadingSizes] = useState(false);
  const [sizeLoadError, setSizeLoadError] = useState<string | null>(null);
  const [newSizeWidth, setNewSizeWidth] = useState('');
  const [newSizeLength, setNewSizeLength] = useState('');
  const [isCreatingSize, setIsCreatingSize] = useState(false);
  const [newSizeError, setNewSizeError] = useState<string | null>(null);

  // Color management state
  const [availableColors, setAvailableColors] = useState<BackendColor[]>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(false);
  const [colorLoadError, setColorLoadError] = useState<string | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorNameAr, setNewColorNameAr] = useState('');
  const [newColorNameEn, setNewColorNameEn] = useState('');
  const [newColorHex, setNewColorHex] = useState('#241710');
  const [isCreatingColor, setIsCreatingColor] = useState(false);
  const [newColorError, setNewColorError] = useState<string | null>(null);

  // Fetch all available sizes and colors from backend
  const fetchSizesAndColors = React.useCallback(async () => {
    setIsLoadingSizes(true);
    setIsLoadingColors(true);
    setSizeLoadError(null);
    setColorLoadError(null);
    try {
      const [sizesData, colorsData] = await Promise.all([
        productService.getSizes().catch((err) => {
          console.error('Failed to load sizes:', err);
          setSizeLoadError('تعذر تحميل قائمة المقاسات من الخادم.');
          return [] as BackendSize[];
        }),
        productService.getColors().catch((err) => {
          console.error('Failed to load colors:', err);
          setColorLoadError('تعذر تحميل قائمة الألوان من الخادم.');
          return [] as BackendColor[];
        }),
      ]);
      setAvailableSizes(Array.isArray(sizesData) ? sizesData : []);
      setAvailableColors(Array.isArray(colorsData) ? colorsData : []);
    } finally {
      setIsLoadingSizes(false);
      setIsLoadingColors(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSizesAndColors();
  }, [fetchSizesAndColors]);

  React.useEffect(() => {
    if (isModalOpen) {
      fetchSizesAndColors();
    }
  }, [isModalOpen, fetchSizesAndColors]);

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
    const initialColors = availableColors.length > 0
      ? [{
          id: String(availableColors[0].id),
          name: availableColors[0].name || availableColors[0].name_ar || availableColors[0].name_en || availableColors[0].hex_code,
          hex: availableColors[0].hex_code,
        }]
      : [];

    const initialSizes = availableSizes.length > 0
      ? [{
          id: String(availableSizes[0].id),
          name: `${availableSizes[0].width} × ${availableSizes[0].length} سم`,
          dimensions: `${availableSizes[0].width} × ${availableSizes[0].length} سم`,
          priceDelta: 0,
          width: availableSizes[0].width,
          length: availableSizes[0].length,
        }]
      : [];

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      slug: `product-${Date.now()}`,
      name: '',
      name_ar: '',
      name_en: '',
      categoryId: firstCat,
      subcategoryIds: [],
      description: '',
      description_ar: '',
      description_en: '',
      price: 3500,
      originalPrice: undefined,
      discountPercentage: undefined,
      images: [
        'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85',
      ],
      dimensions: initialSizes.length > 0 ? initialSizes[0].dimensions : '200 × 300 سم',
      material: 'صوف تركي فاخر فائق النعومة ومقاوم للبقع',
      finishes: ['MATTE'],
      colors: initialColors,
      sizes: initialSizes,
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
    setFormError(null);
    setNewSizeError(null);
    setNewColorError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    const isArwal = Boolean(product.isArawal);
    setEditingProduct({
      ...product,
      isArawal: isArwal,
      name_ar: product.name_ar || product.name || '',
      name_en: product.name_en || '',
      description_ar: product.description_ar || product.description || '',
      description_en: product.description_en || '',
      sizes: isArwal ? [] : (Array.isArray(product.sizes) ? [...product.sizes] : []),
      colors: Array.isArray(product.colors) ? [...product.colors] : [],
      arawalUnitPricePerMeter: isArwal ? (product.arawalUnitPricePerMeter || product.price) : undefined,
      availableWidths: isArwal ? (product.availableWidths || [60, 80, 100, 120]) : product.availableWidths,
    });
    setManualImageUrl('');
    setFormError(null);
    setNewSizeError(null);
    setNewColorError(null);
    setIsModalOpen(true);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const nameAr = (editingProduct.name_ar || editingProduct.name || '').trim();
    const nameEn = (editingProduct.name_en || nameAr).trim();
    const descAr = (editingProduct.description_ar || editingProduct.description || '').trim();
    const descEn = (editingProduct.description_en || descAr).trim();

    if (!nameAr) {
      setFormError('اسم المنتج باللغة العربية مطلوب.');
      return;
    }

    if (!editingProduct.subcategoryIds || editingProduct.subcategoryIds.length === 0) {
      setFormError('يرجى اختيار قسم فرعي للمنتج (القسم الفرعي مطلوب في النظام).');
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
    } else {
      if (!editingProduct.sizes || editingProduct.sizes.length === 0) {
        setFormError('يرجى اختيار مقاس واحد على الأقل للمنتج (المقاسات مطلوبة لحفظ المنتج).');
        return;
      }
      if (!editingProduct.colors || editingProduct.colors.length === 0) {
        setFormError('يرجى اختيار لون واحد على الأقل للمنتج (الألوان مطلوبة لحفظ المنتج).');
        return;
      }
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await onSaveProduct({
        ...editingProduct,
        name: nameAr,
        name_ar: nameAr,
        name_en: nameEn,
        description: descAr,
        description_ar: descAr,
        description_en: descEn,
        sizes: editingProduct.isArawal ? [] : editingProduct.sizes,
        dimensions: editingProduct.isArawal
          ? (editingProduct.availableWidths ? editingProduct.availableWidths.map((w) => `${w} سم`).join('، ') : 'عرض: 60، 80، 100، 120 سم')
          : editingProduct.dimensions,
      });
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

  // Size selection and creation handlers
  const handleSelectExistingSize = (sizeIdStr: string) => {
    if (!editingProduct || !sizeIdStr) return;
    const numId = Number(sizeIdStr);
    const found = availableSizes.find((s) => s.id === numId);
    if (!found) return;
    const currentSizes = editingProduct.sizes || [];
    if (currentSizes.some((s) => String(s.id) === String(numId))) return;
    const newEntry = {
      id: String(found.id),
      name: `${found.width} × ${found.length} سم`,
      dimensions: `${found.width} × ${found.length} سم`,
      priceDelta: 0,
      width: found.width,
      length: found.length,
    };
    setEditingProduct({
      ...editingProduct,
      sizes: [...currentSizes, newEntry],
      dimensions: editingProduct.dimensions || `${found.width} × ${found.length} سم`,
    });
  };

  const handleRemoveSize = (idToRemove: string) => {
    if (!editingProduct) return;
    const remaining = (editingProduct.sizes || []).filter((s) => String(s.id) !== String(idToRemove));
    setEditingProduct({
      ...editingProduct,
      sizes: remaining,
    });
  };

  const handleCreateAndAddSize = async () => {
    if (!editingProduct) return;
    const width = Number(newSizeWidth.trim());
    const length = Number(newSizeLength.trim());
    if (!width || width <= 0 || !length || length <= 0) {
      setNewSizeError('يرجى إدخال أبعاد صحيحة بالموجب (العرض والطول).');
      return;
    }
    setNewSizeError(null);

    const existing = availableSizes.find(
      (s) => Number(s.width) === width && Number(s.length) === length
    );
    if (existing) {
      handleSelectExistingSize(String(existing.id));
      setNewSizeWidth('');
      setNewSizeLength('');
      return;
    }

    setIsCreatingSize(true);
    try {
      const created = await productService.createSize({ width, length });
      setAvailableSizes((prev) => [...prev, created]);
      const newEntry = {
        id: String(created.id),
        name: `${created.width} × ${created.length} سم`,
        dimensions: `${created.width} × ${created.length} سم`,
        priceDelta: 0,
        width: created.width,
        length: created.length,
      };
      setEditingProduct({
        ...editingProduct,
        sizes: [...(editingProduct.sizes || []), newEntry],
        dimensions: editingProduct.dimensions || `${created.width} × ${created.length} سم`,
      });
      setNewSizeWidth('');
      setNewSizeLength('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.detail ||
        err?.message ||
        'تعذر إنشاء المقاس.';
      setNewSizeError(msg);
    } finally {
      setIsCreatingSize(false);
    }
  };

  // Color selection and creation handlers
  const handleSelectExistingColor = (colorIdStr: string) => {
    if (!editingProduct || !colorIdStr) return;
    const numId = Number(colorIdStr);
    const found = availableColors.find((c) => c.id === numId);
    if (!found) return;
    const currentColors = editingProduct.colors || [];
    if (currentColors.some((c) => String(c.id) === String(numId))) return;
    const newCol: ProductColor = {
      id: String(found.id),
      name: found.name || found.name_ar || found.name_en || found.hex_code,
      hex: found.hex_code,
    };
    setEditingProduct({
      ...editingProduct,
      colors: [...currentColors, newCol],
    });
  };

  const handleRemoveColor = (id: string) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      colors: (editingProduct.colors || []).filter((c) => String(c.id) !== String(id)),
    });
  };

  const handleCreateAndAddColor = async () => {
    if (!editingProduct) return;
    let hex = (newColorHex || '').trim().toUpperCase();
    if (!hex.startsWith('#')) {
      hex = `#${hex}`;
    }
    if (!/^#[0-9A-F]{6}$/i.test(hex)) {
      setNewColorError('يرجى تحديد كود لون سداسي صحيح مكون من 6 خانات بعد علامة # (مثال: #241710).');
      return;
    }
    setNewColorError(null);

    const existing = availableColors.find((c) => c.hex_code.toUpperCase() === hex);
    if (existing) {
      handleSelectExistingColor(String(existing.id));
      setNewColorName('');
      return;
    }

    setIsCreatingColor(true);
    try {
      const nameAr = (newColorNameAr.trim() || newColorName.trim() || hex);
      const nameEn = (newColorNameEn.trim() || newColorNameAr.trim() || newColorName.trim() || hex);
      const created = await productService.createColor({
        name_ar: nameAr,
        name_en: nameEn,
        hex_code: hex,
      });
      setAvailableColors((prev) => [...prev, created]);
      const newCol: ProductColor = {
        id: String(created.id),
        name: created.name_ar || created.name || nameAr,
        name_ar: created.name_ar || nameAr,
        name_en: created.name_en || nameEn,
        hex: created.hex_code,
      };
      setEditingProduct({
        ...editingProduct,
        colors: [...(editingProduct.colors || []), newCol],
      });
      setNewColorName('');
      setNewColorNameAr('');
      setNewColorNameEn('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.hex_code?.[0] ||
        err?.response?.data?.detail ||
        err?.message ||
        'تعذر إضافة اللون.';
      setNewColorError(msg);
    } finally {
      setIsCreatingColor(false);
    }
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
          <Package className="w-4 h-4" />
          <span>المنتجات النشطة</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {products.length}
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
          <span>المنتجات المؤرشفة</span>
          {archivedProducts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-900 font-mono">
              {archivedProducts.length}
            </span>
          )}
        </button>
      </div>

      {/* ACTIVE PRODUCTS TAB */}
      {activeTab === 'active' && (
        <>
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
            <option value="NORMAL">سجاد بالقطعة</option>
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
                  const catObj = categories.find((c) => String(c.id) === String(p.categoryId));
                  const categoryName = catObj?.name_ar || catObj?.name || catObj?.name_en || 'عام';
                  const primaryImg = p.images?.[0] || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&q=80';

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      {/* Product Image & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] shrink-0 p-1 flex items-center justify-center">
                            <Image
                              src={primaryImg}
                              alt={p.name_ar || p.name || p.name_en || ''}
                              fill
                              className="object-contain"
                              referrerPolicy="no-referrer"
                            />
                            {p.images.length > 1 && (
                              <span className="absolute bottom-1 end-1 bg-black/60 text-white text-[9px] px-1 rounded font-bold font-mono">
                                +{p.images.length - 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#241710] text-xs leading-snug">
                              {p.name_ar || p.name || p.name_en}
                            </p>
                            {p.name_en && p.name_en !== (p.name_ar || p.name) && (
                              <span className="text-[10px] text-[#8C7A6B] block font-medium" dir="ltr">
                                {p.name_en}
                              </span>
                            )}
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
                              {p.availableWidths && p.availableWidths.length > 0
                                ? `عرض: ${p.availableWidths.join('، ')} سم`
                                : 'عرض: غير محدد'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-bold text-[10px]">
                              {getProductTypeLabel(p, subcategories)}
                            </span>
                            {p.dimensions ? (
                              <p className="text-[10px] text-[#8C7A6B] font-mono">{p.dimensions}</p>
                            ) : null}
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

                          {/* Archive (Soft delete) */}
                          <button
                            type="button"
                            onClick={() =>
                              onRequestDeleteConfirm(
                                `أرشفة المنتج: «${p.name}»`,
                                'هل ترغب في نقل هذا المنتج إلى الأرشيف وإخفائه من المتجر؟ ستبقى بياناته وصوره محفوظة، ويمكنك استعادته في أي وقت لاحقاً.',
                                async () => {
                                  await onDeleteProduct(p.id);
                                  if (archivedProducts.length > 0) {
                                    fetchArchivedProducts().catch(() => {});
                                  }
                                },
                                {
                                  confirmLabel: 'أرشفة ونقل للأرشيف',
                                  variant: 'warning',
                                  icon: 'archive',
                                }
                              )
                            }
                            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors"
                            title="أرشفة المنتج (إخفاء ونقل للأرشيف)"
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                          {/* Hard Delete (Admin only) */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                onRequestDeleteConfirm(
                                  `حذف نهائي للمنتج: «${p.name}»`,
                                  'تحذير: سيتم حذف هذا المنتج نهائياً من قاعدة البيانات وإزالة جميع صوره المرتبطة على السحابة (Cloudinary) بشكل دائم. لا يمكن التراجع عن هذا الإجراء.',
                                  async () => {
                                    if (onHardDeleteProduct) {
                                      await onHardDeleteProduct(p.id);
                                    } else {
                                      await productService.hardDeleteProduct(Number(p.id));
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
    </>
  )}

      {/* ARCHIVED PRODUCTS TAB */}
      {activeTab === 'archived' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                المنتجات المؤرشفة مخفية من المتجر العام وسلة المشتريات، ولكن صورها وتفاصيلها محفوظة في النظام. يمكنك استعادتها في أي وقت، أو حذفها نهائياً لتنظيف السحابة.
              </span>
            </div>
            <button
              type="button"
              onClick={fetchArchivedProducts}
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
              جاري تحميل المنتجات المؤرشفة...
            </div>
          ) : archivedProducts.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-[#EAE3D8] text-center space-y-2">
              <Archive className="w-8 h-8 text-[#8C7A6B] mx-auto opacity-40" />
              <p className="text-sm font-bold text-[#241710]">لا توجد منتجات مؤرشفة</p>
              <p className="text-xs text-[#8C7A6B]">جميع منتجات الكتالوج نشطة ومعروضة حالياً.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 text-right">المنتج</th>
                      <th className="py-3 px-4 text-right">السعر</th>
                      <th className="py-3 px-4 text-right">تاريخ الأرشفة</th>
                      <th className="py-3 px-4 text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5EFE6]">
                    {archivedProducts.map((archived) => {
                      const prodName = archived.name || archived.name_ar || archived.name_en || `منتج #${archived.id}`;
                      const primaryImg =
                        archived.images?.[0]?.image ||
                        (archived as any).image ||
                        'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&q=80';

                      return (
                        <tr key={archived.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] shrink-0 p-1 flex items-center justify-center">
                                <Image
                                  src={primaryImg}
                                  alt={prodName}
                                  fill
                                  className="object-contain grayscale"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-[#241710] text-xs leading-snug">{prodName}</p>
                                <span className="text-[10px] text-[#8C7A6B] font-mono">معرف #{archived.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-[#241710]">
                            {Number(archived.price || 0).toLocaleString('ar-EG')} ج.م
                          </td>

                          <td className="py-3 px-4 text-xs text-[#8C7A6B]">
                            {archived.deleted_at ? new Date(archived.deleted_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                          </td>

                          <td className="py-3 px-4 text-left">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  onRequestDeleteConfirm(
                                    `استعادة المنتج: «${prodName}»`,
                                    'هل ترغب في استعادة هذا المنتج وإعادته إلى قائمة المنتجات النشطة في المتجر؟',
                                    async () => {
                                      if (onRestoreProduct) {
                                        await onRestoreProduct(String(archived.id));
                                      } else {
                                        await productService.restoreProduct(archived.id);
                                      }
                                      setArchivedProducts((prev) => prev.filter((p) => String(p.id) !== String(archived.id)));
                                      fetchArchivedProducts().catch(() => {});
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
                                      `حذف نهائي للمنتج المؤرشف: «${prodName}»`,
                                      'تحذير: سيتم حذف هذا المنتج المؤرشف وجميع صوره على Cloudinary بشكل نهائي ولا يمكن استعادته أبداً.',
                                      async () => {
                                        if (onHardDeleteProduct) {
                                          await onHardDeleteProduct(String(archived.id));
                                        } else {
                                          await productService.hardDeleteProduct(archived.id);
                                        }
                                        setArchivedProducts((prev) => prev.filter((p) => String(p.id) !== String(archived.id)));
                                        fetchArchivedProducts().catch(() => {});
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

                    {/* Product Name (Bilingual) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#241710]">
                          اسم المنتج بالعربية <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          dir="rtl"
                          value={editingProduct.name_ar ?? editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              name: e.target.value,
                              name_ar: e.target.value,
                              slug: editingProduct.name_en ? editingProduct.slug : e.target.value.toLowerCase().replace(/\s+/g, '-'),
                            })
                          }
                          placeholder="مثال: سجاد تبريز كلاسيك فاخر..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#241710]">
                          اسم المنتج بالإنجليزية (English Name)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={editingProduct.name_en || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              name_en: e.target.value,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || editingProduct.slug,
                            })
                          }
                          placeholder="e.g. Classic Tabriz Luxury Carpet..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                        />
                      </div>
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
                          onClick={() => {
                            const initialSizes = availableSizes.length > 0
                              ? [{
                                  id: String(availableSizes[0].id),
                                  name: `${availableSizes[0].width} × ${availableSizes[0].length} سم`,
                                  dimensions: `${availableSizes[0].width} × ${availableSizes[0].length} سم`,
                                  priceDelta: 0,
                                  width: availableSizes[0].width,
                                  length: availableSizes[0].length,
                                }]
                              : [];
                            const currentSizes = editingProduct.sizes && editingProduct.sizes.length > 0 ? editingProduct.sizes : initialSizes;
                            setEditingProduct({
                              ...editingProduct,
                              isArawal: false,
                              sizes: currentSizes,
                              dimensions: currentSizes.length > 0 ? currentSizes[0].dimensions : '200 × 300 سم',
                            });
                          }}
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
                            <p className="font-bold text-xs text-[#241710] leading-none">سجاد بالقطعة</p>
                            <span className="text-[10px] text-[#8C7A6B] mt-0.5 block">يباع بالقطعة بمقاس محدد</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const widths = editingProduct.availableWidths || [60, 80, 100, 120];
                            setEditingProduct({
                              ...editingProduct,
                              isArawal: true,
                              sizes: [],
                              dimensions: widths.map((w) => `${w} سم`).join('، '),
                              availableWidths: widths,
                              arawalUnitPricePerMeter: editingProduct.arawalUnitPricePerMeter || editingProduct.price || 450,
                            });
                          }}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#241710]">
                          الوصف التعريفي بالعربية
                        </label>
                        <textarea
                          rows={2}
                          dir="rtl"
                          value={editingProduct.description_ar ?? editingProduct.description ?? ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              description: e.target.value,
                              description_ar: e.target.value,
                            })
                          }
                          placeholder="نبذة عن السجادة وتنسيقها في غرف المعيشة والصالون..."
                          className="w-full text-xs p-2.5 rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#241710]">
                          الوصف بالإنجليزية (English Description)
                        </label>
                        <textarea
                          rows={2}
                          dir="ltr"
                          value={editingProduct.description_en || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              description_en: e.target.value,
                            })
                          }
                          placeholder="Carpet description for English visitors..."
                          className="w-full text-xs p-2.5 rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                        />
                      </div>
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
                              className={`group relative aspect-square rounded-lg overflow-hidden border bg-[#FAF8F5] p-1.5 flex items-center justify-center shadow-2xs transition-all ${
                                isPrimary
                                  ? 'border-[#241710] ring-2 ring-[#241710]/20'
                                  : 'border-[#EAE3D8] hover:border-[#A27B5C]'
                              }`}
                            >
                              <Image
                                src={imgUrl}
                                alt={`صورة ${idx + 1}`}
                                fill
                                className="object-contain"
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
                  <div className="p-4 rounded-xl bg-[#FAF8F5]/70 border border-[#EAE3D8] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D8]/70">
                      <h4 className="text-xs font-black text-[#241710] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#A27B5C]" />
                        <span>خيارات الألوان المتاحة ({editingProduct.colors?.length || 0})</span>
                        {!editingProduct.isArawal && <span className="text-rose-600 text-xs">*</span>}
                      </h4>
                      <span className="text-[10px] text-[#8C7A6B]">
                        {!editingProduct.isArawal ? 'مطلوب لون واحد على الأقل' : 'اختياري للأروال'}
                      </span>
                    </div>

                    {/* Color Chips */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-[#5C4A3E]">
                        الألوان المختارة للمنتج:
                      </label>
                      {(!editingProduct.colors || editingProduct.colors.length === 0) ? (
                        <div className="p-2.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 text-[11px] text-amber-800 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>لم يتم اختيار أي لون بعد. اختر لوناً من القائمة أو أضف لوناً جديداً.</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {editingProduct.colors.map((col) => (
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
                                className="text-[#8C7A6B] hover:text-rose-600 ms-0.5 p-0.5 rounded transition-colors"
                                title="إزالة اللون"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Select Existing Color Dropdown */}
                    <div className="space-y-1 pt-1 border-t border-[#EAE3D8]/60">
                      <label className="block text-[11px] font-bold text-[#5C4A3E]">
                        اختيار من الألوان المسجلة في النظام:
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value=""
                          disabled={isLoadingColors}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectExistingColor(e.target.value);
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#EAE3D8] text-[#241710] font-bold focus:outline-none focus:border-[#241710] disabled:opacity-50"
                        >
                          <option value="">
                            {isLoadingColors ? 'جاري تحميل الألوان...' : '-- اختر لوناً مسجلاً لإضافته للمنتج --'}
                          </option>
                          {availableColors
                            .filter((c) => !(editingProduct.colors || []).some((ec) => String(ec.id) === String(c.id)))
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name_ar || c.name || c.hex_code} ({c.hex_code})
                              </option>
                            ))}
                        </select>
                        {isLoadingColors && <Loader2 className="w-4 h-4 animate-spin text-[#A27B5C]" />}
                      </div>
                      {colorLoadError && (
                        <p className="text-[10px] text-rose-600 font-bold">{colorLoadError}</p>
                      )}
                    </div>

                    {/* Add / Create New Color */}
                    <div className="pt-2 border-t border-[#EAE3D8]/60 space-y-2">
                      <label className="block text-[11px] font-bold text-[#5C4A3E]">
                        أو إضافة لون جديد للنظام:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          dir="rtl"
                          value={newColorNameAr}
                          onChange={(e) => setNewColorNameAr(e.target.value)}
                          placeholder="اسم اللون بالعربية (مثال: كحلي ملكي)"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={newColorNameEn}
                          onChange={(e) => setNewColorNameEn(e.target.value)}
                          placeholder="Color name in English (e.g. Royal Navy)"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={newColorHex}
                            onChange={(e) => setNewColorHex(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-[#EAE3D8] cursor-pointer shrink-0"
                          />
                          <span className="text-[11px] font-mono text-[#736B63]">{newColorHex}</span>
                        </div>
                        <button
                          type="button"
                          disabled={isCreatingColor}
                          onClick={handleCreateAndAddColor}
                          className="ms-auto px-3 py-1.5 rounded-lg bg-[#241710] text-[#FAF5EB] text-xs font-bold shrink-0 hover:bg-[#3D291D] disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {isCreatingColor ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>+ إضافة اللون</span>}
                        </button>
                      </div>
                      {newColorError && (
                        <p className="text-[10px] text-rose-600 font-bold">{newColorError}</p>
                      )}
                    </div>
                  </div>

                  {/* Card 5: Sizes Management (Normal Carpet Products) */}
                  {!editingProduct.isArawal && (
                    <div className="p-4 rounded-xl bg-[#FAF8F5]/70 border border-[#EAE3D8] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D8]/70">
                        <h4 className="text-xs font-black text-[#241710] flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-[#A27B5C]" />
                          <span>المقاسات المتاحة للمنتج ({editingProduct.sizes?.length || 0})</span>
                          <span className="text-rose-600 text-xs">*</span>
                        </h4>
                        <span className="text-[10px] text-[#8C7A6B]">
                          مطلوب مقاس واحد على الأقل
                        </span>
                      </div>

                      {/* Selected Sizes Chips */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-[#5C4A3E]">
                          المقاسات المختارة حالياً:
                        </label>
                        {(!editingProduct.sizes || editingProduct.sizes.length === 0) ? (
                          <div className="p-2.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 text-[11px] text-amber-800 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>لم يتم اختيار أي مقاس بعد. اختر مقاساً من القائمة أدناه أو أضف مقاساً جديداً.</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {editingProduct.sizes.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#EAE3D8] text-[11px] font-bold text-[#241710] shadow-2xs"
                              >
                                <Ruler className="w-3 h-3 text-[#A27B5C]" />
                                <span dir="ltr">
                                  {s.name || (s.width && s.length ? `${s.width} × ${s.length} سم` : s.dimensions || '')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSize(String(s.id))}
                                  className="text-[#8C7A6B] hover:text-rose-600 ms-1 p-0.5 rounded transition-colors"
                                  title="إزالة المقاس"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Select Existing Size Dropdown */}
                      <div className="space-y-1 pt-1 border-t border-[#EAE3D8]/60">
                        <label className="block text-[11px] font-bold text-[#5C4A3E]">
                          اختيار من المقاسات المسجلة في النظام:
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value=""
                            disabled={isLoadingSizes}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSelectExistingSize(e.target.value);
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#EAE3D8] text-[#241710] font-bold focus:outline-none focus:border-[#241710] disabled:opacity-50"
                          >
                            <option value="">
                              {isLoadingSizes ? 'جاري تحميل المقاسات...' : '-- اختر مقاساً مسجلاً لإضافته للمنتج --'}
                            </option>
                            {availableSizes
                              .filter((s) => !(editingProduct.sizes || []).some((es) => String(es.id) === String(s.id)))
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.width} × {s.length} سم
                                </option>
                              ))}
                          </select>
                          {isLoadingSizes && <Loader2 className="w-4 h-4 animate-spin text-[#A27B5C]" />}
                        </div>
                        {sizeLoadError && (
                          <p className="text-[10px] text-rose-600 font-bold">{sizeLoadError}</p>
                        )}
                      </div>

                      {/* Add New Size Inline Form */}
                      <div className="pt-2 border-t border-[#EAE3D8]/60 space-y-1.5">
                        <label className="block text-[11px] font-bold text-[#5C4A3E]">
                          أو إضافة مقاس جديد للنظام:
                        </label>
                        <div className="grid grid-cols-5 gap-1.5 items-center">
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="العرض (سم)"
                              value={newSizeWidth}
                              onChange={(e) => setNewSizeWidth(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="الطول (سم)"
                              value={newSizeLength}
                              onChange={(e) => setNewSizeLength(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-[#EAE3D8] text-[#241710] focus:outline-none focus:border-[#241710]"
                            />
                          </div>
                          <div className="col-span-1">
                            <button
                              type="button"
                              disabled={isCreatingSize || !newSizeWidth || !newSizeLength}
                              onClick={handleCreateAndAddSize}
                              className="w-full py-1.5 px-1 rounded-lg bg-[#241710] text-[#FAF5EB] text-[11px] font-bold hover:bg-[#3D291D] disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                            >
                              {isCreatingSize ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>+ إضافة</span>}
                            </button>
                          </div>
                        </div>
                        {newSizeError && (
                          <p className="text-[10px] text-rose-600 font-bold">{newSizeError}</p>
                        )}
                      </div>
                    </div>
                  )}
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

            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] p-3 flex items-center justify-center">
              <Image
                src={viewingProduct.images[0]}
                alt={viewingProduct.name}
                fill
                className="object-contain"
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
                  {getProductTypeLabel(viewingProduct, subcategories)}
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
