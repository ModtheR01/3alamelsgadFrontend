'use client';

import React, { useState } from 'react';
import { StoreSettings } from '@/types';
import {
  Settings,
  CreditCard,
  Phone,
  Building,
  Check,
  Percent,
  Save,
  AlertCircle,
} from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/brandConfig';

interface SettingsSectionProps {
  settings: StoreSettings;
  onUpdateSettings: (patch: Partial<StoreSettings>) => void;
}

export default function SettingsSection({
  settings,
  onUpdateSettings,
}: SettingsSectionProps) {
  const [depositPct, setDepositPct] = useState(String(settings.depositPercentage || 50));
  const [phone, setPhone] = useState(settings.contact?.phone || BRAND_CONFIG.phone);
  const [whatsapp, setWhatsapp] = useState(settings.contact?.whatsapp || BRAND_CONFIG.whatsappNumber);
  const [address, setAddress] = useState(settings.contact?.atelierAddress || BRAND_CONFIG.addressAr);
  const [hours, setHours] = useState(settings.contact?.hours || BRAND_CONFIG.hoursAr);

  const [instapayAddress, setInstapayAddress] = useState(
    settings.paymentMethods?.instapay?.address || 'alamelsgad@instapay'
  );
  const [vodafoneNumber, setVodafoneNumber] = useState(
    settings.paymentMethods?.vodafoneCash?.number || '01010750072'
  );

  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      depositPercentage: Number(depositPct),
      contact: {
        ...settings.contact,
        phone,
        whatsapp,
        atelierAddress: address,
        hours,
      },
      paymentMethods: {
        ...settings.paymentMethods,
        instapay: {
          ...settings.paymentMethods.instapay,
          address: instapayAddress,
        },
        vodafoneCash: {
          ...settings.paymentMethods.vodafoneCash,
          number: vodafoneNumber,
        },
      },
    });

    setToast('Store settings saved successfully.');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#241710] tracking-tight">
            Store & Payment Settings
          </h1>
          <p className="text-xs text-[#8C7A6B]">
            Configure deposit rules, payment gateway phone/addresses, and showroom contact info.
          </p>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Deposit Policy */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#241710]">
            <Percent className="w-4 h-4 text-[#A27B5C]" />
            <span>Deposit & Advance Order Policy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-[#241710]">
                Standard Deposit Requirement (%) *
              </label>
              <input
                type="number"
                min={10}
                max={100}
                required
                value={depositPct}
                onChange={(e) => setDepositPct(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
              />
              <p className="text-[11px] text-[#8C7A6B]">
                Percentage required when customer selects paying advance deposit.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Gateways Config */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#241710]">
            <CreditCard className="w-4 h-4 text-[#A27B5C]" />
            <span>Payment Methods Accounts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-[#241710]">InstaPay IPA / Address</label>
              <input
                type="text"
                value={instapayAddress}
                onChange={(e) => setInstapayAddress(e.target.value)}
                placeholder="e.g. alamelsgad@instapay"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-[#241710]">Vodafone Cash Wallet Phone</label>
              <input
                type="text"
                value={vodafoneNumber}
                onChange={(e) => setVodafoneNumber(e.target.value)}
                placeholder="e.g. 01010750072"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
              />
            </div>
          </div>
        </div>

        {/* Contact & Showroom */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#241710]">
            <Building className="w-4 h-4 text-[#A27B5C]" />
            <span>Showroom & Contact Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-[#241710]">Official Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-[#241710]">WhatsApp Concierge Number</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block font-bold text-[#241710]">Showroom Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block font-bold text-[#241710]">Operating Hours</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#241710] text-white hover:bg-[#3D281C] text-xs font-semibold flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
