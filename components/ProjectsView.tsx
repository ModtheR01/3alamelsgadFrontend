'use client';

import React from 'react';
import { useToccoStore } from '@/lib/store';
import Image from '@/components/SafeImage';
import { MapPin, ArrowRight, Layers } from 'lucide-react';

export default function ProjectsView() {
  const { projects, navigateTo } = useToccoStore();

  return (
    <div id="projects-page" className="pt-20 sm:pt-28 pb-20 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="py-6 sm:py-12 border-b border-[#EAE4DC] max-w-3xl space-y-2 sm:space-y-4">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
            Architectural Portfolio
          </span>
          <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-[#1C1A19]">
            In Their Space
          </h1>
          <p className="text-xs sm:text-base text-[#736B63] font-light leading-relaxed">
            Witness how our fiberglass sculptures, consoles, and dining tables live in private
            coastal villas, urban penthouses, and hospitality spaces across Egypt.
          </p>
        </div>

        {/* Projects Editorial Stream */}
        <div className="py-8 sm:py-16 space-y-12 sm:space-y-24">
          {projects.map((project, idx) => (
            <div
              key={project.id}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-center ${
                idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Imagery (7 cols) */}
              <div
                className={`relative aspect-[16/10] sm:aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg border border-[#EAE4DC] ${
                  idx % 2 === 1 ? 'lg:col-span-7 lg:order-2' : 'lg:col-span-7'
                }`}
              >
                <Image
                  src={project.coverImage}
                  alt={project.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Editorial Description & Featured Pieces (5 cols) */}
              <div
                className={`space-y-4 sm:space-y-6 ${
                  idx % 2 === 1 ? 'lg:col-span-5 lg:order-1' : 'lg:col-span-5'
                }`}
              >
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-wider text-[#8F8880]">
                    <MapPin className="w-3.5 h-3.5 text-[#B85D38]" />
                    <span>{project.location}</span>
                    <span>·</span>
                    <span>{project.year}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-normal text-[#1C1A19]">
                    {project.title}
                  </h2>
                  <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#B85D38] font-medium">
                    {project.subtitle}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-[#524B45] font-light leading-relaxed">
                  {project.description}
                </p>

                {/* Featured pieces tags */}
                <div className="pt-3 sm:pt-4 border-t border-[#EAE4DC] space-y-2">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-[#1C1A19] block">
                    Sculptural Objects Featured:
                  </span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {(project.featuredPieces || project.productsUsed || []).map((piece, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2.5 sm:px-3 py-1 rounded-full bg-[#EFEBE3] text-[11px] sm:text-xs text-[#524B45] border border-[#E0D8CB]"
                      >
                        {piece}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => navigateTo('custom-design')}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1A19] hover:text-[#B85D38] transition-colors py-2"
                  >
                    <span>Inquire About Similar Commissions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
