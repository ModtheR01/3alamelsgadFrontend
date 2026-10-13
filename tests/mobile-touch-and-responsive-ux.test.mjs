import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Touch Scrolling Root Cause Fix — NewArrivalSection allows vertical and horizontal touch panning', () => {
  const newArrivalPath = path.resolve(process.cwd(), 'components/NewArrivalSection.tsx');
  const content = fs.readFileSync(newArrivalPath, 'utf8');

  // Verify that the bug: single-axis touchAction 'pan-x' which blocks vertical scrolling is completely ELIMINATED
  assert.doesNotMatch(
    content,
    /touchAction:\s*['"]pan-x['"],/,
    'touchAction must NOT be set to single axis pan-x because it blocks vertical scrolling on touch devices'
  );

  // Verify that touchAction allows BOTH pan-x and pan-y
  assert.match(
    content,
    /touchAction:\s*['"]pan-x\s+pan-y['"]/,
    'touchAction must allow both pan-x and pan-y for smooth native page scrolling and carousel panning'
  );

  // Verify overscrollBehaviorX is contained
  assert.match(
    content,
    /overscrollBehaviorX:\s*['"]contain['"]/,
    'overscrollBehaviorX must be set to contain to prevent rubberband/swipe-back hijacking'
  );

  // Verify touch snap alignment
  assert.match(content, /snap-x\s+snap-proximity/);
  assert.match(content, /snap-start/);

  // Verify desktop grab cursor is restricted to desktop
  assert.match(content, /lg:cursor-grab/);
  assert.match(content, /lg:active:cursor-grabbing/);
});

test('2. Global Touch Scrolling Safety — No component in codebase uses blocking pan-x touch-action', () => {
  const componentsDir = path.resolve(process.cwd(), 'components');
  const files = fs.readdirSync(componentsDir, { recursive: true });

  for (const file of files) {
    if (typeof file === 'string' && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
      const fullPath = path.join(componentsDir, file);
      const code = fs.readFileSync(fullPath, 'utf8');
      assert.doesNotMatch(
        code,
        /touchAction:\s*['"]pan-x['"]\s*,/i,
        `File ${file} must not use single-axis pan-x touchAction`
      );
      assert.doesNotMatch(
        code,
        /\btouch-pan-x\b/i,
        `File ${file} must not use touch-pan-x utility class`
      );
    }
  }
});

test('3. Mobile Product Cards Layout — ShopCatalog responsive grid and spacing', () => {
  const shopCatalogPath = path.resolve(process.cwd(), 'components/ShopCatalog.tsx');
  const content = fs.readFileSync(shopCatalogPath, 'utf8');

  // Must use mobile-friendly gaps (gap-3 sm:gap-6)
  assert.match(content, /grid-cols-2\s+lg:grid-cols-4\s+gap-3\s+sm:gap-6/);

  // Must use compact mobile card padding (p-3 sm:p-4)
  assert.match(content, /p-3\s+sm:p-4\s+flex-1/);

  // Price & button container must stack on mobile and flex-row on larger screens
  assert.match(content, /flex-col\s+sm:flex-row\s+sm:items-center\s+justify-between/);

  // Action button must have touch-manipulation
  assert.match(content, /touch-manipulation/);
});

test('4. Product Details View — Mobile guarantees ribbon and touch buttons', () => {
  const detailPath = path.resolve(process.cwd(), 'components/ProductDetailView.tsx');
  const content = fs.readFileSync(detailPath, 'utf8');

  // Guarantees ribbon must use small screen padding and gaps
  assert.match(content, /grid-cols-3\s+gap-1\.5\s+sm:gap-3/);
  assert.match(content, /p-2\s+sm:p-3\s+rounded-xl/);

  // Add to cart button must have touch-manipulation and min height
  assert.match(content, /touch-manipulation\s+min-h-\[48px\]/);
  assert.match(content, /touch-manipulation\s+min-h-\[44px\]/);
});

test('5. Checkout View — Mobile responsive payment method grid', () => {
  const checkoutPath = path.resolve(process.cwd(), 'components/CheckoutView.tsx');
  const content = fs.readFileSync(checkoutPath, 'utf8');

  // Payment methods must stack as 1 column on mobile and 3 on sm
  assert.match(content, /grid\s+grid-cols-1\s+sm:grid-cols-3\s+gap-2/);

  // Payment buttons must include touch-manipulation and min-height
  assert.match(content, /touch-manipulation\s+min-h-\[44px\]/);
});

test('6. Global Layout — Html and Body prevent horizontal viewport overflow', () => {
  const globalsCssPath = path.resolve(process.cwd(), 'app/globals.css');
  const content = fs.readFileSync(globalsCssPath, 'utf8');

  assert.match(content, /overflow-x:\s*hidden/);
  assert.match(content, /max-width:\s*100vw/);
});
