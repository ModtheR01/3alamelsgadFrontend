'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import { toWhatsAppNumber } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  Copy,
  Check,
  Package,
} from 'lucide-react';
import Image from '@/components/SafeImage';

export default function OrderConfirmationView() {
  const { lastCreatedOrder, submitPaymentProof, navigateTo, settings } = useToccoStore();

  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  if (!lastCreatedOrder) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-lg text-[#1C1A19]">No recent order found</p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-widest"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const rawOrder = lastCreatedOrder;

  // Adapt between BackendOrder and legacy Order
  const isBackend = 'order_number' in rawOrder;
  const orderNumber = isBackend ? rawOrder.order_number : rawOrder.orderNumber;
  const totalAmount = isBackend ? Number(rawOrder.total_price) : rawOrder.totalAmount;
  const depositAmount = isBackend ? Number(rawOrder.deposit_amount) : rawOrder.depositAmount;
  const depositPercentage = isBackend ? Number(rawOrder.deposit_percentage) : rawOrder.depositPercentage;
  const paymentMethod = isBackend ? 'instapay' : rawOrder.paymentMethod;
  const paymentStatus = isBackend
    ? rawOrder.status === 'CONFIRMED'
      ? 'payment_verified'
      : 'pending_deposit'
    : rawOrder.paymentStatus;
  const customerName = isBackend
    ? rawOrder.shipping_address?.title || 'Esteemed Patron'
    : rawOrder.customer.fullName;
  const customerStreet = isBackend
    ? `${rawOrder.shipping_address?.building_number ? `Bldg ${rawOrder.shipping_address.building_number}, ` : ''}${rawOrder.shipping_address?.street || ''}`
    : rawOrder.customer.street;
  const customerCity = isBackend ? rawOrder.shipping_address?.city || 'Cairo' : rawOrder.customer.city;
  const customerRegion = isBackend ? rawOrder.shipping_address?.country || 'Egypt' : rawOrder.customer.governorate;
  const items = isBackend
    ? rawOrder.items.map((it) => ({
        id: it.id,
        productName: it.product_name,
        productImage:
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
        selectedFinish: it.selected_finish || 'Not specified',
        selectedColor: it.color_name
          ? { id: it.color_name, name: it.color_name, hex: it.color_hex_code || '#EBE3D5' }
          : undefined,
        quantity: it.quantity,
        unitPrice: Number(it.product_price),
      }))
    : rawOrder.items;

  const handleProofSubmit = () => {
    submitPaymentProof(String(rawOrder.id), '');
    setProofSubmitted(true);
  };

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  // WhatsApp prefilled proof-submission message
  const proofWhatsappUrl = `https://wa.me/${toWhatsAppNumber(settings.contact.whatsapp)}?text=${encodeURIComponent(
    `Hello Tocco House,\nI have completed my ${depositPercentage}% deposit payment for Order #${orderNumber}. Attaching my payment screenshot/receipt below for verification.`
  )}`;


  return (
    <div id="order-confirmation-page" className="pt-20 sm:pt-28 pb-20 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        {/* Celebratory Header */}
        <div className="text-center space-y-3 sm:space-y-4 py-4 sm:py-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F5EFEB] text-[#643D26] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium text-[#B85D38]">
            Artisanal Commission Placed
          </span>

          <h1 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
            Thank you, {customerName}
          </h1>

          <p className="text-xs sm:text-base text-[#736B63] max-w-lg mx-auto font-light leading-relaxed">
            Your order has been recorded in our atelier schedule. Transfer the {depositPercentage}% handcrafted deposit
            below to activate mould preparation and fiberglass casting.
          </p>

          {/* Order Reference Pill */}
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#F2EDE4] border border-[#D8CEBF] text-[11px] sm:text-xs font-mono">
            <span className="text-[#736B63]">Order Reference:</span>
            <span className="font-bold text-[#1C1A19]">{orderNumber}</span>
            <button
              onClick={copyOrderNumber}
              className="text-[#643D26] hover:text-[#1C1A19] flex items-center gap-1 ml-1"
            >
              {copiedOrder ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Deposit Action Card */}
        <div className="p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-6 border-b border-[#EAE4DC] gap-3 sm:gap-4">
            <div>
              <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#643D26] block">
                Required {depositPercentage}% Handcrafted Deposit:
              </span>
              <span className="text-2xl sm:text-3xl font-normal text-[#1C1A19]">
                {depositAmount.toLocaleString()} EGP
              </span>
            </div>

            <div className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#FAF0E6] text-[#B85D38] text-[11px] sm:text-xs uppercase tracking-wider font-semibold self-start sm:self-auto">
              {paymentStatus === 'payment_verified'
                ? 'Deposit Verified'
                : paymentStatus === 'proof_submitted'
                ? 'Proof Received · Verifying'
                : `Awaiting ${depositPercentage}% Deposit`}
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="space-y-2.5 sm:space-y-3 text-xs text-[#524B45]">
            <h4 className="uppercase tracking-wider font-semibold text-[#1C1A19]">
              Transfer Destination ({paymentMethod.replace('_', ' ').toUpperCase()}):
            </h4>

            {paymentMethod === 'instapay' && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#D8CEBF] flex justify-between items-center">
                <div>
                  <p className="text-[#736B63] text-[11px]">InstaPay IPA / Address:</p>
                  <p className="font-mono text-xs sm:text-sm font-bold text-[#1C1A19]">
                    {settings.paymentMethods.instapay.address}
                  </p>
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#643D26] font-medium">Instant Verification</span>
              </div>
            )}

            {paymentMethod === 'vodafone_cash' && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#D8CEBF] flex justify-between items-center">
                <div>
                  <p className="text-[#736B63] text-[11px]">Mobile Wallet Number:</p>
                  <p className="font-mono text-xs sm:text-sm font-bold text-[#1C1A19]">
                    {settings.paymentMethods.mobileWallet?.number || settings.contact.phone}
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#D8CEBF] space-y-1 font-mono text-[11px] sm:text-xs">
                <p>Bank: {settings.paymentMethods.bankTransfer.bankName}</p>
                <p>Account: {settings.paymentMethods.bankTransfer.accountHolder || settings.paymentMethods.bankTransfer.accountName}</p>
                <p className="break-all">IBAN: {settings.paymentMethods.bankTransfer.iban}</p>
              </div>
            )}
          </div>

          {/* Proof Submission Form or Confirmation */}
          {proofSubmitted || paymentStatus !== 'pending_deposit' ? (
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F5F9F5] border border-[#D1E7DD] flex items-center gap-3 text-xs text-[#0F5132]">
              <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0" />
              <div>
                <p className="font-semibold">Deposit notification received!</p>
                <p className="text-[11px] text-[#146C43]">
                  Our finance atelier will verify the funds within 2 business hours and update your
                  order status to &ldquo;In Production&rdquo;.
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <a
                href={proofWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleProofSubmit}
                className="w-full py-3.5 sm:py-4 rounded-lg bg-[#1C1A19] text-white text-[11px] sm:text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D] flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Submit Proof on WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Order Details & Summary Card */}
        <div className="p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4 sm:space-y-6">
          <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1A19]">
            Pieces in this Commission
          </h3>

          <div className="space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-[#EAE4DC]">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#EFEBE3] shrink-0 border border-[#E0D8CB]">
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-medium text-[#1C1A19]">{item.productName}</h4>
                  <p className="text-[11px] sm:text-xs text-[#736B63] mt-0.5">
                    Finish: {item.selectedFinish}{item.selectedColor ? ` · Color: ${item.selectedColor.name}` : ''} · Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-sm font-semibold text-[#1C1A19]">
                  {(item.unitPrice * item.quantity).toLocaleString()} EGP
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Destination summary */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#524B45]">
            <div>
              <span className="font-semibold text-[#1C1A19] block uppercase tracking-wider mb-1">
                Delivery Address:
              </span>
              <p>{customerStreet}</p>
              <p>{customerCity}, {customerRegion}</p>
              {!isBackend && (rawOrder as any).customer.buildingDetails && (
                <p className="text-[#736B63]">{(rawOrder as any).customer.buildingDetails}</p>
              )}
            </div>
            <div>
              <span className="font-semibold text-[#1C1A19] block uppercase tracking-wider mb-1">
                Commission For:
              </span>
              <p className="font-medium text-[#1C1A19]">{customerName}</p>
              {!isBackend && (
                <>
                  <p className="font-mono">{(rawOrder as any).customer.phone}</p>
                  <p className="text-[#736B63]">{(rawOrder as any).customer.email}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigateTo('account')}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D8CEBF] text-xs uppercase tracking-wider text-[#1C1A19] hover:bg-[#1C1A19] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>Track in Customer Portal</span>
          </button>

          <button
            onClick={() => navigateTo('shop')}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#FAF8F5] border border-[#D8CEBF] text-xs uppercase tracking-wider text-[#1C1A19] hover:bg-white transition-all"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
