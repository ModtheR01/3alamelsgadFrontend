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
  ArrowRight,
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
      setErrorMessage('Please upload or select an original product photo first.');
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
      setErrorMessage(err?.message || 'Failed to process AI image.');
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
      setApprovalSuccess('Image approved and configured for storefront product display.');
      setTimeout(() => setApprovalSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to approve image');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#241710] tracking-tight">
              AI Product Studio & Image Processing
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A27B5C]/15 text-[#865F3E]">
              AI Studio Engine
            </span>
          </div>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            Enhance real carpet photos: clean backgrounds, reduce framing margins, and preserve woven textures.
          </p>
        </div>
      </div>

      {/* Backend API Connection Notice */}
      <div className="p-4 rounded-2xl bg-[#FAF5EB] border border-[#E8DEC0] text-[#5C4A3E] text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-[#A27B5C] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#241710]">
            Backend API Architecture Ready: <span className="font-mono text-[11px]">POST /api/ai/enhance-product-image/</span>
          </p>
          <p className="text-[11px] leading-relaxed text-[#736357]">
            This section uses the modular <span className="font-mono">aiImageService</span> abstraction layer. When your Django REST API endpoint is deployed, images will stream directly to your server-side models while preserving all client controls and side-by-side verification.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {approvalSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{approvalSuccess}</span>
        </div>
      )}

      {/* Main Studio Workspace: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Options (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Step 1: Upload Original Image */}
          <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A27B5C]">
                Step 1: Original Product Photo
              </span>
            </div>

            {/* Live Upload Component */}
            <div className="space-y-3">
              <CloudinaryImageField
                label="Upload Original Photo"
                value={originalImageUrl}
                onChange={(url) => setOriginalImageUrl(url)}
                folder="alamelsgad-ai-originals"
              />

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={originalImageUrl}
                  onChange={(e) => setOriginalImageUrl(e.target.value)}
                  placeholder="Or paste original photo URL..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5]"
                />
              </div>

              {/* Sample Quick-Picks */}
              <div>
                <span className="text-[10px] text-[#8C7A6B] block mb-1.5 font-medium">
                  Or select a sample carpet from archive:
                </span>
                <div className="flex gap-2">
                  {sampleImages.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setOriginalImageUrl(s)}
                      className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#EAE3D8] hover:border-[#241710] focus:ring-2 focus:ring-[#241710] shrink-0"
                    >
                      <Image src={s} alt="sample" fill className="object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Product Association */}
            <div className="pt-2 border-t border-[#F5EFE6]">
              <label className="block text-xs font-bold text-[#241710] mb-1">
                Assign to Catalog Product (Optional)
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
              >
                <option value="">-- Standalone Gallery Image --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: AI Parameters & Options */}
          <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A27B5C]">
              Step 2: Enhancement Rules & Preservations
            </span>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={cleanBackground}
                  onChange={(e) => setCleanBackground(e.target.checked)}
                  className="mt-0.5 rounded text-[#241710]"
                />
                <div>
                  <span className="font-bold text-[#241710] block">Clean & Consistent Studio Backdrop</span>
                  <span className="text-[11px] text-[#8C7A6B]">Removes showroom floor glare and distractions.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={preserveTexture}
                  onChange={(e) => setPreserveTexture(e.target.checked)}
                  className="mt-0.5 rounded text-[#241710]"
                />
                <div>
                  <span className="font-bold text-[#241710] block">Strict Texture & Fiber Preservation</span>
                  <span className="text-[11px] text-[#8C7A6B]">
                    Locks knots, fringes, pile density, and original silk/wool sheen.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={reduceEmptySpace}
                  onChange={(e) => setReduceEmptySpace(e.target.checked)}
                  className="mt-0.5 rounded text-[#241710]"
                />
                <div>
                  <span className="font-bold text-[#241710] block">Crop & Reduce Empty Void Framing</span>
                  <span className="text-[11px] text-[#8C7A6B]">
                    Centers the carpet geometry directly to maximize mobile screen presence.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={lightingEnhance}
                  onChange={(e) => setLightingEnhance(e.target.checked)}
                  className="mt-0.5 rounded text-[#241710]"
                />
                <div>
                  <span className="font-bold text-[#241710] block">Soft Architectural Studio Lighting</span>
                  <span className="text-[11px] text-[#8C7A6B]">
                    Balances shadows for true-to-life e-commerce representation.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessing || !originalImageUrl}
                onClick={handleStartProcessing}
                className="w-full py-3 rounded-xl bg-[#241710] text-white hover:bg-[#3D281C] text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#EED8BE]" />
                    <span>Processing with AI Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#EED8BE]" />
                    <span>Process & Enhance Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview, Comparison & Approval (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A27B5C]">
                Step 3 & 4: Preview & Side-by-Side Verification
              </span>
              {currentJob?.status === 'completed' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Ready for Approval
                </span>
              )}
            </div>

            {/* Side-by-Side Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#5C4A3E] block">Original Photo</span>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] flex items-center justify-center">
                  {originalImageUrl ? (
                    <Image
                      src={originalImageUrl}
                      alt="Original product photo"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs text-[#8C7A6B]">Upload an image to start</span>
                  )}
                </div>
              </div>

              {/* Enhanced Output Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#241710] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#A27B5C]" />
                  <span>Enhanced AI Studio Output</span>
                </span>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] flex items-center justify-center">
                  {isProcessing ? (
                    <div className="text-center space-y-2 p-4">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#A27B5C] mx-auto" />
                      <p className="text-xs font-bold text-[#241710]">Generating Studio Look...</p>
                      <p className="text-[10px] text-[#8C7A6B]">Cleaning background & balancing light</p>
                    </div>
                  ) : currentJob?.enhancedImage ? (
                    <>
                      <Image
                        src={currentJob.enhancedImage}
                        alt="Enhanced AI product output"
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {currentJob.approved && (
                        <div className="absolute top-2 end-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3" /> Approved
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-[#8C7A6B]">Click &quot;Process&quot; to preview enhancement</span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 5 & 6: Approval Box */}
            {currentJob?.status === 'completed' && (
              <div className="pt-4 border-t border-[#EAE3D8] p-4 rounded-xl bg-[#FAF8F5] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#241710]">Approval & Storefront Deployment</h4>
                    <p className="text-[11px] text-[#8C7A6B]">
                      Verify that colors and weaving authenticity are 100% accurate before approving.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isApproving || currentJob.approved}
                    onClick={handleApproveImage}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentJob.approved
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {isApproving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>{currentJob.approved ? 'Approved for Store' : 'Approve & Use Image'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
