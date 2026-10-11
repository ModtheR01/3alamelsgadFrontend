import test from 'node:test';
import assert from 'node:assert/strict';

// Normalizer mirroring lib/api/services/shippingService.ts
function normalizeGovernorate(raw) {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const nameAr = (raw.name_ar || raw.nameAr || '').trim();
  const nameEn = (raw.name_en || raw.nameEn || '').trim();
  const priceNum =
    raw.shipping_price !== undefined && raw.shipping_price !== null
      ? Number(raw.shipping_price)
      : raw.shippingCost !== undefined
      ? Number(raw.shippingCost)
      : 0;

  const isActive =
    raw.is_active !== undefined
      ? Boolean(raw.is_active)
      : raw.isActive !== undefined
      ? Boolean(raw.isActive)
      : true;

  return {
    id: raw.id,
    nameAr,
    nameEn,
    name_ar: nameAr,
    name_en: nameEn,
    shippingCost: priceNum,
    shipping_price: raw.shipping_price !== undefined ? raw.shipping_price : String(priceNum),
    isActive,
    is_active: isActive,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

// DRF unwrap helper mirroring lib/api/pagination.ts
function unwrapResults(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (typeof response === 'object' && response !== null && 'results' in response && Array.isArray(response.results)) {
    return response.results;
  }
  return [];
}

// Error normalizer mirroring lib/api/errors.ts
function normalizeApiError(error, fallbackStatus) {
  let message = 'An unexpected error occurred. Please try again.';
  if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    if (typeof error.message === 'string') {
      message = error.message;
    } else if (typeof error.detail === 'string') {
      message = error.detail;
    }
  }
  return { message };
}

// Checkout governorate resolution and calculation model
function resolveCheckoutGovernorates({
  rawApiResponse,
  apiError = null,
  authAddresses = [],
  userSelectedAddressId = null,
  selectedGovernorateId = '',
  cartSubtotal = 1000,
  cartDiscountTotal = 100,
}) {
  let remoteGovernorates = [];
  let isGovsLoading = false;
  let govsError = null;

  if (apiError) {
    const normalized = normalizeApiError(apiError);
    govsError = normalized.message || 'تعذر تحميل بيانات المحافظات والتوصيل.';
    remoteGovernorates = [];
  } else {
    const unwrapped = unwrapResults(rawApiResponse);
    remoteGovernorates = unwrapped.map(normalizeGovernorate);
  }

  // Active governorates only
  const activeGovernorates = remoteGovernorates.filter((g) => g.is_active !== false);

  // Address resolution: find default or first saved address with an active governorate in the database
  const validDefaultAddr = (() => {
    if (!authAddresses || authAddresses.length === 0) return null;
    const defaultCandidate = authAddresses.find((a) => a.is_default);
    if (defaultCandidate && activeGovernorates.some((g) => Number(g.id) === Number(defaultCandidate.governorate))) {
      return defaultCandidate;
    }
    return authAddresses.find((a) => activeGovernorates.some((g) => Number(g.id) === Number(a.governorate))) || null;
  })();

  const selectedAddressId =
    userSelectedAddressId !== null
      ? userSelectedAddressId
      : validDefaultAddr
      ? validDefaultAddr.id
      : 'new';

  const selectedSavedAddress =
    selectedAddressId === 'new'
      ? null
      : authAddresses.find((a) => a.id === selectedAddressId) || null;

  // Sync selectedGovernorateId
  let resolvedNewGovId = selectedGovernorateId;
  if (activeGovernorates.length > 0) {
    const exists = activeGovernorates.some((g) => String(g.id) === String(resolvedNewGovId));
    if (!exists) {
      resolvedNewGovId = String(activeGovernorates[0].id);
    }
  } else {
    resolvedNewGovId = '';
  }

  const selectedNewGov =
    activeGovernorates.find((g) => String(g.id) === String(resolvedNewGovId)) ||
    activeGovernorates[0] ||
    null;

  const currentGov = selectedSavedAddress
    ? activeGovernorates.find((g) => Number(g.id) === Number(selectedSavedAddress.governorate)) || null
    : selectedNewGov;

  const isCurrentAddressGovActive = Boolean(currentGov);

  const shippingCost = currentGov
    ? Number(currentGov.shipping_price !== undefined ? currentGov.shipping_price : currentGov.shippingCost)
    : 0;

  const finalTotal = Math.max(0, cartSubtotal - cartDiscountTotal + shippingCost);

  // Check if place order submission can proceed
  const canPlaceOrder =
    !isGovsLoading &&
    !govsError &&
    activeGovernorates.length > 0 &&
    isCurrentAddressGovActive;

  return {
    remoteGovernorates,
    activeGovernorates,
    govsError,
    selectedAddressId,
    selectedSavedAddress,
    resolvedNewGovId,
    selectedNewGov,
    currentGov,
    isCurrentAddressGovActive,
    shippingCost,
    finalTotal,
    canPlaceOrder,
  };
}

test('Checkout Governorates — When API returns exactly one governorate, dropdown options contain only that record', () => {
  const singleGovResponse = {
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        name_ar: 'القاهرة',
        name_en: 'Cairo',
        shipping_price: '65.00',
        is_active: true,
      },
    ],
  };

  const state = resolveCheckoutGovernorates({
    rawApiResponse: singleGovResponse,
    cartSubtotal: 1200,
    cartDiscountTotal: 200,
  });

  assert.equal(state.activeGovernorates.length, 1, 'Dropdown must contain exactly 1 governorate');
  assert.equal(state.activeGovernorates[0].id, 1);
  assert.equal(state.activeGovernorates[0].name_ar, 'القاهرة');
  assert.equal(state.activeGovernorates[0].name_en, 'Cairo');
  assert.equal(state.resolvedNewGovId, '1');
  assert.equal(state.shippingCost, 65, 'Shipping fee must equal real database record');
  assert.equal(state.finalTotal, 1065, 'Order total must include the 65 EGP shipping fee (1200 - 200 + 65)');
  assert.equal(state.canPlaceOrder, true);
});

test('Checkout Governorates — When API returns an empty list, no fake options appear and submission is blocked', () => {
  const emptyGovResponse = {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };

  const state = resolveCheckoutGovernorates({
    rawApiResponse: emptyGovResponse,
    cartSubtotal: 1000,
    cartDiscountTotal: 0,
  });

  assert.equal(state.activeGovernorates.length, 0, 'No governorates should be in active list');
  assert.equal(state.currentGov, null, 'No governorate should be selected');
  assert.equal(state.shippingCost, 0, 'Shipping cost must be 0 when no governorates exist');
  assert.equal(state.canPlaceOrder, false, 'Placing order must be prevented when no governorates exist');
});

test('Checkout Governorates — When API fails, no mock fallback appears, error is reported, and checkout is blocked', () => {
  const state = resolveCheckoutGovernorates({
    rawApiResponse: null,
    apiError: new Error('Failed to connect to backend'),
    cartSubtotal: 1500,
    cartDiscountTotal: 100,
  });

  assert.equal(state.activeGovernorates.length, 0, 'Must NOT fallback to BRAND_CONFIG or mock governorates');
  assert.ok(state.govsError, 'Error message must be set');
  assert.equal(state.canPlaceOrder, false, 'Placing order must be blocked during API failure');
  assert.equal(state.shippingCost, 0, 'Shipping cost must not default to mock prices');
});

test('Checkout Governorates — Inactive governorates returned by the backend are filtered out', () => {
  const mixedResponse = {
    count: 2,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        name_ar: 'القاهرة',
        name_en: 'Cairo',
        shipping_price: '60.00',
        is_active: true,
      },
      {
        id: 2,
        name_ar: 'المنوفية',
        name_en: 'Monufia',
        shipping_price: '90.00',
        is_active: false,
      },
    ],
  };

  const state = resolveCheckoutGovernorates({
    rawApiResponse: mixedResponse,
  });

  assert.equal(state.activeGovernorates.length, 1, 'Only active governorates must be present');
  assert.equal(state.activeGovernorates[0].id, 1);
  assert.equal(state.activeGovernorates[0].is_active, true);
  assert.equal(state.shippingCost, 60);
});

test('Checkout Governorates — Saved address with a stale/nonexistent governorate cannot silently become a valid selection', () => {
  const singleGovResponse = {
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        name_ar: 'القاهرة',
        name_en: 'Cairo',
        shipping_price: '60.00',
        is_active: true,
      },
    ],
  };

  // User has a saved address referencing old governorate ID 999 (not in DB)
  const staleAddress = {
    id: 101,
    title: 'عنوان قديم',
    governorate: 999, // Stale ID
    city: 'مدينة قديمة',
    street: 'شارع قديم',
    building_number: '1',
    apartment_number: '1',
    is_default: true,
  };

  const state = resolveCheckoutGovernorates({
    rawApiResponse: singleGovResponse,
    authAddresses: [staleAddress],
  });

  // Since staleAddress has governorate 999 which is not in activeGovernorates,
  // validDefaultAddr is null, and selectedAddressId defaults to 'new' instead of stale address!
  assert.equal(
    state.selectedAddressId,
    'new',
    'Address with stale governorate must NOT silently become default selection'
  );

  // If user explicitly clicks on the stale address:
  const staleClickedState = resolveCheckoutGovernorates({
    rawApiResponse: singleGovResponse,
    authAddresses: [staleAddress],
    userSelectedAddressId: 101,
  });

  assert.equal(
    staleClickedState.isCurrentAddressGovActive,
    false,
    'Stale address must be flagged as inactive'
  );
  assert.equal(
    staleClickedState.canPlaceOrder,
    false,
    'Placing order with stale address must be blocked'
  );
});

test('Checkout Governorates — Saved address with an active governorate dynamically uses its real shipping price', () => {
  const twoGovsResponse = {
    count: 2,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        name_ar: 'القاهرة',
        name_en: 'Cairo',
        shipping_price: '55.00',
        is_active: true,
      },
      {
        id: 2,
        name_ar: 'الإسكندرية',
        name_en: 'Alexandria',
        shipping_price: '85.00',
        is_active: true,
      },
    ],
  };

  const validAlexAddress = {
    id: 202,
    title: 'شقة الإسكندرية',
    governorate: 2, // Active ID
    city: 'سموحة',
    street: 'شارع فوزي معاذ',
    building_number: '10',
    apartment_number: '4',
    is_default: true,
  };

  const state = resolveCheckoutGovernorates({
    rawApiResponse: twoGovsResponse,
    authAddresses: [validAlexAddress],
    cartSubtotal: 2000,
    cartDiscountTotal: 100,
  });

  assert.equal(state.selectedAddressId, 202, 'Valid default address is selected');
  assert.equal(state.shippingCost, 85, 'Shipping cost matches Alexandria database price (85 EGP)');
  assert.equal(state.finalTotal, 1985, 'Final total reflects 2000 - 100 + 85 = 1985 EGP');
  assert.equal(state.canPlaceOrder, true);
});
