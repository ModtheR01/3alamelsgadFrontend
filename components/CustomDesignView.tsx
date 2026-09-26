'use client';

import React from 'react';
import CustomDesignRequestForm from '@/components/CustomDesignRequestForm';
import {
  Hammer,
  ShieldCheck,
} from 'lucide-react';

export default function CustomDesignView() {
  return (
    <div id="custom-design-page" className="pt-20 sm:pt-28 pb-20 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="py-6 sm:py-12 border-b border-[#EAE4DC] max-w-3xl space-y-2.5 sm:space-y-4">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
            Atelier Bespoke Services
          </span>
          <h1 className="text-3xl sm:text-6xl font-normal tracking-tight text-[#1C1A19]">
            Custom Design & Fabrication
          </h1>
          <p className="text-xs sm:text-lg text-[#524B45] font-light leading-relaxed">
            We engineer and hand-cast fiberglass pieces for extraordinary spaces. Whether you need
            a ten-foot sculptural dining monolith for a North Coast villa or custom pop-art characters
            for a hospitality project, our atelier brings it into reality.
          </p>
        </div>

        {/* 5-Step Process Editorial Grid */}
        <div className="py-8 sm:py-16 border-b border-[#EAE4DC] space-y-5 sm:space-y-8">
          <h3 className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[#8F8880]">
            The Atelier Journey
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-6">
            {[
              {
                num: '01',
                title: 'Ideation & Proportions',
                desc: 'We review your sketches, architectural blueprints, or reference moodboards.',
              },
              {
                num: '02',
                title: '3D Sculpting',
                desc: 'Structural proportions and ergonomic curves are refined and approved.',
              },
              {
                num: '03',
                title: 'Mould & Lamination',
                desc: 'High-tensile fiberglass layers are hand-laid in our Cairo workshop.',
              },
              {
                num: '04',
                title: 'Artisan Glazing',
                desc: 'Hand-sanded and finished in UV marine lacquer or mineral travertine texture.',
              },
              {
                num: '05',
                title: 'White-Glove Delivery',
                desc: 'Crated and installed directly into your residence or project location.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-1.5 sm:space-y-3"
              >
                <span className="text-xl sm:text-2xl font-light text-[#B85D38] font-mono">{step.num}</span>
                <h4 className="text-xs sm:text-sm font-medium text-[#1C1A19] uppercase tracking-wider">
                  {step.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#736B63] font-light leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Inquiry Section: Direct WhatsApp Consultation */}
        <div className="py-8 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7">
            <CustomDesignRequestForm requestType="CLIENT" />
          </div>

          {/* Right: Quality Commitments (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* Quality Commitments */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-3 sm:space-y-4 text-xs text-[#524B45]">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <ShieldCheck className="w-4 h-4 text-[#643D26] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-[#1C1A19]">Outdoor Marine Resilience</h5>
                  <p className="text-[10px] sm:text-[11px] text-[#736B63] mt-0.5 leading-relaxed">
                    Our fiberglass is cast with UV-stabilized isophthalic gelcoats impervious to sea
                    salt spray, chlorine, and scorching Mediterranean sun.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3">
                <Hammer className="w-4 h-4 text-[#643D26] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-[#1C1A19]">Architectural Scale</h5>
                  <p className="text-[10px] sm:text-[11px] text-[#736B63] mt-0.5 leading-relaxed">
                    From intimate salon consoles to massive 4-meter poolside banquettes and monolithic
                    sculptures with internal steel reinforcement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
