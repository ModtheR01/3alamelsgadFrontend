'use client';

import React from 'react';
import { useToccoStore } from '@/lib/store';
import { toWhatsAppNumber } from '@/lib/utils';
import { MessageCircle, Building2, Ruler, Truck, ShieldCheck } from 'lucide-react';

export default function B2BView() {
  const { settings } = useToccoStore();

  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(settings.contact.whatsapp)}?text=${encodeURIComponent(
    'Hello Tocco House, I represent a company and would like to discuss a B2B furniture or fiberglass project.'
  )}`;

  return (
    <div id="b2b-page" className="pt-20 sm:pt-28 pb-20 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="py-6 sm:py-12 border-b border-[#EAE4DC] max-w-3xl space-y-2.5 sm:space-y-4">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">Tocco House for Business</span>
          <h1 className="text-3xl sm:text-6xl font-normal tracking-tight text-[#1C1A19]">Distinctive pieces for considered spaces.</h1>
          <p className="text-xs sm:text-lg text-[#524B45] font-light leading-relaxed">
            We partner with architects, interior designers, hospitality groups, offices, and retailers to deliver custom fiberglass furniture and sculptural objects at project scale.
          </p>
        </div>

        <div className="py-8 sm:py-16 border-b border-[#EAE4DC] space-y-5 sm:space-y-8">
          <h3 className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[#8F8880]">Built for Your Project</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6">
            {[
              { num: '01', title: 'Project Brief', desc: 'Share your drawings, quantities, target dates, and the role each piece needs to play.' },
              { num: '02', title: 'Design Alignment', desc: 'We refine proportions, finishes, colors, and technical details with your team.' },
              { num: '03', title: 'Production', desc: 'Our Cairo workshop manages prototyping, fabrication, quality checks, and finishing.' },
              { num: '04', title: 'Delivery & Install', desc: 'Coordinated delivery and installation keep your project moving with one trusted partner.' },
            ].map((step) => (
              <div key={step.num} className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-1.5 sm:space-y-3">
                <span className="text-xl sm:text-2xl font-light text-[#B85D38] font-mono">{step.num}</span>
                <h4 className="text-xs sm:text-sm font-medium text-[#1C1A19] uppercase tracking-wider">{step.title}</h4>
                <p className="text-[11px] sm:text-xs text-[#736B63] font-light leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="py-8 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7 bg-white p-4 sm:p-10 rounded-xl sm:rounded-2xl border border-[#EAE4DC] shadow-sm space-y-5 sm:space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-normal text-[#1C1A19]">Start a B2B project conversation</h3>
              <p className="text-xs text-[#736B63]">Send our team the essentials below and we will come back with the right next step for your project.</p>
            </div>
            <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-[#524B45]">
              <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#B85D38] mt-1.5 shrink-0" /><span>Company, project type, location, and expected handover date</span></li>
              <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#B85D38] mt-1.5 shrink-0" /><span>Product references, quantities, dimensions, or architectural drawings</span></li>
              <li className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#B85D38] mt-1.5 shrink-0" /><span>Preferred finish, color, delivery requirements, and target budget</span></li>
            </ul>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 sm:py-4 rounded-full bg-[#1C1A19] text-white text-[11px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.25em] font-medium hover:bg-[#332F2D] transition-all flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Talk to Our B2B Team</span>
            </a>
          </div>

          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-3 sm:space-y-4 text-xs text-[#524B45]">
              {[
                { icon: Building2, title: 'One partner, one language', desc: 'From first brief to final installation, our team works directly with your design and procurement teams.' },
                { icon: Ruler, title: 'Made to your specification', desc: 'Custom dimensions, repeated forms, branded colors, and durable finishes for demanding spaces.' },
                { icon: Truck, title: 'Project-ready logistics', desc: 'We plan packaging, delivery, access, and installation around your site schedule.' },
                { icon: ShieldCheck, title: 'Built for real use', desc: 'Marine-grade fiberglass systems and carefully tested finishes for hospitality, retail, and outdoor environments.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-2.5 sm:gap-3">
                  <Icon className="w-4 h-4 text-[#643D26] shrink-0 mt-0.5" />
                  <div><h5 className="font-semibold text-[#1C1A19]">{title}</h5><p className="text-[10px] sm:text-[11px] text-[#736B63] mt-0.5 leading-relaxed">{desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}