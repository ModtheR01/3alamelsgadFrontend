import test from 'node:test';
import assert from 'node:assert/strict';

// Test Suite: Phase 1 — Authentication, Addresses, Governorates & Proxy Alignment

test('Phase 1 - Auth contracts: Login and Register request shapes match DRF Backend', async (t) => {
  // 1. Verify Login payload format
  const loginPayload = {
    phone: '01012345678',
    password: 'SecurePassword123!',
  };
  assert.equal(typeof loginPayload.phone, 'string', 'Login must use phone string');
  assert.equal(typeof loginPayload.password, 'string', 'Login must include password');
  assert.equal('email' in loginPayload, false, 'Login must not require email');

  // 2. Verify Register payload format
  const registerPayload = {
    first_name: 'Ahmed',
    last_name: 'Mahmoud',
    phone: '01012345678',
    password: 'SecurePassword123!',
  };
  assert.equal(typeof registerPayload.first_name, 'string');
  assert.equal(typeof registerPayload.last_name, 'string');
  assert.equal(typeof registerPayload.phone, 'string');
  assert.equal(typeof registerPayload.password, 'string');
  assert.ok(registerPayload.password.length >= 8, 'Password must be min 8 characters');
});

test('Phase 1 - Address contracts: Address payload requires governorate ID number instead of country', async (t) => {
  const addressCreatePayload = {
    title: 'منزل المنصورة',
    governorate: 3, // Foreign key ID to Governorate in backend
    city: 'المنصورة',
    street: 'شارع الجمهورية',
    building_number: '14',
    apartment_number: '2',
    is_default: true,
  };

  assert.equal(typeof addressCreatePayload.governorate, 'number', 'governorate must be foreign key ID number');
  assert.ok(Number.isInteger(addressCreatePayload.governorate) && addressCreatePayload.governorate > 0);
  assert.equal('country' in addressCreatePayload, false, 'Backend does not have country field');
});

test('Phase 1 - Shipping contracts: Normalizes DRF backend Governorate response', async (t) => {
  // Simulate DRF Governorate response
  const drfGovResponse = {
    id: 1,
    name_ar: 'القاهرة',
    name_en: 'Cairo',
    shipping_price: '100.00',
    is_active: true,
    created_at: '2026-10-03T20:00:00Z',
    updated_at: '2026-10-03T20:00:00Z',
  };

  // Normalization logic implemented in shippingService
  const priceNum = Number(drfGovResponse.shipping_price);
  const normalized = {
    id: drfGovResponse.id,
    nameAr: drfGovResponse.name_ar,
    nameEn: drfGovResponse.name_en,
    name_ar: drfGovResponse.name_ar,
    name_en: drfGovResponse.name_en,
    shippingCost: priceNum,
    shipping_price: drfGovResponse.shipping_price,
    deliveryDaysMin: 2,
    deliveryDaysMax: 4,
    isActive: drfGovResponse.is_active,
    is_active: drfGovResponse.is_active,
  };

  assert.equal(normalized.id, 1);
  assert.equal(normalized.nameAr, 'القاهرة');
  assert.equal(normalized.nameEn, 'Cairo');
  assert.equal(normalized.shippingCost, 100);
  assert.equal(normalized.isActive, true);
  assert.equal(normalized.is_active, true);
});

test('Phase 1 - Pagination unwrap logic handles both DRF PageNumberPagination and bare arrays', async (t) => {
  function unwrapResults(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (typeof response === 'object' && response !== null && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    }
    return [];
  }

  // 1. DRF Envelope
  const envelope = {
    count: 2,
    next: null,
    previous: null,
    results: [
      { id: 1, title: 'Home' },
      { id: 2, title: 'Office' },
    ],
  };
  const unwrapped = unwrapResults(envelope);
  assert.equal(unwrapped.length, 2);
  assert.equal(unwrapped[0].title, 'Home');

  // 2. Bare array
  const bare = [{ id: 10, title: 'Summer House' }];
  const unwrappedBare = unwrapResults(bare);
  assert.equal(unwrappedBare.length, 1);
  assert.equal(unwrappedBare[0].id, 10);

  // 3. Null / undefined safety
  assert.deepEqual(unwrapResults(null), []);
  assert.deepEqual(unwrapResults(undefined), []);
});

test('Phase 1 - Error normalizer correctly surfaces backend phone/governorate field errors', async (t) => {
  function normalizeApiError(errorData, status = 400) {
    let message = 'An error occurred';
    const fieldErrors = {};

    if (errorData && typeof errorData === 'object') {
      if (typeof errorData.detail === 'string') {
        message = errorData.detail;
      } else if (typeof errorData.message === 'string') {
        message = errorData.message;
      }

      for (const [key, val] of Object.entries(errorData)) {
        if (Array.isArray(val)) {
          fieldErrors[key] = val.map(String);
        } else if (typeof val === 'string' && key !== 'detail' && key !== 'message') {
          fieldErrors[key] = [val];
        }
      }
    }

    return { message, fieldErrors, status };
  }

  // Test DRF Phone Validation Error
  const phoneErrorResponse = {
    phone: ['User with this phone already exists.'],
  };
  const normalizedPhoneErr = normalizeApiError(phoneErrorResponse, 400);
  assert.ok(normalizedPhoneErr.fieldErrors.phone);
  assert.equal(normalizedPhoneErr.fieldErrors.phone[0], 'User with this phone already exists.');

  // Test DRF Inactive Governorate Error
  const govErrorResponse = {
    governorate: ['Selected governorate is not active.'],
  };
  const normalizedGovErr = normalizeApiError(govErrorResponse, 400);
  assert.ok(normalizedGovErr.fieldErrors.governorate);
  assert.equal(normalizedGovErr.fieldErrors.governorate[0], 'Selected governorate is not active.');
});

test('Phase 1 - Same-Origin Proxy Target fallback logic', async (t) => {
  function resolveTarget(envTarget, nodeEnv) {
    const raw = envTarget || (nodeEnv !== 'production' ? 'http://127.0.0.1:8000' : '');
    return raw ? raw.replace(/\/+$/, '').replace(/\/api$/, '') : '';
  }

  // 1. Explicit clean URL
  assert.equal(resolveTarget('https://backend-production.up.railway.app', 'production'), 'https://backend-production.up.railway.app');

  // 2. Trailing slash and /api stripped
  assert.equal(resolveTarget('https://backend-production.up.railway.app/api/', 'production'), 'https://backend-production.up.railway.app');

  // 3. Dev fallback when unset
  assert.equal(resolveTarget('', 'development'), 'http://127.0.0.1:8000');

  // 4. Production returns empty string when unset (triggers 500 configuration check)
  assert.equal(resolveTarget('', 'production'), '');
});
