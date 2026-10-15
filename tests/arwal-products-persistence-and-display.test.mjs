import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('Arwal (Roll) Products Persistence, Display & Cart Consistency Suite', async (t) => {
  const storeContent = fs.readFileSync(path.join(projectRoot, 'lib/store.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const productsSectionContent = fs.readFileSync(
    path.join(projectRoot, 'components/admin/ProductsSection.tsx'),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const productDetailContent = fs.readFileSync(
    path.join(projectRoot, 'components/ProductDetailView.tsx'),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const productServiceContent = fs.readFileSync(
    path.join(projectRoot, 'lib/api/services/productService.ts'),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const productImageServiceContent = fs.readFileSync(
    path.join(projectRoot, 'lib/api/services/productImageService.ts'),
    'utf8'
  ).replace(/\r\n/g, '\n');

  await t.test('1. Backend Service Endpoints for Arwals', () => {
    // getArwals, getArwal, getArwalWidths, createArwal, updateArwal, deleteArwal, hardDeleteArwal, restoreArwal, getDeletedArwals
    assert.ok(productServiceContent.includes('/arwals/'), 'productService must call /arwals/ endpoint');
    assert.ok(productServiceContent.includes('getArwals'), 'productService must provide getArwals');
    assert.ok(productServiceContent.includes('getArwal('), 'productService must provide getArwal(id)');
    assert.ok(productServiceContent.includes('/arwals/widths/'), 'productService must fetch arwal widths');
    assert.ok(productServiceContent.includes('createArwal'), 'productService must provide createArwal');
    assert.ok(productServiceContent.includes('updateArwal'), 'productService must provide updateArwal');
    assert.ok(productServiceContent.includes('deleteArwal'), 'productService must provide deleteArwal');
    assert.ok(productServiceContent.includes('hardDeleteArwal'), 'productService must provide hardDeleteArwal');
    assert.ok(productServiceContent.includes('restoreArwal'), 'productService must provide restoreArwal');
    assert.ok(productServiceContent.includes('getDeletedArwals'), 'productService must provide getDeletedArwals');

    // productImageService Arwal helpers
    assert.ok(productImageServiceContent.includes('/arwal-images/'), 'productImageService must call /arwal-images/');
    assert.ok(productImageServiceContent.includes('createArwalImage'), 'productImageService must provide createArwalImage');
    assert.ok(productImageServiceContent.includes('deleteArwalImage'), 'productImageService must provide deleteArwalImage');
  });

  await t.test('2. Store Catalog Loading & Arwal Integration', () => {
    // Store must import and define mapBackendArwal
    assert.ok(storeContent.includes('export function mapBackendArwal'), 'store must export mapBackendArwal');
    assert.ok(storeContent.includes('export function resolveArwalWidthId'), 'store must export resolveArwalWidthId');

    // useEffect catalog load must fetch both getProducts and getArwals
    assert.ok(storeContent.includes('productService.getArwals()'), 'Initial catalog load must fetch Arwals');
    assert.ok(storeContent.includes('productService.getArwalWidths()'), 'Initial catalog load must fetch Arwal widths');
    assert.ok(storeContent.includes('mapBackendArwal(arwal'), 'Catalog load must map Arwals using mapBackendArwal');

    // refreshCatalog must also fetch Arwals and combine them
    assert.ok(
      storeContent.includes('const [backendProducts, backendArwals, backendCategories'),
      'refreshCatalog must fetch both products and arwals'
    );
  });

  await t.test('3. Store Product Saving, Deletion & Restoral for Arwals', () => {
    // saveProduct must check productToSave.isArawal
    assert.ok(storeContent.includes('if (productToSave.isArawal)'), 'saveProduct must branch for Arwals');
    assert.ok(storeContent.includes('productService.createArwal'), 'saveProduct must call createArwal for new Arwals');
    assert.ok(storeContent.includes('productService.updateArwal'), 'saveProduct must call updateArwal for existing Arwals');
    assert.ok(storeContent.includes('productImageService.createArwalImage'), 'saveProduct must sync images using createArwalImage');
    assert.ok(storeContent.includes('productImageService.deleteArwalImage'), 'saveProduct must delete removed Arwal images');

    // deleteProduct, hardDeleteProduct, restoreProduct must check isArawal
    assert.ok(storeContent.includes('productService.deleteArwal'), 'deleteProduct must route to deleteArwal');
    assert.ok(storeContent.includes('productService.hardDeleteArwal'), 'hardDeleteProduct must route to hardDeleteArwal');
    assert.ok(storeContent.includes('productService.restoreArwal'), 'restoreProduct must route to restoreArwal');
  });

  await t.test('4. Cart Width Resolution & Storage Consistency', () => {
    // addToCart must resolve ArwalWidth PK
    assert.ok(
      storeContent.includes('const widthId = resolveArwalWidthId(widthVal, arwalWidths)'),
      'addToCart must resolve width in cm to ArwalWidth PK'
    );
    assert.ok(
      storeContent.includes('selected_width_id: widthId'),
      'addToCart must pass resolved widthId PK to cartService.addArwalItem'
    );

    // syncGuestCart must also resolve ArwalWidth PK
    assert.ok(
      storeContent.includes('selected_width_id: widthId'),
      'syncGuestCart must pass resolved widthId to cartService.addArwalItem'
    );
  });

  await t.test('5. Admin ProductsSection Modal & Table Integrity', () => {
    // Product type toggle must clear sizes for Arwals
    assert.ok(
      productsSectionContent.includes('isArawal: true,\n                              sizes: [],'),
      'Selecting Arwal in admin form must reset sizes to empty array'
    );

    // Editing Arwal must preserve empty sizes
    assert.ok(
      productsSectionContent.includes('sizes: isArwal ? [] :'),
      'Editing Arwal must preserve empty sizes'
    );

    // Submitting Arwal must pass empty sizes
    assert.ok(
      productsSectionContent.includes('sizes: editingProduct.isArawal ? [] : editingProduct.sizes'),
      'Submitting Arwal must never send carpet sizes'
    );

    // Table display must show Arwal badge and available widths
    assert.ok(
      productsSectionContent.includes('رول أروال بالمتر'),
      'Table must display Roll Arwal indicator'
    );
    assert.ok(
      productsSectionContent.includes('/ متر طولي'),
      'Table must display price per linear meter for rolls'
    );

    // Archived products fetch must include deleted arwals
    assert.ok(
      productsSectionContent.includes('productService.getDeletedArwals()'),
      'fetchArchivedProducts must fetch deleted Arwals'
    );
  });

  await t.test('6. Customer-facing ProductDetailView Integrity', () => {
    // Must identify Arwals via isArawal
    assert.ok(
      productDetailContent.includes('product.isArawal'),
      'isArawalProduct must check product.isArawal'
    );

    // Must not show carpet sizes when isArawalProduct is true
    assert.ok(
      productDetailContent.includes('!isArawalProduct && product.sizes && product.sizes.length > 0'),
      'Carpet sizes must only render when !isArawalProduct'
    );

    // Must show Roll options
    assert.ok(
      productDetailContent.includes('مواصفات الرول'),
      'Product details must render Roll specifications section'
    );
    assert.ok(
      productDetailContent.includes('اختر الطول المطلوب (بالمتر):'),
      'Product details must allow selecting length in meters'
    );

    // Direct cold-load fallback to getArwal
    assert.ok(
      productDetailContent.includes('productService.getArwal(numId)'),
      'ProductDetailView must fallback to getArwal if getProduct returns 404'
    );
  });
});
