'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToccoStore } from '@/lib/store';
import { normalizeApiError } from '@/lib/api/errors';
import { customDesignService } from '@/lib/api/services/customDesignService';
import { uploadDirectToCloudinary } from '@/lib/api/cloudinary';
import { toWhatsAppNumber } from '@/lib/utils';
import { CustomDesignRequestCreate, CustomDesignRequestType } from '@/types/customDesign';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';

interface CustomDesignRequestFormProps {
  requestType: CustomDesignRequestType;
}

const MAX_IMAGES = 10;

export default function CustomDesignRequestForm({ requestType }: CustomDesignRequestFormProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { navigateTo, settings } = useToccoStore();
  const isBusiness = requestType === 'BUSINESS';
  const [title, setTitle] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingReferences, setIsUploadingReferences] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachmentWarning, setAttachmentWarning] = useState<string | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestLabel = isBusiness ? 'business project request' : 'custom design request';

  useEffect(() => {
    if (submittedRequestId === null) return;
    const redirectTimer = window.setTimeout(() => navigateTo('home'), 5000);
    return () => window.clearTimeout(redirectTimer);
  }, [submittedRequestId, navigateTo]);

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== selectedFiles.length) {
      setError('Please choose image files only.');
    } else {
      setError(null);
    }

    const nextFiles = [...images, ...validFiles];
    if (nextFiles.length > MAX_IMAGES) {
      setError(`You can attach up to ${MAX_IMAGES} images.`);
    }
    setImages(nextFiles.slice(0, MAX_IMAGES));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAttachmentWarning(null);

    const dimensions: CustomDesignRequestCreate['dimensions'] = {};
    if (width) dimensions.width_cm = Number(width);
    if (height) dimensions.height_cm = Number(height);
    if (depth) dimensions.depth_cm = Number(depth);
    if (Object.keys(dimensions).length === 0) {
      setError('Add at least one measurement to help us understand your piece.');
      return;
    }

    if (!user) {
      setError('Sign in to send a request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CustomDesignRequestCreate = {
        title: title.trim(),
        request_type: requestType,
        dimensions,
        quantity: Number(quantity),
        description: description.trim(),
        contact_phone: contactPhone.trim(),
        company_name: isBusiness ? companyName.trim() : '',
        project_location: projectLocation.trim(),
        target_delivery_date: targetDeliveryDate || null,
      };
      const request = await customDesignService.createRequest(payload);
      const failedAttachments: string[] = [];
      setIsUploadingReferences(images.length > 0);

      for (const [index, file] of images.entries()) {
        try {
          const uploaded = await uploadDirectToCloudinary(file, { folder: 'tocco/custom-designs' });
          await customDesignService.createImage({
            request: request.id,
            image: uploaded.secure_url || uploaded.url,
            public_id: uploaded.public_id,
            sort_order: index + 1,
          });
        } catch {
          failedAttachments.push(file.name);
        }
      }
      setIsUploadingReferences(false);

      if (failedAttachments.length > 0) {
        setAttachmentWarning('Your request was sent, but one or more images could not be attached. We will still contact you about the request.');
      }
      setSubmittedRequestId(request.id);
    } catch (submitError) {
      setError(normalizeApiError(submitError).message);
    } finally {
      setIsUploadingReferences(false);
      setIsSubmitting(false);
    }
  };

  if (submittedRequestId !== null) {
    return (
      <section className="rounded-xl border border-[#EAE4DC] bg-white p-6 text-center shadow-sm sm:p-10" aria-live="polite">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#EEF5EE] text-[#287348]">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#B85D38]">Request received</p>
        <h3 className="mt-2 text-xl font-medium text-[#1C1A19]">Your project is with our team.</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#736B63]">
          We will review the details and contact you within 2 days.
        </p>
        {attachmentWarning && <p className="mx-auto mt-3 max-w-lg text-xs text-[#8A5B16]">{attachmentWarning}</p>}
        <p className="mt-5 text-xs text-[#8F8880]">Returning to the home page in 5 seconds...</p>
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D8CEBF] px-4 py-2 text-xs font-medium text-[#1C1A19] hover:bg-[#FAF8F5]"
        >
          Back to home <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#EAE4DC] bg-white p-8 text-sm text-[#736B63]">
        <Loader2 className="h-4 w-4 animate-spin text-[#643D26]" />
        Checking your account...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-[#EAE4DC] bg-white p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#643D26]" />
          <div>
            <h3 className="text-sm font-semibold text-[#1C1A19]">Sign in to send your request</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#736B63]">
              Your project details and images will be saved to your account so our team can follow up.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('account')}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1C1A19] px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#332F2D]"
        >
          Sign In / Create Account <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(settings.contact.whatsapp)}?text=${encodeURIComponent(
    `Hello Tocco House, I have a question about my ${requestLabel}.`
  )}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[#EAE4DC] bg-white p-4 shadow-sm sm:space-y-6 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-medium text-[#1C1A19]">Tell us about your project</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#736B63]">Share the essentials. Our team will follow up within 2 days.</p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-[#287348] hover:text-[#1C1A19]"
        >
          <MessageCircle className="h-4 w-4" /> Need help? WhatsApp
        </a>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="block text-xs font-medium text-[#1C1A19]">What would you like us to make? <span className="text-rose-700">*</span></span>
          <input
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Custom outdoor dining table"
            className="w-full rounded-lg border border-[#D8CEBF] bg-white px-3.5 py-3 text-sm text-[#1C1A19] outline-none placeholder:text-[#9B948D] focus:border-[#643D26] focus:ring-2 focus:ring-[#643D26]/10"
          />
        </label>

        {isBusiness && (
          <label className="space-y-1.5 sm:col-span-2">
            <span className="block text-xs font-medium text-[#1C1A19]">Company or studio <span className="text-rose-700">*</span></span>
            <input
              required
              maxLength={160}
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="e.g. Northline Interiors"
              className="w-full rounded-lg border border-[#D8CEBF] px-3.5 py-3 text-sm outline-none placeholder:text-[#9B948D] focus:border-[#643D26] focus:ring-2 focus:ring-[#643D26]/10"
            />
          </label>
        )}

        <fieldset className="space-y-1.5 sm:col-span-2">
          <legend className="text-xs font-medium text-[#1C1A19]">Approximate dimensions <span className="font-normal text-[#8F8880]">(cm; add at least one)</span></legend>
          <div className="grid grid-cols-3 gap-2.5">
            {([
              ['Width', width, setWidth],
              ['Height', height, setHeight],
              ['Depth', depth, setDepth],
            ] as const).map(([label, value, setter]) => (
              <label key={label} className="space-y-1">
                <span className="text-[11px] text-[#736B63]">{label}</span>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={value}
                  onChange={(event) => setter(event.target.value)}
                  placeholder="cm"
                  className="w-full rounded-lg border border-[#D8CEBF] px-3 py-2.5 text-sm outline-none placeholder:text-[#9B948D] focus:border-[#643D26] focus:ring-2 focus:ring-[#643D26]/10"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-[#1C1A19]">Quantity <span className="text-rose-700">*</span></span>
          <input
            required
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-full rounded-lg border border-[#D8CEBF] px-3.5 py-3 text-sm outline-none focus:border-[#643D26] focus:ring-2 focus:ring-[#643D26]/10"
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-[#1C1A19]">Contact phone <span className="text-rose-700">*</span></span>
          <input
            required
            type="tel"
            maxLength={32}
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            placeholder={user.phone || 'e.g. 010 1234 5678'}
            className="w-full rounded-lg border border-[#D8CEBF] px-3.5 py-3 text-sm outline-none placeholder:text-[#9B948D] focus:border-[#643D26] focus:ring-2 focus:ring-[#643D26]/10"
          />
        </label>

        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-[#1C1A19]">Project location</span>
          <input
            maxLength={180}
            value={projectLocation}
            onChange={(event) => setProjectLocation(event.target.value)}
            placeholder="City, area, or project site"
            className="w-full rounded-lg border border-[#D8CEBF] px-3.5 py-3 text-sm outline-none placeholder:text-[#9B948D] focus:border-[#643D26] focus:ring-2 focus:ring-[#643D26]/10"
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-[#1C1A19]">Target delivery date</span>
          <input
            type="date"
            value={targetDeliveryDate}
            onChange={(event) => setTargetDeliveryDate(event.target.value)}
            className="w-full rounded-lg border border-[#D8CEBF] px-3.5 py-3 text-sm text-[#1C1A19] outline-none focus:border-[#643D26] focus:ring-2 focus:ring-[#643D26]/10"
          />
        </label>

        <label className="space-y-1.5 sm:col-span-2">
          <span className="block text-xs font-medium text-[#1C1A19]">A few details about what you have in mind <span className="text-rose-700">*</span></span>
          <textarea
            required
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tell us about the style, finish, use, or any details that matter."
            className="w-full resize-y rounded-lg border border-[#D8CEBF] px-3.5 py-3 text-sm leading-relaxed outline-none placeholder:text-[#9B948D] focus:border-[#643D26] focus:ring-2 focus:ring-[#643D26]/10"
          />
        </label>

        <div className="space-y-2 sm:col-span-2">
          <div>
            <p className="text-xs font-medium text-[#1C1A19]">Reference images <span className="font-normal text-[#8F8880]">(optional, up to 10)</span></p>
            <p className="mt-0.5 text-[11px] text-[#736B63]">Add sketches, inspiration, or site photos.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple
            onChange={handleImageSelection}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#BFB4A6] px-3.5 py-2.5 text-xs font-medium text-[#524B45] hover:border-[#643D26] hover:bg-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" /> Add images ({images.length}/{MAX_IMAGES})
          </button>
          {images.length > 0 && (
            <ul className="space-y-1.5" aria-label="Selected reference images">
              {images.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-md bg-[#FAF8F5] px-3 py-2 text-xs text-[#524B45]">
                  <span className="min-w-0 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setImages((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                    disabled={isSubmitting}
                    className="shrink-0 rounded p-1 text-[#736B63] hover:bg-white hover:text-[#A33B2B]"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#EAE4DC] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-[#736B63]">Our team will contact you within 2 days.</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1C1A19] px-6 py-3 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#332F2D] disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isSubmitting ? (isUploadingReferences ? 'Uploading references...' : 'Sending request...') : 'Send request'}
        </button>
      </div>
    </form>
  );
}