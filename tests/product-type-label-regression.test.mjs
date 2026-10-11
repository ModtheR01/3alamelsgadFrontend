import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Pure logic mirror and verification of getProductTypeLabel
function getProductTypeLabel(product, subcategories = []) {
  if (!product) return 'سجاد بالقطعة';
  if (product.isArawal) {
    return 'رول أروال بالمتر';
  }
  const subcatNameFromProduct = product.subcategory?.name_ar || product.subcategory?.name;
  if (subcatNameFromProduct) {
    return subcatNameFromProduct;
  }
  const subcatId = product.subcategoryIds?.[0] ?? product.subcategory?.id;
  if (subcatId !== undefined && subcatId !== null && subcatId !== '') {
    const matched = subcategories.find((s) => String(s.id) === String(subcatId));
    const name = matched?.name_ar || matched?.name;
    if (name) {
      return name;
    }
  }
  return 'سجاد بالقطعة';
}

test('Product Type Label — Returns "رول أروال بالمتر" for Arwal runner rolls', () => {
  const arwalProduct = {
    id: 'p-arwal-1',
    isArawal: true,
    subcategoryIds: ['10'],
    dimensions: '',
    availableWidths: [80, 100],
  };

  const subcategories = [
    { id: 10, name_ar: 'أروال ومشايات', name_en: 'Arwal & Runners' },
  ];

  const label = getProductTypeLabel(arwalProduct, subcategories);
  assert.equal(label, 'رول أروال بالمتر');
  assert.notEqual(label, 'سجاد عادي');
});

test('Product Type Label — Resolves actual Arabic subcategory name for standard carpet products', () => {
  const luxurySilkProduct = {
    id: 'p-silk-1',
    isArawal: false,
    subcategoryIds: ['101'],
    dimensions: '200x300 سم',
  };

  const modernTurkishProduct = {
    id: 'p-turk-2',
    isArawal: false,
    subcategoryIds: [202],
    dimensions: '160x230 سم',
  };

  const subcategories = [
    { id: 101, name_ar: 'حرير البامبو الفاخر', name_en: 'Luxury Bamboo Silk' },
    { id: 202, name_ar: 'سجاد تركي مودرن', name_en: 'Modern Turkish Carpets' },
  ];

  const silkLabel = getProductTypeLabel(luxurySilkProduct, subcategories);
  assert.equal(silkLabel, 'حرير البامبو الفاخر');
  assert.notEqual(silkLabel, 'سجاد عادي');

  const turkLabel = getProductTypeLabel(modernTurkishProduct, subcategories);
  assert.equal(turkLabel, 'سجاد تركي مودرن');
  assert.notEqual(turkLabel, 'سجاد عادي');
});

test('Product Type Label — Uses direct product.subcategory relation if embedded from DRF representation', () => {
  const productWithDirectSubcat = {
    id: 'p-drf-1',
    isArawal: false,
    subcategory: {
      id: 55,
      name_ar: 'سجاد شرقي كلاسيك',
      name_en: 'Classic Oriental Rugs',
    },
  };

  const label = getProductTypeLabel(productWithDirectSubcat, []);
  assert.equal(label, 'سجاد شرقي كلاسيك');
  assert.notEqual(label, 'سجاد عادي');
});

test('Product Type Label — Returns "سجاد بالقطعة" (never "سجاد عادي") when subcategory is missing or unlinked', () => {
  const unlinkedProduct = {
    id: 'p-orphan-1',
    isArawal: false,
    subcategoryIds: [],
  };

  const unknownSubcatProduct = {
    id: 'p-unknown-2',
    isArawal: false,
    subcategoryIds: ['999999'],
  };

  assert.equal(getProductTypeLabel(unlinkedProduct, []), 'سجاد بالقطعة');
  assert.notEqual(getProductTypeLabel(unlinkedProduct, []), 'سجاد عادي');

  assert.equal(getProductTypeLabel(unknownSubcatProduct, []), 'سجاد بالقطعة');
  assert.notEqual(getProductTypeLabel(unknownSubcatProduct, []), 'سجاد عادي');

  assert.equal(getProductTypeLabel(null, []), 'سجاد بالقطعة');
  assert.equal(getProductTypeLabel(undefined, []), 'سجاد بالقطعة');
});

test('Product Section Codebase Inspection — "سجاد عادي" is completely eliminated from ProductsSection.tsx', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/ProductsSection.tsx');
  const fileContent = fs.readFileSync(componentPath, 'utf-8');

  // Must not have any occurrence of the incorrect hardcoded label
  assert.ok(!fileContent.includes('سجاد عادي'), 'ProductsSection.tsx must not contain "سجاد عادي" anywhere');

  // Must contain the corrected piece carpet label and getProductTypeLabel
  assert.ok(fileContent.includes('سجاد بالقطعة'), 'ProductsSection.tsx must include "سجاد بالقطعة"');
  assert.ok(fileContent.includes('getProductTypeLabel'), 'ProductsSection.tsx must utilize getProductTypeLabel');

  // Must not contain fake mock fallbacks for dimensions or widths
  assert.ok(!fileContent.includes("|| '200x300 سم'"), 'ProductsSection.tsx must not contain fake mock dimensions fallback "200x300 سم"');
  assert.ok(!fileContent.includes("|| '60, 80, 100, 120'"), 'ProductsSection.tsx must not contain fake mock widths fallback "60, 80, 100, 120"');
});
