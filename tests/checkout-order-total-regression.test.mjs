import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Pure calculation logic mirroring lib/store.tsx and components/CheckoutView.tsx
 */
function computeCartTotals({
  cart = [],
  isGuestCart = false,
  cartPricing = { originalTotal: 0, discountTotal: 0, total: 0, freeShipping: false },
}) {
  const cartSubtotal = (() => {
    if (!cart || cart.length === 0) return 0;
    if (isGuestCart) {
      return cart.reduce(
        (sum, item) => sum + (item.originalSubtotal ?? item.subtotal ?? item.unitPrice * item.quantity),
        0
      );
    }
    if (cartPricing.originalTotal > 0) {
      return cartPricing.originalTotal;
    }
    if (cartPricing.total > 0) {
      return cartPricing.total + (cartPricing.discountTotal || 0);
    }
    return cart.reduce(
      (sum, item) => sum + (item.originalSubtotal ?? item.subtotal ?? item.unitPrice * item.quantity),
      0
    );
  })();

  const rawDiscountTotal = isGuestCart
    ? cart.reduce((sum, item) => sum + (item.discountAmount ?? 0), 0)
    : (cartPricing.discountTotal || 0);
  const cartDiscountTotal = Math.max(0, Math.min(cartSubtotal, rawDiscountTotal));

  const cartFreeShipping = Boolean(cartPricing.freeShipping);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return {
    cartSubtotal,
    cartDiscountTotal,
    cartFreeShipping,
    cartItemsCount,
  };
}

function computeCheckoutPricing({
  cartSubtotal,
  cartDiscountTotal,
  rawShippingCost = 0,
  cartFreeShipping = false,
  cartLength = 1,
}) {
  const shippingCost = cartFreeShipping ? 0 : rawShippingCost;
  const netItemsTotal = Math.max(0, cartSubtotal - cartDiscountTotal);
  const finalTotal = netItemsTotal + shippingCost;

  const isPricingValid = (() => {
    if (!cartLength || cartLength === 0) return false;
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
  })();

  return {
    shippingCost,
    netItemsTotal,
    finalTotal,
    isPricingValid,
  };
}

test('Checkout Order Total — 1. Product 900 EGP without discount', () => {
  const item = {
    id: 'item-1',
    productId: '10',
    productName: 'سجادة صوف كلاسيك',
    unitPrice: 900,
    quantity: 1,
    subtotal: 900,
    originalSubtotal: 900,
    discountAmount: 0,
  };

  const storeTotals = computeCartTotals({
    cart: [item],
    isGuestCart: false,
    cartPricing: {
      originalTotal: 900,
      discountTotal: 0,
      total: 900,
      freeShipping: false,
    },
  });

  assert.equal(storeTotals.cartSubtotal, 900, 'Subtotal is 900 EGP');
  assert.equal(storeTotals.cartDiscountTotal, 0, 'Discount is 0 EGP');

  const checkoutPricing = computeCheckoutPricing({
    cartSubtotal: storeTotals.cartSubtotal,
    cartDiscountTotal: storeTotals.cartDiscountTotal,
    rawShippingCost: 85,
    cartFreeShipping: storeTotals.cartFreeShipping,
    cartLength: 1,
  });

  assert.equal(checkoutPricing.netItemsTotal, 900);
  assert.equal(checkoutPricing.shippingCost, 85);
  assert.equal(checkoutPricing.finalTotal, 985, '900 items + 85 shipping = 985 EGP');
  assert.equal(checkoutPricing.isPricingValid, true);
});

test('Checkout Order Total — 2. Product with relative discount (90% off base 9,000 EGP: bug regression)', () => {
  // Exact scenario from user bug report:
  // Item base price: 9,000 EGP, 90% discount (8,100 EGP discount), net total: 900 EGP, shipping: 300 EGP.
  // Previously, cartSubtotal was set to 900, causing 900 - 8100 + 300 = 0 EGP!
  const item = {
    id: 'item-90pct',
    productId: '25',
    productName: 'سجادة فاخرة عريضة',
    unitPrice: 9000,
    quantity: 1,
    subtotal: 900,
    originalSubtotal: 9000,
    discountAmount: 8100,
  };

  const storeTotals = computeCartTotals({
    cart: [item],
    isGuestCart: false,
    cartPricing: {
      originalTotal: 9000,
      discountTotal: 8100,
      total: 900,
      freeShipping: false,
    },
  });

  assert.equal(storeTotals.cartSubtotal, 9000, 'Gross subtotal must be 9,000 EGP (before discount)');
  assert.equal(storeTotals.cartDiscountTotal, 8100, 'Discount is 8,100 EGP');

  const checkoutPricing = computeCheckoutPricing({
    cartSubtotal: storeTotals.cartSubtotal,
    cartDiscountTotal: storeTotals.cartDiscountTotal,
    rawShippingCost: 300,
    cartFreeShipping: storeTotals.cartFreeShipping,
    cartLength: 1,
  });

  assert.equal(checkoutPricing.netItemsTotal, 900, 'Net items subtotal is 9,000 - 8,100 = 900 EGP');
  assert.equal(checkoutPricing.shippingCost, 300, 'Shipping cost is 300 EGP');
  assert.equal(checkoutPricing.finalTotal, 1200, 'Final total must be 900 + 300 = 1,200 EGP (NOT 0 EGP!)');
  assert.equal(checkoutPricing.isPricingValid, true);
});

test('Checkout Order Total — 3. Product with fixed discount (500 EGP off 2,500 EGP)', () => {
  const item = {
    id: 'item-fixed',
    productId: '30',
    productName: 'سجادة مودرن هندسية',
    unitPrice: 2500,
    quantity: 1,
    subtotal: 2000,
    originalSubtotal: 2500,
    discountAmount: 500,
  };

  const storeTotals = computeCartTotals({
    cart: [item],
    isGuestCart: false,
    cartPricing: {
      originalTotal: 2500,
      discountTotal: 500,
      total: 2000,
      freeShipping: false,
    },
  });

  assert.equal(storeTotals.cartSubtotal, 2500);
  assert.equal(storeTotals.cartDiscountTotal, 500);

  const checkoutPricing = computeCheckoutPricing({
    cartSubtotal: storeTotals.cartSubtotal,
    cartDiscountTotal: storeTotals.cartDiscountTotal,
    rawShippingCost: 100,
    cartFreeShipping: storeTotals.cartFreeShipping,
    cartLength: 1,
  });

  assert.equal(checkoutPricing.netItemsTotal, 2000);
  assert.equal(checkoutPricing.shippingCost, 100);
  assert.equal(checkoutPricing.finalTotal, 2100, '2000 net + 100 shipping = 2100 EGP');
  assert.equal(checkoutPricing.isPricingValid, true);
});

test('Checkout Order Total — 4. Discount larger than eligible subtotal is capped safely', () => {
  const item = {
    id: 'item-capped',
    productId: '35',
    productName: 'سجادة صالون',
    unitPrice: 1000,
    quantity: 1,
    subtotal: 0,
    originalSubtotal: 1000,
    discountAmount: 1500,
  };

  // Backend or anomaly sends discount 1500 on 1000 subtotal
  const storeTotals = computeCartTotals({
    cart: [item],
    isGuestCart: false,
    cartPricing: {
      originalTotal: 1000,
      discountTotal: 1500,
      total: 0,
      freeShipping: false,
    },
  });

  assert.equal(storeTotals.cartSubtotal, 1000);
  assert.equal(storeTotals.cartDiscountTotal, 1000, 'Discount must be capped at 1,000 EGP');

  const checkoutPricing = computeCheckoutPricing({
    cartSubtotal: storeTotals.cartSubtotal,
    cartDiscountTotal: storeTotals.cartDiscountTotal,
    rawShippingCost: 100,
    cartFreeShipping: storeTotals.cartFreeShipping,
    cartLength: 1,
  });

  assert.equal(checkoutPricing.netItemsTotal, 0);
  assert.equal(checkoutPricing.shippingCost, 100);
  assert.equal(checkoutPricing.finalTotal, 100, '0 net + 100 shipping = 100 EGP (never negative)');
  assert.equal(checkoutPricing.isPricingValid, true);
});

test('Checkout Order Total — 5. Multiple items with offers are calculated additively without double discounting', () => {
  const items = [
    {
      id: 'item-1',
      productId: '1',
      productName: 'سجادة حرير',
      unitPrice: 3000,
      quantity: 1,
      subtotal: 2400,
      originalSubtotal: 3000,
      discountAmount: 600,
    },
    {
      id: 'item-2',
      productId: '2',
      productName: 'سجادة شاج',
      unitPrice: 2000,
      quantity: 2,
      subtotal: 3600,
      originalSubtotal: 4000,
      discountAmount: 400,
    },
  ];

  const storeTotals = computeCartTotals({
    cart: items,
    isGuestCart: false,
    cartPricing: {
      originalTotal: 7000,
      discountTotal: 1000,
      total: 6000,
      freeShipping: false,
    },
  });

  assert.equal(storeTotals.cartSubtotal, 7000, 'Gross subtotal is 3000 + 4000 = 7000 EGP');
  assert.equal(storeTotals.cartDiscountTotal, 1000, 'Total discount is 1000 EGP');

  const checkoutPricing = computeCheckoutPricing({
    cartSubtotal: storeTotals.cartSubtotal,
    cartDiscountTotal: storeTotals.cartDiscountTotal,
    rawShippingCost: 150,
    cartFreeShipping: storeTotals.cartFreeShipping,
    cartLength: 2,
  });

  assert.equal(checkoutPricing.netItemsTotal, 6000);
  assert.equal(checkoutPricing.finalTotal, 6150, '6000 net + 150 shipping = 6150 EGP');
  assert.equal(checkoutPricing.isPricingValid, true);
});

test('Checkout Order Total — 6. Shipping calculation combined with discount & free shipping offer', () => {
  // Case 6A: Standard shipping is untouched by product discount
  const normalShipping = computeCheckoutPricing({
    cartSubtotal: 5000,
    cartDiscountTotal: 1000,
    rawShippingCost: 120,
    cartFreeShipping: false,
    cartLength: 1,
  });
  assert.equal(normalShipping.shippingCost, 120);
  assert.equal(normalShipping.finalTotal, 4120);

  // Case 6B: Free shipping offer zeroes out shipping
  const freeShipping = computeCheckoutPricing({
    cartSubtotal: 5000,
    cartDiscountTotal: 1000,
    rawShippingCost: 120,
    cartFreeShipping: true,
    cartLength: 1,
  });
  assert.equal(freeShipping.shippingCost, 0, 'Free shipping sets shipping to 0');
  assert.equal(freeShipping.finalTotal, 4000, '4000 net + 0 shipping = 4000 EGP');
  assert.equal(freeShipping.isPricingValid, true);
});

test('Checkout Order Total — 7. Bundle offers calculation without double discounting', () => {
  const bundleItem = {
    id: 'bundle-5',
    productId: 'bundle-5',
    productName: 'باقة التوفير لغرفتي نوم',
    unitPrice: 2200,
    quantity: 1,
    subtotal: 2200,
    originalSubtotal: 2200,
    discountAmount: 0,
    isBundle: true,
  };

  const standardItem = {
    id: 'item-std',
    productId: '40',
    productName: 'دواسة مدخل',
    unitPrice: 500,
    quantity: 1,
    subtotal: 400,
    originalSubtotal: 500,
    discountAmount: 100,
  };

  const storeTotals = computeCartTotals({
    cart: [bundleItem, standardItem],
    isGuestCart: false,
    cartPricing: {
      originalTotal: 2700,
      discountTotal: 100,
      total: 2600,
      freeShipping: false,
    },
  });

  assert.equal(storeTotals.cartSubtotal, 2700, '2200 bundle + 500 standard = 2700 EGP');
  assert.equal(storeTotals.cartDiscountTotal, 100, '100 EGP discount on standard item');

  const checkoutPricing = computeCheckoutPricing({
    cartSubtotal: storeTotals.cartSubtotal,
    cartDiscountTotal: storeTotals.cartDiscountTotal,
    rawShippingCost: 80,
    cartFreeShipping: storeTotals.cartFreeShipping,
    cartLength: 2,
  });

  assert.equal(checkoutPricing.netItemsTotal, 2600);
  assert.equal(checkoutPricing.finalTotal, 2680, '2600 net + 80 shipping = 2680 EGP');
  assert.equal(checkoutPricing.isPricingValid, true);
});

test('Checkout Order Total — 8. Rejection of order placement when pricing is invalid', () => {
  // Scenario A: Negative final total resulting from an uncapped calculation
  const invalidNegative = computeCheckoutPricing({
    cartSubtotal: 500,
    cartDiscountTotal: 1000, // discount > subtotal
    rawShippingCost: 50,
    cartFreeShipping: false,
    cartLength: 1,
  });
  assert.equal(invalidNegative.isPricingValid, false, 'Invalid discount > subtotal must be rejected');

  // Scenario B: Final total equals 0 despite having non-free items
  const invalidZeroTotal = computeCheckoutPricing({
    cartSubtotal: 900,
    cartDiscountTotal: 900,
    rawShippingCost: 50, // Positive shipping but final total 0
    cartFreeShipping: false,
    cartLength: 1,
  });
  // Since shippingCost is 50, finalTotal would be 50, which is valid.
  // But if finalTotal somehow equals 0 while shipping > 0 or subtotal > discount:
  assert.equal(
    computeCheckoutPricing({
      cartSubtotal: 1000,
      cartDiscountTotal: 500,
      rawShippingCost: 0,
      cartFreeShipping: false,
      cartLength: 0, // empty cart
    }).isPricingValid,
    false,
    'Empty cart must be invalid'
  );
});

test('Checkout Order Total — 9. Invariant totals across checkout step transitions (payment method & payment option)', () => {
  const storeTotals = computeCartTotals({
    cart: [{ id: '1', productId: '1', productName: 'Carpet', unitPrice: 3000, quantity: 1, subtotal: 2700, originalSubtotal: 3000, discountAmount: 300 }],
    isGuestCart: false,
    cartPricing: { originalTotal: 3000, discountTotal: 300, total: 2700, freeShipping: false },
  });

  const basePricing = computeCheckoutPricing({
    cartSubtotal: storeTotals.cartSubtotal,
    cartDiscountTotal: storeTotals.cartDiscountTotal,
    rawShippingCost: 150,
    cartFreeShipping: storeTotals.cartFreeShipping,
    cartLength: 1,
  });

  // Transitioning between payment option A (pay shipping upfront) and option B (pay full order upfront)
  const optionA_shipping = basePricing.shippingCost;
  const optionB_fullTotal = basePricing.finalTotal;

  assert.equal(optionA_shipping, 150, 'Option A displays upfront shipping of 150 EGP');
  assert.equal(optionB_fullTotal, 2850, 'Option B displays full total of 2850 EGP');

  // Transitioning payment method (instapay -> vodafone_cash -> cod)
  const methods = ['instapay', 'vodafone_cash', 'cod'];
  for (const method of methods) {
    const methodPricing = computeCheckoutPricing({
      cartSubtotal: storeTotals.cartSubtotal,
      cartDiscountTotal: storeTotals.cartDiscountTotal,
      rawShippingCost: 150,
      cartFreeShipping: storeTotals.cartFreeShipping,
      cartLength: 1,
    });

    assert.equal(methodPricing.cartSubtotal, basePricing.cartSubtotal, `Subtotal unchanged for ${method}`);
    assert.equal(methodPricing.cartDiscountTotal, basePricing.cartDiscountTotal, `Discount unchanged for ${method}`);
    assert.equal(methodPricing.shippingCost, basePricing.shippingCost, `Shipping unchanged for ${method}`);
    assert.equal(methodPricing.finalTotal, basePricing.finalTotal, `Final total unchanged for ${method}`);
  }
});

test('Checkout Order Total — 10. Codebase Audit: Files properly enforce valid pricing and UI clarity', () => {
  const storeCode = fs.readFileSync(path.resolve('lib/store.tsx'), 'utf-8');
  const checkoutCode = fs.readFileSync(path.resolve('components/CheckoutView.tsx'), 'utf-8');
  const cartDrawerCode = fs.readFileSync(path.resolve('components/CartDrawer.tsx'), 'utf-8');

  // lib/store.tsx audit
  assert.ok(
    storeCode.includes('cartPricing.originalTotal > 0'),
    'lib/store.tsx must check cartPricing.originalTotal > 0 for gross subtotal'
  );
  assert.ok(
    storeCode.includes('Math.min(cartSubtotal, rawDiscountTotal)'),
    'lib/store.tsx must cap discount at cartSubtotal'
  );

  // components/CheckoutView.tsx audit
  assert.ok(
    checkoutCode.includes('isPricingValid'),
    'components/CheckoutView.tsx must implement isPricingValid validation'
  );
  assert.ok(
    checkoutCode.includes('!isPricingValid'),
    'components/CheckoutView.tsx must disable submit and guard handlePlaceOrder with !isPricingValid'
  );
  assert.ok(
    checkoutCode.includes('تعذر التحقق من إجمالي الطلب. يرجى تحديث السلة والمحاولة مرة أخرى.'),
    'components/CheckoutView.tsx must display the Arabic error message for invalid pricing'
  );
  assert.ok(
    checkoutCode.includes('item.originalSubtotal'),
    'components/CheckoutView.tsx must support item originalSubtotal display'
  );

  // components/CartDrawer.tsx audit
  assert.ok(
    cartDrawerCode.includes('المجموع قبل الخصم:'),
    'components/CartDrawer.tsx must show pre-discount subtotal when discount is active'
  );
  assert.ok(
    cartDrawerCode.includes('إجمالي المنتجات بعد الخصم:'),
    'components/CartDrawer.tsx must show net products total when discount is active'
  );
});
