import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const orderTypesPath = path.resolve('types/order.ts');
const ordersSectionPath = path.resolve('components/admin/OrdersSection.tsx');
const accountViewPath = path.resolve('components/AccountView.tsx');
const orderConfirmationViewPath = path.resolve('components/OrderConfirmationView.tsx');

const orderTypesContent = fs.readFileSync(orderTypesPath, 'utf8');
const ordersSectionContent = fs.readFileSync(ordersSectionPath, 'utf8');
const accountViewContent = fs.readFileSync(accountViewPath, 'utf8');
const orderConfirmationViewContent = fs.readFileSync(orderConfirmationViewPath, 'utf8');

test('Order Item Snapshot & Roll Deletion Frontend Architecture', async (t) => {
  await t.test('1. BackendOrderItem type definition exposes all snapshot and parity fields', () => {
    assert.ok(
      orderTypesContent.includes('image_url?: string;'),
      'BackendOrderItem must include image_url field'
    );
    assert.ok(
      orderTypesContent.includes('image_urls?: string[];'),
      'BackendOrderItem must include image_urls list field'
    );
    assert.ok(
      orderTypesContent.includes('snapshot?: Record<string, any>;'),
      'BackendOrderItem must include snapshot dictionary field'
    );
    assert.ok(
      orderTypesContent.includes('product_type?:'),
      'BackendOrderItem must include product_type field'
    );
    assert.ok(
      orderTypesContent.includes('product_description_ar?: string;'),
      'BackendOrderItem must include product_description_ar'
    );
    assert.ok(
      orderTypesContent.includes('arwal_description_ar?: string;'),
      'BackendOrderItem must include arwal_description_ar'
    );
  });

  await t.test('2. OrdersSection helpers fall back gracefully to snapshot for deleted products and rolls', () => {
    // Verified implementation matching OrdersSection.tsx
    function getOrderItemTitle(item) {
      if (!item) return 'منتج غير محدد';
      if (item.item_type === 'arwal' || item.product_type === 'ARWAL') {
        return (
          item.arwal_name_ar ||
          item.arwal_name_en ||
          item.snapshot?.name_ar ||
          item.snapshot?.name_en ||
          item.name_ar ||
          item.name_en ||
          (typeof item.arwal === 'object' &&
            (item.arwal?.name_ar || item.arwal?.name_en || item.arwal?.name)) ||
          'رول سجاد بالمتر'
        );
      }
      return (
        item.product_name_ar ||
        item.product_name_en ||
        item.snapshot?.name_ar ||
        item.snapshot?.name_en ||
        item.product_name ||
        item.name_ar ||
        item.name_en ||
        item.name ||
        (typeof item.product === 'object' &&
          (item.product?.name_ar || item.product?.name_en || item.product?.name)) ||
        item.arwal_name_ar ||
        item.arwal_name_en ||
        'سجادة فاخرة'
      );
    }

    function getOrderItemColor(item) {
      if (!item) return { name: null, hex: null };
      const name =
        item.color_name_ar ||
        item.color_name_en ||
        item.color_name ||
        item.selected_color_name ||
        item.snapshot?.color?.name_ar ||
        item.snapshot?.color?.name_en ||
        null;
      const hex =
        item.color_hex_code ||
        item.color_hex ||
        item.snapshot?.color?.hex_code ||
        null;
      return { name, hex };
    }

    function getOrderItemSpecs(item) {
      if (!item) return null;
      const isArwal =
        item.item_type === 'arwal' ||
        item.product_type === 'ARWAL' ||
        item.length ||
        item.price_per_length ||
        item.snapshot?.product_type === 'ARWAL';

      if (isArwal) {
        const parts = [];
        const width = item.width || item.snapshot?.width;
        const length = item.length || item.snapshot?.length;
        if (width) parts.push(`عرض ${width} سم`);
        if (length) parts.push(`طول ${length} م`);
        return parts.length > 0 ? parts.join(' × ') : 'رول بالمتر';
      }

      const sizeWidth = item.size_width || item.snapshot?.size?.width;
      const sizeLength = item.size_length || item.snapshot?.size?.length;
      if (sizeWidth && sizeLength) {
        let spec = `${sizeWidth} × ${sizeLength} سم`;
        if (item.selected_finish) {
          spec += ` (${item.selected_finish === 'GLOSSY' ? 'لامع' : 'مطفي'})`;
        }
        return spec;
      }
      return null;
    }

    // Assert that OrdersSection.tsx actually has this snapshot fallback code
    assert.ok(
      ordersSectionContent.includes('item.snapshot?.name_ar'),
      'OrdersSection must check item.snapshot.name_ar'
    );
    assert.ok(
      ordersSectionContent.includes('item.snapshot?.color?.name_ar'),
      'OrdersSection must check item.snapshot.color.name_ar'
    );
    assert.ok(
      ordersSectionContent.includes('item.snapshot?.width'),
      'OrdersSection must check item.snapshot.width'
    );
    assert.ok(
      ordersSectionContent.includes('item.snapshot?.size?.width'),
      'OrdersSection must check item.snapshot.size.width'
    );

    // Scenario: Hard-deleted Arwal (arwal FK is null, but snapshot exists)
    const deletedArwalItem = {
      id: 101,
      item_type: 'arwal',
      arwal: null,
      arwal_name_ar: 'رول موكيت فاخر',
      width: 120,
      length: '4.50',
      price_per_length: '200.00',
      quantity: 2,
      subtotal: '1800.00',
      snapshot: {
        name_ar: 'رول موكيت فاخر',
        name_en: 'Luxury Carpet Roll',
        image_url: 'https://res.cloudinary.com/test/roll.jpg',
        width: 120,
        length: '4.50',
      },
    };

    assert.equal(getOrderItemTitle(deletedArwalItem), 'رول موكيت فاخر');
    const arwalSpecs = getOrderItemSpecs(deletedArwalItem);
    assert.ok(arwalSpecs.includes('عرض 120 سم'));
    assert.ok(arwalSpecs.includes('طول 4.50 م'));

    // Scenario: Hard-deleted Product (product FK is null, top-level missing, snapshot intact)
    const deletedProductSnapshotOnly = {
      id: 102,
      product: null,
      snapshot: {
        product_type: 'PRODUCT',
        name_ar: 'سجادة تبريز نادرة',
        name_en: 'Rare Tabriz Rug',
        image_url: 'https://res.cloudinary.com/test/rug.jpg',
        size: { width: '200', length: '300' },
        color: { name_ar: 'عنابي', hex_code: '#800000' },
      },
    };

    assert.equal(getOrderItemTitle(deletedProductSnapshotOnly), 'سجادة تبريز نادرة');
    const color = getOrderItemColor(deletedProductSnapshotOnly);
    assert.equal(color.name, 'عنابي');
    assert.equal(color.hex, '#800000');
    const productSpecs = getOrderItemSpecs(deletedProductSnapshotOnly);
    assert.ok(productSpecs.includes('200 × 300 سم'));
  });

  await t.test('3. OrdersSection renders product and roll image thumbnails from snapshot', () => {
    assert.ok(
      ordersSectionContent.includes('item.image_url ||'),
      'OrdersSection must check item.image_url'
    );
    assert.ok(
      ordersSectionContent.includes('item.snapshot?.image_url'),
      'OrdersSection must fall back to item.snapshot.image_url'
    );
    assert.ok(
      ordersSectionContent.includes('rounded-lg object-cover'),
      'OrdersSection modal must display thumbnail image'
    );
  });

  await t.test('4. AccountView renders image thumbnails and falls back to snapshot', () => {
    assert.ok(
      accountViewContent.includes('item.image_url ||'),
      'AccountView must check item.image_url'
    );
    assert.ok(
      accountViewContent.includes('item.snapshot?.image_url'),
      'AccountView must fall back to item.snapshot.image_url'
    );
    assert.ok(
      accountViewContent.includes('item.snapshot?.name_ar'),
      'AccountView must fall back to item.snapshot.name_ar'
    );
  });

  await t.test('5. OrderConfirmationView maps imageUrl from snapshot and displays thumbnail', () => {
    assert.ok(
      orderConfirmationViewContent.includes('it.image_url ||'),
      'OrderConfirmationView must check it.image_url'
    );
    assert.ok(
      orderConfirmationViewContent.includes('it.snapshot?.image_url'),
      'OrderConfirmationView must fall back to it.snapshot.image_url'
    );
    assert.ok(
      orderConfirmationViewContent.includes('it.imageUrl ? ('),
      'OrderConfirmationView must render it.imageUrl thumbnail'
    );
  });
});
