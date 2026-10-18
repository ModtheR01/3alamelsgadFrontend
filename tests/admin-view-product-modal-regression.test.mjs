import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const viewProductModalPath = path.join(projectRoot, 'components', 'admin', 'ViewProductModal.tsx');
const productsSectionPath = path.join(projectRoot, 'components', 'admin', 'ProductsSection.tsx');

test('ViewProductModal — File existence and core imports', () => {
  assert.ok(fs.existsSync(viewProductModalPath), 'ViewProductModal.tsx must exist');
  const content = fs.readFileSync(viewProductModalPath, 'utf8');

  // Must import SafeImage and lucide icons
  assert.ok(content.includes('SafeImage'), 'ViewProductModal must use SafeImage for image handling');
  assert.ok(content.includes('productService'), 'ViewProductModal must import productService for detailed fresh fetch');
  assert.ok(content.includes('role="dialog"'), 'ViewProductModal must have accessible dialog role');
  assert.ok(content.includes('aria-modal="true"'), 'ViewProductModal must specify aria-modal="true"');
});

test('ViewProductModal — All sections and data fields verification', () => {
  const content = fs.readFileSync(viewProductModalPath, 'utf8');

  // Basic Information
  assert.ok(content.includes('المعلومات الأساسية والتصنيف'), 'Must have basic information section');
  assert.ok(content.includes('الاسم بالعربية'), 'Must display Arabic name label');
  assert.ok(content.includes('الاسم بالإنجليزية'), 'Must display English name label');
  assert.ok(content.includes('القسم الرئيسي'), 'Must display main category');
  assert.ok(content.includes('القسم الفرعي'), 'Must display subcategory');
  assert.ok(content.includes('حالة العرض والظهور'), 'Must display published/archived status');
  assert.ok(content.includes('حالة المخزون'), 'Must display stock availability');
  assert.ok(content.includes('تاريخ الإضافة'), 'Must display creation date');
  assert.ok(content.includes('آخر تعديل'), 'Must display last update date');

  // Images Gallery
  assert.ok(content.includes('معرض الصور'), 'Must have image gallery section');
  assert.ok(content.includes('selectedImageIndex'), 'Must support selecting active preview image');
  assert.ok(content.includes('رئيسية'), 'Must indicate primary image');
  assert.ok(content.includes('لا توجد صور مرفوعة لهذا المنتج'), 'Must gracefully handle empty images');

  // Pricing
  assert.ok(content.includes('التسعير والعروض'), 'Must have pricing section');
  assert.ok(content.includes('سعر البيع الحالي'), 'Must display current selling price');
  assert.ok(content.includes('السعر الأصلي قبل الخصم'), 'Must display original price');
  assert.ok(content.includes('نسبة الخصم / التوفير'), 'Must display discount percentage and savings');

  // Materials & Descriptive Attributes
  assert.ok(content.includes('الخامات والمواصفات الإضافية'), 'Must have materials and specs section');
  assert.ok(content.includes('الخامة:'), 'Must have material field');
  assert.ok(content.includes('مدة التوصيل والإنتاج'), 'Must have delivery/lead time field');
  assert.ok(content.includes('نوع التشطيب'), 'Must have finish type field');

  // Descriptions
  assert.ok(content.includes('الأوصاف والبيانات التعريفية'), 'Must have description section');
  assert.ok(content.includes('الوصف باللغة العربية'), 'Must have Arabic description');
  assert.ok(content.includes('الوصف باللغة الإنجليزية'), 'Must have English description');

  // Colors
  assert.ok(content.includes('الألوان المرتبطة بالمنتج'), 'Must have colors section');
  assert.ok(content.includes('backgroundColor: c.hex'), 'Must render visual color swatches with hex');

  // Sizes & Variants (Regular Carpet)
  assert.ok(content.includes('المقاسات المتوفرة'), 'Must have sizes section');

  // Arwal / Roll Specific Details
  assert.ok(content.includes('عروض الرول المتاحة وأسعار المتر المستقلة'), 'Must have Arwal widths and pricing section');
  assert.ok(content.includes('عرض الرول'), 'Must display roll width table header');
  assert.ok(content.includes('سعر المتر الطولي'), 'Must display linear meter price table header');
});

test('ViewProductModal — Elimination of fake data and presence of Arabic fallbacks', () => {
  const content = fs.readFileSync(viewProductModalPath, 'utf8');

  // Must not contain fake default material
  assert.ok(!content.includes("'صوف تركي فاخر'"), 'Must not have hardcoded fake material "صوف تركي فاخر"');
  assert.ok(!content.includes('"صوف تركي فاخر"'), 'Must not have hardcoded fake material "صوف تركي فاخر"');

  // Must have clear Arabic fallback "غير محدد"
  assert.ok(content.includes('غير محدد'), 'Must display "غير محدد" for unspecified fields');
});

test('ViewProductModal — Arwal vs Regular Carpet distinction', () => {
  const content = fs.readFileSync(viewProductModalPath, 'utf8');

  // Clear type badges
  assert.ok(content.includes('رول أروال (بالمتر)'), 'Must badge Arwal products');
  assert.ok(content.includes('سجاد بالقطعة'), 'Must badge standard carpet products');

  // Conditionals
  assert.ok(content.includes('isArwal'), 'Must check isArwal flag for conditional rendering');
  assert.ok(content.includes('arwalWidthsData'), 'Must render width-specific pricing for Arwal products');
});

test('ProductsSection — Integrates ViewProductModal cleanly', () => {
  const content = fs.readFileSync(productsSectionPath, 'utf8');

  // Import check
  assert.ok(content.includes("import ViewProductModal from './ViewProductModal'"), 'ProductsSection must import ViewProductModal');

  // Render check
  assert.ok(content.includes('<ViewProductModal'), 'ProductsSection must render ViewProductModal');
  assert.ok(content.includes('product={viewingProduct}'), 'Must pass viewingProduct to modal');
  assert.ok(content.includes('onClose={() => setViewingProduct(null)}'), 'Must handle onClose by resetting viewingProduct');

  // Modal replaces hardcoded view modal
  assert.ok(!content.includes("viewingProduct.material || 'صوف تركي فاخر'"), 'ProductsSection must no longer contain the old hardcoded view modal fallback');
});
