import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import createJiti from 'jiti';

const jiti = createJiti(import.meta.url);
const { productService } = jiti('../lib/api/services/productService.ts');
const { apiClient } = jiti('../lib/api/client.ts');

test('1. productService.getPaginatedProducts calls GET /products/ with page, page_size, and search parameters', async () => {
  const originalGet = apiClient.get;
  let capturedEndpoint = '';
  let capturedOptions = null;

  try {
    apiClient.get = async (endpoint, options) => {
      capturedEndpoint = endpoint;
      capturedOptions = options;
      return {
        count: 25,
        next: 'http://localhost:8000/api/products/?page=2&page_size=20',
        previous: null,
        results: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          name: `Carpet ${i + 1}`,
          name_ar: `سجاد ${i + 1}`,
          name_en: `Carpet ${i + 1}`,
          price: 1500 + i * 100,
          images: [],
        })),
      };
    };

    const result = await productService.getPaginatedProducts({
      page: 1,
      page_size: 20,
      search: 'سجاد تبريز',
    });

    assert.equal(capturedEndpoint, '/products/', 'Must query /products/ endpoint');
    assert.deepEqual(
      capturedOptions?.params,
      { page_size: 20, page: 1, search: 'سجاد تبريز' },
      'Must pass pagination and search query params'
    );
    assert.equal(result.count, 25, 'Must parse total count from backend envelope');
    assert.equal(result.results.length, 20, 'Must return 20 items for page 1');
    assert.ok(result.next, 'Must preserve next page link');
    assert.equal(result.previous, null, 'Must preserve previous page link');
  } finally {
    apiClient.get = originalGet;
  }
});

test('2. productService.getPaginatedProducts handles bare array fallback gracefully', async () => {
  const originalGet = apiClient.get;

  try {
    apiClient.get = async () => {
      return [
        { id: 101, name_ar: 'منتج تجريبي 1' },
        { id: 102, name_ar: 'منتج تجريبي 2' },
      ];
    };

    const result = await productService.getPaginatedProducts();
    assert.equal(result.count, 2, 'Must deduce count from array length');
    assert.equal(result.results.length, 2, 'Must wrap array in results property');
    assert.equal(result.next, null);
    assert.equal(result.previous, null);
  } finally {
    apiClient.get = originalGet;
  }
});

test('3. AiProductImageView eliminates the hardcoded slice(0, 10) limitation', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Verify slice(0, 10) was completely removed
  assert.ok(
    !code.includes('effectiveProducts.slice(0, 10)'),
    'Must NOT contain hardcoded effectiveProducts.slice(0, 10)'
  );

  // Verify dynamic display limit or pagination is used instead
  assert.match(
    code,
    /clientDisplayLimit|getPaginatedProducts/,
    'Must use dynamic display limit or paginated fetching'
  );
});

test('4. AiProductImageView implements server-driven pagination and catalog fetching', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must call productService.getPaginatedProducts
  assert.match(code, /productService\.getPaginatedProducts/);

  // Must track server products, page, and hasMore state
  assert.match(code, /serverProducts/);
  assert.match(code, /serverPage/);
  assert.match(code, /hasMoreServerProducts/);
  assert.match(code, /isLoadingCatalog/);
  assert.match(code, /isLoadingMore/);

  // Must have a loadNextPage handler
  assert.match(code, /loadNextPage/);

  // Must support infinite scroll on product list container
  assert.match(code, /onScroll/);
});

test('5. AiProductImageView searches across the entire product catalog with debouncing', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must track debounced search query
  assert.match(code, /debouncedSearchQuery/);

  // Debounce timer should be present (e.g. setTimeout for 300ms)
  assert.match(code, /setTimeout\([\s\S]*?debouncedSearchQuery/);

  // Must trigger fetchCatalogPage when debouncedSearchQuery changes
  assert.match(code, /fetchCatalogPage\(1,\s*debouncedSearchQuery/);

  // Must include a search clearing button when searchQuery is active
  assert.match(code, /setSearchQuery\(''\)/);
});

test('6. Selected product persistence across pagination, infinite scroll, and search', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must track selectedProductDetails
  assert.match(code, /selectedProductDetails/);
  assert.match(code, /setSelectedProductDetails/);

  // When clicking a product, both ID and details must be stored
  assert.match(code, /setSelectedProductId\(String\(p\.id\)\)/);
  assert.match(code, /setSelectedProductDetails\(p\)/);

  // selectedProduct resolution must check selectedProductDetails first
  assert.match(code, /selectedProductDetails\.id/);

  // Linking to existing product must resolve existingProduct from selectedProduct
  assert.match(
    code,
    /existingProduct\s*=\s*selectedProduct\s*\|\|\s*effectiveProducts\.find/
  );
});

test('7. Product count and RTL design presentation in Step 4 UI', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must display total catalog count badge: عرض X من أصل Y منتج
  assert.match(code, /عرض[\s\S]*?من أصل[\s\S]*?منتج/);

  // Must provide "عرض المزيد من المنتجات" button for manual loading
  assert.match(code, /عرض المزيد من المنتجات/);

  // Must provide end of catalog indicator
  assert.match(code, /تم عرض جميع المنتجات/);

  // Must preserve primary image thumbnail and price formatting
  assert.match(code, /p\.price\?\.toLocaleString\(\)\}\s*ج\.م/);
});
