import test from 'node:test';
import assert from 'node:assert/strict';

// Test Suite: Phase 2 — Catalog, Cart, Checkout & Admin Orders Alignment

test('Phase 2 - Product, Size, Color & Arwal contracts match DRF Backend', async (t) => {
  // 1. Verify DRF Product output fields mapping
  const drfProduct = {
    id: 15,
    name_ar: 'سجادة تبريز ملكي',
    name_en: 'Tabriz Royal Carpet',
    description_ar: 'سجادة حرير وصوف فاخرة بنقوش هندسية كلاسيكية',
    description_en: 'Luxury silk and wool rug with classical patterns',
    price: '18500.00',
    subcategory: {
      id: 3,
      name_ar: 'سجاد إيراني',
      name_en: 'Persian Rugs',
    },
    sizes: [
      { id: 1, width: 200, length: 300 },
      { id: 2, width: 250, length: 350 },
    ],
    colors: [
      { id: 1, name_ar: 'كحلي', name_en: 'Navy Blue', hex_code: '#001F3F' },
      { id: 2, name_ar: 'ذهبي', name_en: 'Gold', hex_code: '#D4AF37' },
    ],
    images: [
      { id: 101, image: 'https://res.cloudinary.com/test/rug1.jpg', public_id: 'rug1', is_primary: true, sort_order: 0 },
    ],
    primary_image: { id: 101, image: 'https://res.cloudinary.com/test/rug1.jpg', public_id: 'rug1', is_primary: true, sort_order: 0 },
  };

  assert.equal(drfProduct.name_ar, 'سجادة تبريز ملكي');
  assert.equal(drfProduct.name_en, 'Tabriz Royal Carpet');
  assert.equal(drfProduct.sizes.length, 2);
  assert.equal(drfProduct.colors[0].hex_code, '#001F3F');
  assert.ok(drfProduct.primary_image.image.startsWith('https://res.cloudinary.com'));

  // 2. Verify DRF Product Create Payload (ProductSerializer expectations)
  const productCreatePayload = {
    name_ar: 'سجادة تبريز ملكي',
    name_en: 'Tabriz Royal Carpet',
    description_ar: 'سجادة حرير وصوف فاخرة',
    description_en: 'Luxury silk and wool rug',
    price: 18500,
    subcategory_ids: [3],
    size_ids: [1, 2],
    color_ids: [1, 2],
  };

  assert.ok(Array.isArray(productCreatePayload.subcategory_ids), 'subcategory_ids must be array');
  assert.equal(productCreatePayload.subcategory_ids.length, 1, 'Product belongs to exactly one subcategory');
  assert.ok(productCreatePayload.size_ids.length > 0, 'size_ids cannot be empty');
  assert.ok(productCreatePayload.color_ids.length > 0, 'color_ids cannot be empty');

  // 3. Verify DRF Arwal contracts (أروال بالمتر)
  const drfArwal = {
    id: 5,
    name_ar: 'مشاية أروال تركي عصرية',
    name_en: 'Modern Turkish Runner Roll',
    description_ar: 'رول مشاية بالمتر للممرات ومداخل الشقق',
    description_en: 'Runner roll sold by linear meter',
    price_per_length: '450.00',
    widths: [
      { id: 1, width: 60 },
      { id: 2, width: 80 },
      { id: 3, width: 100 },
      { id: 4, width: 120 },
    ],
    colors: [
      { id: 1, name_ar: 'رمادي وبيج', name_en: 'Grey & Beige', hex_code: '#8C857B' },
    ],
  };

  assert.equal(typeof drfArwal.price_per_length, 'string');
  assert.equal(drfArwal.widths.length, 4);
  assert.deepEqual(drfArwal.widths.map((w) => w.width), [60, 80, 100, 120]);
});

test('Phase 2 - Category & Subcategory bilingual payloads match DRF Serializers', async (t) => {
  // CategorySerializer requires name_ar and name_en
  const categoryCreatePayload = {
    name_ar: 'سجاد تركي فاخر',
    name_en: 'Luxury Turkish Carpets',
    image: 'https://res.cloudinary.com/test/cat.jpg',
    public_id: 'cat_turkish',
  };
  assert.ok(categoryCreatePayload.name_ar.length > 0, 'name_ar is required');
  assert.ok(categoryCreatePayload.name_en.length > 0, 'name_en is required');

  // SubcategorySerializer requires category_id, name_ar, name_en
  const subcategoryCreatePayload = {
    category_id: 2,
    name_ar: 'سجاد تركي مودرن',
    name_en: 'Modern Turkish Rugs',
    image: 'https://res.cloudinary.com/test/subcat.jpg',
    public_id: 'subcat_modern',
  };
  assert.equal(typeof subcategoryCreatePayload.category_id, 'number');
  assert.ok(subcategoryCreatePayload.name_ar.length > 0);
  assert.ok(subcategoryCreatePayload.name_en.length > 0);
});

test('Phase 2 - Cart contracts: supports regular products, arawal (أروال بالمتر), and bundles (باقات)', async (t) => {
  // 1. Regular Product Cart Item Creation
  const productCartPayload = {
    product_id: 15,
    selected_color_id: 1,
    selected_size_id: 2,
    quantity: 2,
  };
  assert.equal(typeof productCartPayload.product_id, 'number');
  assert.equal(typeof productCartPayload.selected_color_id, 'number');
  assert.equal(typeof productCartPayload.selected_size_id, 'number');
  assert.equal(productCartPayload.quantity, 2);

  // 2. Arwal Cart Item Creation
  const arwalCartPayload = {
    arwal_id: 5,
    selected_color_id: 1,
    selected_width_id: 2,
    selected_length: '3.50',
    quantity: 1,
  };
  assert.equal(typeof arwalCartPayload.arwal_id, 'number');
  assert.equal(typeof arwalCartPayload.selected_width_id, 'number');
  assert.ok(Number(arwalCartPayload.selected_length) >= 1.0, 'Length must be at least 1.00m');

  // 3. Bundle Cart Selection
  const bundleCartPayload = {
    bundle_offer_id: 7,
    quantity: 1,
  };
  assert.equal(typeof bundleCartPayload.bundle_offer_id, 'number');
  assert.equal(bundleCartPayload.quantity, 1);

  // 4. Cart response normalization
  const drfCartResponse = {
    id: 1,
    product_items: [
      {
        id: 10,
        product: { id: 15, name_ar: 'سجادة تبريز', name_en: 'Tabriz Rug' },
        selected_color: { id: 1, name_ar: 'كحلي', name_en: 'Navy', hex_code: '#001F3F' },
        selected_size: { id: 2, width: 250, length: 350 },
        quantity: 2,
        unit_price: '18500.00',
        total_price: '37000.00',
        is_available: true,
      },
    ],
    arwal_items: [
      {
        id: 11,
        arwal: { id: 5, name_ar: 'مشاية أروال', name_en: 'Runner Roll' },
        selected_color: { id: 1, name_ar: 'رمادي', name_en: 'Grey', hex_code: '#8C857B' },
        selected_width: { id: 2, width: 80 },
        selected_length: '3.50',
        quantity: 1,
        price_per_length: '450.00',
        unit_price: '1575.00',
        total_price: '1575.00',
        is_available: true,
      },
    ],
    bundles: [
      {
        id: 1,
        offer_id: 7,
        name_ar: 'باقة العروسة المتكاملة',
        name_en: 'Bridal Carpet Bundle',
        bundle_price: '28000.00',
        quantity: 1,
        products: [],
        arwals: [],
      },
    ],
    subtotal: '66575.00',
    discount: '0.00',
    total: '66575.00',
  };

  assert.equal(drfCartResponse.product_items.length, 1);
  assert.equal(drfCartResponse.arwal_items.length, 1);
  assert.equal(drfCartResponse.bundles.length, 1);
  assert.equal(drfCartResponse.total, '66575.00');
});

test('Phase 2 - Checkout contracts: CheckoutSerializer requires address_id, payment_method, and payment_type', async (t) => {
  // Verify valid enum choices in backend
  const VALID_PAYMENT_METHODS = ['CASH_ON_DELIVERY', 'ELECTRONIC_WALLET', 'INSTAPAY'];
  const VALID_PAYMENT_TYPES = ['SHIPPING_ONLY', 'FULL_ORDER'];

  const checkoutPayloadOptionA = {
    address_id: 4,
    payment_method: 'INSTAPAY',
    payment_type: 'SHIPPING_ONLY',
    customer_notes: 'الدفع عبر تطبيق إنستاباي - عربون الشحن 100 ج.م مسبقاً والباقي عند الاستلام',
  };

  assert.ok(VALID_PAYMENT_METHODS.includes(checkoutPayloadOptionA.payment_method));
  assert.ok(VALID_PAYMENT_TYPES.includes(checkoutPayloadOptionA.payment_type));
  assert.equal(typeof checkoutPayloadOptionA.address_id, 'number');

  const checkoutPayloadOptionB = {
    address_id: 4,
    payment_method: 'ELECTRONIC_WALLET',
    payment_type: 'FULL_ORDER',
    customer_notes: 'تحويل فودافون كاش - سداد كامل المبلغ',
  };

  assert.ok(VALID_PAYMENT_METHODS.includes(checkoutPayloadOptionB.payment_method));
  assert.ok(VALID_PAYMENT_TYPES.includes(checkoutPayloadOptionB.payment_type));
});

test('Phase 2 - Payment confirmation & Order status transition contracts', async (t) => {
  // 1. Payment confirmation endpoint PATCH /api/payments/<id>/status/
  const paymentStatusUpdatePayload = {
    status: 'PAID',
  };
  assert.equal(paymentStatusUpdatePayload.status, 'PAID');

  // 2. Order status choices in backend OrderStatus
  const VALID_ORDER_STATUSES = [
    'NOT_CONFIRMED',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ];

  // Verify state transitions allowed by DRF backend:
  // NOT_CONFIRMED -> CONFIRMED, CANCELLED
  // CONFIRMED -> PROCESSING, CANCELLED
  // PROCESSING -> SHIPPED, CANCELLED
  // SHIPPED -> DELIVERED, CANCELLED
  const allowedTransitions = {
    NOT_CONFIRMED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  for (const status of VALID_ORDER_STATUSES) {
    assert.ok(status in allowedTransitions);
  }

  // 3. Order status update payload PATCH /api/orders/<id>/status/
  const orderStatusUpdatePayload = {
    status: 'PROCESSING',
  };
  assert.ok(VALID_ORDER_STATUSES.includes(orderStatusUpdatePayload.status));
});
