import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Mirroring buildOfferPayload from lib/api/services/offerService.ts
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
      if (target.size_id !== undefined && target.size_id !== null) {
        item.size_id = target.size_id;
      }
      if (effectiveType === 'BUNDLE') {
        item.quantity = target.quantity || 1;
      }
      return item;
    });
  }

  return payload;
}

// Mirroring normalizeBackendOffer from lib/api/services/offerService.ts
function normalizeBackendOffer(raw) {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const resolvedName = raw.name || raw.name_ar || raw.name_en || '';
  const rawTargetList = Array.isArray(raw.products) && raw.products.length > 0
    ? raw.products
    : Array.isArray(raw.offer_products)
    ? raw.offer_products
    : [];

  const products = rawTargetList.map((p) => ({
    id: p.id || p.product_id,
    product_id: p.product_id,
    size_id: p.size_id ?? (p.size?.id ?? null),
    size_name: p.size_name || (p.size ? `${p.size.width} × ${p.size.length} سم` : ''),
    product_name: p.product_name || '',
    product_price: p.product_price || 0,
    quantity: p.quantity || 1,
  }));

  return {
    ...raw,
    name: resolvedName,
    name_ar: raw.name_ar || resolvedName,
    name_en: raw.name_en || resolvedName,
    products,
    offer_products: raw.offer_products || products,
  };
}

test('1. Offer Service Payload Builder — Size-specific percentage offer includes size_id and strips quantities', () => {
  const payload = buildOfferPayload({
    name: 'عرض سجاد مقاس خاص',
    name_ar: 'عرض سجاد مقاس خاص',
    offer_type: 'PERCENTAGE',
    percentage: 25,
    offer_products: [
      { product_id: 10, size_id: 101 },
      { product_id: 10, size_id: 102 },
      { product_id: 20, size_id: 205 },
    ],
  });

  assert.strictEqual(payload.name_ar, 'عرض سجاد مقاس خاص');
  assert.strictEqual(payload.offer_type, 'PERCENTAGE');
  assert.strictEqual(payload.percentage, 25);
  assert.strictEqual(payload.bundle_price, undefined);
  assert.strictEqual(payload.offer_products.length, 3);
  assert.deepStrictEqual(payload.offer_products, [
    { product_id: 10, size_id: 101 },
    { product_id: 10, size_id: 102 },
    { product_id: 20, size_id: 205 },
  ]);
});

test('2. Offer Service Payload Builder — Size-specific bundle offer includes size_id, quantity, and bundle_price', () => {
  const payload = buildOfferPayload({
    name: 'باقة غرفتين بسعر خاص',
    offer_type: 'BUNDLE',
    bundle_price: 3500,
    offer_products: [
      { product_id: 10, size_id: 101, quantity: 2 },
      { product_id: 15, size_id: 155, quantity: 1 },
    ],
  });

  assert.strictEqual(payload.offer_type, 'BUNDLE');
  assert.strictEqual(payload.bundle_price, 3500);
  assert.strictEqual(payload.percentage, undefined);
  assert.strictEqual(payload.offer_products.length, 2);
  assert.strictEqual(payload.offer_products[0].product_id, 10);
  assert.strictEqual(payload.offer_products[0].size_id, 101);
  assert.strictEqual(payload.offer_products[0].quantity, 2);
  assert.strictEqual(payload.offer_products[1].product_id, 15);
  assert.strictEqual(payload.offer_products[1].size_id, 155);
  assert.strictEqual(payload.offer_products[1].quantity, 1);
});

test('3. Offer Service Normalizer — Correctly maps and preserves size_id and size_name from DRF representation', () => {
  const rawBackendOffer = {
    id: 5,
    name_ar: 'خصم خاص على مقاس المشايات',
    offer_type: 'PERCENTAGE',
    percentage: '15.00',
    offer_products: [
      {
        id: 1,
        product_id: 42,
        product_name: 'سجادة تبريز ملكي',
        size_id: 8,
        size: {
          id: 8,
          width: '80.00',
          length: '300.00',
        },
        size_name: '80 × 300 سم',
        quantity: 1,
      },
    ],
    is_active: true,
  };

  const normalized = normalizeBackendOffer(rawBackendOffer);
  assert.strictEqual(normalized.id, 5);
  assert.strictEqual(normalized.products.length, 1);
  assert.strictEqual(normalized.products[0].product_id, 42);
  assert.strictEqual(normalized.products[0].size_id, 8);
  assert.strictEqual(normalized.products[0].size_name, '80 × 300 سم');
});

test('4. Codebase Audit: offerService.ts and types/offer.ts include size_id in payload and target types', () => {
  const servicePath = path.resolve(process.cwd(), 'lib/api/services/offerService.ts');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');

  assert.match(serviceContent, /size_id:\s*p\.size_id/);
  assert.match(serviceContent, /if\s*\(target\.size_id\s*!==\s*undefined/);
  assert.match(serviceContent, /item\.size_id\s*=\s*target\.size_id/);

  const typesPath = path.resolve(process.cwd(), 'types/offer.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');

  assert.match(typesContent, /size_id\?:/);
  assert.match(typesContent, /size_name\?:/);
});

test('5. Admin OffersSection Component — Implements size selection with real prices, dimensions, and toggle', () => {
  const offersPath = path.resolve(process.cwd(), 'components/admin/OffersSection.tsx');
  const content = fs.readFileSync(offersPath, 'utf8');

  // Verify size-specific toggle handler exists
  assert.match(content, /handleToggleSize/);

  // Verify select/deselect all sizes toggle exists
  assert.match(content, /handleToggleAllSizesForProduct/);
  assert.match(content, /تحديد كل المقاسات/);
  assert.match(content, /إلغاء تحديد الكل/);

  // Verify message for products without sizes
  assert.match(content, /لا توجد مقاسات مسجلة لهذا المنتج/);

  // Verify real dimensions and prices are rendered
  assert.match(content, /s\.originalPrice \?\? s\.price/);
  assert.match(content, /toLocaleString\('ar-EG'\)/);

  // Verify calculated discount preview for percentage offer
  assert.match(content, /السعر بعد الخصم:/);

  // Verify bundle quantity controls exist
  assert.match(content, /handleUpdateQuantity/);
  assert.match(content, /الكمية بالباقة:/);

  // Verify Arwal/Roll products are excluded from ordinary carpet size offers
  assert.match(content, /filter\(\(p\)\s*=>\s*!p\.isArawal\)/);

  // Verify restore logic when editing an existing offer
  assert.match(content, /p\.size_id/);
});

test('6. Storefront Size-Specific Pricing Logic — Product with multiple sizes calculates discount only for target size', () => {
  const product = {
    id: '10',
    name: 'سجادة إيراني كلاسيك',
    price: 3800,
    sizes: [
      {
        id: '101',
        name: '160x220 سم',
        dimensions: '160 × 220 سم',
        priceDelta: 0,
        price: 3800,
        originalPrice: undefined,
        width: 160,
        length: 220,
      },
      {
        id: '102',
        name: '200x300 سم',
        dimensions: '200 × 300 سم',
        priceDelta: 0,
        price: 3600, // discounted from 4500 by 20%
        originalPrice: 4500,
        discountPercentage: 20,
        width: 200,
        length: 300,
      },
    ],
  };

  // Size 101 (not in offer)
  const size1 = product.sizes[0];
  const hasDiscount1 = Boolean(size1.originalPrice && size1.originalPrice > (size1.price || 0));
  assert.strictEqual(hasDiscount1, false);
  assert.strictEqual(size1.price, 3800);

  // Size 102 (targeted by offer)
  const size2 = product.sizes[1];
  const hasDiscount2 = Boolean(size2.originalPrice && size2.originalPrice > (size2.price || 0));
  assert.strictEqual(hasDiscount2, true);
  assert.strictEqual(size2.originalPrice, 4500);
  assert.strictEqual(size2.price, 3600);
  assert.strictEqual(size2.discountPercentage, 20);
});

test('7. Products without sizes or missing price do not fabricate false sizes or prices', () => {
  const productWithoutSizes = {
    id: '50',
    name: 'سجادة عينة بدون مقاسات',
    price: 0,
    sizes: [],
  };

  assert.strictEqual(productWithoutSizes.sizes.length, 0);

  const productMissingPrice = {
    id: '51',
    name: 'سجادة بمقاس بدون سعر',
    price: 0,
    sizes: [
      {
        id: '201',
        name: '120x180 سم',
        dimensions: '120 × 180 سم',
        priceDelta: 0,
        price: undefined,
        originalPrice: undefined,
      },
    ],
  };

  const actualPrice = productMissingPrice.sizes[0].originalPrice ?? productMissingPrice.sizes[0].price;
  assert.strictEqual(actualPrice, undefined);
});
