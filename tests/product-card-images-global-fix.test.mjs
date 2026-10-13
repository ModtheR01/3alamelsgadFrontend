import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Global Product Card Images Audit & Verification', () => {
  const rootDir = process.cwd();

  it('ProductCardImage component exists and has natural width/height styling', () => {
    const compPath = path.join(rootDir, 'components', 'ProductCardImage.tsx');
    assert.ok(fs.existsSync(compPath), 'ProductCardImage.tsx must exist');

    const content = fs.readFileSync(compPath, 'utf8');
    assert.match(content, /w-full\s+h-auto\s+block/, 'Must render <img> with w-full h-auto block');
    assert.match(content, /onError/, 'Must handle image loading errors gracefully');
  });

  it('NewArrivalSection uses ProductCardImage and removes aspect-[4/5] + dead padding', () => {
    const file = path.join(rootDir, 'components', 'NewArrivalSection.tsx');
    const content = fs.readFileSync(file, 'utf8');

    assert.ok(content.includes('ProductCardImage'), 'NewArrivalSection must import and use ProductCardImage');
    assert.strictEqual(
      content.includes('aspect-[4/5]'),
      false,
      'NewArrivalSection must NOT use aspect-[4/5] on product card image container'
    );
    assert.strictEqual(
      content.includes('p-2.5 flex items-center justify-center border border-[#EFE9DF]'),
      false,
      'NewArrivalSection must not have letterbox padding'
    );
  });

  it('ShopCatalog uses ProductCardImage and removes aspect-[4/5] + dead padding', () => {
    const file = path.join(rootDir, 'components', 'ShopCatalog.tsx');
    const content = fs.readFileSync(file, 'utf8');

    assert.ok(content.includes('ProductCardImage'), 'ShopCatalog must import and use ProductCardImage');
    assert.strictEqual(
      content.includes('aspect-[4/5]'),
      false,
      'ShopCatalog must NOT use aspect-[4/5] on product card image container'
    );
    assert.strictEqual(
      content.includes('p-2.5 sm:p-3 flex items-center justify-center'),
      false,
      'ShopCatalog must not have letterbox padding around product images'
    );
  });

  it('SpecialOffersSection uses ProductCardImage and preserves natural image display', () => {
    const file = path.join(rootDir, 'components', 'SpecialOffersSection.tsx');
    const content = fs.readFileSync(file, 'utf8');

    assert.ok(content.includes('ProductCardImage'), 'SpecialOffersSection must import and use ProductCardImage');
    assert.strictEqual(
      content.includes('aspect-[4/5]'),
      false,
      'SpecialOffersSection must not use aspect-[4/5]'
    );
  });

  it('ProductDetailView removed internal dead padding from main image container', () => {
    const file = path.join(rootDir, 'components', 'ProductDetailView.tsx');
    const content = fs.readFileSync(file, 'utf8');

    assert.strictEqual(
      content.includes('p-3 sm:p-5 flex items-center justify-center'),
      false,
      'ProductDetailView showcase image should not have extra letterboxing padding'
    );
  });
});
