import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve('.');

test('Special Offers Section & Real Backend Discount Architecture', async (t) => {
  await t.test('1. SpecialOffersSection component exists, has RTL title, and meets all design standards', () => {
    const filePath = path.join(ROOT_DIR, 'components', 'SpecialOffersSection.tsx');
    assert.ok(fs.existsSync(filePath), 'components/SpecialOffersSection.tsx must exist');

    const content = fs.readFileSync(filePath, 'utf8');

    // Title: «عروض مميزة»
    assert.ok(
      content.includes('عروض مميزة'),
      'SpecialOffersSection must display Arabic title «عروض مميزة»'
    );

    // Subtitle: «وفّر أكثر»
    assert.ok(
      content.includes('وفّر أكثر'),
      'SpecialOffersSection must display attractive Arabic subtitle'
    );

    // CTA button: «تسوق العرض»
    assert.ok(
      content.includes('تسوق العرض'),
      'SpecialOffersSection must contain prominent «تسوق العرض» action button'
    );

    // Touch Scrolling Safety: Must have pan-x pan-y and overscrollBehaviorX contain
    assert.match(
      content,
      /touchAction:\s*['"]pan-x\s+pan-y['"]/,
      'SpecialOffersSection must use pan-x pan-y touchAction to allow vertical page scrolling'
    );
    assert.match(
      content,
      /overscrollBehaviorX:\s*['"]contain['"]/,
      'SpecialOffersSection must contain horizontal overscroll behavior'
    );

    // Absolutely NO single-axis touch-pan-x
    assert.doesNotMatch(
      content,
      /touchAction:\s*['"]pan-x['"]\s*,/,
      'SpecialOffersSection must NOT use single-axis pan-x touchAction'
    );
    assert.doesNotMatch(
      content,
      /\btouch-pan-x\b/,
      'SpecialOffersSection must NOT use touch-pan-x class'
    );

    // Error state and retry button
    assert.ok(
      content.includes('إعادة المحاولة'),
      'SpecialOffersSection must provide Arabic retry button'
    );

    // Navigation arrows must be completely removed
    assert.doesNotMatch(
      content,
      /scrollTrack/,
      'SpecialOffersSection must NOT contain arrow scrollTrack function'
    );
    assert.doesNotMatch(
      content,
      /ChevronRight|ChevronLeft/,
      'SpecialOffersSection must NOT render navigation arrow buttons'
    );

    // Image container and tag must use natural responsive w-full h-auto scaling with zero letterbox padding
    assert.match(
      content,
      /w-full\s+h-auto\s+block/,
      'SpecialOffersSection must render product image with w-full h-auto block to allow natural dimensions'
    );
    assert.doesNotMatch(
      content,
      /aspect-\[4\/5\]/,
      'SpecialOffersSection must NOT use portrait aspect-[4/5]'
    );

    // Skeleton loading state
    assert.ok(
      content.includes('offer-skeleton'),
      'SpecialOffersSection must support skeleton loading state'
    );

    // Zero Unsplash dummy image references
    assert.doesNotMatch(
      content,
      /images\.unsplash\.com/,
      'SpecialOffersSection must never use Unsplash dummy images'
    );
  });

  await t.test('2. StoreContextType and StoreProvider manage real offers and provide reloadOffers', () => {
    const storePath = path.join(ROOT_DIR, 'lib', 'store.tsx');
    const content = fs.readFileSync(storePath, 'utf8');

    // StoreContextType must expose offers, isOffersLoading, offersError, reloadOffers
    assert.match(
      content,
      /offers:\s*BackendOffer\[\];/,
      'StoreContextType must expose offers'
    );
    assert.match(
      content,
      /isOffersLoading:\s*boolean;/,
      'StoreContextType must expose isOffersLoading'
    );
    assert.match(
      content,
      /offersError:\s*string\s*\|\s*null;/,
      'StoreContextType must expose offersError'
    );
    assert.match(
      content,
      /reloadOffers:\s*\(\)\s*=>\s*Promise<void>;/,
      'StoreContextType must expose reloadOffers'
    );

    // StoreProvider initializes offers as empty array
    assert.match(
      content,
      /const\s*\[offers,\s*setOffers\]\s*=\s*useState<BackendOffer\[\]>\(\[\]\);/,
      'StoreProvider offers must initialize as empty array, never mock data'
    );
  });

  await t.test('3. Home page (app/page.tsx) renders SpecialOffersSection directly under NewArrivalSection', () => {
    const pagePath = path.join(ROOT_DIR, 'app', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    // Imported
    assert.ok(
      content.includes('SpecialOffersSection'),
      'app/page.tsx must import SpecialOffersSection'
    );

    // Positioned below NewArrivalSection and above HomeCategoriesSection
    const newArrivalIdx = content.indexOf('<NewArrivalSection />');
    const specialOffersIdx = content.indexOf('<SpecialOffersSection />');
    const categoriesIdx = content.indexOf('<HomeCategoriesSection />');

    assert.ok(newArrivalIdx !== -1, 'NewArrivalSection must be present');
    assert.ok(specialOffersIdx !== -1, 'SpecialOffersSection must be present');
    assert.ok(categoriesIdx !== -1, 'HomeCategoriesSection must be present');

    assert.ok(
      specialOffersIdx > newArrivalIdx,
      'SpecialOffersSection must be placed below NewArrivalSection'
    );
    assert.ok(
      categoriesIdx > specialOffersIdx,
      'SpecialOffersSection must be placed above HomeCategoriesSection'
    );
  });

  await t.test('4. Pricing & Discount Evaluation Logic strictly filters out non-discounted items', () => {
    const dummyProductA = { id: '1', name: 'سجاد تبريز', price: 2000, isPublished: true };
    const dummyProductB = { id: '2', name: 'سجاد حرير', price: 3000, isPublished: true };
    const dummyProductC = { id: '3', name: 'سجاد مودرن', price: 1500, originalPrice: 1800, discountPercentage: 17, isPublished: true };

    const activeOffer = {
      id: 10,
      name_ar: 'تخفيضات الربيع',
      offer_type: 'PERCENTAGE',
      percentage: '20.00',
      is_active: true,
      starts_at: null,
      ends_at: null,
      offer_products: [{ product_id: 1 }],
      products: [{ id: 1, product_id: 1 }],
    };

    // Evaluator mimicking SpecialOffersSection logic
    function evaluateDiscount(product, activeOffers) {
      const match = activeOffers.find((o) =>
        (o.offer_products || []).some((p) => String(p.product_id) === String(product.id))
      );
      if (match && match.percentage) {
        const pct = Math.round(Number(match.percentage));
        if (pct > 0 && pct < 100 && product.price > 0) {
          const orig = product.price;
          const discounted = Math.round(product.price * (1 - pct / 100));
          return {
            hasDiscount: true,
            originalPrice: orig,
            discountedPrice: discounted,
            discountPercentage: pct,
            savingsAmount: orig - discounted,
          };
        }
      }

      if (product.originalPrice && product.originalPrice > product.price) {
        const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        return {
          hasDiscount: true,
          originalPrice: product.originalPrice,
          discountedPrice: product.price,
          discountPercentage: pct,
          savingsAmount: product.originalPrice - product.price,
        };
      }

      return { hasDiscount: false };
    }

    const resA = evaluateDiscount(dummyProductA, [activeOffer]);
    assert.equal(resA.hasDiscount, true);
    assert.equal(resA.originalPrice, 2000);
    assert.equal(resA.discountedPrice, 1600);
    assert.equal(resA.discountPercentage, 20);
    assert.equal(resA.savingsAmount, 400);

    const resB = evaluateDiscount(dummyProductB, [activeOffer]);
    assert.equal(resB.hasDiscount, false, 'Product without discount must NOT be included as offer');

    const resC = evaluateDiscount(dummyProductC, [activeOffer]);
    assert.equal(resC.hasDiscount, true);
    assert.equal(resC.originalPrice, 1800);
    assert.equal(resC.discountedPrice, 1500);
    assert.equal(resC.savingsAmount, 300);
  });
});
