/**
 * Django REST Framework Backend Authentication & User Management Types
 * Strictly matches the backend API specification.
 */

export type UserRole = 'ADMIN' | 'MODERATOR' | 'CUSTOMER';

export interface BackendUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active?: boolean;
  created_at?: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
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
  email: string;
  phone: string;
}

export interface ProfileUpdateRequest {
  first_name: string;
  last_name: string;
  phone: string;
}

export interface ProfileUpdateResponse {
  message: string;
  user: ProfileResponse;
}

export interface Address {
  id: number;
  title: string;
  country: string;
  city: string;
  street: string;
  building_number: string;
  apartment_number: string;
  is_default: boolean;
}

export interface AddressCreateRequest {
  title: string;
  country: string;
  city: string;
  street: string;
  building_number: string;
  apartment_number: string;
  is_default?: boolean;
}

export interface AddressUpdateRequest {
  title?: string;
  country?: string;
  city?: string;
  street?: string;
  building_number?: string;
  apartment_number?: string;
  is_default?: boolean;
}

export interface SetDefaultAddressResponse {
  message: string;
  address: Address;
}

export interface UserManagementUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface ChangeUserRoleRequest {
  role: UserRole;
}

export interface ChangeUserRoleResponse {
  message: string;
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

export interface ChangeUserStatusRequest {
  is_active: boolean;
}

export interface ChangeUserStatusResponse {
  message: string;
  user: {
    id: number;
    email: string;
    is_active: boolean;
  };
}
