'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import { toWhatsAppNumber } from '@/lib/utils';
import {
  Truck,
  ShieldCheck,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Send,
  CheckCircle2,
} from 'lucide-react';

export function ShippingView() {
  const { settings } = useToccoStore();

  return (
    <div id="shipping-page" className="pt-28 pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="py-12 border-b border-[#EAE4DC] space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
            Customer Care
          </span>
          <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[#1C1A19]">
            Shipping & White-Glove Delivery
          </h1>
          <p className="text-base text-[#736B63] font-light">
            Every Tocco House object is a sculpted work of art. We ensure it reaches your home in
            immaculate condition.
          </p>
        </div>

        <div className="space-y-8 text-sm text-[#524B45] font-light leading-relaxed">
          <section className="space-y-3">
            <h3 className="text-lg font-medium text-[#1C1A19]">1. Handcrafted Production Timelines</h3>
            <p>
              Because we do not mass-produce, casting commences upon receipt of your {settings.depositPercentage}% deposit.
              Standard pieces require <strong className="text-[#1C1A19]">2 to 3 weeks</strong> of
              workshop moulding, lamination, and curing. Bespoke commissions or complex multi-piece
              sets require <strong className="text-[#1C1A19]">3 to 4 weeks</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-medium text-[#1C1A19]">2. White-Glove Delivery Destinations</h3>
            <p>We provide direct, dedicated white-glove transport to the following areas across Egypt:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#1C1A19] font-mono">
              <li>Greater Cairo (New Cairo, Zamalek, Maadi, Sheikh Zayed, 6th of October)</li>
              <li>North Coast / Sahel (Marassi, Hacienda, Almaza Bay, Sidi Heneish, Ras El Hekma)</li>
              <li>Red Sea & El Gouna (Private villas, lagoons, and boutique hotels)</li>
              <li>Alexandria & Mediterranean Coast</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-medium text-[#1C1A19]">3. Inspection & Final {100 - settings.depositPercentage}% Settlement</h3>
            <p>
              Upon delivery, please inspect the piece and confirm its surface finish and structural
              integrity before accepting it and settling the remaining {100 - settings.depositPercentage}% balance via InstaPay or the
              agreed payment method. Any concerns must be reported at the time of delivery.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function ReturnsView() {
  return (
    <div id="returns-page" className="pt-28 pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="py-12 border-b border-[#EAE4DC] space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
            Customer Care
          </span>
          <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[#1C1A19]">
            Returns & Replacement Policy
          </h1>
          <p className="text-base text-[#736B63] font-light">
            Returns and replacements are available only for pieces that arrive damaged.
          </p>
        </div>

        <div className="space-y-8 text-sm text-[#524B45] font-light leading-relaxed">
          <section className="space-y-3">
            <h3 className="text-lg font-medium text-[#1C1A19]">1. Damaged Products Only</h3>
            <p>
              Returns or replacements are accepted only when a piece arrives damaged. The damage must be
              reported to our team during delivery inspection, with clear photos or video showing the
              condition of the product.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-medium text-[#1C1A19]">2. Available Resolution</h3>
            <p>
              If the damage is confirmed, you may choose one of the following resolutions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>A newly manufactured replacement piece at no additional cost</li>
              <li>A refund of the paid deposit</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export function FaqView() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const { settings } = useToccoStore();

  const faqs = [
    {
      q: 'Is fiberglass furniture truly safe for outdoor summer sun in Sahel?',
      a: 'Yes, completely. Tocco House utilizes marine-grade isophthalic resins and UV-stabilized gelcoats identical to those used in luxury yacht hulls. They withstand intense North Coast heat, pool chlorine, and saltwater sea spray without cracking or peeling.',
    },
    {
      q: `Why is a ${settings.depositPercentage}% handcrafted deposit required to place an order?`,
      a: `Tocco House operates as an artisanal design house rather than a warehouse retailer. Every order initiates custom mould preparation, fiberglass lamination, and artisan hand-sanding in our Cairo workshop. The ${settings.depositPercentage}% deposit commissions these dedicated materials and hours of craftsmanship.`,
    },
    {
      q: 'Can I request custom dimensions, colors, or RAL paint codes?',
      a: 'Absolutely. We collaborate directly with private homeowners, interior architects, and hospitality groups. You can specify custom table lengths, bench radii, or exact RAL paint codes through our Custom Design page or directly on WhatsApp.',
    },
    {
      q: 'What is the difference between Matte and Glossy finishes?',
      a: 'Matte offers a soft, non-reflective finish ideal for indoor living salons. Glossy features a smooth, reflective shine that brings out the color and character of each piece.',
    },
    {
      q: 'How do I clean and maintain my Tocco House pieces?',
      a: 'Daily care requires only a soft microfiber cloth and mild warm soapy water. Avoid abrasive metal scourers. High-gloss pieces can be buffed occasionally with automotive carnauba wax to maintain a brilliant showroom reflection.',
    },
    {
      q: 'Can pieces remain outdoors during winter rain?',
      a: 'Yes. Our fiberglass forms are 100% waterproof and non-porous. Water simply beads off the surface.',
    },
  ];

  return (
    <div id="faq-page" className="pt-28 pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="py-12 border-b border-[#EAE4DC] space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
            Inquiries
          </span>
          <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[#1C1A19]">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-[#736B63] font-light">
            Everything you need to know about our materials, {settings.depositPercentage}% deposit process, and atelier care.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-[#EAE4DC] rounded-2xl bg-white overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-normal text-base sm:text-lg text-[#1C1A19]"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#643D26] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#8F8880] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-[#524B45] font-light leading-relaxed border-t border-[#F2EDE4]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ContactView() {
  const { settings } = useToccoStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(settings.contact.whatsapp)}?text=${encodeURIComponent(
    'Hello Tocco House, I would like to arrange an atelier appointment or inquire about your pieces.'
  )}`;

  return (
    <div id="contact-page" className="pt-28 pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="py-12 border-b border-[#EAE4DC] max-w-3xl space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
            Atelier Concierge
          </span>
          <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[#1C1A19]">
            Connect with Tocco House
          </h1>
          <p className="text-base text-[#736B63] font-light">
            We welcome architects, interior curators, and design collectors for private viewings and
            bespoke commissions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#B85D38] shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1C1A19]">
                      Cairo Atelier & Showroom
                    </h4>
                    <a
                      href={settings.contact.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#524B45] leading-relaxed mt-1 underline decoration-[#D8CEBF] underline-offset-2 hover:text-[#643D26]"
                    >
                      {settings.contact.atelierAddress}
                    </a>
                    <p className="text-[11px] text-[#8F8880] mt-1">
                      Viewings by private appointment: Sun – Thu, 10 AM – 6 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#B85D38] shrink-0" />
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1C1A19]">
                      Direct Telephone
                    </h4>
                    <a
                      href={`tel:${settings.contact.phone}`}
                      className="text-xs font-mono text-[#524B45] mt-0.5 hover:text-[#643D26]"
                    >
                      {settings.contact.phone}
                    </a>
                  </div>
                </div>

                {settings.contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#B85D38] shrink-0" />
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1C1A19]">
                        Email Enquiries
                      </h4>
                      <p className="text-xs font-mono text-[#524B45] mt-0.5">{settings.contact.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct WhatsApp CTA */}
              <div className="pt-4 border-t border-[#EAE4DC]">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-full bg-[#2A2624] hover:bg-[#383330] text-white text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Start WhatsApp Conversation</span>
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-[#EAE4DC] shadow-sm">
            {sent ? (
              <div className="py-12 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-[#643D26] mx-auto" />
                <h3 className="text-xl font-normal text-[#1C1A19]">Message Sent</h3>
                <p className="text-xs text-[#736B63] max-w-sm mx-auto">
                  Thank you for reaching out. A design representative will be in touch with you shortly.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-2 px-6 py-2 rounded-full border border-[#D8CEBF] text-xs uppercase tracking-wider"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-normal text-[#1C1A19]">Leave an Atelier Note</h3>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#1C1A19] font-medium mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Laila Hassanein"
                    className="w-full text-xs p-3 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#1C1A19] font-medium mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full text-xs p-3 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#1C1A19] font-medium mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Inquiry regarding design pieces, visit appointment, or hospitality procurement..."
                    className="w-full text-xs p-3 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D] flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivacyView() {
  return (
    <div id="privacy-page" className="pt-28 pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm text-[#524B45] font-light leading-relaxed">
        <div className="py-8 border-b border-[#EAE4DC] space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">Legal</span>
          <h1 className="text-3xl font-normal text-[#1C1A19]">Privacy Policy</h1>
          <p className="text-xs text-[#736B63]">Last updated March 2026</p>
        </div>

        <p>
          At Tocco House, we respect the privacy of our clients and collectors. We only gather contact
          and delivery destination details necessary to execute your commissioned pieces and deliver
          them via our dedicated white-glove transport.
        </p>
        <p>
          We do not sell, rent, or lease your personal information to third parties. All transaction
          records and proof of deposits are stored in accordance with Egyptian commercial standards.
        </p>
      </div>
    </div>
  );
}

export function TermsView() {
  const { settings } = useToccoStore();

  return (
    <div id="terms-page" className="pt-28 pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm text-[#524B45] font-light leading-relaxed">
        <div className="py-8 border-b border-[#EAE4DC] space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">Legal</span>
          <h1 className="text-3xl font-normal text-[#1C1A19]">Terms & Conditions</h1>
          <p className="text-xs text-[#736B63]">Tocco House LLC · Handcrafted in Egypt</p>
        </div>

        <p>
          <strong>1. Deposit & Commissioning:</strong> Orders are confirmed upon receipt of a {settings.depositPercentage}%
          deposit. Once raw materials are allocated and casting initiates, deposits are non-refundable.
        </p>
        <p>
          <strong>2. Handcrafted Tolerances:</strong> Minor textural nuances, mineral pigment variations,
          and micro-variations in glaze are natural hallmarks of hand-finished fiberglass and are not
          considered defects.
        </p>
        <p>
          <strong>3. Final Balance:</strong> The remaining {100 - settings.depositPercentage}% order balance is strictly due upon arrival
          of our delivery team before handover.
        </p>
      </div>
    </div>
  );
}
