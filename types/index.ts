export type ProductFinish = 'MATTE' | 'GLOSSY';

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
}

export interface ProductSize {
  id: string;
  name: string;
  dimensions: string;
  priceDelta: number; // in EGP
}

export interface ProductImageDraft {
  image: string;
  public_id?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  subcategoryIds: string[];
  description: string;
  price: number; // in EGP
  images: string[];
  imageRecords?: ProductImageDraft[];
  dimensions: string;
  deliveryDays?: number | null;
  material: string;
  finishes: ProductFinish[];
  colors: ProductColor[];
  sizes?: ProductSize[];
  faq: { question: string; answer: string }[];
  height?: string;
  leadTime: string; // e.g. "2–3 weeks handcrafted production"
  shippingTime?: string; // e.g. "5–7 days white-glove delivery"
  isFeatured: boolean;
  isPublished: boolean;
  inStock: boolean;
  allowsCustomization: boolean;
  createdAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isFeatured: boolean;
  displayOrder: number;
  order?: number;
  isVisible: boolean;
}

export interface CartItem {
  id: string; // cart item unique id
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  selectedFinish: ProductFinish;
  selectedColor: ProductColor;
  selectedSize?: ProductSize;
  quantity: number;
  // Backend-computed pricing (from active offers), when available
  subtotal?: number;
  originalSubtotal?: number;
  discountAmount?: number;
  offerName?: string;
}

export type OrderStatus =
  | 'order_placed'
  | 'deposit_pending'
  | 'pending_deposit'
  | 'proof_submitted'
  | 'payment_verified'
  | 'in_production'
  | 'quality_check'
  | 'ready_for_shipping'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'pending_deposit'
  | 'proof_submitted'
  | 'payment_verified'
  | 'payment_rejected'
  | 'fully_paid'
  | 'refunded';

export type PaymentMethodId = 'instapay' | 'mobile_wallet' | 'vodafone_cash' | 'bank_transfer';
export type PaymentMethod = PaymentMethodId;

export interface OrderCustomer {
  fullName: string;
  phone: string;
  email: string;
  governorate: string;
  city: string;
  streetAddress?: string;
  street?: string;
  buildingDetails?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "TH-2026-8812"
  createdAt: string;
  customer: OrderCustomer;
  items: CartItem[];
  totalAmount: number; // in EGP
  depositAmount: number; // 50%
  remainingAmount: number; // 50%
  depositPercentage: number;
  paymentMethod: PaymentMethodId;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  orderNote?: string;
  paymentProofNote?: string;
  paymentProofDate?: string;
}

export interface EventItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  location: string;
  city: string;
  date: string;
  time?: string;
  coverImage: string;
  publicId?: string;
  gallery?: string[];
  status: 'upcoming' | 'ongoing' | 'past';
  isUpcoming?: boolean;
  link?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  coverImage: string;
  gallery: string[];
  productsUsed: string[];
  featuredPieces?: string[];
  year: string;
  customerName?: string;
  publicId?: string;
  productId?: string;
}

export interface StoreSettings {
  brandName: string;
  tagline: string;
  subTagline: string;
  depositPercentage: number;
  defaultLeadTime: string;
  defaultShippingTime: string;
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    atelierAddress: string;
    mapUrl: string;
    instagramHandles: string[];
    hours: string;
  };
  paymentMethods: {
    instapay: {
      active: boolean;
      address: string;
      accountName: string;
      instructions: string;
    };
    mobileWallet: {
      active: boolean;
      number: string;
      provider: string;
      instructions: string;
    };
    vodafoneCash: {
      active: boolean;
      number: string;
      instructions: string;
    };
    bankTransfer: {
      active: boolean;
      bankName: string;
      accountNumber?: string;
      iban: string;
      swift: string;
      accountHolder: string;
      accountName?: string;
      instructions: string;
    };
  };
  homepage: {
    heroHeading: string;
    heroSubheading: string;
    heroCtaText: string;
    heroImage: string;
    storyQuote: string;
    storySubtext: string;
  };
  policies: {
    shipping: string;
    returns: string;
    privacy: string;
    terms: string;
    faq: { question: string; answer: string }[];
  };
}

export type BannerType = 'all' | 'new_product' | 'special_offer' | 'upcoming_event' | 'custom_service';

export interface BannerItem {
  id: string;
  type: 'new_product' | 'special_offer' | 'upcoming_event' | 'custom_service';
  categoryLabel: string;
  badgeText: string;
  title: string;
  subtitle: string;
  tagHighlight?: string;
  image: string;
  ctaText: string;
  actionType: 'navigate' | 'copy_code';
  targetView?: string;
  targetId?: string;
  promoCode?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CustomerUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role?: 'ADMIN' | 'MODERATOR' | 'CUSTOMER';
  savedAddresses: {
    id: string;
    label: string;
    governorate: string;
    city: string;
    street: string;
    building: string;
    apartment?: string;
    is_default?: boolean;
  }[];
}

export * from './auth';
export * from './category';
export * from './product';
export * from './cart';
