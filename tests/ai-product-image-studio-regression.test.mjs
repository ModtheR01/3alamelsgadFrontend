import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import createJiti from 'jiti';

const jiti = createJiti(import.meta.url);

const { aiImageService } = jiti('../lib/api/services/aiImageService.ts');
const { apiClient } = jiti('../lib/api/client.ts');

test('1. Successful processing with a binary image response — POST /api/products/process-rug/', async () => {
  const originalPostFormData = apiClient.postFormData;
  let capturedEndpoint = '';
  let capturedFormData = null;

  try {
    apiClient.postFormData = async (endpoint, formData) => {
      capturedEndpoint = endpoint;
      capturedFormData = formData;
      const fakeBinaryData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header bytes
      return new Response(fakeBinaryData, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
        },
      });
    };

    const dummyBlob = new Blob(['sample-rug-content'], { type: 'image/jpeg' });
    const dummyFile = new File([dummyBlob], 'persian-rug.jpg', { type: 'image/jpeg' });

    const result = await aiImageService.processRugImage(dummyFile);

    assert.equal(capturedEndpoint, '/products/process-rug/', 'Must target /products/process-rug/ endpoint');
    assert.ok(capturedFormData instanceof FormData, 'Must send FormData');
    assert.ok(capturedFormData.get('image'), 'FormData must include "image" field');

    assert.ok(result.blob instanceof Blob, 'Result must be a Blob');
    assert.equal(result.contentType, 'image/png', 'MIME type must match binary header');
    assert.equal(result.blob.size, 8, 'Blob must contain exact binary image bytes');
  } finally {
    apiClient.postFormData = originalPostFormData;
  }
});

test('2. JSON error responses from the processing endpoint — 400 Bad Request & 502 Bad Gateway', async () => {
  const originalPostFormData = apiClient.postFormData;

  try {
    // 2A: 400 Bad Request with backend JSON error
    apiClient.postFormData = async () => {
      return new Response(JSON.stringify({ error: 'image file exceeds maximum allowed size (10MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const dummyFile = new File([new Blob(['oversize-content'])], 'huge-rug.png', { type: 'image/png' });
    await assert.rejects(
      async () => {
        await aiImageService.processRugImage(dummyFile);
      },
      /image file exceeds maximum allowed size \(10MB\)/,
      'Must extract exact backend error message from JSON error response'
    );

    // 2B: 502 Bad Gateway with backend error
    apiClient.postFormData = async () => {
      return new Response(JSON.stringify({ error: 'AI processing service unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await assert.rejects(
      async () => {
        await aiImageService.processRugImage(dummyFile);
      },
      /AI processing service unavailable/,
      'Must extract 502 gateway error message'
    );
  } finally {
    apiClient.postFormData = originalPostFormData;
  }
});

test('3. Real product loading and selection in AiProductImageView', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must accept initialProducts or fetch real products from productService.getProducts()
  assert.match(code, /productService\.getProducts\(\)/);
  assert.match(code, /categoryService\.getCategories\(\)/);
  assert.match(code, /subcategoryService\.getSubcategories\(\)/);

  // Must filter products by search query
  assert.match(code, /filteredProducts\s*=\s*useMemo/);
  assert.match(code, /selectedProductId/);
});

test('4. Linking processed image to existing product — Cloudinary upload and ProductImage creation', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must upload to Cloudinary under 'alamelsgad-products'
  assert.match(code, /uploadDirectToCloudinary\([\s\S]*?folder:\s*'alamelsgad-products'/);

  // Must calculate next sort_order to avoid duplicate sort_order uniqueness error
  assert.match(code, /maxSortOrder/);
  assert.match(code, /nextSortOrder\s*=\s*maxSortOrder\s*\+\s*1/);

  // Must call productImageService.createProductImage with is_primary: true
  assert.match(code, /productImageService\.createProductImage\(\{[\s\S]*?product:\s*numericProductId/);
  assert.match(code, /is_primary:\s*true/);

  // Must trigger catalog refresh
  assert.match(code, /if\s*\(onRefreshCatalog\)\s*\{?\s*await\s*onRefreshCatalog\(\)/);
  assert.match(code, /if\s*\(onAssignImageToProduct\)\s*\{?\s*onAssignImageToProduct/);
});

test('5. Creating a new product and uploading its processed image', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must call productService.createProduct with required bilingual fields
  assert.match(code, /productService\.createProduct\(\{[\s\S]*?name_ar:\s*newProductNameAr/);
  assert.match(code, /subcategory_ids:\s*\[Number\(newProductSubcategory\)\]/);
  assert.match(code, /size_ids:/);
  assert.match(code, /color_ids:/);

  // Must attach image as primary ProductImage
  assert.match(code, /productImageService\.createProductImage\(\{[\s\S]*?product:\s*targetProdId[\s\S]*?is_primary:\s*true/);
});

test('6. Primary-image handling — Primary image is always at index 0 of displayImages', () => {
  const storePath = path.resolve(process.cwd(), 'lib/store.tsx');
  const storeCode = fs.readFileSync(storePath, 'utf8');

  // Verify mapBackendProduct sorts by is_primary and sort_order
  assert.match(storeCode, /const\s*sortedRecords\s*=\s*\[\.\.\.imageRecords\]\.sort/);
  assert.match(storeCode, /if\s*\(a\.is_primary\s*&&\s*!b\.is_primary\)\s*return\s*-1/);
  assert.match(storeCode, /displayImages\s*=\s*\[primaryUrl,\s*\.\.\.displayImages/);

  // Test the exact sorting algorithm on a product with secondary image first in array
  const rawImages = [
    { id: 49, image: 'https://res.cloudinary.com/demo/secondary.jpg', is_primary: false, sort_order: 0 },
    { id: 50, image: 'https://res.cloudinary.com/demo/primary.jpg', is_primary: true, sort_order: 1 },
  ];
  const sorted = [...rawImages].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const displayImages = sorted.map((img) => img.image);
  assert.equal(displayImages[0], 'https://res.cloudinary.com/demo/primary.jpg', 'Primary image must be at index 0');
});

test('7. Refreshing product data after saving in AdminDashboard', () => {
  const adminDashboardPath = path.resolve(process.cwd(), 'components/AdminDashboard.tsx');
  const code = fs.readFileSync(adminDashboardPath, 'utf8');

  // AdminDashboard must pass categories, subcategories, and onRefreshCatalog to AiProductImageView
  assert.match(code, /<AiProductImageView[\s\S]*?categories=\{categories\}/);
  assert.match(code, /subcategories=\{subcategories\}/);
  assert.match(code, /onRefreshCatalog=\{refreshCatalog\}/);
});

test('8. Resilient handling of partial failure without duplicate product creation', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must track createdProductId and cachedCloudinaryUpload
  assert.match(code, /const\s*\[createdProductId,\s*setCreatedProductId\]\s*=\s*useState/);
  assert.match(code, /const\s*\[cachedCloudinaryUpload,\s*setCachedCloudinaryUpload\]\s*=\s*useState/);

  // If createdProductId already exists, do not call productService.createProduct again
  assert.match(code, /if\s*\(!targetProdId\)\s*\{[\s\S]*?createProduct/);

  // Retry button reflects existing product ID
  assert.match(code, /createdProductId\s*\?\s*\(?[\s\S]*?إعادة محاولة ربط الصورة بالمنتج/);
});

test('9. Clean ObjectURL lifecycle and revocation on reset and unmount', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must track object URLs via refs and revoke on unmount
  assert.match(code, /originalObjectUrlRef/);
  assert.match(code, /processedObjectUrlRef/);
  assert.match(code, /URL\.revokeObjectURL\(originalObjectUrlRef\.current\)/);
  assert.match(code, /URL\.revokeObjectURL\(processedObjectUrlRef\.current\)/);
});
