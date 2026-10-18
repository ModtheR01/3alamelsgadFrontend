'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { toWhatsAppNumber } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Package,
  Truck,
  AlertCircle,
  Ruler,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import { BackendOrder, BackendOrderItem, BackendOrderBundleItem, ORDER_STATUS_LABELS } from '@/types/order';

export default function OrderConfirmationView() {
  const { lastCreatedOrder, submitPaymentProof, navigateTo, settings } = useToccoStore();
  const { t, isRtl } = useLanguage();

  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [proofNote, setProofNote] = useState('');
  const [copiedOrder, setCopiedOrder] = useState(false);

  if (!lastCreatedOrder) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <p className="text-lg text-[#251811] font-medium">
          {t('لا يوجد طلب حديث لعرضه', 'No recent order found')}
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 rounded-full bg-[#251811] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#3D291D] transition-colors"
        >
          {t('العودة لتشكيلات السجاد', 'Return to Catalog')}
        </button>
      </div>
    );
  }

  const rawOrder = lastCreatedOrder as any;

  // Adapt between BackendOrder and legacy Order
  const isBackend = 'order_number' in rawOrder;
  const orderNumber = isBackend ? rawOrder.order_number : rawOrder.orderNumber;
  const totalAmount = isBackend ? Number(rawOrder.total_price || 0) : Number(rawOrder.totalAmount || 0);

  const customerName = isBackend
    ? (rawOrder.user ? `${rawOrder.user.first_name || ''} ${rawOrder.user.last_name || ''}`.trim() : '') ||
      rawOrder.shipping_address?.title ||
      t('عميلنا العزيز', 'Dear Customer')
    : rawOrder.customer.fullName;

  const customerCity = isBackend
    ? (isRtl ? rawOrder.shipping_governorate_name_ar : rawOrder.shipping_governorate_name_en) ||
      rawOrder.shipping_address?.city ||
      'مصر'
    : rawOrder.customer.city;

  const customerRegion = isBackend
    ? rawOrder.shipping_address?.country || 'مصر'
    : rawOrder.customer.governorate;

  const addressDetails = isBackend
    ? [
        rawOrder.shipping_address?.building_number ? `${t('عمارة', 'Bldg')} ${rawOrder.shipping_address.building_number}` : '',
        rawOrder.shipping_address?.apartment_number ? `${t('شقة', 'Apt')} ${rawOrder.shipping_address.apartment_number}` : '',
        rawOrder.shipping_address?.street || '',
        rawOrder.shipping_address?.city || '',
        (isRtl ? rawOrder.shipping_governorate_name_ar : rawOrder.shipping_governorate_name_en) ||
          rawOrder.shipping_address?.shipping_governorate_name_ar ||
          rawOrder.shipping_address?.shipping_governorate_name_en ||
          rawOrder.shipping_address?.country || '',
      ].filter(Boolean).join('، ')
    : [
        rawOrder.customer.streetAddress || rawOrder.customer.street || '',
        rawOrder.customer.buildingDetails || '',
        rawOrder.customer.city || '',
        rawOrder.customer.governorate || '',
      ].filter(Boolean).join('، ');

  // Financial breakdown
  const subtotal = isBackend
    ? (rawOrder.subtotal != null ? Number(rawOrder.subtotal) : totalAmount)
    : (rawOrder.items?.reduce((acc: number, it: any) => acc + (it.subtotal != null ? Number(it.subtotal) : (Number(it.unitPrice || 0) * Number(it.quantity || 1))), 0) || totalAmount);

  const discountAmount = isBackend
    ? Number(rawOrder.discount_amount || 0)
    : 0;

  const shippingAmount = isBackend
    ? Number(rawOrder.shipping_amount || 0)
    : 0;

  const depositAmount = isBackend
    ? (Number(rawOrder.deposit_amount) || (rawOrder.payment?.amount ? Number(rawOrder.payment.amount) : 0))
    : (rawOrder.depositAmount || 0);

  const remainingAmount = isBackend
    ? Math.max(0, totalAmount - depositAmount)
    : (rawOrder.remainingAmount != null ? rawOrder.remainingAmount : Math.max(0, totalAmount - depositAmount));

  interface NormalizedOrderItem {
    id: string | number;
    isArwal: boolean;
    title: string;
    specs: string | null;
    finish: string | null;
    colorName: string | null;
    colorHex: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }

  interface NormalizedOrderBundleItem {
    id: number;
    name: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    products: { name: string; quantity: number }[];
    arwals: { name: string; quantity: number }[];
  }

  // Items normalization
  const items: NormalizedOrderItem[] = isBackend
    ? ((rawOrder.items || []) as BackendOrderItem[]).map((it: BackendOrderItem) => {
        const isArwal = it.item_type === 'arwal' || Boolean(it.arwal || it.width || it.length);
        const title = isArwal
          ? (isRtl ? it.arwal_name_ar || it.arwal_name_en : it.arwal_name_en || it.arwal_name_ar) || t('رول أروال بالمتر', 'Arwal Runner Roll')
          : (isRtl ? it.product_name_ar || it.product_name_en || it.product_name : it.product_name_en || it.product_name_ar || it.product_name) || t('سجادة فاخرة', 'Luxury Carpet');

        let specs: string | null = null;
        if (isArwal) {
          const parts: string[] = [];
          if (it.width) parts.push(isRtl ? `عرض ${it.width} سم` : `W ${it.width} cm`);
          if (it.length) parts.push(isRtl ? `طول ${it.length} م` : `L ${it.length} m`);
          specs = parts.length > 0 ? parts.join(' × ') : t('رول بالمتر', 'Roll runner');
        } else if (it.size_width && it.size_length) {
          specs = `${it.size_width} × ${it.size_length} ${t('سم', 'cm')}`;
        }

        const finish = it.selected_finish === 'GLOSSY'
          ? t('لامع', 'Glossy')
          : it.selected_finish === 'MATTE'
          ? t('مطفي', 'Matte')
          : null;

        const colorName = isRtl
          ? (it.color_name_ar || it.color_name || it.color_name_en)
          : (it.color_name_en || it.color_name || it.color_name_ar);

        const colorHex = it.color_hex_code || null;
        const unitPrice = Number(it.unit_price || it.price_per_length || it.product_price || 0);
        const quantity = it.quantity || 1;
        const itemSubtotal = it.subtotal != null ? Number(it.subtotal) : (unitPrice * quantity);

        return {
          id: it.id,
          isArwal,
          title,
          specs,
          finish,
          colorName,
          colorHex,
          quantity,
          unitPrice,
          subtotal: itemSubtotal,
        };
      })
    : ((rawOrder.items || []) as any[]).map((it: any) => {
        const isArwal = Boolean(it.arwalConfig || it.arawalConfig);
        const title = isRtl
          ? (it.product?.name_ar || it.productName || it.product?.name_en)
          : (it.product?.name_en || it.productName || it.product?.name_ar) || t('سجادة فاخرة', 'Luxury Carpet');

        let specs: string | null = null;
        if (isArwal) {
          const cfg = it.arwalConfig || it.arawalConfig;
          specs = `${cfg?.width ? (isRtl ? `عرض ${cfg.width} سم` : `W ${cfg.width} cm`) : ''} × ${cfg?.lengthMeters ? (isRtl ? `طول ${cfg.lengthMeters} م` : `L ${cfg.lengthMeters} m`) : ''}`;
        } else if (it.selectedSize?.width && it.selectedSize?.length) {
          specs = `${it.selectedSize.width} × ${it.selectedSize.length} ${t('سم', 'cm')}`;
        } else if (it.selectedSize?.name) {
          specs = it.selectedSize.name;
        }

        const finish = it.selectedFinish === 'GLOSSY'
          ? t('لامع', 'Glossy')
          : it.selectedFinish === 'MATTE'
          ? t('مطفي', 'Matte')
          : null;

        const colorName = it.selectedColor?.name || null;
        const colorHex = it.selectedColor?.hex || null;
        const unitPrice = Number(it.unitPrice || it.selectedSize?.price || it.product?.price || 0);
        const quantity = it.quantity || 1;
        const itemSubtotal = Number(it.subtotal != null ? it.subtotal : (unitPrice * quantity));

        return {
          id: it.id,
          isArwal,
          title,
          specs,
          finish,
          colorName,
          colorHex,
          quantity,
          unitPrice,
          subtotal: itemSubtotal,
        };
      });

  const bundles: NormalizedOrderBundleItem[] = (isBackend && Array.isArray(rawOrder.bundles))
    ? (rawOrder.bundles as BackendOrderBundleItem[]).map((b: BackendOrderBundleItem) => ({
        id: b.id,
        name: isRtl ? (b.name_ar || b.name_en) : (b.name_en || b.name_ar),
        unitPrice: Number(b.bundle_price) || 0,
        quantity: b.quantity || 1,
        subtotal: (Number(b.bundle_price) || 0) * (b.quantity || 1),
        products: (b.products || []).map((p: any) => ({
          name: isRtl ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar),
          quantity: p.quantity,
        })),
        arwals: (b.arwals || []).map((a: any) => ({
          name: isRtl ? (a.name_ar || a.name_en) : (a.name_en || a.name_ar),
          quantity: a.quantity,
        })),
      }))
    : [];

  const currentStatusLabel = isBackend && rawOrder.status
    ? (ORDER_STATUS_LABELS[rawOrder.status as keyof typeof ORDER_STATUS_LABELS] || rawOrder.status)
    : t('غير مؤكد', 'Not Confirmed');

  const statusStep = isBackend
    ? rawOrder.status === 'CONFIRMED'
      ? 2
      : rawOrder.status === 'PROCESSING'
      ? 3
      : rawOrder.status === 'SHIPPED'
      ? 4
      : rawOrder.status === 'DELIVERED'
      ? 5
      : 1
    : 1;

  const handleProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPaymentProof(String(rawOrder.id), proofNote);
    setProofSubmitted(true);
  };

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const whatsappTargetNumber = settings.contact?.whatsapp || BRAND_CONFIG.whatsappNumber;
  const proofWhatsappUrl = `https://wa.me/${toWhatsAppNumber(whatsappTargetNumber)}?text=${encodeURIComponent(
    `مرحباً عالم السجاد، تم تسجيل الطلب رقم #${orderNumber} بإجمالي ${totalAmount.toLocaleString()} ج.م. مرفق إيصال التحويل للمراجعة والتأكيد.`
  )}`;

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const dynamicInstapayAddress = settings.paymentMethods?.instapay?.address;
  const dynamicInstapayNumber = settings.paymentMethods?.instapay?.number;
  const dynamicWalletNumber = settings.paymentMethods?.mobileWallet?.number || settings.paymentMethods?.vodafoneCash?.number;

  return (
    <div id="order-confirmation-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header Ribbon */}
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
            {t('تم تسجيل طلبك بنجاح في عالم السجاد', 'Order Successfully Recorded')}
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#251811] tracking-tight">
            {t('شكراً لك،', 'Thank you,')} {customerName}
          </h1>

          <p className="text-xs sm:text-sm text-[#736357] max-w-lg mx-auto font-normal leading-relaxed">
            {t(
              'تم استلام طلبك وحفظه في النظام. يرجى إتمام تحويل دفعة الشحن/الطلب لتأكيد المعاينة وتجهيز الشحنة.',
              'Your order has been recorded. Please complete your transfer to verify and dispatch your carpets.'
            )}
          </p>

          {/* Order Reference Number */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-[#DFD6C9] text-xs font-mono shadow-xs">
            <span className="text-[#8A796B] font-sans font-medium">{t('رقم الطلب:', 'Order #:')}</span>
            <span className="font-extrabold text-[#251811]">{orderNumber}</span>
            <button
              onClick={copyOrderNumber}
              className="text-[#A27B5C] hover:text-[#7A5437] transition-colors p-1"
              title="Copy"
            >
              {copiedOrder ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Order Status Pipeline Card (MANDATORY REQUIREMENT) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8DEC0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B7791F]" />
              <h3 className="text-sm font-bold text-[#251811]">
                {t('حالة الطلب الحالية:', 'Current Order Status:')}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FFF8E6] border border-[#F6E05E] text-[#B7791F] font-bold text-xs">
              {currentStatusLabel}
            </span>
          </div>

          <p className="text-xs text-[#7A6A5E] leading-relaxed">
            {t(
              'تسجيل الطلب لا يعني التأكيد النهائي فوراً. يتم فحص المقاسات وإيصال التحويل من قِبل إدارة عالم السجاد ثم تحويل الحالة إلى (مؤكد).',
              'Placing an order is not automatically confirmed. Measurements and deposit receipts are verified by our team before confirming.'
            )}
          </p>

          {/* Stepper Visualization */}
          <div className="pt-2 grid grid-cols-5 gap-1 text-center text-[10px] sm:text-xs">
            <div className={`p-2 rounded-lg font-bold transition-colors ${statusStep >= 1 ? 'bg-[#FAF5EB] border border-[#A27B5C] text-[#A27B5C]' : 'bg-[#F9F7F4] text-[#9C8A7C]'}`}>
              1. {t('غير مؤكد', 'Not Confirmed')}
            </div>
            <div className={`p-2 rounded-lg font-bold transition-colors ${statusStep >= 2 ? 'bg-[#FAF5EB] border border-[#A27B5C] text-[#A27B5C]' : 'bg-[#F9F7F4] text-[#9C8A7C]'}`}>
              2. {t('مؤكد', 'Confirmed')}
            </div>
            <div className={`p-2 rounded-lg font-bold transition-colors ${statusStep >= 3 ? 'bg-[#FAF5EB] border border-[#A27B5C] text-[#A27B5C]' : 'bg-[#F9F7F4] text-[#9C8A7C]'}`}>
              3. {t('جاري التجهيز', 'Preparing')}
            </div>
            <div className={`p-2 rounded-lg font-bold transition-colors ${statusStep >= 4 ? 'bg-[#FAF5EB] border border-[#A27B5C] text-[#A27B5C]' : 'bg-[#F9F7F4] text-[#9C8A7C]'}`}>
              4. {t('تم الشحن', 'Shipped')}
            </div>
            <div className={`p-2 rounded-lg font-bold transition-colors ${statusStep >= 5 ? 'bg-[#FAF5EB] border border-[#A27B5C] text-[#A27B5C]' : 'bg-[#F9F7F4] text-[#9C8A7C]'}`}>
              5. {t('تم التسليم', 'Delivered')}
            </div>
          </div>
        </div>

        {/* Transfer Instructions & Direct WhatsApp Confirmation */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF6F0] border border-[#E8DEC0] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#251811]">
            {t('بيانات تحويل الدفعة أو مصاريف الشحن:', 'Transfer & Deposit Details:')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {Boolean(dynamicInstapayAddress?.trim() || dynamicInstapayNumber?.trim()) && (
              <div className="p-3.5 rounded-xl bg-white border border-[#DFD6C9] space-y-2">
                <span className="text-[#8A796B] font-bold block">{t('إنستاباي (InstaPay):', 'InstaPay:')}</span>
                {Boolean(dynamicInstapayAddress?.trim()) && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#FAF8F5] border border-[#EAE3D8]">
                    <div>
                      <span className="text-[10px] text-[#8A796B] block">{t('عنوان التحويل (IPA):', 'Address (IPA):')}</span>
                      <span className="font-mono font-bold text-xs text-[#251811] block">{dynamicInstapayAddress}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(dynamicInstapayAddress!, 'order_insta_addr')}
                      className="p-1 text-[#A27B5C] hover:text-[#7A5437] transition-colors"
                      title={t('نسخ عنوان إنستاباي', 'Copy InstaPay Address')}
                      aria-label="نسخ عنوان إنستاباي"
                    >
                      {copiedField === 'order_insta_addr' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                {Boolean(dynamicInstapayNumber?.trim()) && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#FAF8F5] border border-[#EAE3D8]">
                    <div>
                      <span className="text-[10px] text-[#8A796B] block">{t('رقم إنستا باي:', 'InstaPay Phone:')}</span>
                      <span className="font-mono font-bold text-xs text-[#251811] block">{dynamicInstapayNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(dynamicInstapayNumber!, 'order_insta_num')}
                      className="p-1 text-[#A27B5C] hover:text-[#7A5437] transition-colors"
                      title={t('نسخ رقم إنستا باي', 'Copy InstaPay Number')}
                      aria-label="نسخ رقم إنستا باي"
                    >
                      {copiedField === 'order_insta_num' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
                <span className="text-[11px] text-[#A27B5C] block">{t('باسم: عالم السجاد', 'Account: Alamelsgad')}</span>
              </div>
            )}

            {Boolean(dynamicWalletNumber?.trim()) && (
              <div className="p-3.5 rounded-xl bg-white border border-[#DFD6C9] space-y-2">
                <span className="text-[#8A796B] font-bold block">{t('المحفظة الإلكترونية:', 'Electronic Wallet:')}</span>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#FAF8F5] border border-[#EAE3D8]">
                  <div>
                    <span className="text-[10px] text-[#8A796B] block">{t('رقم المحفظة:', 'Wallet Number:')}</span>
                    <span className="font-mono font-bold text-xs text-[#251811] block">{dynamicWalletNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(dynamicWalletNumber!, 'order_wallet_num')}
                    className="p-1 text-[#A27B5C] hover:text-[#7A5437] transition-colors"
                    title={t('نسخ رقم المحفظة', 'Copy Wallet Number')}
                    aria-label="نسخ رقم المحفظة"
                  >
                    {copiedField === 'order_wallet_num' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-[#A27B5C] block">{t('مثال: فودافون كاش ومحافظ الهواتف', 'e.g. Vodafone Cash / Mobile Wallets')}</span>
              </div>
            )}

            {!dynamicInstapayAddress?.trim() && !dynamicInstapayNumber?.trim() && !dynamicWalletNumber?.trim() && (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-white border border-[#DFD6C9]">
                <p className="text-xs text-[#5C4A3E]">
                  {t('يرجى التواصل مع خدمة العملاء عبر واتساب للحصول على تفاصيل الدفع والتحويل.', 'Please contact customer support via WhatsApp for payment details.')}
                </p>
              </div>
            )}
          </div>

          {/* Direct WhatsApp Share CTA */}
          <div className="pt-2">
            <a
              href={proofWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t('إرسال إيصال التحويل عبر واتساب لتسريع التأكيد', 'Send Receipt via WhatsApp to Expedite')}</span>
            </a>
          </div>
        </div>

        {/* Items & Bundles Summary */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8DEC0] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0E8DC]">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#A27B5C]" />
              <h3 className="text-sm font-bold text-[#251811]">{t('محتويات الطلب', 'Purchased Items')}</h3>
            </div>
            <span className="text-xs font-semibold text-[#8A796B]">
              {items.length + bundles.length} {t('عناصر', 'items')}
            </span>
          </div>

          {/* Items List */}
          <div className="divide-y divide-[#F5EFEB]">
            {items.map((it, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#251811]">{it.title}</span>
                    {it.isArwal ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF5EB] text-[#A27B5C] font-bold border border-[#E8DEC0]">
                        {t('رول بالمتر', 'Roll runner')}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5EFEB] text-[#7A6A5E] font-medium">
                        {t('سجادة', 'Carpet')}
                      </span>
                    )}
                  </div>

                  {/* Specs, Color, and Finish Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A6A5E]">
                    {it.specs && (
                      <span className="inline-flex items-center gap-1 font-medium bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EAE3D8] text-[11px] text-[#251811]">
                        <Ruler className="w-3 h-3 text-[#A27B5C]" />
                        {it.specs}
                      </span>
                    )}
                    {it.colorName && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EAE3D8]">
                        {it.colorHex && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0 inline-block"
                            style={{ backgroundColor: it.colorHex }}
                          />
                        )}
                        <span>{it.colorName}</span>
                      </span>
                    )}
                    {it.finish && (
                      <span className="text-[11px] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EAE3D8] text-[#8A796B]">
                        {it.finish}
                      </span>
                    )}
                  </div>

                  {/* Quantity & Unit Price */}
                  <div className="text-[11px] text-[#8A796B] flex items-center gap-1.5 pt-0.5">
                    <span>{t('الكمية:', 'Qty:')} <strong className="text-[#251811]">{it.quantity}</strong></span>
                    <span>•</span>
                    <span>{t('سعر الوحدة:', 'Unit price:')} <strong className="text-[#251811]">{it.unitPrice.toLocaleString()} {t('ج.م', 'EGP')}</strong></span>
                  </div>
                </div>

                {/* Item Subtotal */}
                <div className="text-start sm:text-end shrink-0 sm:self-center">
                  <span className="text-xs text-[#8A796B] block sm:hidden">{t('الإجمالي:', 'Subtotal:')}</span>
                  <span className="font-extrabold text-sm sm:text-base text-[#251811]">
                    {it.subtotal.toLocaleString()} {t('ج.م', 'EGP')}
                  </span>
                </div>
              </div>
            ))}

            {/* Bundles (if any) */}
            {bundles.map((b, bIdx) => (
              <div key={`bundle-${bIdx}`} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#251811]">{b.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF8E6] text-[#B7791F] font-bold border border-[#F6E05E]">
                      {t('عرض باقة', 'Bundle')}
                    </span>
                  </div>

                  {/* Included items */}
                  <div className="text-[11px] text-[#7A6A5E] space-y-0.5">
                    {b.products.map((p, pIdx) => (
                      <div key={`bp-${pIdx}`}>• {p.name} × {p.quantity}</div>
                    ))}
                    {b.arwals.map((a, aIdx) => (
                      <div key={`ba-${aIdx}`}>• {a.name} × {a.quantity}</div>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#8A796B] flex items-center gap-1.5 pt-0.5">
                    <span>{t('الكمية:', 'Qty:')} <strong className="text-[#251811]">{b.quantity}</strong></span>
                    <span>•</span>
                    <span>{t('سعر الباقة:', 'Bundle price:')} <strong className="text-[#251811]">{b.unitPrice.toLocaleString()} {t('ج.م', 'EGP')}</strong></span>
                  </div>
                </div>

                <div className="text-start sm:text-end shrink-0 sm:self-center">
                  <span className="text-xs text-[#8A796B] block sm:hidden">{t('الإجمالي:', 'Subtotal:')}</span>
                  <span className="font-extrabold text-sm sm:text-base text-[#251811]">
                    {b.subtotal.toLocaleString()} {t('ج.م', 'EGP')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Complete Financial Breakdown */}
          <div className="pt-4 border-t border-[#F0E8DC] space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#7A6A5E]">
              <span>{t('المجموع الفرعي للمنتجات:', 'Items Subtotal:')}</span>
              <span className="font-medium text-[#251811]">
                {subtotal.toLocaleString()} {t('ج.م', 'EGP')}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-700">
                <span>{t('إجمالي الخصم:', 'Discount:')}</span>
                <span className="font-bold">
                  -{discountAmount.toLocaleString()} {t('ج.م', 'EGP')}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-[#7A6A5E]">
              <span>{t('مصاريف الشحن والتوصيل:', 'Shipping:')}</span>
              <span className="font-medium text-[#251811]">
                {shippingAmount > 0 ? `${shippingAmount.toLocaleString()} ${t('ج.م', 'EGP')}` : t('شحن مجاني', 'Free Shipping')}
              </span>
            </div>

            <div className="pt-2 border-t border-[#F0E8DC] flex justify-between items-center text-sm font-bold text-[#251811]">
              <span>{t('إجمالي الطلب:', 'Total Order:')}</span>
              <span className="text-base font-extrabold text-[#A27B5C]">
                {totalAmount.toLocaleString()} {t('ج.م', 'EGP')}
              </span>
            </div>

            {depositAmount > 0 && (
              <div className="pt-1 flex justify-between items-center text-xs font-semibold text-[#B7791F]">
                <span>{t('دفعة التأكيد المطلوبة:', 'Required Deposit:')}</span>
                <span>{depositAmount.toLocaleString()} {t('ج.م', 'EGP')}</span>
              </div>
            )}

            {remainingAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-[#7A6A5E]">
                <span>{t('المتبقي عند الاستلام:', 'Remaining upon delivery:')}</span>
                <span className="font-bold text-[#251811]">{remainingAmount.toLocaleString()} {t('ج.م', 'EGP')}</span>
              </div>
            )}
          </div>

          {/* Delivery Area / Address summary */}
          <div className="pt-3 border-t border-[#F0E8DC] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#7A6A5E] gap-1">
            <span className="text-[#8A796B]">{t('عنوان التسليم:', 'Delivery Address:')}</span>
            <span className="font-bold text-[#251811] text-start sm:text-end">{addressDetails || `${customerCity} - ${customerRegion}`}</span>
          </div>
        </div>

        {/* Return Button */}
        <div className="text-center pt-2">
          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#251811] hover:text-[#A27B5C] transition-colors"
          >
            <span>{t('متابعة التسوق واستكشاف المزيد', 'Continue Shopping & Browse More')}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
