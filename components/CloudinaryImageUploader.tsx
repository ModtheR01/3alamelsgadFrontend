'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  X,
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  ExternalLink,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import {
  uploadDirectToCloudinary,
  cloudinaryConfig,
  CloudinaryUploadResult,
} from '@/lib/api/cloudinary';
import { productImageService } from '@/lib/api/services/productImageService';
import { BackendProductImage } from '@/types/product';

interface CloudinaryImageUploaderProps {
  productId?: string | number;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export default function CloudinaryImageUploader({
  productId,
  images = [],
  onImagesChange,
  maxImages = 8,
  className = '',
}: CloudinaryImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusStep, setStatusStep] = useState<'idle' | 'uploading' | 'saving_metadata' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendImages, setBackendImages] = useState<BackendProductImage[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  // Cloudinary settings state for admin inspection / override
  const [customCloudName, setCustomCloudName] = useState(cloudinaryConfig.getCloudName());
  const [customPreset, setCustomPreset] = useState(cloudinaryConfig.getUploadPreset());
  const [configSaved, setConfigSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load backend ProductImage records if editing an existing numeric product
  const numericProductId = typeof productId === 'number'
    ? productId
    : (productId && !isNaN(Number(productId)) ? Number(productId) : undefined);

  useEffect(() => {
    if (!numericProductId) return;
    let isCancelled = false;

    productImageService.getProductImages(numericProductId)
      .then((list) => {
        if (isCancelled) return;
        setBackendImages(list);
        if (list.length > 0) {
          const sortedUrls = [...list]
            .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order)
            .map((img) => img.image);
          onImagesChange(sortedUrls);
        }
      })
      .catch(() => {
        // Handled silently
      });

    return () => {
      isCancelled = true;
    };
  }, [numericProductId, onImagesChange]);

  // Handle single or multiple file upload
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (fileArray.length === 0) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP, AVIF, or GIF).');
      return;
    }

    if (images.length + fileArray.length > maxImages) {
      setErrorMessage(`Maximum limit of ${maxImages} images reached. Remove some images before adding more.`);
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(0);
    setStatusStep('uploading');
    setStatusMessage('Uploading directly to Cloudinary...');

    try {
      const currentList = [...images];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setStatusMessage(
          fileArray.length > 1
            ? `Uploading directly to Cloudinary (${i + 1}/${fileArray.length})...`
            : 'Uploading directly to Cloudinary...'
        );

        // 1. DIRECT-TO-CLOUDINARY UPLOAD (Browser -> Cloudinary, no backend proxy)
        const cldResult: CloudinaryUploadResult = await uploadDirectToCloudinary(file, {
          folder: 'tocco/products',
          onProgress: (percent) => {
            setUploadProgress(percent);
          },
        });

        const uploadedUrl = cldResult.secure_url || cldResult.url;
        const isPrimary = currentList.length === 0;

        // 2. BACKEND METADATA SYNCHRONIZATION
        // Send resulting Cloudinary metadata to backend to create ProductImage record
        if (numericProductId) {
          setStatusStep('saving_metadata');
          setStatusMessage('Recording image metadata in backend...');
          try {
            const createdBackendImg = await productImageService.createProductImage({
              product: numericProductId,
              image: uploadedUrl,
              public_id: cldResult.public_id,
              is_primary: isPrimary,
              sort_order: currentList.length,
            });
            setBackendImages((prev) => [...prev, createdBackendImg]);
          } catch {
            // Non-blocking: Still keep local image URL in product
          }
        }

        currentList.push(uploadedUrl);
      }

      onImagesChange(currentList);
      setStatusStep('success');
      const hasSimulated = currentList.some((url) => url.startsWith('data:'));
      if (hasSimulated) {
        setStatusMessage('Image stored locally (Simulation Mode). Enter Cloudinary credentials to upload to your live account.');
      } else {
        setStatusMessage('Direct Cloudinary upload & backend sync complete!');
      }
      setTimeout(() => {
        setStatusStep('idle');
        setStatusMessage('');
      }, 4500);
    } catch (err: unknown) {
      setStatusStep('error');
      const errText = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setErrorMessage(errText);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Set primary image
  const handleSetPrimary = async (index: number) => {
    if (index === 0) return; // already primary
    const targetUrl = images[index];
    const newImages = [targetUrl, ...images.filter((_, i) => i !== index)];
    onImagesChange(newImages);

    // If backend record exists, call setPrimaryImage
    const matchedBackend = backendImages.find((img) => img.image === targetUrl);
    if (matchedBackend) {
      try {
        await productImageService.setPrimaryImage(matchedBackend.id);
        setBackendImages((prev) =>
          prev.map((img) => ({
            ...img,
            is_primary: img.id === matchedBackend.id,
          }))
        );
      } catch {
        // Handled silently
      }
    }
  };

  // Remove image
  const handleRemoveImage = async (index: number) => {
    const targetUrl = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    const matchedBackend = backendImages.find((img) => img.image === targetUrl);
    if (matchedBackend) {
      try {
        await productImageService.deleteProductImage(matchedBackend.id);
        setBackendImages((prev) => prev.filter((img) => img.id !== matchedBackend.id));
      } catch {
        // Handled silently
      }
    }
  };

  const saveCustomConfig = () => {
    cloudinaryConfig.setCloudName(customCloudName.trim());
    cloudinaryConfig.setUploadPreset(customPreset.trim());
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header & Direct Upload Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-[#1C1A19]">
              Product Images & Direct Cloudinary Storage
            </label>
            {customCloudName.trim() && customPreset.trim() ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Cloudinary Live
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Local Simulation
              </span>
            )}
          </div>
          <p className="text-xs text-[#736B63] mt-0.5">
            Images upload directly from the browser to Cloudinary. Server only stores metadata.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-1.5 text-xs text-[#736B63] hover:text-[#1C1A19] px-2.5 py-1 rounded-md border border-[#EAE4DC] hover:border-[#D8CEBF] transition-colors"
          title="Cloudinary Direct Upload Settings"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{showConfig ? 'Hide Config' : 'Cloudinary Config'}</span>
        </button>
      </div>

      {/* Cloudinary Config Accordion */}
      {showConfig && (
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4DC] text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#1C1A19]">Cloudinary Direct Upload Credentials</span>
            <span className="px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#736B63] text-[10px] font-mono">
              Folder: tocco/products
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#736B63] mb-1">Cloud Name</label>
              <input
                type="text"
                placeholder="e.g. tocco-design"
                value={customCloudName}
                onChange={(e) => setCustomCloudName(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#D8CEBF] bg-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[#736B63] mb-1">Upload Preset (Unsigned)</label>
              <input
                type="text"
                placeholder="e.g. tocco_unsigned"
                value={customPreset}
                onChange={(e) => setCustomPreset(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#D8CEBF] bg-white font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-[#8C827A]">
              Note: If left empty in dev mode, uploads gracefully run with simulated Cloudinary storage.
            </p>
            <button
              type="button"
              onClick={saveCustomConfig}
              className="px-3 py-1.5 rounded-md bg-[#1C1A19] text-white text-xs hover:bg-[#333] transition-colors"
            >
              {configSaved ? 'Saved!' : 'Save Preset'}
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#1C1A19] bg-[#F5F2EB]'
            : 'border-[#D8CEBF] hover:border-[#1C1A19] bg-[#FAF8F5]'
        } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <div className="w-full max-w-xs space-y-3 py-2">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#1C1A19]">
                <Loader2 className="w-4 h-4 animate-spin text-[#1C1A19]" />
                <span>{statusMessage || 'Uploading directly to Cloudinary...'}</span>
              </div>
              <div className="w-full bg-[#EAE4DC] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#1C1A19] h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#736B63] font-mono">
                <span>Progress</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-[#EAE4DC] flex items-center justify-center text-[#1C1A19]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1C1A19]">
                  Click to select images or drag and drop here
                </p>
                <p className="text-xs text-[#736B63] mt-1">
                  Supports WebP, PNG, JPEG, AVIF up to 10MB per file
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EAE4DC] text-[11px] text-[#736B63]">
                <span>Direct-to-Cloudinary</span>
                <span>•</span>
                <span>{images.length} / {maxImages} images</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {statusStep === 'success' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="flex items-start justify-between gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Image Upload Notice</p>
              <p className="mt-0.5 text-red-700">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-red-600 hover:text-red-900 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Image Gallery & Management */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-[#736B63]">
            <span>Attached Pieces ({images.length})</span>
            <span className="text-[11px]">First image serves as Primary / Cover</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((url, idx) => {
              const isPrimary = idx === 0;
              const backendRecord = backendImages.find((b) => b.image === url);

              return (
                <div
                  key={`${url}-${idx}`}
                  className={`group relative rounded-xl overflow-hidden border bg-white aspect-square shadow-sm transition-all ${
                    isPrimary ? 'border-[#1C1A19] ring-2 ring-[#1C1A19]/10' : 'border-[#EAE4DC]'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Product preview ${idx + 1}`}
                    fill
                    className="object-cover"
                  />

                  {/* Primary Badge */}
                  {isPrimary && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-[#1C1A19] text-white text-[10px] font-medium tracking-wider uppercase flex items-center gap-1 shadow-md">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Primary
                    </div>
                  )}

                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-[#1C1A19] shadow transition-transform hover:scale-105"
                        title="Set as Primary Cover Image"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded-full bg-white/90 hover:bg-white text-red-600 shadow transition-transform hover:scale-105"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-white/90 hover:bg-white text-[#1C1A19] shadow transition-transform hover:scale-105"
                      title="View full image in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Backend ID tag if registered */}
                  {backendRecord && (
                    <div className="absolute bottom-1 right-1 z-10 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                      #{backendRecord.id}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
