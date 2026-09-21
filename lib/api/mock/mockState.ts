import {
  INITIAL_MOCK_USERS,
  INITIAL_MOCK_ADDRESSES,
  INITIAL_MOCK_CATEGORIES,
  INITIAL_MOCK_SUBCATEGORIES,
  INITIAL_MOCK_COLORS,
  INITIAL_MOCK_PRODUCT_IMAGES,
  INITIAL_MOCK_PRODUCTS,
  INITIAL_MOCK_CARTS,
  INITIAL_MOCK_ORDERS,
  MockUserRecord,
  MockAddressRecord,
  MockCategoryRecord,
  MockSubcategoryRecord,
  MockCartRecord,
} from './mockData';
import { BackendOrder, BackendOrderItem, BackendOrderStatus } from '@/types/order';
import { UserRole } from '@/types/auth';
import {
  BackendCategory,
  BackendSubcategory,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  SubcategoryCreateRequest,
  SubcategoryUpdateRequest,
} from '@/types/category';
import {
  BackendColor,
  ColorCreateRequest,
  ColorUpdateRequest,
  BackendProductImage,
  ProductImageCreateRequest,
  ProductImageUpdateRequest,
  BackendProduct,
  ProductCreateRequest,
  ProductUpdateRequest,
} from '@/types/product';
import {
  BackendCart,
  BackendCartItem,
  CartItemCreateRequest,
  CartItemUpdateRequest,
} from '@/types/cart';

export type TestScenario =
  | 'normal'
  | 'expired_access_token'
  | 'missing_refresh_token'
  | 'invalid_refresh_token'
  | 'inactive_user'
  | 'forbidden_admin'
  | 'duplicate_address'
  | 'duplicate_category'
  | 'duplicate_subcategory'
  | 'duplicate_color'
  | 'duplicate_product'
  | 'protected_category_delete'
  | 'invalid_category_reference'
  | 'network_error'
  | 'server_error';

class MockStateManager {
  private users: MockUserRecord[] = [...INITIAL_MOCK_USERS];
  private addresses: MockAddressRecord[] = [...INITIAL_MOCK_ADDRESSES];
  private categories: MockCategoryRecord[] = [...INITIAL_MOCK_CATEGORIES];
  private subcategories: MockSubcategoryRecord[] = [...INITIAL_MOCK_SUBCATEGORIES];
  private colors: BackendColor[] = [...INITIAL_MOCK_COLORS];
  private productImages: BackendProductImage[] = [...INITIAL_MOCK_PRODUCT_IMAGES];
  private products: BackendProduct[] = [...INITIAL_MOCK_PRODUCTS];
  private carts: MockCartRecord[] = [...INITIAL_MOCK_CARTS];
  private orders: BackendOrder[] = [...INITIAL_MOCK_ORDERS];
  private currentUserId: number | null = 1; // Default Anas Sayed (Customer)
  private hasAccessToken: boolean = true;
  private hasRefreshToken: boolean = true;
  private isAccessTokenExpired: boolean = false;
  private activeScenario: TestScenario = 'normal';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedUsers = localStorage.getItem('tocco_mock_users');
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      }
      const storedAddresses = localStorage.getItem('tocco_mock_addresses');
      if (storedAddresses) {
        this.addresses = JSON.parse(storedAddresses);
      }
      const storedCategories = localStorage.getItem('tocco_mock_categories');
      if (storedCategories) {
        this.categories = JSON.parse(storedCategories);
      }
      const storedSubcategories = localStorage.getItem('tocco_mock_subcategories');
      if (storedSubcategories) {
        this.subcategories = JSON.parse(storedSubcategories);
        this.subcategories.forEach((s) => {
          if (s.image && s.image.includes('photo-1533090161767-e6ffed986b88')) {
            s.image = s.image.replace('photo-1533090161767-e6ffed986b88', 'photo-1616486338812-3dadae4b4ace');
          }
        });
      }
      const storedColors = localStorage.getItem('tocco_mock_colors');
      if (storedColors) {
        this.colors = JSON.parse(storedColors);
      }
      const storedProductImages = localStorage.getItem('tocco_mock_product_images');
      if (storedProductImages) {
        this.productImages = JSON.parse(storedProductImages);
        this.productImages.forEach((pi) => {
          if (pi.image && pi.image.includes('photo-1533090161767-e6ffed986b88')) {
            pi.image = pi.image.replace('photo-1533090161767-e6ffed986b88', 'photo-1616486338812-3dadae4b4ace');
          }
        });
      }
      const storedProducts = localStorage.getItem('tocco_mock_products');
      if (storedProducts) {
        this.products = JSON.parse(storedProducts);
      }
      const storedCarts = localStorage.getItem('tocco_mock_carts');
      if (storedCarts) {
        this.carts = JSON.parse(storedCarts);
      }
      const storedOrders = localStorage.getItem('tocco_mock_orders');
      if (storedOrders) {
        this.orders = JSON.parse(storedOrders);
      }
      const storedUserId = localStorage.getItem('tocco_mock_current_user_id');
      if (storedUserId !== null) {
        this.currentUserId = storedUserId === 'null' ? null : Number(storedUserId);
      }
      const storedScenario = localStorage.getItem('tocco_mock_scenario') as TestScenario | null;
      if (storedScenario) {
        this.activeScenario = storedScenario;
      }
    } catch {
      // Ignore parse errors, use defaults
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('tocco_mock_users', JSON.stringify(this.users));
      localStorage.setItem('tocco_mock_addresses', JSON.stringify(this.addresses));
      localStorage.setItem('tocco_mock_categories', JSON.stringify(this.categories));
      localStorage.setItem('tocco_mock_subcategories', JSON.stringify(this.subcategories));
      localStorage.setItem('tocco_mock_colors', JSON.stringify(this.colors));
      localStorage.setItem('tocco_mock_product_images', JSON.stringify(this.productImages));
      localStorage.setItem('tocco_mock_products', JSON.stringify(this.products));
      localStorage.setItem('tocco_mock_carts', JSON.stringify(this.carts));
      localStorage.setItem('tocco_mock_orders', JSON.stringify(this.orders));
      localStorage.setItem('tocco_mock_current_user_id', String(this.currentUserId));
      localStorage.setItem('tocco_mock_scenario', this.activeScenario);
    } catch {
      // Ignore storage errors
    }
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((fn) => fn());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Scenario management
  getScenario(): TestScenario {
    return this.activeScenario;
  }

  setScenario(scenario: TestScenario) {
    this.activeScenario = scenario;
    if (scenario === 'expired_access_token') {
      this.isAccessTokenExpired = true;
    } else if (scenario === 'missing_refresh_token') {
      this.hasRefreshToken = false;
    } else if (scenario === 'invalid_refresh_token') {
      this.hasRefreshToken = true;
    } else if (scenario === 'normal') {
      this.hasAccessToken = true;
      this.hasRefreshToken = true;
      this.isAccessTokenExpired = false;
    }
    this.notify();
  }

  // Session management
  getCurrentUserId(): number | null {
    return this.currentUserId;
  }

  getCurrentUser(): MockUserRecord | null {
    if (this.currentUserId === null) return null;
    return this.users.find((u) => u.id === this.currentUserId && u.is_active && !u.deleted_at) || null;
  }

  setCurrentUser(userId: number | null) {
    this.currentUserId = userId;
    if (userId !== null) {
      this.hasAccessToken = true;
      this.hasRefreshToken = true;
      this.isAccessTokenExpired = false;
    } else {
      this.hasAccessToken = false;
      this.hasRefreshToken = false;
    }
    this.notify();
  }

  switchSimulatedUser(role: UserRole) {
    const target = this.users.find((u) => u.role === role && u.is_active);
    if (target) {
      this.setCurrentUser(target.id);
    }
  }

  // Auth tokens simulation
  isTokenExpired(): boolean {
    return this.isAccessTokenExpired;
  }

  getHasAccessToken(): boolean {
    return this.hasAccessToken;
  }

  setTokenExpired(expired: boolean) {
    this.isAccessTokenExpired = expired;
    this.notify();
  }

  hasValidRefresh(): boolean {
    if (this.activeScenario === 'missing_refresh_token') return false;
    if (this.activeScenario === 'invalid_refresh_token') return false;
    return this.hasRefreshToken;
  }

  refreshTokens(): boolean {
    if (!this.hasValidRefresh()) {
      return false;
    }
    this.hasAccessToken = true;
    this.isAccessTokenExpired = false;
    if (this.activeScenario === 'expired_access_token') {
      this.activeScenario = 'normal';
    }
    this.notify();
    return true;
  }

  clearSession() {
    this.currentUserId = null;
    this.hasAccessToken = false;
    this.hasRefreshToken = false;
    this.isAccessTokenExpired = false;
    this.notify();
  }

  // User database operations
  getAllUsers(): MockUserRecord[] {
    return [...this.users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getUserById(id: number): MockUserRecord | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): MockUserRecord | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByPhone(phone: string): MockUserRecord | undefined {
    return this.users.find((u) => u.phone === phone);
  }

  addUser(user: Omit<MockUserRecord, 'id' | 'created_at'>): MockUserRecord {
    const newId = this.users.length > 0 ? Math.max(...this.users.map((u) => u.id)) + 1 : 1;
    const record: MockUserRecord = {
      ...user,
      id: newId,
      created_at: new Date().toISOString(),
    };
    this.users.push(record);
    this.notify();
    return record;
  }

  updateUser(id: number, data: Partial<MockUserRecord>): MockUserRecord {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    this.users[idx] = { ...this.users[idx], ...data };
    this.notify();
    return this.users[idx];
  }

  softDeleteUser(id: number) {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.users[idx] = {
        ...this.users[idx],
        is_active: false,
        deleted_at: new Date().toISOString(),
      };
      if (this.currentUserId === id) {
        this.clearSession();
      } else {
        this.notify();
      }
    }
  }

  // Address database operations
  getUserAddresses(userId: number): MockAddressRecord[] {
    const list = this.addresses.filter((a) => a.user_id === userId);
    // Sort: default addresses first, newest first
    return list.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  getAddressById(addressId: number, userId: number): MockAddressRecord | undefined {
    return this.addresses.find((a) => a.id === addressId && a.user_id === userId);
  }

  checkDuplicateAddress(
    userId: number,
    data: {
      title: string;
      country: string;
      city: string;
      street: string;
      building_number: string;
      apartment_number: string;
    },
    excludeAddressId?: number
  ): boolean {
    if (this.activeScenario === 'duplicate_address') {
      return true;
    }
    const normalize = (s: string) => s.trim().toLowerCase();
    return this.addresses.some(
      (a) =>
        a.user_id === userId &&
        a.id !== excludeAddressId &&
        normalize(a.title) === normalize(data.title) &&
        normalize(a.country) === normalize(data.country) &&
        normalize(a.city) === normalize(data.city) &&
        normalize(a.street) === normalize(data.street) &&
        normalize(a.building_number) === normalize(data.building_number) &&
        normalize(a.apartment_number) === normalize(data.apartment_number)
    );
  }

  createAddress(userId: number, data: Omit<MockAddressRecord, 'id' | 'user_id' | 'created_at'>): MockAddressRecord {
    const existing = this.getUserAddresses(userId);
    const isFirstAddress = existing.length === 0;
    // Rule: First address automatically becomes default
    const shouldBeDefault = isFirstAddress || Boolean(data.is_default);

    if (shouldBeDefault) {
      // Clear previous defaults for this user
      this.addresses = this.addresses.map((a) =>
        a.user_id === userId ? { ...a, is_default: false } : a
      );
    }

    const newId = this.addresses.length > 0 ? Math.max(...this.addresses.map((a) => a.id)) + 1 : 1;
    const record: MockAddressRecord = {
      ...data,
      id: newId,
      user_id: userId,
      is_default: shouldBeDefault,
      created_at: new Date().toISOString(),
    };
    this.addresses.push(record);
    this.notify();
    return record;
  }

  updateAddress(
    userId: number,
    addressId: number,
    data: Partial<Omit<MockAddressRecord, 'id' | 'user_id' | 'created_at'>>
  ): MockAddressRecord {
    const idx = this.addresses.findIndex((a) => a.id === addressId && a.user_id === userId);
    if (idx === -1) throw new Error('Address not found');

    if (data.is_default) {
      this.addresses = this.addresses.map((a) =>
        a.user_id === userId && a.id !== addressId ? { ...a, is_default: false } : a
      );
    }

    this.addresses[idx] = { ...this.addresses[idx], ...data };
    this.notify();
    return this.addresses[idx];
  }

  deleteAddress(userId: number, addressId: number) {
    const target = this.addresses.find((a) => a.id === addressId && a.user_id === userId);
    this.addresses = this.addresses.filter((a) => !(a.id === addressId && a.user_id === userId));

    // If deleted address was default, make the newest remaining address default
    if (target?.is_default) {
      const remaining = this.getUserAddresses(userId);
      if (remaining.length > 0) {
        const first = remaining[0];
        const idx = this.addresses.findIndex((a) => a.id === first.id);
        if (idx !== -1) {
          this.addresses[idx].is_default = true;
        }
      }
    }

    this.notify();
  }

  setDefaultAddress(userId: number, addressId: number): MockAddressRecord {
    const target = this.addresses.find((a) => a.id === addressId && a.user_id === userId);
    if (!target) throw new Error('Address not found');

    this.addresses = this.addresses.map((a) =>
      a.user_id === userId ? { ...a, is_default: a.id === addressId } : a
    );
    this.notify();
    return { ...target, is_default: true };
  }

  // ==========================================
  // Category Methods
  // ==========================================

  private serializeCategory(record: MockCategoryRecord): BackendCategory {
    // Django CategorySerializer strictly exposes: id, name, image, public_id, created_at, updated_at
    return {
      id: record.id,
      name: record.name,
      image: record.image,
      public_id: record.public_id,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }

  getCategories(includeDeleted = false): BackendCategory[] {
    return this.categories
      .filter((c) => (includeDeleted ? true : !c.deleted_at))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => this.serializeCategory(c));
  }

  getDeletedCategories(): BackendCategory[] {
    return this.categories
      .filter((c) => Boolean(c.deleted_at))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => this.serializeCategory(c));
  }

  getCategoryRecordById(id: number): MockCategoryRecord | undefined {
    return this.categories.find((c) => c.id === id);
  }

  getCategoryById(id: number): BackendCategory | undefined {
    const found = this.categories.find((c) => c.id === id);
    return found ? this.serializeCategory(found) : undefined;
  }

  isCategoryNameDuplicate(name: string, excludeId?: number): boolean {
    const normalized = name.trim().toLowerCase();
    return this.categories.some(
      (c) => !c.deleted_at && c.name.trim().toLowerCase() === normalized && c.id !== excludeId
    );
  }

  categoryHasSubcategories(categoryId: number): boolean {
    // Checks if any subcategories (active or deleted) reference this category (on_delete=models.PROTECT)
    return this.subcategories.some((s) => s.category_id === categoryId);
  }

  getActiveSubcategoriesCount(categoryId: number): number {
    return this.subcategories.filter((s) => s.category_id === categoryId && !s.deleted_at).length;
  }

  addCategory(data: CategoryCreateRequest): BackendCategory {
    const nextId = this.categories.length > 0 ? Math.max(...this.categories.map((c) => c.id)) + 1 : 1;
    const now = new Date().toISOString();
    const record: MockCategoryRecord = {
      id: nextId,
      name: data.name.trim(),
      image: data.image || null,
      public_id: data.public_id || null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    this.categories.push(record);
    this.notify();
    return this.serializeCategory(record);
  }

  updateCategory(id: number, data: CategoryUpdateRequest): BackendCategory {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');

    const existing = this.categories[idx];
    const updated: MockCategoryRecord = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      image: data.image !== undefined ? data.image : existing.image,
      public_id: data.public_id !== undefined ? data.public_id : existing.public_id,
      updated_at: new Date().toISOString(),
    };
    this.categories[idx] = updated;
    this.notify();
    return this.serializeCategory(updated);
  }

  softDeleteCategory(id: number): void {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');

    const now = new Date().toISOString();
    this.categories[idx] = {
      ...this.categories[idx],
      deleted_at: now,
      updated_at: now,
    };
    this.notify();
  }

  restoreCategory(id: number): BackendCategory {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');

    const now = new Date().toISOString();
    this.categories[idx] = {
      ...this.categories[idx],
      deleted_at: null,
      updated_at: now,
    };
    this.notify();
    return this.serializeCategory(this.categories[idx]);
  }

  hardDeleteCategory(id: number): void {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');

    this.categories.splice(idx, 1);
    this.notify();
  }

  // ==========================================
  // Subcategory Methods
  // ==========================================

  getSubcategories(includeDeleted = false): BackendSubcategory[] {
    return this.subcategories
      .filter((s) => (includeDeleted ? true : !s.deleted_at))
      .sort((a, b) => (a.category_id !== b.category_id ? a.category_id - b.category_id : a.name.localeCompare(b.name)))
      .map((s) => ({ ...s }));
  }

  getDeletedSubcategories(): BackendSubcategory[] {
    return this.subcategories
      .filter((s) => Boolean(s.deleted_at))
      .sort((a, b) => (a.category_id !== b.category_id ? a.category_id - b.category_id : a.name.localeCompare(b.name)))
      .map((s) => ({ ...s }));
  }

  getSubcategoryRecordById(id: number): MockSubcategoryRecord | undefined {
    return this.subcategories.find((s) => s.id === id);
  }

  getSubcategoryById(id: number): BackendSubcategory | undefined {
    const found = this.subcategories.find((s) => s.id === id);
    return found ? { ...found } : undefined;
  }

  isSubcategoryNameDuplicate(categoryId: number, name: string, excludeId?: number): boolean {
    const normalized = name.trim().toLowerCase();
    return this.subcategories.some(
      (s) =>
        !s.deleted_at &&
        s.category_id === categoryId &&
        s.name.trim().toLowerCase() === normalized &&
        s.id !== excludeId
    );
  }

  addSubcategory(data: SubcategoryCreateRequest): BackendSubcategory {
    const nextId =
      this.subcategories.length > 0 ? Math.max(...this.subcategories.map((s) => s.id)) + 1 : 1;
    const now = new Date().toISOString();
    const record: MockSubcategoryRecord = {
      id: nextId,
      category_id: data.category_id,
      name: data.name.trim(),
      image: data.image || null,
      public_id: data.public_id || null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    this.subcategories.push(record);
    this.notify();
    return { ...record };
  }

  updateSubcategory(id: number, data: SubcategoryUpdateRequest): BackendSubcategory {
    const idx = this.subcategories.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Subcategory not found');

    const existing = this.subcategories[idx];
    const updated: MockSubcategoryRecord = {
      ...existing,
      category_id: data.category_id !== undefined ? data.category_id : existing.category_id,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      image: data.image !== undefined ? data.image : existing.image,
      public_id: data.public_id !== undefined ? data.public_id : existing.public_id,
      updated_at: new Date().toISOString(),
    };
    this.subcategories[idx] = updated;
    this.notify();
    return { ...updated };
  }

  softDeleteSubcategory(id: number): void {
    const idx = this.subcategories.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Subcategory not found');

    const now = new Date().toISOString();
    this.subcategories[idx] = {
      ...this.subcategories[idx],
      deleted_at: now,
      updated_at: now,
    };
    this.notify();
  }

  restoreSubcategory(id: number): BackendSubcategory {
    const idx = this.subcategories.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Subcategory not found');

    const now = new Date().toISOString();
    this.subcategories[idx] = {
      ...this.subcategories[idx],
      deleted_at: null,
      updated_at: now,
    };
    this.notify();
    return { ...this.subcategories[idx] };
  }

  hardDeleteSubcategory(id: number): void {
    const idx = this.subcategories.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Subcategory not found');

    this.subcategories.splice(idx, 1);
    this.notify();
  }

  // ==========================================
  // COLORS
  // ==========================================
  getColors(): BackendColor[] {
    return [...this.colors];
  }

  getColor(id: number): BackendColor | undefined {
    return this.colors.find((c) => c.id === id);
  }

  createColor(data: ColorCreateRequest): BackendColor {
    const now = new Date().toISOString();
    const newId = this.colors.length > 0 ? Math.max(...this.colors.map((c) => c.id)) + 1 : 1;
    const record: BackendColor = {
      id: newId,
      name: data.name.trim(),
      hex_code: data.hex_code.trim().toUpperCase(),
      created_at: now,
      updated_at: now,
    };
    this.colors.push(record);
    this.notify();
    return { ...record };
  }

  updateColor(id: number, data: ColorUpdateRequest): BackendColor {
    const idx = this.colors.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Color not found');

    const now = new Date().toISOString();
    const existing = this.colors[idx];
    const updated: BackendColor = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      hex_code: data.hex_code !== undefined ? data.hex_code.trim().toUpperCase() : existing.hex_code,
      updated_at: now,
    };
    this.colors[idx] = updated;

    // Update color in products
    this.products.forEach((p) => {
      p.colors = p.colors.map((c) => (c.id === id ? { ...c, ...updated } : c));
    });

    this.notify();
    return { ...updated };
  }

  deleteColor(id: number): void {
    const idx = this.colors.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Color not found');

    this.colors.splice(idx, 1);

    // Remove color from products
    this.products.forEach((p) => {
      p.colors = p.colors.filter((c) => c.id !== id);
      if (p.color_ids) {
        p.color_ids = p.color_ids.filter((cid) => cid !== id);
      }
    });

    this.notify();
  }

  // ==========================================
  // PRODUCT IMAGES
  // ==========================================
  getProductImages(productId?: number): BackendProductImage[] {
    if (productId !== undefined) {
      return this.productImages
        .filter((img) => img.product === productId)
        .sort((a, b) => a.sort_order - b.sort_order);
    }
    return [...this.productImages].sort((a, b) => a.sort_order - b.sort_order);
  }

  getProductImage(id: number): BackendProductImage | undefined {
    return this.productImages.find((img) => img.id === id);
  }

  createProductImage(data: ProductImageCreateRequest): BackendProductImage {
    const now = new Date().toISOString();
    const newId = this.productImages.length > 0 ? Math.max(...this.productImages.map((i) => i.id)) + 1 : 1;
    const isPrimary = data.is_primary ?? false;

    if (isPrimary) {
      this.productImages.forEach((img) => {
        if (img.product === data.product) {
          img.is_primary = false;
        }
      });
    }

    const record: BackendProductImage = {
      id: newId,
      product: data.product,
      image: data.image,
      public_id: data.public_id || `tocco/products/img_${newId}`,
      is_primary: isPrimary,
      sort_order: data.sort_order ?? 0,
      created_at: now,
    };
    this.productImages.push(record);

    // Sync into product object
    const prod = this.products.find((p) => p.id === data.product);
    if (prod) {
      if (isPrimary) {
        prod.images.forEach((i) => (i.is_primary = false));
      }
      prod.images.push(record);
      prod.images.sort((a, b) => a.sort_order - b.sort_order);
    }

    this.notify();
    return { ...record };
  }

  updateProductImage(id: number, data: ProductImageUpdateRequest): BackendProductImage {
    const idx = this.productImages.findIndex((img) => img.id === id);
    if (idx === -1) throw new Error('ProductImage not found');

    const existing = this.productImages[idx];
    if (data.is_primary) {
      this.productImages.forEach((img) => {
        if (img.product === existing.product) {
          img.is_primary = false;
        }
      });
    }

    const updated: BackendProductImage = {
      ...existing,
      image: data.image !== undefined ? data.image : existing.image,
      public_id: data.public_id !== undefined ? data.public_id : existing.public_id,
      is_primary: data.is_primary !== undefined ? data.is_primary : existing.is_primary,
      sort_order: data.sort_order !== undefined ? data.sort_order : existing.sort_order,
    };
    this.productImages[idx] = updated;

    // Sync in product
    const prod = this.products.find((p) => p.id === existing.product);
    if (prod) {
      const pImgIdx = prod.images.findIndex((i) => i.id === id);
      if (pImgIdx !== -1) {
        prod.images[pImgIdx] = updated;
      }
      prod.images.sort((a, b) => a.sort_order - b.sort_order);
    }

    this.notify();
    return { ...updated };
  }

  deleteProductImage(id: number): void {
    const idx = this.productImages.findIndex((img) => img.id === id);
    if (idx === -1) throw new Error('ProductImage not found');

    const removed = this.productImages[idx];
    this.productImages.splice(idx, 1);

    // Remove from product
    const prod = this.products.find((p) => p.id === removed.product);
    if (prod) {
      prod.images = prod.images.filter((i) => i.id !== id);
      // If deleted image was primary, make the first remaining image primary
      if (removed.is_primary && prod.images.length > 0) {
        prod.images[0].is_primary = true;
        const mainImg = this.productImages.find((i) => i.id === prod.images[0].id);
        if (mainImg) mainImg.is_primary = true;
      }
    }

    this.notify();
  }

  setPrimaryImage(id: number): { detail: string; image: BackendProductImage } {
    const target = this.productImages.find((img) => img.id === id);
    if (!target) throw new Error('ProductImage not found');

    this.productImages.forEach((img) => {
      if (img.product === target.product) {
        img.is_primary = img.id === id;
      }
    });

    const prod = this.products.find((p) => p.id === target.product);
    if (prod) {
      prod.images.forEach((img) => {
        img.is_primary = img.id === id;
      });
      // Move primary image to the front of images array
      prod.images.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
    }

    this.notify();
    return {
      detail: 'Primary image updated successfully.',
      image: { ...target, is_primary: true },
    };
  }

  // ==========================================
  // PRODUCTS
  // ==========================================
  getProducts(): BackendProduct[] {
    return this.products
      .filter((p) => p.deleted_at === null)
      .map((p) => ({
        ...p,
        images: this.getProductImages(p.id),
      }));
  }

  getDeletedProducts(): BackendProduct[] {
    return this.products
      .filter((p) => p.deleted_at !== null)
      .map((p) => ({
        ...p,
        images: this.getProductImages(p.id),
      }));
  }

  getProduct(id: number): BackendProduct | undefined {
    const prod = this.products.find((p) => p.id === id);
    if (!prod) return undefined;
    return {
      ...prod,
      images: this.getProductImages(prod.id),
    };
  }

  createProduct(data: ProductCreateRequest): BackendProduct {
    const now = new Date().toISOString();
    const newId = this.products.length > 0 ? Math.max(...this.products.map((p) => p.id)) + 1 : 1;

    // Resolve color models
    const resolvedColors: BackendColor[] = (data.color_ids || [])
      .map((cid) => this.colors.find((c) => c.id === cid))
      .filter((c): c is BackendColor => Boolean(c));

    const record: BackendProduct = {
      id: newId,
      name: data.name.trim(),
      description: data.description.trim(),
      dimensions: data.dimensions.trim(),
      height: data.height !== undefined ? String(data.height) : null,
      price: String(data.price),
      delivery_date: data.delivery_date || null,
      material: data.material.trim(),
      finish: data.finish.trim(),
      faq: Array.isArray(data.faq) ? data.faq : [],
      subcategory_ids: Array.isArray(data.subcategory_ids) ? data.subcategory_ids : [],
      colors: resolvedColors,
      color_ids: data.color_ids || [],
      images: [],
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    this.products.push(record);
    this.notify();
    return { ...record };
  }

  updateProduct(id: number, data: ProductUpdateRequest): BackendProduct {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const existing = this.products[idx];
    const now = new Date().toISOString();

    const resolvedColors = data.color_ids !== undefined
      ? data.color_ids
          .map((cid) => this.colors.find((c) => c.id === cid))
          .filter((c): c is BackendColor => Boolean(c))
      : existing.colors;

    const updated: BackendProduct = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      description: data.description !== undefined ? data.description.trim() : existing.description,
      dimensions: data.dimensions !== undefined ? data.dimensions.trim() : existing.dimensions,
      height: data.height !== undefined ? (data.height !== null ? String(data.height) : null) : existing.height,
      price: data.price !== undefined ? String(data.price) : existing.price,
      delivery_date: data.delivery_date !== undefined ? data.delivery_date : existing.delivery_date,
      material: data.material !== undefined ? data.material.trim() : existing.material,
      finish: data.finish !== undefined ? data.finish.trim() : existing.finish,
      faq: data.faq !== undefined ? data.faq : existing.faq,
      subcategory_ids: data.subcategory_ids !== undefined ? data.subcategory_ids : existing.subcategory_ids,
      colors: resolvedColors,
      color_ids: data.color_ids !== undefined ? data.color_ids : existing.color_ids,
      updated_at: now,
    };

    this.products[idx] = updated;
    this.notify();
    return {
      ...updated,
      images: this.getProductImages(updated.id),
    };
  }

  softDeleteProduct(id: number): void {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const now = new Date().toISOString();
    this.products[idx] = {
      ...this.products[idx],
      deleted_at: now,
      updated_at: now,
    };
    this.notify();
  }

  restoreProduct(id: number): BackendProduct {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const now = new Date().toISOString();
    this.products[idx] = {
      ...this.products[idx],
      deleted_at: null,
      updated_at: now,
    };
    this.notify();
    return {
      ...this.products[idx],
      images: this.getProductImages(id),
    };
  }

  hardDeleteProduct(id: number): void {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    this.products.splice(idx, 1);
    // Also remove any attached product images
    this.productImages = this.productImages.filter((img) => img.product !== id);
    this.notify();
  }

  // ==========================================
  // CART & CART ITEMS
  // ==========================================
  private getOrCreateCart(userId: number): MockCartRecord {
    let cart = this.carts.find((c) => c.user_id === userId);
    if (!cart) {
      const now = new Date().toISOString();
      const newId = this.carts.length > 0 ? Math.max(...this.carts.map((c) => c.id)) + 1 : 1;
      cart = {
        id: newId,
        user_id: userId,
        items: [],
        created_at: now,
        updated_at: now,
      };
      this.carts.push(cart);
      this.notify();
    }
    return cart;
  }

  getCart(userId: number): BackendCart {
    const cart = this.getOrCreateCart(userId);
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items
      .reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
      .toFixed(2);

    return {
      id: cart.id,
      items: [...cart.items],
      total_items: totalItems,
      total_price: totalPrice,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
    };
  }

  clearCart(userId: number): void {
    const cart = this.getOrCreateCart(userId);
    cart.items = [];
    cart.updated_at = new Date().toISOString();
    this.notify();
  }

  getCartItems(userId: number): BackendCartItem[] {
    const cart = this.getOrCreateCart(userId);
    return [...cart.items];
  }

  addCartItem(userId: number, data: CartItemCreateRequest): BackendCartItem {
    const cart = this.getOrCreateCart(userId);
    const product = this.products.find((p) => p.id === data.product_id);
    if (!product) throw new Error('Product does not exist.');

    const color = data.color_id ? this.colors.find((c) => c.id === data.color_id) : null;
    const primaryImg = this.productImages.find((img) => img.product === product.id && img.is_primary)
      || this.productImages.find((img) => img.product === product.id);

    const priceNum = Number(product.price) || 0;
    const now = new Date().toISOString();

    // Check if item with same product and color already exists
    const existingIdx = cart.items.findIndex(
      (item) => item.product_id === data.product_id && (item.color_id || null) === (data.color_id || null)
    );

    if (existingIdx !== -1) {
      // Increase quantity
      const existing = cart.items[existingIdx];
      const newQty = existing.quantity + (data.quantity || 1);
      const newSubtotal = (priceNum * newQty).toFixed(2);

      const updatedItem: BackendCartItem = {
        ...existing,
        quantity: newQty,
        subtotal: newSubtotal,
        updated_at: now,
      };

      cart.items[existingIdx] = updatedItem;
      cart.updated_at = now;
      this.notify();
      return { ...updatedItem };
    }

    // New item
    const allItemIds = this.carts.flatMap((c) => c.items.map((i) => i.id));
    const newItemId = allItemIds.length > 0 ? Math.max(...allItemIds) + 1 : 1;
    const qty = data.quantity || 1;
    const subtotal = (priceNum * qty).toFixed(2);

    const newItem: BackendCartItem = {
      id: newItemId,
      product_id: product.id,
      product_name: product.name,
      product_price: String(product.price),
      product_image: primaryImg?.image || null,
      color_id: data.color_id || null,
      selected_color: color
        ? { id: color.id, name: color.name, hex_code: color.hex_code }
        : null,
      quantity: qty,
      subtotal,
      created_at: now,
      updated_at: now,
    };

    cart.items.push(newItem);
    cart.updated_at = now;
    this.notify();
    return { ...newItem };
  }

  updateCartItemQuantity(userId: number, itemId: number, quantity: number): BackendCartItem {
    const cart = this.getOrCreateCart(userId);
    const itemIdx = cart.items.findIndex((i) => i.id === itemId);
    if (itemIdx === -1) throw new Error('Cart item not found');

    const item = cart.items[itemIdx];
    const priceNum = Number(item.product_price) || 0;
    const now = new Date().toISOString();

    const updatedItem: BackendCartItem = {
      ...item,
      quantity,
      subtotal: (priceNum * quantity).toFixed(2),
      updated_at: now,
    };

    cart.items[itemIdx] = updatedItem;
    cart.updated_at = now;
    this.notify();
    return { ...updatedItem };
  }

  removeCartItem(userId: number, itemId: number): void {
    const cart = this.getOrCreateCart(userId);
    const itemIdx = cart.items.findIndex((i) => i.id === itemId);
    if (itemIdx === -1) throw new Error('Cart item not found');

    cart.items.splice(itemIdx, 1);
    cart.updated_at = new Date().toISOString();
    this.notify();
  }

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================
  getOrders(): BackendOrder[] {
    return [...this.orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getUserOrders(userId: number): BackendOrder[] {
    return this.orders
      .filter((o) => o.user_id === userId)
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  getOrderById(orderId: number): BackendOrder | undefined {
    return this.orders.find((o) => o.id === orderId);
  }

  createOrder(userId: number, addressId: number): BackendOrder {
    const address = this.addresses.find((a) => a.id === addressId && a.user_id === userId);
    if (!address) {
      const err: any = new Error('Address not found.');
      err.fieldErrors = { address_id: ['Address not found.'] };
      err.status = 400;
      throw err;
    }

    const cart = this.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      const err: any = new Error('Cannot create an order from an empty cart.');
      err.raw = { detail: 'Cannot create an order from an empty cart.' };
      err.status = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const newOrderId = this.orders.length > 0 ? Math.max(...this.orders.map((o) => o.id)) + 1 : 1;

    // Generate random UUID v4 for order_number
    const orderNumber = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    const items: BackendOrderItem[] = cart.items.map((ci, idx) => ({
      id: idx + 1,
      product_id: ci.product_id,
      product_name: ci.product_name,
      product_price: String(ci.product_price),
      color_name: ci.selected_color?.name || 'Standard Finish',
      color_hex_code: ci.selected_color?.hex_code || '#CCCCCC',
      quantity: ci.quantity,
      subtotal: String(ci.subtotal || (Number(ci.product_price) * ci.quantity).toFixed(2)),
    }));

    const totalPrice = items
      .reduce((sum, it) => sum + Number(it.subtotal), 0)
      .toFixed(2);

    const newOrder: BackendOrder = {
      id: newOrderId,
      order_number: orderNumber,
      user_id: userId,
      address_id: addressId,
      shipping_address: {
        title: address.title,
        country: address.country,
        city: address.city,
        street: address.street,
        building_number: address.building_number,
        apartment_number: address.apartment_number,
      },
      status: 'NOT_CONFIRMED',
      total_price: totalPrice,
      items,
      created_at: now,
      updated_at: now,
    };

    this.orders.unshift(newOrder);
    this.clearCart(userId);
    this.notify();
    return newOrder;
  }

  updateOrderStatus(orderId: number, status: BackendOrderStatus): BackendOrder {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      const err: any = new Error('Order not found.');
      err.status = 404;
      throw err;
    }

    const updated: BackendOrder = {
      ...this.orders[orderIndex],
      status,
      updated_at: new Date().toISOString(),
    };

    this.orders[orderIndex] = updated;
    this.notify();
    return updated;
  }

  resetMockData() {
    this.users = [...INITIAL_MOCK_USERS];
    this.addresses = [...INITIAL_MOCK_ADDRESSES];
    this.categories = [...INITIAL_MOCK_CATEGORIES];
    this.subcategories = [...INITIAL_MOCK_SUBCATEGORIES];
    this.colors = [...INITIAL_MOCK_COLORS];
    this.productImages = [...INITIAL_MOCK_PRODUCT_IMAGES];
    this.products = [...INITIAL_MOCK_PRODUCTS];
    this.carts = [...INITIAL_MOCK_CARTS];
    this.orders = [...INITIAL_MOCK_ORDERS];
    this.currentUserId = 1;
    this.hasAccessToken = true;
    this.hasRefreshToken = true;
    this.isAccessTokenExpired = false;
    this.activeScenario = 'normal';
    this.notify();
  }
}

export const mockState = new MockStateManager();
