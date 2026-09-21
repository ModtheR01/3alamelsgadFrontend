'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  BackendUser,
  ProfileResponse,
  Address,
  UserRole,
  LoginRequest,
  RegisterRequest,
  ProfileUpdateRequest,
  AddressCreateRequest,
  AddressUpdateRequest,
} from '@/types/auth';
import { authService } from '../api/services/authService';
import { userService } from '../api/services/userService';
import { addressService } from '../api/services/addressService';
import { apiConfig, ApiMode } from '../api/config';
import { apiClient } from '../api/client';
import { mockState, TestScenario } from '../api/mock/mockState';

interface AuthContextType {
  user: BackendUser | null;
  profile: ProfileResponse | null;
  addresses: Address[];
  isLoading: boolean;
  isAddressesLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  apiMode: ApiMode;
  activeScenario: TestScenario;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (data: ProfileUpdateRequest, method?: 'PUT' | 'PATCH') => Promise<void>;
  deleteAccount: () => Promise<void>;

  // Address Actions
  fetchAddresses: () => Promise<void>;
  createAddress: (data: AddressCreateRequest) => Promise<Address>;
  updateAddress: (id: number, data: AddressUpdateRequest, method?: 'PUT' | 'PATCH') => Promise<Address>;
  deleteAddress: (id: number) => Promise<void>;
  setDefaultAddress: (id: number) => Promise<void>;

  // Developer / Mock Testing controls
  switchApiMode: (mode: ApiMode) => void;
  setScenario: (scenario: TestScenario) => void;
  switchSimulatedUser: (role: UserRole) => void;
  resetMockData: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const subscribeApiConfig = (onStoreChange: () => void) => apiConfig.subscribe(onStoreChange);
const getApiMode = () => apiConfig.getMode();
const getServerApiMode = () => 'mock' as ApiMode;

const subscribeMockState = (onStoreChange: () => void) => mockState.subscribe(onStoreChange);
const getScenario = () => mockState.getScenario();
const getServerScenario = () => 'normal' as TestScenario;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const apiMode = useSyncExternalStore(subscribeApiConfig, getApiMode, getServerApiMode);
  const activeScenario = useSyncExternalStore(subscribeMockState, getScenario, getServerScenario);

  const loadAddresses = useCallback(async () => {
    try {
      setIsAddressesLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch {
      setAddresses([]);
    } finally {
      setIsAddressesLoading(false);
    }
  }, []);

  const initAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setProfile({
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        email: currentUser.email,
        phone: currentUser.phone,
      });
      await loadAddresses();
    } catch {
      setUser(null);
      setProfile(null);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadAddresses]);

  // Initial session check on mount
  useEffect(() => {
    let active = true;

    authService
      .getCurrentUser()
      .then(async (currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setProfile({
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          email: currentUser.email,
          phone: currentUser.phone,
        });
        const addrs = await addressService.getAddresses().catch(() => []);
        if (active) setAddresses(addrs);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setProfile(null);
        setAddresses([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    // Listen to token refresh failure events from ApiClient
    const unsubAuthFailure = apiClient.onAuthFailure(() => {
      setUser(null);
      setProfile(null);
      setAddresses([]);
    });

    return () => {
      active = false;
      unsubAuthFailure();
    };
  }, []);

  // Login
  const login = async (data: LoginRequest) => {
    const res = await authService.login(data);
    setUser(res.user);
    setProfile({
      first_name: res.user.first_name,
      last_name: res.user.last_name,
      email: res.user.email,
      phone: res.user.phone,
    });
    await loadAddresses();
  };

  // Register
  const register = async (data: RegisterRequest) => {
    const res = await authService.register(data);
    setUser(res.user);
    setProfile({
      first_name: res.user.first_name,
      last_name: res.user.last_name,
      email: res.user.email,
      phone: res.user.phone,
    });
    await loadAddresses();
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setProfile(null);
      setAddresses([]);
    }
  };

  // Refresh current session
  const refreshSession = async () => {
    await initAuth();
  };

  // Update Profile
  const updateProfile = async (data: ProfileUpdateRequest, method: 'PUT' | 'PATCH' = 'PUT') => {
    const res = await userService.updateProfile(data, method);
    setProfile(res.user);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            first_name: res.user.first_name,
            last_name: res.user.last_name,
            phone: res.user.phone,
          }
        : null
    );
  };

  // Delete Profile (Soft Delete)
  const deleteAccount = async () => {
    await userService.deleteProfile();
    setUser(null);
    setProfile(null);
    setAddresses([]);
  };

  // Address Actions
  const createAddress = async (data: AddressCreateRequest): Promise<Address> => {
    const created = await addressService.createAddress(data);
    await loadAddresses();
    return created;
  };

  const updateAddress = async (
    id: number,
    data: AddressUpdateRequest,
    method: 'PUT' | 'PATCH' = 'PUT'
  ): Promise<Address> => {
    const updated = await addressService.updateAddress(id, data, method);
    await loadAddresses();
    return updated;
  };

  const deleteAddress = async (id: number) => {
    await addressService.deleteAddress(id);
    await loadAddresses();
  };

  const setDefaultAddress = async (id: number) => {
    await addressService.setDefaultAddress(id);
    await loadAddresses();
  };

  // Testing controls
  const switchApiMode = (mode: ApiMode) => {
    apiConfig.setMode(mode);
    initAuth();
  };

  const setScenario = (scenario: TestScenario) => {
    mockState.setScenario(scenario);
  };

  const switchSimulatedUser = (role: UserRole) => {
    mockState.switchSimulatedUser(role);
    initAuth();
  };

  const resetMockData = () => {
    mockState.resetMockData();
    initAuth();
  };

  const value: AuthContextType = {
    user,
    profile,
    addresses,
    isLoading,
    isAddressesLoading,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
    apiMode,
    activeScenario,
    login,
    register,
    logout,
    refreshSession,
    updateProfile,
    deleteAccount,
    fetchAddresses: loadAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    switchApiMode,
    setScenario,
    switchSimulatedUser,
    resetMockData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
