'use client';

import React, { useState, useEffect } from 'react';
import { useToccoStore } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import { PaymentMethod } from '@/types';
import { orderService } from '@/lib/api/services/orderService';
import { cartService } from '@/lib/api/services/cartService';
import { normalizeApiError } from '@/lib/api/errors';
import Image from '@/components/SafeImage';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Building2,
  CreditCard,
  MessageCircle,
  Loader2,
  AlertCircle,
  MapPin,
  Plus,
} from 'lucide-react';

const EGYPTIAN_GOVERNORATES = [
  'Cairo (القاهرة)',
  'Giza (الجيزة)',
  'Matrouh / North Coast / Sahel (الساحل الشمالي)',
  'Alexandria (الإسكندرية)',
  'Red Sea / El Gouna / Hurghada (البحر الأحمر / الجونة)',
  'South Sinai / Sharm El Sheikh (جنوب سيناء)',
  'Dakahlia / Mansoura (الدقهلية)',
  'Gharbia / Tanta (الغربية)',
  'Sharqia (الشرقية)',
  'Qalyubia (القليوبية)',
  'Other Governorate',
];

export default function CheckoutView() {
  const {
    cart,
    cartSubtotal,
    cartDepositAmount,
    cartRemainingAmount,
    clearCart,
    setLastCreatedOrder,
    settings,
    navigateTo,
    user: legacyUser,
  } = useToccoStore();

  const { user: authUser, addresses: authAddresses, createAddress } = useAuth();

  const defaultAddr = authAddresses.find((a) => a.is_default) || authAddresses[0];

  const [userSelectedAddressId, setUserSelectedAddressId] = useState<number | 'new' | null>(null);
  const selectedAddressId: number | 'new' =
    userSelectedAddressId !== null
      ? userSelectedAddressId
      : defaultAddr
      ? defaultAddr.id
      : 'new';

  const setSelectedAddressId = (id: number | 'new') => setUserSelectedAddressId(id);

  // Pre-fill from user account if available
  const [fullName, setFullName] = useState(() =>
    authUser ? `${authUser.first_name} ${authUser.last_name}`.trim() : legacyUser?.fullName || ''
  );
  const [phone, setPhone] = useState(() => authUser?.phone || legacyUser?.phone || '');
  const [email, setEmail] = useState(() => authUser?.email || legacyUser?.email || '');

  // Address fields for new address or fallback
  const [addressTitle, setAddressTitle] = useState('Delivery Residence');
  const [governorate, setGovernorate] = useState(
    legacyUser?.savedAddresses?.[0]?.governorate || 'Cairo (القاهرة)'
  );
  const [city, setCity] = useState(
    () => defaultAddr?.city || legacyUser?.savedAddresses?.[0]?.city || ''
  );
  const [street, setStreet] = useState(
    () => defaultAddr?.street || legacyUser?.savedAddresses?.[0]?.street || ''
  );
  const [buildingNumber, setBuildingNumber] = useState(
    () => defaultAddr?.building_number || '1'
  );
  const [apartmentNumber, setApartmentNumber] = useState(
    () => defaultAddr?.apartment_number || '1'
  );
  const [buildingDetails, setBuildingDetails] = useState(() =>
    defaultAddr
      ? `Bldg ${defaultAddr.building_number}, Apt ${defaultAddr.apartment_number}`
      : legacyUser?.savedAddresses?.[0]?.building || ''
  );
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('instapay');

  // Submission & API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string[]>>({});

  // Clipboard feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (cart.length === 0) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-lg text-[#1C1A19]">Your bag is currently empty</p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-widest"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiFieldErrors({});

    if (!authUser) {
      setApiError('Authentication required. Please sign in to finalize your commission.');
      return;
    }

    setIsSubmitting(true);
    try {
      let targetAddressId: number;

      if (selectedAddressId === 'new' || authAddresses.length === 0) {
        if (!city.trim() || !street.trim()) {
          setApiError('Please specify the delivery city and street address.');
          setIsSubmitting(false);
          return;
        }

        const newAddr = await createAddress({
          title: addressTitle.trim() || 'Delivery Residence',
          country: 'Egypt',
          city: city.trim(),
          street: street.trim(),
          building_number: buildingNumber.trim() || '1',
          apartment_number: apartmentNumber.trim() || '1',
          is_default: authAddresses.length === 0,
        });
        targetAddressId = newAddr.id;
      } else {
        targetAddressId = Number(selectedAddressId);
      }

      // Synchronize backend cart if needed
      try {
        const bCart = await cartService.getCart();
        if (!bCart.items || bCart.items.length === 0) {
          for (const item of cart) {
            const numProdId = parseInt(item.productId.replace(/\D/g, '')) || 1;
            const numColorId = item.selectedColor?.id
              ? parseInt(String(item.selectedColor.id).replace(/\D/g, '')) || 1
              : 1;
            await cartService.addItem({
              product_id: numProdId,
              color_id: numColorId,
              quantity: item.quantity,
            });
          }
        }
      } catch {
        // Proceed to order creation
      }

      // Create backend order (API expects { address_id })
      const createdOrder = await orderService.createOrder({
        address_id: targetAddressId,
      });

      setLastCreatedOrder(createdOrder);
      clearCart();
      navigateTo('confirmation');
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      setApiError(normalized.message);
      setApiFieldErrors(normalized.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="checkout-page" className="pt-20 sm:pt-28 pb-24 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="py-2.5 sm:py-4">
          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-[#736B63] hover:text-[#1C1A19]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
        </div>

        <div className="pb-5 sm:pb-8 border-b border-[#EAE4DC] space-y-1.5 sm:space-y-2">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-medium text-[#B85D38]">
            Artisanal Commission
          </span>
          <h1 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1A19]">
            Order Checkout & 50% Deposit
          </h1>
          <p className="text-xs sm:text-sm text-[#736B63] font-light leading-relaxed">
            Review your delivery destination and transfer details to initiate casting in our atelier.
          </p>
        </div>

        <form onSubmit={handlePlaceOrder} className="py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Customer & Address Information (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-10">
            {/* Customer Details */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-[#1C1A19]">
                1. Customer Details
              </h3>

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
                    className="w-full text-xs px-3.5 py-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                    Mobile Phone (WhatsApp Active) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full text-xs px-3.5 py-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                  Email Address (For Order Receipts & Updates)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="karim@example.com"
                  className="w-full text-xs px-3.5 py-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                />
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-[#1C1A19]">
                2. Delivery Destination
              </h3>

              {!authUser ? (
                <div className="p-5 rounded-xl bg-white border border-[#D8CEBF] text-center space-y-3">
                  <MapPin className="w-6 h-6 text-[#643D26] mx-auto" />
                  <h4 className="text-xs uppercase font-semibold text-[#1C1A19]">Atelier Client Account Required</h4>
                  <p className="text-xs text-[#736B63] max-w-md mx-auto">
                    To maintain provenance, delivery certificates, and bespoke production records, please sign in or register your account before placing your commission.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('account')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D]"
                  >
                    Sign In / Register
                  </button>
                </div>
              ) : (
                <>
                  {authAddresses.length > 0 && (
                    <div className="space-y-2.5">
                      <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                        Select Delivery Residence
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {authAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              selectedAddressId === addr.id
                                ? 'border-[#643D26] bg-[#F5EFEB] ring-1 ring-[#643D26]/10'
                                : 'border-[#D8CEBF] bg-white hover:border-[#1C1A19]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#1C1A19] uppercase">{addr.title}</span>
                              {addr.is_default && (
                                <span className="text-[10px] bg-[#EAE4DC] text-[#643D26] px-1.5 py-0.5 rounded font-semibold">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#736B63] mt-1 line-clamp-1">
                              {addr.street}, Bldg {addr.building_number}
                            </p>
                            <p className="text-xs text-[#8F8880]">{addr.city}, {addr.country}</p>
                          </div>
                        ))}

                        <div
                          onClick={() => setSelectedAddressId('new')}
                          className={`p-3.5 rounded-xl border border-dashed cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-medium ${
                            selectedAddressId === 'new'
                              ? 'border-[#643D26] bg-[#FAF8F5] text-[#643D26]'
                              : 'border-[#D8CEBF] text-[#736B63] hover:border-[#1C1A19] hover:text-[#1C1A19]'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add New Delivery Residence</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedAddressId === 'new' || authAddresses.length === 0) && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                          Residence Label (e.g. Sahel Villa, Katameya Heights) *
                        </label>
                        <input
                          type="text"
                          required
                          value={addressTitle}
                          onChange={(e) => setAddressTitle(e.target.value)}
                          placeholder="e.g. North Coast Summer Villa"
                          className="w-full text-xs px-3.5 py-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                            Governorate / Region *
                          </label>
                          <select
                            value={governorate}
                            onChange={(e) => setGovernorate(e.target.value)}
                            className="w-full text-xs px-3.5 py-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none cursor-pointer"
                          >
                            {EGYPTIAN_GOVERNORATES.map((gov) => (
                              <option key={gov} value={gov}>
                                {gov}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                            City / Compound / Area *
                          </label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Marassi Sidi Abdel Rahman or New Cairo"
                            className="w-full text-xs px-3.5 py-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                          Street Address / Village Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="e.g. Catania Village, Coastal Road"
                          className="w-full text-xs px-3.5 py-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                            Building / Villa No. *
                          </label>
                          <input
                            type="text"
                            required
                            value={buildingNumber}
                            onChange={(e) => setBuildingNumber(e.target.value)}
                            placeholder="e.g. 42"
                            className="w-full text-xs px-3.5 py-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                            Apartment / Unit No. *
                          </label>
                          <input
                            type="text"
                            required
                            value={apartmentNumber}
                            onChange={(e) => setApartmentNumber(e.target.value)}
                            placeholder="e.g. 1"
                            className="w-full text-xs px-3.5 py-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none focus:border-[#643D26]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider font-medium text-[#1C1A19]">
                      Special Delivery Instructions / Gate Access Details (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="e.g. Gate 3, ground floor terrace with freight elevator access..."
                      className="w-full text-xs p-3 rounded-lg bg-white border border-[#D8CEBF] text-[#1C1A19] focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-[#1C1A19]">
                3. Choose 50% Deposit Payment Channel
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('instapay')}
                  className={`p-3.5 sm:p-4 rounded-xl border text-left flex flex-row sm:flex-col items-center sm:items-start justify-between transition-all ${
                    paymentMethod === 'instapay'
                      ? 'border-[#643D26] bg-[#F5EFEB] shadow-xs'
                      : 'border-[#D8CEBF] bg-white hover:border-[#1C1A19]'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:justify-between sm:w-full">
                    <Smartphone className="w-5 h-5 text-[#643D26]" />
                    <div className="sm:hidden">
                      <span className="block text-xs font-semibold uppercase text-[#1C1A19]">
                        InstaPay
                      </span>
                      <span className="text-[10px] text-[#736B63]">Instant Egyptian Bank Pay</span>
                    </div>
                  </div>
                  <div className="hidden sm:block mt-3">
                    <span className="block text-xs font-semibold uppercase text-[#1C1A19]">
                      InstaPay
                    </span>
                    <span className="text-[10px] text-[#736B63]">Instant Egyptian Bank Pay</span>
                  </div>
                  {paymentMethod === 'instapay' && (
                    <Check className="w-4 h-4 text-[#643D26] shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('vodafone_cash')}
                  className={`p-3.5 sm:p-4 rounded-xl border text-left flex flex-row sm:flex-col items-center sm:items-start justify-between transition-all ${
                    paymentMethod === 'vodafone_cash'
                      ? 'border-[#643D26] bg-[#F5EFEB] shadow-xs'
                      : 'border-[#D8CEBF] bg-white hover:border-[#1C1A19]'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:justify-between sm:w-full">
                    <CreditCard className="w-5 h-5 text-[#643D26]" />
                    <div className="sm:hidden">
                      <span className="block text-xs font-semibold uppercase text-[#1C1A19]">
                        Mobile Wallet
                      </span>
                      <span className="text-[10px] text-[#736B63]">Vodafone Cash / Orange</span>
                    </div>
                  </div>
                  <div className="hidden sm:block mt-3">
                    <span className="block text-xs font-semibold uppercase text-[#1C1A19]">
                      Mobile Wallet
                    </span>
                    <span className="text-[10px] text-[#736B63]">Vodafone Cash / Orange</span>
                  </div>
                  {paymentMethod === 'vodafone_cash' && (
                    <Check className="w-4 h-4 text-[#643D26] shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3.5 sm:p-4 rounded-xl border text-left flex flex-row sm:flex-col items-center sm:items-start justify-between transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#643D26] bg-[#F5EFEB] shadow-xs'
                      : 'border-[#D8CEBF] bg-white hover:border-[#1C1A19]'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:justify-between sm:w-full">
                    <Building2 className="w-5 h-5 text-[#643D26]" />
                    <div className="sm:hidden">
                      <span className="block text-xs font-semibold uppercase text-[#1C1A19]">
                        Bank Wire
                      </span>
                      <span className="text-[10px] text-[#736B63]">CIB Wire Transfer</span>
                    </div>
                  </div>
                  <div className="hidden sm:block mt-3">
                    <span className="block text-xs font-semibold uppercase text-[#1C1A19]">
                      Bank Wire
                    </span>
                    <span className="text-[10px] text-[#736B63]">CIB Wire Transfer</span>
                  </div>
                  {paymentMethod === 'bank_transfer' && (
                    <Check className="w-4 h-4 text-[#643D26] shrink-0" />
                  )}
                </button>
              </div>

              {/* Dynamic Account Details Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-3">
                {paymentMethod === 'instapay' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-semibold text-[#1C1A19]">
                        InstaPay Payment Details:
                      </span>
                      <span className="text-[10px] text-[#643D26] font-medium">Instant Verification</span>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-[#D8CEBF] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#736B63] block">
                          InstaPay IPA / Address:
                        </span>
                        <span className="text-xs font-mono font-bold text-[#1C1A19]">
                          {settings.paymentMethods.instapay.address}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(settings.paymentMethods.instapay.address, 'instapay')
                        }
                        className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#D8CEBF] text-[11px] uppercase tracking-wider font-medium text-[#1C1A19] hover:bg-[#EFEBE3] flex items-center gap-1.5"
                      >
                        {copiedField === 'instapay' ? (
                          <>
                            <Check className="w-3 h-3 text-[#25D366]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-[#736B63] leading-relaxed">
                      {settings.paymentMethods.instapay.instructions}
                    </p>
                  </div>
                )}

                {paymentMethod === 'vodafone_cash' && (
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#1C1A19] block">
                      Mobile Wallet Transfer:
                    </span>

                    <div className="p-3 bg-white rounded-lg border border-[#D8CEBF] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#736B63] block">
                          Wallet Number:
                        </span>
                        <span className="text-xs font-mono font-bold text-[#1C1A19]">
                          {settings.paymentMethods.vodafoneCash.number}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(settings.paymentMethods.vodafoneCash.number, 'wallet')
                        }
                        className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#D8CEBF] text-[11px] uppercase tracking-wider font-medium text-[#1C1A19] hover:bg-[#EFEBE3] flex items-center gap-1.5"
                      >
                        {copiedField === 'wallet' ? (
                          <>
                            <Check className="w-3 h-3 text-[#25D366]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-[#736B63] leading-relaxed">
                      {settings.paymentMethods.vodafoneCash.instructions}
                    </p>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#1C1A19] block">
                      CIB Bank Wire Transfer Details:
                    </span>

                    <div className="p-3 bg-white rounded-lg border border-[#D8CEBF] space-y-1.5 font-mono text-[11px] sm:text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#736B63]">Bank:</span>
                        <span className="font-semibold text-[#1C1A19]">
                          {settings.paymentMethods.bankTransfer.bankName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#736B63]">Account:</span>
                        <span className="font-semibold text-[#1C1A19]">
                          {settings.paymentMethods.bankTransfer.accountName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#736B63]">Acc No:</span>
                        <span className="font-semibold text-[#1C1A19]">
                          {settings.paymentMethods.bankTransfer.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#736B63]">IBAN:</span>
                        <span className="font-semibold text-[#1C1A19] break-all">
                          {settings.paymentMethods.bankTransfer.iban}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#736B63] leading-relaxed">
                      {settings.paymentMethods.bankTransfer.instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary & Placement (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4 sm:space-y-6">
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1A19]">
                Commission Summary ({cart.length} Pieces)
              </h3>

              {/* Items List */}
              <div className="space-y-3 sm:space-y-4 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-2.5 sm:gap-3 pb-3 border-b border-[#EAE4DC] text-xs">
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-[#EFEBE3] shrink-0 border border-[#E0D8CB]">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#1C1A19] truncate">{item.productName}</h4>
                      <p className="text-[10px] sm:text-[11px] text-[#736B63]">
                        {item.selectedFinish} · {item.selectedColor.name} · Qty: {item.quantity}
                      </p>
                      {item.customNote && (
                        <p className="text-[9px] sm:text-[10px] text-[#643D26] italic mt-0.5">
                          Note: {item.customNote}
                        </p>
                      )}
                    </div>
                    <div className="font-semibold text-xs text-[#1C1A19]">
                      {(item.unitPrice * item.quantity).toLocaleString()} EGP
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-1.5 sm:space-y-2 pt-2 text-xs text-[#524B45] border-t border-[#EAE4DC]">
                <div className="flex justify-between">
                  <span>Total Piece Value</span>
                  <span className="font-medium text-[#1C1A19]">{cartSubtotal.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-semibold text-[#643D26] pt-1">
                  <span>{settings.depositPercentage}% Handcrafted Deposit Due</span>
                  <span>{cartDepositAmount.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-[10px] sm:text-[11px] text-[#736B63]">
                  <span>Remaining 50% upon delivery</span>
                  <span>{cartRemainingAmount.toLocaleString()} EGP</span>
                </div>
              </div>

              {/* Deposit Guarantee Note */}
              <div className="p-3 sm:p-3.5 rounded-lg bg-[#F5F0E8] border border-[#E6DDCE] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#643D26] shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-[11px] text-[#524B45] leading-relaxed">
                  Upon placing this order, you will receive an official Order Reference. You may submit
                  your deposit confirmation on the next screen or via WhatsApp.
                </p>
              </div>

              {/* API Error Display */}
              {apiError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-red-800">{apiError}</p>
                    {Object.keys(apiFieldErrors).length > 0 && (
                      <ul className="list-disc list-inside text-[11px] text-red-700 space-y-0.5">
                        {Object.entries(apiFieldErrors).map(([field, msgs]) => (
                          <li key={field}>
                            <span className="capitalize">{field.replace('_', ' ')}</span>: {msgs.join(', ')}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Place Order CTA */}
              <button
                id="place-order-submit-btn"
                type="submit"
                disabled={isSubmitting || !authUser}
                className="w-full py-3.5 sm:py-4 rounded-full bg-[#1C1A19] text-white text-[11px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.25em] font-medium hover:bg-[#332F2D] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Commission...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Order & Proceed to Deposit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
