'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Sliders,
  Maximize2,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
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

export default function AiProductImageView({
  products,
  onAssignImageToProduct,
}: AiProductImageViewProps) {
  // Upload and job states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPublicId, setSelectedPublicId] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<AiImageJob | null>(null);
  const [assignedProductId, setAssignedProductId] = useState<string>('');
  const [assignedSuccess, setAssignedSuccess] = useState(false);

  // Enhancement options
  const [cleanBackground, setCleanBackground] = useState(true);
  const [preserveTexture, setPreserveTexture] = useState(true);
  const [reduceEmptySpace, setReduceEmptySpace] = useState(true);
  const [lightingEnhance, setLightingEnhance] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '1:1' | '16:9'>('4:3');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset demo carpet images for quick testing
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

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    try {
      setIsUploading(true);
      setAssignedSuccess(false);

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

  const handleRunAiEnhancement = async () => {
    if (!selectedImage) return;

    try {
      setIsProcessing(true);
      setAssignedSuccess(false);

      const job = await aiImageService.enhanceImage({
        image: selectedImage,
        public_id: selectedPublicId,
        productId: assignedProductId || undefined,
        options: {
          cleanBackground,
          preserveTexture,
          reduceEmptySpace,
          lightingEnhance,
          aspectRatio,
        },
      });

      setCurrentJob(job);
    } catch {
      // Error handled safely
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToProduct = () => {
    if (!currentJob || !assignedProductId || !onAssignImageToProduct) return;
    const finalUrl = currentJob.enhancedImage || currentJob.originalImage;
    onAssignImageToProduct(assignedProductId, finalUrl);
    setAssignedSuccess(true);
    setTimeout(() => setAssignedSuccess(false), 4000);
  };

  return (
    <div dir="rtl" className="space-y-6 text-right font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#241710] text-[#FAF5EB] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#EED8BE]" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
                استوديو معالجة صور المنتجات بالذكاء الاصطناعي
              </h1>
              <p className="text-xs text-[#8C7A6B] mt-0.5">
                تفريغ الخلفيات، تحسين إضاءة النسيج، وضبط الكادر لأعلى جاذبية بيعية بالمتجر.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Interactive Preview & Upload (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#EAE3D8] flex items-center justify-between bg-[#FAF8F5]/60">
              <span className="text-xs font-black text-[#241710] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#A27B5C]" />
                <span>لوحة المعاينة والتحسين</span>
              </span>
              {currentJob && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>تمت المعالجة بنجاح</span>
                </span>
              )}
            </div>

            {/* Canvas Area */}
            <div className="p-5">
              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D8CEBF] hover:border-[#241710] rounded-2xl p-8 sm:p-12 text-center bg-[#FAF8F5]/40 hover:bg-[#FAF8F5] cursor-pointer transition-all flex flex-col items-center justify-center min-h-[300px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#F5EFE6] text-[#A27B5C] flex items-center justify-center mb-3">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-black text-[#241710] mb-1">
                    اسحب وأفلت صورة المنتج هنا
                  </h3>
                  <p className="text-xs text-[#8C7A6B] max-w-sm mb-4">
                    يدعم صور السجاد بصيغ JPG، PNG، WEBP حتى 10 ميجابايت بدقة عالية
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold shadow-xs hover:bg-[#3D291D] transition-colors"
                  >
                    اختيار صورة من جهازك
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Before / After Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Original Image */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#8C7A6B]">
                        <span>الصورة الأصلية</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                          قبل
                        </span>
                      </div>
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-[#EAE3D8] bg-stone-100">
                        <Image
                          src={selectedImage}
                          alt="الصورة الأصلية"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    {/* AI Processed Image */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#241710]">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#A27B5C]" />
                          <span>معالجة استوديو الذكاء الاصطناعي</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#241710] text-[#EED8BE]">
                          بعد
                        </span>
                      </div>
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-[#241710]/30 bg-stone-50 shadow-inner">
                        {isProcessing ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white backdrop-blur-xs gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#EED8BE]" />
                            <span className="text-xs font-bold">جاري المعالجة بالذكاء الاصطناعي...</span>
                          </div>
                        ) : currentJob?.enhancedImage ? (
                          <Image
                            src={currentJob.enhancedImage}
                            alt="الصورة المحسنة"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-xs text-[#8C7A6B] bg-stone-50">
                            <span>اضغط على «بدء تحسين الصورة» لمعاينة النتيجة</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Change / Reset Image */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-[#A27B5C] hover:underline flex items-center gap-1"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>تغيير الصورة المحددة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setCurrentJob(null);
                        setSelectedPublicId(undefined);
                      }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      إلغاء وتفريغ
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

          {/* Quick Preset Samples */}
          <div className="bg-white rounded-2xl border border-[#EAE3D8] p-4 space-y-3">
            <span className="text-xs font-black text-[#241710] block">
              أو جرّب نماذج سريعة من الكتالوج:
            </span>
            <div className="grid grid-cols-3 gap-3">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImage(sample.url);
                    setCurrentJob(null);
                    setAssignedSuccess(false);
                  }}
                  className="group rounded-xl border border-[#EAE3D8] hover:border-[#241710] overflow-hidden text-right transition-all bg-[#FAF8F5]/60 hover:bg-white"
                >
                  <div className="relative aspect-4/3 overflow-hidden">
                    <Image
                      src={sample.url}
                      alt={sample.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2">
                    <span className="text-[11px] font-bold text-[#241710] line-clamp-1">
                      {sample.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Studio Controls & Product Assignment (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Controls Card */}
          <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#EAE3D8]">
              <Sliders className="w-4 h-4 text-[#A27B5C]" />
              <h2 className="text-sm font-black text-[#241710]">إعدادات المعالجة الذكية</h2>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#EAE3D8] hover:bg-[#FAF8F5] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={cleanBackground}
                  onChange={(e) => setCleanBackground(e.target.checked)}
                  className="mt-0.5 rounded text-[#241710]"
                />
                <div>
                  <span className="text-xs font-bold text-[#241710] block">عزل وتنسيق الخلفية المحايدة</span>
                  <span className="text-[10px] text-[#8C7A6B]">إزالة الفوضى المحيطة واستبدالها بخلفية استوديو نقية</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#EAE3D8] hover:bg-[#FAF8F5] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={preserveTexture}
                  onChange={(e) => setPreserveTexture(e.target.checked)}
                  className="mt-0.5 rounded text-[#241710]"
                />
                <div>
                  <span className="text-xs font-bold text-[#241710] block">الحفاظ على ملمس وتفاصيل النسيج</span>
                  <span className="text-[10px] text-[#8C7A6B]">حماية خيوط الصوف والحرير والنقوش الأصلية من التشوه</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#EAE3D8] hover:bg-[#FAF8F5] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={reduceEmptySpace}
                  onChange={(e) => setReduceEmptySpace(e.target.checked)}
                  className="mt-0.5 rounded text-[#241710]"
                />
                <div>
                  <span className="text-xs font-bold text-[#241710] block">تقليل المساحات الفارغة وضبط الكادر</span>
                  <span className="text-[10px] text-[#8C7A6B]">توسيط المنتج بذكاء لملء كارت العرض في واجهة المتجر</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#EAE3D8] hover:bg-[#FAF8F5] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={lightingEnhance}
                  onChange={(e) => setLightingEnhance(e.target.checked)}
                  className="mt-0.5 rounded text-[#241710]"
                />
                <div>
                  <span className="text-xs font-bold text-[#241710] block">تحسين الإضاءة وتدرج الألوان الطبيعية</span>
                  <span className="text-[10px] text-[#8C7A6B]">موازنة السطوع مع الحفاظ على درجات الألوان الفعلية</span>
                </div>
              </label>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5 pt-2 border-t border-[#EAE3D8]/70">
              <label className="block text-xs font-bold text-[#241710]">
                أبعاد الصورة الناتجة:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['4:3', '1:1', '16:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      aspectRatio === ratio
                        ? 'bg-[#241710] text-[#FAF5EB] border-[#241710] shadow-xs'
                        : 'bg-white text-[#5C4A3E] border-[#EAE3D8] hover:border-[#A27B5C]'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              type="button"
              disabled={!selectedImage || isProcessing}
              onClick={handleRunAiEnhancement}
              className="w-full py-3 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold transition-all shadow-xs disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#EED8BE]" />
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#EED8BE]" />
                  <span>بدء تحسين الصورة بالذكاء الاصطناعي</span>
                </>
              )}
            </button>
          </div>

          {/* Assign To Product Card */}
          <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs p-5 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#EAE3D8]">
              <Package className="w-4 h-4 text-[#A27B5C]" />
              <h2 className="text-sm font-black text-[#241710]">ربط النتيجة بمنتج في المتجر</h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#241710]">
                اختر المنتج المراد تحديث صوره:
              </label>
              <select
                value={assignedProductId}
                onChange={(e) => setAssignedProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-white text-[#241710] focus:outline-none focus:border-[#241710]"
              >
                <option value="">-- حدد منتجاً من القائمة --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price} ج.م)
                  </option>
                ))}
              </select>
            </div>

            {assignedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">تم ربط الصورة بنجاح وستظهر كغلاف للمنتج!</span>
              </div>
            )}

            <button
              type="button"
              disabled={!currentJob || !assignedProductId}
              onClick={handleApplyToProduct}
              className="w-full py-2.5 rounded-xl bg-[#FAF5EB] hover:bg-[#F2E8D7] border border-[#E8DEC0] text-[#241710] text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-[#A27B5C]" />
              <span>اعتماد الصورة وإضافتها للمنتج المختار</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
