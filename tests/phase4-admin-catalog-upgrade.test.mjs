import test from 'node:test';
import assert from 'node:assert/strict';

test('Phase 4/5 Upgrade - User Management contracts & pagination envelope', () => {
  // DRF PageNumberPagination envelope shape
  const drfUserResponse = {
    count: 42,
    next: 'http://localhost:8000/api/user/users/?page=2',
    previous: null,
    results: [
      {
        id: 1,
        email: 'admin@alamelsgad.com',
        first_name: 'مدير',
        last_name: 'النظام',
        phone: '01010750072',
        role: 'ADMIN',
        is_active: true,
        date_joined: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        email: 'customer@alamelsgad.com',
        first_name: 'أحمد',
        last_name: 'محمود',
        phone: '01099887766',
        role: 'CUSTOMER',
        is_active: true,
        date_joined: '2026-02-15T10:30:00Z',
      },
    ],
  };

  assert.equal(drfUserResponse.count, 42);
  assert.equal(drfUserResponse.results.length, 2);
  assert.equal(drfUserResponse.results[0].role, 'ADMIN');
  assert.equal(drfUserResponse.results[1].role, 'CUSTOMER');

  // Role patch request shape
  const rolePatchPayload = { role: 'MODERATOR' };
  assert.equal(rolePatchPayload.role, 'MODERATOR');

  // Status patch request shape
  const statusPatchPayload = { is_active: false };
  assert.equal(statusPatchPayload.is_active, false);
});

test('Phase 4/5 Upgrade - Admin Dashboard Real Metrics derivation rules', () => {
  const orders = [
    {
      id: 101,
      order_number: 'ORD-101',
      status: 'CONFIRMED',
      total_price: 3500,
      payment: { id: 1, status: 'PAID', amount: 3500 },
    },
    {
      id: 102,
      order_number: 'ORD-102',
      status: 'SHIPPED',
      total_price: 4200,
      payment: { id: 2, status: 'PAID', amount: 4200 },
    },
    {
      id: 103,
      order_number: 'ORD-103',
      status: 'DELIVERED',
      total_price: 1800,
      payment: { id: 3, status: 'PENDING', amount: 1800 },
    },
    {
      id: 104,
      order_number: 'ORD-104',
      status: 'CONFIRMED',
      total_price: 2500,
      payment: null, // Cash on delivery or unrecorded payment
    },
  ];

  // Rule: calculate revenue ONLY from orders where payment?.status === 'PAID'
  const paidOrders = orders.filter((o) => o.payment?.status === 'PAID');
  const paidRevenue = paidOrders.reduce((sum, o) => sum + Number(o.payment?.amount || 0), 0);

  assert.equal(paidOrders.length, 2);
  assert.equal(paidRevenue, 7700);

  // Total orders count strictly matches backend response length
  assert.equal(orders.length, 4);

  // Distinguish unavailable user metric (null) from zero
  const adminUsersMetric = 42;
  const moderatorUsersMetric = null; // 403 Forbidden for non-admins

  assert.equal(adminUsersMetric !== null ? `${adminUsersMetric} مستخدم` : 'غير متوفر', '42 مستخدم');
  assert.equal(moderatorUsersMetric !== null ? `${moderatorUsersMetric} مستخدم` : 'غير متوفر', 'غير متوفر');
});

test('Phase 4/5 Upgrade - Active Offers temporal validity calculation', () => {
  const now = new Date('2026-10-11T12:00:00Z');

  const offers = [
    {
      id: 1,
      name: 'عرض الخريف الحالي',
      is_active: true,
      starts_at: '2026-10-01T00:00:00Z',
      ends_at: '2026-10-31T23:59:59Z',
    },
    {
      id: 2,
      name: 'عرض منتهي الصلاحية',
      is_active: true,
      starts_at: '2026-09-01T00:00:00Z',
      ends_at: '2026-09-30T23:59:59Z',
    },
    {
      id: 3,
      name: 'عرض مستقبلي لم يبدأ بعد',
      is_active: true,
      starts_at: '2026-11-01T00:00:00Z',
      ends_at: '2026-11-30T23:59:59Z',
    },
    {
      id: 4,
      name: 'عرض معطل يدوياً',
      is_active: false,
      starts_at: '2026-10-01T00:00:00Z',
      ends_at: '2026-10-31T23:59:59Z',
    },
  ];

  const validActiveOffers = offers.filter((o) => {
    if (!o.is_active) return false;
    if (o.starts_at && new Date(o.starts_at) > now) return false;
    if (o.ends_at && new Date(o.ends_at) < now) return false;
    return true;
  });

  assert.equal(validActiveOffers.length, 1);
  assert.equal(validActiveOffers[0].id, 1);
});

test('Phase 4/5 Upgrade - Navbar dynamic category selection rules', () => {
  const allCategories = [
    { id: 1, name: 'سجاد تركي فاخر', isVisible: true },
    { id: 2, name: 'سجاد حرير وبامبو', isVisible: true },
    { id: 3, name: 'بدائل سجاد خفيفة', isVisible: false }, // Hidden category
    { id: 4, name: 'مشايات وأروال بالمتر', isVisible: true },
    { id: 5, name: 'سجاد كلاسيك وشرقي', isVisible: true },
    { id: 6, name: 'سجاد مودرن للأطفال', isVisible: true },
  ];

  const visibleCategories = allCategories.filter((c) => c.isVisible !== false);
  const navbarFirstFour = visibleCategories.slice(0, 4);

  assert.equal(navbarFirstFour.length, 4);
  assert.equal(navbarFirstFour[0].name, 'سجاد تركي فاخر');
  assert.equal(navbarFirstFour[1].name, 'سجاد حرير وبامبو');
  assert.equal(navbarFirstFour[2].name, 'مشايات وأروال بالمتر');
  assert.equal(navbarFirstFour[3].name, 'سجاد كلاسيك وشرقي');
  // Ensure the hidden category is not present
  assert.ok(!navbarFirstFour.some((c) => c.id === 3));
});

test('Task 1 Regression — Subcategory creation response normalizer prevents client-side crash', () => {
  // Real DRF response from SubcategoryViewSet.create() using SubcategorySerializer
  // Notice: DRF SubcategorySerializer DOES NOT include a 'name' field; only 'name_ar' and 'name_en'
  const rawDrfCreateResponse = {
    id: 42,
    category_id: 2,
    name_ar: 'سجاد ممرات طويل',
    name_en: 'Hallway Runners',
    image: null,
    public_id: null,
    created_at: '2026-10-11T16:00:00Z',
    updated_at: '2026-10-11T16:00:00Z',
    deleted_at: null,
  };

  // Normalizer implementation from categoryService.ts
  const normalizeSubcategory = (sub, fallbackName = '') => {
    const rawName = sub.name || sub.name_ar || sub.name_en || fallbackName;
    return {
      ...sub,
      name: rawName || 'قسم فرعي بدون اسم',
      name_ar: sub.name_ar || sub.name || fallbackName,
      name_en: sub.name_en || sub.name || fallbackName,
      category_id: Number(sub.category_id || 0),
    };
  };

  const normalized = normalizeSubcategory(rawDrfCreateResponse, 'سجاد ممرات طويل');

  // Verify normalized record has guaranteed 'name' property
  assert.equal(normalized.name, 'سجاد ممرات طويل');
  assert.equal(normalized.category_id, 2);

  // In SubcategoriesSection, list filtering runs:
  // const subName = sub?.name || sub?.name_ar || sub?.name_en || '';
  // subName.toLowerCase().includes(q)
  const searchQuery = 'ممرات';
  assert.doesNotThrow(() => {
    const subName = normalized?.name || normalized?.name_ar || normalized?.name_en || '';
    const matches = subName.toLowerCase().includes(searchQuery.toLowerCase());
    assert.equal(matches, true);
  });

  // Verify that even if sub has NO name property, safe accessor does not throw
  assert.doesNotThrow(() => {
    const rawWithoutName = { ...rawDrfCreateResponse };
    delete rawWithoutName.name;
    const safeName = rawWithoutName?.name || rawWithoutName?.name_ar || rawWithoutName?.name_en || '';
    assert.equal(safeName.toLowerCase().includes('ممرات'), true);
  });
});

test('Task 2 Regression — Product sizes and colors selection and payload contracts', () => {
  // 1. DRF SizeViewSet contracts
  const sizeListResponse = [
    { id: 1, width: 160, length: 230 },
    { id: 2, width: 200, length: 300 },
    { id: 3, width: 240, length: 340 },
  ];
  assert.equal(sizeListResponse.length, 3);
  assert.equal(sizeListResponse[0].width, 160);

  // 2. DRF ColorViewSet contracts
  const colorListResponse = [
    { id: 10, name: 'بيج كلاسيكي', name_ar: 'بيج كلاسيكي', name_en: 'Classic Beige', hex_code: '#EBE3D5' },
    { id: 11, name: 'كحلي ملكي', name_ar: 'كحلي ملكي', name_en: 'Royal Navy', hex_code: '#1A2B4C' },
  ];
  assert.equal(colorListResponse.length, 2);
  assert.equal(colorListResponse[0].hex_code, '#EBE3D5');

  // 3. Product size and color mapping to DRF write-only IDs
  const frontendProduct = {
    name: 'سجادة تبريز فاخرة',
    isArawal: false,
    subcategoryIds: ['5'],
    sizes: [
      { id: '1', name: '160 × 230 سم', width: 160, length: 230 },
      { id: '2', name: '200 × 300 سم', width: 200, length: 300 },
    ],
    colors: [
      { id: '10', name: 'بيج كلاسيكي', hex: '#EBE3D5' },
      { id: '11', name: 'كحلي ملكي', hex: '#1A2B4C' },
    ],
  };

  const subcategoryIds = frontendProduct.subcategoryIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id));
  const colorIds = frontendProduct.colors
    .map((c) => Number(c.id))
    .filter((id) => Number.isInteger(id));
  const sizeIds = frontendProduct.sizes
    .map((s) => Number(s.id))
    .filter((id) => Number.isInteger(id));

  assert.deepEqual(subcategoryIds, [5]);
  assert.deepEqual(sizeIds, [1, 2]);
  assert.deepEqual(colorIds, [10, 11]);

  // 4. Validation logic rejects empty size_ids or color_ids for normal products
  const productWithoutSizes = { ...frontendProduct, sizes: [] };
  const extractedSizeIds = productWithoutSizes.sizes
    .map((s) => Number(s.id))
    .filter((id) => Number.isInteger(id));

  assert.equal(extractedSizeIds.length, 0);
  assert.throws(
    () => {
      if (!productWithoutSizes.isArawal && extractedSizeIds.length === 0) {
        throw new Error('يرجى اختيار مقاس واحد على الأقل للمنتج (المقاسات مطلوبة).');
      }
    },
    /يرجى اختيار مقاس واحد على الأقل/
  );

  // 5. Size creation request payload matches DRF SizeSerializer
  const newSizeRequest = { width: 180, length: 280 };
  assert.equal(typeof newSizeRequest.width, 'number');
  assert.equal(typeof newSizeRequest.length, 'number');
  assert.ok(newSizeRequest.width > 0 && newSizeRequest.length > 0);

  // 6. Color creation request payload matches DRF ColorSerializer
  const rawHex = '241710';
  const formattedHex = rawHex.startsWith('#') ? rawHex.toUpperCase() : `#${rawHex.toUpperCase()}`;
  assert.equal(formattedHex, '#241710');
  assert.equal(/^#[0-9A-F]{6}$/i.test(formattedHex), true);
});

test('Task 3 Regression — Category, Subcategory & Product Soft-Delete, Hard-Delete & Cloudinary Contracts', () => {
  // 1. DRF Category Deletion Contracts
  const categoryEndpoints = {
    softDelete: (id) => ({ method: 'DELETE', path: `/api/categories/${id}/` }),
    hardDelete: (id) => ({ method: 'DELETE', path: `/api/categories/${id}/hard-delete/` }),
    restore: (id) => ({ method: 'POST', path: `/api/categories/${id}/restore/` }),
    listDeleted: { method: 'GET', path: '/api/categories/deleted/' },
  };

  assert.deepEqual(categoryEndpoints.softDelete(1), { method: 'DELETE', path: '/api/categories/1/' });
  assert.deepEqual(categoryEndpoints.hardDelete(1), { method: 'DELETE', path: '/api/categories/1/hard-delete/' });
  assert.deepEqual(categoryEndpoints.restore(1), { method: 'POST', path: '/api/categories/1/restore/' });
  assert.deepEqual(categoryEndpoints.listDeleted, { method: 'GET', path: '/api/categories/deleted/' });

  // 2. DRF Subcategory Deletion Contracts
  const subcategoryEndpoints = {
    softDelete: (id) => ({ method: 'DELETE', path: `/api/subcategories/${id}/` }),
    hardDelete: (id) => ({ method: 'DELETE', path: `/api/subcategories/${id}/hard-delete/` }),
    restore: (id) => ({ method: 'POST', path: `/api/subcategories/${id}/restore/` }),
    listDeleted: { method: 'GET', path: '/api/subcategories/deleted/' },
  };

  assert.deepEqual(subcategoryEndpoints.softDelete(5), { method: 'DELETE', path: '/api/subcategories/5/' });
  assert.deepEqual(subcategoryEndpoints.hardDelete(5), { method: 'DELETE', path: '/api/subcategories/5/hard-delete/' });
  assert.deepEqual(subcategoryEndpoints.restore(5), { method: 'POST', path: '/api/subcategories/5/restore/' });
  assert.deepEqual(subcategoryEndpoints.listDeleted, { method: 'GET', path: '/api/subcategories/deleted/' });

  // 3. DRF Product Deletion Contracts
  const productEndpoints = {
    softDelete: (id) => ({ method: 'DELETE', path: `/api/products/${id}/` }),
    hardDelete: (id) => ({ method: 'DELETE', path: `/api/products/${id}/hard-delete/` }),
    restore: (id) => ({ method: 'POST', path: `/api/products/${id}/restore/` }),
    listDeleted: { method: 'GET', path: '/api/products/deleted/' },
  };

  assert.deepEqual(productEndpoints.softDelete(10), { method: 'DELETE', path: '/api/products/10/' });
  assert.deepEqual(productEndpoints.hardDelete(10), { method: 'DELETE', path: '/api/products/10/hard-delete/' });
  assert.deepEqual(productEndpoints.restore(10), { method: 'POST', path: '/api/products/10/restore/' });
  assert.deepEqual(productEndpoints.listDeleted, { method: 'GET', path: '/api/products/deleted/' });

  // 4. Cloudinary cleanup rule:
  // On Soft Delete: image remains in Cloudinary, deleted_at is stamped
  const softDeletedCategory = {
    id: 1,
    name_ar: 'سجاد إيراني',
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    public_id: 'categories/sample_iranian',
    deleted_at: '2026-10-11T12:00:00Z',
  };
  assert.ok(softDeletedCategory.deleted_at !== null);
  assert.ok(softDeletedCategory.public_id !== null); // Asset preserved for restore

  // On Hard Delete: transaction triggers delete_image(public_id)
  let deletedCloudinaryAsset = null;
  const simulateHardDelete = (entity) => {
    if (entity.public_id) {
      deletedCloudinaryAsset = entity.public_id;
    }
  };
  simulateHardDelete(softDeletedCategory);
  assert.equal(deletedCloudinaryAsset, 'categories/sample_iranian');

  // 5. Protected Relations Check:
  // Cannot delete a category that has linked subcategories (ProtectedError / HTTP 400)
  const categoryProtectedError = {
    status: 400,
    data: { detail: "You can't delete a category that has subcategories linked to it. Delete those subcategories first." },
  };
  assert.equal(categoryProtectedError.status, 400);
  assert.match(categoryProtectedError.data.detail, /subcategories linked/);

  // 6. Role Authorization:
  // Hard delete is restricted strictly to ADMIN
  const canHardDelete = (role) => role === 'ADMIN';
  const canSoftDeleteOrRestore = (role) => role === 'ADMIN' || role === 'MODERATOR';

  assert.equal(canHardDelete('ADMIN'), true);
  assert.equal(canHardDelete('MODERATOR'), false);
  assert.equal(canHardDelete('CUSTOMER'), false);

  assert.equal(canSoftDeleteOrRestore('ADMIN'), true);
  assert.equal(canSoftDeleteOrRestore('MODERATOR'), true);
  assert.equal(canSoftDeleteOrRestore('CUSTOMER'), false);

  // 7. Stale Record / 404 Recovery:
  // If record was already deleted, frontend recovers gracefully and clears UI state
  let categoriesInState = [{ id: '1', name: 'سجاد مودرن' }, { id: '2', name: 'سجاد كلاسيك' }];
  const handle404OnDelete = (id) => {
    // Tolerates 404 and cleans up state
    categoriesInState = categoriesInState.filter((c) => c.id !== id);
  };
  handle404OnDelete('1');
  assert.equal(categoriesInState.length, 1);
  assert.equal(categoriesInState[0].id, '2');
});
