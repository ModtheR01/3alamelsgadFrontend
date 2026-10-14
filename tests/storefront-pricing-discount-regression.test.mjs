import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Storefront Pricing and Discount Display Architecture Regression', () => {
  const rootDir = process.cwd();

  // 1. Simulation of mapBackendProduct logic from lib/store.tsx
  function mapBackendProductSim(product) {
    const parsedPrice = Number(product?.price) || 0;
    const rawOriginalPrice = Number(product?.original_price);
    const validOriginalPrice = Number.isFinite(rawOriginalPrice) && rawOriginalPrice > parsedPrice ? rawOriginalPrice : undefined;
    const rawDiscountPercentage = Number(product?.discount_percentage);
    const validDiscountPercentage = Number.isFinite(rawDiscountPercentage) && rawDiscountPercentage > 0
      ? Math.round(rawDiscountPercentage)
      : validOriginalPrice && parsedPrice > 0
      ? Math.round(((validOriginalPrice - parsedPrice) / validOriginalPrice) * 100)
      : undefined;

    return {
      id: String(product?.id || ''),
      price: parsedPrice,
      originalPrice: validOriginalPrice,
      discountPercentage: validDiscountPercentage,
    };
  }

  // 2. Pricing evaluator matching NewArrivalSection & ShopCatalog
  function evaluatePricing(product, offers = []) {
    // 1. Direct discount data on product itself
    if (product.originalPrice && product.originalPrice > product.price) {
      const pct = product.discountPercentage && product.discountPercentage > 0
        ? Math.round(product.discountPercentage)
        : Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      return {
        hasDiscount: true,
        finalPrice: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: pct,
      };
    }

    if (product.discountPercentage && product.discountPercentage > 0 && product.price > 0) {
      const origPrice = Math.round(product.price / (1 - product.discountPercentage / 100));
      return {
        hasDiscount: true,
        finalPrice: product.price,
        originalPrice: origPrice,
        discountPercentage: Math.round(product.discountPercentage),
      };
    }

    // 2. Active backend percentage offers
    const now = new Date();
    const matchingOffer = offers.find(
      (o) =>
        o.is_active &&
        (!o.starts_at || new Date(o.starts_at) <= now) &&
        (!o.ends_at || new Date(o.ends_at) >= now) &&
        (o.offer_type === 'PERCENTAGE' || o.type === 'PERCENTAGE') &&
        ((o.products || []).some((p) => String(p.product_id) === String(product.id) || String(p.id) === String(product.id)) ||
          ((o.offer_products || []).some((p) => String(p.product_id) === String(product.id))))
    );
    if (matchingOffer && matchingOffer.percentage) {
      const pct = Math.round(Number(matchingOffer.percentage));
      if (pct > 0 && pct < 100 && product.price > 0) {
        return {
          hasDiscount: true,
          finalPrice: Math.round(product.price * (1 - pct / 100)),
          originalPrice: product.price,
          discountPercentage: pct,
        };
      }
    }

    return {
      hasDiscount: false,
      finalPrice: product.price,
      originalPrice: undefined,
      discountPercentage: 0,
    };
  }

  it('Case 1: Product with 90% discount on base price 9,000 EGP displays 900 EGP final and 9,000 EGP strikethrough', () => {
    // When received from backend DRF ProductListSerializer
    const backendData = {
      id: 101,
      price: '900.00',
      original_price: '9000.00',
      discount_percentage: '90.00',
    };

    const product = mapBackendProductSim(backendData);
    assert.strictEqual(product.price, 900);
    assert.strictEqual(product.originalPrice, 9000);
    assert.strictEqual(product.discountPercentage, 90);

    const pricing = evaluatePricing(product);
    assert.strictEqual(pricing.hasDiscount, true);
    assert.strictEqual(pricing.finalPrice, 900, 'Final price must be 900 EGP, NOT 9,000 EGP');
    assert.strictEqual(pricing.originalPrice, 9000, 'Original price before discount must be 9,000 EGP');
    assert.strictEqual(pricing.discountPercentage, 90, 'Discount badge must show 90%');
  });

  it('Case 2: Product with 98% discount on base price 9,000 EGP displays 180 EGP final and 9,000 EGP strikethrough', () => {
    const backendData = {
      id: 102,
      price: '180.00',
      original_price: '9000.00',
      discount_percentage: '98.00',
    };

    const product = mapBackendProductSim(backendData);
    assert.strictEqual(product.price, 180);
    assert.strictEqual(product.originalPrice, 9000);
    assert.strictEqual(product.discountPercentage, 98);

    const pricing = evaluatePricing(product);
    assert.strictEqual(pricing.hasDiscount, true);
    assert.strictEqual(pricing.finalPrice, 180, 'Final price must be 180 EGP');
    assert.strictEqual(pricing.originalPrice, 9000, 'Original price before discount must be 9,000 EGP');
    assert.strictEqual(pricing.discountPercentage, 98, 'Discount badge must show 98%');
  });

  it('Case 3: Product without discount displays base price only without strikethrough or discount badge', () => {
    const backendData = {
      id: 103,
      price: '9000.00',
      original_price: null,
      discount_percentage: null,
    };

    const product = mapBackendProductSim(backendData);
    assert.strictEqual(product.price, 9000);
    assert.strictEqual(product.originalPrice, undefined);
    assert.strictEqual(product.discountPercentage, undefined);

    const pricing = evaluatePricing(product);
    assert.strictEqual(pricing.hasDiscount, false);
    assert.strictEqual(pricing.finalPrice, 9000);
    assert.strictEqual(pricing.originalPrice, undefined);
    assert.strictEqual(pricing.discountPercentage, 0);
  });

  it('Case 4: Product linked to inactive or expired offer does NOT apply discount', () => {
    const backendData = {
      id: 104,
      price: '9000.00',
      original_price: null,
      discount_percentage: null,
    };
    const product = mapBackendProductSim(backendData);

    const inactiveOffer = {
      id: 1,
      offer_type: 'PERCENTAGE',
      percentage: '90.00',
      is_active: false,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 104 }],
    };

    const expiredOffer = {
      id: 2,
      offer_type: 'PERCENTAGE',
      percentage: '90.00',
      is_active: true,
      starts_at: '2025-01-01T00:00:00Z',
      ends_at: '2025-02-01T00:00:00Z',
      products: [{ product_id: 104 }],
    };

    const pricingInactive = evaluatePricing(product, [inactiveOffer]);
    assert.strictEqual(pricingInactive.hasDiscount, false);
    assert.strictEqual(pricingInactive.finalPrice, 9000);

    const pricingExpired = evaluatePricing(product, [expiredOffer]);
    assert.strictEqual(pricingExpired.hasDiscount, false);
    assert.strictEqual(pricingExpired.finalPrice, 9000);
  });

  it('Codebase Audit: ShopCatalog uses getProductPricing and renders pricing.finalPrice', () => {
    const file = path.join(rootDir, 'components', 'ShopCatalog.tsx');
    const content = fs.readFileSync(file, 'utf8');

    assert.ok(content.includes('getProductPricing'), 'ShopCatalog must define and use getProductPricing helper');
    assert.ok(content.includes('pricing.finalPrice'), 'ShopCatalog must render pricing.finalPrice');
    assert.ok(content.includes('pricing.originalPrice'), 'ShopCatalog must render pricing.originalPrice as strikethrough');
  });

  it('Codebase Audit: NewArrivalSection eliminates arbitrary Math.round(product.price * 1.18)', () => {
    const file = path.join(rootDir, 'components', 'NewArrivalSection.tsx');
    const content = fs.readFileSync(file, 'utf8');

    assert.strictEqual(
      content.includes('* 1.18'),
      false,
      'NewArrivalSection must NOT use fabricated multiplier * 1.18'
    );
    assert.ok(content.includes('product.originalPrice && product.originalPrice > product.price'), 'Must prioritize real product originalPrice');
  });

  it('Codebase Audit: SpecialOffersSection prevents calculating discount twice', () => {
    const file = path.join(rootDir, 'components', 'SpecialOffersSection.tsx');
    const content = fs.readFileSync(file, 'utf8');

    // Must check direct product originalPrice > price BEFORE offer recalculation
    const directIdx = content.indexOf('product.originalPrice &&');
    const pctOfferIdx = content.indexOf('matchingOffer && matchingOffer.percentage');
    assert.ok(directIdx !== -1 && pctOfferIdx !== -1, 'Both branches must exist');
    assert.ok(directIdx < pctOfferIdx, 'Direct product originalPrice must take precedence over recalculation');
  });

  it('Codebase Audit: types/product.ts defines original_price and discount_percentage on BackendProduct', () => {
    const file = path.join(rootDir, 'types', 'product.ts');
    const content = fs.readFileSync(file, 'utf8');

    assert.ok(content.includes('original_price?: string | number | null;'), 'BackendProduct must type original_price');
    assert.ok(content.includes('discount_percentage?: string | number | null;'), 'BackendProduct must type discount_percentage');
  });
});
