'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
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
    <div>
      <label className="block text-[#1C1A19] mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] px-3 text-xs text-[#1C1A19] hover:bg-[#F1ECE4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {isUploading ? 'Uploading' : 'Upload'}
        </button>
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
