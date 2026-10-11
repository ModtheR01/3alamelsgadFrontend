import test from 'node:test';
import assert from 'node:assert/strict';

// Helper mirroring buildOfferPayload from lib/api/services/offerService.ts
function buildOfferPayload(data) {
  const payload = {};

  const nameAr = data.name_ar || data.name;
  if (nameAr !== undefined) {
    const trimmedAr = nameAr.trim();
    payload.name_ar = trimmedAr;
    payload.name_en = (data.name_en || trimmedAr).trim();
  } else if (data.name_en !== undefined) {
    payload.name_en = data.name_en.trim();
  }

  if (data.offer_type !== undefined) {
    payload.offer_type = data.offer_type;
  }

  if (data.is_active !== undefined) {
    payload.is_active = data.is_active;
  }

  if (data.starts_at !== undefined) {
    payload.starts_at = data.starts_at;
  }

  if (data.ends_at !== undefined) {
    payload.ends_at = data.ends_at;
  }

  const effectiveType = data.offer_type;
  if (effectiveType === 'PERCENTAGE') {
    if (data.percentage !== undefined && data.percentage !== null) {
      payload.percentage = data.percentage;
    }
  } else if (effectiveType === 'BUNDLE') {
    if (data.bundle_price !== undefined && data.bundle_price !== null) {
      payload.bundle_price = data.bundle_price;
    }
  } else {
    if (data.percentage !== undefined && data.percentage !== null) {
      payload.percentage = data.percentage;
    }
    if (data.bundle_price !== undefined && data.bundle_price !== null) {
      payload.bundle_price = data.bundle_price;
    }
  }

  const rawTargets = data.offer_products || data.products;
  if (rawTargets !== undefined && Array.isArray(rawTargets)) {
    payload.offer_products = rawTargets.map((target) => {
      const item = { product_id: target.product_id };
      if (effectiveType === 'BUNDLE') {
        item.quantity = target.quantity || 1;
      }
      return item;
    });
  }

  return payload;
}

// Helper mirroring normalizeBackendOffer from lib/api/services/offerService.ts
function normalizeBackendOffer(raw) {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const resolvedName = raw.name || raw.name_ar || raw.name_en || '';
  const products = Array.isArray(raw.products) && raw.products.length > 0
    ? raw.products
    : Array.isArray(raw.offer_products)
    ? raw.offer_products.map((p) => ({
        id: p.id || p.product_id,
        product_id: p.product_id,
        product_name: p.product_name || '',
        product_price: p.product_price || 0,
        quantity: p.quantity || 1,
      }))
    : [];

  return {
    ...raw,
    name: resolvedName,
    name_ar: raw.name_ar || resolvedName,
    name_en: raw.name_en || resolvedName,
    products,
    offer_products: raw.offer_products || products,
  };
}

// Helper mirroring normalizeApiError from lib/api/errors.ts
function normalizeApiError(error, fallbackStatus) {
  const fieldErrors = {};
  let message = 'An unexpected error occurred. Please try again.';
  let status = fallbackStatus;

  function formatFieldName(name) {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (typeof error === 'object' && error !== null) {
    for (const [key, value] of Object.entries(error)) {
      if (Array.isArray(value)) {
        const errorStrings = value.map(String);
        fieldErrors[key] = errorStrings;
        if (message === 'An unexpected error occurred. Please try again.') {
          message = `${formatFieldName(key)}: ${errorStrings[0]}`;
        }
      }
    }
  }

  return { message, fieldErrors, status };
}

test('Regression — Arabic promotional offer creation payload maps entered title to name_ar', () => {
  const arabicTitle = 'خصم ٢٠٪ على السجاد التركي الفاخر';

  const formData = {
    name: arabicTitle,
    name_ar: arabicTitle,
    name_en: arabicTitle,
    offer_type: 'PERCENTAGE',
    percentage: 20,
    bundle_price: null,
    products: [
      { product_id: 101, quantity: 1 },
      { product_id: 102, quantity: 1 },
    ],
    starts_at: '2026-10-11T00:00:00.000Z',
    ends_at: '2026-10-31T23:59:59.000Z',
    is_active: true,
  };

  const payload = buildOfferPayload(formData);

  // Exact contract requirements for DRF OfferSerializer
  assert.equal(payload.name_ar, arabicTitle, 'Payload must include name_ar with the Arabic title');
  assert.equal(payload.name_en, arabicTitle, 'Payload must include name_en');
  assert.equal(payload.offer_type, 'PERCENTAGE');
  assert.equal(payload.percentage, 20);
  assert.equal('bundle_price' in payload, false, 'bundle_price must not be present for PERCENTAGE offers');
  assert.ok(Array.isArray(payload.offer_products), 'Target products must be sent under offer_products');
  assert.equal(payload.offer_products.length, 2);
  assert.deepEqual(payload.offer_products[0], { product_id: 101 }, 'Percentage offer targets must not include quantity');
  assert.deepEqual(payload.offer_products[1], { product_id: 102 });
  assert.equal(payload.is_active, true);
  assert.equal(payload.starts_at, '2026-10-11T00:00:00.000Z');
  assert.equal(payload.ends_at, '2026-10-31T23:59:59.000Z');
});

test('Regression — Arabic bundle offer creation payload includes quantities and bundle_price', () => {
  const bundleTitle = 'باقة ٣ مشايات تركي بـ ١٠٠٠ ج.م';

  const formData = {
    name: bundleTitle,
    name_ar: bundleTitle,
    name_en: bundleTitle,
    offer_type: 'BUNDLE',
    percentage: null,
    bundle_price: 1000,
    products: [
      { product_id: 201, quantity: 2 },
      { product_id: 202, quantity: 1 },
    ],
    starts_at: '2026-10-11T00:00:00.000Z',
    ends_at: null,
    is_active: true,
  };

  const payload = buildOfferPayload(formData);

  assert.equal(payload.name_ar, bundleTitle);
  assert.equal(payload.offer_type, 'BUNDLE');
  assert.equal(payload.bundle_price, 1000);
  assert.equal('percentage' in payload, false, 'percentage must not be present for BUNDLE offers');
  assert.ok(Array.isArray(payload.offer_products));
  assert.deepEqual(payload.offer_products[0], { product_id: 201, quantity: 2 });
  assert.deepEqual(payload.offer_products[1], { product_id: 202, quantity: 1 });
});

test('Regression — Offer update payload preserves name_ar and targets', () => {
  const updatedTitle = 'تعديل: خصم ٢٥٪ لفترة محدودة';

  const updateData = {
    name_ar: updatedTitle,
    offer_type: 'PERCENTAGE',
    percentage: 25,
    offer_products: [{ product_id: 301 }],
  };

  const payload = buildOfferPayload(updateData);

  assert.equal(payload.name_ar, updatedTitle);
  assert.equal(payload.name_en, updatedTitle);
  assert.equal(payload.percentage, 25);
  assert.deepEqual(payload.offer_products, [{ product_id: 301 }]);
});

test('Regression — Backend offer normalizer populates name and products from DRF representation', () => {
  const rawBackendOffer = {
    id: 42,
    name_ar: 'عرض الجمعة الذهبية',
    name_en: 'Golden Friday Offer',
    offer_type: 'PERCENTAGE',
    percentage: '30.00',
    bundle_price: null,
    offer_products: [
      { product_id: 501 },
      { product_id: 502 },
    ],
    offer_arwals: [],
    starts_at: '2026-10-11T00:00:00Z',
    ends_at: '2026-10-18T23:59:59Z',
    is_active: true,
  };

  const normalized = normalizeBackendOffer(rawBackendOffer);

  assert.equal(normalized.id, 42);
  assert.equal(normalized.name, 'عرض الجمعة الذهبية', 'name should be normalized from name_ar');
  assert.equal(normalized.name_ar, 'عرض الجمعة الذهبية');
  assert.equal(normalized.name_en, 'Golden Friday Offer');
  assert.ok(Array.isArray(normalized.products), 'products array must be populated');
  assert.equal(normalized.products.length, 2);
  assert.equal(normalized.products[0].product_id, 501);
  assert.equal(normalized.products[1].product_id, 502);
});

test('Regression — Error normalizer correctly surfaces Name Ar validation errors', () => {
  // Simulates DRF 400 error when name_ar is missing or invalid
  const drfValidationError = {
    name_ar: ['This field is required.'],
  };

  const normalized = normalizeApiError(drfValidationError, 400);

  assert.equal(normalized.status, 400);
  assert.equal(normalized.message, 'Name Ar: This field is required.');
  assert.deepEqual(normalized.fieldErrors.name_ar, ['This field is required.']);

  // Simulates target products validation error
  const targetError = {
    offer_products: ['At least one Product or Arwal target is required.'],
  };

  const normalizedTarget = normalizeApiError(targetError, 400);
  assert.equal(normalizedTarget.message, 'Offer Products: At least one Product or Arwal target is required.');
  assert.deepEqual(normalizedTarget.fieldErrors.offer_products, ['At least one Product or Arwal target is required.']);
});
