/**
 * Django REST Framework Backend Authentication & User Management Types
 * Strictly matches the backend API specification.
 */

export type UserRole = 'ADMIN' | 'MODERATOR' | 'CUSTOMER';

export interface BackendUser {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  role: UserRole;
  is_active?: boolean;
  created_at?: string;
  date_joined?: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  email?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  message: string;
  user: BackendUser;
}

export interface RefreshResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface ProfileResponse {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

export interface ProfileUpdateRequest {
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface ProfileUpdateResponse {
  message: string;
  user: ProfileResponse;
}

export interface Address {
  id: number;
  title: string;
  governorate: number;
  governorate_name_ar?: string;
  governorate_name_en?: string;
  city: string;
  street: string;
  building_number: string;
  apartment_number: string;
  is_default: boolean;
  country?: string;
}

export interface AddressCreateRequest {
  title: string;
  governorate: number;
  city: string;
  street: string;
  building_number: string;
  apartment_number: string;
  is_default?: boolean;
  country?: string;
}

export interface AddressUpdateRequest {
  title?: string;
  governorate?: number;
  city?: string;
  street?: string;
  building_number?: string;
  apartment_number?: string;
  is_default?: boolean;
  country?: string;
}

export interface SetDefaultAddressResponse {
  message: string;
  address: Address;
}

export interface UserManagementUser {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  date_joined?: string;
  email?: string;
}

export interface ChangeUserRoleRequest {
  role: UserRole;
}

export interface ChangeUserRoleResponse {
  message: string;
  user: {
    id: number;
    role: UserRole;
    phone?: string;
    email?: string;
  };
}

export interface ChangeUserStatusRequest {
  is_active: boolean;
}

export interface ChangeUserStatusResponse {
  message: string;
  user: {
    id: number;
    is_active: boolean;
    phone?: string;
    email?: string;
  };
}
