'use client';

import React, { useState, useRef, useMemo } from 'react';
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
} from 'lucide-react';
import Image from '@/components/SafeImage';
import { Product } from '@/types';
import { AiImageJob } from '@/types/aiImage';
import { aiImageService } from '@/lib/api/services/aiImageService';
import { uploadDirectToCloudinary } from '@/lib/api/cloudinary';

interface AiProductImageViewProps {
  products: Product[];
  onAssignImageToProduct?: (productId: string | number, imageUrl: string) => void;
  onNavigateSection?: (section: any) => void;
}

type ActionChoice = 'link_existing' | 'create_new' | null;

export default function AiProductImageView({
  products = [],
  onAssignImageToProduct,
}: AiProductImageViewProps) {
  // Upload and job states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [selectedPublicId, setSelectedPublicId] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<AiImageJob | null>(null);

  // Preview modal state
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'enhanced' | 'original'>('enhanced');

  // Step 4: Product Linking states
  const [actionChoice, setActionChoice] = useState<ActionChoice>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // New product compact form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('سجاد مودرن');
  const [newProductSubcategory, setNewProductSubcategory] = useState('سجاد صالون');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductType, setNewProductType] = useState('سجاد منسوج آلياً');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample catalog images for quick testing
  const SAMPLE_IMAGES = [
    {
      title: 'سجادة تبريز كلاسيك',
      url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'سجادة مودرن ناعمة',
      url: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'سجاد رول ممر',
      url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?q=80&w=800&auto=format&fit=crop',
    },
  ];

  // Derived filtered products for search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 10);
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.slug && p.slug.toLowerCase().includes(q)) ||
      (p.categoryId && p.categoryId.toLowerCase().includes(q)) ||
      Boolean((p as any).categoryName && (p as any).categoryName.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(selectedProductId));
  }, [products, selectedProductId]);

  // Current active step calculation
  const currentStep = useMemo(() => {
    if (!selectedImage) return 1;
    if (isProcessing) return 2;
    if (!currentJob?.enhancedImage) return 2;
    if (actionChoice || linkSuccess || createSuccess) return 4;
    return 3;
  }, [selectedImage, isProcessing, currentJob, actionChoice, linkSuccess, createSuccess]);

  // Handle file select
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    try {
      setIsUploading(true);
      setImageFileName(file.name);
      setCurrentJob(null);
      setActionChoice(null);
      setLinkSuccess(false);
      setCreateSuccess(false);

      // Instant local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary for reliable hosting
      const uploadRes = await uploadDirectToCloudinary(file);
      setSelectedImage(uploadRes.secure_url);
      setSelectedPublicId(uploadRes.public_id);
    } catch {
      // Fallback: keep local data url preview
    } finally {
      setIsUploading(false);
    }
  };

  // Run AI enhancement (No user settings required; handled automatically)
  const handleRunAiEnhancement = async () => {
    if (!selectedImage) return;

    try {
      setIsProcessing(true);
      setLinkSuccess(false);
      setCreateSuccess(false);

      const job = await aiImageService.enhanceImage({
        image: selectedImage,
        public_id: selectedPublicId,
        options: {
          cleanBackground: true,
          preserveTexture: true,
          reduceEmptySpace: true,
          lightingEnhance: true,
          aspectRatio: '4:3',
        },
      });

      setCurrentJob(job);
    } catch {
      // Error handled safely
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle resetting image
  const handleReset = () => {
    setSelectedImage(null);
    setImageFileName('');
    setSelectedPublicId(undefined);
    setCurrentJob(null);
    setActionChoice(null);
    setSelectedProductId('');
    setLinkSuccess(false);
    setCreateSuccess(false);
  };

  // Handle confirming link to existing product
  const handleConfirmLink = () => {
    if (!selectedProductId || !currentJob) return;
    const finalUrl = currentJob.enhancedImage || currentJob.originalImage;
    if (onAssignImageToProduct) {
      onAssignImageToProduct(selectedProductId, finalUrl);
    }
    setLinkSuccess(true);
  };

  // Handle creating new product
  const handleConfirmCreate = () => {
    if (!newProductName.trim()) return;
    setCreateSuccess(true);
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
              حوّل صور المنتجات إلى صور جاهزة للعرض في المتجر.
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
            <div className="space-y-4">
              {/* Clean Upload Dropzone */}
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
                  اسحب الصورة هنا أو اختر صورة من جهازك
                </p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold shadow-xs hover:bg-[#3D291D] transition-colors"
                >
                  اختيار صورة
                </button>
              </div>

              {/* Quick Sample Presets */}
              <div className="pt-2">
                <p className="text-xs font-bold text-[#8C7A6B] mb-2">
                  أو جرّب صورة تجريبية من الكتالوج:
                </p>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                  {SAMPLE_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedImage(sample.url);
                        setImageFileName(sample.title);
                        setCurrentJob(null);
                        setActionChoice(null);
                        setLinkSuccess(false);
                        setCreateSuccess(false);
                      }}
                      className="group rounded-xl border border-[#EAE3D8] hover:border-[#241710] overflow-hidden text-right transition-all bg-[#FAF8F5]/60 hover:bg-white p-1.5 flex flex-col gap-1.5"
                    >
                      <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-stone-100">
                        <Image
                          src={sample.url}
                          alt={sample.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#241710] truncate px-1">
                        {sample.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
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
                    الصورة الأصلية جاهزة للمعالجة التلقائية
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
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading}
          />
        </div>
      </div>

      {/* ================= STEP 2: AI PROCESSING ACTION ================= */}
      {selectedImage && !currentJob?.enhancedImage && (
        <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs p-6 text-center space-y-4">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF5EB] border border-[#E8DEC0] text-[#A27B5C] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-[#A27B5C]" />
            </div>
            <h3 className="text-base font-black text-[#241710]">
              معالجة الصورة بالذكاء الاصطناعي
            </h3>
            <p className="text-xs text-[#8C7A6B]">
              سيقوم النظام آلياً بتفريغ الخلفية، ضبط الإضاءة، وإبراز تفاصيل المنتج بأعلى دقة.
            </p>
          </div>

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
                  <span>جاري تحسين الصورة...</span>
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
      {currentJob?.enhancedImage && (
        <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#EAE3D8] bg-[#FAF8F5]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                ✓
              </span>
              <div>
                <h2 className="text-sm font-black text-[#241710]">الصورة الناتجة</h2>
                <p className="text-[11px] text-[#8C7A6B]">
                  تم التحسين وتجهيز الصورة للعرض في المتجر
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
                    src={previewMode === 'enhanced' ? currentJob.enhancedImage : currentJob.originalImage}
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
                      <span>إعادة التحسين</span>
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
      {currentJob?.enhancedImage && (
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
                setCreateSuccess(false);
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
                  استخدم الصورة لمنتج موجود بالفعل في المتجر
                </p>
              </div>
            </button>

            {/* OPTION 2: CREATE NEW PRODUCT */}
            <button
              type="button"
              onClick={() => {
                setActionChoice('create_new');
                setLinkSuccess(false);
                setCreateSuccess(false);
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
                  أنشئ منتجًا جديدًا باستخدام الصورة الناتجة
                </p>
              </div>
            </button>
          </div>

          {/* ================= OPTION 1 WORKFLOW: LINK EXISTING ================= */}
          {actionChoice === 'link_existing' && (
            <div className="pt-4 border-t border-[#EAE3D8] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-black text-[#241710]">
                  اختر المنتج
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

              {/* Confirmation Notice & CTA */}
              {selectedProduct && (
                <div className="p-4 rounded-xl border border-[#E8DEC0] bg-[#FAF5EB] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-[#241710]">
                    <Layers className="w-4 h-4 text-[#A27B5C]" />
                    <span>سيتم استخدام الصورة الناتجة كصورة للمنتج المحدد.</span>
                  </div>

                  <p className="text-xs text-[#5C4A3E]">
                    المنتج المختار: <strong>{selectedProduct.name}</strong>
                  </p>

                  {linkSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تم ربط الصورة بنجاح وستظهر كصورة أساسية للمنتج!</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirmLink}
                      className="px-5 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      <span>تأكيد الربط</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
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
                {/* Product Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#241710]">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="مثال: سجادة كلاسيك ملكي ناعمة"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#241710]">
                    التصنيف
                  </label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  >
                    <option value="سجاد مودرن">سجاد مودرن</option>
                    <option value="سجاد كلاسيك">سجاد كلاسيك</option>
                    <option value="سجاد تركي">سجاد تركي</option>
                    <option value="سجاد صلاة">سجاد صلاة</option>
                    <option value="موكيت وممرات">موكيت وممرات</option>
                  </select>
                </div>

                {/* Subcategory */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#241710]">
                    التصنيف الفرعي
                  </label>
                  <select
                    value={newProductSubcategory}
                    onChange={(e) => setNewProductSubcategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  >
                    <option value="سجاد صالون">سجاد صالون</option>
                    <option value="سجاد غرف نوم">سجاد غرف نوم</option>
                    <option value="سجاد مدخل وممرات">سجاد مدخل وممرات</option>
                    <option value="سجاد أطفال">سجاد أطفال</option>
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  />
                </div>

                {/* Product Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#241710]">
                    نوع المنتج
                  </label>
                  <select
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
                  >
                    <option value="سجاد منسوج آلياً">سجاد منسوج آلياً</option>
                    <option value="سجاد يدوي فاخر">سجاد يدوي فاخر</option>
                    <option value="رول ممر بالمتر">رول ممر بالمتر</option>
                    <option value="جاهز للتسليم الفوري">جاهز للتسليم الفوري</option>
                  </select>
                </div>
              </div>

              {/* Informative Note */}
              <div className="p-3 rounded-xl border border-[#E8DEC0] bg-[#FAF5EB] text-xs text-[#241710] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#A27B5C] shrink-0" />
                <span className="font-bold">
                  الصورة الناتجة سيتم استخدامها كصورة المنتج الأساسية.
                </span>
              </div>

              {createSuccess ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    تم حفظ بيانات المنتج الجديد المبدئية بنجاح واعتماد الصورة الناتجة له!
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  disabled={!newProductName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-black transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إنشاء المنتج</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= ZOOM PREVIEW MODAL ================= */}
      {isZoomOpen && currentJob?.enhancedImage && (
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
                src={currentJob.enhancedImage}
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
