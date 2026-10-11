import test from 'node:test';
import assert from 'node:assert/strict';

// Error normalizer mirroring lib/api/errors.ts
function formatFieldName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeApiError(error, fallbackStatus) {
  const fieldErrors = {};
  let message = 'An unexpected error occurred. Please try again.';
  let status = fallbackStatus;

  if (!error) {
    return { message, fieldErrors, status };
  }

  if (typeof error === 'string') {
    return {
      message: error.trim(),
      fieldErrors,
      status,
      raw: error,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const errObj = error;

    if (errObj.status && typeof errObj.status === 'number') {
      status = errObj.status;
    }

    // 1. DRF { "detail": "..." } or { "detail": ["..."] }
    if (typeof errObj.detail === 'string') {
      message = errObj.detail;
      fieldErrors['detail'] = [errObj.detail];
    } else if (Array.isArray(errObj.detail) && errObj.detail.length > 0) {
      message = String(errObj.detail[0]);
      fieldErrors['detail'] = errObj.detail.map(String);
    }

    // 2. { "message": "..." } or { "message": ["..."] }
    if (typeof errObj.message === 'string') {
      message = errObj.message;
      fieldErrors['message'] = [errObj.message];
    } else if (Array.isArray(errObj.message) && errObj.message.length > 0) {
      message = String(errObj.message[0]);
      fieldErrors['message'] = errObj.message.map(String);
    }

    // 2b. { "error": "..." } or { "error": ["..."] }
    if (typeof errObj.error === 'string') {
      message = errObj.error;
      fieldErrors['error'] = [errObj.error];
    } else if (Array.isArray(errObj.error) && errObj.error.length > 0) {
      message = String(errObj.error[0]);
      fieldErrors['error'] = errObj.error.map(String);
    }

    // 3. DRF { "non_field_errors": ["..."] }
    if (Array.isArray(errObj.non_field_errors) && errObj.non_field_errors.length > 0) {
      message = String(errObj.non_field_errors[0]);
      fieldErrors['non_field_errors'] = errObj.non_field_errors.map(String);
    } else if (typeof errObj.non_field_errors === 'string') {
      message = errObj.non_field_errors;
      fieldErrors['non_field_errors'] = [errObj.non_field_errors];
    }

    // 4. Field-level validation errors
    for (const [key, value] of Object.entries(errObj)) {
      if (['detail', 'message', 'error', 'status', 'statusCode', 'non_field_errors'].includes(key)) {
        continue;
      }

      if (Array.isArray(value)) {
        const errorStrings = value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
        fieldErrors[key] = errorStrings;
        if (message === 'An unexpected error occurred. Please try again.' && errorStrings.length > 0) {
          message = `${formatFieldName(key)}: ${errorStrings[0]}`;
        }
      } else if (typeof value === 'string') {
        fieldErrors[key] = [value];
        if (message === 'An unexpected error occurred. Please try again.') {
          message = `${formatFieldName(key)}: ${value}`;
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const [subKey, subVal] of Object.entries(value)) {
          const combinedKey = `${key}_${subKey}`;
          if (Array.isArray(subVal)) {
            const subErrors = subVal.map(String);
            fieldErrors[combinedKey] = subErrors;
            if (message === 'An unexpected error occurred. Please try again.' && subErrors.length > 0) {
              message = `${formatFieldName(combinedKey)}: ${subErrors[0]}`;
            }
          } else if (typeof subVal === 'string') {
            fieldErrors[combinedKey] = [subVal];
            if (message === 'An unexpected error occurred. Please try again.') {
              message = `${formatFieldName(combinedKey)}: ${subVal}`;
            }
          }
        }
      }
    }
  }

  if (status) {
    if (status === 400 && message === 'An unexpected error occurred. Please try again.') {
      message = 'بيانات الطلب غير صالحة. يرجى مراجعة البيانات المدخلة وإعادة المحاولة.';
    }
  }

  return { message, fieldErrors, status, raw: error };
}

// User-friendly Arabic checkout error mapper mirroring CheckoutView.tsx
function mapCheckoutErrorMessage(rawMessage, t = (ar, en) => ar) {
  const normalized = (rawMessage || '').toLowerCase();
  if (normalized.includes('this address already exists') || normalized.includes('already exists')) {
    return t('هذا العنوان مسجل بالفعل في حسابك.', 'This address already exists in your account.');
  }
  if (
    normalized.includes('the address must have an active governorate') ||
    normalized.includes('selected governorate is not active')
  ) {
    return t('المحافظة المحددة غير متاحة للشحن حالياً.', 'The selected governorate is currently not available for shipping.');
  }
  if (normalized.includes('your cart is empty') || normalized.includes('cart:')) {
    return t('سلة المشتريات فارغة. يرجى إضافة منتجات لإتمام الطلب.', 'Your cart is empty. Please add items to place an order.');
  }
  if (normalized.includes('the address does not exist')) {
    return t('العنوان المحدد غير موجود أو غير مرتبط بحسابك.', 'The selected address does not exist or does not belong to your account.');
  }
  return rawMessage;
}

// Helper to simulate address creation or matching logic in CheckoutView
async function resolveNewAddressTargetId({
  authAddresses = [],
  selectedGovId,
  city,
  street,
  buildingNumber = '1',
  apartmentNumber = '1',
  addressTitle = 'عنوان التوصيل',
  createAddressFn,
  fetchLatestAddressesFn,
}) {
  const selectedGovNum = Number(selectedGovId);
  const trimmedCity = city.trim();
  const trimmedStreet = street.trim();
  const trimmedBuilding = (buildingNumber || '1').trim();
  const trimmedApartment = (apartmentNumber || '1').trim();
  const trimmedTitle = (addressTitle || 'عنوان التوصيل').trim();

  // 1. Check existing saved addresses first
  const existingMatch = authAddresses.find(
    (a) =>
      Number(a.governorate) === selectedGovNum &&
      a.city.trim().toLowerCase() === trimmedCity.toLowerCase() &&
      a.street.trim().toLowerCase() === trimmedStreet.toLowerCase() &&
      (a.building_number || '1').trim() === trimmedBuilding &&
      (a.apartment_number || '1').trim() === trimmedApartment
  );

  if (existingMatch) {
    return { targetAddressId: existingMatch.id, wasReused: true };
  }

  try {
    const newAddr = await createAddressFn({
      title: trimmedTitle,
      governorate: selectedGovNum,
      city: trimmedCity,
      street: trimmedStreet,
      building_number: trimmedBuilding,
      apartment_number: trimmedApartment,
      is_default: authAddresses.length === 0,
    });
    return { targetAddressId: newAddr.id, wasReused: false };
  } catch (addrErr) {
    const norm = normalizeApiError(addrErr);
    const errStr = (norm.message || '').toLowerCase();
    if (errStr.includes('already exists') || errStr.includes('موجود بالفعل')) {
      const latest = await fetchLatestAddressesFn();
      const match = latest.find(
        (a) =>
          Number(a.governorate) === selectedGovNum &&
          a.city.trim().toLowerCase() === trimmedCity.toLowerCase() &&
          a.street.trim().toLowerCase() === trimmedStreet.toLowerCase()
      );
      if (match) {
        return { targetAddressId: match.id, wasReused: true };
      }
    }
    throw addrErr;
  }
}

// Helper to simulate safe order items post-processing in CheckoutView
function buildOrderWithFinishes(createdOrder, cart) {
  const remainingCartItems = [...cart];
  return {
    ...createdOrder,
    items: (createdOrder.items || []).map((orderItem) => {
      const orderColorHex = orderItem.color_hex_code?.toUpperCase();
      const matchesCartItem = (cartItem, requireQuantityMatch, requireColorMatch) => {
        const parsedProductId = Number(cartItem.productId);
        const cartProductId = Number.isInteger(parsedProductId)
          ? parsedProductId
          : Number(String(cartItem.productId).replace(/\D/g, '')) || 1;
        const backendItemId = orderItem.product_id ?? orderItem.product ?? orderItem.arwal;
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
}

// =========================================================================
// Tests
// =========================================================================

test('Order Submission — DRF array message validation errors are properly surfaced instead of generic fallback', () => {
  // Simulates DRF AddressSerializer validation error { "message": ["This address already exists."] }
  const drfDuplicateAddr = {
    message: ['This address already exists.'],
  };

  const normalized = normalizeApiError(drfDuplicateAddr, 400);
  assert.equal(normalized.message, 'This address already exists.');
  assert.deepEqual(normalized.fieldErrors.message, ['This address already exists.']);
  assert.equal(normalized.status, 400);

  // Mapped Arabic user-facing message
  const userMsg = mapCheckoutErrorMessage(normalized.message);
  assert.equal(userMsg, 'هذا العنوان مسجل بالفعل في حسابك.');
});

test('Order Submission — Inactive governorate error on address is cleanly formatted and translated', () => {
  // Simulates DRF CheckoutSerializer validation error { "address_id": ["The address must have an active governorate."] }
  const drfInactiveGov = {
    address_id: ['The address must have an active governorate.'],
  };

  const normalized = normalizeApiError(drfInactiveGov, 400);
  assert.equal(normalized.message, 'Address Id: The address must have an active governorate.');
  assert.deepEqual(normalized.fieldErrors.address_id, ['The address must have an active governorate.']);

  const userMsg = mapCheckoutErrorMessage(normalized.message);
  assert.equal(userMsg, 'المحافظة المحددة غير متاحة للشحن حالياً.');
});

test('Order Submission — Empty cart validation error from backend is cleanly surfaced and translated', () => {
  // Simulates DRF CheckoutSerializer validation error { "cart": ["Your cart is empty."] }
  const drfEmptyCart = {
    cart: ['Your cart is empty.'],
  };

  const normalized = normalizeApiError(drfEmptyCart, 400);
  assert.equal(normalized.message, 'Cart: Your cart is empty.');
  assert.deepEqual(normalized.fieldErrors.cart, ['Your cart is empty.']);

  const userMsg = mapCheckoutErrorMessage(normalized.message);
  assert.equal(userMsg, 'سلة المشتريات فارغة. يرجى إضافة منتجات لإتمام الطلب.');
});

test('Order Submission — New address creation submits exact DRF AddressSerializer payload', async () => {
  let submittedPayload = null;
  const mockCreateAddress = async (data) => {
    submittedPayload = data;
    return { id: 10, ...data };
  };

  const result = await resolveNewAddressTargetId({
    authAddresses: [],
    selectedGovId: '2',
    city: 'القاهرة',
    street: 'شارع المعز لدين الله',
    buildingNumber: '15',
    apartmentNumber: '4',
    addressTitle: 'عنوان العمل',
    createAddressFn: mockCreateAddress,
    fetchLatestAddressesFn: async () => [],
  });

  assert.equal(result.targetAddressId, 10);
  assert.equal(result.wasReused, false);
  assert.deepEqual(submittedPayload, {
    title: 'عنوان العمل',
    governorate: 2,
    city: 'القاهرة',
    street: 'شارع المعز لدين الله',
    building_number: '15',
    apartment_number: '4',
    is_default: true,
  });
});

test('Order Submission — Existing saved address matching the entered details is reused without duplicate error', async () => {
  let createCalled = false;
  const mockCreateAddress = async () => {
    createCalled = true;
    throw new Error('Should not be called');
  };

  const savedAddresses = [
    {
      id: 5,
      governorate: 2,
      city: 'القاهرة',
      street: 'شارع التحرير',
      building_number: '1',
      apartment_number: '1',
      is_default: true,
    },
  ];

  const result = await resolveNewAddressTargetId({
    authAddresses: savedAddresses,
    selectedGovId: '2',
    city: 'القاهرة',
    street: 'شارع التحرير',
    buildingNumber: '1',
    apartmentNumber: '1',
    addressTitle: 'عنوان المنزل',
    createAddressFn: mockCreateAddress,
    fetchLatestAddressesFn: async () => savedAddresses,
  });

  assert.equal(createCalled, false, 'createAddress must not be called when an identical saved address exists');
  assert.equal(result.targetAddressId, 5);
  assert.equal(result.wasReused, true);
});

test('Order Submission — If backend reports address already exists, recovers cleanly by retrieving matching ID', async () => {
  const existingInDb = [
    {
      id: 7,
      governorate: 2,
      city: 'القاهرة',
      street: 'شارع النصر',
      building_number: '10',
      apartment_number: '5',
    },
  ];

  const mockCreateAddress = async () => {
    throw {
      status: 400,
      message: ['This address already exists.'],
    };
  };

  const mockFetchLatest = async () => existingInDb;

  const result = await resolveNewAddressTargetId({
    authAddresses: [], // local cache didn't have it yet
    selectedGovId: '2',
    city: 'القاهرة',
    street: 'شارع النصر',
    buildingNumber: '10',
    apartmentNumber: '5',
    createAddressFn: mockCreateAddress,
    fetchLatestAddressesFn: mockFetchLatest,
  });

  assert.equal(result.targetAddressId, 7, 'Must resolve to existing address ID 7');
  assert.equal(result.wasReused, true);
});

test('Order Submission — Post-order item processing safely handles items without selectedColor and DRF product PK field', () => {
  // Simulates DRF OrderSerializer response where field is `product: 3` (not product_id)
  const createdOrder = {
    id: 101,
    order_number: 'ord-uuid-101',
    status: 'NOT_CONFIRMED',
    items: [
      {
        id: 1,
        item_type: 'product',
        product: 3,
        product_name_ar: 'سجادة اختبار',
        product_name_en: 'Test Rug',
        unit_price: '1500.00',
        quantity: 1,
        color_name_ar: 'أحمر',
        color_hex_code: '#FF0000',
      },
      {
        id: 2,
        item_type: 'product',
        product: 4,
        product_name_ar: 'سجادة باقة بدون لون',
        product_name_en: 'Bundle Item Rug',
        unit_price: '2000.00',
        quantity: 1,
        color_name_ar: null,
        color_hex_code: null,
      },
    ],
  };

  // Cart contains items where one item has selectedColor and another item (e.g. bundle or custom) has undefined selectedColor
  const cart = [
    {
      id: 'cart-1',
      productId: '3',
      productName: 'سجادة اختبار',
      quantity: 1,
      selectedColor: { id: '2', name: 'أحمر', hex: '#FF0000' },
      selectedFinish: 'MATTE',
    },
    {
      id: 'cart-2',
      productId: '4',
      productName: 'سجادة باقة بدون لون',
      quantity: 1,
      selectedColor: undefined, // bundle or color-less item
      selectedFinish: 'GLOSSY',
    },
  ];

  // Must not throw TypeError: Cannot read properties of undefined (reading 'hex')
  const orderWithFinishes = buildOrderWithFinishes(createdOrder, cart);

  assert.equal(orderWithFinishes.id, 101);
  assert.equal(orderWithFinishes.items.length, 2);
  assert.equal(orderWithFinishes.items[0].selected_finish, 'MATTE');
  assert.equal(orderWithFinishes.items[1].selected_finish, 'GLOSSY');
});
