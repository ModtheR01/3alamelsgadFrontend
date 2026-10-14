'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Category,
  Order,
  EventItem,
  ProjectItem,
  StoreSettings,
  CartItem,
  CustomerUser,
  OrderStatus,
  PaymentStatus,
  BannerItem,
} from '@/types';
import { BackendOrder } from '@/types/order';
import { productService } from '@/lib/api/services/productService';
import { productImageService } from '@/lib/api/services/productImageService';
import { categoryService, subcategoryService } from '@/lib/api/services/categoryService';
import { cartService } from '@/lib/api/services/cartService';
import { orderService } from '@/lib/api/services/orderService';
import { ApiError, normalizeApiError } from '@/lib/api/errors';
import {
  getGuestCart,
  addGuestCartItem,
  removeGuestCartItem,
  updateGuestCartItemQuantity,
  clearGuestCart,
  isGuestCartItemId,
} from '@/lib/guestCart';
import { BackendProduct, BackendProductImage, BackendSize, BackendArwal } from '@/types/product';
import { BackendCategory, BackendSubcategory } from '@/types/category';
import {
  BackendCart,
  BackendProductCartItem,
  BackendArwalCartItem,
  BackendCartBundle,
  BackendCartItem,
} from '@/types/cart';
import { eventService } from '@/lib/api/services/eventService';
import { dashboardService } from '@/lib/api/services/dashboardService';
import { DashboardSettingsPatch } from '@/types/dashboard';
import { collaborationService } from '@/lib/api/services/collaborationService';
import { BackendEvent } from '@/types/event';
import { BackendCollaboration } from '@/types/collaboration';
import { spaceProjectService } from '@/lib/api/services/spaceProjectService';
import { BackendSpaceProject, SpaceProjectRequest } from '@/types/spaceProject';
import { offerService } from '@/lib/api/services/offerService';
import { BackendOffer } from '@/types/offer';

const EMPTY_SETTINGS: StoreSettings = {
  brandName: 'عالم السجاد',
  tagline: 'لمسة تغير شكل بيتك',
  subTagline: 'سجاد تركي · سجاد شرقي · بدائل سجاد · أروال بالمتر',
  depositPercentage: 50,
  defaultLeadTime: 'شحن سريع لجميع المحافظات',
  defaultShippingTime: 'توصيل خلال ٢-٤ أيام عمل',
  contact: {
    phone: '+201010750072',
    whatsapp: '201010750072',
    email: 'info@alamelsgad.com',
    atelierAddress: 'معرض عالم السجاد، المنصورة، مصر',
    mapUrl:
      'https://www.google.com/maps/place/%D8%B9%D8%A7%D9%84%D9%85+%D8%A7%D9%84%D8%B3%D8%AC%D8%A7%D8%AF%E2%80%AD/@31.0483445,31.4038586,17z/data=!3m1!4b1!4m6!3m5!1s0x14f79d7444b18405:0x32e14297ac3ddc8f!8m2!3d31.0483445!4d31.4038586!16s%2Fg%2F11f3xffcn1!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDkyMy4wIKXMDSoASAFQAw%3D%3D',
    instagramHandles: ['@alamelsgad', '@alamelsgad123'],
    hours: 'يومياً من ١٠ صباحاً حتى ١١ مساءً',
  },
  paymentMethods: {
    instapay: {
      active: true,
      address: 'alamelsgad@instapay',
      accountName: 'عالم السجاد',
      instructions: 'الدفع المباشر عبر تطبيق إنستاباي لتأكيد سريع لطلبك.',
    },
    mobileWallet: {
      active: true,
      number: '01010750072',
      provider: 'محفظة إلكترونية',
      instructions: 'تحويل على رقم المحفظة (فودافون كاش / اتصالات / وي / أورنج).',
    },
    vodafoneCash: {
      active: true,
      number: '01010750072',
      instructions: 'فودافون كاش على الرقم 01010750072.',
    },
    bankTransfer: {
      active: true,
      bankName: 'البنك الأهلي المصري',
      accountNumber: '01010750072',
      iban: '',
      swift: '',
      accountHolder: 'معرض عالم السجاد',
      instructions: 'التحويل البنكي متاح للطلبات الكبيرة والكميات.',
    },
  },
  homepage: {
    heroHeading: 'لمسة تغير شكل بيتك',
    heroSubheading:
      'تشكيلات راقية من السجاد التركي، الشرقي، بدائل السجاد، والأروال بالمتر لتمنح منزلك دفئاً وفخامة استثنائية.',
    heroCtaText: 'تسوق التشكيلات الآن',
    heroImage:
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1920&q=85',
    storyQuote:
      'السجاد ليس مجرد غطاء للأرضيات، بل هو روح البيت ولمسته التي تجمع بين الأصالة والراحة العصرية.',
    storySubtext:
      'في عالم السجاد، نختار بدقة كل خيط وتصميم ليناسب كل ركن في منزلك بأعلى معايير الجودة والذوق الرفيع.',
  },
  policies: { shipping: '', returns: '', privacy: '', terms: '', faq: [] },
};

const DEFAULT_FALLBACK_CATEGORIES: Category[] = [
  { id: 'cat-harir', name: 'حرير وتصاميم راقية', slug: 'harir', description: 'سجاد حرير وتصاميم راقية', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80', isFeatured: true, displayOrder: 1, isVisible: true },
  { id: 'cat-turkish', name: 'سجاد تركي فاخر', slug: 'turkish', description: 'نعومة فائقة وألوان عصرية', image: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=800&q=80', isFeatured: true, displayOrder: 2, isVisible: true },
  { id: 'cat-oriental', name: 'سجاد شرقي وأصيل', slug: 'oriental', description: 'نقوش كلاسيكية وزخارف تراثية', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', isFeatured: false, displayOrder: 3, isVisible: true },
  { id: 'cat-arawal', name: 'رولات أروال ومشايات', slug: 'arawal', description: 'تباع بالطول المطلوب لممراتك', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', isFeatured: true, displayOrder: 4, isVisible: true },
];

const DEFAULT_FALLBACK_SUBCATEGORIES: BackendSubcategory[] = [
  { id: 101, category_id: 1, name: 'حرير البامبو الفاخر', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80', public_id: null, created_at: '', updated_at: '', deleted_at: null },
  { id: 102, category_id: 2, name: 'سجاد تركي مودرن', image: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=800&q=80', public_id: null, created_at: '', updated_at: '', deleted_at: null },
  { id: 103, category_id: 2, name: 'سجاد تركي كلاسيك بارز', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80', public_id: null, created_at: '', updated_at: '', deleted_at: null },
  { id: 104, category_id: 3, name: 'سجاد شرقي أصفهان', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', public_id: null, created_at: '', updated_at: '', deleted_at: null },
  { id: 105, category_id: 3, name: 'سجاد شيراز صوف يدوي', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', public_id: null, created_at: '', updated_at: '', deleted_at: null },
  { id: 106, category_id: 4, name: 'أروال ممرات عصرية (عرض ٨٠ سم)', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', public_id: null, created_at: '', updated_at: '', deleted_at: null },
  { id: 107, category_id: 4, name: 'أروال صوف فاخر (عرض ١٠٠ سم)', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', public_id: null, created_at: '', updated_at: '', deleted_at: null },
];

const DEFAULT_FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    slug: 'iron-mist-bamboo-silk-carpet',
    name: 'Iron Mist Bamboo Silk Carpet',
    categoryId: 'cat-harir',
    subcategoryIds: ['101'],
    description: 'سجادة حرير البامبو الفاخرة بطابع عصري ناعم ومقاوم للبقع بدرجات الرمادي الفضي.',
    price: 19465,
    originalPrice: 23161,
    discountPercentage: 15,
    images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85'],
    dimensions: '200x300 سم',
    material: 'حرير بامبو تركي فائق النعومة',
    finishes: ['MATTE'],
    colors: [{ id: 'c-1', name: 'رمادي ضبابي', hex: '#8A8D8F' }],
    faq: [],
    leadTime: 'شحن سريع لجميع المحافظات',
    shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
    isFeatured: true,
    isPublished: true,
    inStock: true,
    allowsCustomization: false,
    createdAt: '2026-10-02T14:30:00Z',
  },
  {
    id: 'p-2',
    slug: 'cloud-bamboo-silk-carpet',
    name: 'Cloud Bamboo Silk Carpet',
    categoryId: 'cat-harir',
    subcategoryIds: ['101'],
    description: 'تصميم سحابي ناعم الملمس يضفي على غرف المعيشة والصالونات هدوءاً فائقاً وأناقة استثنائية.',
    price: 19465,
    originalPrice: 23160,
    discountPercentage: 15,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85'],
    dimensions: '200x300 سم',
    material: 'حرير بامبو طبيعي عالي الكثافة',
    finishes: ['MATTE'],
    colors: [{ id: 'c-2', name: 'أبيض لؤلؤي', hex: '#EBEAE6' }],
    faq: [],
    leadTime: 'شحن سريع لجميع المحافظات',
    shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
    isFeatured: true,
    isPublished: true,
    inStock: true,
    allowsCustomization: false,
    createdAt: '2026-09-29T11:00:00Z',
  },
  {
    id: 'p-3',
    slug: 'regal-framed-bamboo-silk-carpet',
    name: 'Regal Framed Bamboo Silk Carpet',
    categoryId: 'cat-harir',
    subcategoryIds: ['101'],
    description: 'إطار هندسي ملكي يجمع بين البساطة الهندسية الحديثة والفخامة الهادئة لأفخم المنازل.',
    price: 19465,
    originalPrice: 23161,
    discountPercentage: 15,
    images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85'],
    dimensions: '200x300 سم',
    material: 'حرير بامبو تركي منسوج بدقة',
    finishes: ['MATTE'],
    colors: [{ id: 'c-3', name: 'بيج متدرج', hex: '#D2C1AF' }],
    faq: [],
    leadTime: 'شحن سريع لجميع المحافظات',
    shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
    isFeatured: true,
    isPublished: true,
    inStock: true,
    allowsCustomization: false,
    createdAt: '2026-09-27T09:15:00Z',
  },
  {
    id: 'p-4',
    slug: 'beige-harmony-bamboo-silk-carpet',
    name: 'Beige Harmony Bamboo Silk Carpet',
    categoryId: 'cat-harir',
    subcategoryIds: ['101'],
    description: 'تناغم دافئ بين درجات البيج والرمادي يمنح المساحة إحساساً بالاتساع والراحة العصرية.',
    price: 19465,
    originalPrice: 23161,
    discountPercentage: 15,
    images: ['https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1200&q=85'],
    dimensions: '200x300 سم',
    material: 'حرير بامبو مضاد للكهرباء الساكنة',
    finishes: ['MATTE'],
    colors: [{ id: 'c-4', name: 'بيج هارموني', hex: '#C7B9A5' }],
    faq: [],
    leadTime: 'شحن سريع لجميع المحافظات',
    shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
    isFeatured: true,
    isPublished: true,
    inStock: true,
    allowsCustomization: false,
    createdAt: '2026-09-24T16:00:00Z',
  },
  {
    id: 'p-5',
    slug: 'gray-harmony-bamboo-silk-carpet',
    name: 'Gray Harmony Bamboo Silk Carpet',
    categoryId: 'cat-harir',
    subcategoryIds: ['101'],
    description: 'لمعان حريري ساحر يتغير مع زاوية الإضاءة يبرز جمال أثاثك وديكور أرضياتك.',
    price: 19465,
    originalPrice: 23161,
    discountPercentage: 15,
    images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85'],
    dimensions: '200x300 سم',
    material: 'خيوط بامبو تركية كثيفة',
    finishes: ['GLOSSY'],
    colors: [{ id: 'c-5', name: 'رمادي حريري', hex: '#9E9EA0' }],
    faq: [],
    leadTime: 'شحن سريع لجميع المحافظات',
    shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
    isFeatured: true,
    isPublished: true,
    inStock: true,
    allowsCustomization: false,
    createdAt: '2026-09-20T12:00:00Z',
  },
  {
    id: 'p-6',
    slug: 'pure-frame-bamboo-silk-carpet',
    name: 'Pure Frame Bamboo Silk Carpet',
    categoryId: 'cat-harir',
    subcategoryIds: ['101'],
    description: 'خطوط إطارية نقية وتصميم مينيمالي راقٍ يناسب أحدث صيحات الديكور المودرن.',
    price: 14925,
    originalPrice: 17559,
    discountPercentage: 15,
    images: ['https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85'],
    dimensions: '160x230 سم',
    material: 'حرير بامبو معالج ضد الانزلاق',
    finishes: ['MATTE'],
    colors: [{ id: 'c-6', name: 'رمادي فاتح', hex: '#D6D3CE' }],
    faq: [],
    leadTime: 'شحن سريع لجميع المحافظات',
    shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
    isFeatured: true,
    isPublished: true,
    inStock: true,
    allowsCustomization: false,
    createdAt: '2026-09-18T10:00:00Z',
  },
  {
    id: 'p-7',
    slug: 'turkish-royal-classic-carpet',
    name: 'سجادة صالون تركي كلاسيك فاخر',
    categoryId: 'cat-turkish',
    subcategoryIds: ['102'],
    description: 'سجادة تركية محفورة بكثافة عالية ونقوش ملكية تمنح الصالون فخامة وأناقة تليق بضيوفك.',
    price: 8200,
    images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85'],
    dimensions: '200x300 سم',
    material: 'صوف تركي فائق الكثافة',
    finishes: ['MATTE'],
    colors: [{ id: 'c-7', name: 'كريمي وذهبي', hex: '#E2D5BE' }],
    faq: [],
    leadTime: 'شحن سريع لجميع المحافظات',
    shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
    isFeatured: true,
    isPublished: true,
    inStock: true,
    allowsCustomization: false,
    createdAt: '2026-09-12T08:00:00Z',
  },
  {
    id: 'p-8',
    slug: 'arawal-runner-roll-by-meter',
    name: 'مشاية أروال مودرن بالمتر - رمادي وبيج',
    categoryId: 'cat-arawal',
    subcategoryIds: ['104'],
    description: 'رول مشاية أروال بالمتر مخصص للممرات ومداخل الشقق، نحدد الطول المطلوب بدقة مع تشطيب وسرفلة مجانية.',
    price: 420,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85'],
    dimensions: 'عروض ٦٠، ٨٠، ١٠٠، ١٢٠ سم',
    material: 'خيوط بولي بروبلين متينة ومقاومة للاحتكاك',
    finishes: ['MATTE'],
    colors: [{ id: 'c-8', name: 'رمادي وبيج', hex: '#A89F91' }],
    faq: [],
    leadTime: 'شحن سريع لجميع المحافظات',
    shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
    isFeatured: true,
    isPublished: true,
    inStock: true,
    allowsCustomization: true,
    isArawal: true,
    arawalUnitPricePerMeter: 420,
    availableWidths: [60, 80, 100, 120],
    createdAt: '2026-09-08T14:00:00Z',
  },
];

export function mapBackendProduct(product: BackendProduct, subcategories: BackendSubcategory[] = []): Product {
  const subcategoryList = Array.isArray(subcategories) ? subcategories : [];
  const rawSubcategoryIds = Array.isArray(product?.subcategory_ids)
    ? product.subcategory_ids
    : product?.subcategory?.id
    ? [product.subcategory.id]
    : typeof (product as any)?.subcategory === 'number'
    ? [(product as any).subcategory]
    : [];
  const subcategoryIds = rawSubcategoryIds.map((id) => String(id));
  const primarySubcategory = subcategoryList.find((subcategory) => subcategory.id === rawSubcategoryIds[0]);
  const categoryId = primarySubcategory?.category_id
    ? String(primarySubcategory.category_id)
    : (product as any)?.category_id
    ? String((product as any).category_id)
    : (product as any)?.category?.id
    ? String((product as any).category.id)
    : (product as any)?.category
    ? String((product as any).category)
    : '';
  const rawImages = Array.isArray(product?.images) ? product.images : [];
  const imageRecords = rawImages.map((image: BackendProductImage, index) => ({
    id: image?.id,
    image: image?.image || '',
    public_id: image?.public_id,
    is_primary: image?.is_primary,
    sort_order: image?.sort_order ?? index,
  }));

  const productName = product?.name || product?.name_ar || product?.name_en || '';
  const productDesc = product?.description || product?.description_ar || product?.description_en || '';

  const isArawal =
    /أروال|arawal|رول|مشاية بالمتر|طاقة/i.test(productName) ||
    /أروال|arawal|رول/i.test(productDesc) ||
    Boolean(primarySubcategory && /أروال|arawal|رول/i.test(primarySubcategory.name || primarySubcategory.name_ar || ''));

  const parsedPrice = Number(product?.price) || 0;
  const rawDims = product?.dimensions || '';
  const parsedWidths = (rawDims.match(/\d+(\.\d+)?/g) || [])
    .map(Number)
    .filter((n) => n >= 30 && n <= 500);
  const uniqueWidths = Array.from(new Set(parsedWidths)).sort((a, b) => a - b);
  const availableWidths = uniqueWidths.length > 0 ? uniqueWidths : isArawal ? [80] : undefined;

  const mappedColors = Array.isArray(product?.colors)
    ? product.colors.map((color) => ({
        id: String(color.id),
        name: color.name || color.name_ar || color.name_en || '',
        name_ar: color.name_ar || color.name || '',
        name_en: color.name_en || color.name || '',
        hex: color.hex_code,
      }))
    : [];

  const mappedSizes = Array.isArray(product?.sizes)
    ? product.sizes.map((s) => ({
        id: String(s.id),
        name: `${s.width}x${s.length} سم`,
        dimensions: `${s.width}x${s.length} سم`,
        priceDelta: 0,
        width: s.width,
        length: s.length,
      }))
    : [];

  const sortedRecords = [...imageRecords].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  let displayImages = sortedRecords.length > 0
    ? sortedRecords.map((image) => image.image).filter(Boolean)
    : product?.primary_image?.image
    ? [product.primary_image.image]
    : [];

  const primaryUrl = product?.primary_image?.image;
  if (primaryUrl && displayImages.includes(primaryUrl)) {
    displayImages = [primaryUrl, ...displayImages.filter((img) => img !== primaryUrl)];
  } else if (primaryUrl && !displayImages.includes(primaryUrl)) {
    displayImages = [primaryUrl, ...displayImages];
  }

  return {
    id: String(product?.id || ''),
    slug: String(product?.id || ''),
    name: productName,
    name_ar: product?.name_ar || productName,
    name_en: product?.name_en || productName,
    categoryId,
    subcategoryIds,
    description: productDesc,
    description_ar: product?.description_ar || productDesc,
    description_en: product?.description_en || productDesc,
    price: parsedPrice,
    originalPrice: Number((product as any)?.original_price) || undefined,
    discountPercentage: Number((product as any)?.discount_percentage) || undefined,
    images: displayImages,
    imageRecords,
    dimensions: rawDims || (mappedSizes.length > 0 ? mappedSizes.map((s) => s.name).join('، ') : availableWidths ? availableWidths.map((w) => `${w} سم`).join('، ') : ''),
    deliveryDays: product?.delivery_days,
    material: product?.material || '',
    finishes: Array.isArray(product?.finish) ? product.finish : [],
    colors: mappedColors,
    sizes: mappedSizes,
    faq: Array.isArray(product?.faq) ? product.faq : [],
    leadTime: product?.delivery_days ? `${product.delivery_days} أيام` : EMPTY_SETTINGS.defaultLeadTime,
    shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
    isFeatured: Boolean(product?.featured),
    isPublished: !product?.deleted_at,
    inStock: true,
    allowsCustomization: false,
    isArawal,
    arawalUnitPricePerMeter: isArawal ? parsedPrice : undefined,
    availableWidths,
    createdAt: product?.created_at || new Date().toISOString(),
    seoTitle: productName,
    seoDescription: productDesc,
  };
}

function mapBackendCategory(category: BackendCategory): Category {
  const catName = category.name || category.name_ar || category.name_en || '';
  return {
    id: String(category.id),
    name: catName,
    name_ar: category.name_ar || catName,
    name_en: category.name_en || catName,
    slug: String(category.id),
    description: '',
    description_ar: '',
    description_en: '',
    image: category.image || '',
    public_id: category.public_id || undefined,
    isFeatured: false,
    displayOrder: category.id,
    isVisible: true,
  };
}

function mapBackendEvent(event: BackendEvent): EventItem {
  const eventDate = new Date(`${event.event_date}T00:00:00`);
  const isUpcoming = eventDate.getTime() >= Date.now();
  return {
    id: String(event.id),
    title: event.title,
    subtitle: '',
    description: event.description || '',
    location: '',
    city: '',
    date: event.event_date,
    time: undefined,
    coverImage: event.image,
    publicId: event.public_id,
    status: isUpcoming ? 'upcoming' : 'past',
    isUpcoming,
  };
}

function mapBackendSpaceProject(project: BackendSpaceProject): ProjectItem {
  const createdYear = new Date(project.created_at).getFullYear();
  return {
    id: String(project.id),
    title: project.customer_name || 'In Their Space',
    subtitle: project.product_name || 'Tocco House Installation',
    description: project.caption || '',
    location: project.location || '',
    coverImage: project.image,
    gallery: [],
    productsUsed: project.product_name ? [project.product_name] : [],
    featuredPieces: project.product_name ? [project.product_name] : [],
    year: Number.isNaN(createdYear) ? '' : String(createdYear),
    customerName: project.customer_name,
    publicId: project.public_id,
    productId: project.product_id ? String(project.product_id) : undefined,
  };
}

function mapBackendProductCartItem(item: BackendProductCartItem, products: Product[] = []): CartItem {
  const prodId = String(item.product?.id || '');
  const product = products.find((p) => p.id === prodId);
  return {
    id: String(item.id),
    rawItemId: item.id,
    cartItemType: 'product',
    productId: prodId,
    productName: item.product?.name_ar || item.product?.name_en || product?.name || '',
    productImage: product?.images[0] || '',
    unitPrice: Number(item.unit_price),
    selectedFinish: product?.finishes[0] || 'MATTE',
    selectedColor: item.selected_color
      ? {
          id: String(item.selected_color.id),
          name: item.selected_color.name_ar || item.selected_color.name_en || '',
          hex: item.selected_color.hex_code || '#000000',
        }
      : { id: '', name: '', hex: '#000000' },
    selectedSize: item.selected_size
      ? {
          id: String(item.selected_size.id),
          name: `${item.selected_size.width}x${item.selected_size.length} سم`,
          dimensions: `${item.selected_size.width}x${item.selected_size.length} سم`,
          priceDelta: 0,
          width: item.selected_size.width,
          length: item.selected_size.length,
        }
      : undefined,
    quantity: item.quantity,
    subtotal: item.subtotal !== undefined ? Number(item.subtotal) : Number(item.total_price),
    originalSubtotal: item.original_subtotal !== undefined ? Number(item.original_subtotal) : Number(item.total_price),
    discountAmount: item.discount_amount !== undefined ? Number(item.discount_amount) : 0,
    offerName: item.applied_offers?.[0]?.name,
  };
}

function mapBackendArwalCartItem(item: BackendArwalCartItem, products: Product[] = []): CartItem {
  const arwalId = String(item.arwal?.id || '');
  const product = products.find((p) => p.id === arwalId);
  const lengthMeters = Number(item.selected_length) || 1;
  const widthVal = item.selected_width?.width || 80;
  const unitPricePerMeter = Number(item.price_per_length) || 0;
  return {
    id: `arwal-${item.id}`,
    rawItemId: item.id,
    cartItemType: 'arwal',
    productId: arwalId,
    productName: item.arwal?.name_ar || item.arwal?.name_en || product?.name || 'أروال بالمتر',
    productImage: product?.images[0] || '',
    unitPrice: Number(item.unit_price),
    selectedFinish: 'MATTE',
    selectedColor: item.selected_color
      ? {
          id: String(item.selected_color.id),
          name: item.selected_color.name_ar || item.selected_color.name_en || '',
          hex: item.selected_color.hex_code || '#000000',
        }
      : { id: '', name: '', hex: '#000000' },
    arwalConfig: {
      isArawal: true,
      width: widthVal,
      lengthMeters,
      unitPricePerMeter,
      totalPrice: Number(item.total_price),
    },
    quantity: item.quantity,
    subtotal: item.subtotal !== undefined ? Number(item.subtotal) : Number(item.total_price),
    originalSubtotal: item.original_subtotal !== undefined ? Number(item.original_subtotal) : Number(item.total_price),
    discountAmount: item.discount_amount !== undefined ? Number(item.discount_amount) : 0,
    offerName: item.applied_offers?.[0]?.name,
  };
}

function mapBackendBundleCartItem(bundle: BackendCartBundle): CartItem {
  return {
    id: `bundle-${bundle.offer_id}`,
    cartItemType: 'bundle',
    bundleOfferId: bundle.offer_id,
    isBundle: true,
    productId: `bundle-${bundle.offer_id}`,
    productName: bundle.name_ar || bundle.name_en || 'باقة عروض خاصة',
    productImage: (bundle as any)?.image || '',
    unitPrice: Number(bundle.bundle_price),
    selectedFinish: 'MATTE',
    selectedColor: { id: '', name: '', hex: '#000000' },
    quantity: bundle.quantity,
    subtotal: Number(bundle.bundle_price) * bundle.quantity,
    originalSubtotal: Number(bundle.bundle_price) * bundle.quantity,
    discountAmount: 0,
    offerName: bundle.name_ar || bundle.name_en,
  };
}

function mapBackendCartItem(item: BackendCartItem, products: Product[] = []): CartItem {
  const product = products.find((p) => p.id === String(item.product_id));
  return {
    id: String(item.id),
    rawItemId: item.id,
    cartItemType: 'product',
    productId: String(item.product_id),
    productName: item.product_name,
    productImage: product?.images[0] || '',
    unitPrice: Number(item.product_price),
    selectedFinish: item.selected_finish || product?.finishes[0] || 'MATTE',
    selectedColor: item.color_id
      ? { id: String(item.color_id), name: item.color_name || '', hex: item.color_hex_code || '#000000' }
      : { id: '', name: '', hex: '#000000' },
    quantity: item.quantity,
    subtotal: item.subtotal !== undefined ? Number(item.subtotal) : undefined,
    originalSubtotal: item.original_subtotal !== undefined ? Number(item.original_subtotal) : undefined,
    discountAmount: item.discount_amount !== undefined ? Number(item.discount_amount) : undefined,
    offerName: item.offer?.name,
  };
}

export type AppView =
  | 'home'
  | 'shop'
  | 'product'
  | 'custom-design'
  | 'b2b'
  | 'our-story'
  | 'events'
  | 'projects'
  | 'cart'
  | 'checkout'
  | 'confirmation'
  | 'account'
  | 'shipping'
  | 'returns'
  | 'faq'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'admin'
  | 'dashboard';

interface StoreContextType {
  // Navigation & View
  activeView: AppView;
  selectedProductId: string | null;
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  setSelectedProductId: (id: string | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setSelectedSubcategoryId: (id: string | null) => void;
  searchQuery: string;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  navigateTo: (
    view: AppView,
    options?: { productId?: string; categoryId?: string; subcategoryId?: string }
  ) => void;
  setSearchQuery: (query: string) => void;

  // Data
  products: Product[];
  categories: Category[];
  subcategories: BackendSubcategory[];
  orders: Order[];
  events: EventItem[];
  projects: ProjectItem[];
  banners: BannerItem[];
  collaborations: BackendCollaboration[];
  settings: StoreSettings;
  isCatalogLoading: boolean;
  catalogError: string | null;
  reloadCatalog: () => Promise<void>;
  offers: BackendOffer[];
  isOffersLoading: boolean;
  offersError: string | null;
  reloadOffers: () => Promise<void>;
  isEventsLoading: boolean;
  isProjectsLoading: boolean;
  cart: CartItem[];
  user: CustomerUser | null;
  lastCreatedOrder: BackendOrder | Order | null;
  setLastCreatedOrder: (order: BackendOrder | Order | null) => void;

  // Cart operations
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  syncGuestCart: () => Promise<void>;
  cartSubtotal: number;
  cartDepositAmount: number;
  cartRemainingAmount: number;
  cartItemsCount: number;
  cartOriginalTotal: number;
  cartDiscountTotal: number;
  cartFreeShipping: boolean;

  // Checkout & Orders
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Order;
  submitPaymentProof: (orderId: string, proofNote: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;

  // Admin CRUD operations
  saveProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  hardDeleteProduct: (productId: string) => Promise<void>;
  restoreProduct: (productId: string) => Promise<void>;
  toggleProductFeatured: (productId: string) => Promise<void>;
  saveCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  hardDeleteCategory: (categoryId: string) => Promise<void>;
  restoreCategory: (categoryId: string) => Promise<void>;
  saveSubcategory: (subcategory: {
    id?: number | string;
    category_id: number | string;
    name: string;
    name_ar?: string;
    name_en?: string;
    image?: string | null;
    public_id?: string | null;
  }) => Promise<void>;
  deleteSubcategory: (subcategoryId: number | string) => Promise<void>;
  hardDeleteSubcategory: (subcategoryId: number | string) => Promise<void>;
  restoreSubcategory: (subcategoryId: number | string) => Promise<void>;
  refreshCatalog: () => Promise<void>;

  saveEvent: (event: EventItem) => void;
  deleteEvent: (eventId: string) => void;

  saveProject: (project: ProjectItem) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  saveBanner: (banner: BannerItem) => void;
  deleteBanner: (bannerId: string) => void;
  toggleBannerActive: (bannerId: string) => void;

  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // User auth & profile
  loginUser: (email: string, fullName: string, phone: string) => void;
  logoutUser: () => void;
  saveUserAddress: (address: CustomerUser['savedAddresses'][0]) => void;
  deleteUserAddress: (addressId: string) => void;

  // Helper getters
  getProductById: (id: string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;
  getCategoryById: (id: string) => Category | undefined;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Navigation
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Entities
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<BackendSubcategory[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [collaborations, setCollaborations] = useState<BackendCollaboration[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(EMPTY_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isGuestCart, setIsGuestCart] = useState(false);
  const [cartPricing, setCartPricing] = useState({
    originalTotal: 0,
    discountTotal: 0,
    total: 0,
    freeShipping: false,
  });
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<BackendOrder | Order | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [offers, setOffers] = useState<BackendOffer[]>([]);
  const [isOffersLoading, setIsOffersLoading] = useState<boolean>(true);
  const [offersError, setOffersError] = useState<string | null>(null);

  const reloadOffers = useCallback(async () => {
    setIsOffersLoading(true);
    setOffersError(null);
    try {
      const data = await offerService.getOffers();
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      setOffers([]);
      setOffersError(normalizeApiError(err).message || 'تعذر تحميل العروض من الخادم.');
    } finally {
      setIsOffersLoading(false);
    }
  }, []);

  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  // Load catalog data from the production backend.
  useEffect(() => {
    let active = true;
    setIsCatalogLoading(true);
    setCatalogError(null);
    Promise.all([
      productService.getProducts(),
      categoryService.getCategories(),
      subcategoryService.getSubcategories(),
    ])
      .then(([backendProducts, backendCategories, backendSubcategories]) => {
        if (!active) return;
        const subcatList = Array.isArray(backendSubcategories) ? backendSubcategories : [];
        const catList = Array.isArray(backendCategories) ? backendCategories : [];
        const prodList = Array.isArray(backendProducts) ? backendProducts : [];

        setSubcategories(subcatList);
        const mappedProducts = prodList.map((product) => mapBackendProduct(product, subcatList));
        setProducts(mappedProducts);
        setCategories(catList.map(mapBackendCategory));
        setCatalogError(null);

        // Cart items reference product images by id, so hydrate the cart only
        // once the product catalog is available to resolve thumbnails correctly.
        return cartService
          .getCart()
          .then((backendCart) => {
            if (!active || !backendCart) return;
            const items = Array.isArray(backendCart.items) ? backendCart.items : [];
            setIsGuestCart(false);
            setCart(items.map((item) => mapBackendCartItem(item, mappedProducts)));
            setCartPricing({
              originalTotal: Number(backendCart.original_total) || 0,
              discountTotal: Number(backendCart.discount_amount) || 0,
              total: Number(backendCart.total_price) || 0,
              freeShipping: Boolean(backendCart.free_shipping),
            });
          })
          .catch(() => {
            // Not authenticated (or request failed) - fall back to the locally persisted guest cart.
            if (active) {
              setIsGuestCart(true);
              setCart(getGuestCart());
            }
          });
      })
      .catch((err) => {
        if (!active) return;
        setProducts([]);
        setCategories([]);
        setSubcategories([]);
        setCatalogError(normalizeApiError(err).message || 'تعذر تحميل بيانات المتجر من الخادم.');
        setIsGuestCart(true);
        setCart(getGuestCart());
      })
      .finally(() => {
        if (active) setIsCatalogLoading(false);
      });

    offerService.getOffers().then((items) => {
      if (active) setOffers(Array.isArray(items) ? items : []);
    }).catch((err) => {
      if (active) {
        setOffers([]);
        setOffersError(normalizeApiError(err).message || 'تعذر تحميل العروض من الخادم.');
      }
    }).finally(() => {
      if (active) setIsOffersLoading(false);
    });

    eventService.getEvents().then((items) => {
      if (active) setEvents(items.map(mapBackendEvent));
    }).catch(() => {
      if (active) setEvents([]);
    }).finally(() => {
      if (active) setIsEventsLoading(false);
    });

    collaborationService.getCollaborations().then((items) => {
      if (active) setCollaborations(items);
    }).catch(() => {
      if (active) setCollaborations([]);
    });

    spaceProjectService.getProjects().then((items) => {
      if (active) setProjects(items.map(mapBackendSpaceProject));
    }).catch(() => {
      if (active) setProjects([]);
    }).finally(() => {
      if (active) setIsProjectsLoading(false);
    });

    dashboardService.getSettings().then((data) => {
      if (!active || !data) return;
      const wallets = data.payment_wallets || {};

      let instapayAddress = '';
      let instapayNumber = '';
      if (typeof wallets.instapay === 'string') {
        instapayAddress = wallets.instapay;
      } else if (wallets.instapay && typeof wallets.instapay === 'object') {
        instapayAddress = wallets.instapay.address ?? '';
        instapayNumber = wallets.instapay.number ?? '';
      }

      setSettings((current) => ({
        ...current,
        depositPercentage: data.deposit_percentage !== undefined && data.deposit_percentage !== null
          ? Number(data.deposit_percentage)
          : current.depositPercentage,
        contact: {
          ...current.contact,
          phone: data.phone !== undefined && data.phone !== '' ? data.phone : current.contact.phone,
          whatsapp: data.whatsapp !== undefined && data.whatsapp !== '' ? data.whatsapp : current.contact.whatsapp,
          atelierAddress: data.address !== undefined && data.address !== '' ? data.address : current.contact.atelierAddress,
        },
        paymentMethods: {
          ...current.paymentMethods,
          mobileWallet: {
            ...current.paymentMethods.mobileWallet,
            number: wallets.mobile_wallet || wallets.vodafone_cash || current.paymentMethods.mobileWallet.number,
          },
          instapay: {
            ...current.paymentMethods.instapay,
            address: instapayAddress || current.paymentMethods.instapay.address,
            number: instapayNumber || current.paymentMethods.instapay.number,
          },
          vodafoneCash: {
            ...current.paymentMethods.vodafoneCash,
            number: wallets.vodafone_cash || wallets.mobile_wallet || current.paymentMethods.vodafoneCash.number,
          },
        },
      }));
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  // Navigation action
  const navigateTo = useCallback(
    (
      view: AppView,
      options?: { productId?: string; categoryId?: string; subcategoryId?: string }
    ) => {
      const targetView = view === 'dashboard' ? 'admin' : view;
      setActiveView(targetView);
      if (options?.productId !== undefined) setSelectedProductId(options.productId);
      if (options?.categoryId !== undefined) setSelectedCategoryId(options.categoryId);
      if (options?.subcategoryId !== undefined) setSelectedSubcategoryId(options.subcategoryId);

      // Scroll to top on navigation & update URL pathname
      if (typeof window !== 'undefined') {
        if (targetView === 'admin') {
          if (!window.location.pathname.startsWith('/dashboard')) {
            window.history.pushState(null, '', '/dashboard');
          }
        } else if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/admin')) {
          const params = new URLSearchParams();
          if (targetView !== 'home') params.set('route', targetView);
          if (options?.productId) params.set('product', options.productId);
          if (options?.categoryId) params.set('category', options.categoryId);
          if (options?.subcategoryId) params.set('subcategory', options.subcategoryId);
          const queryString = params.toString();
          window.location.href = queryString ? `/?${queryString}` : '/';
          return;
        } else {
          const url = new URL(window.location.href);
          if (targetView === 'home') {
            url.searchParams.delete('route');
            url.searchParams.delete('product');
            url.searchParams.delete('category');
            url.searchParams.delete('subcategory');
          } else if (targetView === 'shop') {
            url.searchParams.set('route', 'shop');
            url.searchParams.delete('product');
            if (options?.categoryId !== undefined) {
              if (options.categoryId && options.categoryId !== 'all') {
                url.searchParams.set('category', options.categoryId);
              } else {
                url.searchParams.delete('category');
              }
            }
            if (options?.subcategoryId !== undefined) {
              if (options.subcategoryId && options.subcategoryId !== 'all') {
                url.searchParams.set('subcategory', options.subcategoryId);
              } else {
                url.searchParams.delete('subcategory');
              }
            }
          } else if (targetView === 'product') {
            url.searchParams.delete('route');
            if (options?.productId) {
              url.searchParams.set('product', options.productId);
            }
          } else {
            url.searchParams.set('route', targetView);
            url.searchParams.delete('product');
          }
          window.history.pushState(null, '', url.pathname + (url.search ? url.search : ''));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  // Cart logic
  const refreshCart = useCallback(async () => {
    const backendCart = await cartService.getCart();
    setIsGuestCart(false);

    const productCartItems = (backendCart.product_items || []).map((item) =>
      mapBackendProductCartItem(item, products)
    );
    const arwalCartItems = (backendCart.arwal_items || []).map((item) =>
      mapBackendArwalCartItem(item, products)
    );
    const bundleCartItems = (backendCart.bundles || []).map((bundle) =>
      mapBackendBundleCartItem(bundle)
    );

    const allCartItems = [...productCartItems, ...arwalCartItems, ...bundleCartItems];
    setCart(allCartItems);
    setCartPricing({
      originalTotal: Number(backendCart.subtotal || backendCart.original_total || 0),
      discountTotal: Number(backendCart.discount || backendCart.discount_amount || 0),
      total: Number(backendCart.total || backendCart.total_price || 0),
      freeShipping: Boolean(backendCart.free_shipping),
    });
  }, [products]);

  const addToCart = useCallback(async (itemData: Omit<CartItem, 'id'>) => {
    const productId = Number(itemData.productId);
    const isArwal = Boolean(itemData.arwalConfig?.isArawal || itemData.cartItemType === 'arwal');
    const isBundle = Boolean(itemData.isBundle || itemData.cartItemType === 'bundle' || itemData.bundleOfferId);

    try {
      if (isArwal) {
        if (!Number.isInteger(productId)) {
          throw new Error('This Arwal is not connected to a backend record.');
        }
        const colorId = itemData.selectedColor.id ? Number(itemData.selectedColor.id) : 1;
        const widthVal = itemData.arwalConfig?.width || 80;
        await cartService.addArwalItem({
          arwal_id: productId,
          selected_color_id: colorId,
          selected_width_id: widthVal,
          selected_length: itemData.arwalConfig?.lengthMeters || 1,
          quantity: itemData.quantity,
        });
      } else if (isBundle) {
        const bundleId = itemData.bundleOfferId || productId;
        await cartService.addBundle({
          bundle_offer_id: bundleId,
          quantity: itemData.quantity,
        });
      } else {
        if (!Number.isInteger(productId)) {
          throw new Error('This product is not connected to a backend product record.');
        }
        const matchedProduct = products.find((p) => p.id === String(productId));
        const colorId = itemData.selectedColor.id
          ? Number(itemData.selectedColor.id)
          : matchedProduct?.colors?.[0]?.id
          ? Number(matchedProduct.colors[0].id)
          : 1;
        const sizeId = itemData.selectedSize?.id
          ? Number(itemData.selectedSize.id)
          : matchedProduct?.sizes?.[0]?.id
          ? Number(matchedProduct.sizes[0].id)
          : 1;

        await cartService.addItem({
          product_id: productId,
          selected_color_id: colorId,
          selected_size_id: sizeId,
          quantity: itemData.quantity,
        });
      }
      await refreshCart();
    } catch (err) {
      // Not signed in: keep the item in a local guest cart instead of losing it.
      // It gets pushed to the real backend cart once the user signs in (syncGuestCart).
      if (err instanceof ApiError && err.status === 401) {
        setIsGuestCart(true);
        setCart(addGuestCartItem(itemData));
      } else {
        throw err;
      }
    }

    setIsCartDrawerOpen(true);
  }, [products, refreshCart]);

  const removeFromCart = useCallback(async (cartItemId: string) => {
    if (isGuestCartItemId(cartItemId)) {
      setCart(removeGuestCartItem(cartItemId));
      return;
    }
    if (cartItemId.startsWith('arwal-')) {
      const rawId = Number(cartItemId.replace('arwal-', ''));
      await cartService.removeArwalItem(rawId);
    } else if (cartItemId.startsWith('bundle-')) {
      const bundleOfferId = Number(cartItemId.replace('bundle-', ''));
      await cartService.removeBundle(bundleOfferId);
    } else {
      await cartService.removeItem(Number(cartItemId));
    }
    await refreshCart();
  }, [refreshCart]);

  const updateCartQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    if (isGuestCartItemId(cartItemId)) {
      setCart(updateGuestCartItemQuantity(cartItemId, quantity));
      return;
    }
    if (cartItemId.startsWith('arwal-')) {
      const rawId = Number(cartItemId.replace('arwal-', ''));
      if (quantity <= 0) {
        await cartService.removeArwalItem(rawId);
      } else {
        await cartService.updateArwalItem(rawId, { quantity });
      }
    } else if (cartItemId.startsWith('bundle-')) {
      const bundleOfferId = Number(cartItemId.replace('bundle-', ''));
      if (quantity <= 0) {
        await cartService.removeBundle(bundleOfferId);
      } else {
        await cartService.updateBundle(bundleOfferId, { quantity });
      }
    } else {
      const rawId = Number(cartItemId);
      if (quantity <= 0) {
        await cartService.removeItem(rawId);
      } else {
        await cartService.updateItem(rawId, { quantity });
      }
    }
    await refreshCart();
  }, [refreshCart]);

  const clearCart = useCallback(async () => {
    clearGuestCart();
    if (isGuestCart) {
      setCart([]);
      setCartPricing({ originalTotal: 0, discountTotal: 0, total: 0, freeShipping: false });
      return;
    }
    await cartService.clearCart();
    setCart([]);
    setCartPricing({ originalTotal: 0, discountTotal: 0, total: 0, freeShipping: false });
  }, [isGuestCart]);

  // Guest cart items never reached the backend, so push them one-by-one once the
  // visitor signs in, then discard the local copy and hydrate from the real cart.
  const syncGuestCart = useCallback(async () => {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;

    for (const item of guestItems) {
      const productId = Number(item.productId);
      if (!Number.isInteger(productId)) continue;

      try {
        if (item.arwalConfig?.isArawal) {
          const colorId = item.selectedColor.id ? Number(item.selectedColor.id) : 1;
          const widthVal = item.arwalConfig.width || 80;
          await cartService.addArwalItem({
            arwal_id: productId,
            selected_color_id: colorId,
            selected_width_id: widthVal,
            selected_length: item.arwalConfig.lengthMeters || 1,
            quantity: item.quantity,
          });
        } else if (item.bundleOfferId) {
          await cartService.addBundle({
            bundle_offer_id: item.bundleOfferId,
            quantity: item.quantity,
          });
        } else {
          const matchedProduct = products.find((p) => p.id === String(productId));
          const colorId = item.selectedColor.id
            ? Number(item.selectedColor.id)
            : matchedProduct?.colors?.[0]?.id
            ? Number(matchedProduct.colors[0].id)
            : 1;
          const sizeId = item.selectedSize?.id
            ? Number(item.selectedSize.id)
            : matchedProduct?.sizes?.[0]?.id
            ? Number(matchedProduct.sizes[0].id)
            : 1;

          await cartService.addItem({
            product_id: productId,
            selected_color_id: colorId,
            selected_size_id: sizeId,
            quantity: item.quantity,
          });
        }
      } catch {
        // Skip items that fail to sync (e.g. product no longer available) and continue with the rest.
      }
    }

    clearGuestCart();
    setIsGuestCart(false);
    await refreshCart();
  }, [products, refreshCart]);

  // Cart calculations
  // Prefer the backend's offer-aware total (accounts for active discounts); the guest
  // cart has no backend pricing yet, so sum items locally until it's synced.
  const cartSubtotal = cart.length === 0
    ? 0
    : isGuestCart
      ? cart.reduce((sum, item) => sum + (item.subtotal ?? item.unitPrice * item.quantity), 0)
      : cartPricing.total;
  const depositRatio = settings.depositPercentage / 100;
  const cartDepositAmount = Math.round(cartSubtotal * depositRatio);
  const cartRemainingAmount = cartSubtotal - cartDepositAmount;
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Order creation
  const createOrder = useCallback(
    (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Order => {
      const orderNumber = `TH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: Order = {
        ...orderData,
        id: `ord-${Date.now()}`,
        orderNumber,
        createdAt: new Date().toISOString(),
      };

      setOrders((prev) => [newOrder, ...prev]);
      setLastCreatedOrder(newOrder);
      setCart([]); // Clear cart after placing order
      return newOrder;
    },
    []
  );

  const submitPaymentProof = useCallback((orderId: string, proofNote: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated: Order = {
            ...ord,
            paymentStatus: 'proof_submitted',
            orderStatus: 'proof_submitted',
            paymentProofNote: proofNote,
            paymentProofDate: new Date().toISOString(),
          };
          if (lastCreatedOrder?.id === orderId) {
            setLastCreatedOrder(updated);
          }
          return updated;
        }
        return ord;
      })
    );
  }, [lastCreatedOrder]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, orderStatus: status } : ord))
    );
  }, []);

  const updatePaymentStatus = useCallback((orderId: string, status: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          let updatedOrderStatus = ord.orderStatus;
          if (status === 'payment_verified' && ord.orderStatus === 'proof_submitted') {
            updatedOrderStatus = 'payment_verified';
          }
          return {
            ...ord,
            paymentStatus: status,
            orderStatus: updatedOrderStatus,
          };
        }
        return ord;
      })
    );
  }, []);

  // Admin CRUD for Products
  const saveProduct = useCallback(async (productToSave: Product) => {
    const subcategoryIds = productToSave.subcategoryIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));
    const colorIds = productToSave.colors
      .map((color) => Number(color.id))
      .filter((id) => Number.isInteger(id));
    const sizeIds = (productToSave.sizes || [])
      .map((size: any) => Number(size.id))
      .filter((id) => Number.isInteger(id));

    if (!productToSave.isArawal) {
      if (sizeIds.length === 0) {
        throw new Error('يرجى اختيار مقاس واحد على الأقل للمنتج (المقاسات مطلوبة).');
      }
      if (colorIds.length === 0) {
        throw new Error('يرجى اختيار لون واحد على الأقل للمنتج (الألوان مطلوبة).');
      }
    }

    const nameAr = (productToSave.name_ar || productToSave.name || '').trim();
    const nameEn = (productToSave.name_en || productToSave.name || nameAr).trim();
    const descAr = (productToSave.description_ar || productToSave.description || '').trim();
    const descEn = (productToSave.description_en || productToSave.description || descAr).trim();

    const payload = {
      name: nameAr,
      name_ar: nameAr,
      name_en: nameEn,
      description: descAr,
      description_ar: descAr,
      description_en: descEn,
      dimensions: productToSave.dimensions.trim(),
      price: productToSave.price || 0,
      delivery_days: productToSave.deliveryDays ?? null,
      material: productToSave.material.trim(),
      finish: productToSave.finishes,
      faq: (productToSave.faq || []).filter((item) => item.question.trim() || item.answer.trim()),
      subcategory_ids: subcategoryIds,
      size_ids: sizeIds,
      color_ids: colorIds,
      featured: productToSave.isFeatured,
    };
    const productId = Number(productToSave.id);
    let saved = Number.isInteger(productId)
      ? await productService.updateProduct(productId, payload)
      : await productService.createProduct(payload);

    if (Number.isInteger(productId)) {
      const existingImages = Array.isArray(saved.images) ? saved.images : [];
      const currentUrls = new Set(productToSave.images);

      // 1. Delete removed images from backend (which triggers backend Cloudinary deletion)
      const imagesToDelete = existingImages.filter((img) => !currentUrls.has(img.image));
      for (const img of imagesToDelete) {
        try {
          await productImageService.deleteProductImage(img.id);
        } catch {
          // Continue if already removed
        }
      }

      // 2. Create newly uploaded images
      const existingUrls = new Set(existingImages.map((img) => img.image));
      const newlyAddedDrafts = (productToSave.imageRecords || []).filter(
        (rec) => rec.image && !existingUrls.has(rec.image)
      );

      for (let i = 0; i < newlyAddedDrafts.length; i++) {
        const draft = newlyAddedDrafts[i];
        try {
          await productImageService.createProductImage({
            product: productId,
            image: draft.image,
            public_id: draft.public_id || '',
            is_primary: productToSave.images.indexOf(draft.image) === 0,
            sort_order: existingImages.length + i,
          });
        } catch {
          // Continue
        }
      }

      // 3. Refresh product to ensure images and primary status match backend state
      try {
        const refreshed = await productService.getProduct(productId);
        saved = refreshed;
      } catch {
        // Keep saved
      }
    } else if (productToSave.images.length > 0) {
      const createdImages = await Promise.all(
        productToSave.images.map((imageUrl, index) => {
          const imageRecord = productToSave.imageRecords?.find((record) => record.image === imageUrl);
          return productImageService.createProductImage({
            product: saved.id,
            image: imageUrl,
            public_id: imageRecord?.public_id || '',
            is_primary: index === 0,
            sort_order: index,
          });
        })
      );
      saved = {
        ...saved,
        images: createdImages,
      };
    }

    const mapped = mapBackendProduct(saved, subcategories);
    setProducts((prev) => {
      const exists = prev.some((product) => product.id === mapped.id);
      return exists ? prev.map((product) => (product.id === mapped.id ? mapped : product)) : [mapped, ...prev];
    });
  }, [subcategories]);

  const refreshCatalog = useCallback(async () => {
    setIsCatalogLoading(true);
    setCatalogError(null);
    try {
      const [backendProducts, backendCategories, backendSubcategories] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
        subcategoryService.getSubcategories(),
      ]);
      const subcatList = Array.isArray(backendSubcategories) ? backendSubcategories : [];
      setSubcategories(subcatList);
      setCategories((Array.isArray(backendCategories) ? backendCategories : []).map(mapBackendCategory));
      setProducts((Array.isArray(backendProducts) ? backendProducts : []).map((p) => mapBackendProduct(p, subcatList)));
      setCatalogError(null);
      await reloadOffers().catch(() => {});
    } catch (err) {
      setCatalogError(normalizeApiError(err).message || 'تعذر تحديث بيانات المتجر.');
    } finally {
      setIsCatalogLoading(false);
    }
  }, [reloadOffers]);

  const deleteProduct = useCallback(async (productId: string) => {
    const numericId = Number(productId);
    if (!Number.isInteger(numericId)) throw new Error('Product is not connected to a backend record.');
    try {
      await productService.deleteProduct(numericId);
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        return;
      }
      throw err;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const hardDeleteProduct = useCallback(async (productId: string) => {
    const numericId = Number(productId);
    if (!Number.isInteger(numericId)) throw new Error('Product is not connected to a backend record.');
    try {
      await productService.hardDeleteProduct(numericId);
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        return;
      }
      throw err;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const restoreProduct = useCallback(async (productId: string) => {
    const numericId = Number(productId);
    if (!Number.isInteger(numericId)) throw new Error('Product is not connected to a backend record.');
    await productService.restoreProduct(numericId);
    refreshCatalog().catch(() => {});
  }, [refreshCatalog]);

  const toggleProductFeatured = useCallback(async (productId: string) => {
    const product = products.find((item) => item.id === productId);
    const numericId = Number(productId);
    if (!product || !Number.isInteger(numericId)) throw new Error('Product is not connected to a backend record.');

    const nextFeatured = !product.isFeatured;
    const saved = await productService.updateProduct(numericId, { featured: nextFeatured });
    const mapped = mapBackendProduct(saved, subcategories);
    setProducts((prev) => prev.map((item) => (item.id === productId ? mapped : item)));
  }, [products, subcategories]);

  // Admin CRUD for Categories
  const saveCategory = useCallback(async (categoryToSave: Category) => {
    const nameAr = (categoryToSave.name_ar || categoryToSave.name || '').trim();
    const nameEn = (categoryToSave.name_en || categoryToSave.name || nameAr).trim();
    const payload = {
      name: nameAr,
      name_ar: nameAr,
      name_en: nameEn,
      image: categoryToSave.image || null,
      public_id: categoryToSave.public_id || (categoryToSave as any).public_id || undefined,
    };
    const categoryId = Number(categoryToSave.id);
    const saved = Number.isInteger(categoryId)
      ? await categoryService.updateCategory(categoryId, payload)
      : await categoryService.createCategory(payload);
    const mapped = mapBackendCategory(saved);
    setCategories((prev) => {
      const exists = prev.some((category) => category.id === mapped.id);
      return exists ? prev.map((category) => (category.id === mapped.id ? mapped : category)) : [...prev, mapped];
    });
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    const numericId = Number(categoryId);
    if (!Number.isInteger(numericId)) throw new Error('Category is not connected to a backend record.');
    try {
      await categoryService.deleteCategory(numericId);
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        return;
      }
      throw err;
    }
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  }, []);

  const hardDeleteCategory = useCallback(async (categoryId: string) => {
    const numericId = Number(categoryId);
    if (!Number.isInteger(numericId)) throw new Error('Category is not connected to a backend record.');
    try {
      await categoryService.hardDeleteCategory(numericId);
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        return;
      }
      throw err;
    }
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  }, []);

  const restoreCategory = useCallback(async (categoryId: string) => {
    const numericId = Number(categoryId);
    if (!Number.isInteger(numericId)) throw new Error('Category is not connected to a backend record.');
    await categoryService.restoreCategory(numericId);
    refreshCatalog().catch(() => {});
  }, [refreshCatalog]);

  // Admin CRUD for Subcategories
  const saveSubcategory = useCallback(
    async (subToSave: {
      id?: number | string;
      category_id: number | string;
      name: string;
      name_ar?: string;
      name_en?: string;
      image?: string | null;
      public_id?: string | null;
    }) => {
      const nameAr = (subToSave.name_ar || subToSave.name || '').trim();
      const nameEn = (subToSave.name_en || subToSave.name || nameAr).trim();
      const numericCatId =
        typeof subToSave.category_id === 'number'
          ? subToSave.category_id
          : parseInt(String(subToSave.category_id).replace(/\D/g, '') || '1', 10);
      const numericSubId = subToSave.id ? Number(subToSave.id) : undefined;
      if (numericSubId && Number.isInteger(numericSubId) && numericSubId < 1000000000) {
        const saved = await subcategoryService.updateSubcategory(numericSubId, {
          category_id: numericCatId,
          name: nameAr,
          name_ar: nameAr,
          name_en: nameEn,
          image: subToSave.image || null,
          public_id: subToSave.public_id || undefined,
        });
        const normalizedSaved: BackendSubcategory = {
          ...saved,
          name: saved.name || saved.name_ar || saved.name_en || nameAr,
          name_ar: saved.name_ar || nameAr,
          name_en: saved.name_en || nameEn,
          category_id: Number(saved.category_id || numericCatId),
        };
        setSubcategories((prev) =>
          prev.map((s) => (s.id === normalizedSaved.id ? normalizedSaved : s))
        );
        subcategoryService.getSubcategories().then(setSubcategories).catch(() => {});
        return;
      }
      const created = await subcategoryService.createSubcategory({
        category_id: numericCatId,
        name: nameAr,
        name_ar: nameAr,
        name_en: nameEn,
        image: subToSave.image || null,
        public_id: subToSave.public_id || undefined,
      });
      const normalizedCreated: BackendSubcategory = {
        ...created,
        name: created.name || created.name_ar || created.name_en || nameAr,
        name_ar: created.name_ar || nameAr,
        name_en: created.name_en || nameEn,
        category_id: Number(created.category_id || numericCatId),
      };
      setSubcategories((prev) => {
        const withoutNew = prev.filter((s) => s.id !== normalizedCreated.id);
        return [...withoutNew, normalizedCreated];
      });
      subcategoryService.getSubcategories().then(setSubcategories).catch(() => {});
    },
    []
  );

  const deleteSubcategory = useCallback(async (subId: number | string) => {
    const numId = Number(subId);
    if (Number.isInteger(numId) && numId < 1000000000) {
      try {
        await subcategoryService.deleteSubcategory(numId);
      } catch (err: any) {
        if (err?.status === 404 || err?.response?.status === 404) {
          setSubcategories((prev) => prev.filter((s) => String(s.id) !== String(subId)));
          return;
        }
        throw err;
      }
    }
    setSubcategories((prev) => prev.filter((s) => String(s.id) !== String(subId)));
  }, []);

  const hardDeleteSubcategory = useCallback(async (subId: number | string) => {
    const numId = Number(subId);
    if (Number.isInteger(numId) && numId < 1000000000) {
      try {
        await subcategoryService.hardDeleteSubcategory(numId);
      } catch (err: any) {
        if (err?.status === 404 || err?.response?.status === 404) {
          setSubcategories((prev) => prev.filter((s) => String(s.id) !== String(subId)));
          return;
        }
        throw err;
      }
    }
    setSubcategories((prev) => prev.filter((s) => String(s.id) !== String(subId)));
  }, []);

  const restoreSubcategory = useCallback(async (subId: number | string) => {
    const numId = Number(subId);
    if (Number.isInteger(numId) && numId < 1000000000) {
      await subcategoryService.restoreSubcategory(numId);
    }
    refreshCatalog().catch(() => {});
  }, [refreshCatalog]);

  // Admin CRUD for Events
  const saveEvent = useCallback(async (eventToSave: EventItem) => {
    const eventId = Number(eventToSave.id);
    const payload = {
      title: eventToSave.title,
      description: eventToSave.description,
      image: eventToSave.coverImage,
      public_id: eventToSave.publicId || '',
      event_date: eventToSave.date,
    };
    if (!payload.public_id) {
      throw new Error('Upload the event image before saving the event.');
    }
    const saved = Number.isInteger(eventId)
      ? await eventService.updateEvent(eventId, payload)
      : await eventService.createEvent(payload);
    const mapped = mapBackendEvent(saved);
    setEvents((prev) => {
      const exists = prev.some((event) => event.id === mapped.id);
      return exists ? prev.map((event) => (event.id === mapped.id ? mapped : event)) : [mapped, ...prev];
    });
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    const numericId = Number(eventId);
    if (!Number.isInteger(numericId)) throw new Error('Event is not connected to a backend record.');
    await eventService.deleteEvent(numericId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }, []);

  // Admin CRUD for Projects
  const saveProject = useCallback(async (projectToSave: ProjectItem) => {
    const numericId = Number(projectToSave.id);
    const payload: SpaceProjectRequest = {
      customer_name: projectToSave.customerName || projectToSave.title,
      caption: projectToSave.description,
      location: projectToSave.location || '',
      image: projectToSave.coverImage,
      public_id: projectToSave.publicId || '',
      product_id: projectToSave.productId ? Number(projectToSave.productId) : null,
    };
    const saved = Number.isInteger(numericId)
      ? await spaceProjectService.updateProject(numericId, payload)
      : await spaceProjectService.createProject(payload);
    const mapped = mapBackendSpaceProject(saved);
    setProjects((prev) => {
      const exists = prev.some((project) => project.id === mapped.id);
      return exists ? prev.map((project) => (project.id === mapped.id ? mapped : project)) : [mapped, ...prev];
    });
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    const numericId = Number(projectId);
    if (!Number.isInteger(numericId)) throw new Error('Project is not connected to a backend record.');
    await spaceProjectService.deleteProject(numericId);
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  }, []);

  // Banners CRUD
  const saveBanner = useCallback((bannerToSave: BannerItem) => {
    setBanners((prev) => {
      const exists = prev.some((b) => b.id === bannerToSave.id);
      if (exists) {
        return prev.map((b) => (b.id === bannerToSave.id ? bannerToSave : b));
      }
      return [bannerToSave, ...prev];
    });
  }, []);

  const deleteBanner = useCallback((bannerId: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== bannerId));
  }, []);

  const toggleBannerActive = useCallback((bannerId: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b))
    );
  }, []);

  // Settings
  const updateSettings = useCallback(async (newSettings: Partial<StoreSettings>) => {
    const paymentWalletsPatch: Record<string, any> = {};
    let hasWalletChanges = false;

    if (newSettings.paymentMethods) {
      const pm = newSettings.paymentMethods;

      // Mobile Wallet / Vodafone Cash
      const nextMobile = pm.mobileWallet?.number ?? pm.vodafoneCash?.number;
      const currentMobile = settings.paymentMethods.mobileWallet?.number || settings.paymentMethods.vodafoneCash?.number;
      if (nextMobile !== undefined && nextMobile !== currentMobile) {
        hasWalletChanges = true;
        const val = nextMobile.trim() === '' ? null : nextMobile.trim();
        paymentWalletsPatch.mobile_wallet = val;
        paymentWalletsPatch.vodafone_cash = val;
      }

      // InstaPay: address and number inside payment_wallets.instapay
      const nextInstaAddress = pm.instapay?.address;
      const currentInstaAddress = settings.paymentMethods.instapay?.address;
      const nextInstaNumber = pm.instapay?.number;
      const currentInstaNumber = settings.paymentMethods.instapay?.number;

      const addressChanged = nextInstaAddress !== undefined && nextInstaAddress !== currentInstaAddress;
      const numberChanged = nextInstaNumber !== undefined && nextInstaNumber !== currentInstaNumber;

      if (addressChanged || numberChanged) {
        hasWalletChanges = true;
        const instapayPatch: Record<string, string | null> = {};
        if (addressChanged) {
          instapayPatch.address = nextInstaAddress?.trim() === '' ? '' : (nextInstaAddress?.trim() ?? '');
        }
        if (numberChanged) {
          instapayPatch.number = nextInstaNumber?.trim() === '' ? '' : (nextInstaNumber?.trim() ?? '');
        }
        paymentWalletsPatch.instapay = instapayPatch;
      }
    }

    const dashboardPatch: DashboardSettingsPatch = {};
    if (newSettings.depositPercentage !== undefined) {
      dashboardPatch.deposit_percentage = newSettings.depositPercentage;
    }
    if (hasWalletChanges) {
      dashboardPatch.payment_wallets = paymentWalletsPatch;
    }
    if (newSettings.contact?.phone !== undefined) {
      dashboardPatch.phone = newSettings.contact.phone.trim();
    }
    if (newSettings.contact?.whatsapp !== undefined) {
      dashboardPatch.whatsapp = newSettings.contact.whatsapp.trim();
    }
    if (newSettings.contact?.atelierAddress !== undefined) {
      dashboardPatch.address = newSettings.contact.atelierAddress.trim();
    }

    if (Object.keys(dashboardPatch).length === 0) {
      return;
    }

    const saved = await dashboardService.updateSettings(dashboardPatch);
    const savedWallets = saved?.payment_wallets || {};

    let savedInstaAddr: string | undefined;
    let savedInstaNum: string | undefined;
    if (typeof savedWallets.instapay === 'string') {
      savedInstaAddr = savedWallets.instapay;
    } else if (savedWallets.instapay && typeof savedWallets.instapay === 'object') {
      savedInstaAddr = savedWallets.instapay.address;
      savedInstaNum = savedWallets.instapay.number;
    }

    setSettings((prev) => ({
      ...prev,
      depositPercentage: saved?.deposit_percentage !== undefined && saved?.deposit_percentage !== null
        ? Number(saved.deposit_percentage)
        : prev.depositPercentage,
      contact: {
        ...prev.contact,
        phone: saved?.phone !== undefined ? saved.phone : (newSettings.contact?.phone ?? prev.contact.phone),
        whatsapp: saved?.whatsapp !== undefined ? saved.whatsapp : (newSettings.contact?.whatsapp ?? prev.contact.whatsapp),
        atelierAddress: saved?.address !== undefined ? saved.address : (newSettings.contact?.atelierAddress ?? prev.contact.atelierAddress),
        hours: newSettings.contact?.hours ?? prev.contact.hours,
      },
      paymentMethods: {
        ...prev.paymentMethods,
        mobileWallet: {
          ...prev.paymentMethods.mobileWallet,
          number: savedWallets.mobile_wallet || savedWallets.vodafone_cash || (newSettings.paymentMethods?.mobileWallet?.number ?? prev.paymentMethods.mobileWallet.number),
        },
        vodafoneCash: {
          ...prev.paymentMethods.vodafoneCash,
          number: savedWallets.vodafone_cash || savedWallets.mobile_wallet || (newSettings.paymentMethods?.vodafoneCash?.number ?? prev.paymentMethods.vodafoneCash.number),
        },
        instapay: {
          ...prev.paymentMethods.instapay,
          address: savedInstaAddr !== undefined ? savedInstaAddr : (newSettings.paymentMethods?.instapay?.address ?? prev.paymentMethods.instapay.address),
          number: savedInstaNum !== undefined ? savedInstaNum : (newSettings.paymentMethods?.instapay?.number ?? prev.paymentMethods.instapay.number),
        },
      },
    }));
  }, [settings]);

  // User auth & profile
  const loginUser = useCallback((email: string, fullName: string, phone: string) => {
    const u: CustomerUser = {
      id: `usr-${Date.now()}`,
      fullName,
      email,
      phone,
      savedAddresses: [
        {
          id: 'addr-main',
          label: 'Primary Delivery Address',
          governorate: 'Cairo',
          city: 'New Cairo',
          street: 'Main District Boulevard',
          building: 'Villa 12',
        },
      ],
    };
    setUser(u);
  }, []);

  const logoutUser = useCallback(() => {
    setUser(null);
  }, []);

  const saveUserAddress = useCallback((address: CustomerUser['savedAddresses'][0]) => {
    setUser((prev) => {
      if (!prev) return prev;
      const exists = prev.savedAddresses.some((a) => a.id === address.id);
      const updatedList = exists
        ? prev.savedAddresses.map((a) => (a.id === address.id ? address : a))
        : [...prev.savedAddresses, address];
      return { ...prev, savedAddresses: updatedList };
    });
  }, []);

  const deleteUserAddress = useCallback((addressId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        savedAddresses: prev.savedAddresses.filter((a) => a.id !== addressId),
      };
    });
  }, []);

  // Helper getters
  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const getProductBySlug = useCallback(
    (slug: string) => products.find((p) => p.slug === slug),
    [products]
  );

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  return (
    <StoreContext.Provider
      value={{
        activeView,
        selectedProductId,
        selectedCategoryId,
        selectedSubcategoryId,
        setSelectedProductId,
        setSelectedCategoryId,
        setSelectedSubcategoryId,
        searchQuery,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        navigateTo,
        setSearchQuery,
        products,
        categories,
        subcategories,
        orders,
        events,
        projects,
        banners,
        collaborations,
        settings,
        isCatalogLoading,
        catalogError,
        reloadCatalog: refreshCatalog,
        offers,
        isOffersLoading,
        offersError,
        reloadOffers,
        isEventsLoading,
        isProjectsLoading,
        cart,
        user,
        lastCreatedOrder,
        setLastCreatedOrder,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        syncGuestCart,
        cartSubtotal,
        cartDepositAmount,
        cartRemainingAmount,
        cartItemsCount,
        cartOriginalTotal: cartPricing.originalTotal,
        cartDiscountTotal: cartPricing.discountTotal,
        cartFreeShipping: cartPricing.freeShipping,
        createOrder,
        submitPaymentProof,
        updateOrderStatus,
        updatePaymentStatus,
        saveProduct,
        deleteProduct,
        hardDeleteProduct,
        restoreProduct,
        toggleProductFeatured,
        saveCategory,
        deleteCategory,
        hardDeleteCategory,
        restoreCategory,
        saveSubcategory,
        deleteSubcategory,
        hardDeleteSubcategory,
        restoreSubcategory,
        refreshCatalog,
        saveEvent,
        deleteEvent,
        saveProject,
        deleteProject,
        saveBanner,
        deleteBanner,
        toggleBannerActive,
        updateSettings,
        loginUser,
        logoutUser,
        saveUserAddress,
        deleteUserAddress,
        getProductById,
        getProductBySlug,
        getCategoryById,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useToccoStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useToccoStore must be used within a StoreProvider');
  }
  return context;
}
