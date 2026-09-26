'use client';

import React, { useEffect, useState } from 'react';
import { customDesignService } from '@/lib/api/services/customDesignService';
import { normalizeApiError } from '@/lib/api/errors';
import { toWhatsAppNumber } from '@/lib/utils';
import { CustomDesignRequest } from '@/types/customDesign';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Ruler,
  Search,
  Trash2,
  X,
} from 'lucide-react';

function formatDimensions(dimensions: CustomDesignRequest['dimensions']): string {
  return Object.entries(dimensions)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    .map(([key, value]) => `${key.replace('_cm', '').replace('_', ' ')}: ${value} cm`)
    .join(' · ');
}

export default function CustomDesignRequestsManagement() {
  const [requests, setRequests] = useState<CustomDesignRequest[]>([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    customDesignService.getRequests(activeSearch ? { search: activeSearch } : undefined)
      .then((data) => {
        if (active) setRequests(data);
      })
      .catch((requestError) => {
        if (active) setError(normalizeApiError(requestError).message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeSearch, reloadVersion]);

  const refreshRequests = () => {
    setError(null);
    setIsLoading(true);
    setReloadVersion((version) => version + 1);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    setActiveSearch(searchDraft.trim());
    setReloadVersion((version) => version + 1);
  };

  const handleDelete = async (request: CustomDesignRequest) => {
    setDeletingId(request.id);
    setError(null);
    try {
      await customDesignService.deleteRequest(request.id);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setConfirmDeleteId(null);
    } catch (deleteError) {
      setError(normalizeApiError(deleteError).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">Custom design requests</h2>
          <p className="mt-1 text-xs text-[#736B63]">Review project briefs and contact each customer directly.</p>
        </div>
        <button
          type="button"
          onClick={refreshRequests}
          disabled={isLoading}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8CEBF] px-3.5 py-2 text-xs text-[#524B45] hover:border-[#1C1A19] hover:text-[#1C1A19] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      <form onSubmit={handleSearch} className="flex max-w-xl gap-2">
        <label className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8F8880]" />
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search title, description, company, or customer"
            className="w-full rounded-lg border border-[#D8CEBF] bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#643D26]"
          />
        </label>
        <button type="submit" className="rounded-lg bg-[#1C1A19] px-4 text-xs font-medium text-white hover:bg-[#332F2D]">Search</button>
      </form>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#EAE4DC] bg-white p-10 text-xs text-[#736B63]">
          <Loader2 className="h-4 w-4 animate-spin text-[#643D26]" /> Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D8CEBF] bg-white p-10 text-center">
          <p className="text-sm text-[#1C1A19]">No custom design requests found.</p>
          <p className="mt-1 text-xs text-[#736B63]">New client and business briefs will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const normalizedPhone = toWhatsAppNumber(request.contact_phone);
            const whatsappUrl = normalizedPhone
              ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(`Hello, this is Tocco House following up on your ${request.request_type === 'BUSINESS' ? 'business' : 'custom design'} request: ${request.title}.`)}`
              : null;
            return (
              <article key={request.id} className="rounded-xl border border-[#EAE4DC] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#1C1A19]">{request.title}</h3>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${request.request_type === 'BUSINESS' ? 'bg-[#E8F0F2] text-[#28596A]' : 'bg-[#F5F0E8] text-[#785132]'}`}>
                        {request.request_type}
                      </span>
                      <span className="text-[10px] text-[#8F8880]">#{request.id}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#524B45]">{request.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#736B63]">
                      <span className="inline-flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" />{formatDimensions(request.dimensions) || 'Dimensions not specified'}</span>
                      <span>Qty: {request.quantity}</span>
                      {request.company_name && <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{request.company_name}</span>}
                      {request.project_location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{request.project_location}</span>}
                      {request.target_delivery_date && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Target: {request.target_delivery_date}</span>}
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                    {request.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {request.images.map((image) => (
                          <a
                            key={image.id}
                            href={image.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-[#D8CEBF] px-2.5 py-1.5 text-[10px] font-medium text-[#524B45] hover:bg-[#FAF8F5]"
                          >
                            Reference {image.sort_order}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#1C1A19] px-3.5 py-2 text-[10px] font-medium uppercase tracking-wider text-white hover:bg-[#332F2D]"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> WhatsApp client
                      </a>
                    ) : (
                      <span className="text-[10px] text-[#8F8880]">No contact phone</span>
                    )}
                    {confirmDeleteId === request.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#736B63]">Delete request?</span>
                        <button type="button" onClick={() => void handleDelete(request)} disabled={deletingId === request.id} className="rounded-md px-2 py-1.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                          {deletingId === request.id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteId(null)} disabled={deletingId === request.id} className="rounded-md p-1.5 text-[#736B63] hover:bg-[#FAF8F5]" aria-label="Cancel delete">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmDeleteId(request.id)} className="rounded-full p-2 text-[#8F8880] hover:bg-rose-50 hover:text-rose-700" title="Delete request" aria-label={`Delete ${request.title}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}