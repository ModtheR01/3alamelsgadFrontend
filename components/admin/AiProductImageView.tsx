'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Sparkles,
  UploadCloud,
  Check,
  RefreshCw,
  Search,
  PlusCircle,
  Link2,
  Trash2,
  Eye,
  CheckCircle2,
  Layers,
  X,
  ArrowDown,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import { Product, Category } from '@/types';
import { BackendSubcategory } from '@/types/category';
import { BackendSize, BackendColor } from '@/types/product';
import { aiImageService } from '@/lib/api/services/aiImageService';
import { productService } from '@/lib/api/services/productService';
import { productImageService } from '@/lib/api/services/productImageService';
import { categoryService, subcategoryService } from '@/lib/api/services/categoryService';
import { uploadDirectToCloudinary, CloudinaryUploadResult } from '@/lib/api/cloudinary';
import { mapBackendProduct } from '@/lib/store';

export interface AiProductImageViewProps {
  products?: Product[];
  categories?: Category[];
  subcategories?: BackendSubcategory[];
  onAssignImageToProduct?: (productId: string | number, imageUrl: string) => void;
  onRefreshCatalog?: () => Promise<void>;
  onNavigateSection?: (section: any) => void;
}

type ActionChoice = 'link_existing' | 'create_new' | null;

export default function AiProductImageView({
  products: initialProducts = [],
  categories: initialCategories = [],
  subcategories: initialSubcategories = [],
  onAssignImageToProduct,
  onRefreshCatalog,
}: AiProductImageViewProps) {
  // Upload and file states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');

  // AI Processing states (Phase 2)
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  // Preview modal state
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'enhanced' | 'original'>('enhanced');

  // Object URL lifecycle refs for clean revocation
  const originalObjectUrlRef = useRef<string | null>(null);
  const processedObjectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catalog data states (fetched if not supplied as props)
  const [loadedProducts, setLoadedProducts] = useState<Product[]>([]);
  const [loadedCategories, setLoadedCategories] = useState<Category[]>([]);
  const [loadedSubcategories, setLoadedSubcategories] = useState<BackendSubcategory[]>([]);
  const [availableSizes, setAvailableSizes] = useState<BackendSize[]>([]);
  const [availableColors, setAvailableColors] = useState<BackendColor[]>([]);

  // Step 4: Product Linking states (Phase 3)
  const [actionChoice, setActionChoice] = useState<ActionChoice>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkedImageUrl, setLinkedImageUrl] = useState<string | null>(null);

  // Step 4: New product compact form state (Phase 4)
  const [newProductNameAr, setNewProductNameAr] = useState('');
  const [newProductNameEn, setNewProductNameEn] = useState('');
  const [newProductDescAr, setNewProductDescAr] = useState('');
  const [newProductDescEn, setNewProductDescEn] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductSubcategory, setNewProductSubcategory] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Partial failure recovery states
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [cachedCloudinaryUpload, setCachedCloudinaryUpload] = useState<CloudinaryUploadResult | null>(null);

  // Revoke object URLs on component unmount
  useEffect(() => {
    return () => {
      if (originalObjectUrlRef.current && originalObjectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(originalObjectUrlRef.current);
      }
      if (processedObjectUrlRef.current && processedObjectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(processedObjectUrlRef.current);
      }
    };
  }, []);

  // Fetch catalog entities if not provided via props
  useEffect(() => {
    let isMounted = true;

    async function loadCatalogData() {
      try {
        const [cats, subcats, sizes, colors] = await Promise.all([
          initialCategories.length > 0 ? Promise.resolve(initialCategories) : categoryService.getCategories(),
          initialSubcategories.length > 0 ? Promise.resolve(initialSubcategories) : subcategoryService.getSubcategories(),
          productService.getSizes().catch(() => []),
          productService.getColors().catch(() => []),
        ]);

        if (!isMounted) return;

        if (initialCategories.length === 0 && Array.isArray(cats)) {
          setLoadedCategories(cats as Category[]);
        }
        if (initialSubcategories.length === 0 && Array.isArray(subcats)) {
          setLoadedSubcategories(subcats as BackendSubcategory[]);
        }
        if (Array.isArray(sizes)) setAvailableSizes(sizes);
        if (Array.isArray(colors)) setAvailableColors(colors);

        if (initialProducts.length === 0) {
          const rawProds = await productService.getProducts().catch(() => []);
          if (isMounted && Array.isArray(rawProds)) {
            const mapped = rawProds.map((p) => mapBackendProduct(p, subcats as BackendSubcategory[]));
            setLoadedProducts(mapped);
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    loadCatalogData();

    return () => {
      isMounted = false;
    };
  }, [initialProducts.length, initialCategories, initialSubcategories]);

  // Combined catalog lists
  const effectiveProducts = useMemo(() => {
    return initialProducts.length > 0 ? initialProducts : loadedProducts;
  }, [initialProducts, loadedProducts]);

  const effectiveCategories = useMemo(() => {
    return initialCategories.length > 0 ? initialCategories : loadedCategories;
  }, [initialCategories, loadedCategories]);

  const effectiveSubcategories = useMemo(() => {
    return initialSubcategories.length > 0 ? initialSubcategories : loadedSubcategories;
  }, [initialSubcategories, loadedSubcategories]);

  // Auto-select first category and subcategory if not selected
  useEffect(() => {
    if (!newProductCategory && effectiveCategories.length > 0) {
      const firstCatId = String(effectiveCategories[0].id);
      setNewProductCategory(firstCatId);
    }
  }, [effectiveCategories, newProductCategory]);

  const filteredSubcategories = useMemo(() => {
    if (!newProductCategory) return effectiveSubcategories;
    return effectiveSubcategories.filter(
      (sub) => String(sub.category_id || (sub as any).categoryId) === String(newProductCategory)
    );
  }, [effectiveSubcategories, newProductCategory]);

  useEffect(() => {
    if (filteredSubcategories.length > 0) {
      const currentExists = filteredSubcategories.some(
        (sub) => String(sub.id) === String(newProductSubcategory)
      );
      if (!currentExists) {
        setNewProductSubcategory(String(filteredSubcategories[0].id));
      }
    } else {
      setNewProductSubcategory('');
    }
  }, [filteredSubcategories, newProductSubcategory]);


  // Derived filtered products for search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return effectiveProducts.slice(0, 10);
    const q = searchQuery.toLowerCase().trim();
    return effectiveProducts.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.slug && p.slug.toLowerCase().includes(q)) ||
      (p.categoryId && p.categoryId.toLowerCase().includes(q)) ||
      Boolean((p as any).categoryName && (p as any).categoryName.toLowerCase().includes(q))
    );
  }, [effectiveProducts, searchQuery]);

  const selectedProduct = useMemo(() => {
    return effectiveProducts.find((p) => String(p.id) === String(selectedProductId));
  }, [effectiveProducts, selectedProductId]);

  // Current active step calculation
  const currentStep = useMemo(() => {
    if (!selectedImage) return 1;
    if (isProcessing) return 2;
    if (!processedImageUrl) return 2;
    if (actionChoice || linkSuccess || createSuccess) return 4;
    return 3;
  }, [selectedImage, isProcessing, processedImageUrl, actionChoice, linkSuccess, createSuccess]);

  // Helper to safely set original object URL
  const updateOriginalPreview = useCallback((url: string, file: File | null) => {
    if (originalObjectUrlRef.current && originalObjectUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(originalObjectUrlRef.current);
    }
    originalObjectUrlRef.current = url;
    setSelectedImage(url);
    setSelectedFile(file);
    setProcessingError(null);
    setProcessedBlob(null);
    if (processedObjectUrlRef.current && processedObjectUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(processedObjectUrlRef.current);
      processedObjectUrlRef.current = null;
    }
    setProcessedImageUrl(null);
    setActionChoice(null);
    setLinkSuccess(false);
    setCreateSuccess(false);
    setCreatedProductId(null);
    setCachedCloudinaryUpload(null);
  }, []);

  // Handle file select from file input
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    setImageFileName(file.name);
    const previewUrl = URL.createObjectURL(file);
    updateOriginalPreview(previewUrl, file);
  };

  // Handle resetting image
  const handleReset = () => {
    if (originalObjectUrlRef.current && originalObjectUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(originalObjectUrlRef.current);
      originalObjectUrlRef.current = null;
    }
    if (processedObjectUrlRef.current && processedObjectUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(processedObjectUrlRef.current);
      processedObjectUrlRef.current = null;
    }
    setSelectedFile(null);
    setSelectedImage(null);
    setImageFileName('');
    setProcessingError(null);
    setProcessedBlob(null);
    setProcessedImageUrl(null);
    setActionChoice(null);
    setSelectedProductId('');
    setLinkSuccess(false);
    setLinkError(null);
    setLinkedImageUrl(null);
    setCreateSuccess(false);
    setCreateError(null);
    setCreatedProductId(null);
    setCachedCloudinaryUpload(null);
  };

  // Phase 2: Run AI enhancement using real backend POST /api/products/process-rug/
  const handleRunAiEnhancement = async () => {
    if (!selectedImage && !selectedFile) return;

    try {
      setIsProcessing(true);
      setProcessingError(null);
      setLinkSuccess(false);
      setLinkError(null);
      setCreateSuccess(false);
      setCreateError(null);

      let fileToProcess = selectedFile;
      if (!fileToProcess && selectedImage) {
        // Fetch remote sample URL to convert into a real File
        const response = await fetch(selectedImage);
        const fetchedBlob = await response.blob();
        fileToProcess = new File([fetchedBlob], imageFileName || 'rug-sample.jpg', {
          type: fetchedBlob.type || 'image/jpeg',
        });
        setSelectedFile(fileToProcess);
      }

      if (!fileToProcess) {
        throw new Error('يرجى تحديد ملف صورة صالح للمعالجة.');
      }

      // Real authenticated call to POST /api/products/process-rug/
      const result = await aiImageService.processRugImage(fileToProcess, fileToProcess.name);

      // Create new object URL for binary preview
      if (processedObjectUrlRef.current && processedObjectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(processedObjectUrlRef.current);
      }
      const newProcessedUrl = URL.createObjectURL(result.blob);
      processedObjectUrlRef.current = newProcessedUrl;

      setProcessedBlob(result.blob);
      setProcessedImageUrl(newProcessedUrl);
      setPreviewMode('enhanced');
    } catch (err: any) {
      const msg = err?.message || 'حدث خطأ أثناء معالجة الصورة عبر الخادم.';
      setProcessingError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Phase 3: Confirm link to existing product
  const handleConfirmLink = async () => {
    if (!selectedProductId || !processedBlob) {
      setLinkError('يرجى اختيار منتج والتأكد من وجود صورة معالجة.');
      return;
    }

    try {
      setIsLinking(true);
      setLinkError(null);

      // 1. Convert processed binary Blob into File
      const fileToUpload = new File(
        [processedBlob],
        imageFileName ? `enhanced-${imageFileName}` : 'enhanced-rug.png',
        { type: processedBlob.type || 'image/png' }
      );

      // 2. Upload to Cloudinary under folder 'alamelsgad-products'
      const uploadRes = await uploadDirectToCloudinary(fileToUpload, {
        folder: 'alamelsgad-products',
      });

      // 3. Calculate safe sort_order to satisfy backend uniqueness constraint
      const numericProductId = Number(selectedProductId);
      const existingProduct = effectiveProducts.find((p) => String(p.id) === String(selectedProductId));
      const existingRecords = existingProduct?.imageRecords || [];
      const maxSortOrder = existingRecords.reduce(
        (max, record) => Math.max(max, record.sort_order ?? 0),
        -1
      );
      const nextSortOrder = maxSortOrder + 1;

      // 4. Create ProductImage record in backend (POST /api/products/images/)
      await productImageService.createProductImage({
        product: numericProductId,
        image: uploadRes.secure_url,
        public_id: uploadRes.public_id,
        is_primary: true,
        sort_order: nextSortOrder,
      });

      // 5. Invalidate / refresh catalog cache across the app
      if (onRefreshCatalog) {
        await onRefreshCatalog();
      }

      if (onAssignImageToProduct) {
        onAssignImageToProduct(selectedProductId, uploadRes.secure_url);
      }

      setLinkedImageUrl(uploadRes.secure_url);
      setLinkSuccess(true);
    } catch (err: any) {
      const msg = err?.message || 'فشل ربط الصورة بالمنتج في الخادم.';
      setLinkError(msg);
    } finally {
      setIsLinking(false);
    }
  };

  // Phase 4: Create new product and attach the processed image
  const handleConfirmCreate = async () => {
    if (!newProductNameAr.trim()) {
      setCreateError('يرجى إدخال اسم المنتج باللغة العربية.');
      return;
    }
    if (!newProductPrice || isNaN(Number(newProductPrice)) || Number(newProductPrice) <= 0) {
      setCreateError('يرجى إدخال سعر صالح للمنتج.');
      return;
    }
    if (!newProductSubcategory) {
      setCreateError('يرجى اختيار التصنيف الفرعي للمنتج.');
      return;
    }
    if (!processedBlob) {
      setCreateError('لا توجد صورة معالجة جاهزة للربط.');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      // Step A: Upload to Cloudinary if not already cached from a previous attempt
      let uploadResult = cachedCloudinaryUpload;
      if (!uploadResult) {
        const fileToUpload = new File(
          [processedBlob],
          `new-${newProductNameAr.trim().replace(/\s+/g, '-')}.png`,
          { type: processedBlob.type || 'image/png' }
        );
        uploadResult = await uploadDirectToCloudinary(fileToUpload, {
          folder: 'alamelsgad-products',
        });
        setCachedCloudinaryUpload(uploadResult);
      }

      // Step B: Create product if not already created in a previous attempt
      let targetProdId = createdProductId;
      if (!targetProdId) {
        // Resolve default sizes and colors for backend validation requirements
        const sizeIds = availableSizes.length > 0 ? [availableSizes[0].id] : [1];
        const colorIds = availableColors.length > 0 ? [availableColors[0].id] : [1];

        const createdProd = await productService.createProduct({
          name_ar: newProductNameAr.trim(),
          name_en: (newProductNameEn || newProductNameAr).trim(),
          description_ar: (newProductDescAr || newProductNameAr).trim(),
          description_en: (newProductDescEn || newProductNameEn || newProductNameAr).trim(),
          price: Number(newProductPrice),
          subcategory_ids: [Number(newProductSubcategory)],
          size_ids: sizeIds,
          color_ids: colorIds,
        });

        targetProdId = createdProd.id;
        setCreatedProductId(targetProdId);
      }

      // Step C: Attach uploaded image as primary ProductImage
      await productImageService.createProductImage({
        product: targetProdId,
        image: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        is_primary: true,
        sort_order: 0,
      });

      // Step D: Invalidate / refresh catalog cache
      if (onRefreshCatalog) {
        await onRefreshCatalog();
      }

      setCreateSuccess(true);
    } catch (err: any) {
      const msg = err?.message || 'حدث خطأ أثناء إنشاء المنتج وحفظ الصورة.';
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 text-right font-sans max-w-5xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="pb-4 border-b border-[#EAE3D8]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#241710] text-[#FAF5EB] flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-[#EED8BE]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
              استوديو معالجة صور المنتجات بالذكاء الاصطناعي
            </h1>
            <p className="text-xs sm:text-sm text-[#8C7A6B] mt-0.5">
              حوّل صور المنتجات إلى صور جاهزة للعرض في المتجر واربطها بالمنتجات الحقيقية.
            </p>
          </div>
        </div>
      </div>

      {/* ================= STEPPER BAR ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { step: 1, title: 'رفع صورة المنتج' },
          { step: 2, title: 'معالجة الصورة' },
          { step: 3, title: 'معاينة النتيجة' },
          { step: 4, title: 'ربط الصورة بمنتج' },
        ].map((item) => {
          const isDone = currentStep > item.step || (item.step === 4 && (linkSuccess || createSuccess));
          const isCurrent = currentStep === item.step;
          return (
            <div
              key={item.step}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                isCurrent
                  ? 'bg-[#241710] text-[#FAF5EB] border-[#241710] shadow-xs'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-white text-[#8C7A6B] border-[#EAE3D8]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                  isCurrent
                    ? 'bg-[#EED8BE] text-[#241710]'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 text-[#8C7A6B]'
                }`}
              >
                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : item.step}
              </span>
              <span className="truncate">{item.title}</span>
            </div>
          );
        })}
      </div>

      {/* ================= STEP 1: UPLOAD SECTION ================= */}
      <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#EAE3D8] bg-[#FAF8F5]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#FAF5EB] border border-[#E8DEC0] text-[#241710] text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-black text-[#241710]">رفع صورة المنتج</h2>
          </div>
          {selectedImage && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3" /> تم اختيار الصورة
            </span>
          )}
        </div>

        <div className="p-5">
          {!selectedImage ? (
            /* Clean Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D8CEBF] hover:border-[#241710] rounded-2xl p-6 sm:p-8 text-center bg-[#FAF8F5]/50 hover:bg-[#FAF8F5] cursor-pointer transition-all flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0] flex items-center justify-center mb-2.5">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-[#241710] mb-1">
                ارفع صورة المنتج
              </h3>
              <p className="text-xs text-[#8C7A6B] max-w-sm mb-3.5">
                اسحب الصورة هنا أو اختر صورة من جهازك (JPEG, PNG, WebP)
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold shadow-xs hover:bg-[#3D291D] transition-colors"
              >
                اختيار صورة
              </button>
            </div>
          ) : (
            /* Uploaded Preview & Controls */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5]/50">
              <div className="flex items-center gap-3.5">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#EAE3D8] bg-white shrink-0">
                  <Image
                    src={selectedImage}
                    alt="صورة المنتج المرفوعة"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#241710]">
                    {imageFileName || 'صورة المنتج المرفوعة'}
                  </h4>
                  <p className="text-[11px] text-[#8C7A6B] mt-0.5">
                    الصورة الأصلية جاهزة للإرسال إلى معالج الذكاء الاصطناعي
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-[#241710] bg-white hover:bg-[#FAF8F5] border border-[#EAE3D8] rounded-xl transition-colors"
                >
                  تغيير الصورة
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الصورة</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* ================= STEP 2: AI PROCESSING ACTION ================= */}
      {selectedImage && !processedImageUrl && (
        <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs p-6 text-center space-y-4">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF5EB] border border-[#E8DEC0] text-[#A27B5C] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-[#A27B5C]" />
            </div>
            <h3 className="text-base font-black text-[#241710]">
              معالجة الصورة عبر الخادم
            </h3>
            <p className="text-xs text-[#8C7A6B]">
              سيقوم النظام بإرسال الصورة إلى الخادم لتفريغ الخلفية، ضبط الإضاءة، وإبراز تفاصيل نسيج السجاد.
            </p>
          </div>

          {processingError && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 text-right">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{processingError}</span>
            </div>
          )}

          <div className="pt-2 max-w-sm mx-auto">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRunAiEnhancement}
              className="w-full py-3.5 px-6 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-sm font-black transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#EED8BE]" />
                  <span>جاري معالجة الصورة عبر الخادم...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#EED8BE]" />
                  <span>تحسين الصورة بالذكاء الاصطناعي</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: RESULT SECTION ================= */}
      {processedImageUrl && (
        <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#EAE3D8] bg-[#FAF8F5]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                ✓
              </span>
              <div>
                <h2 className="text-sm font-black text-[#241710]">الصورة الناتجة من الخادم</h2>
                <p className="text-[11px] text-[#8C7A6B]">
                  تم التحسين بنجاح واستلام الصورة المعالجة من الخادم
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>جاهزة للاستخدام</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Prominent Image Display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Main Enhanced Image */}
              <div className="md:col-span-8">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden border-2 border-[#241710]/20 bg-[#FAF8F5] shadow-xs group">
                  <Image
                    src={previewMode === 'enhanced' ? processedImageUrl : (selectedImage || '')}
                    alt="الصورة الناتجة"
                    fill
                    className="object-cover"
                  />

                  {/* Toggle Preview Mode Badge */}
                  <div className="absolute top-3 right-3 flex items-center bg-black/75 backdrop-blur-xs text-white rounded-xl p-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('enhanced')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        previewMode === 'enhanced'
                          ? 'bg-[#FAF5EB] text-[#241710]'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      الصورة الناتجة
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('original')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        previewMode === 'original'
                          ? 'bg-[#FAF5EB] text-[#241710]'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      الأصلية
                    </button>
                  </div>

                  {/* Zoom Action */}
                  <button
                    type="button"
                    onClick={() => setIsZoomOpen(true)}
                    className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>تكبير ومعاينة</span>
                  </button>
                </div>
              </div>

              {/* Side Info & Actions */}
              <div className="md:col-span-4 space-y-3">
                <div className="p-4 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5]/60 space-y-2">
                  <span className="text-xs font-black text-[#241710] block">
                    مواصفات الصورة المحسنة:
                  </span>
                  <ul className="text-xs text-[#5C4A3E] space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>عزل الخلفية وتنظيف الكادر</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>حفظ خامة وتفاصيل النسيج</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>إضاءة استوديو متوازنة للعرض</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const step4Element = document.getElementById('step-4-linking');
                      step4Element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-3 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>استخدام الصورة والانتقال للربط</span>
                    <ArrowDown className="w-4 h-4 text-[#EED8BE]" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleRunAiEnhancement}
                      className="flex-1 py-2 text-xs font-bold text-[#241710] bg-white hover:bg-[#FAF8F5] border border-[#EAE3D8] rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3 text-[#A27B5C]" />
                      <span>إعادة المعالجة</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors"
                    >
                      تجاهل الصورة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 4: PRODUCT LINKING ================= */}
      {processedImageUrl && (
        <div
          id="step-4-linking"
          className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs p-6 space-y-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#FAF5EB] border border-[#E8DEC0] text-[#241710] text-xs font-black flex items-center justify-center">
                4
              </span>
              <h2 className="text-base font-black text-[#241710]">
                ماذا تريد أن تفعل بالصورة؟
              </h2>
            </div>
            <p className="text-xs text-[#8C7A6B] mr-8">
              اختر ما إذا كنت ترغب في ربط الصورة بمنتج متوفر بالفعل أو إنشاء منتج جديد بها.
            </p>
          </div>

          {/* TWO MAIN VISUAL CHOICE CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OPTION 1: LINK TO EXISTING PRODUCT */}
            <button
              type="button"
              onClick={() => {
                setActionChoice('link_existing');
                setLinkSuccess(false);
                setLinkError(null);
                setCreateSuccess(false);
                setCreateError(null);
              }}
              className={`p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-3 ${
                actionChoice === 'link_existing'
                  ? 'border-[#241710] bg-[#FAF8F5] shadow-xs'
                  : 'border-[#EAE3D8] hover:border-[#A27B5C] bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    actionChoice === 'link_existing'
                      ? 'bg-[#241710] text-[#EED8BE]'
                      : 'bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]'
                  }`}
                >
                  <Link2 className="w-5 h-5" />
                </div>
                {actionChoice === 'link_existing' && (
                  <span className="w-6 h-6 rounded-full bg-[#241710] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-[#241710]">
                  🔗 ربط بمنتج موجود
                </h3>
                <p className="text-xs text-[#8C7A6B] mt-1">
                  ارفع الصورة إلى التخزين الدائم واربطها كصورة أساسية لمنتج في الكتالوج
                </p>
              </div>
            </button>

            {/* OPTION 2: CREATE NEW PRODUCT */}
            <button
              type="button"
              onClick={() => {
                setActionChoice('create_new');
                setLinkSuccess(false);
                setLinkError(null);
                setCreateSuccess(false);
                setCreateError(null);
              }}
              className={`p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-3 ${
                actionChoice === 'create_new'
                  ? 'border-[#241710] bg-[#FAF8F5] shadow-xs'
                  : 'border-[#EAE3D8] hover:border-[#A27B5C] bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    actionChoice === 'create_new'
                      ? 'bg-[#241710] text-[#EED8BE]'
                      : 'bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]'
                  }`}
                >
                  <PlusCircle className="w-5 h-5" />
                </div>
                {actionChoice === 'create_new' && (
                  <span className="w-6 h-6 rounded-full bg-[#241710] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-[#241710]">
                  ＋ إنشاء منتج جديد
                </h3>
                <p className="text-xs text-[#8C7A6B] mt-1">
                  أنشئ منتجًا حقيقيًا جديدًا في قاعدة البيانات مع اعتماد الصورة الناتجة له
                </p>
              </div>
            </button>
          </div>

          {/* ================= OPTION 1 WORKFLOW: LINK EXISTING ================= */}
          {actionChoice === 'link_existing' && (
            <div className="pt-4 border-t border-[#EAE3D8] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-black text-[#241710]">
                  اختر المنتج من الكتالوج
                </label>
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#8C7A6B] absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن منتج..."
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5]/60 text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Product Match List */}
              <div className="border border-[#EAE3D8] rounded-xl divide-y divide-[#EAE3D8] max-h-64 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8C7A6B]">
                    لا توجد منتجات مطابقة للبحث
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const isSelected = String(selectedProductId) === String(p.id);
                    const primaryThumb = p.images?.[0] || '';
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(String(p.id));
                          setLinkSuccess(false);
                          setLinkError(null);
                        }}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#FAF5EB]'
                            : 'hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#EAE3D8] bg-stone-100 shrink-0">
                            {primaryThumb ? (
                              <Image
                                src={primaryThumb}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                                لا صورة
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-[#241710] line-clamp-1">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-[#8C7A6B] mt-0.5">
                              {p.price?.toLocaleString()} ج.م
                              {(p as any).categoryName ? ` • ${(p as any).categoryName}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[#241710] border-[#241710] text-white'
                                : 'border-[#D8CEBF] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {linkError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              {/* Confirmation Notice & CTA */}
              {selectedProduct && (
                <div className="p-4 rounded-xl border border-[#E8DEC0] bg-[#FAF5EB] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-[#241710]">
                    <Layers className="w-4 h-4 text-[#A27B5C]" />
                    <span>سيتم رفع الصورة الناتجة إلى التخزين الدائم وحفظها كصورة أساسية للمنتج في الخادم.</span>
                  </div>

                  <p className="text-xs text-[#5C4A3E]">
                    المنتج المختار: <strong>{selectedProduct.name}</strong> (معرف #{selectedProduct.id})
                  </p>

                  {linkSuccess ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>تم ربط الصورة بنجاح وتحديث كتالوج المتجر! ستظهر كصورة أساسية للمنتج.</span>
                      </div>
                      {linkedImageUrl && (
                        <p className="text-[11px] text-emerald-700 font-mono truncate mr-6" dir="ltr">
                          {linkedImageUrl}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isLinking}
                      onClick={handleConfirmLink}
                      className="px-5 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-60"
                    >
                      {isLinking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#EED8BE]" />
                          <span>جاري رفع وحفظ الصورة...</span>
                        </>
                      ) : (
                        <>
                          <span>تأكيد الربط</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= OPTION 2 WORKFLOW: CREATE NEW ================= */}
          {actionChoice === 'create_new' && (
            <div className="pt-4 border-t border-[#EAE3D8] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Product Name Arabic */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#241710]">
                    اسم المنتج بالعربية *
                  </label>
                  <input
                    type="text"
                    value={newProductNameAr}
                    onChange={(e) => setNewProductNameAr(e.target.value)}
                    placeholder="مثال: سجادة كلاسيك ملكي ناعمة"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>

                {/* Product Name English */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#241710]">
                    اسم المنتج بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newProductNameEn}
                    onChange={(e) => setNewProductNameEn(e.target.value)}
                    placeholder="e.g. Classic Royal Soft Carpet"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710] text-left"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#241710]">
                    التصنيف الرئيسي *
                  </label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  >
                    {effectiveCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#241710]">
                    التصنيف الفرعي *
                  </label>
                  <select
                    value={newProductSubcategory}
                    onChange={(e) => setNewProductSubcategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  >
                    {filteredSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name_ar || sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#241710]">
                    السعر (ج.م) *
                  </label>
                  <input
                    type="number"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="مثال: 2500"
                    min="1"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>

                {/* Description Arabic */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#241710]">
                    الوصف بالعربية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newProductDescAr}
                    onChange={(e) => setNewProductDescAr(e.target.value)}
                    placeholder="وصف مختصر لمواصفات السجاد"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>
              </div>

              {/* Informative Note */}
              <div className="p-3 rounded-xl border border-[#E8DEC0] bg-[#FAF5EB] text-xs text-[#241710] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#A27B5C] shrink-0" />
                <span className="font-bold">
                  سيتم حفظ المنتج الجديد في قاعدة البيانات واعتماد الصورة المحسنة كصورة رئيسية له.
                </span>
              </div>

              {createError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    تم إنشاء المنتج الجديد بنجاح في قاعدة البيانات واعتماد الصورة الناتجة له!
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  disabled={!newProductNameAr.trim() || !newProductPrice || isCreating}
                  className="px-5 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-black transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#EED8BE]" />
                      <span>
                        {createdProductId ? 'جاري إعادة ربط الصورة بالمنتج...' : 'جاري إنشاء المنتج ورفع الصورة...'}
                      </span>
                    </>
                  ) : createdProductId ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة محاولة ربط الصورة بالمنتج (#{createdProductId})</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>إنشاء المنتج وحفظ الصورة</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= ZOOM PREVIEW MODAL ================= */}
      {isZoomOpen && processedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-3xl w-full p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D8]">
              <span className="text-xs font-black text-[#241710]">
                معاينة عالية الدقة للصورة الناتجة
              </span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-stone-100">
              <Image
                src={processedImageUrl}
                alt="معاينة كاملة"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
