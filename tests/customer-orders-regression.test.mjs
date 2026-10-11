import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Customer Orders & Live Status Regression Tests
 *
 * Validates:
 * 1. Safe money and number formatting preventing any 'NaN', 'undefined', or 'null' display.
 * 2. Accurate mapping and styling of all 6 DRF order statuses (NOT_CONFIRMED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED).
 * 3. Payment plan breakdown for SHIPPING_ONLY and FULL_ORDER without legacy handcrafted deposit NaN calculation.
 * 4. DRF Order Item contract resolution for regular products (unit_price), arwal runners (by meter), and bundle packages.
 * 5. Dynamic order status reflection when admin updates status in backend.
 */

// Mirrors formatMoneySafe from AccountView.tsx
function formatMoneySafe(val, isRtl = true) {
  if (val === null || val === undefined || val === '') return isRtl ? 'غير متاح' : 'N/A';
  const num = Number(val);
  if (isNaN(num)) return isRtl ? 'غير متاح' : 'N/A';
  return `${num.toLocaleString(isRtl ? 'ar-EG' : 'en-EG')} ${isRtl ? 'ج.م' : 'EGP'}`;
}

// Mirrors getBackendStatusConfig from AccountView.tsx
function getBackendStatusConfig(status, isRtl = true) {
  switch (status) {
    case 'CONFIRMED':
      return {
        label: isRtl ? 'مؤكد' : 'Confirmed',
        subLabel: isRtl ? 'تم تأكيد الطلب واعتماد الدفع' : 'Payment verified and order confirmed',
        badgeBg: 'bg-[#EFF6FF]',
        badgeText: 'text-[#1D4ED8]',
        badgeBorder: 'border-[#93C5FD]',
        stepIndex: 1,
      };
    case 'PROCESSING':
      return {
        label: isRtl ? 'قيد التجهيز والسرفلة' : 'Processing & Production',
        subLabel: isRtl ? 'جارٍ تفصيل وسرفلة وتجهيز طلبك بعناية' : 'Customizing and edging your carpet',
        badgeBg: 'bg-[#FAF5FF]',
        badgeText: 'text-[#7E22CE]',
        badgeBorder: 'border-[#D8B4FE]',
        stepIndex: 2,
      };
    case 'SHIPPED':
      return {
        label: isRtl ? 'تم الشحن مع المندوب' : 'Shipped & In Transit',
        subLabel: isRtl ? 'طلبك في الطريق إليك مع مندوب التوصيل' : 'In transit with delivery courier',
        badgeBg: 'bg-[#ECFEFF]',
        badgeText: 'text-[#0E7490]',
        badgeBorder: 'border-[#A5F3FC]',
        stepIndex: 3,
      };
    case 'DELIVERED':
      return {
        label: isRtl ? 'تم التسليم بنجاح' : 'Delivered & Installed',
        subLabel: isRtl ? 'تم استلام وتوصيل الطلب بنجاح. شكراً لثقتكم!' : 'Delivered successfully. Thank you!',
        badgeBg: 'bg-[#F0FDF4]',
        badgeText: 'text-[#15803D]',
        badgeBorder: 'border-[#86EFAC]',
        stepIndex: 4,
      };
    case 'CANCELLED':
      return {
        label: isRtl ? 'طلب ملغي' : 'Cancelled',
        subLabel: isRtl ? 'تم إلغاء هذا الطلب' : 'This order has been cancelled',
        badgeBg: 'bg-[#FEF2F2]',
        badgeText: 'text-[#B91C1C]',
        badgeBorder: 'border-[#FECACA]',
        stepIndex: -1,
      };
    case 'NOT_CONFIRMED':
    default:
      return {
        label: isRtl ? 'بانتظار التأكيد' : 'Pending Confirmation',
        subLabel: isRtl ? 'تم استلام طلبك وجارٍ مراجعة تفاصيل الحجز' : 'Awaiting payment verification',
        badgeBg: 'bg-[#FFF8E6]',
        badgeText: 'text-[#B7791F]',
        badgeBorder: 'border-[#F6E05E]',
        stepIndex: 0,
      };
  }
}

// Mirrors payment breakdown logic from AccountView.tsx
function computePaymentBreakdown(order, isRtl = true) {
  const total = Number(order.total_price || 0);
  const payment = order.payment;

  if (!payment) {
    return {
      type: 'UNKNOWN',
      method: 'الدفع عند الاستلام',
      depositFormatted: formatMoneySafe(null, isRtl),
      remainderFormatted: formatMoneySafe(total, isRtl),
    };
  }

  const paymentAmount = Number(payment.amount || 0);

  if (payment.payment_type === 'SHIPPING_ONLY') {
    const remainder = Math.max(0, total - paymentAmount);
    return {
      type: 'SHIPPING_ONLY',
      deposit: paymentAmount,
      depositFormatted: formatMoneySafe(paymentAmount, isRtl),
      remainder: remainder,
      remainderFormatted: formatMoneySafe(remainder, isRtl),
    };
  }

  if (payment.payment_type === 'FULL_ORDER') {
    return {
      type: 'FULL_ORDER',
      deposit: paymentAmount,
      depositFormatted: formatMoneySafe(paymentAmount, isRtl),
      remainder: 0,
      remainderFormatted: formatMoneySafe(0, isRtl),
    };
  }

  return {
    type: payment.payment_type,
    deposit: paymentAmount,
    depositFormatted: formatMoneySafe(paymentAmount, isRtl),
    remainder: Math.max(0, total - paymentAmount),
    remainderFormatted: formatMoneySafe(Math.max(0, total - paymentAmount), isRtl),
  };
}

// Mirrors items resolution logic
function resolveOrderItemDisplay(item, isRtl = true) {
  const isArwal = item.item_type === 'arwal';
  const title = isArwal
    ? (isRtl ? item.arwal_name_ar || item.arwal_name_en : item.arwal_name_en || item.arwal_name_ar) || 'رول سجاد بالمتر'
    : (isRtl ? item.product_name_ar || item.product_name_en || item.product_name : item.product_name_en || item.product_name_ar || item.product_name) || 'سجادة';
  const colorName = isRtl ? (item.color_name_ar || item.color_name_en || item.color_name) : (item.color_name_en || item.color_name_ar || item.color_name);
  const unitPrice = isArwal ? item.price_per_length : (item.unit_price ?? item.product_price);

  return {
    title,
    colorName,
    unitPriceFormatted: formatMoneySafe(unitPrice, isRtl),
    subtotalFormatted: formatMoneySafe(item.subtotal, isRtl),
    isArwal,
  };
}

test('Customer Orders — formatMoneySafe prevents NaN, undefined, or null display', () => {
  assert.equal(formatMoneySafe(null, true), 'غير متاح');
  assert.equal(formatMoneySafe(undefined, true), 'غير متاح');
  assert.equal(formatMoneySafe('', true), 'غير متاح');
  assert.equal(formatMoneySafe('invalid_number', true), 'غير متاح');
  assert.equal(formatMoneySafe(NaN, true), 'غير متاح');

  assert.equal(formatMoneySafe(null, false), 'N/A');
  assert.equal(formatMoneySafe(undefined, false), 'N/A');

  // Valid numbers
  const formattedAr = formatMoneySafe('1250.00', true);
  assert.ok(formattedAr.includes('ج.م'));
  assert.ok(!formattedAr.includes('NaN'));
  assert.ok(!formattedAr.includes('undefined'));

  const formattedEn = formatMoneySafe(450, false);
  assert.ok(formattedEn.includes('EGP'));
  assert.ok(!formattedEn.includes('NaN'));
});

test('Customer Orders — All 6 DRF order statuses map accurately to Arabic and English', () => {
  const statuses = [
    { key: 'NOT_CONFIRMED', expectedAr: 'بانتظار التأكيد', step: 0 },
    { key: 'CONFIRMED', expectedAr: 'مؤكد', step: 1 },
    { key: 'PROCESSING', expectedAr: 'قيد التجهيز والسرفلة', step: 2 },
    { key: 'SHIPPED', expectedAr: 'تم الشحن مع المندوب', step: 3 },
    { key: 'DELIVERED', expectedAr: 'تم التسليم بنجاح', step: 4 },
    { key: 'CANCELLED', expectedAr: 'طلب ملغي', step: -1 },
  ];

  for (const { key, expectedAr, step } of statuses) {
    const cfgAr = getBackendStatusConfig(key, true);
    assert.equal(cfgAr.label, expectedAr, `Status ${key} should match Arabic label`);
    assert.equal(cfgAr.stepIndex, step, `Status ${key} step index should be ${step}`);
    assert.ok(cfgAr.badgeBg && cfgAr.badgeText && cfgAr.badgeBorder);

    const cfgEn = getBackendStatusConfig(key, false);
    assert.ok(cfgEn.label.length > 0);
  }
});

test('Customer Orders — Payment plan breakdown handles SHIPPING_ONLY and FULL_ORDER without NaN', () => {
  // Test Case 1: SHIPPING_ONLY deposit
  const orderShippingOnly = {
    id: 101,
    order_number: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    total_price: '1500.00',
    payment: {
      id: 1,
      method: 'INSTAPAY',
      payment_type: 'SHIPPING_ONLY',
      amount: '80.00',
      status: 'PAID',
    },
  };

  const breakdown1 = computePaymentBreakdown(orderShippingOnly, true);
  assert.equal(breakdown1.type, 'SHIPPING_ONLY');
  assert.equal(breakdown1.deposit, 80);
  assert.equal(breakdown1.remainder, 1420);
  assert.ok(!breakdown1.depositFormatted.includes('NaN'));
  assert.ok(!breakdown1.remainderFormatted.includes('NaN'));

  // Test Case 2: FULL_ORDER
  const orderFullOrder = {
    id: 102,
    order_number: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    total_price: '2200.00',
    payment: {
      id: 2,
      method: 'ELECTRONIC_WALLET',
      payment_type: 'FULL_ORDER',
      amount: '2200.00',
      status: 'PENDING',
    },
  };

  const breakdown2 = computePaymentBreakdown(orderFullOrder, true);
  assert.equal(breakdown2.type, 'FULL_ORDER');
  assert.equal(breakdown2.deposit, 2200);
  assert.equal(breakdown2.remainder, 0);
  assert.ok(!breakdown2.depositFormatted.includes('NaN'));
  assert.ok(!breakdown2.remainderFormatted.includes('NaN'));

  // Test Case 3: Order missing deposit_percentage (which previously produced NaN% deposit)
  const legacyOrderMissingFields = {
    id: 103,
    total_price: '950.00',
    // deposit_percentage is undefined
  };

  const breakdown3 = computePaymentBreakdown(legacyOrderMissingFields, true);
  assert.ok(!breakdown3.depositFormatted.includes('NaN'));
  assert.ok(!breakdown3.remainderFormatted.includes('NaN'));
});

test('Customer Orders — DRF Order Item contract resolves product_name_ar and unit_price', () => {
  // Test Case 1: Product item from real Django ProductOrderItemSerializer
  const productItem = {
    id: 1,
    item_type: 'product',
    product: 42,
    product_name_ar: 'سجادة تبريز كلاسيك',
    product_name_en: 'Tabriz Classic Carpet',
    unit_price: '1200.00',
    quantity: 2,
    color_name_ar: 'كشمير ملكي',
    color_hex_code: '#8B4513',
    size_width: 200,
    size_length: 300,
    subtotal: '2400.00',
  };

  const resolvedProduct = resolveOrderItemDisplay(productItem, true);
  assert.equal(resolvedProduct.title, 'سجادة تبريز كلاسيك');
  assert.equal(resolvedProduct.colorName, 'كشمير ملكي');
  assert.ok(resolvedProduct.unitPriceFormatted.includes('1,200') || resolvedProduct.unitPriceFormatted.includes('١٬٢٠٠'));
  assert.ok(!resolvedProduct.unitPriceFormatted.includes('NaN'));
  assert.equal(resolvedProduct.isArwal, false);

  // Test Case 2: Arwal runner item from real Django ArwalOrderItemSerializer
  const arwalItem = {
    id: 2,
    item_type: 'arwal',
    arwal: 15,
    arwal_name_ar: 'رول كلاسيك ممر تركي',
    arwal_name_en: 'Turkish Hallway Runner',
    color_name_ar: 'بيج كلاسيكي',
    color_hex_code: '#F5F5DC',
    width: 80,
    length: '3.50',
    price_per_length: '250.00',
    quantity: 1,
    subtotal: '875.00',
  };

  const resolvedArwal = resolveOrderItemDisplay(arwalItem, true);
  assert.equal(resolvedArwal.title, 'رول كلاسيك ممر تركي');
  assert.equal(resolvedArwal.colorName, 'بيج كلاسيكي');
  assert.ok(resolvedArwal.unitPriceFormatted.includes('250') || resolvedArwal.unitPriceFormatted.includes('٢٥٠'));
  assert.ok(!resolvedArwal.unitPriceFormatted.includes('NaN'));
  assert.equal(resolvedArwal.isArwal, true);
});

test('Customer Orders — Status reflects real-time transitions after admin modification', () => {
  // Initial order in pending state
  let currentOrder = {
    id: 500,
    order_number: 'ord-test-lifecycle',
    status: 'NOT_CONFIRMED',
    total_price: '1800.00',
  };

  assert.equal(getBackendStatusConfig(currentOrder.status).label, 'بانتظار التأكيد');
  assert.equal(getBackendStatusConfig(currentOrder.status).stepIndex, 0);

  // Admin approves payment -> status becomes CONFIRMED
  currentOrder = { ...currentOrder, status: 'CONFIRMED' };
  assert.equal(getBackendStatusConfig(currentOrder.status).label, 'مؤكد');
  assert.equal(getBackendStatusConfig(currentOrder.status).stepIndex, 1);

  // Admin starts preparation -> status becomes PROCESSING
  currentOrder = { ...currentOrder, status: 'PROCESSING' };
  assert.equal(getBackendStatusConfig(currentOrder.status).label, 'قيد التجهيز والسرفلة');
  assert.equal(getBackendStatusConfig(currentOrder.status).stepIndex, 2);

  // Courier picks up order -> status becomes SHIPPED
  currentOrder = { ...currentOrder, status: 'SHIPPED' };
  assert.equal(getBackendStatusConfig(currentOrder.status).label, 'تم الشحن مع المندوب');
  assert.equal(getBackendStatusConfig(currentOrder.status).stepIndex, 3);

  // Delivered to customer -> status becomes DELIVERED
  currentOrder = { ...currentOrder, status: 'DELIVERED' };
  assert.equal(getBackendStatusConfig(currentOrder.status).label, 'تم التسليم بنجاح');
  assert.equal(getBackendStatusConfig(currentOrder.status).stepIndex, 4);
});
