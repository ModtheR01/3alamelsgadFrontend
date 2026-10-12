import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Registration Form — Email field is completely removed and not submitted', () => {
  const accountViewPath = path.resolve(process.cwd(), 'components/AccountView.tsx');
  const content = fs.readFileSync(accountViewPath, 'utf8');

  // Must not have regEmail state
  assert.doesNotMatch(content, /const\s*\[regEmail,\s*setRegEmail\]/);

  // Must not have email input field in registration JSX
  assert.doesNotMatch(content, /type="email"[\s\S]*?regEmail/);
  assert.doesNotMatch(content, /البريد الإلكتروني \(اختياري\)/);

  // Must not send email in register call
  assert.doesNotMatch(content, /register\(\s*\{[\s\S]*?email:\s*regEmail/);

  // Must keep first_name, last_name, phone, password
  assert.match(content, /first_name:\s*regFirstName/);
  assert.match(content, /last_name:\s*regLastName/);
  assert.match(content, /phone:\s*regPhone/);
  assert.match(content, /password:\s*regPassword/);
});

test('2. Product Creation Form — Stock and Featured checkboxes removed from form UI but preserved in payload', () => {
  const productsSectionPath = path.resolve(process.cwd(), 'components/admin/ProductsSection.tsx');
  const content = fs.readFileSync(productsSectionPath, 'utf8');

  // The checkboxes must NOT exist in the form UI
  assert.doesNotMatch(content, /<span>متوفر في المخزن للبيع الفوري<\/span>/);
  assert.doesNotMatch(content, /<span>تمييز المنتج في واجهة المتجر الرئيسية<\/span>/);

  // Default state initialization in handleOpenAdd and handleOpenEdit must still retain inStock and isFeatured
  assert.match(content, /inStock:\s*true/);
  assert.match(content, /isFeatured:\s*false/);

  // Submitting product form continues to pass editingProduct fields to onSaveProduct
  assert.match(content, /await\s*onSaveProduct\(\s*\{\s*\.\.\.editingProduct/);
});

test('3. Product Creation Form — Direct image URL input and button are removed', () => {
  const productsSectionPath = path.resolve(process.cwd(), 'components/admin/ProductsSection.tsx');
  const content = fs.readFileSync(productsSectionPath, 'utf8');

  // Must not contain the direct image URL placeholder or button
  assert.doesNotMatch(content, /placeholder="أو الصق رابط صورة مباشر\.\.\."/);

  // Must retain file upload workflow
  assert.match(content, /handleImageFileUpload/);
  assert.match(content, /إضافة صور من جهازك/);
  assert.match(content, /handleRemoveImage/);
  assert.match(content, /handleSetPrimaryImage/);
});

test('4. Dashboard Landing Page — Quick action buttons for categories, subcategories, and offers removed', () => {
  const overviewPath = path.resolve(process.cwd(), 'components/admin/OverviewSection.tsx');
  const content = fs.readFileSync(overviewPath, 'utf8');

  // Must NOT contain the 3 removed action buttons
  assert.doesNotMatch(content, /<span>إضافة تصنيف<\/span>/);
  assert.doesNotMatch(content, /<span>إضافة تصنيف فرعي<\/span>/);
  assert.doesNotMatch(content, /<span>إضافة عرض<\/span>/);

  // Must KEEP the 3 specified action buttons
  assert.match(content, /<span>إضافة منتج<\/span>/);
  assert.match(content, /<span>عرض الطلبات<\/span>/);
  assert.match(content, /<span>إدارة المستخدمين<\/span>/);
});

test('5. Category Creation Form — Visibility and Featured checkboxes removed from modal UI', () => {
  const categoriesPath = path.resolve(process.cwd(), 'components/admin/CategoriesSection.tsx');
  const content = fs.readFileSync(categoriesPath, 'utf8');

  // Must NOT contain the checkboxes in the modal form
  assert.doesNotMatch(content, /<span>ظاهر في المتجر<\/span>/);
  assert.doesNotMatch(content, /<span>تصنيف مميز في الصفحة الرئيسية<\/span>/);

  // State initialization must still preserve isVisible and isFeatured
  assert.match(content, /isVisible:\s*true/);
  assert.match(content, /isFeatured:\s*false/);
  assert.match(content, /await\s*onSaveCategory\(\s*\{\s*\.\.\.editingCategory/);
});

test('6. Offer Creation Form — Immediate activation checkbox removed from modal UI', () => {
  const offersPath = path.resolve(process.cwd(), 'components/admin/OffersSection.tsx');
  const content = fs.readFileSync(offersPath, 'utf8');

  // Must NOT contain the checkbox in the modal form
  assert.doesNotMatch(content, /تفعيل العرض فوراً في المتجر/);

  // State initialization must still set isActive properly
  assert.match(content, /setIsActive\(true\)/);
  assert.match(content, /setIsActive\(offer\.is_active\)/);
  assert.match(content, /is_active:\s*isActive/);
});
