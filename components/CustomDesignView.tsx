'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import { CustomDesignInquiry } from '@/types';
import {
  MessageCircle,
  Send,
  CheckCircle2,
  Sparkles,
  Layers,
  Compass,
  Hammer,
  ShieldCheck,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import CloudinaryImageField from '@/components/CloudinaryImageField';

export default function CustomDesignView() {
  const { submitCustomInquiry, settings } = useToccoStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState<'Private Residence' | 'Sahel Villa' | 'Hospitality / Restaurant' | 'Commercial Office' | 'Other'>('Private Residence');
  const [pieceCategory, setPieceCategory] = useState<'Table' | 'Chair / Lounger' | 'Sculptural Piece' | 'Decorative Object' | 'Character / Pop Art' | 'Monumental Planter' | 'Other'>('Table');
  const [dimensions, setDimensions] = useState('');
  const [finishPreference, setFinishPreference] = useState<'Matte' | 'Glossy' | 'Textured Mineral' | 'Undecided'>('Matte');
  const [colorPreference, setColorPreference] = useState('');
  const [description, setDescription] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [submittedInquiry, setSubmittedInquiry] = useState<CustomDesignInquiry | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    const inq = submitCustomInquiry({
      fullName,
      phone,
      email,
      projectType,
      pieceCategory,
      dimensions,
      finishPreference,
      colorPreference,
      description,
      referenceImages: referenceUrl ? [referenceUrl] : [],
    });

    setSubmittedInquiry(inq);
  };

  const whatsappUrl = `https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hello Tocco House, I am planning a custom fiberglass piece (${pieceCategory} for ${projectType}). I would like to consult with your atelier.`
  )}`;

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

        {/* Custom Inquiry Section: Form & Direct WhatsApp */}
        <div className="py-8 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Interactive Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-10 rounded-xl sm:rounded-2xl border border-[#EAE4DC] shadow-sm">
            {submittedInquiry ? (
              <div className="py-8 sm:py-12 text-center space-y-4 sm:space-y-5 animate-in fade-in duration-300">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F5F0E8] text-[#643D26] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-xl sm:text-2xl font-normal text-[#1C1A19]">Inquiry Received</h3>
                  <p className="text-xs sm:text-sm text-[#736B63] max-w-md mx-auto font-light leading-relaxed">
                    Thank you, {submittedInquiry.fullName}. Our design director will review your
                    specifications and contact you via WhatsApp or phone within 24 hours.
                  </p>
                </div>
                <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2A2624] text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Expedite via WhatsApp</span>
                  </a>
                  <button
                    onClick={() => setSubmittedInquiry(null)}
                    className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D8CEBF] text-xs uppercase tracking-wider text-[#1C1A19]"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-normal text-[#1C1A19]">
                    Submit a Custom Commission Request
                  </h3>
                  <p className="text-xs text-[#736B63]">
                    Share your requirements and our atelier will prepare a tailored proposal.
                  </p>
                </div>

                {/* Personal / Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Karim Mansour"
                      className="w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                  />
                </div>

                {/* Project & Piece Categorization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                      Project Space
                    </label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border border-[#D8CEBF] text-[#1C1A19] focus:outline-none cursor-pointer"
                    >
                      <option value="Private Residence">Private Residence (Cairo / Giza)</option>
                      <option value="Sahel Villa">Sahel / North Coast Villa</option>
                      <option value="Hospitality / Restaurant">Hospitality / Hotel / Dining</option>
                      <option value="Commercial Office">Commercial / Corporate Office</option>
                      <option value="Other">Other Unique Project</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                      Object Type
                    </label>
                    <select
                      value={pieceCategory}
                      onChange={(e) => setPieceCategory(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border border-[#D8CEBF] text-[#1C1A19] focus:outline-none cursor-pointer"
                    >
                      <option value="Table">Dining / Cocktail / Console Table</option>
                      <option value="Chair / Lounger">Armchair / Sun Lounger / Bench</option>
                      <option value="Sculptural Piece">Architectural Sculpture / Totem</option>
                      <option value="Monumental Planter">Monumental Planter / Vessel</option>
                      <option value="Character / Pop Art">Character / Bear / Pop Art Figure</option>
                      <option value="Decorative Object">Sculptural Tray / Centerpiece</option>
                      <option value="Other">Other Bespoke Form</option>
                    </select>
                  </div>
                </div>

                {/* Specifications: Dimensions, Finish & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                      Approx. Dimensions
                    </label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      placeholder="e.g. 240 x 110 x 75 cm"
                      className="w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border border-[#D8CEBF] text-[#1C1A19] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                      Preferred Finish
                    </label>
                    <select
                      value={finishPreference}
                      onChange={(e) => setFinishPreference(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border border-[#D8CEBF] text-[#1C1A19] focus:outline-none"
                    >
                      <option value="Matte">Smooth Matte</option>
                      <option value="Glossy">High-Gloss Marine</option>
                      <option value="Textured Mineral">Textured Mineral</option>
                      <option value="Undecided">Discuss with Atelier</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                      Color / RAL Tint
                    </label>
                    <input
                      type="text"
                      value={colorPreference}
                      onChange={(e) => setColorPreference(e.target.value)}
                      placeholder="e.g. Peach, Bone, RAL 7032"
                      className="w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border border-[#D8CEBF] text-[#1C1A19] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description & Reference Image */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                    Project Vision & Details
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the shape, indoor/outdoor placement, or aesthetic vibe..."
                    className="w-full text-xs p-3.5 rounded-lg bg-[#FAF8F5] border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                  />
                </div>

                <div className="space-y-1.5">
                  <CloudinaryImageField
                    label="Reference Image"
                    value={referenceUrl}
                    folder="tocco/custom-design"
                    onChange={setReferenceUrl}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 sm:py-4 rounded-full bg-[#1C1A19] text-white text-[11px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.25em] font-medium hover:bg-[#332F2D] transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Custom Commission</span>
                </button>
              </form>
            )}
          </div>

          {/* Right: Atelier Credentials & Instant WhatsApp Link (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            <div className="p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-[#1C1A19] text-white space-y-4 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#B85D38]">
                  Direct Atelier Line
                </span>
                <h3 className="text-xl sm:text-2xl font-normal text-white">
                  Prefer a Direct Conversation?
                </h3>
                <p className="text-xs text-[#B8AFA6] leading-relaxed font-light">
                  Our design leads and production engineers are available on WhatsApp to answer
                  material tolerances, outdoor UV protection, and architectural lead times.
                </p>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-full bg-[#2A2624] hover:bg-[#383330] text-white text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 border border-[#443E3A] transition-all"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Chat with Design Concierge</span>
              </a>
            </div>

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
