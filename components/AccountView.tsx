'use client';

import React, { useState, useEffect } from 'react';
import { useToccoStore } from '@/lib/store';
import { toWhatsAppNumber } from '@/lib/utils';
import { useAuth } from '@/lib/context/AuthContext';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { Address } from '@/types/auth';
import { orderService } from '@/lib/api/services/orderService';
import { BackendOrder, BackendOrderStatus } from '@/types/order';
import { normalizeApiError } from '@/lib/api/errors';
import ProfileSection from './ProfileSection';
import SafeImage from './SafeImage';
import { shippingService } from '@/lib/api/services/shippingService';
import { GovernorateShipping } from '@/types/shipping';
import {
  User,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Check,
  Lock,
  Star,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  X,
  Copy,
  LogOut,
} from 'lucide-react';

export default function AccountView() {
  const { orders, submitPaymentProof, settings, navigateTo } = useToccoStore();
  const {
    user,
    profile,
    addresses,
    isLoading: isAuthLoading,
    isAddressesLoading,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [copiedReferenceId, setCopiedReferenceId] = useState<number | null>(null);

  // Auth Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authFieldErrors, setAuthFieldErrors] = useState<Record<string, string[]>>({});

  // Login form
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Address Modals & Forms
  const [governoratesList, setGovernoratesList] = useState<GovernorateShipping[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressTitle, setAddressTitle] = useState('');
  const [addressGovernorateId, setAddressGovernorateId] = useState<number>(1);
  const [addressCity, setAddressCity] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressBuildingNumber, setAddressBuildingNumber] = useState('');
  const [addressApartmentNumber, setAddressApartmentNumber] = useState('');
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressFieldErrors, setAddressFieldErrors] = useState<Record<string, string[]>>({});

  // Delete Address Confirm
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    shippingService.getGovernorates().then((govs) => {
      if (!active) return;
      setGovernoratesList(govs);
      if (govs.length > 0) {
        setAddressGovernorateId(Number(govs[0].id) || 1);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const getGovernorateName = (govId: number | string) => {
    const found = governoratesList.find((g) => String(g.id) === String(govId));
    return found ? found.nameAr : '';
  };

  // Order Details & Proof
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [proofInput, setProofInput] = useState('');

  // Real Backend Orders state
  const [backendOrders, setBackendOrders] = useState<BackendOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setAuthError(null);
    setIsLoggingOut(true);
    try {
      await logout();
      navigateTo('home');
    } catch (err) {
      setAuthError(normalizeApiError(err).message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const fetchMyOrders = React.useCallback(async () => {
    if (!user) return;
    setIsOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await orderService.getMyOrders();
      setBackendOrders(data);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setOrdersError(normalized.message);
    } finally {
      setIsOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    orderService
      .getMyOrders()
      .then((data) => {
        if (active) setBackendOrders(data);
      })
      .catch((err) => {
        if (active) setOrdersError(normalizeApiError(err).message);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthFieldErrors({});
    setAuthLoading(true);
    try {
      await login({
        phone: loginPhone,
        password: loginPassword,
      });
      setLoginPassword('');
    } catch (err) {
      const normalized = normalizeApiError(err);
      setAuthError(normalized.message);
      setAuthFieldErrors(normalized.fieldErrors);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthFieldErrors({});
    setAuthLoading(true);
    try {
      await register({
        first_name: regFirstName,
        last_name: regLastName,
        phone: regPhone,
        password: regPassword,
        ...(regEmail.trim() ? { email: regEmail.trim() } : {}),
      });
      setRegPassword('');
    } catch (err) {
      const normalized = normalizeApiError(err);
      setAuthError(normalized.message);
      setAuthFieldErrors(normalized.fieldErrors);
    } finally {
      setAuthLoading(false);
    }
  };

  // Address Modal opener
  const openCreateAddressModal = () => {
    setEditingAddress(null);
    setAddressTitle('عنوان المنزل');
    const firstGovId = governoratesList.length > 0 ? Number(governoratesList[0].id) : 1;
    setAddressGovernorateId(firstGovId);
    setAddressCity('المنصورة');
    setAddressStreet('شارع المشاية');
    setAddressBuildingNumber('12');
    setAddressApartmentNumber('4');
    setAddressIsDefault(addresses.length === 0);
    setAddressError(null);
    setAddressFieldErrors({});
    setShowAddressModal(true);
  };

  const openEditAddressModal = (addr: Address) => {
    setEditingAddress(addr);
    setAddressTitle(addr.title);
    setAddressGovernorateId(addr.governorate);
    setAddressCity(addr.city);
    setAddressStreet(addr.street);
    setAddressBuildingNumber(addr.building_number);
    setAddressApartmentNumber(addr.apartment_number);
    setAddressIsDefault(addr.is_default);
    setAddressError(null);
    setAddressFieldErrors({});
    setShowAddressModal(true);
  };

  // Save Address (Create or Update)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    setAddressError(null);
    setAddressFieldErrors({});

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, {
          title: addressTitle,
          governorate: Number(addressGovernorateId),
          city: addressCity,
          street: addressStreet,
          building_number: addressBuildingNumber,
          apartment_number: addressApartmentNumber,
          is_default: addressIsDefault,
        });
      } else {
        await createAddress({
          title: addressTitle,
          governorate: Number(addressGovernorateId),
          city: addressCity,
          street: addressStreet,
          building_number: addressBuildingNumber,
          apartment_number: addressApartmentNumber,
          is_default: addressIsDefault,
        });
      }
      setShowAddressModal(false);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setAddressError(normalized.message);
      setAddressFieldErrors(normalized.fieldErrors);
    } finally {
      setAddressLoading(false);
    }
  };

  // Handle Set Default Address
  const handleSetDefaultAddress = async (id: number) => {
    try {
      await setDefaultAddress(id);
    } catch (err) {
      const normalized = normalizeApiError(err);
      alert(normalized.message);
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (id: number) => {
    try {
      await deleteAddress(id);
      setDeletingAddressId(null);
    } catch (err) {
      const normalized = normalizeApiError(err);
      alert(normalized.message);
    }
  };

  // Handle Deposit Proof Submit for Orders
  const handleProofSubmit = (orderId: string) => {
    if (!proofInput.trim()) return;
    submitPaymentProof(orderId, proofInput);
    setProofInput('');
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: 'proof_submitted',
              orderStatus: 'proof_submitted',
              paymentProofNote: proofInput,
            }
          : null
      );
    }
  };

  const getStatusBadge = (orderStatus: OrderStatus, paymentStatus: PaymentStatus) => {
    if (paymentStatus === 'pending_deposit') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF3CD] text-[#856404] text-[11px] font-semibold uppercase tracking-wider">
          <AlertCircle className="w-3 h-3" />
          Awaiting {settings.depositPercentage}% Deposit
        </span>
      );
    }
    if (paymentStatus === 'proof_submitted' && orderStatus === 'proof_submitted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2E3E5] text-[#383D41] text-[11px] font-semibold uppercase tracking-wider">
          <Clock className="w-3 h-3" />
          Deposit Proof Received
        </span>
      );
    }
    if (orderStatus === 'in_production') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D1E7DD] text-[#0F5132] text-[11px] font-semibold uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3" />
          In Production (Casting)
        </span>
      );
    }
    if (orderStatus === 'ready_for_shipping') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CCE5FF] text-[#004085] text-[11px] font-semibold uppercase tracking-wider">
          <Package className="w-3 h-3" />
          Ready for White-Glove Shipping
        </span>
      );
    }
    if (orderStatus === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4EDDA] text-[#155724] text-[11px] font-semibold uppercase tracking-wider">
          <Check className="w-3 h-3" />
          Delivered & Installed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFEBE3] text-[#524B45] text-[11px] font-semibold uppercase tracking-wider">
        {orderStatus}
      </span>
    );
  };

  const getBackendStatusBadge = (status: BackendOrderStatus) => {
    if (status === 'CONFIRMED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5EE] text-[#1E6B3A] border border-[#C5E5D0] text-[11px] font-semibold uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3" />
          Confirmed · In Production
        </span>
      );
    }
    if (status === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F2EF] text-[#736B63] border border-[#D8CEBF] text-[11px] font-semibold uppercase tracking-wider">
          <AlertCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    }
    // NOT_CONFIRMED
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0E6] text-[#B85D38] border border-[#E8D5C4] text-[11px] font-semibold uppercase tracking-wider">
        <Clock className="w-3 h-3" />
        Pending Confirmation
      </span>
    );
  };

  return (
    <div id="account-portal-page" className="pt-20 sm:pt-28 pb-20 sm:pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">


        {/* LOADING STATE */}
        {isAuthLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#643D26] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-wider text-[#736B63]">Verifying Atelier Session...</p>
          </div>
        ) : !user ? (
          /* =========================================================================
             UNAUTHENTICATED: SIGN IN & REGISTRATION
             ========================================================================= */
          <div className="py-8 sm:py-16 max-w-md mx-auto">
            <div className="p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-5 sm:space-y-6">
              {/* Tabs: Sign In / Create Account */}
              <div className="flex border-b border-[#EAE4DC] text-xs uppercase tracking-wider font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthFieldErrors({});
                  }}
                  className={`flex-1 pb-3 text-center transition-all ${
                    authMode === 'login'
                      ? 'border-b-2 border-[#1C1A19] text-[#1C1A19] font-bold'
                      : 'text-[#736B63] hover:text-[#1C1A19]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                    setAuthFieldErrors({});
                  }}
                  className={`flex-1 pb-3 text-center transition-all ${
                    authMode === 'register'
                      ? 'border-b-2 border-[#1C1A19] text-[#1C1A19] font-bold'
                      : 'text-[#736B63] hover:text-[#1C1A19]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="p-3 rounded-lg bg-[#FDF3F2] border border-[#F5C2C0] text-[#9E4A2B] text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">{authError}</p>
                    {authFieldErrors.non_field_errors && (
                      <p className="text-[11px]">{authFieldErrors.non_field_errors.join(' ')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* SIGN IN FORM */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider text-[#1C1A19] font-medium">
                      Mobile Phone / رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      required
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="01012345678"
                      className={`w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border text-[#1C1A19] focus:outline-none focus:border-[#1C1A19] ${
                        authFieldErrors.phone ? 'border-red-400' : 'border-[#D8CEBF]'
                      }`}
                    />
                    {authFieldErrors.phone && (
                      <p className="text-[10px] text-red-600">{authFieldErrors.phone[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] sm:text-xs uppercase tracking-wider text-[#1C1A19] font-medium">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full text-xs px-3.5 py-3 rounded-lg bg-[#FAF8F5] border text-[#1C1A19] focus:outline-none focus:border-[#1C1A19] ${
                        authFieldErrors.password ? 'border-red-400' : 'border-[#D8CEBF]'
                      }`}
                    />
                    {authFieldErrors.password && (
                      <p className="text-[10px] text-red-600">{authFieldErrors.password[0]}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#332F2D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <span>Sign In to Atelier</span>
                    )}
                  </button>

                </form>
              )}

              {/* REGISTRATION FORM */}
              {authMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] uppercase tracking-wider text-[#1C1A19] font-medium">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder="Anas"
                        className={`w-full text-xs px-3 py-2.5 rounded-lg bg-[#FAF8F5] border text-[#1C1A19] focus:outline-none focus:border-[#1C1A19] ${
                          authFieldErrors.first_name ? 'border-red-400' : 'border-[#D8CEBF]'
                        }`}
                      />
                      {authFieldErrors.first_name && (
                        <p className="text-[10px] text-red-600">{authFieldErrors.first_name[0]}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] uppercase tracking-wider text-[#1C1A19] font-medium">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        placeholder="Sayed"
                        className={`w-full text-xs px-3 py-2.5 rounded-lg bg-[#FAF8F5] border text-[#1C1A19] focus:outline-none focus:border-[#1C1A19] ${
                          authFieldErrors.last_name ? 'border-red-400' : 'border-[#D8CEBF]'
                        }`}
                      />
                      {authFieldErrors.last_name && (
                        <p className="text-[10px] text-red-600">{authFieldErrors.last_name[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wider text-[#1C1A19] font-medium">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="anas.sayed@example.com"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg bg-[#FAF8F5] border text-[#1C1A19] focus:outline-none focus:border-[#1C1A19] ${
                        authFieldErrors.email ? 'border-red-400' : 'border-[#D8CEBF]'
                      }`}
                    />
                    {authFieldErrors.email && (
                      <p className="text-[10px] text-red-600">{authFieldErrors.email[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wider text-[#1C1A19] font-medium">
                      Mobile Phone
                    </label>
                    <input
                      type="tel"
                        inputMode="numeric"
                        maxLength={11}
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="01012345678"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg bg-[#FAF8F5] border text-[#1C1A19] focus:outline-none focus:border-[#1C1A19] ${
                        authFieldErrors.phone ? 'border-red-400' : 'border-[#D8CEBF]'
                      }`}
                    />
                    {authFieldErrors.phone && (
                      <p className="text-[10px] text-red-600">{authFieldErrors.phone[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wider text-[#1C1A19] font-medium">
                      Password (min. 8 chars)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full text-xs px-3 py-2.5 rounded-lg bg-[#FAF8F5] border text-[#1C1A19] focus:outline-none focus:border-[#1C1A19] ${
                        authFieldErrors.password ? 'border-red-400' : 'border-[#D8CEBF]'
                      }`}
                    />
                    {authFieldErrors.password && (
                      <p className="text-[10px] text-red-600">{authFieldErrors.password[0]}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#332F2D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <span>Complete Registration</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* =========================================================================
             AUTHENTICATED CLIENT DASHBOARD
             ========================================================================= */
          <div className="py-6 sm:py-10 space-y-6 sm:space-y-8">
            {/* Auth Error Banner if logout fails */}
            {authError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{authError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  className="text-red-700 hover:text-red-900 text-xs font-semibold"
                >
                  إغلاق
                </button>
              </div>
            )}

            {/* Authenticated User Header Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1C1A19] text-[#FAF8F5] flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  {user?.first_name ? user.first_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-[#1C1A19]">
                    مرحباً، {user?.first_name || 'العميل'} {user?.last_name || ''}
                  </h2>
                  <p className="text-xs text-[#736B63] font-mono mt-0.5" dir="ltr">
                    {user?.phone || user?.email || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  id="account-view-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-4 py-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  title="تسجيل الخروج من الحساب"
                >
                  {isLoggingOut ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                      <span>جاري تسجيل الخروج...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span>تسجيل الخروج</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Admin / Moderator Privileges Banner (Accessible ONLY to Admin/Moderator, hidden from Customers) */}
            {Boolean(user?.role && (user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'moderator')) && (
              <div className="p-4 rounded-2xl bg-[#241710] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EED8BE]/20 text-[#EED8BE] flex items-center justify-center font-bold text-sm shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold">Administrative Access Granted</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF5EB]/20 text-[#EED8BE]">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70">
                      Manage products, Arwal sizing, orders, payment verification, and campaigns.
                    </p>
                  </div>
                </div>

                <a
                  href="/dashboard"
                  className="px-4 py-2 rounded-xl bg-[#EED8BE] hover:bg-white text-[#241710] text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5"
                >
                  <span>Open Admin Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-[#EAE4DC] gap-4 sm:gap-6 text-[11px] sm:text-xs uppercase tracking-wider font-medium overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-3 relative transition-colors whitespace-nowrap ${
                  activeTab === 'orders' ? 'text-[#1C1A19] font-bold' : 'text-[#736B63] hover:text-[#1C1A19]'
                }`}
              >
                Commissions & Orders ({backendOrders.length})
                {activeTab === 'orders' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#643D26]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`pb-3 relative transition-colors whitespace-nowrap ${
                  activeTab === 'addresses' ? 'text-[#1C1A19] font-bold' : 'text-[#736B63] hover:text-[#1C1A19]'
                }`}
              >
                Delivery Residences ({addresses.length})
                {activeTab === 'addresses' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#643D26]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-3 relative transition-colors whitespace-nowrap ${
                  activeTab === 'profile' ? 'text-[#1C1A19] font-bold' : 'text-[#736B63] hover:text-[#1C1A19]'
                }`}
              >
                Client Profile
                {activeTab === 'profile' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#643D26]" />
                )}
              </button>
            </div>

            {/* TAB 1: COMMISSIONS & ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4 sm:space-y-6">
                {isOrdersLoading ? (
                  <div className="py-12 sm:py-16 text-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#643D26] mx-auto" />
                    <p className="text-xs uppercase tracking-wider text-[#736B63]">
                      Retrieving Artisanal Commissions...
                    </p>
                  </div>
                ) : ordersError ? (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{ordersError}</span>
                    </div>
                    <button
                      onClick={fetchMyOrders}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-800 font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                ) : backendOrders.length === 0 ? (
                  <div className="py-12 sm:py-16 text-center space-y-4">
                    <p className="text-sm sm:text-base text-[#1C1A19]">No commissions placed yet.</p>
                    <button
                      onClick={() => navigateTo('shop')}
                      className="px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D]"
                    >
                      Browse Catalogue
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {backendOrders.map((ord) => {
                      const whatsappUrl = `https://wa.me/${toWhatsAppNumber(settings.contact.whatsapp)}?text=${encodeURIComponent(
                        `مرحباً عالم السجاد، أود الاستفسار عن حالة طلبي رقم #${ord.order_number}.`
                      )}`;
                      const depositPercentage = Number(ord.deposit_percentage);
                      const deposit = Math.round(Number(ord.total_price) * depositPercentage / 100);

                      return (
                        <div
                          key={ord.id}
                          className="p-5 sm:p-7 rounded-xl sm:rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EAE4DC]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-mono text-[#736B63]">
                                  Reference: {ord.order_number}
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(String(ord.order_number));
                                    setCopiedReferenceId(ord.id);
                                    window.setTimeout(() => setCopiedReferenceId(null), 1500);
                                  }}
                                  aria-label={`Copy reference ${ord.order_number}`}
                                  title={copiedReferenceId === ord.id ? 'Copied' : 'Copy reference'}
                                  className="inline-flex items-center justify-center rounded-md p-1 text-[#736B63] hover:bg-[#F5F1EA] hover:text-[#1C1A19]"
                                >
                                  {copiedReferenceId === ord.id ? (
                                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-[#8F8880] mt-0.5">
                                Ordered on {new Date(ord.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getBackendStatusBadge(ord.status)}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {ord.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-4 py-2 border-b border-[#FAF8F5] last:border-0">
                                <div className="w-12 h-12 rounded-lg bg-[#F5F1EA] overflow-hidden shrink-0 relative flex items-center justify-center border border-[#EAE4DC]">
                                  {item.color_hex_code && (
                                    <div
                                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                                      style={{ backgroundColor: item.color_hex_code }}
                                      title={item.color_name || undefined}
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs sm:text-sm font-medium text-[#1C1A19] truncate">{item.product_name}</h4>
                                  <p className="text-[11px] text-[#736B63] flex items-center gap-1.5 mt-0.5">
                                    {item.color_name && (
                                      <>
                                        <span>Color: {item.color_name}</span>
                                        <span>•</span>
                                      </>
                                    )}
                                    <span>Qty: {item.quantity}</span>
                                    <span>•</span>
                                    <span className="font-mono">{Number(item.product_price).toLocaleString()} EGP each</span>
                                  </p>
                                </div>
                                <span className="text-xs font-mono font-medium text-[#1C1A19]">
                                  {Number(item.subtotal).toLocaleString()} EGP
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EAE4DC] text-xs">
                            <div>
                              <span className="text-[#736B63]">{depositPercentage}% Handcrafted Deposit: </span>
                              <span className="font-semibold text-[#643D26] font-mono">{deposit.toLocaleString()} EGP</span>
                              <span className="text-[#8F8880] text-[11px] ml-2 font-mono">Total: {Number(ord.total_price).toLocaleString()} EGP</span>
                              {ord.shipping_address && (
                                <p className="text-[11px] text-[#8F8880] mt-1">
                                  Destination: {ord.shipping_address.title} ({ord.shipping_address.street}, {ord.shipping_address.city})
                                </p>
                              )}
                            </div>

                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D8CEBF] text-[11px] uppercase tracking-wider text-[#524B45] hover:bg-[#F5F1EA] transition-colors self-start sm:self-auto"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                              <span>Concierge Support</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-[#1C1A19]">
                      Delivery Residences & Coastal Villas
                    </h3>
                    <p className="text-xs text-[#736B63]">
                      Addresses are validated against duplicate entries and ordered by default status.
                    </p>
                  </div>
                  <button
                    onClick={openCreateAddressModal}
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1C1A19] text-white text-[11px] sm:text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Residence</span>
                  </button>
                </div>

                {isAddressesLoading ? (
                  <div className="py-12 text-center text-xs uppercase tracking-wider text-[#736B63]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#643D26]" />
                    Loading delivery residences...
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="py-12 bg-white rounded-xl border border-[#EAE4DC] text-center space-y-3 p-6">
                    <MapPin className="w-8 h-8 text-[#D8CEBF] mx-auto" />
                    <p className="text-xs text-[#736B63]">No saved delivery residences yet.</p>
                    <button
                      onClick={openCreateAddressModal}
                      className="px-4 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium"
                    >
                      Add First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-xl sm:rounded-2xl bg-white border transition-all flex flex-col justify-between space-y-4 ${
                          addr.is_default ? 'border-[#643D26] shadow-md ring-1 ring-[#643D26]/10' : 'border-[#EAE4DC] shadow-sm'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-[#643D26]">
                                {addr.title}
                              </span>
                              {addr.is_default && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5EFEB] text-[#643D26] text-[10px] uppercase font-semibold">
                                  <Star className="w-2.5 h-2.5 fill-[#643D26]" />
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditAddressModal(addr)}
                                className="text-[#8F8880] hover:text-[#1C1A19] p-1 transition-colors"
                                title="Edit Residence"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingAddressId(addr.id)}
                                className="text-[#8F8880] hover:text-[#B85D38] p-1 transition-colors"
                                title="Delete Residence"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-sm font-medium text-[#1C1A19]">
                            {addr.city}{getGovernorateName(addr.governorate) ? `، ${getGovernorateName(addr.governorate)}` : (addr.country ? `، ${addr.country}` : '')}
                          </h4>
                          <p className="text-xs text-[#736B63]">{addr.street}</p>
                          <p className="text-[11px] text-[#8F8880]">
                            Bldg {addr.building_number}, Apt {addr.apartment_number}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#FAF8F5] flex items-center justify-between">
                          {!addr.is_default ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[11px] uppercase tracking-wider text-[#643D26] hover:underline font-medium"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span className="text-[10px] uppercase tracking-widest text-[#643D26] font-medium">
                              Primary White-Glove Destination
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Delete Address Confirmation Dialog */}
                {deletingAddressId !== null && (
                  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 border border-[#EAE4DC] shadow-xl">
                      <div className="flex items-center gap-2 text-[#B85D38]">
                        <AlertTriangle className="w-5 h-5" />
                        <h4 className="text-sm font-semibold">Delete Residence?</h4>
                      </div>
                      <p className="text-xs text-[#736B63]">
                        Are you sure you want to remove this delivery residence? If this is the default address, another address will automatically become default.
                      </p>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setDeletingAddressId(null)}
                          className="px-3.5 py-1.5 text-xs uppercase tracking-wider text-[#736B63] hover:text-[#1C1A19]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(deletingAddressId)}
                          className="px-4 py-1.5 rounded-full bg-[#B85D38] text-white text-xs uppercase tracking-wider font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add / Edit Address Modal */}
                {showAddressModal && (
                  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 my-8 border border-[#EAE4DC] shadow-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                      <div className="flex justify-between items-center border-b border-[#EAE4DC] pb-3">
                        <h3 className="text-base font-medium text-[#1C1A19]">
                          {editingAddress ? 'Edit Delivery Residence' : 'Add Delivery Residence'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowAddressModal(false)}
                          className="text-[#8F8880] hover:text-[#1C1A19]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {addressError && (
                        <div className="p-3 rounded-lg bg-[#FDF3F2] border border-[#F5C2C0] text-[#9E4A2B] text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{addressError}</span>
                        </div>
                      )}

                      <form onSubmit={handleSaveAddress} className="space-y-3">
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
                            Title / Residence Name
                          </label>
                          <input
                            type="text"
                            required
                            value={addressTitle}
                            onChange={(e) => setAddressTitle(e.target.value)}
                            placeholder="e.g. Sahel Summer Villa / Zamalek Penthouse"
                            className="w-full text-xs p-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
                              Governorate / المحافظة
                            </label>
                            <select
                              required
                              value={addressGovernorateId}
                              onChange={(e) => setAddressGovernorateId(Number(e.target.value))}
                              className="w-full text-xs p-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] text-[#1C1A19] focus:outline-none focus:border-[#1C1A19]"
                            >
                              {governoratesList.map((gov) => (
                                <option key={gov.id} value={gov.id}>
                                  {gov.nameAr} ({gov.nameEn})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
                              City / المدينة
                            </label>
                            <input
                              type="text"
                              required
                              value={addressCity}
                              onChange={(e) => setAddressCity(e.target.value)}
                              placeholder="Mansoura / New Cairo"
                              className="w-full text-xs p-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
                            Street Address / Compound
                          </label>
                          <input
                            type="text"
                            required
                            value={addressStreet}
                            onChange={(e) => setAddressStreet(e.target.value)}
                            placeholder="e.g. Catania Village, Road 42"
                            className="w-full text-xs p-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
                              Building Number
                            </label>
                            <input
                              type="text"
                              required
                              value={addressBuildingNumber}
                              onChange={(e) => setAddressBuildingNumber(e.target.value)}
                              placeholder="e.g. 18 or Villa 42"
                              className="w-full text-xs p-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
                              Apartment / Suite
                            </label>
                            <input
                              type="text"
                              required
                              value={addressApartmentNumber}
                              onChange={(e) => setAddressApartmentNumber(e.target.value)}
                              placeholder="e.g. 5 or Penthouse"
                              className="w-full text-xs p-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5]"
                            />
                          </div>
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="addr-default-check"
                            checked={addressIsDefault}
                            onChange={(e) => setAddressIsDefault(e.target.checked)}
                            className="rounded border-[#D8CEBF] text-[#643D26] focus:ring-[#643D26]"
                          />
                          <label htmlFor="addr-default-check" className="text-xs text-[#524B45]">
                            Set as default delivery residence
                          </label>
                        </div>

                        <div className="pt-3 flex justify-end gap-2 border-t border-[#EAE4DC]">
                          <button
                            type="button"
                            onClick={() => setShowAddressModal(false)}
                            className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={addressLoading}
                            className="px-5 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium disabled:opacity-50 flex items-center gap-2"
                          >
                            {addressLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                            <span>Save Residence</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CLIENT PROFILE */}
            {activeTab === 'profile' && (
              <ProfileSection
                user={user}
                profile={profile}
                updateProfile={updateProfile}
                deleteAccount={deleteAccount}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
