'use client';

import React, { useState } from 'react';
import { StoreSettings } from '@/types';
import {
  CreditCard,
  Building,
  Check,
  Save,
  Phone,
  Clock,
  MapPin,
  Smartphone,
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
  const [phone, setPhone] = useState(settings.contact?.phone ?? BRAND_CONFIG.phone);
  const [whatsapp, setWhatsapp] = useState(settings.contact?.whatsapp ?? BRAND_CONFIG.whatsappNumber);
  const [address, setAddress] = useState(settings.contact?.atelierAddress ?? BRAND_CONFIG.addressAr);
  const [hours, setHours] = useState(settings.contact?.hours ?? BRAND_CONFIG.hoursAr);

  const [instapayAddress, setInstapayAddress] = useState(
    settings.paymentMethods?.instapay?.address ?? ''
  );
  const [instapayNumber, setInstapayNumber] = useState(
    settings.paymentMethods?.instapay?.number ?? ''
  );
  const [walletNumber, setWalletNumber] = useState(
    settings.paymentMethods?.mobileWallet?.number ||
    settings.paymentMethods?.vodafoneCash?.number ||
    ''
  );

  const [toast, setToast] = useState<string | null>(null);

  // Sync state when settings prop updates
  React.useEffect(() => {
    if (settings.contact?.phone !== undefined) setPhone(settings.contact.phone);
    if (settings.contact?.whatsapp !== undefined) setWhatsapp(settings.contact.whatsapp);
    if (settings.contact?.atelierAddress !== undefined) setAddress(settings.contact.atelierAddress);
    if (settings.contact?.hours !== undefined) setHours(settings.contact.hours);
    if (settings.paymentMethods?.instapay?.address !== undefined) setInstapayAddress(settings.paymentMethods.instapay.address);
    if (settings.paymentMethods?.instapay?.number !== undefined) setInstapayNumber(settings.paymentMethods.instapay.number);
    const wNum = settings.paymentMethods?.mobileWallet?.number || settings.paymentMethods?.vodafoneCash?.number;
    if (wNum !== undefined) {
      setWalletNumber(wNum);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
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
          number: instapayNumber,
        },
        mobileWallet: {
          ...settings.paymentMethods.mobileWallet,
          number: walletNumber,
        },
        vodafoneCash: {
          ...settings.paymentMethods.vodafoneCash,
          number: walletNumber,
        },
      },
    });

    setToast('تم حفظ إعدادات المتجر بنجاح.');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
            إعدادات المتجر ووسائل الدفع
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            ضبط بيانات الحسابات للتحويل البنكي ومحافظ الدفع الإلكتروني، ومعلومات التواصل والمعرض.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
        >
          <Save className="w-4 h-4 text-[#EED8BE]" />
          <span>حفظ التعديلات</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{toast}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Payment Gateways Config */}
        <div className="p-6 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-bold text-[#241710] pb-2 border-b border-[#FAF5EB]">
            <div className="p-2 rounded-xl bg-[#FAF5EB] text-[#A27B5C]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#241710]">بيانات وسائل الدفع والتحويل</h3>
              <p className="text-[11px] text-[#8C7A6B]">
                تظهر هذه الحسابات للعملاء عند اختيار الدفع عبر إنستاباي أو فودافون كاش في صفحة الدفع
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-[#241710] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#A27B5C]" />
                <span>عنوان إنستاباي (InstaPay IPA)</span>
              </label>
              <input
                type="text"
                value={instapayAddress}
                onChange={(e) => setInstapayAddress(e.target.value)}
                placeholder="مثال: alamelsgad@instapay"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-mono focus:outline-none focus:border-[#241710]"
              />
              <p className="text-[10px] text-[#8C7A6B]">
                معرف إنستاباي الذي يقوم العميل بالتحويل إليه
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-[#241710] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#A27B5C]" />
                <span>رقم إنستا باي</span>
              </label>
              <input
                type="text"
                value={instapayNumber}
                onChange={(e) => setInstapayNumber(e.target.value)}
                placeholder="مثال: 01010750072"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-mono focus:outline-none focus:border-[#241710]"
              />
              <p className="text-[10px] text-[#8C7A6B]">
                رقم الهاتف المرتبط بحساب إنستا باي لاستقبال التحويلات
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block font-bold text-[#241710] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#A27B5C]" />
                <span>رقم المحفظة الإلكترونية</span>
              </label>
              <input
                type="text"
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value)}
                placeholder="مثال: فودافون كاش"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] font-mono focus:outline-none focus:border-[#241710]"
              />
              <p className="text-[10px] text-[#8C7A6B]">
                مثال: فودافون كاش · رقم الهاتف المعتمد لاستلام تحويلات المحافظ الإلكترونية
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Showroom Details */}
        <div className="p-6 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-bold text-[#241710] pb-2 border-b border-[#FAF5EB]">
            <div className="p-2 rounded-xl bg-[#FAF5EB] text-[#A27B5C]">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#241710]">معلومات المعرض وخدمة العملاء</h3>
              <p className="text-[11px] text-[#8C7A6B]">
                بيانات التواصل الرسمية ومواعيد العمل المعروضة في تذييل المتجر وصفحة الاتصال
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-[#241710] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#A27B5C]" />
                <span>رقم الهاتف المباشر</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-[#241710] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
                <span>رقم خدمة عملاء واتساب</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block font-bold text-[#241710] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#A27B5C]" />
                <span>عنوان المعرض والفرع الرئيسي</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block font-bold text-[#241710] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#A27B5C]" />
                <span>مواعيد العمل واستقبال العملاء</span>
              </label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE3D8] bg-[#FAF8F5] text-[#241710] focus:outline-none focus:border-[#241710]"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#241710] hover:bg-[#3D291D] text-[#FAF5EB] text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            <Save className="w-4 h-4 text-[#EED8BE]" />
            <span>حفظ إعدادات المتجر</span>
          </button>
        </div>
      </form>
    </div>
  );
}
