'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Category,
  Collection,
  Order,
  CustomDesignInquiry,
  EventItem,
  ProjectItem,
  StoreSettings,
  CartItem,
  CustomerUser,
  OrderStatus,
  PaymentStatus,
  PricingMode,
  BannerItem,
  ProductFinish,
} from '@/types';
import { BackendOrder } from '@/types/order';
import { productService } from '@/lib/api/services/productService';
import { categoryService } from '@/lib/api/services/categoryService';
import { cartService } from '@/lib/api/services/cartService';
import { orderService } from '@/lib/api/services/orderService';
import { BackendProduct, BackendProductImage } from '@/types/product';
import { BackendCategory } from '@/types/category';
import { BackendCartItem } from '@/types/cart';
import { eventService } from '@/lib/api/services/eventService';
import { dashboardService } from '@/lib/api/services/dashboardService';
import { BackendEvent } from '@/types/event';

const EMPTY_SETTINGS: StoreSettings = {
  brandName: 'Tocco House',
  tagline: '',
  subTagline: '',
  depositPercentage: 50,
  defaultLeadTime: '',
  defaultShippingTime: '',
  contact: { phone: '', whatsapp: '', email: '', atelierAddress: '', instagramHandle: '', hours: '' },
  paymentMethods: {
    instapay: { active: false, address: '', accountName: '', instructions: '' },
    mobileWallet: { active: false, number: '', provider: '', instructions: '' },
    vodafoneCash: { active: false, number: '', instructions: '' },
    bankTransfer: { active: false, bankName: '', accountNumber: '', iban: '', swift: '', accountHolder: '', instructions: '' },
  },
  homepage: { heroHeading: '', heroSubheading: '', heroCtaText: '', heroImage: '', featuredCollectionId: '', storyQuote: '', storySubtext: '' },
  policies: { shipping: '', returns: '', privacy: '', terms: '', faq: [] },
};

function mapBackendProduct(product: BackendProduct): Product {
  return {
    id: String(product.id),
    slug: String(product.id),
    name: product.name,
    categoryId: String(product.subcategory_ids[0] || ''),
    collectionIds: [],
    shortDescription: product.description,
    detailedDescription: product.description,
    pricingMode: 'fixed',
    price: Number(product.price),
    depositPercentage: 50,
    images: product.images.map((image: BackendProductImage) => image.image),
    dimensions: product.dimensions,
    weight: product.height ? String(product.height) : '',
    material: product.material,
    finishes: product.finish ? [product.finish as ProductFinish] : [],
    colors: product.colors.map((color) => ({ id: String(color.id), name: color.name, hex: color.hex_code })),
    sizes: [],
    leadTime: product.delivery_date || '',
    shippingTime: '',
    isFeatured: false,
    isPublished: !product.deleted_at,
    inStock: true,
    allowsCustomization: false,
    createdAt: product.created_at,
    seoTitle: product.name,
    seoDescription: product.description,
  };
}

function mapBackendCategory(category: BackendCategory): Category {
  return {
    id: String(category.id),
    name: category.name,
    slug: String(category.id),
    description: '',
    image: category.image || '',
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

function mapBackendCartItem(item: BackendCartItem): CartItem {
  return {
    id: String(item.id),
    productId: String(item.product_id),
    productName: item.product_name,
    productImage: item.product_image || '',
    unitPrice: Number(item.product_price),
    selectedFinish: 'Matte',
    selectedColor: item.selected_color
      ? { id: String(item.selected_color.id), name: item.selected_color.name, hex: item.selected_color.hex_code }
      : { id: '', name: '', hex: '#000000' },
    quantity: item.quantity,
  };
}

export type AppView =
  | 'home'
  | 'shop'
  | 'collections'
  | 'product'
  | 'custom-design'
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
  | 'admin';

interface StoreContextType {
  // Navigation & View
  activeView: AppView;
  selectedProductId: string | null;
  selectedCollectionId: string | null;
  selectedCategoryId: string | null;
  searchQuery: string;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  navigateTo: (
    view: AppView,
    options?: { productId?: string; collectionId?: string; categoryId?: string }
  ) => void;
  setSearchQuery: (query: string) => void;

  // Data
  products: Product[];
  categories: Category[];
  collections: Collection[];
  orders: Order[];
  customInquiries: CustomDesignInquiry[];
  events: EventItem[];
  projects: ProjectItem[];
  banners: BannerItem[];
  settings: StoreSettings;
  cart: CartItem[];
  user: CustomerUser | null;
  lastCreatedOrder: BackendOrder | Order | null;
  setLastCreatedOrder: (order: BackendOrder | Order | null) => void;

  // Cart operations
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  updateCartItemNote: (cartItemId: string, note: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDepositAmount: number;
  cartRemainingAmount: number;
  cartItemsCount: number;

  // Checkout & Orders
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Order;
  submitPaymentProof: (orderId: string, proofNote: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;

  // Custom Inquiries
  submitCustomInquiry: (data: Omit<CustomDesignInquiry, 'id' | 'createdAt' | 'status'>) => CustomDesignInquiry;
  updateCustomInquiryStatus: (inquiryId: string, status: CustomDesignInquiry['status']) => void;

  // Admin CRUD operations
  saveProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  toggleProductFeatured: (productId: string) => void;
  toggleProductPricingMode: (productId: string) => void;

  saveCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;

  saveCollection: (collection: Collection) => void;
  deleteCollection: (collectionId: string) => void;

  saveEvent: (event: EventItem) => void;
  deleteEvent: (eventId: string) => void;

  saveProject: (project: ProjectItem) => void;
  deleteProject: (projectId: string) => void;

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
  getCollectionById: (id: string) => Collection | undefined;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Navigation
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Entities
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customInquiries, setCustomInquiries] = useState<CustomDesignInquiry[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(EMPTY_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<BackendOrder | Order | null>(null);

  // Load catalog data from the production backend.
  useEffect(() => {
    let active = true;
    Promise.all([productService.getProducts(), categoryService.getCategories()])
      .then(([backendProducts, backendCategories]) => {
        if (!active) return;
        setProducts(backendProducts.map(mapBackendProduct));
        setCategories(backendCategories.map(mapBackendCategory));
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setCategories([]);
      })
      .finally(() => {
      });

    eventService.getEvents().then((items) => {
      if (active) setEvents(items.map(mapBackendEvent));
    }).catch(() => {
      if (active) setEvents([]);
    });

    dashboardService.getSettings().then((data) => {
      if (!active) return;
      setSettings((current) => ({
        ...current,
        depositPercentage: Number(data.deposit_percentage),
        paymentMethods: {
          ...current.paymentMethods,
          mobileWallet: {
            ...current.paymentMethods.mobileWallet,
            number: data.payment_wallets.vodafone_cash || current.paymentMethods.mobileWallet.number,
          },
          instapay: {
            ...current.paymentMethods.instapay,
            address: data.payment_wallets.instapay || current.paymentMethods.instapay.address,
          },
          vodafoneCash: {
            ...current.paymentMethods.vodafoneCash,
            number: data.payment_wallets.vodafone_cash || current.paymentMethods.vodafoneCash.number,
          },
        },
      }));
    }).catch(() => undefined);

    cartService
      .getCartItems()
      .then((items) => {
        if (active) setCart(items.map(mapBackendCartItem));
      })
      .catch(() => {
        if (active) setCart([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Navigation action
  const navigateTo = useCallback(
    (
      view: AppView,
      options?: { productId?: string; collectionId?: string; categoryId?: string }
    ) => {
      setActiveView(view);
      if (options?.productId !== undefined) setSelectedProductId(options.productId);
      if (options?.collectionId !== undefined) setSelectedCollectionId(options.collectionId);
      if (options?.categoryId !== undefined) setSelectedCategoryId(options.categoryId);

      // Scroll to top on navigation
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  // Cart logic
  const addToCart = useCallback(async (itemData: Omit<CartItem, 'id'>) => {
    const productId = Number(itemData.productId);
    const colorId = itemData.selectedColor.id ? Number(itemData.selectedColor.id) : null;
    if (!Number.isInteger(productId)) {
      throw new Error('This product is not connected to a backend product record.');
    }

    const backendItem = await cartService.addItem({
      product_id: productId,
      color_id: Number.isInteger(colorId) ? colorId : null,
      quantity: itemData.quantity,
    });
    setCart((prev) => {
      const nextItem = mapBackendCartItem(backendItem);
      const existing = prev.find((item) => item.id === nextItem.id);
      return existing
        ? prev.map((item) => (item.id === nextItem.id ? { ...item, ...nextItem } : item))
        : [...prev, nextItem];
    });
    setIsCartDrawerOpen(true);
  }, []);

  const removeFromCart = useCallback(async (cartItemId: string) => {
    await cartService.removeItem(Number(cartItemId));
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  }, []);

  const updateCartQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await cartService.removeItem(Number(cartItemId));
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
      return;
    }
    const updatedItem = await cartService.updateItem(Number(cartItemId), { quantity });
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? mapBackendCartItem(updatedItem) : item))
    );
  }, []);

  const updateCartItemNote = useCallback((cartItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, customNote: note } : item))
    );
  }, []);

  const clearCart = useCallback(async () => {
    await cartService.clearCart();
    setCart([]);
  }, []);

  // Cart calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const depositRatio = (settings.depositPercentage || 50) / 100;
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

  // Custom inquiries
  const submitCustomInquiry = useCallback(
    (data: Omit<CustomDesignInquiry, 'id' | 'createdAt' | 'status'>) => {
      const newInquiry: CustomDesignInquiry = {
        ...data,
        id: `inq-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'new',
      };
      setCustomInquiries((prev) => [newInquiry, ...prev]);
      return newInquiry;
    },
    []
  );

  const updateCustomInquiryStatus = useCallback(
    (inquiryId: string, status: CustomDesignInquiry['status']) => {
      setCustomInquiries((prev) =>
        prev.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq))
      );
    },
    []
  );

  // Admin CRUD for Products
  const saveProduct = useCallback(async (productToSave: Product) => {
    const payload = {
      name: productToSave.name,
      description: productToSave.detailedDescription || productToSave.shortDescription,
      dimensions: productToSave.dimensions,
      price: productToSave.price || 0,
      material: productToSave.material,
      finish: productToSave.finishes[0] || '',
      faq: [],
      subcategory_ids: Number.isInteger(Number(productToSave.categoryId)) ? [Number(productToSave.categoryId)] : [],
      color_ids: productToSave.colors
        .map((color) => Number(color.id))
        .filter((id) => Number.isInteger(id)),
    };
    const productId = Number(productToSave.id);
    const saved = Number.isInteger(productId)
      ? await productService.updateProduct(productId, payload)
      : await productService.createProduct(payload);
    const mapped = mapBackendProduct(saved);
    setProducts((prev) => {
      const exists = prev.some((product) => product.id === mapped.id);
      return exists ? prev.map((product) => (product.id === mapped.id ? mapped : product)) : [mapped, ...prev];
    });
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    const numericId = Number(productId);
    if (!Number.isInteger(numericId)) throw new Error('Product is not connected to a backend record.');
    await productService.deleteProduct(numericId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const toggleProductFeatured = useCallback((productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isFeatured: !p.isFeatured } : p))
    );
  }, []);

  const toggleProductPricingMode = useCallback((productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newMode: PricingMode = p.pricingMode === 'fixed' ? 'on_demand' : 'fixed';
          return {
            ...p,
            pricingMode: newMode,
            price: newMode === 'fixed' && !p.price ? 25000 : p.price,
          };
        }
        return p;
      })
    );
  }, []);

  // Admin CRUD for Categories
  const saveCategory = useCallback(async (categoryToSave: Category) => {
    const payload = { name: categoryToSave.name, image: categoryToSave.image || null };
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
    await categoryService.deleteCategory(numericId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  }, []);

  // Admin CRUD for Collections
  const saveCollection = useCallback((collectionToSave: Collection) => {
    setCollections((prev) => {
      const exists = prev.some((c) => c.id === collectionToSave.id);
      if (exists) {
        return prev.map((c) => (c.id === collectionToSave.id ? collectionToSave : c));
      }
      return [...prev, collectionToSave];
    });
  }, []);

  const deleteCollection = useCallback((collectionId: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
  }, []);

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
  const saveProject = useCallback((projectToSave: ProjectItem) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === projectToSave.id);
      if (exists) {
        return prev.map((p) => (p.id === projectToSave.id ? projectToSave : p));
      }
      return [projectToSave, ...prev];
    });
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
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
    const paymentWallets: Record<string, string> = {};
    const mobileWallet = newSettings.paymentMethods?.mobileWallet?.number;
    const vodafoneCash = newSettings.paymentMethods?.vodafoneCash?.number;
    const instapay = newSettings.paymentMethods?.instapay?.address;
    if (mobileWallet) paymentWallets.mobile_wallet = mobileWallet;
    if (vodafoneCash) paymentWallets.vodafone_cash = vodafoneCash;
    if (instapay) paymentWallets.instapay = instapay;

    const dashboardPatch = {
      deposit_percentage: newSettings.depositPercentage,
      payment_wallets: Object.keys(paymentWallets).length > 0 ? paymentWallets : undefined,
    };
    if (dashboardPatch.deposit_percentage === undefined && !dashboardPatch.payment_wallets) {
      return;
    }

    const saved = await dashboardService.updateSettings(dashboardPatch);
    setSettings((prev) => ({
      ...prev,
      depositPercentage: Number(saved.deposit_percentage),
      paymentMethods: {
        ...prev.paymentMethods,
        mobileWallet: {
          ...prev.paymentMethods.mobileWallet,
          number: saved.payment_wallets.mobile_wallet || prev.paymentMethods.mobileWallet.number,
        },
        vodafoneCash: {
          ...prev.paymentMethods.vodafoneCash,
          number: saved.payment_wallets.vodafone_cash || prev.paymentMethods.vodafoneCash.number,
        },
        instapay: {
          ...prev.paymentMethods.instapay,
          address: saved.payment_wallets.instapay || prev.paymentMethods.instapay.address,
        },
      },
    }));
  }, []);

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

  const getCollectionById = useCallback(
    (id: string) => collections.find((c) => c.id === id),
    [collections]
  );

  return (
    <StoreContext.Provider
      value={{
        activeView,
        selectedProductId,
        selectedCollectionId,
        selectedCategoryId,
        searchQuery,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        navigateTo,
        setSearchQuery,
        products,
        categories,
        collections,
        orders,
        customInquiries,
        events,
        projects,
        banners,
        settings,
        cart,
        user,
        lastCreatedOrder,
        setLastCreatedOrder,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartItemNote,
        clearCart,
        cartSubtotal,
        cartDepositAmount,
        cartRemainingAmount,
        cartItemsCount,
        createOrder,
        submitPaymentProof,
        updateOrderStatus,
        updatePaymentStatus,
        submitCustomInquiry,
        updateCustomInquiryStatus,
        saveProduct,
        deleteProduct,
        toggleProductFeatured,
        toggleProductPricingMode,
        saveCategory,
        deleteCategory,
        saveCollection,
        deleteCollection,
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
        getCollectionById,
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
