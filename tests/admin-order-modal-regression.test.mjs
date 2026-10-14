import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Mirroring the error normalization and formatOrderApiError logic for unit testing
function normalizeApiError(error, fallbackStatus) {
  const fieldErrors = {};
  let message = 'An unexpected error occurred. Please try again.';
  let status = fallbackStatus;

  if (!error) {
    return { message, fieldErrors, status };
  }

  if (error && typeof error === 'object' && error.name === 'ApiError') {
    return {
      message: error.message,
      fieldErrors: error.fieldErrors || {},
      status: error.status,
      raw: error.raw,
    };
  }

  if (error instanceof Error) {
    message = error.message;
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      message = 'The request timed out. Please check your connection.';
      status = 408;
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      message = 'Network error. Please ensure the backend server is reachable.';
      status = 0;
    }
  }

  if (typeof error === 'string') {
    return { message: error.trim(), fieldErrors, status, raw: error };
  }

  if (typeof error === 'object' && error !== null) {
    const errObj = error;
    if (errObj.status && typeof errObj.status === 'number') {
      status = errObj.status;
    }
    if (typeof errObj.detail === 'string') {
      message = errObj.detail;
      fieldErrors['detail'] = [errObj.detail];
    } else if (Array.isArray(errObj.detail) && errObj.detail.length > 0) {
      message = String(errObj.detail[0]);
      fieldErrors['detail'] = errObj.detail.map(String);
    }
    if (typeof errObj.message === 'string') {
      message = errObj.message;
      fieldErrors['message'] = [errObj.message];
    }
    if (typeof errObj.error === 'string') {
      message = errObj.error;
      fieldErrors['error'] = [errObj.error];
    }
    if (Array.isArray(errObj.non_field_errors) && errObj.non_field_errors.length > 0) {
      message = String(errObj.non_field_errors[0]);
      fieldErrors['non_field_errors'] = errObj.non_field_errors.map(String);
    }

    for (const [key, value] of Object.entries(errObj)) {
      if (['detail', 'message', 'error', 'status', 'statusCode', 'non_field_errors'].includes(key)) {
        continue;
      }
      if (Array.isArray(value)) {
        fieldErrors[key] = value.map(String);
        if (message === 'An unexpected error occurred. Please try again.' && value.length > 0) {
          message = `${key}: ${value[0]}`;
        }
      } else if (typeof value === 'string') {
        fieldErrors[key] = [value];
        if (message === 'An unexpected error occurred. Please try again.') {
          message = `${key}: ${value}`;
        }
      }
    }
  }

  return { message, fieldErrors, status, raw: error };
}

function formatOrderApiError(
  err,
  fallback = 'تعذر تنفيذ الإجراء المطلوب على هذا الطلب. يرجى إعادة المحاولة.'
) {
  if (!err) return fallback;

  const normalized = normalizeApiError(err);
  const status = normalized.status;
  const msg = (normalized.message || '').trim();

  // 1. If backend already returned an Arabic message, use it directly (excluding default English errors)
  if (/[\u0600-\u06FF]/.test(msg) && !msg.includes('An unexpected error')) {
    return msg;
  }

  // 2. HTTP Status Code specific Arabic mappings
  if (status === 401) {
    return 'انتهت جلستك أو أنك غير مسجل الدخول كمسؤول. يرجى تسجيل الدخول مجدداً.';
  }
  if (status === 403) {
    return 'ليس لديك الصلاحيات الكافية لتعديل حالة هذا الطلب.';
  }
  if (status === 404) {
    return 'لم يتم العثور على هذا الطلب في قاعدة البيانات، قد يكون قد حُذف.';
  }
  if (status === 409) {
    return 'تعارض في حالة الطلب، ربما تم تحديثه من قِبل مسؤول آخر في نفس الوقت. يرجى تحديث القائمة.';
  }
  if (status === 429) {
    return 'تم إرسال طلبات متعددة خلال وقت قصير جداً. يرجى الانتظار بضع ثوانٍ ثم المحاولة.';
  }
  if (status && status >= 500) {
    return 'حدث خطأ غير متوقع في خادم المتجر (500). يرجى المحاولة مرة أخرى لاحقاً.';
  }
  if (
    status === 0 ||
    msg.toLowerCase().includes('network') ||
    msg.toLowerCase().includes('failed to fetch')
  ) {
    return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.';
  }
  if (
    status === 408 ||
    msg.toLowerCase().includes('timeout') ||
    msg.toLowerCase().includes('timed out') ||
    msg.toLowerCase().includes('aborted')
  ) {
    return 'استغرقت الاستجابة وقتاً أطول من المعتاد وتجاوزت المهلة. يرجى إعادة المحاولة.';
  }

  // 3. Check DRF fieldErrors if available
  if (normalized.fieldErrors && Object.keys(normalized.fieldErrors).length > 0) {
    for (const [field, errors] of Object.entries(normalized.fieldErrors)) {
      if (['message', 'detail', 'error', 'non_field_errors'].includes(field)) {
        continue;
      }
      const firstErr = errors[0] || '';
      if (/[\u0600-\u06FF]/.test(firstErr)) {
        return firstErr;
      }
      const lowerErr = firstErr.toLowerCase();
      if (lowerErr.includes('not a valid choice') || lowerErr.includes('invalid choice')) {
        return 'حالة الطلب المحددة غير صالحة للنظام.';
      }
      if (lowerErr.includes('payment') || lowerErr.includes('paid')) {
        return 'لا يمكن تغيير حالة الطلب قبل تأكيد استلام الدفع أولاً.';
      }
      if (lowerErr.includes('transition') || lowerErr.includes('cannot transition')) {
        return 'لا يمكن الانتقال إلى هذه الحالة من الحالة الحالية للطلب.';
      }
      if (lowerErr.includes('required')) {
        return `الحقل المطلوب غير مكتمل (${field}).`;
      }
    }
  }

  // 4. Common DRF English business logic phrases
  const lowerMsg = msg.toLowerCase();
  if (
    lowerMsg.includes('payment must be paid') ||
    (lowerMsg.includes('payment') && lowerMsg.includes('paid'))
  ) {
    return 'لا يمكن تغيير حالة الطلب قبل تأكيد استلام الدفع أولاً.';
  }
  if (lowerMsg.includes('invalid transition') || lowerMsg.includes('cannot transition')) {
    return 'لا يمكن الانتقال إلى هذه الحالة من الحالة الحالية للطلب.';
  }
  if (lowerMsg.includes('is not a valid choice')) {
    return 'حالة الطلب المحددة غير معتمدة في النظام.';
  }

  if (status === 400) {
    return 'تعذر تنفيذ العملية بسبب عدم مطابقة بيانات الطلب أو شروط الحالة الحالية.';
  }

  // 5. Clean string message if non-technical
  if (
    msg &&
    !msg.includes('An unexpected error') &&
    !msg.includes('at ') &&
    !msg.includes('TypeError') &&
    !msg.includes('{')
  ) {
    return msg;
  }

  return fallback;
}

test('Admin Order Modal — Error Normalizer & Arabic Translation Architecture', async (t) => {
  await t.test('1. Backend custom Arabic error messages are preserved verbatim', () => {
    const errorObj = {
      status: 400,
      detail: 'لا يمكن إلغاء الطلب بعد خروجه مع مندوب الشحن.',
    };
    const translated = formatOrderApiError(errorObj);
    assert.equal(translated, 'لا يمكن إلغاء الطلب بعد خروجه مع مندوب الشحن.');
  });

  await t.test('2. Translates DRF strict state machine payment requirement into Arabic', () => {
    const errorObj = {
      status: 400,
      detail: 'Payment must be PAID before transitioning beyond NOT_CONFIRMED.',
    };
    const translated = formatOrderApiError(errorObj);
    assert.equal(translated, 'لا يمكن تغيير حالة الطلب قبل تأكيد استلام الدفع أولاً.');
  });

  await t.test('3. Translates invalid transition error into Arabic', () => {
    const errorObj = {
      status: 400,
      non_field_errors: ['Cannot transition order from DELIVERED to CANCELLED.'],
    };
    const translated = formatOrderApiError(errorObj);
    assert.equal(translated, 'لا يمكن الانتقال إلى هذه الحالة من الحالة الحالية للطلب.');
  });

  await t.test('4. Translates invalid choice validation error into Arabic', () => {
    const errorObj = {
      status: 400,
      status_errors: ['"INVALID_STATE" is not a valid choice.'],
    };
    const translated = formatOrderApiError(errorObj);
    assert.equal(translated, 'حالة الطلب المحددة غير صالحة للنظام.');
  });

  await t.test('5. Translates HTTP 401 Unauthorized / session expired into Arabic', () => {
    const errorObj = { status: 401, detail: 'Authentication credentials were not provided.' };
    const translated = formatOrderApiError(errorObj);
    assert.equal(translated, 'انتهت جلستك أو أنك غير مسجل الدخول كمسؤول. يرجى تسجيل الدخول مجدداً.');
  });

  await t.test('6. Translates HTTP 403 Forbidden / insufficient permissions into Arabic', () => {
    const errorObj = { status: 403, detail: 'You do not have permission to perform this action.' };
    const translated = formatOrderApiError(errorObj);
    assert.equal(translated, 'ليس لديك الصلاحيات الكافية لتعديل حالة هذا الطلب.');
  });

  await t.test('7. Translates HTTP 404 Not Found into Arabic', () => {
    const errorObj = { status: 404, detail: 'Not found.' };
    const translated = formatOrderApiError(errorObj);
    assert.equal(translated, 'لم يتم العثور على هذا الطلب في قاعدة البيانات، قد يكون قد حُذف.');
  });

  await t.test('8. Translates HTTP 409 Conflict into Arabic', () => {
    const errorObj = { status: 409, detail: 'Conflict.' };
    const translated = formatOrderApiError(errorObj);
    assert.equal(
      translated,
      'تعارض في حالة الطلب، ربما تم تحديثه من قِبل مسؤول آخر في نفس الوقت. يرجى تحديث القائمة.'
    );
  });

  await t.test('9. Translates HTTP 429 Rate Limit into Arabic', () => {
    const errorObj = { status: 429, detail: 'Too many requests.' };
    const translated = formatOrderApiError(errorObj);
    assert.equal(
      translated,
      'تم إرسال طلبات متعددة خلال وقت قصير جداً. يرجى الانتظار بضع ثوانٍ ثم المحاولة.'
    );
  });

  await t.test('10. Translates HTTP 500+ Internal Server Error into Arabic', () => {
    const errorObj = { status: 500, detail: 'Internal Server Error' };
    const translated = formatOrderApiError(errorObj);
    assert.equal(translated, 'حدث خطأ غير متوقع في خادم المتجر (500). يرجى المحاولة مرة أخرى لاحقاً.');
  });

  await t.test('11. Translates Network error / connection loss into Arabic', () => {
    const netErr = new Error('Failed to fetch from server');
    const translated = formatOrderApiError(netErr);
    assert.equal(translated, 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.');
  });

  await t.test('12. Translates Timeout error into Arabic', () => {
    const timeoutErr = new Error('The request timed out. Please check your connection.');
    const translated = formatOrderApiError(timeoutErr);
    assert.equal(
      translated,
      'استغرقت الاستجابة وقتاً أطول من المعتاد وتجاوزت المهلة. يرجى إعادة المحاولة.'
    );
  });

  await t.test('13. Sanitizes technical stack traces and raw JSON', () => {
    const rawTrace = new Error('TypeError: Cannot read properties of undefined at Object.<anonymous>');
    const translated = formatOrderApiError(rawTrace);
    // Should fallback to safe Arabic message instead of leaking TypeError
    assert.ok(!translated.includes('TypeError'));
    assert.ok(!translated.includes('Cannot read properties'));
    assert.equal(translated, 'تعذر تنفيذ الإجراء المطلوب على هذا الطلب. يرجى إعادة المحاولة.');
  });
});

test('Admin Order Modal — Component Structure, Scrolling & Responsiveness Verification', () => {
  const filePath = path.join(process.cwd(), 'components/admin/OrdersSection.tsx');
  assert.ok(fs.existsSync(filePath), 'OrdersSection.tsx must exist');
  const content = fs.readFileSync(filePath, 'utf-8');

  // 1. Dynamic Viewport Height & Responsive Modal Container
  assert.ok(
    content.includes('max-h-[calc(100dvh-1.5rem)]') || content.includes('max-h-[calc(100dvh-2.5rem)]'),
    'Modal dialog box must have dynamic viewport height constraint (100dvh)'
  );
  assert.ok(
    content.includes('flex flex-col'),
    'Modal dialog box must use flex flex-col to structure fixed header, alerts, body, and footer'
  );

  // 2. Fixed Header (shrink-0)
  assert.ok(
    content.includes('shrink-0 p-4 sm:p-5 border-b border-[#EAE3D8]'),
    'Modal header must be non-scrolling (shrink-0) and pinned to top'
  );

  // 3. Prominent In-Modal Alert Area (Never hidden behind modal)
  assert.ok(
    content.includes('modalActionSuccess') && content.includes('modalActionError'),
    'OrdersSection must maintain dedicated in-modal error and success feedback states'
  );
  assert.ok(
    content.includes('aria-label="إغلاق رسالة الخطأ"') && content.includes('aria-label="إغلاق رسالة النجاح"'),
    'Modal alerts must have dismiss buttons to avoid abrupt auto-clear'
  );

  // 4. Scrollable Body with min-h-0 and overscroll-contain
  assert.ok(
    content.includes('flex-1 min-h-0 overflow-y-auto') && content.includes('overscroll-contain'),
    'Modal body must have flex-1 min-h-0 overflow-y-auto overscroll-contain for independent vertical scrolling'
  );

  // 5. Responsive table wrapper
  assert.ok(
    content.includes('overflow-x-auto') && content.includes('min-w-[500px]'),
    'Ordered products table must be wrapped in overflow-x-auto for narrow mobile screens'
  );

  // 6. Fixed Footer (shrink-0)
  assert.ok(
    content.includes('shrink-0 p-3.5 sm:p-4 px-4 sm:px-6 border-t border-[#EAE3D8]'),
    'Modal footer must be non-scrolling (shrink-0) and pinned to bottom'
  );

  // 7. Loading states on buttons
  assert.ok(
    content.includes('animate-spin') && content.includes('جاري التحديث...'),
    'Status workflow buttons must render loading spinner and Arabic loading indicator'
  );
  assert.ok(
    content.includes('جاري تأكيد استلام الدفع...'),
    'Payment confirmation button must render loading spinner and Arabic loading indicator'
  );

  // 8. Background scroll lock & Escape key handling
  assert.ok(
    content.includes("document.body.style.overflow = 'hidden'"),
    'Background page scrolling must be locked while modal is open'
  );
  assert.ok(
    content.includes("e.key === 'Escape'"),
    'Modal must support closing on Escape key press'
  );

  // 9. Accessibility attributes
  assert.ok(content.includes('role="dialog"'), 'Modal must have role="dialog"');
  assert.ok(content.includes('aria-modal="true"'), 'Modal must have aria-modal="true"');
  assert.ok(content.includes('aria-labelledby="order-details-title"'), 'Modal must have aria-labelledby');

  // 10. Ordered Items Table resolves real backend fields
  assert.ok(
    content.includes('getOrderItemTitle') && content.includes('getOrderItemColor') && content.includes('getOrderItemSpecs'),
    'OrdersSection must use resolution helpers for title, color, and specs'
  );
  assert.ok(
    content.includes('product_name_ar') && content.includes('arwal_name_ar'),
    'OrdersSection must support DRF product_name_ar and arwal_name_ar'
  );
  assert.ok(
    content.includes('color_name_ar') && content.includes('color_hex_code'),
    'OrdersSection must support DRF color_name_ar and color_hex_code'
  );
  assert.ok(
    content.includes('size_width') && content.includes('size_length'),
    'OrdersSection must support DRF carpet dimensions (size_width x size_length)'
  );
  assert.ok(
    content.includes('selectedOrderForModal.bundles'),
    'OrdersSection must support rendering promotional bundle offer items'
  );
  assert.ok(
    content.includes('غير متوفر'),
    'OrdersSection must render fallback text instead of leaving specs/color blank'
  );
});

// Helper mirror for getOrderItemTitle
function getOrderItemTitle(item) {
  if (!item) return 'منتج غير محدد';
  if (item.item_type === 'arwal') {
    return (
      item.arwal_name_ar ||
      item.arwal_name_en ||
      item.name_ar ||
      item.name_en ||
      (typeof item.arwal === 'object' &&
        (item.arwal?.name_ar || item.arwal?.name_en || item.arwal?.name)) ||
      'رول سجاد بالمتر'
    );
  }
  return (
    item.product_name_ar ||
    item.product_name_en ||
    item.product_name ||
    item.name_ar ||
    item.name_en ||
    item.name ||
    (typeof item.product === 'object' &&
      (item.product?.name_ar || item.product?.name_en || item.product?.name)) ||
    item.arwal_name_ar ||
    item.arwal_name_en ||
    'سجادة فاخرة'
  );
}

// Helper mirror for getOrderItemColor
function getOrderItemColor(item) {
  if (!item) return { name: null, hex: null };
  const name =
    item.color_name_ar ||
    item.color_name_en ||
    item.color_name ||
    item.selected_color_name ||
    (typeof item.selected_color === 'object' &&
      (item.selected_color?.name_ar ||
        item.selected_color?.name_en ||
        item.selected_color?.name)) ||
    (typeof item.color === 'object' &&
      (item.color?.name_ar || item.color?.name_en || item.color?.name)) ||
    null;
  const hex =
    item.color_hex_code ||
    item.color_hex ||
    (typeof item.selected_color === 'object' && item.selected_color?.hex) ||
    (typeof item.color === 'object' && item.color?.hex) ||
    null;
  return { name, hex };
}

// Helper mirror for getOrderItemSpecs
function getOrderItemSpecs(item) {
  if (!item) return null;
  if (item.item_type === 'arwal' || item.length || item.price_per_length) {
    const parts = [];
    if (item.width) {
      parts.push(`عرض ${item.width} سم`);
    }
    if (item.length) {
      parts.push(`طول ${item.length} م`);
    }
    return parts.length > 0 ? parts.join(' × ') : 'رول بالمتر';
  }
  if (item.size_width && item.size_length) {
    let spec = `${item.size_width} × ${item.size_length} سم`;
    if (item.selected_finish) {
      spec += ` (${item.selected_finish === 'GLOSSY' ? 'لامع' : 'مطفي'})`;
    }
    return spec;
  }
  if (item.selected_size_name) {
    return item.selected_size_name;
  }
  return null;
}

test('Admin Order Modal — Order Items & Specifications Contract Resolution', async (t) => {
  await t.test('1. Resolves standard carpet product title from DRF product_name_ar snapshot', () => {
    const item = {
      id: 101,
      item_type: 'product',
      product: 42,
      product_name_ar: 'سجادة تبريز كلاسيك فاخرة',
      product_name_en: 'Tabriz Classic Luxury Carpet',
      unit_price: '9000.00',
      quantity: 1,
      subtotal: '9000.00',
    };
    assert.equal(getOrderItemTitle(item), 'سجادة تبريز كلاسيك فاخرة');
  });

  await t.test('2. Resolves Arwal runner roll title from DRF arwal_name_ar snapshot', () => {
    const item = {
      id: 102,
      item_type: 'arwal',
      arwal: 15,
      arwal_name_ar: 'رول كيدز تركي مشجر بالمتر',
      arwal_name_en: 'Kids Turkish Runner by Meter',
      price_per_length: '850.00',
      quantity: 2,
      subtotal: '1700.00',
    };
    assert.equal(getOrderItemTitle(item), 'رول كيدز تركي مشجر بالمتر');
  });

  await t.test('3. Resolves color name and hex code from DRF color_name_ar and color_hex_code', () => {
    const item = {
      color_name_ar: 'بيج وكريمي هادئ',
      color_name_en: 'Beige & Soft Cream',
      color_hex_code: '#EBE3D5',
    };
    const color = getOrderItemColor(item);
    assert.equal(color.name, 'بيج وكريمي هادئ');
    assert.equal(color.hex, '#EBE3D5');
  });

  await t.test('4. Resolves carpet size dimensions from DRF size_width and size_length', () => {
    const item = {
      size_width: 200,
      size_length: 300,
      selected_finish: 'GLOSSY',
    };
    assert.equal(getOrderItemSpecs(item), '200 × 300 سم (لامع)');
  });

  await t.test('5. Resolves Arwal runner width and length dimensions', () => {
    const item = {
      item_type: 'arwal',
      width: 100,
      length: '4.50',
    };
    assert.equal(getOrderItemSpecs(item), 'عرض 100 سم × طول 4.50 م');
  });

  await t.test('6. Fallback handling when color or specifications are missing', () => {
    const bareItem = {
      id: 103,
      product_name_ar: 'سجادة عادية بدون مواصفات إضافية',
    };
    const color = getOrderItemColor(bareItem);
    const specs = getOrderItemSpecs(bareItem);
    assert.equal(color.name, null);
    assert.equal(color.hex, null);
    assert.equal(specs, null);
  });

  await t.test('7. Fallback handling when product has been deleted or unlinked', () => {
    const deletedProductItem = {
      id: 104,
      product: null,
      product_name_ar: 'سجادة تم حذفها من الكتالوج لاحقاً',
      color_name_ar: 'أحمر قاني',
      color_hex_code: '#8B0000',
      size_width: 160,
      size_length: 220,
    };
    assert.equal(getOrderItemTitle(deletedProductItem), 'سجادة تم حذفها من الكتالوج لاحقاً');
    assert.equal(getOrderItemColor(deletedProductItem).name, 'أحمر قاني');
    assert.equal(getOrderItemSpecs(deletedProductItem), '160 × 220 سم');
  });
});
