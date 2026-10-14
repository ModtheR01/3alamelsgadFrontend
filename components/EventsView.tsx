'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import { toWhatsAppNumber } from '@/lib/utils';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import Image from '@/components/SafeImage';
import { Calendar, MapPin, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';

export default function EventsView() {
  const { events, settings } = useToccoStore();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const filteredEvents = events.filter((ev) => {
    if (filter === 'upcoming') return ev.isUpcoming;
    if (filter === 'past') return !ev.isUpcoming;
    return true;
  });

  const targetWhatsapp = settings.contact?.whatsapp || BRAND_CONFIG.whatsappNumber;
  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(targetWhatsapp)}?text=${encodeURIComponent(
    'مرحباً عالم السجاد، أود الاستفسار عن فعاليات ومعارض عالم السجاد.'
  )}`;

  return (
    <div id="events-page" className="pt-20 sm:pt-28 pb-20 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="py-6 sm:py-12 border-b border-[#EAE4DC] flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
              Public & Private Showcases
            </span>
            <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-[#1C1A19]">
              Events & Exhibitions
            </h1>
            <p className="text-xs sm:text-base text-[#736B63] font-light max-w-xl leading-relaxed">
              Discover Tocco House sculptural pieces in curated exhibition environments, pop-ups,
              and design showcases across Egypt and beyond.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'upcoming', 'past'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs uppercase tracking-wider font-medium transition-all whitespace-nowrap ${
                  filter === f
                    ? 'bg-[#1C1A19] text-white'
                    : 'bg-[#EFEBE3] text-[#524B45] hover:bg-[#E5DFD4]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="py-6 sm:py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="group bg-[#FAF8F5] rounded-xl sm:rounded-2xl overflow-hidden border border-[#EAE4DC] hover:shadow-lg transition-all flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] bg-[#EFEBE3] overflow-hidden">
                <Image
                  src={event.coverImage}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2.5 sm:px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[9px] sm:text-[10px] uppercase tracking-wider font-medium text-[#1C1A19]">
                  {event.isUpcoming ? 'Upcoming Showcase' : 'Past Exhibition'}
                </div>
              </div>

              {/* Event Content */}
              <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[#8F8880]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#B85D38]" />
                      {event.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#B85D38]" />
                      {event.location}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-normal text-[#1C1A19] group-hover:text-[#643D26] transition-colors">
                    {event.title}
                  </h3>

                  <p className="text-xs text-[#736B63] font-light leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-[#EAE4DC] flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-[#643D26]">
                    Tocco House Atelier
                  </span>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-wider font-medium text-[#1C1A19] hover:text-[#B85D38] flex items-center gap-1 py-1"
                  >
                    <span>RSVP / Inquire</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
