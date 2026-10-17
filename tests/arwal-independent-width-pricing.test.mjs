import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('Arwal Independent Width Pricing Suite', async (t) => {
  const storeContent = fs.readFileSync(path.join(projectRoot, 'lib/store.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const productsSectionContent = fs.readFileSync(
    path.join(projectRoot, 'components/admin/ProductsSection.tsx'),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const productDetailContent = fs.readFileSync(
    path.join(projectRoot, 'components/ProductDetailView.tsx'),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const shopCatalogContent = fs.readFileSync(
    path.join(projectRoot, 'components/ShopCatalog.tsx'),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const typesProductContent = fs.readFileSync(
    path.join(projectRoot, 'types/product.ts'),
    'utf8'
  ).replace(/\r\n/g, '\n');

  await t.test('1. Type definitions support per-width pricing', () => {
    assert.ok(typesProductContent.includes('price_per_length'), 'BackendArwalWidth must contain price_per_length');
    assert.ok(typesProductContent.includes('ArwalWidthInput'), 'types/product.ts must define ArwalWidthInput');
    assert.ok(typesProductContent.includes('widths?: ArwalWidthInput[]'), 'ArwalCreateRequest must accept widths array');
  });

  await t.test('2. Store maps and saves widths with independent prices', () => {
    assert.ok(storeContent.includes('widthsWithPrices'), 'store.tsx must map widthsWithPrices');
    assert.ok(storeContent.includes('minPrice'), 'store.tsx must compute minPrice for base price');
    assert.ok(storeContent.includes('widths: formattedWidths'), 'saveProduct must send formatted widths to backend');
  });

  await t.test('3. Admin ProductsSection allows configuring each width price independently', () => {
    assert.ok(
      productsSectionContent.includes('تسعير عروض الأروال (سعر المتر لكل عرض)'),
      'Admin modal must render per-width pricing title'
    );
    assert.ok(
      productsSectionContent.includes('يرجى تحديد سعر متر صحيح أكبر من الصفر لعرض'),
      'Admin form validation must ensure every enabled width has a positive price'
    );
  });

  await t.test('4. ProductDetailView recalculates total based on selected width price', () => {
    assert.ok(
      productDetailContent.includes('selectedWidthItem'),
      'ProductDetailView must resolve price for the selected width'
    );
    assert.ok(
      productDetailContent.includes('Math.round(unitPricePerMeter * arawalLengthMeters)'),
      'ProductDetailView must calculate total as unitPricePerMeter * arawalLengthMeters'
    );
  });

  await t.test('5. ShopCatalog displays "يبدأ من X جنيه / متر"', () => {
    assert.ok(
      shopCatalogContent.includes("t('يبدأ من', 'Starts from')"),
      'Catalog must show "Starts from" prefix for rolls'
    );
    assert.ok(
      shopCatalogContent.includes("t('جنيه / متر', 'EGP / m')"),
      'Catalog must show unit as "EGP / m" / "جنيه / متر"'
    );
  });
});
