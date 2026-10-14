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
});
