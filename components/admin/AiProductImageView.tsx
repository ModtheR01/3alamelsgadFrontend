'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { AiImageJob } from '@/types/aiImage';
import { aiImageService } from '@/lib/api/services/aiImageService';
import {
  Sparkles,
  Upload,
  Check,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Info,
  Layers,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import CloudinaryImageField from '@/components/CloudinaryImageField';

interface AiProductImageViewProps {
  products: Product[];
  onAssignImageToProduct?: (productId: string, imageUrl: string) => Promise<void>;
}

export default function AiProductImageView({
  products,
  onAssignImageToProduct,
}: AiProductImageViewProps) {
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // AI Options
  const [cleanBackground, setCleanBackground] = useState(true);
  const [preserveTexture, setPreserveTexture] = useState(true);
  const [reduceEmptySpace, setReduceEmptySpace] = useState(true);
  const [lightingEnhance, setLightingEnhance] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '1:1' | '16:9'>('4:3');

  // Job Processing State
  const [currentJob, setCurrentJob] = useState<AiImageJob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);

  // Sample carpets for instant preview demo
  const sampleImages = [
    'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85',
  ];

  const handleStartProcessing = async () => {
    if (!originalImageUrl) {
      setErrorMessage('يرجى رفع أو اختيار صورة المنتج الأصلية أولاً.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setApprovalSuccess(null);

    try {
      const job = await aiImageService.enhanceImage({
        image: originalImageUrl,
        productId: selectedProductId || undefined,
        options: {
          cleanBackground,
          preserveTexture,
          reduceEmptySpace,
          aspectRatio,
          lightingEnhance,
        },
      });

      setCurrentJob(job);
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر معالجة الصورة عبر الذكاء الاصطناعي.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveImage = async () => {
    if (!currentJob) return;
    setIsApproving(true);
    try {
      await aiImageService.approveImage(currentJob.id, selectedProductId || undefined);

      if (selectedProductId && onAssignImageToProduct && currentJob.enhancedImage) {
        await onAssignImageToProduct(selectedProductId, currentJob.enhancedImage);
      }

      setCurrentJob({ ...currentJob, approved: true });
      setApprovalSuccess('تم اعتماد الصورة وتعيينها كصورة رئيسية للمنتج بنجاح.');
      setTimeout(() => setApprovalSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'تعذر اعتماد الصورة');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
              استوديو تحسين صور المنتجات (AI)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
              معالجة احترافية
            </span>
          </div>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            تحسين صور السجاد الحقيقية: إزالة وتنسيق الخلفية، تقليص الهوامش الفارغة، وإبراز تفاصيل النسيج والألوان.
          </p>
        </div>
      </div>

      {approvalSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{approvalSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Upload & Select Source */}
          <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#241710] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#A27B5C]" />
              <span>١. اختيار أو رفع صورة السجاد</span>
            </h3>

            <CloudinaryImageField
              label="رفع صورة المنتج من جهازك"
              value={originalImageUrl}
              onChange={setOriginalImageUrl}
              folder="alamelsgad-ai-studio"
            />

            {/* Quick Sample Selector */}
            <div className="space-y-1.5 pt-2 border-t border-[#FAF5EB]">
              <label className="text-[11px] font-bold text-[#8C7A6B] block">
                أو اختر صورة تجريبية فورية:
              </label>
              <div className="flex gap-2">
                {sampleImages.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setOriginalImageUrl(s)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      originalImageUrl === s ? 'border-[#241710] ring-2 ring-[#241710]/20' : 'border-[#EAE3D8] hover:border-[#A27B5C]'
                    }`}
                  >
                    <Image src={s} alt="عينة" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Assignment Dropdown */}
            <div className="space-y-1.5 pt-2 border-t border-[#FAF5EB]">
              <label className="text-xs font-bold text-[#241710] block">
                ربط الصورة بمنتج في المتجر (اختياري)
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
              >
                <option value="">-- بدون ربط مسبق (معاينة عامة) --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Enhancement Options */}
          <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#241710] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#A27B5C]" />
              <span>٢. خيارات التحسين بالذكاء الاصطناعي</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] cursor-pointer hover:bg-[#F5EFE6] transition-colors">
                <span className="font-bold text-[#241710]">عزل وتنسيق الخلفية المحايدة</span>
                <input
                  type="checkbox"
                  checked={cleanBackground}
                  onChange={(e) => setCleanBackground(e.target.checked)}
                  className="rounded text-[#241710]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] cursor-pointer hover:bg-[#F5EFE6] transition-colors">
                <span className="font-bold text-[#241710]">الحفاظ على ملمس وتفاصيل النسيج</span>
                <input
                  type="checkbox"
                  checked={preserveTexture}
                  onChange={(e) => setPreserveTexture(e.target.checked)}
                  className="rounded text-[#241710]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] cursor-pointer hover:bg-[#F5EFE6] transition-colors">
                <span className="font-bold text-[#241710]">تقليص المساحات الفارغة وضبط الكادر</span>
                <input
                  type="checkbox"
                  checked={reduceEmptySpace}
                  onChange={(e) => setReduceEmptySpace(e.target.checked)}
                  className="rounded text-[#241710]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] cursor-pointer hover:bg-[#F5EFE6] transition-colors">
                <span className="font-bold text-[#241710]">تحسين الإضاءة وتدرج الألوان الطبيعية</span>
                <input
                  type="checkbox"
                  checked={lightingEnhance}
                  onChange={(e) => setLightingEnhance(e.target.checked)}
                  className="rounded text-[#241710]"
                />
              </label>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5 pt-2 border-t border-[#FAF5EB]">
              <label className="text-xs font-bold text-[#241710] block">
                أبعاد الصورة الناتجة:
              </label>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {(['4:3', '1:1', '16:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      aspectRatio === ratio
                        ? 'bg-[#241710] text-[#FAF5EB] border-[#241710]'
                        : 'bg-[#FAF8F5] text-[#5C4A3E] border-[#EAE3D8] hover:bg-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleStartProcessing}
              disabled={isProcessing || !originalImageUrl}
              className="w-full py-3 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#EED8BE]" />
                  <span>جاري معالجة الصورة بالذكاء الاصطناعي...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#EED8BE]" />
                  <span>بدء معالجة وتحسين الصورة الآن</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview & Results Column */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF5EB]">
              <h3 className="text-sm font-bold text-[#241710] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#A27B5C]" />
                <span>المعاينة المباشرة (قبل وبعد التحسين)</span>
              </h3>

              {currentJob?.enhancedImage && (
                <button
                  onClick={handleApproveImage}
                  disabled={isApproving || currentJob.approved}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{currentJob.approved ? 'تم الاعتماد للمتجر' : 'اعتماد وتطبيق على المنتج'}</span>
                </button>
              )}
            </div>

            {/* Side-by-Side Images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#8C7A6B] block">الصورة الأصلية:</span>
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] flex items-center justify-center">
                  {originalImageUrl ? (
                    <Image
                      src={originalImageUrl}
                      alt="الأصلية"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-center p-4 text-xs text-[#8C7A6B]">
                      اختر أو ارفع صورة لعرض المعاينة
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#A27B5C] block">النتيجة المحسّنة بالذكاء الاصطناعي:</span>
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] flex items-center justify-center">
                  {currentJob?.enhancedImage ? (
                    <Image
                      src={currentJob.enhancedImage}
                      alt="المحسنة"
                      fill
                      className="object-cover"
                    />
                  ) : isProcessing ? (
                    <div className="text-center p-4 space-y-2 text-xs text-[#8C7A6B]">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#A27B5C] mx-auto" />
                      <p>جاري ضبط الكادر وعزل الخلفية...</p>
                    </div>
                  ) : (
                    <div className="text-center p-4 text-xs text-[#8C7A6B]">
                      ستظهر النتيجة المعالجة هنا بعد الضغط على «بدء معالجة وتحسين الصورة»
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata Badges if job finished */}
            {currentJob && (
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-[#241710]">
                  <span>معرف العملية: #{currentJob.id}</span>
                  <span className="text-emerald-700">مكتملة بنجاح</span>
                </div>
                <p className="text-[11px] text-[#8C7A6B]">
                  الأبعاد المعتمدة: {aspectRatio} · تمت معالجة عزل الخلفية وإبراز كثافة نسيج السجاد.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
