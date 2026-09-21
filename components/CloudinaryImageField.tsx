'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import Image from '@/components/SafeImage';
import {
  CloudinaryUploadResult,
  uploadDirectToCloudinary,
} from '@/lib/api/cloudinary';

interface CloudinaryImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUploadResult?: (result: CloudinaryUploadResult) => void;
  required?: boolean;
  folder?: string;
}

export default function CloudinaryImageField({
  label,
  value,
  onChange,
  onUploadResult,
  required = false,
  folder,
}: CloudinaryImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const result = await uploadDirectToCloudinary(file, { folder });
      onChange(result.secure_url || result.url);
      onUploadResult?.(result);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[#1C1A19] mb-1">
          {label}{required ? <span className="text-rose-600"> *</span> : null}
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#D8CEBF] bg-[#FAF8F5] px-3 py-2 text-xs text-[#1C1A19] hover:bg-[#F1ECE4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {isUploading ? 'Uploading' : 'Upload'}
        </button>
      </div>
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[#EAE4DC] bg-[#FAF8F5]">
        {value ? (
          <>
            <Image
              src={value}
              alt={`${label} preview`}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1C1A19] shadow-sm hover:bg-white"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#736B63] disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
            <span className="text-xs uppercase tracking-wider">
              {isUploading ? 'Uploading image' : 'Upload image'}
            </span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      {error ? <p className="mt-1 text-[11px] text-rose-600">{error}</p> : null}
    </div>
  );
}
