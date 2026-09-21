import { mockState } from './mockState';
import { ApiError } from '../errors';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshResponse,
  LogoutResponse,
  ProfileResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  Address,
  AddressCreateRequest,
  AddressUpdateRequest,
  SetDefaultAddressResponse,
  UserManagementUser,
  ChangeUserRoleRequest,
  ChangeUserRoleResponse,
  BackendUser,
} from '@/types/auth';

/**
 * Simulates network delay (150-300ms) for realistic UX feel
 */
const simulateLatency = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Centralized Mock Backend Request Dispatcher
 * Simulates Django REST Framework views, serializers, permissions, and responses.
 */
export async function handleMockRequest<T = any>(
  path: string,
  method: string = 'GET',
  body?: any
): Promise<T> {
  await simulateLatency();

  const scenario = mockState.getScenario();

  // 1. Simulate Network Failure Scenario
  if (scenario === 'network_error') {
    throw new Error('Failed to fetch: NetworkError when attempting to fetch resource.');
  }

  // 2. Simulate Server 500 Error Scenario
  if (scenario === 'server_error') {
    throw new ApiError({
      message: 'Internal server error occurred on atelier backend.',
      fieldErrors: {},
      status: 500,
      raw: { detail: 'Internal server error.' },
    });
  }

  // Normalize path
  const cleanPath = path.split('?')[0].replace(/\/+$/, '') + '/';

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // POST /auth/register/
  if (cleanPath === '/auth/register/' && method === 'POST') {
    const data = body as RegisterRequest;
    const fieldErrors: Record<string, string[]> = {};

    if (!data.first_name || !data.first_name.trim()) {
      fieldErrors['first_name'] = ['This field may not be blank.'];
    }
    if (!data.last_name || !data.last_name.trim()) {
      fieldErrors['last_name'] = ['This field may not be blank.'];
    }
    if (!data.email || !data.email.trim()) {
      fieldErrors['email'] = ['This field may not be blank.'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      fieldErrors['email'] = ['Enter a valid email address.'];
    } else if (mockState.getUserByEmail(data.email)) {
      fieldErrors['email'] = ['A user with that email already exists.'];
    }

    if (!data.phone || !data.phone.trim()) {
      fieldErrors['phone'] = ['This field may not be blank.'];
    }

    if (!data.password) {
      fieldErrors['password'] = ['This field may not be blank.'];
    } else if (data.password.length < 8) {
      fieldErrors['password'] = ['This password is too short. It must contain at least 8 characters.'];
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new ApiError({
        message: 'Please resolve the highlighted validation errors.',
        fieldErrors,
        status: 400,
        raw: fieldErrors,
      });
    }

    const newUser = mockState.addUser({
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      password: data.password,
      role: 'CUSTOMER',
      is_active: true,
      deleted_at: null,
    });

    mockState.setCurrentUser(newUser.id);

    const res: AuthResponse = {
      message: 'User registered successfully.',
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    };
    return res as unknown as T;
  }

  // POST /auth/login/
  if (cleanPath === '/auth/login/' && method === 'POST') {
    const data = body as LoginRequest;
    const fieldErrors: Record<string, string[]> = {};

    if (!data.email || !data.email.trim()) {
      fieldErrors['email'] = ['This field may not be blank.'];
    }
    if (!data.password) {
      fieldErrors['password'] = ['This field may not be blank.'];
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new ApiError({
        message: 'Please provide both email and password.',
        fieldErrors,
        status: 400,
        raw: fieldErrors,
      });
    }

    if (scenario === 'inactive_user') {
      throw new ApiError({
        message: 'User account is disabled.',
        fieldErrors: {},
        status: 401,
        raw: { detail: 'User account is disabled.' },
      });
    }

    const user = mockState.getUserByEmail(data.email.trim());
    if (!user || user.password !== data.password || user.deleted_at) {
      // DRF non_field_errors format as explicitly documented in user note!
      throw new ApiError({
        message: 'Invalid email or password.',
        fieldErrors: {
          non_field_errors: ['Invalid email or password.'],
        },
        status: 400,
        raw: { non_field_errors: ['Invalid email or password.'] },
      });
    }

    if (!user.is_active) {
      throw new ApiError({
        message: 'User account is disabled.',
        fieldErrors: {},
        status: 401,
        raw: { detail: 'User account is disabled.' },
      });
    }

    mockState.setCurrentUser(user.id);

    const res: AuthResponse = {
      message: 'Login successful.',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
    return res as unknown as T;
  }

  // POST /auth/refresh/ (HttpOnly cookie simulation)
  if (cleanPath === '/auth/refresh/' && method === 'POST') {
    if (!mockState.hasValidRefresh()) {
      throw new ApiError({
        message: 'Refresh token is missing, invalid or expired. Please sign in again.',
        fieldErrors: {},
        status: 401,
        raw: { detail: 'Refresh token is invalid or expired.' },
      });
    }

    mockState.refreshTokens();
    const res: RefreshResponse = {
      message: 'Token refreshed successfully.',
    };
    return res as unknown as T;
  }

  // POST /auth/logout/
  if (cleanPath === '/auth/logout/' && method === 'POST') {
    mockState.clearSession();
    const res: LogoutResponse = {
      message: 'Logout successful.',
    };
    return res as unknown as T;
  }

  // ==========================================
  // CATEGORIES & SUBCATEGORIES ENDPOINTS
  // DRF ViewSets with IsAdminOrModeratorOrReadOnly
  // ==========================================

  const enforceAdminOrModerator = () => {
    if (mockState.isTokenExpired()) {
      throw new ApiError({
        message: 'Invalid or expired access token.',
        fieldErrors: {},
        status: 401,
        raw: { detail: 'Invalid or expired access token.' },
      });
    }

    const currentUser = mockState.getCurrentUser();
    if (!currentUser || !mockState.getHasAccessToken()) {
      throw new ApiError({
        message: 'Authentication credentials were not provided.',
        fieldErrors: {},
        status: 401,
        raw: { detail: 'Authentication credentials were not provided.' },
      });
    }

    if (currentUser.role === 'CUSTOMER' || scenario === 'forbidden_admin') {
      throw new ApiError({
        message: 'You do not have permission to perform this action.',
        fieldErrors: {},
        status: 403,
        raw: { detail: 'You do not have permission to perform this action.' },
      });
    }
  };

  // 1. GET /categories/deleted/ (Admin/Moderator only)
  if (cleanPath === '/categories/deleted/' && method === 'GET') {
    enforceAdminOrModerator();
    return mockState.getDeletedCategories() as unknown as T;
  }

  // 2. GET /categories/ (Public) and POST /categories/ (Admin/Mod)
  if (cleanPath === '/categories/') {
    if (method === 'GET') {
      return mockState.getCategories(false) as unknown as T;
    }

    if (method === 'POST') {
      enforceAdminOrModerator();
      const data = body || {};
      const fieldErrors: Record<string, string[]> = {};

      if (!data.name || !String(data.name).trim()) {
        fieldErrors['name'] = ['This field may not be blank.'];
      } else if (
        mockState.isCategoryNameDuplicate(data.name) ||
        scenario === 'duplicate_category'
      ) {
        fieldErrors['name'] = ['category with this name already exists.'];
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError({
          message: 'Category validation failed.',
          fieldErrors,
          status: 400,
          raw: fieldErrors,
        });
      }

      const created = mockState.addCategory({
        name: data.name,
        image: data.image ?? null,
        public_id: data.public_id ?? null,
      });
      return created as unknown as T;
    }
  }

  // 3. Category ID actions: /categories/<id>/, /categories/<id>/restore/, /categories/<id>/hard-delete/
  const categoryMatch = cleanPath.match(/^\/categories\/(\d+)\/(restore|hard-delete)?\/?$/);
  if (categoryMatch) {
    const categoryId = parseInt(categoryMatch[1], 10);
    const subAction = categoryMatch[2]; // 'restore' | 'hard-delete' | undefined

    const existingRecord = mockState.getCategoryRecordById(categoryId);
    if (!existingRecord) {
      throw new ApiError({
        message: 'Category not found.',
        fieldErrors: {},
        status: 404,
        raw: { detail: 'Not found.' },
      });
    }

    // POST /categories/<id>/restore/
    if (subAction === 'restore' && method === 'POST') {
      enforceAdminOrModerator();
      if (!existingRecord.deleted_at) {
        throw new ApiError({
          message: 'Category is not deleted.',
          fieldErrors: {},
          status: 400,
          raw: { detail: 'Category is not deleted.' },
        });
      }

      // Check if an active category with the same name exists
      if (mockState.isCategoryNameDuplicate(existingRecord.name, categoryId)) {
        throw new ApiError({
          message: `Cannot restore: an active category with name "${existingRecord.name}" already exists.`,
          fieldErrors: { name: ['An active category with this name already exists.'] },
          status: 400,
          raw: { detail: `Cannot restore: an active category with name "${existingRecord.name}" already exists.` },
        });
      }

      const restored = mockState.restoreCategory(categoryId);
      return { detail: 'Category restored successfully.', ...restored } as unknown as T;
    }

    // DELETE /categories/<id>/hard-delete/
    if (subAction === 'hard-delete' && method === 'DELETE') {
      enforceAdminOrModerator();

      // Check models.PROTECT constraint
      if (
        mockState.categoryHasSubcategories(categoryId) ||
        scenario === 'protected_category_delete'
      ) {
        throw new ApiError({
          message: `Cannot delete category "${existingRecord.name}" because it is referenced by existing subcategories.`,
          fieldErrors: {},
          status: 400,
          raw: {
            detail: `Cannot delete category "${existingRecord.name}" because it is referenced by existing subcategories.`,
          },
        });
      }

      mockState.hardDeleteCategory(categoryId);
      return { detail: 'Category permanently deleted.' } as unknown as T;
    }

    // Standard /categories/<id>/
    if (!subAction) {
      // GET (Public)
      if (method === 'GET') {
        const cat = mockState.getCategoryById(categoryId);
        return cat as unknown as T;
      }

      // PUT / PATCH (Admin/Mod)
      if (method === 'PUT' || method === 'PATCH') {
        enforceAdminOrModerator();
        const data = body || {};
        const fieldErrors: Record<string, string[]> = {};

        if (method === 'PUT' && (!data.name || !String(data.name).trim())) {
          fieldErrors['name'] = ['This field may not be blank.'];
        } else if (
          data.name !== undefined &&
          (mockState.isCategoryNameDuplicate(data.name, categoryId) ||
            scenario === 'duplicate_category')
        ) {
          fieldErrors['name'] = ['category with this name already exists.'];
        }

        if (Object.keys(fieldErrors).length > 0) {
          throw new ApiError({
            message: 'Category update failed.',
            fieldErrors,
            status: 400,
            raw: fieldErrors,
          });
        }

        const updated = mockState.updateCategory(categoryId, data);
        return updated as unknown as T;
      }

      // Soft delete: DELETE /categories/<id>/ (Admin/Mod)
      if (method === 'DELETE') {
        enforceAdminOrModerator();
        if (existingRecord.deleted_at) {
          throw new ApiError({
            message: 'Category is already deleted.',
            fieldErrors: {},
            status: 400,
            raw: { detail: 'Category is already deleted.' },
          });
        }

        mockState.softDeleteCategory(categoryId);
        return { detail: 'Category deleted successfully.' } as unknown as T;
      }
    }
  }

  // 4. GET /subcategories/deleted/ (Admin/Mod)
  if (cleanPath === '/subcategories/deleted/' && method === 'GET') {
    enforceAdminOrModerator();
    return mockState.getDeletedSubcategories() as unknown as T;
  }

  // 5. GET /subcategories/ (Public) and POST /subcategories/ (Admin/Mod)
  if (cleanPath === '/subcategories/') {
    if (method === 'GET') {
      return mockState.getSubcategories(false) as unknown as T;
    }

    if (method === 'POST') {
      enforceAdminOrModerator();
      const data = body || {};
      const fieldErrors: Record<string, string[]> = {};

      if (!data.name || !String(data.name).trim()) {
        fieldErrors['name'] = ['This field may not be blank.'];
      }

      const catId = Number(data.category_id);
      if (!data.category_id || isNaN(catId)) {
        fieldErrors['category_id'] = ['This field is required.'];
      } else {
        const catRecord = mockState.getCategoryRecordById(catId);
        if (!catRecord || catRecord.deleted_at || scenario === 'invalid_category_reference') {
          fieldErrors['category_id'] = [`Invalid category pk "${data.category_id}" - object does not exist.`];
        }
      }

      // Check unique constraint per category
      if (
        !fieldErrors['name'] &&
        !fieldErrors['category_id'] &&
        (mockState.isSubcategoryNameDuplicate(catId, data.name) ||
          scenario === 'duplicate_subcategory')
      ) {
        fieldErrors['name'] = ['subcategory with this category and name already exists.'];
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError({
          message: 'Subcategory validation failed.',
          fieldErrors,
          status: 400,
          raw: fieldErrors,
        });
      }

      const created = mockState.addSubcategory({
        category_id: catId,
        name: data.name,
        image: data.image ?? null,
        public_id: data.public_id ?? null,
      });
      return created as unknown as T;
    }
  }

  // 6. Subcategory ID actions: /subcategories/<id>/, /subcategories/<id>/restore/, /subcategories/<id>/hard-delete/
  const subcategoryMatch = cleanPath.match(/^\/subcategories\/(\d+)\/(restore|hard-delete)?\/?$/);
  if (subcategoryMatch) {
    const subcatId = parseInt(subcategoryMatch[1], 10);
    const subAction = subcategoryMatch[2]; // 'restore' | 'hard-delete' | undefined

    const existingRecord = mockState.getSubcategoryRecordById(subcatId);
    if (!existingRecord) {
      throw new ApiError({
        message: 'Subcategory not found.',
        fieldErrors: {},
        status: 404,
        raw: { detail: 'Not found.' },
      });
    }

    // POST /subcategories/<id>/restore/
    if (subAction === 'restore' && method === 'POST') {
      enforceAdminOrModerator();
      if (!existingRecord.deleted_at) {
        throw new ApiError({
          message: 'Subcategory is not deleted.',
          fieldErrors: {},
          status: 400,
          raw: { detail: 'Subcategory is not deleted.' },
        });
      }

      // Check parent category exists and is active
      const parentCat = mockState.getCategoryRecordById(existingRecord.category_id);
      if (!parentCat || parentCat.deleted_at) {
        throw new ApiError({
          message: 'Cannot restore subcategory because its parent category is deleted.',
          fieldErrors: { category_id: ['Parent category is deleted. Restore parent category first.'] },
          status: 400,
          raw: { detail: 'Cannot restore subcategory because its parent category is deleted.' },
        });
      }

      // Check duplicate name in category
      if (mockState.isSubcategoryNameDuplicate(existingRecord.category_id, existingRecord.name, subcatId)) {
        throw new ApiError({
          message: `Cannot restore: an active subcategory with name "${existingRecord.name}" already exists in this category.`,
          fieldErrors: { name: ['An active subcategory with this name already exists in this category.'] },
          status: 400,
          raw: {
            detail: `Cannot restore: an active subcategory with name "${existingRecord.name}" already exists in this category.`,
          },
        });
      }

      const restored = mockState.restoreSubcategory(subcatId);
      return { detail: 'Subcategory restored successfully.', ...restored } as unknown as T;
    }

    // DELETE /subcategories/<id>/hard-delete/
    if (subAction === 'hard-delete' && method === 'DELETE') {
      enforceAdminOrModerator();
      mockState.hardDeleteSubcategory(subcatId);
      return { detail: 'Subcategory permanently deleted.' } as unknown as T;
    }

    // Standard /subcategories/<id>/
    if (!subAction) {
      // GET (Public)
      if (method === 'GET') {
        const sub = mockState.getSubcategoryById(subcatId);
        return sub as unknown as T;
      }

      // PUT / PATCH (Admin/Mod)
      if (method === 'PUT' || method === 'PATCH') {
        enforceAdminOrModerator();
        const data = body || {};
        const fieldErrors: Record<string, string[]> = {};

        const targetCatId =
          data.category_id !== undefined ? Number(data.category_id) : existingRecord.category_id;

        if (data.category_id !== undefined) {
          const catRecord = mockState.getCategoryRecordById(targetCatId);
          if (!catRecord || catRecord.deleted_at || scenario === 'invalid_category_reference') {
            fieldErrors['category_id'] = [`Invalid category pk "${data.category_id}" - object does not exist.`];
          }
        }

        const targetName = data.name !== undefined ? String(data.name).trim() : existingRecord.name;

        if (method === 'PUT' && (!data.name || !String(data.name).trim())) {
          fieldErrors['name'] = ['This field may not be blank.'];
        } else if (
          data.name !== undefined &&
          !fieldErrors['category_id'] &&
          (mockState.isSubcategoryNameDuplicate(targetCatId, targetName, subcatId) ||
            scenario === 'duplicate_subcategory')
        ) {
          fieldErrors['name'] = ['subcategory with this category and name already exists.'];
        }

        if (Object.keys(fieldErrors).length > 0) {
          throw new ApiError({
            message: 'Subcategory update failed.',
            fieldErrors,
            status: 400,
            raw: fieldErrors,
          });
        }

        const updated = mockState.updateSubcategory(subcatId, data);
        return updated as unknown as T;
      }

      // Soft delete: DELETE /subcategories/<id>/
      if (method === 'DELETE') {
        enforceAdminOrModerator();
        if (existingRecord.deleted_at) {
          throw new ApiError({
            message: 'Subcategory is already deleted.',
            fieldErrors: {},
            status: 400,
            raw: { detail: 'Subcategory is already deleted.' },
          });
        }

        mockState.softDeleteSubcategory(subcatId);
        return { detail: 'Subcategory deleted successfully.' } as unknown as T;
      }
    }
  }

  // ==========================================
  // PRODUCTS, COLORS, AND PRODUCT IMAGES ENDPOINTS
  // ==========================================

  // 1. COLORS (/products/colors/)
  if (cleanPath === '/products/colors/') {
    if (method === 'GET') {
      return mockState.getColors() as unknown as T;
    }

    if (method === 'POST') {
      enforceAdminOrModerator();
      const data = body || {};
      const fieldErrors: Record<string, string[]> = {};

      if (!data.name || !String(data.name).trim()) {
        fieldErrors['name'] = ['This field may not be blank.'];
      }
      if (!data.hex_code || !String(data.hex_code).trim()) {
        fieldErrors['hex_code'] = ['This field may not be blank.'];
      } else if (!/^#[0-9A-Fa-f]{6}$/.test(String(data.hex_code).trim())) {
        fieldErrors['hex_code'] = ['Enter a valid 6-character hex color code (e.g. #EBE3D5).'];
      }

      if (
        mockState.getColors().some(
          (c) => c.name.toLowerCase() === String(data.name || '').trim().toLowerCase()
        ) ||
        scenario === 'duplicate_color'
      ) {
        fieldErrors['name'] = ['A color with this name already exists.'];
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError({
          message: 'Color validation failed.',
          fieldErrors,
          status: 400,
          raw: fieldErrors,
        });
      }

      const created = mockState.createColor({
        name: data.name,
        hex_code: data.hex_code,
      });
      return created as unknown as T;
    }
  }

  const colorDetailMatch = cleanPath.match(/^\/products\/colors\/(\d+)\/$/);
  if (colorDetailMatch) {
    const colorId = Number(colorDetailMatch[1]);
    const color = mockState.getColor(colorId);

    if (!color) {
      throw new ApiError({
        message: 'Color not found.',
        fieldErrors: {},
        status: 404,
        raw: { detail: 'Not found.' },
      });
    }

    if (method === 'GET') {
      return color as unknown as T;
    }

    if (method === 'PUT' || method === 'PATCH') {
      enforceAdminOrModerator();
      const data = body || {};
      if (data.hex_code && !/^#[0-9A-Fa-f]{6}$/.test(String(data.hex_code).trim())) {
        throw new ApiError({
          message: 'Invalid hex code.',
          fieldErrors: { hex_code: ['Enter a valid 6-character hex color code (e.g. #EBE3D5).'] },
          status: 400,
        });
      }

      const updated = mockState.updateColor(colorId, data);
      return updated as unknown as T;
    }

    if (method === 'DELETE') {
      enforceAdminOrModerator();
      mockState.deleteColor(colorId);
      return { detail: 'Color deleted successfully.' } as unknown as T;
    }
  }

  // 2. PRODUCT IMAGES (/products/images/)
  // Set Primary Image POST /products/images/<id>/set-primary/
  const setPrimaryMatch = cleanPath.match(/^\/products\/images\/(\d+)\/set-primary\/$/);
  if (setPrimaryMatch && method === 'POST') {
    enforceAdminOrModerator();
    const imageId = Number(setPrimaryMatch[1]);
    const res = mockState.setPrimaryImage(imageId);
    return res as unknown as T;
  }

  if (cleanPath === '/products/images/') {
    if (method === 'GET') {
      let productId: number | undefined;
      const urlObj = path.includes('?') ? new URL(path, 'http://localhost') : null;
      if (urlObj) {
        const prodParam = urlObj.searchParams.get('product');
        if (prodParam) productId = Number(prodParam);
      }
      return mockState.getProductImages(productId) as unknown as T;
    }

    if (method === 'POST') {
      enforceAdminOrModerator();
      const data = body || {};
      const fieldErrors: Record<string, string[]> = {};

      if (!data.product) {
        fieldErrors['product'] = ['This field is required.'];
      }
      if (!data.image || !String(data.image).trim()) {
        fieldErrors['image'] = ['This field is required.'];
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError({
          message: 'Product image validation failed.',
          fieldErrors,
          status: 400,
          raw: fieldErrors,
        });
      }

      const created = mockState.createProductImage(data);
      return created as unknown as T;
    }
  }

  const imageDetailMatch = cleanPath.match(/^\/products\/images\/(\d+)\/$/);
  if (imageDetailMatch) {
    const imageId = Number(imageDetailMatch[1]);
    const img = mockState.getProductImage(imageId);

    if (!img) {
      throw new ApiError({
        message: 'Product image not found.',
        fieldErrors: {},
        status: 404,
        raw: { detail: 'Not found.' },
      });
    }

    if (method === 'GET') {
      return img as unknown as T;
    }

    if (method === 'PUT' || method === 'PATCH') {
      enforceAdminOrModerator();
      const updated = mockState.updateProductImage(imageId, body || {});
      return updated as unknown as T;
    }

    if (method === 'DELETE') {
      enforceAdminOrModerator();
      mockState.deleteProductImage(imageId);
      return { detail: 'Image record deleted successfully.' } as unknown as T;
    }
  }

  // 3. PRODUCTS (/products/)
  // GET /products/deleted/
  if (cleanPath === '/products/deleted/' && method === 'GET') {
    enforceAdminOrModerator();
    return mockState.getDeletedProducts() as unknown as T;
  }

  // POST /products/<id>/restore/
  const restoreProdMatch = cleanPath.match(/^\/products\/(\d+)\/restore\/$/);
  if (restoreProdMatch && method === 'POST') {
    enforceAdminOrModerator();
    const prodId = Number(restoreProdMatch[1]);
    const restored = mockState.restoreProduct(prodId);
    return {
      detail: 'Product restored successfully.',
      ...restored,
    } as unknown as T;
  }

  // DELETE /products/<id>/hard-delete/
  const hardDeleteProdMatch = cleanPath.match(/^\/products\/(\d+)\/hard-delete\/$/);
  if (hardDeleteProdMatch && method === 'DELETE') {
    enforceAdminOrModerator();
    const prodId = Number(hardDeleteProdMatch[1]);
    mockState.hardDeleteProduct(prodId);
    return { detail: 'Product permanently deleted.' } as unknown as T;
  }

  // GET /products/ and POST /products/
  if (cleanPath === '/products/') {
    if (method === 'GET') {
      return mockState.getProducts() as unknown as T;
    }

    if (method === 'POST') {
      enforceAdminOrModerator();
      const data = body || {};
      const fieldErrors: Record<string, string[]> = {};

      if (!data.name || !String(data.name).trim()) {
        fieldErrors['name'] = ['This field may not be blank.'];
      }
      if (!data.description || !String(data.description).trim()) {
        fieldErrors['description'] = ['This field may not be blank.'];
      }
      if (!data.dimensions || !String(data.dimensions).trim()) {
        fieldErrors['dimensions'] = ['This field may not be blank.'];
      }
      if (data.price === undefined || data.price === null || String(data.price).trim() === '') {
        fieldErrors['price'] = ['This field is required.'];
      } else if (isNaN(Number(data.price)) || Number(data.price) < 0) {
        fieldErrors['price'] = ['A valid positive number is required.'];
      }
      if (!data.material || !String(data.material).trim()) {
        fieldErrors['material'] = ['This field may not be blank.'];
      }
      if (!data.finish || !String(data.finish).trim()) {
        fieldErrors['finish'] = ['This field may not be blank.'];
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError({
          message: 'Product validation failed.',
          fieldErrors,
          status: 400,
          raw: fieldErrors,
        });
      }

      const created = mockState.createProduct(data);
      return created as unknown as T;
    }
  }

  // GET / PUT / PATCH / DELETE /products/<id>/
  const productDetailMatch = cleanPath.match(/^\/products\/(\d+)\/$/);
  if (productDetailMatch) {
    const prodId = Number(productDetailMatch[1]);
    const prod = mockState.getProduct(prodId);

    if (!prod) {
      throw new ApiError({
        message: 'Product not found.',
        fieldErrors: {},
        status: 404,
        raw: { detail: 'Not found.' },
      });
    }

    if (method === 'GET') {
      return prod as unknown as T;
    }

    if (method === 'PUT' || method === 'PATCH') {
      enforceAdminOrModerator();
      const updated = mockState.updateProduct(prodId, body || {});
      return updated as unknown as T;
    }

    if (method === 'DELETE') {
      enforceAdminOrModerator();
      mockState.softDeleteProduct(prodId);
      return { detail: 'Product moved to archive.' } as unknown as T;
    }
  }

  // ==========================================
  // AUTHENTICATED REQUEST VERIFICATION
  // ==========================================
  // Check access token expiration simulation
  if (mockState.isTokenExpired()) {
    throw new ApiError({
      message: 'Invalid or expired access token.',
      fieldErrors: {},
      status: 401,
      raw: { detail: 'Invalid or expired access token.' },
    });
  }

  const currentUserId = mockState.getCurrentUserId();
  const currentUser = mockState.getCurrentUser();

  if (!currentUserId || !currentUser) {
    throw new ApiError({
      message: 'Authentication credentials were not provided.',
      fieldErrors: {},
      status: 401,
      raw: { detail: 'Authentication credentials were not provided.' },
    });
  }

  // GET /auth/me/
  if (cleanPath === '/auth/me/' && method === 'GET') {
    const res: BackendUser = {
      id: currentUser.id,
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      email: currentUser.email,
      phone: currentUser.phone,
      role: currentUser.role,
      is_active: currentUser.is_active,
      created_at: currentUser.created_at,
    };
    return res as unknown as T;
  }

  // ==========================================
  // USER MANAGEMENT ENDPOINTS (/users/)
  // ==========================================

  // GET /users/ (Admin only)
  if (cleanPath === '/users/' && method === 'GET') {
    if (currentUser.role !== 'ADMIN' || scenario === 'forbidden_admin') {
      throw new ApiError({
        message: 'You do not have permission to perform this action.',
        fieldErrors: {},
        status: 403,
        raw: { detail: 'You do not have permission to perform this action.' },
      });
    }

    const allUsers: UserManagementUser[] = mockState.getAllUsers().map((u) => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
    }));

    return allUsers as unknown as T;
  }

  // PATCH /users/<user_id>/role/ (Admin only)
  const roleMatch = cleanPath.match(/^\/users\/(\d+)\/role\/$/);
  if (roleMatch && method === 'PATCH') {
    if (currentUser.role !== 'ADMIN' || scenario === 'forbidden_admin') {
      throw new ApiError({
        message: 'You do not have permission to perform this action.',
        fieldErrors: {},
        status: 403,
        raw: { detail: 'You do not have permission to perform this action.' },
      });
    }

    const targetUserId = parseInt(roleMatch[1], 10);
    const targetUser = mockState.getUserById(targetUserId);
    if (!targetUser) {
      throw new ApiError({
        message: 'User not found.',
        fieldErrors: {},
        status: 404,
        raw: { detail: 'User not found.' },
      });
    }

    const data = body as ChangeUserRoleRequest;
    if (!data.role || !['CUSTOMER', 'MODERATOR', 'ADMIN'].includes(data.role)) {
      throw new ApiError({
        message: 'Invalid role specified.',
        fieldErrors: { role: ['Select a valid choice. That choice is not one of the available choices.'] },
        status: 400,
        raw: { role: ['Invalid role.'] },
      });
    }

    const updated = mockState.updateUser(targetUserId, { role: data.role });
    const res: ChangeUserRoleResponse = {
      message: 'User role updated successfully.',
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
      },
    };
    return res as unknown as T;
  }

  // ==========================================
  // PROFILE ENDPOINTS (/users/profile/)
  // ==========================================

  // GET /users/profile/
  if (cleanPath === '/users/profile/' && method === 'GET') {
    const res: ProfileResponse = {
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      email: currentUser.email,
      phone: currentUser.phone,
    };
    return res as unknown as T;
  }

  // PUT /users/profile/ or PATCH /users/profile/
  if (cleanPath === '/users/profile/' && (method === 'PUT' || method === 'PATCH')) {
    const data = body as ProfileUpdateRequest;
    const fieldErrors: Record<string, string[]> = {};

    if (method === 'PUT') {
      if (!data.first_name || !data.first_name.trim()) {
        fieldErrors['first_name'] = ['This field may not be blank.'];
      }
      if (!data.last_name || !data.last_name.trim()) {
        fieldErrors['last_name'] = ['This field may not be blank.'];
      }
      if (!data.phone || !data.phone.trim()) {
        fieldErrors['phone'] = ['This field may not be blank.'];
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new ApiError({
        message: 'Please complete all required profile fields.',
        fieldErrors,
        status: 400,
        raw: fieldErrors,
      });
    }

    // Email is read only! We only update first_name, last_name, phone
    const updated = mockState.updateUser(currentUserId, {
      ...(data.first_name ? { first_name: data.first_name.trim() } : {}),
      ...(data.last_name ? { last_name: data.last_name.trim() } : {}),
      ...(data.phone ? { phone: data.phone.trim() } : {}),
    });

    const res: ProfileUpdateResponse = {
      message: 'Profile updated successfully.',
      user: {
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        phone: updated.phone,
      },
    };
    return res as unknown as T;
  }

  // DELETE /users/profile/ (Soft delete)
  if (cleanPath === '/users/profile/' && method === 'DELETE') {
    mockState.softDeleteUser(currentUserId);
    return {
      message: 'Profile deleted successfully.',
    } as unknown as T;
  }

  // ==========================================
  // ADDRESS MANAGEMENT ENDPOINTS (/users/addresses/)
  // ==========================================

  // GET /users/addresses/
  if (cleanPath === '/users/addresses/' && method === 'GET') {
    const list = mockState.getUserAddresses(currentUserId).map((a) => ({
      id: a.id,
      title: a.title,
      country: a.country,
      city: a.city,
      street: a.street,
      building_number: a.building_number,
      apartment_number: a.apartment_number,
      is_default: a.is_default,
    }));
    return list as unknown as T;
  }

  // POST /users/addresses/
  if (cleanPath === '/users/addresses/' && method === 'POST') {
    const data = body as AddressCreateRequest;
    const fieldErrors: Record<string, string[]> = {};

    if (!data.title || !data.title.trim()) {
      fieldErrors['title'] = ['This field may not be blank.'];
    }
    if (!data.country || !data.country.trim()) {
      fieldErrors['country'] = ['This field may not be blank.'];
    }
    if (!data.city || !data.city.trim()) {
      fieldErrors['city'] = ['This field may not be blank.'];
    }
    if (!data.street || !data.street.trim()) {
      fieldErrors['street'] = ['This field may not be blank.'];
    }
    if (!data.building_number || !data.building_number.trim()) {
      fieldErrors['building_number'] = ['This field may not be blank.'];
    }
    if (!data.apartment_number || !data.apartment_number.trim()) {
      fieldErrors['apartment_number'] = ['This field may not be blank.'];
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new ApiError({
        message: 'Please fill in all required address fields.',
        fieldErrors,
        status: 400,
        raw: fieldErrors,
      });
    }

    // Check duplicate address rule: User, Title, Country, City, Street, Building number, Apartment number
    const isDuplicate = mockState.checkDuplicateAddress(currentUserId, {
      title: data.title,
      country: data.country,
      city: data.city,
      street: data.street,
      building_number: data.building_number,
      apartment_number: data.apartment_number,
    });

    if (isDuplicate) {
      throw new ApiError({
        message: 'This address already exists.',
        fieldErrors: {},
        status: 400,
        raw: { message: 'This address already exists.' },
      });
    }

    const created = mockState.createAddress(currentUserId, {
      title: data.title.trim(),
      country: data.country.trim(),
      city: data.city.trim(),
      street: data.street.trim(),
      building_number: data.building_number.trim(),
      apartment_number: data.apartment_number.trim(),
      is_default: Boolean(data.is_default),
    });

    const res: Address = {
      id: created.id,
      title: created.title,
      country: created.country,
      city: created.city,
      street: created.street,
      building_number: created.building_number,
      apartment_number: created.apartment_number,
      is_default: created.is_default,
    };
    return res as unknown as T;
  }

  // PUT /users/addresses/<id>/set-default/
  const setDefaultMatch = cleanPath.match(/^\/users\/addresses\/(\d+)\/set-default\/$/);
  if (setDefaultMatch && method === 'PUT') {
    const addressId = parseInt(setDefaultMatch[1], 10);
    const existing = mockState.getAddressById(addressId, currentUserId);
    if (!existing) {
      throw new ApiError({
        message: 'Address not found.',
        fieldErrors: {},
        status: 404,
        raw: { detail: 'Address not found.' },
      });
    }

    const updated = mockState.setDefaultAddress(currentUserId, addressId);
    const res: SetDefaultAddressResponse = {
      message: 'Default address updated successfully.',
      address: {
        id: updated.id,
        title: updated.title,
        country: updated.country,
        city: updated.city,
        street: updated.street,
        building_number: updated.building_number,
        apartment_number: updated.apartment_number,
        is_default: true,
      },
    };
    return res as unknown as T;
  }

  // Single address operations: /users/addresses/<id>/
  const singleAddressMatch = cleanPath.match(/^\/users\/addresses\/(\d+)\/$/);
  if (singleAddressMatch) {
    const addressId = parseInt(singleAddressMatch[1], 10);
    const existing = mockState.getAddressById(addressId, currentUserId);

    if (!existing) {
      throw new ApiError({
        message: 'Address not found.',
        fieldErrors: {},
        status: 404,
        raw: { detail: 'Address not found.' },
      });
    }

    // GET /users/addresses/<id>/
    if (method === 'GET') {
      const res: Address = {
        id: existing.id,
        title: existing.title,
        country: existing.country,
        city: existing.city,
        street: existing.street,
        building_number: existing.building_number,
        apartment_number: existing.apartment_number,
        is_default: existing.is_default,
      };
      return res as unknown as T;
    }

    // PUT /users/addresses/<id>/ or PATCH
    if (method === 'PUT' || method === 'PATCH') {
      const data = body as AddressUpdateRequest;

      if (data.title && data.country && data.city && data.street && data.building_number && data.apartment_number) {
        const isDuplicate = mockState.checkDuplicateAddress(
          currentUserId,
          {
            title: data.title,
            country: data.country,
            city: data.city,
            street: data.street,
            building_number: data.building_number,
            apartment_number: data.apartment_number,
          },
          addressId
        );
        if (isDuplicate) {
          throw new ApiError({
            message: 'This address already exists.',
            fieldErrors: {},
            status: 400,
            raw: { message: 'This address already exists.' },
          });
        }
      }

      const updated = mockState.updateAddress(currentUserId, addressId, {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.country ? { country: data.country.trim() } : {}),
        ...(data.city ? { city: data.city.trim() } : {}),
        ...(data.street ? { street: data.street.trim() } : {}),
        ...(data.building_number ? { building_number: data.building_number.trim() } : {}),
        ...(data.apartment_number ? { apartment_number: data.apartment_number.trim() } : {}),
        ...(typeof data.is_default === 'boolean' ? { is_default: data.is_default } : {}),
      });

      const res: Address = {
        id: updated.id,
        title: updated.title,
        country: updated.country,
        city: updated.city,
        street: updated.street,
        building_number: updated.building_number,
        apartment_number: updated.apartment_number,
        is_default: updated.is_default,
      };
      return res as unknown as T;
    }

    // DELETE /users/addresses/<id>/
    if (method === 'DELETE') {
      mockState.deleteAddress(currentUserId, addressId);
      return {
        message: 'Address deleted successfully.',
      } as unknown as T;
    }
  }

  // ==========================================
  // SHOPPING CART ENDPOINTS (/cart/)
  // ==========================================

  // 1. GET /cart/ and DELETE /cart/
  if (cleanPath === '/cart/') {
    if (method === 'GET') {
      return mockState.getCart(currentUserId) as unknown as T;
    }

    if (method === 'DELETE') {
      mockState.clearCart(currentUserId);
      return null as unknown as T;
    }
  }

  // 2. GET /cart/items/ and POST /cart/items/
  if (cleanPath === '/cart/items/') {
    if (method === 'GET') {
      return mockState.getCartItems(currentUserId) as unknown as T;
    }

    if (method === 'POST') {
      const data = body || {};
      const fieldErrors: Record<string, string[]> = {};

      if (!data.product_id) {
        fieldErrors['product_id'] = ['This field is required.'];
      } else {
        const product = mockState.getProduct(Number(data.product_id));
        if (!product) {
          fieldErrors['product_id'] = ['Invalid product ID.'];
        }
      }

      if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity < 1)) {
        fieldErrors['quantity'] = ['Quantity must be at least 1.'];
      }

      if (Object.keys(fieldErrors).length > 0) {
        throw new ApiError({
          message: 'Cart item validation failed.',
          fieldErrors,
          status: 400,
          raw: fieldErrors,
        });
      }

      const item = mockState.addCartItem(currentUserId, {
        product_id: Number(data.product_id),
        quantity: data.quantity ? Number(data.quantity) : 1,
        color_id: data.color_id ? Number(data.color_id) : undefined,
      });
      return item as unknown as T;
    }
  }

  // 3. PATCH /cart/items/<id>/ and DELETE /cart/items/<id>/
  const cartItemMatch = cleanPath.match(/^\/cart\/items\/(\d+)\/$/);
  if (cartItemMatch) {
    const itemId = Number(cartItemMatch[1]);

    if (method === 'PATCH') {
      const data = body || {};
      if (typeof data.quantity !== 'number' || data.quantity < 1) {
        throw new ApiError({
          message: 'Validation failed',
          fieldErrors: { quantity: ['Quantity must be at least 1.'] },
          status: 400,
        });
      }

      const updated = mockState.updateCartItemQuantity(currentUserId, itemId, data.quantity);
      return updated as unknown as T;
    }

    if (method === 'DELETE') {
      mockState.removeCartItem(currentUserId, itemId);
      return null as unknown as T;
    }
  }

  // ==========================================
  // ORDERS ENDPOINTS (/orders/)
  // ==========================================

  // 1. GET /orders/my-orders/
  if (cleanPath === '/orders/my-orders/') {
    if (method === 'GET') {
      if (!currentUserId) {
        throw new ApiError({
          message: 'Authentication credentials were not provided.',
          fieldErrors: {},
          status: 401,
          raw: { detail: 'Authentication credentials were not provided.' },
        });
      }
      return mockState.getUserOrders(currentUserId) as unknown as T;
    }
  }

  // 2. GET /orders/ and POST /orders/
  if (cleanPath === '/orders/') {
    if (method === 'GET') {
      const currentUser = mockState.getUserById(currentUserId);
      if (!currentUser) {
        throw new ApiError({
          message: 'Authentication credentials were not provided.',
          fieldErrors: {},
          status: 401,
          raw: { detail: 'Authentication credentials were not provided.' },
        });
      }
      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MODERATOR') {
        throw new ApiError({
          message: 'You do not have permission to perform this action.',
          fieldErrors: {},
          status: 403,
          raw: { detail: 'You do not have permission to perform this action.' },
        });
      }
      return mockState.getOrders() as unknown as T;
    }

    if (method === 'POST') {
      if (!currentUserId) {
        throw new ApiError({
          message: 'Authentication credentials were not provided.',
          fieldErrors: {},
          status: 401,
          raw: { detail: 'Authentication credentials were not provided.' },
        });
      }
      const data = body || {};
      if (!data.address_id) {
        throw new ApiError({
          message: 'Validation error',
          fieldErrors: { address_id: ['This field is required.'] },
          status: 400,
          raw: { address_id: ['This field is required.'] },
        });
      }

      try {
        const order = mockState.createOrder(currentUserId, Number(data.address_id));
        return order as unknown as T;
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
        throw new ApiError({
          message: err.message || 'Error creating order.',
          fieldErrors: err.fieldErrors || {},
          status: err.status || 400,
          raw: err.raw || err.fieldErrors || { detail: err.message },
        });
      }
    }
  }

  // 3. PATCH /orders/<id>/status/
  const orderStatusMatch = cleanPath.match(/^\/orders\/(\d+)\/status\/$/);
  if (orderStatusMatch) {
    const orderId = Number(orderStatusMatch[1]);
    if (method === 'PATCH') {
      const currentUser = mockState.getUserById(currentUserId);
      if (!currentUser) {
        throw new ApiError({
          message: 'Authentication credentials were not provided.',
          fieldErrors: {},
          status: 401,
          raw: { detail: 'Authentication credentials were not provided.' },
        });
      }
      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MODERATOR') {
        throw new ApiError({
          message: 'You do not have permission to perform this action.',
          fieldErrors: {},
          status: 403,
          raw: { detail: 'You do not have permission to perform this action.' },
        });
      }

      const data = body || {};
      const validStatuses = ['NOT_CONFIRMED', 'CONFIRMED', 'CANCELLED'];
      if (!data.status || !validStatuses.includes(data.status)) {
        throw new ApiError({
          message: 'Invalid status provided.',
          fieldErrors: { status: [`Status must be one of: ${validStatuses.join(', ')}.`] },
          status: 400,
          raw: { status: [`Status must be one of: ${validStatuses.join(', ')}.`] },
        });
      }

      try {
        const updated = mockState.updateOrderStatus(orderId, data.status);
        return updated as unknown as T;
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
        throw new ApiError({
          message: err.message || 'Order not found.',
          fieldErrors: {},
          status: err.status || 404,
          raw: { detail: err.message || 'Not found.' },
        });
      }
    }
  }

  // 4. GET /orders/<id>/ (Explicitly block PUT / PATCH / DELETE on base order)
  const singleOrderMatch = cleanPath.match(/^\/orders\/(\d+)\/$/);
  if (singleOrderMatch) {
    const orderId = Number(singleOrderMatch[1]);
    if (method === 'GET') {
      const currentUser = mockState.getUserById(currentUserId);
      if (!currentUser) {
        throw new ApiError({
          message: 'Authentication credentials were not provided.',
          fieldErrors: {},
          status: 401,
          raw: { detail: 'Authentication credentials were not provided.' },
        });
      }

      const order = mockState.getOrderById(orderId);
      if (!order) {
        throw new ApiError({
          message: 'Order not found.',
          fieldErrors: {},
          status: 404,
          raw: { detail: 'Not found.' },
        });
      }

      if (
        currentUser.role !== 'ADMIN' &&
        currentUser.role !== 'MODERATOR' &&
        order.user_id !== currentUserId
      ) {
        throw new ApiError({
          message: 'You do not have permission to perform this action.',
          fieldErrors: {},
          status: 403,
          raw: { detail: 'You do not have permission to perform this action.' },
        });
      }

      return order as unknown as T;
    }

    if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      throw new ApiError({
        message: `Method "${method}" not allowed on /orders/${orderId}/. Use /orders/${orderId}/status/ for status updates.`,
        fieldErrors: {},
        status: 405,
        raw: { detail: `Method "${method}" not allowed.` },
      });
    }
  }

  // Endpoint not matched
  throw new ApiError({
    message: `Not found: ${method} ${path}`,
    fieldErrors: {},
    status: 404,
    raw: { detail: 'Not found.' },
  });
}
