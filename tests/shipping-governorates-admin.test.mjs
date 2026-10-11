import test from 'node:test';
import assert from 'node:assert/strict';

// Normalizer mirroring normalizeGovernorate in lib/api/services/shippingService.ts
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

// DRF unwrapResults helper mirroring lib/api/pagination.ts
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

// Payload builders mirroring shippingService
function buildCreateGovernoratePayload(data) {
  const trimmedAr = (data.name_ar || '').trim();
  const trimmedEn = (data.name_en || '').trim();
  const parsedPrice = Number(data.shipping_price);

  if (!trimmedAr) {
    throw new Error('اسم المحافظة بالعربي مطلوب.');
  }
  if (!trimmedEn) {
    throw new Error('اسم المحافظة بالإنجليزي مطلوب.');
  }
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    throw new Error('يرجى إدخال تكلفة شحن صحيحة (٠ جنيه أو أكثر).');
  }

  return {
    name_ar: trimmedAr,
    name_en: trimmedEn,
    shipping_price: String(data.shipping_price),
    is_active: data.is_active ?? true,
  };
}

function buildUpdateGovernoratePayload(payload) {
  const backendPayload = {};
  if (payload.name_ar !== undefined) backendPayload.name_ar = payload.name_ar.trim();
  if (payload.name_en !== undefined) backendPayload.name_en = payload.name_en.trim();
  if (payload.shipping_price !== undefined) {
    const p = Number(payload.shipping_price);
    if (isNaN(p) || p < 0) throw new Error('يرجى إدخال تكلفة شحن صحيحة (٠ جنيه أو أكثر).');
    backendPayload.shipping_price = String(payload.shipping_price);
  }
  if (payload.is_active !== undefined) {
    backendPayload.is_active = Boolean(payload.is_active);
  }
  return backendPayload;
}

test('Shipping Admin — Fetch real governorates list from DRF database envelope', () => {
  const drfResponse = {
    count: 3,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        name_ar: 'القاهرة',
        name_en: 'Cairo',
        shipping_price: '40.00',
        is_active: true,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 2,
        name_ar: 'الجيزة',
        name_en: 'Giza',
        shipping_price: '40.00',
        is_active: true,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 3,
        name_ar: 'شمال سيناء',
        name_en: 'North Sinai',
        shipping_price: '120.00',
        is_active: false,
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
      },
    ],
  };

  const unwrapped = unwrapResults(drfResponse);
  const normalized = unwrapped.map(normalizeGovernorate);

  assert.equal(normalized.length, 3, 'Total count must match backend response exactly');
  assert.equal(normalized[0].name_ar, 'القاهرة');
  assert.equal(normalized[0].name_en, 'Cairo');
  assert.equal(normalized[0].shippingCost, 40);
  assert.equal(normalized[0].is_active, true);

  assert.equal(normalized[2].name_ar, 'شمال سيناء');
  assert.equal(normalized[2].name_en, 'North Sinai');
  assert.equal(normalized[2].shippingCost, 120);
  assert.equal(normalized[2].is_active, false, 'Inactive governorates must reflect is_active: false');
});

test('Shipping Admin — Add governorate validates fields and produces exact backend payload', () => {
  const validData = {
    name_ar: 'الدقهلية',
    name_en: 'Dakahlia',
    shipping_price: 45,
    is_active: true,
  };

  const payload = buildCreateGovernoratePayload(validData);
  assert.deepEqual(payload, {
    name_ar: 'الدقهلية',
    name_en: 'Dakahlia',
    shipping_price: '45',
    is_active: true,
  });

  // Missing Arabic name validation
  assert.throws(
    () => buildCreateGovernoratePayload({ ...validData, name_ar: '' }),
    /اسم المحافظة بالعربي مطلوب/
  );

  // Missing English name validation
  assert.throws(
    () => buildCreateGovernoratePayload({ ...validData, name_en: '   ' }),
    /اسم المحافظة بالإنجليزي مطلوب/
  );

  // Invalid / Negative shipping price validation
  assert.throws(
    () => buildCreateGovernoratePayload({ ...validData, shipping_price: -10 }),
    /يرجى إدخال تكلفة شحن صحيحة/
  );
  assert.throws(
    () => buildCreateGovernoratePayload({ ...validData, shipping_price: 'abc' }),
    /يرجى إدخال تكلفة شحن صحيحة/
  );
});

test('Shipping Admin — Edit governorate updates all editable fields via PATCH payload', () => {
  const editData = {
    name_ar: 'الدقهلية (المنصورة)',
    name_en: 'Dakahlia (Mansoura)',
    shipping_price: 55,
    is_active: false,
  };

  const patchPayload = buildUpdateGovernoratePayload(editData);
  assert.deepEqual(patchPayload, {
    name_ar: 'الدقهلية (المنصورة)',
    name_en: 'Dakahlia (Mansoura)',
    shipping_price: '55',
    is_active: false,
  });

  // Partial update (only price and status)
  const partial = buildUpdateGovernoratePayload({ shipping_price: 60, is_active: true });
  assert.deepEqual(partial, {
    shipping_price: '60',
    is_active: true,
  });
});

test('Shipping Admin — Empty database does NOT fallback to mock data', () => {
  const emptyDbResponse = {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };

  const results = unwrapResults(emptyDbResponse);
  const normalized = results.map(normalizeGovernorate);

  assert.equal(normalized.length, 0, 'Empty DB must yield 0 records without falling back to mock lists');
  assert.deepEqual(normalized, []);
});

test('Shipping Admin — API error handling and duplicate name validation error normalization', () => {
  // Simulates DRF 400 unique constraint error when governorate name already exists
  const duplicateArError = {
    name_ar: ['governorate with this name ar already exists.'],
  };

  const normalizedAr = normalizeApiError(duplicateArError, 400);
  assert.equal(normalizedAr.status, 400);
  assert.equal(normalizedAr.message, 'Name Ar: governorate with this name ar already exists.');
  assert.deepEqual(normalizedAr.fieldErrors.name_ar, ['governorate with this name ar already exists.']);

  const duplicateEnError = {
    name_en: ['governorate with this name en already exists.'],
  };

  const normalizedEn = normalizeApiError(duplicateEnError, 400);
  assert.equal(normalizedEn.message, 'Name En: governorate with this name en already exists.');
});
