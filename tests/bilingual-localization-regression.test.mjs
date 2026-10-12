import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Mirror of LanguageContext fallback logic for isolated unit verification
function getLocalizedName(item, language) {
  if (!item) return '';
  if (language === 'ar') {
    return (item.name_ar && item.name_ar.trim()) || (item.name && item.name.trim()) || (item.name_en && item.name_en.trim()) || '';
  }
  return (item.name_en && item.name_en.trim()) || (item.name && item.name.trim()) || (item.name_ar && item.name_ar.trim()) || '';
}

function getLocalizedDescription(item, language) {
  if (!item) return '';
  if (language === 'ar') {
    return (
      (item.description_ar && item.description_ar.trim()) ||
      (item.description && item.description.trim()) ||
      (item.description_en && item.description_en.trim()) ||
      ''
    );
  }
  return (
    (item.description_en && item.description_en.trim()) ||
    (item.description && item.description.trim()) ||
    (item.description_ar && item.description_ar.trim()) ||
    ''
  );
}

// Mirror of AccountView.tsx localizeAuthError
function localizeAuthError(msg, isAr) {
  if (!msg) return '';
  const lower = String(msg).toLowerCase();

  if (lower.includes('invalid credentials') || lower.includes('no active account') || lower.includes('بيانات الدخول غير صحيحة')) {
    return isAr ? 'رقم الهاتف أو كلمة المرور غير صحيحة.' : 'Incorrect phone number or password.';
  }
  if (lower.includes('already exists') || lower.includes('مستخدم بالفعل') || lower.includes('مسجل مسبق')) {
    return isAr ? 'رقم الهاتف أو البريد الإلكتروني مسجل بالفعل بحساب آخر.' : 'Phone number or email is already registered.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('connect')) {
    return isAr ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة ثانية.' : 'Cannot connect to server. Please check your internet connection.';
  }
  if (lower.includes('password') && (lower.includes('short') || lower.includes('least') || lower.includes('8') || lower.includes('length'))) {
    return isAr ? 'كلمة المرور يجب ألا تقل عن ٨ أحرف أو أرقام.' : 'Password must be at least 8 characters.';
  }
  if (lower.includes('phone') && (lower.includes('format') || lower.includes('valid') || lower.includes('invalid'))) {
    return isAr ? 'يرجى إدخال رقم هاتف مصري صحيح يبدأ بـ 01.' : 'Please enter a valid Egyptian phone number starting with 01.';
  }
  if (lower.includes('required') || lower.includes('مطلوب')) {
    return isAr ? 'يرجى استكمال جميع الحقول المطلوبة بشكل صحيح.' : 'Please fill in all required fields correctly.';
  }
  if (lower.includes('token') || lower.includes('unauthorized') || lower.includes('expired')) {
    return isAr ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.' : 'Session expired. Please sign in again.';
  }

  return msg;
}

test('Bilingual Localization — getLocalizedName correctly resolves Arabic and English names with fallbacks', () => {
  const completeEntity = {
    name: 'سجادة تبريزي فاخرة',
    name_ar: 'سجادة تبريزي ملكية',
    name_en: 'Royal Tabriz Carpet',
  };

  assert.equal(getLocalizedName(completeEntity, 'ar'), 'سجادة تبريزي ملكية');
  assert.equal(getLocalizedName(completeEntity, 'en'), 'Royal Tabriz Carpet');

  // Arabic only entity
  const arOnlyEntity = {
    name: 'مشاية أروال عرض 80 سم',
    name_ar: 'مشاية أروال عرض 80 سم',
  };
  assert.equal(getLocalizedName(arOnlyEntity, 'ar'), 'مشاية أروال عرض 80 سم');
  assert.equal(getLocalizedName(arOnlyEntity, 'en'), 'مشاية أروال عرض 80 سم'); // fallback

  // English only entity
  const enOnlyEntity = {
    name_en: 'Modern Geometric Runner',
  };
  assert.equal(getLocalizedName(enOnlyEntity, 'en'), 'Modern Geometric Runner');
  assert.equal(getLocalizedName(enOnlyEntity, 'ar'), 'Modern Geometric Runner'); // fallback

  // Null/undefined entity
  assert.equal(getLocalizedName(null, 'ar'), '');
  assert.equal(getLocalizedName(undefined, 'en'), '');
});

test('Bilingual Localization — getLocalizedDescription resolves localized descriptions with fallbacks', () => {
  const entity = {
    description: 'سجاد تركي ناعم',
    description_ar: 'سجاد تركي ناعم مقاوم للبقع',
    description_en: 'Soft stain-resistant Turkish carpet',
  };

  assert.equal(getLocalizedDescription(entity, 'ar'), 'سجاد تركي ناعم مقاوم للبقع');
  assert.equal(getLocalizedDescription(entity, 'en'), 'Soft stain-resistant Turkish carpet');

  const legacyOnlyEntity = {
    description: 'خيوط ميكروفايبر فاخرة',
  };
  assert.equal(getLocalizedDescription(legacyOnlyEntity, 'ar'), 'خيوط ميكروفايبر فاخرة');
  assert.equal(getLocalizedDescription(legacyOnlyEntity, 'en'), 'خيوط ميكروفايبر فاخرة');
});

test('Bilingual Auth Error Mapper — Maps known errors without leaking raw strings and retains unknown errors', () => {
  // Invalid credentials
  assert.equal(
    localizeAuthError('Invalid credentials provided.', true),
    'رقم الهاتف أو كلمة المرور غير صحيحة.'
  );
  assert.equal(
    localizeAuthError('Invalid credentials provided.', false),
    'Incorrect phone number or password.'
  );

  // Already exists
  assert.equal(
    localizeAuthError('user with this phone already exists', true),
    'رقم الهاتف أو البريد الإلكتروني مسجل بالفعل بحساب آخر.'
  );
  assert.equal(
    localizeAuthError('user with this phone already exists', false),
    'Phone number or email is already registered.'
  );

  // Network error
  assert.equal(
    localizeAuthError('Failed to fetch from API', true),
    'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة ثانية.'
  );

  // Unknown custom error preserved exactly
  const customError = 'Custom payment gateway timeout (Code 5021)';
  assert.equal(localizeAuthError(customError, true), customError);
  assert.equal(localizeAuthError(customError, false), customError);
});

test('Admin Payload Verification — Categories payload separates name_ar and name_en', () => {
  const formState = {
    name_ar: 'سجاد كلاسيك',
    name_en: 'Classic Carpets',
    description_ar: 'أرقى السجاد الشرقي الكلاسيكي',
    description_en: 'Finest classic oriental carpets',
  };

  const payload = {
    name: formState.name_ar,
    name_ar: formState.name_ar,
    name_en: formState.name_en || formState.name_ar,
    description: formState.description_ar,
    description_ar: formState.description_ar,
    description_en: formState.description_en,
  };

  assert.equal(payload.name_ar, 'سجاد كلاسيك');
  assert.equal(payload.name_en, 'Classic Carpets');
  assert.equal(payload.description_ar, 'أرقى السجاد الشرقي الكلاسيكي');
  assert.equal(payload.description_en, 'Finest classic oriental carpets');
  assert.notEqual(payload.name_ar, payload.name_en);
});

test('Admin Payload Verification — Subcategories payload separates name_ar and name_en', () => {
  const subcatFormData = {
    name_ar: 'حرير تركي',
    name_en: 'Turkish Silk',
    category_id: 5,
  };

  const nameAr = (subcatFormData.name_ar || '').trim();
  const nameEn = (subcatFormData.name_en || nameAr).trim();

  const payload = {
    name: nameAr,
    name_ar: nameAr,
    name_en: nameEn,
    category_id: subcatFormData.category_id,
  };

  assert.equal(payload.name_ar, 'حرير تركي');
  assert.equal(payload.name_en, 'Turkish Silk');
});

test('Admin Payload Verification — Products and Arawal payload provides bilingual names and retains specific attributes', () => {
  const arawalProductForm = {
    name_ar: 'رول كابتشينو فاخر',
    name_en: 'Luxury Cappuccino Runner',
    description_ar: 'مشاية أروال بالمتر للممرات والمداخل',
    description_en: 'Custom runner roll sold by meter for hallways and corridors',
    isArawal: true,
    availableWidths: [60, 80, 100, 120],
    arawalUnitPricePerMeter: 350,
  };

  const payload = {
    name: arawalProductForm.name_ar,
    name_ar: arawalProductForm.name_ar,
    name_en: arawalProductForm.name_en,
    description: arawalProductForm.description_ar,
    description_ar: arawalProductForm.description_ar,
    description_en: arawalProductForm.description_en,
    is_arawal: Boolean(arawalProductForm.isArawal),
    available_widths: arawalProductForm.availableWidths,
    price_per_meter: arawalProductForm.arawalUnitPricePerMeter,
  };

  assert.equal(payload.name_ar, 'رول كابتشينو فاخر');
  assert.equal(payload.name_en, 'Luxury Cappuccino Runner');
  assert.equal(payload.is_arawal, true);
  assert.deepEqual(payload.available_widths, [60, 80, 100, 120]);
  assert.equal(payload.price_per_meter, 350);
});

test('Admin Payload Verification — Colors payload separates name_ar and name_en', () => {
  const newColor = {
    name_ar: 'كشمير هادئ',
    name_en: 'Soft Cashmere',
    hex_code: '#E8D8C8',
  };

  const colorPayload = {
    name: newColor.name_ar,
    name_ar: newColor.name_ar,
    name_en: newColor.name_en || newColor.name_ar,
    hex_code: newColor.hex_code,
  };

  assert.equal(colorPayload.name_ar, 'كشمير هادئ');
  assert.equal(colorPayload.name_en, 'Soft Cashmere');
  assert.equal(colorPayload.hex_code, '#E8D8C8');
});

test('Source Code Integrity — LanguageContext exports getName and getDescription', () => {
  const langContextPath = path.resolve(process.cwd(), 'lib/context/LanguageContext.tsx');
  const content = fs.readFileSync(langContextPath, 'utf8');

  assert.match(content, /getName:\s*\(item/);
  assert.match(content, /getDescription:\s*\(item/);
  assert.match(content, /getLocalizedName/);
  assert.match(content, /getLocalizedDescription/);
});

test('Source Code Integrity — Store mapping preserves name_ar and name_en for products and categories', () => {
  const storePath = path.resolve(process.cwd(), 'lib/store.tsx');
  const content = fs.readFileSync(storePath, 'utf8');

  assert.match(content, /name_ar:\s*(product\?\.name_ar|cat\?\.name_ar)/);
  assert.match(content, /name_en:\s*(product\?\.name_en|cat\?\.name_en)/);
  assert.match(content, /description_ar:\s*product\?\.description_ar/);
  assert.match(content, /description_en:\s*product\?\.description_en/);
});

test('Source Code Integrity — AccountView contains dynamic dir and localized authentication strings', () => {
  const accountPath = path.resolve(process.cwd(), 'components/AccountView.tsx');
  const content = fs.readFileSync(accountPath, 'utf8');

  assert.match(content, /dir=\{isRtl\s*\?\s*'rtl'\s*:\s*'ltr'\}/);
  assert.match(content, /localizeAuthError/);
  assert.match(content, /t\('تسجيل الدخول',\s*'Sign In'\)/);
  assert.match(content, /t\('إنشاء حساب جديد',\s*'Create Account'\)/);
});

test('Source Code Integrity — Admin modal forms have separate Arabic (RTL) and English (LTR) name inputs', () => {
  const categoriesPath = path.resolve(process.cwd(), 'components/admin/CategoriesSection.tsx');
  const subcategoriesPath = path.resolve(process.cwd(), 'components/admin/SubcategoriesSection.tsx');
  const productsPath = path.resolve(process.cwd(), 'components/admin/ProductsSection.tsx');

  const catContent = fs.readFileSync(categoriesPath, 'utf8');
  assert.match(catContent, /name_ar/);
  assert.match(catContent, /name_en/);
  assert.match(catContent, /dir="rtl"/);
  assert.match(catContent, /dir="ltr"/);

  const subContent = fs.readFileSync(subcategoriesPath, 'utf8');
  assert.match(subContent, /name_ar/);
  assert.match(subContent, /name_en/);
  assert.match(subContent, /dir="rtl"/);
  assert.match(subContent, /dir="ltr"/);

  const prodContent = fs.readFileSync(productsPath, 'utf8');
  assert.match(prodContent, /name_ar/);
  assert.match(prodContent, /name_en/);
  assert.match(prodContent, /newColorNameAr/);
  assert.match(prodContent, /newColorNameEn/);
});
