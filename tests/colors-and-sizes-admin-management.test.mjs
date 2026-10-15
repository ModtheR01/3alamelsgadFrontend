import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('Colors and Sizes Management Suite', async (t) => {
  await t.test('1. colorService and sizeService API methods & endpoints', () => {
    const colorServiceContent = fs.readFileSync(
      path.join(projectRoot, 'lib/api/services/colorService.ts'),
      'utf8'
    );
    const sizeServiceContent = fs.readFileSync(
      path.join(projectRoot, 'lib/api/services/sizeService.ts'),
      'utf8'
    );

    // Endpoints for colors
    assert.ok(
      colorServiceContent.includes("'/products/colors/'"),
      'colorService must call /products/colors/ endpoint'
    );
    assert.ok(
      colorServiceContent.includes('getColors'),
      'colorService must provide getColors'
    );
    assert.ok(
      colorServiceContent.includes('createColor'),
      'colorService must provide createColor'
    );
    assert.ok(
      colorServiceContent.includes('updateColor'),
      'colorService must provide updateColor'
    );
    assert.ok(
      colorServiceContent.includes('deleteColor'),
      'colorService must provide deleteColor'
    );

    // Endpoints for sizes
    assert.ok(
      sizeServiceContent.includes("'/products/sizes/'"),
      'sizeService must call /products/sizes/ endpoint'
    );
    assert.ok(
      sizeServiceContent.includes('getSizes'),
      'sizeService must provide getSizes'
    );
    assert.ok(
      sizeServiceContent.includes('createSize'),
      'sizeService must provide createSize'
    );
    assert.ok(
      sizeServiceContent.includes('updateSize'),
      'sizeService must provide updateSize'
    );
    assert.ok(
      sizeServiceContent.includes('deleteSize'),
      'sizeService must provide deleteSize'
    );
  });

  await t.test('2. AdminLayout sidebar contains "إدارة الألوان" and "إدارة المقاسات"', () => {
    const adminLayoutContent = fs.readFileSync(
      path.join(projectRoot, 'components/admin/AdminLayout.tsx'),
      'utf8'
    );

    assert.ok(
      adminLayoutContent.includes("id: 'colors'"),
      'AdminLayout must define colors section'
    );
    assert.ok(
      adminLayoutContent.includes("label: 'إدارة الألوان'"),
      'AdminLayout must have label إدارة الألوان'
    );
    assert.ok(
      adminLayoutContent.includes("id: 'sizes'"),
      'AdminLayout must define sizes section'
    );
    assert.ok(
      adminLayoutContent.includes("label: 'إدارة المقاسات'"),
      'AdminLayout must have label إدارة المقاسات'
    );
    assert.ok(
      adminLayoutContent.includes('Palette') && adminLayoutContent.includes('Ruler'),
      'AdminLayout must import Palette and Ruler icons'
    );
  });

  await t.test('3. AdminDashboard conditionally renders ColorsSection and SizesSection', () => {
    const adminDashboardContent = fs.readFileSync(
      path.join(projectRoot, 'components/AdminDashboard.tsx'),
      'utf8'
    );

    assert.ok(
      adminDashboardContent.includes("import ColorsSection from './admin/ColorsSection';"),
      'AdminDashboard must import ColorsSection'
    );
    assert.ok(
      adminDashboardContent.includes("import SizesSection from './admin/SizesSection';"),
      'AdminDashboard must import SizesSection'
    );
    assert.ok(
      adminDashboardContent.includes("activeSection === 'colors'"),
      'AdminDashboard must check activeSection === "colors"'
    );
    assert.ok(
      adminDashboardContent.includes("activeSection === 'sizes'"),
      'AdminDashboard must check activeSection === "sizes"'
    );
  });

  await t.test('4. ColorsSection component handles full CRUD, HEX preview, and error handling', () => {
    const colorsSectionContent = fs.readFileSync(
      path.join(projectRoot, 'components/admin/ColorsSection.tsx'),
      'utf8'
    );

    assert.ok(
      colorsSectionContent.includes('colorService.getColors()'),
      'ColorsSection must fetch registered colors from backend'
    );
    assert.ok(
      colorsSectionContent.includes('colorService.createColor'),
      'ColorsSection must support creating a color'
    );
    assert.ok(
      colorsSectionContent.includes('colorService.updateColor'),
      'ColorsSection must support updating a color'
    );
    assert.ok(
      colorsSectionContent.includes('colorService.deleteColor'),
      'ColorsSection must support deleting a color'
    );
    assert.ok(
      colorsSectionContent.includes('backgroundColor: hex'),
      'ColorsSection must visually preview color with hex value'
    );
    assert.ok(
      colorsSectionContent.includes('onRequestDeleteConfirm'),
      'ColorsSection must respect confirmation dialog for deletion'
    );
  });

  await t.test('5. SizesSection component handles dimensions in cm, area, full CRUD and Arwal distinction', () => {
    const sizesSectionContent = fs.readFileSync(
      path.join(projectRoot, 'components/admin/SizesSection.tsx'),
      'utf8'
    );

    assert.ok(
      sizesSectionContent.includes('sizeService.getSizes()'),
      'SizesSection must fetch registered sizes from backend'
    );
    assert.ok(
      sizesSectionContent.includes('sizeService.createSize'),
      'SizesSection must support creating a size'
    );
    assert.ok(
      sizesSectionContent.includes('sizeService.updateSize'),
      'SizesSection must support updating a size'
    );
    assert.ok(
      sizesSectionContent.includes('sizeService.deleteSize'),
      'SizesSection must support deleting a size'
    );
    assert.ok(
      sizesSectionContent.includes('سم'),
      'SizesSection must display dimensions in centimeters (سم)'
    );
    assert.ok(
      sizesSectionContent.includes('Arwal') || sizesSectionContent.includes('أروال'),
      'SizesSection must preserve distinction for Arwal roll runner products'
    );
  });

  await t.test('6. ProductsSection integrates with existing database colors & sizes and immediate updates', () => {
    const productsSectionContent = fs.readFileSync(
      path.join(projectRoot, 'components/admin/ProductsSection.tsx'),
      'utf8'
    );

    assert.ok(
      productsSectionContent.includes('productService.getSizes()'),
      'ProductsSection must fetch sizes from backend'
    );
    assert.ok(
      productsSectionContent.includes('productService.getColors()'),
      'ProductsSection must fetch colors from backend'
    );
    assert.ok(
      productsSectionContent.includes('handleCreateAndAddColor'),
      'ProductsSection must support adding a color inline'
    );
    assert.ok(
      productsSectionContent.includes('handleCreateAndAddSize'),
      'ProductsSection must support adding a size inline'
    );
    assert.ok(
      productsSectionContent.includes('setAvailableColors((prev) => [...prev, created])'),
      'ProductsSection must immediately make new colors selectable'
    );
    assert.ok(
      productsSectionContent.includes('setAvailableSizes((prev) => [...prev, created])'),
      'ProductsSection must immediately make new sizes selectable'
    );
  });
});
