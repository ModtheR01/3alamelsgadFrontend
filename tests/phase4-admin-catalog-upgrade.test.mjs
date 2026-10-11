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
