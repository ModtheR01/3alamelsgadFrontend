import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve('.');

test('Staged Browsing Flow & Real Data Architecture Verification', async (t) => {
  await t.test('1. Production Store initialization and error handling eliminates mock data fallbacks', () => {
    const storePath = path.join(ROOT_DIR, 'lib', 'store.tsx');
    const storeContent = fs.readFileSync(storePath, 'utf8');

    // Subcategories initial state must NOT be DEFAULT_FALLBACK_SUBCATEGORIES
    assert.match(
      storeContent,
      /const\s*\[subcategories,\s*setSubcategories\]\s*=\s*useState<BackendSubcategory\[\]>\(\[\]\);/,
      'StoreProvider subcategories must initialize as an empty array, never mock data'
    );

    // Products initial state must be empty array
    assert.match(
      storeContent,
      /const\s*\[products,\s*setProducts\]\s*=\s*useState<Product\[\]>\(\[\]\);/,
      'StoreProvider products must initialize as an empty array'
    );

    // Categories initial state must be empty array
    assert.match(
      storeContent,
      /const\s*\[categories,\s*setCategories\]\s*=\s*useState<Category\[\]>\(\[\]\);/,
      'StoreProvider categories must initialize as an empty array'
    );

    // Catch block on initial load must NOT assign DEFAULT_FALLBACK_*
    const catchBlockRegex = /\.catch\(\(err\)\s*=>\s*\{[\s\S]*?setProducts\(\[\]\);[\s\S]*?setCategories\(\[\]\);[\s\S]*?setSubcategories\(\[\]\);[\s\S]*?setCatalogError\(/;
    assert.match(
      storeContent,
      catchBlockRegex,
      'StoreProvider catch handler must set empty state and populate catalogError, not fallback mock data'
    );

    // StoreContextType must expose catalogError and reloadCatalog
    assert.match(
      storeContent,
      /catalogError:\s*string\s*\|\s*null;/,
      'StoreContextType must expose catalogError'
    );
    assert.match(
      storeContent,
      /reloadCatalog:\s*\(\)\s*=>\s*Promise<void>;/,
      'StoreContextType must expose reloadCatalog'
    );
  });

  await t.test('2. HomeCategoriesSection component exists and meets all design and real-data requirements', () => {
    const sectionPath = path.join(ROOT_DIR, 'components', 'HomeCategoriesSection.tsx');
    assert.ok(fs.existsSync(sectionPath), 'components/HomeCategoriesSection.tsx must exist');

    const sectionContent = fs.readFileSync(sectionPath, 'utf8');

    // Title: «تسوق حسب القسم»
    assert.ok(
      sectionContent.includes('تسوق حسب القسم'),
      'HomeCategoriesSection must display clear Arabic title «تسوق حسب القسم»'
    );

    // Uses real categories from useToccoStore
    assert.match(
      sectionContent,
      /useToccoStore\(\)/,
      'HomeCategoriesSection must consume real data from useToccoStore'
    );

    // Skeletons, Error state, and Retry button
    assert.ok(
      sectionContent.includes('isCatalogLoading'),
      'HomeCategoriesSection must handle isCatalogLoading skeleton state'
    );
    assert.ok(
      sectionContent.includes('catalogError'),
      'HomeCategoriesSection must handle catalogError state'
    );
    assert.ok(
      sectionContent.includes('reloadCatalog'),
      'HomeCategoriesSection must provide reloadCatalog retry trigger'
    );
    assert.ok(
      sectionContent.includes('إعادة المحاولة'),
      'HomeCategoriesSection must provide Arabic retry button'
    );

    // Empty state message
    assert.ok(
      sectionContent.includes('لا توجد أقسام متاحة حالياً'),
      'HomeCategoriesSection must provide clean Arabic empty state when no categories exist'
    );

    // Dual-axis touch scrolling preserved
    assert.ok(
      sectionContent.includes('pan-x pan-y'),
      'HomeCategoriesSection must ensure dual-axis touch-action pan-x pan-y'
    );

    // Navigates to shop with categoryId
    assert.match(
      sectionContent,
      /navigateTo\('shop',\s*\{\s*categoryId:/,
      'Clicking a category card must navigate to shop with selected categoryId'
    );
  });

  await t.test('3. Home page (app/page.tsx) renders HomeCategoriesSection directly under NewArrivalSection and parses deep links', () => {
    const pagePath = path.join(ROOT_DIR, 'app', 'page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf8');

    // HomeCategoriesSection imported and placed under NewArrivalSection
    assert.ok(
      pageContent.includes('HomeCategoriesSection'),
      'app/page.tsx must import HomeCategoriesSection'
    );
    const newArrivalIndex = pageContent.indexOf('<NewArrivalSection />');
    const homeCategoriesIndex = pageContent.indexOf('<HomeCategoriesSection />');
    assert.ok(newArrivalIndex !== -1, 'NewArrivalSection must exist on Home page');
    assert.ok(homeCategoriesIndex !== -1, 'HomeCategoriesSection must exist on Home page');
    assert.ok(
      homeCategoriesIndex > newArrivalIndex,
      'HomeCategoriesSection must be placed directly under NewArrivalSection'
    );

    // URL parameter parsing for category and subcategory on initial mount
    assert.match(
      pageContent,
      /categoryParam\s*=\s*params\.get\('category'\)/,
      'app/page.tsx must parse category URL parameter on cold mount'
    );
    assert.match(
      pageContent,
      /subcategoryParam\s*=\s*params\.get\('subcategory'\)/,
      'app/page.tsx must parse subcategory URL parameter on cold mount'
    );
  });

  await t.test('4. ShopCatalog implements multi-stage flow: Categories -> Subcategories -> Products with dynamic breadcrumbs', () => {
    const catalogPath = path.join(ROOT_DIR, 'components', 'ShopCatalog.tsx');
    const catalogContent = fs.readFileSync(catalogPath, 'utf8');

    // Subcategories hub view condition
    assert.ok(
      catalogContent.includes('isShowingSubcategoriesHub'),
      'ShopCatalog must have dedicated state/view for Subcategories Hub'
    );

    // Breadcrumbs support full path
    assert.ok(
      catalogContent.includes('aria-label="Breadcrumbs"'),
      'ShopCatalog must have accessible dynamic breadcrumbs navigation'
    );

    // Subcategory card navigation
    assert.match(
      catalogContent,
      /setActiveSubcategoryFilter\(String\(subcat\.id\)\)/,
      'Clicking a subcategory card must activate that subcategory filter'
    );

    // Option to view all category products
    assert.ok(
      catalogContent.includes('showAllCategoryProducts'),
      'ShopCatalog must support viewing all products of a category'
    );

    // Back to subcategories button
    assert.ok(
      catalogContent.includes('العودة إلى أقسام') || catalogContent.includes('العودة لأقسام'),
      'ShopCatalog must provide clear back navigation from subcategory products to subcategories'
    );

    // Empty state for subcategory
    assert.ok(
      catalogContent.includes('لا توجد منتجات متاحة'),
      'ShopCatalog must display clean Arabic empty state when a subcategory has no products'
    );

    // Unsplash dummy image fallbacks eliminated
    assert.ok(
      !catalogContent.includes('https://images.unsplash.com/photo-1600121848594-d8644e57abab'),
      'ShopCatalog must not use fake Unsplash fallback URLs in production product cards'
    );
  });

  await t.test('5. ProductDetailView implements full breadcrumbs, cold reload recovery, and eliminates fake images', () => {
    const detailPath = path.join(ROOT_DIR, 'components', 'ProductDetailView.tsx');
    const detailContent = fs.readFileSync(detailPath, 'utf8');

    // Cold reload recovery with productService.getProduct
    assert.match(
      detailContent,
      /productService\s*\.\s*getProduct\(\s*numId\s*\)/,
      'ProductDetailView must fetch product from backend if not found in cache'
    );

    // Loading skeleton for cold reload
    assert.ok(
      detailContent.includes('animate-pulse'),
      'ProductDetailView must display loading skeleton during data resolution'
    );

    // Stock status badge
    assert.ok(
      detailContent.includes('متوفر في المعرض والمخزن'),
      'ProductDetailView must display Arabic In Stock status badge'
    );

    // Discount badge and price representation
    assert.ok(
      detailContent.includes('discountPercentage'),
      'ProductDetailView must calculate and display discount percentages'
    );

    // Breadcrumbs with Category and Subcategory clickable links
    assert.ok(
      detailContent.includes('aria-label="Breadcrumbs"'),
      'ProductDetailView must have accessible breadcrumbs'
    );
    assert.match(
      detailContent,
      /navigateTo\('shop',\s*\{\s*categoryId:\s*String\(category\.id\)/,
      'ProductDetailView breadcrumbs must link back to Category'
    );
    assert.match(
      detailContent,
      /navigateTo\('shop',\s*\{[\s\S]*?subcategoryId:\s*String\(subcategory\.id\)/,
      'ProductDetailView breadcrumbs must link back to Subcategory'
    );

    // Unsplash fallback eliminated
    assert.ok(
      !detailContent.includes('https://images.unsplash.com/photo-1600121848594-d8644e57abab'),
      'ProductDetailView must not use dummy Unsplash fallback URLs in production product view'
    );
  });
});
