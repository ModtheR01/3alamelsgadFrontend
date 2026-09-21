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
} from '@/types';
import { BackendOrder } from '@/types/order';
import {
  INITIAL_CATEGORIES,
  INITIAL_COLLECTIONS,
  INITIAL_PRODUCTS,
  INITIAL_EVENTS,
  INITIAL_PROJECTS,
  INITIAL_STORE_SETTINGS,
  INITIAL_BANNERS,
} from './data';

const STORAGE_KEY_PREFIX = 'tocco_house_v1_';

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
  resetAllDataToDefaults: () => void;

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

const DEFAULT_USER: CustomerUser = {
  id: 'usr-default',
  fullName: 'Karim Mansour',
  email: 'karim.mansour@example.com',
  phone: '+20 100 987 6543',
  savedAddresses: [
    {
      id: 'addr-1',
      label: 'Sahel Summer Residence',
      governorate: 'Matrouh',
      city: 'Marassi, Sidi Abdel Rahman',
      street: 'Catania Village, Villa 42',
      building: 'Private Villa',
    },
    {
      id: 'addr-2',
      label: 'Cairo Residence',
      governorate: 'Cairo',
      city: 'New Cairo, First Settlement',
      street: 'El Narges 3, Building 18',
      building: 'Apt 402',
    },
  ],
};

const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'TH-2026-8812',
    createdAt: '2026-03-08T14:20:00Z',
    customer: {
      fullName: 'Karim Mansour',
      phone: '+20 100 987 6543',
      email: 'karim.mansour@example.com',
      governorate: 'Matrouh',
      city: 'Marassi, North Coast',
      street: 'Catania Village, Villa 42',
      buildingDetails: 'Private Villa with pool deck access',
    },
    items: [
      {
        id: 'ci-1',
        productId: 'prod-peach-table',
        productName: 'Peach Blush Cocktail Table',
        productImage: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85',
        unitPrice: 26500,
        selectedFinish: 'Glossy',
        selectedColor: { id: 'c-peach', name: 'Peach Blush', hex: '#D97750' },
        quantity: 1,
        customNote: 'Please ensure high gloss UV lacquer suitable for outdoor coastal terrace.',
      },
    ],
    totalAmount: 26500,
    depositPercentage: 50,
    depositAmount: 13250,
    remainingAmount: 13250,
    paymentMethod: 'instapay',
    paymentStatus: 'payment_verified',
    orderStatus: 'in_production',
    orderNote: 'Delivery requested before Eid weekend.',
    paymentProofNote: 'InstaPay reference #IP894723 sent via WhatsApp on March 8.',
    paymentProofDate: '2026-03-08T14:35:00Z',
  },
  {
    id: 'ord-1002',
    orderNumber: 'TH-2026-8809',
    createdAt: '2026-03-04T11:15:00Z',
    customer: {
      fullName: 'Nour El Din',
      phone: '+20 102 334 5566',
      email: 'nour.eldin@example.com',
      governorate: 'Cairo',
      city: 'Zamalek',
      street: '26th of July St, Apt 7B',
    },
    items: [
      {
        id: 'ci-2',
        productId: 'prod-cocona-table',
        productName: 'Cocona Sculptural Table',
        productImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
        unitPrice: 38000,
        selectedFinish: 'Textured Mineral',
        selectedColor: { id: 'c-travertine', name: 'Travertine Bone', hex: '#EBE3D5' },
        quantity: 1,
      },
    ],
    totalAmount: 38000,
    depositPercentage: 50,
    depositAmount: 19000,
    remainingAmount: 19000,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'payment_verified',
    orderStatus: 'ready_for_shipping',
    paymentProofNote: 'CIB wire transfer confirmation uploaded.',
    paymentProofDate: '2026-03-04T16:00:00Z',
  },
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Navigation
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Entities
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customInquiries, setCustomInquiries] = useState<CustomDesignInquiry[]>([]);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [banners, setBanners] = useState<BannerItem[]>(INITIAL_BANNERS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<CustomerUser | null>(DEFAULT_USER);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<BackendOrder | Order | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load from local storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        const savedProducts = localStorage.getItem(STORAGE_KEY_PREFIX + 'products');
        if (savedProducts) setProducts(JSON.parse(savedProducts));

        const savedCategories = localStorage.getItem(STORAGE_KEY_PREFIX + 'categories');
        if (savedCategories) setCategories(JSON.parse(savedCategories));

        const savedCollections = localStorage.getItem(STORAGE_KEY_PREFIX + 'collections');
        if (savedCollections) setCollections(JSON.parse(savedCollections));

        const savedOrders = localStorage.getItem(STORAGE_KEY_PREFIX + 'orders');
        if (savedOrders) setOrders(JSON.parse(savedOrders));

        const savedInquiries = localStorage.getItem(STORAGE_KEY_PREFIX + 'custom_inquiries');
        if (savedInquiries) setCustomInquiries(JSON.parse(savedInquiries));

        const savedEvents = localStorage.getItem(STORAGE_KEY_PREFIX + 'events');
        if (savedEvents) setEvents(JSON.parse(savedEvents));

        const savedProjects = localStorage.getItem(STORAGE_KEY_PREFIX + 'projects');
        if (savedProjects) setProjects(JSON.parse(savedProjects));

        const savedSettings = localStorage.getItem(STORAGE_KEY_PREFIX + 'settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed?.homepage?.heroImage?.includes('photo-1512917774080')) {
            parsed.homepage.heroImage = '/images/hero_villa_clean.jpg';
          }
          if (parsed?.contact) {
            parsed.contact.phone = '+20 10 80182663';
            parsed.contact.whatsapp = '+201080182663';
          }
          if (parsed?.paymentMethods?.mobileWallet) {
            parsed.paymentMethods.mobileWallet.number = '010 8018 2663';
          }
          if (parsed?.paymentMethods?.vodafoneCash) {
            parsed.paymentMethods.vodafoneCash.number = '010 8018 2663';
          }
          setSettings(parsed);
        }

        const savedCart = localStorage.getItem(STORAGE_KEY_PREFIX + 'cart');
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedUser = localStorage.getItem(STORAGE_KEY_PREFIX + 'user');
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (e) {
        console.warn('Could not read from localStorage', e);
      } finally {
        setIsInitialized(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save to local storage on state change
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(products));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'categories', JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'collections', JSON.stringify(collections));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'orders', JSON.stringify(orders));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'custom_inquiries', JSON.stringify(customInquiries));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'events', JSON.stringify(events));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'projects', JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'cart', JSON.stringify(cart));
      if (user) {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'user', JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'user');
      }
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [products, categories, collections, orders, customInquiries, events, projects, settings, cart, user, isInitialized]);

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
  const addToCart = useCallback((itemData: Omit<CartItem, 'id'>) => {
    setCart((prev) => {
      // check if identical item exists (same product, finish, color, size)
      const existingIdx = prev.findIndex(
        (it) =>
          it.productId === itemData.productId &&
          it.selectedFinish === itemData.selectedFinish &&
          it.selectedColor.id === itemData.selectedColor.id &&
          it.selectedSize?.id === itemData.selectedSize?.id
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + itemData.quantity,
          customNote: itemData.customNote || updated[existingIdx].customNote,
        };
        return updated;
      }

      const newItem: CartItem = {
        ...itemData,
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      };
      return [...prev, newItem];
    });

    setIsCartDrawerOpen(true);
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  }, []);

  const updateCartQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  }, []);

  const updateCartItemNote = useCallback((cartItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, customNote: note } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
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
  const saveProduct = useCallback((productToSave: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === productToSave.id);
      if (exists) {
        return prev.map((p) => (p.id === productToSave.id ? productToSave : p));
      }
      return [productToSave, ...prev];
    });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
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
  const saveCategory = useCallback((categoryToSave: Category) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === categoryToSave.id);
      if (exists) {
        return prev.map((c) => (c.id === categoryToSave.id ? categoryToSave : c));
      }
      return [...prev, categoryToSave];
    });
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
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
  const saveEvent = useCallback((eventToSave: EventItem) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === eventToSave.id);
      if (exists) {
        return prev.map((e) => (e.id === eventToSave.id ? eventToSave : e));
      }
      return [eventToSave, ...prev];
    });
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
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
  const updateSettings = useCallback((newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      contact: { ...prev.contact, ...(newSettings.contact || {}) },
      homepage: { ...prev.homepage, ...(newSettings.homepage || {}) },
      paymentMethods: { ...prev.paymentMethods, ...(newSettings.paymentMethods || {}) },
      policies: { ...prev.policies, ...(newSettings.policies || {}) },
    }));
  }, []);

  const resetAllDataToDefaults = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'products');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'categories');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'collections');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'orders');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'custom_inquiries');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'events');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'projects');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'settings');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'cart');
    }
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setCollections(INITIAL_COLLECTIONS);
    setOrders([]);
    setCustomInquiries([]);
    setEvents(INITIAL_EVENTS);
    setProjects(INITIAL_PROJECTS);
    setSettings(INITIAL_STORE_SETTINGS);
    setCart([]);
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
        resetAllDataToDefaults,
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
