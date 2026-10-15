'use client';

import React, { useState } from 'react';
import { useToccoStore } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { PaymentMethod } from '@/types';
import { orderService } from '@/lib/api/services/orderService';
import { cartService } from '@/lib/api/services/cartService';
import { addressService } from '@/lib/api/services/addressService';
import { Address } from '@/types/auth';
import { normalizeApiError } from '@/lib/api/errors';
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
    cartFreeShipping,
    clearCart,
    setLastCreatedOrder,
    navigateTo,
    user: legacyUser,
    settings,
  } = useToccoStore();

  const { user: authUser, addresses: authAddresses, createAddress, isLoading: isAuthLoading } = useAuth();
  const { t, isRtl, getName } = useLanguage();

  const defaultAddr = authAddresses.find((a) => a.is_default) || authAddresses[0];

  // Remote Governorates state
  const [remoteGovernorates, setRemoteGovernorates] = useState<GovernorateShipping[]>([]);
  const [isGovsLoading, setIsGovsLoading] = useState<boolean>(true);
  const [govsError, setGovsError] = useState<string | null>(null);

  const fetchGovernorates = React.useCallback(async () => {
    setIsGovsLoading(true);
    setGovsError(null);
    try {
      const data = await shippingService.getGovernorates();
      setRemoteGovernorates(data || []);
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      setGovsError(normalized.message || t('تعذر تحميل بيانات المحافظات والتوصيل.', 'Failed to load delivery governorates.'));
      setRemoteGovernorates([]);
    } finally {
      setIsGovsLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    fetchGovernorates();
  }, [fetchGovernorates]);

  const activeGovernorates = React.useMemo(() => {
    return remoteGovernorates.filter((g) => g.is_active !== false);
  }, [remoteGovernorates]);

  // Find default or first saved address with an active governorate in the database
  const validDefaultAddr = React.useMemo(() => {
    if (!authAddresses || authAddresses.length === 0) return null;
    const defaultCandidate = authAddresses.find((a) => a.is_default);
    if (defaultCandidate && activeGovernorates.some((g) => Number(g.id) === Number(defaultCandidate.governorate))) {
      return defaultCandidate;
    }
    return authAddresses.find((a) => activeGovernorates.some((g) => Number(g.id) === Number(a.governorate))) || null;
  }, [authAddresses, activeGovernorates]);

  const [userSelectedAddressId, setUserSelectedAddressId] = useState<number | 'new' | null>(null);

  const selectedAddressId: number | 'new' = React.useMemo(() => {
    if (userSelectedAddressId !== null) {
      return userSelectedAddressId;
    }
    if (validDefaultAddr) {
      return validDefaultAddr.id;
    }
    return 'new';
  }, [userSelectedAddressId, validDefaultAddr]);

  const selectedSavedAddress = React.useMemo(() => {
    if (selectedAddressId === 'new') return null;
    return authAddresses.find((a) => a.id === selectedAddressId) || null;
  }, [selectedAddressId, authAddresses]);

  // Selected governorate for manual/new address entry
  const [selectedGovernorateId, setSelectedGovernorateId] = useState<string>('');

  React.useEffect(() => {
    if (activeGovernorates.length > 0) {
      const exists = activeGovernorates.some((g) => String(g.id) === String(selectedGovernorateId));
      if (!exists) {
        setSelectedGovernorateId(String(activeGovernorates[0].id));
      }
    } else {
      setSelectedGovernorateId('');
    }
  }, [activeGovernorates, selectedGovernorateId]);

  const selectedNewGov = React.useMemo(() => {
    return (
      activeGovernorates.find((g) => String(g.id) === String(selectedGovernorateId)) ||
      activeGovernorates[0] ||
      null
    );
  }, [activeGovernorates, selectedGovernorateId]);

  // Current active governorate for the chosen address mode
  const currentGov = React.useMemo(() => {
    if (selectedSavedAddress) {
      return activeGovernorates.find((g) => Number(g.id) === Number(selectedSavedAddress.governorate)) || null;
    }
    return selectedNewGov;
  }, [selectedSavedAddress, activeGovernorates, selectedNewGov]);

  const rawShippingCost = React.useMemo(() => {
    if (!currentGov) return 0;
    return Number(currentGov.shipping_price ?? currentGov.shippingCost ?? 0);
  }, [currentGov]);

  const shippingCost = cartFreeShipping ? 0 : rawShippingCost;

  const netItemsTotal = Math.max(0, cartSubtotal - cartDiscountTotal);
  const finalTotal = netItemsTotal + shippingCost;

  const isPricingValid = React.useMemo(() => {
    if (!cart || cart.length === 0) return false;
    if (!Number.isFinite(cartSubtotal) || cartSubtotal < 0) return false;
    if (!Number.isFinite(cartDiscountTotal) || cartDiscountTotal < 0) return false;
    if (!Number.isFinite(shippingCost) || shippingCost < 0) return false;
    if (cartDiscountTotal > cartSubtotal) return false;
    const expectedFinal = (cartSubtotal - cartDiscountTotal) + shippingCost;
    if (!Number.isFinite(expectedFinal) || expectedFinal < 0) return false;
    if (finalTotal !== expectedFinal) return false;
    if (finalTotal === 0 && (cartSubtotal > cartDiscountTotal || shippingCost > 0)) {
      return false;
    }
    return true;
  }, [cart, cartSubtotal, cartDiscountTotal, shippingCost, finalTotal]);

  const currentGovNameAr = currentGov?.nameAr || currentGov?.name_ar || '';
  const currentGovNameEn = currentGov?.nameEn || currentGov?.name_en || '';

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

    if (activeGovernorates.length === 0) {
      setApiError(
        t(
          'لا توجد محافظات متاحة للشحن حالياً. يرجى التواصل مع الإدارة.',
          'No shipping governorates available. Please contact support.'
        )
      );
      return;
    }

    if (!isPricingValid) {
      setApiError(
        t(
          'تعذر التحقق من إجمالي الطلب. يرجى تحديث السلة والمحاولة مرة أخرى.',
          'Unable to verify order total. Please refresh your cart and try again.'
        )
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let targetAddressId: number;

      if (selectedAddressId === 'new' || authAddresses.length === 0) {
        if (!selectedNewGov) {
          setApiError(t('يرجى اختيار محافظة صالحة للشحن.', 'Please select a valid shipping governorate.'));
          setIsSubmitting(false);
          return;
        }
        if (!city.trim() || !street.trim()) {
          setApiError(t('يرجى كتابة المدينة والشارع لتوصيل السجاد.', 'Please provide your delivery city and street address.'));
          setIsSubmitting(false);
          return;
        }

        const selectedGovNum = Number(selectedNewGov.id);
        const trimmedCity = city.trim();
        const trimmedStreet = street.trim();
        const trimmedBuilding = buildingNumber.trim() || '1';
        const trimmedApartment = apartmentNumber.trim() || '1';
        const trimmedTitle = addressTitle.trim() || 'عنوان التوصيل';

        // Check if an existing saved address has the exact matching details
        const existingMatch = authAddresses.find(
          (a) =>
            Number(a.governorate) === selectedGovNum &&
            a.city.trim().toLowerCase() === trimmedCity.toLowerCase() &&
            a.street.trim().toLowerCase() === trimmedStreet.toLowerCase() &&
            (a.building_number || '1').trim() === trimmedBuilding &&
            (a.apartment_number || '1').trim() === trimmedApartment
        );

        if (existingMatch) {
          targetAddressId = existingMatch.id;
        } else {
          try {
            const newAddr = await createAddress({
              title: trimmedTitle,
              governorate: selectedGovNum,
              city: trimmedCity,
              street: trimmedStreet,
              building_number: trimmedBuilding,
              apartment_number: trimmedApartment,
              is_default: authAddresses.length === 0,
            });
            targetAddressId = newAddr.id;
          } catch (addrErr: any) {
            const normAddrErr = normalizeApiError(addrErr);
            const errStr = (normAddrErr.message || '').toLowerCase();
            if (errStr.includes('already exists') || errStr.includes('موجود بالفعل')) {
              // Address already exists in DB; fetch latest addresses to find it
              const latestAddrs: Address[] = await addressService.getAddresses().catch(() => []);
              const match = latestAddrs.find(
                (a: Address) =>
                  Number(a.governorate) === selectedGovNum &&
                  a.city.trim().toLowerCase() === trimmedCity.toLowerCase() &&
                  a.street.trim().toLowerCase() === trimmedStreet.toLowerCase()
              );
              if (match) {
                targetAddressId = match.id;
              } else {
                throw addrErr;
              }
            } else {
              throw addrErr;
            }
          }
        }
      } else {
        const chosen = authAddresses.find((a) => a.id === selectedAddressId);
        const isGovActive = chosen && activeGovernorates.some((g) => Number(g.id) === Number(chosen.governorate));
        if (!chosen || !isGovActive) {
          setApiError(
            t(
              'العنوان المحدد مرتبط بمحافظة غير متاحة للشحن حالياً. يرجى اختيار عنوان آخر أو إدخال عنوان جديد.',
              'The selected address is linked to an unavailable governorate. Please choose another address or enter a new one.'
            )
          );
          setIsSubmitting(false);
          return;
        }
        targetAddressId = Number(selectedAddressId);
      }

      // Synchronize backend cart if needed
      try {
        const bCart = await cartService.getCart();
        const hasItems =
          (bCart?.product_items && bCart.product_items.length > 0) ||
          (bCart?.arwal_items && bCart.arwal_items.length > 0) ||
          (bCart?.bundles && bCart.bundles.length > 0) ||
          (bCart?.items && bCart.items.length > 0);
        if (!hasItems && cart && cart.length > 0) {
          for (const item of cart) {
            if (item.arwalConfig?.isArawal || item.cartItemType === 'arwal') {
              const numArwalId = parseInt(String(item.productId).replace(/\D/g, '')) || 1;
              const numColorId = item.selectedColor?.id
                ? parseInt(String(item.selectedColor.id).replace(/\D/g, '')) || 1
                : 1;
              const widthVal = item.arwalConfig?.width || 80;
              await cartService.addArwalItem({
                arwal_id: numArwalId,
                selected_color_id: numColorId,
                selected_width_id: widthVal,
                selected_length: item.arwalConfig?.lengthMeters || 1,
                quantity: item.quantity,
              });
            } else if (item.isBundle || item.cartItemType === 'bundle' || item.bundleOfferId) {
              const bundleId = item.bundleOfferId || parseInt(String(item.productId).replace(/\D/g, '')) || 1;
              await cartService.addBundle({
                bundle_offer_id: bundleId,
                quantity: item.quantity,
              });
            } else {
              const numProdId = parseInt(String(item.productId).replace(/\D/g, '')) || 1;
              const numColorId = item.selectedColor?.id
                ? parseInt(String(item.selectedColor.id).replace(/\D/g, '')) || 1
                : 1;
              const numSizeId = item.selectedSize?.id
                ? parseInt(String(item.selectedSize.id).replace(/\D/g, '')) || 1
                : 1;
              await cartService.addItem({
                product_id: numProdId,
                selected_color_id: numColorId,
                selected_size_id: numSizeId,
                quantity: item.quantity,
              });
            }
          }
        }
      } catch (syncErr) {
        console.warn('Backend cart synchronization notice:', syncErr);
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

      const govNote = currentGovNameAr
        ? `[المحافظة: ${currentGovNameAr} - الشحن: ${shippingCost} ج.م]`
        : '';
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
        items: (createdOrder.items || []).map((orderItem) => {
          const orderColorHex = orderItem.color_hex_code?.toUpperCase();
          const matchesCartItem = (
            cartItem: typeof cart[number],
            requireQuantityMatch: boolean,
            requireColorMatch: boolean
          ) => {
            const parsedProductId = Number(cartItem.productId);
            const cartProductId = Number.isInteger(parsedProductId)
              ? parsedProductId
              : Number(String(cartItem.productId).replace(/\D/g, '')) || 1;
            const backendItemId = orderItem.product_id ?? (orderItem as any).product ?? (orderItem as any).arwal;
            const cartColorHex = cartItem.selectedColor?.hex?.toUpperCase();
            return (
              backendItemId !== undefined &&
              cartProductId === backendItemId &&
              (!requireQuantityMatch || cartItem.quantity === orderItem.quantity) &&
              (!requireColorMatch || !orderColorHex || cartColorHex === orderColorHex)
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
      let errorMsg = normalized.message;
      if (errorMsg.includes('This address already exists') || errorMsg.includes('already exists')) {
        errorMsg = t('هذا العنوان مسجل بالفعل في حسابك.', 'This address already exists in your account.');
      } else if (
        errorMsg.includes('The address must have an active governorate') ||
        errorMsg.includes('Selected governorate is not active')
      ) {
        errorMsg = t('المحافظة المحددة غير متاحة للشحن حالياً.', 'The selected governorate is currently not available for shipping.');
      } else if (errorMsg.includes('Your cart is empty') || errorMsg.toLowerCase().includes('cart:')) {
        errorMsg = t('سلة المشتريات فارغة. يرجى إضافة منتجات لإتمام الطلب.', 'Your cart is empty. Please add items to place an order.');
      } else if (errorMsg.includes('The address does not exist')) {
        errorMsg = t('العنوان المحدد غير موجود أو غير مرتبط بحسابك.', 'The selected address does not exist or does not belong to your account.');
      }
      setApiError(errorMsg);
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

              {/* Saved Addresses list if logged in user has saved addresses */}
              {authUser && authAddresses.length > 0 && (
                <div className="space-y-3 pb-4 border-b border-[#F0E8DC]">
                  <label className="block text-xs font-bold text-[#251811]">
                    {t('اختر من العناوين المسجلة بحسابك:', 'Select from your saved addresses:')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {authAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      const addrGov = activeGovernorates.find((g) => Number(g.id) === Number(addr.governorate));
                      const isGovActive = Boolean(addrGov);

                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            if (isGovActive) {
                              setUserSelectedAddressId(addr.id);
                            }
                          }}
                          className={`p-3.5 rounded-xl border text-start transition-all relative ${
                            !isGovActive
                              ? 'border-dashed border-amber-300 bg-amber-50/40 opacity-80 cursor-not-allowed'
                              : isSelected
                              ? 'border-[#251811] bg-[#FAF5EB] ring-2 ring-[#A27B5C]/20 shadow-xs cursor-pointer'
                              : 'border-[#E0D5C6] bg-white hover:border-[#A27B5C] cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#251811]">{addr.title}</span>
                              {addr.is_default && (
                                <span className="text-[10px] font-semibold text-[#A27B5C] bg-[#FAF5EB] border border-[#E8DEC0] px-1.5 py-0.5 rounded-full">
                                  {t('الافتراضي', 'Default')}
                                </span>
                              )}
                            </div>
                            {isSelected && isGovActive && (
                              <CheckCircle2 className="w-4 h-4 text-[#A27B5C]" />
                            )}
                          </div>

                          <p className="text-xs text-[#5C4A3E] leading-relaxed">
                            {addr.building_number ? `عمارة ${addr.building_number}، ` : ''}
                            {addr.street}، {addr.city}
                          </p>

                          <div className="mt-2 pt-2 border-t border-[#F0E8DC]/80 flex items-center justify-between text-[11px]">
                            {isGovActive && addrGov ? (
                              <>
                                <span className="text-[#8A796B]">
                                  {t('المحافظة:', 'Gov:')} <strong className="text-[#251811]">{isRtl ? addrGov.nameAr : (addrGov.nameEn || addrGov.nameAr)}</strong>
                                </span>
                                <span className="font-bold text-[#A27B5C]">
                                  {addrGov.shippingCost} {t('ج.م', 'EGP')}
                                </span>
                              </>
                            ) : (
                              <span className="text-amber-700 font-medium flex items-center gap-1 text-[10px]">
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                {t('المحافظة غير مفعلة للشحن حالياً', 'Governorate not active for shipping')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserSelectedAddressId('new');
                      if (defaultAddr && street === defaultAddr.street) {
                        setStreet('');
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedAddressId === 'new'
                        ? 'border-[#251811] bg-[#FAF5EB] text-[#251811]'
                        : 'border-dashed border-[#DED4C7] text-[#7A6A5E] hover:border-[#251811] hover:text-[#251811] bg-[#FAF8F5]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('توصيل إلى عنوان جديد', 'Deliver to a new address')}</span>
                  </button>
                </div>
              )}

              {/* Address Form for New Address or Guest/No saved addresses */}
              {(selectedAddressId === 'new' || authAddresses.length === 0) && (
                <div className="space-y-4">
                  {authUser && authAddresses.length > 0 && (
                    <h3 className="text-xs font-bold text-[#251811] pb-1">
                      {t('بيانات العنوان الجديد:', 'New Address Details:')}
                    </h3>
                  )}

                  {/* Governorate Loading State */}
                  {isGovsLoading && (
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8DEC0] flex items-center gap-2 text-xs text-[#7A6A5E]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#A27B5C]" />
                      <span>{t('جاري تحميل المحافظات وأسعار الشحن...', 'Loading governorates and shipping fees...')}</span>
                    </div>
                  )}

                  {/* Governorate Error State with Retry */}
                  {govsError && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{govsError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={fetchGovernorates}
                        className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs self-start sm:self-auto transition-colors"
                      >
                        {t('إعادة المحاولة', 'Retry')}
                      </button>
                    </div>
                  )}

                  {/* Governorate Empty State */}
                  {!isGovsLoading && !govsError && activeGovernorates.length === 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>{t('لا توجد محافظات متاحة للشحن حالياً. يرجى التواصل مع الإدارة.', 'No shipping governorates currently available. Please contact support.')}</span>
                    </div>
                  )}

                  {/* Real Governorate Selector */}
                  {!isGovsLoading && !govsError && activeGovernorates.length > 0 && (
                    <div className="space-y-2">
                      <label htmlFor="checkout-governorate-select" className="block text-xs font-bold text-[#251811]">
                        {t('اختر المحافظة (لحساب مصاريف الشحن بدقة):', 'Select Governorate (for exact shipping fee):')}
                      </label>
                      <select
                        id="checkout-governorate-select"
                        value={selectedGovernorateId}
                        onChange={(e) => {
                          setSelectedGovernorateId(e.target.value);
                          const gov = activeGovernorates.find((g) => String(g.id) === e.target.value);
                          if (gov) setCity((prev) => (!prev || activeGovernorates.some((ag) => ag.nameAr === prev) ? gov.nameAr : prev));
                        }}
                        className="w-full p-3 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-sm font-semibold text-[#251811] focus:ring-1 focus:ring-[#A27B5C] focus:outline-none"
                      >
                        {activeGovernorates.map((gov) => (
                          <option key={gov.id} value={gov.id}>
                            {isRtl ? `${gov.nameAr} (${gov.nameEn || gov.nameAr})` : `${gov.nameEn || gov.nameAr} (${gov.nameAr})`} — {t('مصاريف الشحن:', 'Shipping:')} {gov.shippingCost} {t('ج.م', 'EGP')}
                          </option>
                        ))}
                      </select>
                      {currentGov && (
                        <p className="text-[11px] text-[#8A796B]">
                          {t(
                            `قيمة الشحن لمحافظة ${currentGovNameAr} هي ${shippingCost} ج.م تُضاف إلى إجمالي الطلب.`,
                            `Shipping fee to ${currentGovNameEn} is ${shippingCost} EGP added to order total.`
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Address Details Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-[#251811]">
                        {t('تسمية العنوان (اختياري):', 'Address Label (Optional):')}
                      </label>
                      <input
                        type="text"
                        value={addressTitle}
                        onChange={(e) => setAddressTitle(e.target.value)}
                        placeholder={t('مثال: عنوان المنزل / العمل / الشاطئ', 'e.g. Home / Work / Beach house')}
                        className="w-full p-2.5 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-xs font-medium text-[#251811] focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                      />
                    </div>

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
                </div>
              )}

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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('instapay')}
                  className={`p-3 rounded-xl text-center text-xs font-bold border transition-all touch-manipulation min-h-[44px] flex items-center justify-center ${
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
                  className={`p-3 rounded-xl text-center text-xs font-bold border transition-all touch-manipulation min-h-[44px] flex items-center justify-center ${
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
                  className={`p-3 rounded-xl text-center text-xs font-bold border transition-all touch-manipulation min-h-[44px] flex items-center justify-center ${
                    paymentMethod === 'cod'
                      ? 'border-[#251811] bg-[#FAF5EB] text-[#251811] ring-1 ring-[#A27B5C]'
                      : 'border-[#E0D5C6] bg-white text-[#5C4A3E]'
                  }`}
                >
                  دفع عند الاستلام
                </button>
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E8DEC0] text-xs space-y-3">
                {paymentMethod === 'instapay' && (
                  <div className="space-y-3">
                    {/* InstaPay Address */}
                    {Boolean(settings.paymentMethods?.instapay?.address?.trim()) && (
                      <div className="space-y-1.5">
                        <p className="font-bold text-[#251811]">
                          {t('عنوان إنستاباي الرسمي للتحويل (IPA):', 'Official InstaPay Address (IPA):')}
                        </p>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#DFD6C9]">
                          <span className="font-mono font-bold text-sm text-[#251811]">
                            {settings.paymentMethods.instapay.address}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(settings.paymentMethods.instapay.address, 'instapay_address')}
                            className="p-1 text-[#A27B5C] hover:text-[#7A5437]"
                            title="نسخ عنوان إنستاباي"
                            aria-label="نسخ عنوان إنستاباي"
                          >
                            {copiedField === 'instapay_address' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* InstaPay Number */}
                    {Boolean(settings.paymentMethods?.instapay?.number?.trim()) && (
                      <div className="space-y-1.5">
                        <p className="font-bold text-[#251811]">
                          {t('رقم إنستا باي للتحويل:', 'InstaPay Phone Number:')}
                        </p>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#DFD6C9]">
                          <span className="font-mono font-bold text-sm text-[#251811]">
                            {settings.paymentMethods.instapay.number}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(settings.paymentMethods.instapay.number!, 'instapay_number')}
                            className="p-1 text-[#A27B5C] hover:text-[#7A5437]"
                            title="نسخ رقم إنستا باي"
                            aria-label="نسخ رقم إنستا باي"
                          >
                            {copiedField === 'instapay_number' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {!settings.paymentMethods?.instapay?.address?.trim() && !settings.paymentMethods?.instapay?.number?.trim() && (
                      <p className="text-[#5C4A3E]">
                        {t('يرجى التواصل مع خدمة العملاء للحصول على بيانات التحويل عبر إنستاباي.', 'Please contact customer support for InstaPay transfer details.')}
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'vodafone_cash' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-[#251811]">
                      {t('رقم المحفظة الإلكترونية:', 'Electronic Wallet Number:')}
                    </p>
                    {Boolean(
                      (settings.paymentMethods?.mobileWallet?.number || settings.paymentMethods?.vodafoneCash?.number)?.trim()
                    ) ? (
                      <>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#DFD6C9]">
                          <span className="font-mono font-bold text-sm text-[#251811]">
                            {settings.paymentMethods.mobileWallet?.number || settings.paymentMethods.vodafoneCash?.number}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                settings.paymentMethods.mobileWallet?.number || settings.paymentMethods.vodafoneCash?.number || '',
                                'wallet'
                              )
                            }
                            className="p-1 text-[#A27B5C] hover:text-[#7A5437]"
                            title="نسخ رقم المحفظة"
                            aria-label="نسخ رقم المحفظة"
                          >
                            {copiedField === 'wallet' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-[#8C7A6B]">
                          {t('مثال: فودافون كاش / اتصالات كاش / وي باي / أورنج كاش', 'e.g. Vodafone Cash / Etisalat Cash / WE Pay / Orange Cash')}
                        </p>
                      </>
                    ) : (
                      <p className="text-[#5C4A3E]">
                        {t('يرجى التواصل مع خدمة العملاء للحصول على رقم المحفظة الإلكترونية.', 'Please contact customer support for wallet transfer details.')}
                      </p>
                    )}
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
                          {t('رول: عرض', 'Roll: width')} {item.arawalConfig.width} {t('سم', 'cm')} × {item.arawalConfig.lengthMeters} {t('م', 'm')}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#7A6A5E]">{getName(item.selectedColor) || item.selectedColor?.name}</p>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[#8A796B]">{t('الكمية:', 'Qty:')} {item.quantity}</span>
                        <div className="text-end">
                          {item.originalSubtotal && item.originalSubtotal > (item.subtotal ?? item.unitPrice * item.quantity) && (
                            <span className="text-[10px] text-[#A89A8D] line-through me-1.5">
                              {item.originalSubtotal.toLocaleString()} {t('ج.م', 'EGP')}
                            </span>
                          )}
                          <span className="font-bold text-[#251811]">
                            {(item.subtotal ?? item.unitPrice * item.quantity).toLocaleString()} {t('ج.م', 'EGP')}
                          </span>
                        </div>
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
                  <span>
                    {currentGov
                      ? t(`مصاريف الشحن والتوصيل (${currentGovNameAr}):`, `Shipping to ${currentGovNameEn}:`)
                      : t('مصاريف الشحن والتوصيل:', 'Shipping & Delivery:')}
                  </span>
                  <div className="font-bold">
                    {cartFreeShipping && rawShippingCost > 0 ? (
                      <>
                        <span className="line-through text-[#A89A8D] me-1.5">{rawShippingCost} {t('ج.م', 'EGP')}</span>
                        <span className="text-emerald-700">{t('مجاني', 'Free')}</span>
                      </>
                    ) : (
                      <span>{shippingCost} {t('ج.م', 'EGP')}</span>
                    )}
                  </div>
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

              {!isPricingValid && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    {t(
                      'تعذر التحقق من إجمالي الطلب. يرجى تحديث السلة والمحاولة مرة أخرى.',
                      'Unable to verify order total. Please refresh your cart and try again.'
                    )}
                  </span>
                </div>
              )}

              {apiError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !authUser ||
                  isGovsLoading ||
                  activeGovernorates.length === 0 ||
                  Boolean(govsError) ||
                  !currentGov ||
                  !isPricingValid
                }
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
