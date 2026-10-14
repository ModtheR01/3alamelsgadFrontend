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
} from 'lucide-react';
import Image from '@/components/SafeImage';

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

  const rawOrder = lastCreatedOrder;

  // Adapt between BackendOrder and legacy Order
  const isBackend = 'order_number' in rawOrder;
  const orderNumber = isBackend ? rawOrder.order_number : rawOrder.orderNumber;
  const totalAmount = isBackend ? Number(rawOrder.total_price) : rawOrder.totalAmount;
  const customerName = isBackend
    ? rawOrder.shipping_address?.title || 'عميلنا العزيز'
    : rawOrder.customer.fullName;
  const customerCity = isBackend ? rawOrder.shipping_address?.city || 'مصر' : rawOrder.customer.city;
  const customerRegion = isBackend ? rawOrder.shipping_address?.country || 'مصر' : rawOrder.customer.governorate;

  const items = isBackend
    ? rawOrder.items.map((it) => ({
        id: it.id,
        productName: it.product_name,
        productImage:
          'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
        selectedFinish: it.selected_finish || '',
        selectedColor: it.color_name
          ? { id: it.color_name, name: it.color_name, hex: it.color_hex_code || '#D2C1AF' }
          : undefined,
        quantity: it.quantity,
        unitPrice: Number(it.product_price),
      }))
    : rawOrder.items;

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
              {t('غير مؤكد', 'Not Confirmed')}
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
            <div className="p-2 rounded-lg bg-[#FAF5EB] border border-[#A27B5C] text-[#A27B5C] font-bold">
              1. {t('غير مؤكد', 'Not Confirmed')}
            </div>
            <div className="p-2 rounded-lg bg-[#F9F7F4] text-[#9C8A7C]">
              2. {t('مؤكد', 'Confirmed')}
            </div>
            <div className="p-2 rounded-lg bg-[#F9F7F4] text-[#9C8A7C]">
              3. {t('جاري التجهيز', 'Preparing')}
            </div>
            <div className="p-2 rounded-lg bg-[#F9F7F4] text-[#9C8A7C]">
              4. {t('تم الشحن', 'Shipped')}
            </div>
            <div className="p-2 rounded-lg bg-[#F9F7F4] text-[#9C8A7C]">
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

        {/* Items Summary */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8DEC0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0E8DC]">
            <h3 className="text-sm font-bold text-[#251811]">{t('محتويات الطلب', 'Purchased Items')}</h3>
            <span className="text-sm font-extrabold text-[#A27B5C]">
              {totalAmount.toLocaleString()} {t('ج.م', 'EGP')}
            </span>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs py-1">
                <div>
                  <span className="font-bold text-[#251811]">{it.productName}</span>
                  <span className="text-[#8A796B] ms-2">× {it.quantity}</span>
                </div>
                <span className="font-bold text-[#251811]">
                  {(it.unitPrice * it.quantity).toLocaleString()} {t('ج.م', 'EGP')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#F0E8DC] flex items-center justify-between text-xs text-[#7A6A5E]">
            <span>{t('عنوان التسليم:', 'Delivery Area:')}</span>
            <span className="font-bold text-[#251811]">{customerCity} - {customerRegion}</span>
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
