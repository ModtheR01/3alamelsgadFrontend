'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { PaymentMethod } from '@/types';
import { orderService } from '@/lib/api/services/orderService';
import { cartService } from '@/lib/api/services/cartService';
import { normalizeApiError } from '@/lib/api/errors';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { shippingService } from '@/lib/api/services/shippingService';
import { GovernorateShipping } from '@/types/shipping';
import Image from '@/components/SafeImage';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  CreditCard,
  Truck,
  MessageCircle,
  Loader2,
  AlertCircle,
  MapPin,
  Plus,
  Ruler,
  Info,
  Clock,
} from 'lucide-react';

export default function CheckoutView() {
  const {
    cart,
    cartSubtotal,
    cartDiscountTotal,
    clearCart,
    setLastCreatedOrder,
    navigateTo,
    user: legacyUser,
  } = useToccoStore();

  const { user: authUser, addresses: authAddresses, createAddress, isLoading: isAuthLoading } = useAuth();
  const { t, isRtl } = useLanguage();

  const defaultAddr = authAddresses.find((a) => a.is_default) || authAddresses[0];

  const [userSelectedAddressId, setUserSelectedAddressId] = useState<number | 'new' | null>(null);
  const selectedAddressId: number | 'new' =
    userSelectedAddressId !== null
      ? userSelectedAddressId
      : defaultAddr
      ? defaultAddr.id
      : 'new';

  // Governorate & Address state
  const [selectedGovernorateId, setSelectedGovernorateId] = useState<string>('cairo');
  const [remoteGovernorates, setRemoteGovernorates] = useState<GovernorateShipping[]>([]);

  React.useEffect(() => {
    let active = true;
    shippingService.getGovernorates().then((data) => {
      if (active && data && data.length > 0) {
        setRemoteGovernorates(data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedGov = BRAND_CONFIG.governorates.find((g) => g.id === selectedGovernorateId) || BRAND_CONFIG.governorates[0];
  const shippingCost = selectedGov.shippingCost;

  const resolvedGovId = React.useMemo(() => {
    const matched = remoteGovernorates.find(
      (rg) =>
        String(rg.id) === String(selectedGovernorateId) ||
        rg.nameEn.toLowerCase() === selectedGov.nameEn.toLowerCase() ||
        rg.nameAr === selectedGov.nameAr
    );
    if (matched && Number.isInteger(Number(matched.id))) {
      return Number(matched.id);
    }
    const parsed = Number(selectedGovernorateId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }, [remoteGovernorates, selectedGovernorateId, selectedGov]);

  const [addressTitle, setAddressTitle] = useState('عنوان المنزل');
  const [city, setCity] = useState(() => defaultAddr?.city || legacyUser?.savedAddresses?.[0]?.city || 'القاهرة');
  const [street, setStreet] = useState(() => defaultAddr?.street || legacyUser?.savedAddresses?.[0]?.street || '');
  const [buildingNumber, setBuildingNumber] = useState(() => defaultAddr?.building_number || '1');
  const [apartmentNumber, setApartmentNumber] = useState(() => defaultAddr?.apartment_number || '1');
  const [customerPhone, setCustomerPhone] = useState(() => authUser?.phone || '');
  const [orderNote, setOrderNote] = useState('');

  // Payment method & payment option (A vs B)
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'vodafone_cash' | 'cod'>('instapay');
  const [paymentOption, setPaymentOption] = useState<'OPTION_A' | 'OPTION_B'>('OPTION_A');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const finalTotal = Math.max(0, cartSubtotal - cartDiscountTotal + shippingCost);

  if (!cart || cart.length === 0) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <p className="text-lg text-[#251811] font-medium">
          {t('سلة المشتريات فارغة حالياً', 'Your bag is currently empty')}
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 rounded-full bg-[#251811] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#3D291D] transition-colors"
        >
          {t('تصفح تشكيلات السجاد', 'Explore Carpet Catalog')}
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!authUser) {
      setApiError(t('يرجى تسجيل الدخول أو إنشاء حساب لإتمام الطلب.', 'Please sign in or create an account to place your order.'));
      return;
    }

    setIsSubmitting(true);
    try {
      let targetAddressId: number;

      if (selectedAddressId === 'new' || authAddresses.length === 0) {
        if (!city.trim() || !street.trim()) {
          setApiError(t('يرجى كتابة المدينة والشارع لتوصيل السجاد.', 'Please provide your delivery city and street address.'));
          setIsSubmitting(false);
          return;
        }

        const newAddr = await createAddress({
          title: addressTitle.trim() || 'عنوان التوصيل',
          governorate: resolvedGovId,
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
        const hasItems =
          (bCart.product_items && bCart.product_items.length > 0) ||
          (bCart.arwal_items && bCart.arwal_items.length > 0) ||
          (bCart.bundles && bCart.bundles.length > 0) ||
          (bCart.items && bCart.items.length > 0);
        if (!hasItems) {
          for (const item of cart) {
            if (item.arwalConfig?.isArawal || item.cartItemType === 'arwal') {
              const numArwalId = parseInt(item.productId.replace(/\D/g, '')) || 1;
              const numColorId = item.selectedColor?.id ? Number(item.selectedColor.id) : 1;
              const widthVal = item.arwalConfig?.width || 80;
              await cartService.addArwalItem({
                arwal_id: numArwalId,
                selected_color_id: numColorId,
                selected_width_id: widthVal,
                selected_length: item.arwalConfig?.lengthMeters || 1,
                quantity: item.quantity,
              });
            } else if (item.isBundle || item.cartItemType === 'bundle' || item.bundleOfferId) {
              const bundleId = item.bundleOfferId || parseInt(item.productId.replace(/\D/g, '')) || 1;
              await cartService.addBundle({
                bundle_offer_id: bundleId,
                quantity: item.quantity,
              });
            } else {
              const numProdId = parseInt(item.productId.replace(/\D/g, '')) || 1;
              const numColorId = item.selectedColor?.id ? Number(item.selectedColor.id) : 1;
              const numSizeId = item.selectedSize?.id ? Number(item.selectedSize.id) : 1;
              await cartService.addItem({
                product_id: numProdId,
                selected_color_id: numColorId,
                selected_size_id: numSizeId,
                quantity: item.quantity,
              });
            }
          }
        }
      } catch {
        // Proceed to order creation
      }

      // Build customer notes with ARAWAL specs and payment option
      const arawalSpecs = cart
        .filter((item) => item.arwalConfig)
        .map(
          (item) =>
            `[أروال بالمتر: ${item.productName} - عرض ${item.arawalConfig?.width} سم × طول ${item.arawalConfig?.lengthMeters} م @ ${item.arawalConfig?.unitPricePerMeter} ج.م/م]`
        )
        .join('; ');

      const paymentPlanNote =
        paymentOption === 'OPTION_A'
          ? '[خطة السداد: دفع الشحن مسبقاً وقيمة السجاد عند الاستلام]'
          : '[خطة السداد: سداد كامل قيمة الطلب والشحن مسبقاً]';

      const govNote = `[المحافظة: ${selectedGov.nameAr} - الشحن: ${shippingCost} ج.م]`;
      const methodNote = `[طريقة الدفع: ${paymentMethod === 'instapay' ? 'إنستاباي' : paymentMethod === 'vodafone_cash' ? 'محفظة إلكترونية/فودافون كاش' : 'دفع عند الاستلام'}]`;

      const finalCustomerNotes = [orderNote.trim(), methodNote, paymentPlanNote, govNote, arawalSpecs]
        .filter(Boolean)
        .join(' | ');

      // Map paymentMethod and paymentOption to backend DRF choices:
      // Backend PaymentMethod choices: 'CASH_ON_DELIVERY' | 'ELECTRONIC_WALLET' | 'INSTAPAY'
      let backendPaymentMethod: 'CASH_ON_DELIVERY' | 'ELECTRONIC_WALLET' | 'INSTAPAY';
      if (paymentMethod === 'instapay') {
        backendPaymentMethod = 'INSTAPAY';
      } else if (paymentMethod === 'vodafone_cash') {
        backendPaymentMethod = 'ELECTRONIC_WALLET';
      } else {
        backendPaymentMethod = 'CASH_ON_DELIVERY';
      }

      // Backend PaymentType choices: 'SHIPPING_ONLY' | 'FULL_ORDER'
      const backendPaymentType: 'SHIPPING_ONLY' | 'FULL_ORDER' =
        paymentOption === 'OPTION_A' ? 'SHIPPING_ONLY' : 'FULL_ORDER';

      // Create backend order (API expects { address_id, payment_method, payment_type, customer_notes })
      const createdOrder = await orderService.createOrder({
        address_id: targetAddressId,
        payment_method: backendPaymentMethod,
        payment_type: backendPaymentType,
        customer_notes: finalCustomerNotes,
      });

      const remainingCartItems = [...cart];
      const orderWithFinishes = {
        ...createdOrder,
        items: createdOrder.items.map((orderItem) => {
          const orderColorHex = orderItem.color_hex_code?.toUpperCase();
          const matchesCartItem = (
            cartItem: typeof cart[number],
            requireQuantityMatch: boolean,
            requireColorMatch: boolean
          ) => {
            const parsedProductId = Number(cartItem.productId);
            const cartProductId = Number.isInteger(parsedProductId)
              ? parsedProductId
              : Number(cartItem.productId.replace(/\D/g, '')) || 1;
            return (
              cartProductId === orderItem.product_id &&
              (!requireQuantityMatch || cartItem.quantity === orderItem.quantity) &&
              (!requireColorMatch || !orderColorHex || cartItem.selectedColor.hex.toUpperCase() === orderColorHex)
            );
          };
          let cartItemIndex = remainingCartItems.findIndex((item) => matchesCartItem(item, true, true));
          if (cartItemIndex < 0) cartItemIndex = remainingCartItems.findIndex((item) => matchesCartItem(item, true, false));
          if (cartItemIndex < 0) cartItemIndex = remainingCartItems.findIndex((item) => matchesCartItem(item, false, false));
          const [cartItem] = cartItemIndex >= 0 ? remainingCartItems.splice(cartItemIndex, 1) : [];
          return { ...orderItem, selected_finish: cartItem?.selectedFinish ?? null };
        }),
      };

      setLastCreatedOrder(orderWithFinishes);
      clearCart();
      navigateTo('confirmation');
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      setApiError(normalized.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div id="checkout-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Back */}
        <div className="py-2.5 sm:py-4">
          <button
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-1.5 text-xs text-[#8A796B] hover:text-[#251811] font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('العودة لتسوق السجاد', 'Continue Shopping')}</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="pb-6 sm:pb-8 border-b border-[#EAE3D8] space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
            {t('تأكيد طلب السجاد والمشايات', 'Order Confirmation & Checkout')}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#251811] tracking-tight">
            {t('إتمام الطلب وبيانات التوصيل', 'Delivery Details & Payment')}
          </h1>
          <p className="text-xs sm:text-sm text-[#736357] font-normal leading-relaxed">
            {t(
              'حدد عنوان الاستلام في محافظتك، واختر طريقة السداد المناسبة. طلبك يُسجل بحالة "غير مؤكد" حتى مراجعة التفاصيل والمقاسات.',
              'Specify your governorate and address. Your order is registered as "Not Confirmed" until details and measurements are reviewed.'
            )}
          </p>
        </div>

        {/* Sign-in prompt if unauthenticated */}
        {!isAuthLoading && !authUser && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border border-[#E0D5C6] bg-white shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF5EB] text-[#A27B5C] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-[#251811]">
                  {t('يرجى تسجيل الدخول لمتابعة تأكيد الطلب', 'Sign in to continue checkout')}
                </h2>
                <p className="text-xs text-[#7A6A5E] leading-relaxed">
                  {t(
                    'ربط الطلب بحسابك يضمن لك متابعة حالة الشحن وتأكيد تفاصيل المقاسات بدقة.',
                    'Signing in links your delivery address and lets you track your order seamlessly.'
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('account')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#251811] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3D291D] transition-colors"
            >
              <span>{t('تسجيل الدخول / إنشاء حساب', 'Sign In / Register')}</span>
              <ArrowIcon className="w-4 h-4 text-[#C49F74]" />
            </button>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Delivery Address & Payment Options (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Governorate & Shipping Destination */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8DEC0] shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#F0E8DC]">
                <Truck className="w-5 h-5 text-[#A27B5C]" />
                <h2 className="text-base font-bold text-[#251811]">
                  {t('١. المحافظة وعنوان التوصيل في مصر', '1. Governorate & Delivery Address in Egypt')}
                </h2>
              </div>

              {/* Governorate Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#251811]">
                  {t('اختر المحافظة (لحساب مصاريف الشحن بدقة):', 'Select Governorate (for exact shipping fee):')}
                </label>
                <select
                  value={selectedGovernorateId}
                  onChange={(e) => {
                    setSelectedGovernorateId(e.target.value);
                    const gov = BRAND_CONFIG.governorates.find((g) => g.id === e.target.value);
                    if (gov) setCity(gov.nameAr);
                  }}
                  className="w-full p-3 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-sm font-semibold text-[#251811] focus:ring-1 focus:ring-[#A27B5C] focus:outline-none"
                >
                  {BRAND_CONFIG.governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {gov.nameAr} ({gov.nameEn}) — {t('مصاريف الشحن:', 'Shipping:')} {gov.shippingCost} {t('ج.م', 'EGP')}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#8A796B]">
                  {t(
                    `قيمة الشحن لمحافظة ${selectedGov.nameAr} هي ${shippingCost} ج.م تُضاف إلى إجمالي الطلب.`,
                    `Shipping fee to ${selectedGov.nameEn} is ${shippingCost} EGP added to order total.`
                  )}
                </p>
              </div>

              {/* Address Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#251811]">
                    {t('المدينة / الحي / المركز:', 'City / District:')}
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('مثال: المنصورة / حي الجامعة', 'e.g. Mansoura / Nasr City')}
                    className="w-full p-2.5 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-xs font-medium text-[#251811] focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#251811]">
                    {t('اسم الشارع بالتفصيل:', 'Street Address:')}
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder={t('اسم الشارع والعلامة المميزة', 'Street name and landmarks')}
                    className="w-full p-2.5 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-xs font-medium text-[#251811] focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#251811]">
                    {t('رقم العمارة / المنزل:', 'Building Number:')}
                  </label>
                  <input
                    type="text"
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(e.target.value)}
                    placeholder="12"
                    className="w-full p-2.5 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-xs font-medium text-[#251811] focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#251811]">
                    {t('رقم الشقة / الدور:', 'Apartment / Floor:')}
                  </label>
                  <input
                    type="text"
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                    placeholder="3"
                    className="w-full p-2.5 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-xs font-medium text-[#251811] focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                  />
                </div>
              </div>

              {/* Customer Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-[#251811]">
                  {t('ملاحظات خاصة بالمقاسات أو التسليم:', 'Special Delivery or Sizing Notes:')}
                </label>
                <textarea
                  rows={2}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder={t(
                    'مثال: يرجى الاتصال قبل الوصول بنصف ساعة، أو أي تفاصيل تخص قطع الأروال.',
                    'e.g. Call before delivery, or any runner roll instructions'
                  )}
                  className="w-full p-2.5 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-xs font-medium text-[#251811] focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                />
              </div>
            </div>

            {/* Step 2: Payment Plan Option (A vs B) */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8DEC0] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#F0E8DC]">
                <ShieldCheck className="w-5 h-5 text-[#A27B5C]" />
                <h2 className="text-base font-bold text-[#251811]">
                  {t('٢. نظام وخطة السداد', '2. Payment Plan Option')}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A */}
                <button
                  type="button"
                  onClick={() => setPaymentOption('OPTION_A')}
                  className={`p-4 rounded-xl text-start border transition-all ${
                    paymentOption === 'OPTION_A'
                      ? 'border-[#251811] bg-[#FAF5EB] ring-2 ring-[#A27B5C]/20 shadow-xs'
                      : 'border-[#E0D5C6] bg-white hover:border-[#A27B5C]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#251811]">
                      {t('الخيار (أ): تحويل مصاريف الشحن مسبقاً', 'Option A: Pay Shipping Upfront')}
                    </span>
                    <span className="text-[11px] font-extrabold text-[#A27B5C]">
                      {shippingCost} {t('ج.م', 'EGP')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A6A5E] leading-relaxed">
                    {t(
                      'يتم تحويل قيمة الشحن لتأكيد جدية التجهيز، وسداد ثمن السجاد نقداً عند الاستلام والمعاينة.',
                      'Pay shipping fee upfront to confirm processing, and product amount in cash upon delivery.'
                    )}
                  </p>
                </button>

                {/* Option B */}
                <button
                  type="button"
                  onClick={() => setPaymentOption('OPTION_B')}
                  className={`p-4 rounded-xl text-start border transition-all ${
                    paymentOption === 'OPTION_B'
                      ? 'border-[#251811] bg-[#FAF5EB] ring-2 ring-[#A27B5C]/20 shadow-xs'
                      : 'border-[#E0D5C6] bg-white hover:border-[#A27B5C]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#251811]">
                      {t('الخيار (ب): سداد كامل القيمة مسبقاً', 'Option B: Pay Full Order Upfront')}
                    </span>
                    <span className="text-[11px] font-extrabold text-[#A27B5C]">
                      {finalTotal.toLocaleString()} {t('ج.م', 'EGP')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A6A5E] leading-relaxed">
                    {t(
                      'سداد إجمالي السجاد والشحن مسبقاً عبر إنستاباي أو المحفظة الإلكترونية لسرعة الشحن المباشر.',
                      'Pay full order total upfront via InstaPay or Mobile Wallet for fast priority shipping.'
                    )}
                  </p>
                </button>
              </div>
            </div>

            {/* Step 3: Payment Method Details */}
            <div className="p-6 rounded-2xl bg-white border border-[#E8DEC0] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#F0E8DC]">
                <Smartphone className="w-5 h-5 text-[#A27B5C]" />
                <h2 className="text-base font-bold text-[#251811]">
                  {t('٣. طريقة تحويل الدفعة', '3. Transfer Method')}
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('instapay')}
                  className={`p-3 rounded-xl text-center text-xs font-bold border transition-all ${
                    paymentMethod === 'instapay'
                      ? 'border-[#251811] bg-[#FAF5EB] text-[#251811] ring-1 ring-[#A27B5C]'
                      : 'border-[#E0D5C6] bg-white text-[#5C4A3E]'
                  }`}
                >
                  إنستاباي (InstaPay)
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('vodafone_cash')}
                  className={`p-3 rounded-xl text-center text-xs font-bold border transition-all ${
                    paymentMethod === 'vodafone_cash'
                      ? 'border-[#251811] bg-[#FAF5EB] text-[#251811] ring-1 ring-[#A27B5C]'
                      : 'border-[#E0D5C6] bg-white text-[#5C4A3E]'
                  }`}
                >
                  فودافون كاش / محفظة
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl text-center text-xs font-bold border transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#251811] bg-[#FAF5EB] text-[#251811] ring-1 ring-[#A27B5C]'
                      : 'border-[#E0D5C6] bg-white text-[#5C4A3E]'
                  }`}
                >
                  دفع عند الاستلام
                </button>
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E8DEC0] text-xs space-y-2">
                {paymentMethod === 'instapay' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-[#251811]">
                      {t('عنوان إنستاباي الرسمي للتحويل:', 'Official InstaPay Address:')}
                    </p>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#DFD6C9]">
                      <span className="font-mono font-bold text-sm text-[#251811]">alamelsgad@instapay</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('alamelsgad@instapay', 'instapay')}
                        className="p-1 text-[#A27B5C] hover:text-[#7A5437]"
                      >
                        {copiedField === 'instapay' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'vodafone_cash' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-[#251811]">
                      {t('رقم المحفظة الإلكترونية (فودافون كاش):', 'Mobile Wallet Number (Vodafone Cash):')}
                    </p>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#DFD6C9]">
                      <span className="font-mono font-bold text-sm text-[#251811]">01010750072</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('01010750072', 'wallet')}
                        className="p-1 text-[#A27B5C] hover:text-[#7A5437]"
                      >
                        {copiedField === 'wallet' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <p className="text-[#5C4A3E] leading-relaxed">
                    {t(
                      'يتم دفع قيمة السجاد نقداً عند الاستلام والمعاينة. يلزم فقط تحويل مصاريف الشحن لضمان جدية الشحن.',
                      'Pay carpet value upon delivery. Only shipping fee is required upfront to initiate transport.'
                    )}
                  </p>
                )}

                <div className="pt-2 border-t border-[#EAE2D5] flex items-center gap-1.5 text-[11px] text-[#A27B5C] font-semibold">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {t(
                      'تنبيه: تسجيل الطلب ينشئه بحالة "غير مؤكد"، ويتم التأكيد رسمياً بعد مراجعة الإدارة وتأكيد الإيصال.',
                      'Notice: Order is initially recorded as "Not Confirmed" and confirmed administratively after payment review.'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Placement (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E8DEC0] shadow-sm space-y-5 sticky top-28">
              <h2 className="text-base font-bold text-[#251811] pb-3 border-b border-[#F0E8DC]">
                {t('ملخص سلة الطلب', 'Order Summary')} ({cart.length})
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pe-1 scrollbar-none">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 text-xs pb-3 border-b border-[#F5EFEB]">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#EFE9DF] shrink-0 border border-[#E0D5C6]">
                      <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#251811] truncate">{item.productName}</h4>
                      {item.arawalConfig ? (
                        <p className="text-[11px] text-[#A27B5C] font-medium">
                          رول: عرض {item.arawalConfig.width} سم × {item.arawalConfig.lengthMeters} م
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#7A6A5E]">{item.selectedColor?.name}</p>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[#8A796B]">الكمية: {item.quantity}</span>
                        <span className="font-bold text-[#251811]">
                          {(item.subtotal || item.unitPrice * item.quantity).toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 text-xs pt-2">
                <div className="flex justify-between text-[#5C4A3E]">
                  <span>{t('إجمالي ثمن السجاد:', 'Carpet Subtotal:')}</span>
                  <span className="font-bold">{cartSubtotal.toLocaleString()} {t('ج.م', 'EGP')}</span>
                </div>

                {cartDiscountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>{t('خصومات العروض:', 'Discounts:')}</span>
                    <span className="font-bold">-{cartDiscountTotal.toLocaleString()} {t('ج.م', 'EGP')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#5C4A3E]">
                  <span>{t('مصاريف الشحن والتوصيل (' + selectedGov.nameAr + '):', `Shipping to ${selectedGov.nameEn}:`)}</span>
                  <span className="font-bold">{shippingCost} {t('ج.م', 'EGP')}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-[#251811] pt-3 border-t border-[#F0E8DC]">
                  <span>{t('الإجمالي النهائي للطلب:', 'Final Order Total:')}</span>
                  <span className="text-[#A27B5C] text-lg">{finalTotal.toLocaleString()} {t('ج.م', 'EGP')}</span>
                </div>
              </div>

              {/* Initial Status Callout */}
              <div className="p-3 rounded-xl bg-[#FFF9EE] border border-[#F6E05E] text-[11px] text-[#B7791F] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('حالة الطلب المبدئية: غير مؤكد', 'Initial Status: Not Confirmed')}</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  {t(
                    'إنشاء الطلب لا يعني التأكيد التلقائي. سيقوم مسؤول عالم السجاد بالتحقق من تحويل الدفعة وتأكيد الطلب.',
                    'Placing order does not automatically confirm it. Confirmation is done after payment verification.'
                  )}
                </p>
              </div>

              {apiError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !authUser}
                className="w-full py-4 rounded-full bg-[#251811] hover:bg-[#3D291D] text-white font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t('تأكيد الطلب الآن', 'Submit & Place Order')}</span>
                    <ArrowIcon className="w-4 h-4 text-[#C49F74]" />
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
