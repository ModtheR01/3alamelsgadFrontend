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
import { useLanguage } from '@/lib/context/LanguageContext';
import {
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
  Cog,
  Truck,
  CheckCheck,
  ShoppingBag,
  CreditCard,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';

export default function AccountView() {
  const { t, isRtl } = useLanguage();
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

  // Real Backend Orders state & Live Refreshing
  const [backendOrders, setBackendOrders] = useState<BackendOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isOrdersRefreshing, setIsOrdersRefreshing] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [lastOrdersRefreshedAt, setLastOrdersRefreshedAt] = useState<Date | null>(null);
  const isFetchingOrdersRef = React.useRef(false);

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

  const fetchMyOrders = React.useCallback(async (isSilent = false) => {
    if (!user || isFetchingOrdersRef.current) return;
    isFetchingOrdersRef.current = true;
    if (!isSilent) {
      setIsOrdersLoading(true);
    } else {
      setIsOrdersRefreshing(true);
    }
    setOrdersError(null);
    try {
      const data = await orderService.getMyOrders();
      setBackendOrders(data);
      setLastOrdersRefreshedAt(new Date());
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (!isSilent) {
        setOrdersError(normalized.message);
      }
    } finally {
      isFetchingOrdersRef.current = false;
      setIsOrdersLoading(false);
      setIsOrdersRefreshing(false);
    }
  }, [user]);

  // Initial orders fetch when user is authenticated
  useEffect(() => {
    if (!user) return;
    fetchMyOrders(false);
  }, [user, fetchMyOrders]);

  // Refetch when switching to orders tab
  useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchMyOrders(backendOrders.length === 0 ? false : true);
    }
  }, [activeTab, user, fetchMyOrders, backendOrders.length]);

  // Live order status refresh: window focus, visibilitychange, and 15s polling
  useEffect(() => {
    if (!user || activeTab !== 'orders') return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchMyOrders(true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMyOrders(true);
      }
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, [user, activeTab, fetchMyOrders]);

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

  const formatMoneySafe = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined || val === '') return isRtl ? 'غير متاح' : 'N/A';
    const num = Number(val);
    if (isNaN(num)) return isRtl ? 'غير متاح' : 'N/A';
    return `${num.toLocaleString(isRtl ? 'ar-EG' : 'en-EG')} ${isRtl ? 'ج.م' : 'EGP'}`;
  };

  const formatOrderDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getPaymentMethodLabel = (method?: string | null) => {
    if (method === 'INSTAPAY') return isRtl ? 'إنستاباي (InstaPay)' : 'InstaPay Transfer';
    if (method === 'ELECTRONIC_WALLET') return isRtl ? 'محفظة إلكترونية (فودافون كاش / وغيرها)' : 'Electronic Wallet (Vodafone Cash, etc.)';
    if (method === 'CASH_ON_DELIVERY') return isRtl ? 'الدفع نقداً عند الاستلام' : 'Cash on Delivery';
    return isRtl ? 'دفع عند الاستلام' : 'Cash on Delivery';
  };

  const getPaymentStatusBadge = (status?: string | null) => {
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{isRtl ? 'تم اعتماد الدفع' : 'Payment Confirmed'}</span>
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{isRtl ? 'قيد مراجعة التحويل' : 'Verification Pending'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-bold">
        <AlertCircle className="w-3 h-3 text-neutral-500" />
        <span>{isRtl ? 'غير مدفوع' : 'Unpaid'}</span>
      </span>
    );
  };

  const getBackendStatusConfig = (status: BackendOrderStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          label: isRtl ? 'مؤكد' : 'Confirmed',
          subLabel: isRtl ? 'تم تأكيد الطلب واعتماد الدفع' : 'Payment verified and order confirmed',
          badgeBg: 'bg-[#EFF6FF]',
          badgeText: 'text-[#1D4ED8]',
          badgeBorder: 'border-[#93C5FD]',
          icon: CheckCircle2,
          stepIndex: 1,
        };
      case 'PROCESSING':
        return {
          label: isRtl ? 'قيد التجهيز والسرفلة' : 'Processing & Production',
          subLabel: isRtl ? 'جارٍ تفصيل وسرفلة وتجهيز طلبك بعناية' : 'Customizing and edging your carpet',
          badgeBg: 'bg-[#FAF5FF]',
          badgeText: 'text-[#7E22CE]',
          badgeBorder: 'border-[#D8B4FE]',
          icon: Cog,
          stepIndex: 2,
        };
      case 'SHIPPED':
        return {
          label: isRtl ? 'تم الشحن مع المندوب' : 'Shipped & In Transit',
          subLabel: isRtl ? 'طلبك في الطريق إليك مع مندوب التوصيل' : 'In transit with delivery courier',
          badgeBg: 'bg-[#ECFEFF]',
          badgeText: 'text-[#0E7490]',
          badgeBorder: 'border-[#A5F3FC]',
          icon: Truck,
          stepIndex: 3,
        };
      case 'DELIVERED':
        return {
          label: isRtl ? 'تم التسليم بنجاح' : 'Delivered & Installed',
          subLabel: isRtl ? 'تم استلام وتوصيل الطلب بنجاح. شكراً لثقتكم!' : 'Delivered successfully. Thank you!',
          badgeBg: 'bg-[#F0FDF4]',
          badgeText: 'text-[#15803D]',
          badgeBorder: 'border-[#86EFAC]',
          icon: CheckCheck,
          stepIndex: 4,
        };
      case 'CANCELLED':
        return {
          label: isRtl ? 'طلب ملغي' : 'Cancelled',
          subLabel: isRtl ? 'تم إلغاء هذا الطلب' : 'This order has been cancelled',
          badgeBg: 'bg-[#FEF2F2]',
          badgeText: 'text-[#B91C1C]',
          badgeBorder: 'border-[#FECACA]',
          icon: AlertCircle,
          stepIndex: -1,
        };
      case 'NOT_CONFIRMED':
      default:
        return {
          label: isRtl ? 'بانتظار التأكيد' : 'Pending Confirmation',
          subLabel: isRtl ? 'تم استلام طلبك وجارٍ مراجعة تفاصيل الحجز' : 'Awaiting payment verification',
          badgeBg: 'bg-[#FFF8E6]',
          badgeText: 'text-[#B7791F]',
          badgeBorder: 'border-[#F6E05E]',
          icon: Clock,
          stepIndex: 0,
        };
    }
  };

  const getBackendStatusBadge = (status: BackendOrderStatus) => {
    const config = getBackendStatusConfig(status);
    const StatusIcon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder} text-[11px] font-bold`}
      >
        <StatusIcon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
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
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[#1C1A19]">
                  مرحباً، {user?.first_name || 'العميل'} {user?.last_name || ''}
                </h2>
                <p className="text-xs text-[#736B63] font-mono mt-0.5" dir="ltr">
                  {user?.phone || user?.email || ''}
                </p>
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
                {t('طلباتي وتعاقداتي', 'Commissions & Orders')} ({backendOrders.length})
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
                {t('عناوين التوصيل', 'Delivery Residences')} ({addresses.length})
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
                {t('الملف الشخصي', 'Client Profile')}
                {activeTab === 'profile' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#643D26]" />
                )}
              </button>
            </div>

            {/* TAB 1: COMMISSIONS & ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Orders Section Header & Live Refresh Control */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE4DC] shadow-2xs">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#1C1A19] flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#643D26]" />
                      <span>{t('سجل الطلبات والتعاقدات الحرفية', 'Orders & Commission Records')}</span>
                    </h3>
                    <p className="text-xs text-[#736B63] mt-0.5">
                      {t(
                        'متابعة فورية ومباشرة لحالة تصنيع وتجهيز وشحن سجادك مع تحديث فوري للحالة',
                        'Real-time live tracking of your handcrafted carpet production, shipping, and delivery'
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => fetchMyOrders(false)}
                      disabled={isOrdersRefreshing || isOrdersLoading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F5F1EA] text-[#643D26] border border-[#EAE4DC] text-xs font-bold transition-all disabled:opacity-60 shadow-2xs"
                      title={t('تحديث حالة الطلبات من الخادم الآن', 'Refresh orders from server now')}
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isOrdersRefreshing || isOrdersLoading ? 'animate-spin text-[#643D26]' : 'text-[#736B63]'
                        }`}
                      />
                      <span>
                        {isOrdersRefreshing
                          ? t('جارٍ التحديث...', 'Refreshing...')
                          : t('تحديث الطلبات', 'Refresh Orders')}
                      </span>
                    </button>
                  </div>
                </div>

                {isOrdersLoading && backendOrders.length === 0 ? (
                  <div className="py-16 sm:py-20 text-center space-y-3 bg-white rounded-2xl border border-[#EAE4DC]">
                    <RefreshCw className="w-7 h-7 animate-spin text-[#643D26] mx-auto" />
                    <p className="text-xs uppercase tracking-wider text-[#736B63] font-semibold">
                      {t('جارٍ استرجاع طلباتك وتعاقداتك...', 'Retrieving Artisanal Commissions...')}
                    </p>
                  </div>
                ) : ordersError ? (
                  <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                      <div>
                        <p className="font-bold">{t('تعذر تحميل الطلبات', 'Unable to load orders')}</p>
                        <p className="text-red-600/90 mt-0.5">{ordersError}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchMyOrders(false)}
                      className="px-4 py-1.5 bg-red-100 hover:bg-red-200 rounded-xl text-red-800 font-bold transition-colors"
                    >
                      {t('إعادة المحاولة', 'Retry')}
                    </button>
                  </div>
                ) : backendOrders.length === 0 ? (
                  <div className="py-16 sm:py-20 text-center space-y-4 bg-white rounded-2xl border border-[#EAE4DC] p-6 shadow-2xs">
                    <div className="w-16 h-16 rounded-full bg-[#FAF5EB] text-[#643D26] flex items-center justify-center mx-auto border border-[#EAE4DC]">
                      <ShoppingBag className="w-8 h-8 text-[#A27B5C]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-[#1C1A19]">
                        {t('لا توجد طلبات مسجلة حتى الآن', 'No commissions placed yet')}
                      </h4>
                      <p className="text-xs text-[#736B63] max-w-sm mx-auto">
                        {t(
                          'تصفح تشكيلة السجاد الفاخرة واختر ما يناسب ذوقك ومنزلك من أحدث التصاميم الحصرية.',
                          'Explore our luxury carpet catalogue and find the perfect bespoke pieces for your space.'
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTo('shop')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-bold hover:bg-[#332F2D] transition-colors shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{t('تصفح الكتالوج الآن', 'Browse Catalogue')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {backendOrders.map((ord) => {
                      const whatsappUrl = `https://wa.me/${toWhatsAppNumber(settings.contact.whatsapp)}?text=${encodeURIComponent(
                        `مرحباً عالم السجاد، أود الاستفسار عن حالة طلبي رقم #${ord.order_number}.`
                      )}`;

                      const statusConfig = getBackendStatusConfig(ord.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <div
                          key={ord.id}
                          className="rounded-2xl bg-white border border-[#EAE4DC] shadow-xs hover:shadow-sm transition-all overflow-hidden"
                        >
                          {/* ORDER HEADER */}
                          <div className="p-4 sm:p-6 bg-[#FAF8F5] border-b border-[#EAE4DC] space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-[#736B63]">
                                    {t('رقم الطلب:', 'Reference:')}
                                  </span>
                                  <span className="text-xs sm:text-sm font-mono font-bold text-[#1C1A19] bg-white px-2 py-0.5 rounded-md border border-[#EAE4DC]">
                                    #{ord.order_number}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(String(ord.order_number));
                                      setCopiedReferenceId(ord.id);
                                      window.setTimeout(() => setCopiedReferenceId(null), 2000);
                                    }}
                                    aria-label={`Copy reference ${ord.order_number}`}
                                    title={copiedReferenceId === ord.id ? t('تم النسخ', 'Copied') : t('نسخ رقم الطلب', 'Copy reference')}
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold bg-white border border-[#EAE4DC] text-[#736B63] hover:text-[#1C1A19] hover:bg-[#F5F1EA] transition-colors"
                                  >
                                    {copiedReferenceId === ord.id ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                                        <span className="text-[10px] text-emerald-700 font-bold">
                                          {t('تم النسخ', 'Copied')}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" aria-hidden="true" />
                                        <span className="text-[10px]">{t('نسخ', 'Copy')}</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-[#8F8880] flex-wrap pt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-[#A27B5C]" />
                                    <span>{t('تاريخ الطلب:', 'Ordered on:')} {formatOrderDate(ord.created_at)}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* CURRENT ORDER STATUS SECTION */}
                            <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-[#EAE4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-xs font-bold text-[#736B63]">
                                  {t('حالة الطلب:', 'Order Status:')}
                                </span>
                                {getBackendStatusBadge(ord.status)}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-[#5C4A3E] font-medium">
                                <StatusIcon className="w-4 h-4 text-[#643D26] shrink-0" />
                                <span>{statusConfig.subLabel}</span>
                              </div>
                            </div>
                          </div>

                          {/* ORDER BODY: ITEMS */}
                          <div className="p-4 sm:p-6 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#736B63] flex items-center gap-1.5">
                              <ShoppingBag className="w-3.5 h-3.5 text-[#643D26]" />
                              <span>{t('المنتجات المطلوبة في هذا الطلب', 'Purchased Items & Runners')}</span>
                            </h4>

                            {/* Product Items */}
                            {ord.items && ord.items.length > 0 && (
                              <div className="divide-y divide-[#F5EFE6] border border-[#EAE4DC] rounded-xl overflow-hidden bg-white">
                                {ord.items.map((item, idx) => {
                                  const isArwal = item.item_type === 'arwal';
                                  const title = isArwal
                                    ? (isRtl ? item.arwal_name_ar || item.arwal_name_en : item.arwal_name_en || item.arwal_name_ar) || t('رول سجاد بالمتر', 'Carpet Runner')
                                    : (isRtl ? item.product_name_ar || item.product_name_en || item.product_name : item.product_name_en || item.product_name_ar || item.product_name) || t('سجادة فاخرة', 'Luxury Carpet');
                                  const colorName = isRtl ? (item.color_name_ar || item.color_name_en || item.color_name) : (item.color_name_en || item.color_name_ar || item.color_name);
                                  const unitPrice = isArwal ? item.price_per_length : (item.unit_price ?? item.product_price);

                                  return (
                                    <div
                                      key={item.id || idx}
                                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5]/40 transition-colors"
                                    >
                                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-[#FAF5EB] border border-[#EAE4DC] shrink-0 flex items-center justify-center relative shadow-2xs">
                                          {item.color_hex_code ? (
                                            <span
                                              className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                                              style={{ backgroundColor: item.color_hex_code }}
                                              title={colorName || undefined}
                                            />
                                          ) : (
                                            <Layers className="w-5 h-5 text-[#8F8880]" />
                                          )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h5 className="text-xs sm:text-sm font-bold text-[#1C1A19] truncate">
                                              {title}
                                            </h5>
                                            {isArwal && (
                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF0E6] text-[#643D26] border border-[#E8D5C4]">
                                                {t('رول بالمتر', 'Runner by Meter')}
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-[#736B63] mt-1 flex-wrap">
                                            {colorName && (
                                              <span className="flex items-center gap-1">
                                                <span className="text-[#8F8880]">{t('اللون:', 'Color:')}</span>
                                                <span className="font-semibold text-[#1C1A19]">{colorName}</span>
                                              </span>
                                            )}

                                            {isArwal ? (
                                              <span className="flex items-center gap-1">
                                                <span className="text-[#8F8880]">{t('المقاس:', 'Dimensions:')}</span>
                                                <span className="font-semibold text-[#1C1A19]">
                                                  {item.width ? `${item.width} ${t('سم عرض', 'cm width')}` : ''}
                                                  {item.width && item.length ? ' × ' : ''}
                                                  {item.length ? `${item.length} ${t('متر طول', 'm length')}` : ''}
                                                </span>
                                              </span>
                                            ) : (
                                              item.size_width && item.size_length ? (
                                                <span className="flex items-center gap-1">
                                                  <span className="text-[#8F8880]">{t('المقاس:', 'Size:')}</span>
                                                  <span className="font-semibold text-[#1C1A19]">
                                                    {item.size_width} × {item.size_length} {t('سم', 'cm')}
                                                  </span>
                                                </span>
                                              ) : null
                                            )}

                                            <span className="flex items-center gap-1">
                                              <span className="text-[#8F8880]">{t('الكمية:', 'Qty:')}</span>
                                              <span className="font-semibold text-[#1C1A19]">{item.quantity}</span>
                                            </span>

                                            {unitPrice && !isNaN(Number(unitPrice)) && (
                                              <span className="text-[#8F8880] font-mono text-[11px]">
                                                ({formatMoneySafe(unitPrice)} {isArwal ? t('/ م', '/ m') : t('للقطعة', 'each')})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-start sm:text-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#FAF8F5]">
                                        <span className="text-xs sm:text-sm font-bold font-mono text-[#1C1A19]">
                                          {formatMoneySafe(item.subtotal)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Bundle Items (if present) */}
                            {ord.bundles && ord.bundles.length > 0 && (
                              <div className="space-y-2 mt-3">
                                <h5 className="text-[11px] font-bold text-[#643D26] uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-[#B85D38]" />
                                  <span>{t('الباقات والعروض الخاصة المشمولة', 'Special Bundle Offers Included')}</span>
                                </h5>
                                <div className="divide-y divide-[#F5EFE6] border border-[#EAE4DC] rounded-xl overflow-hidden bg-white">
                                  {ord.bundles.map((bundle, bIdx) => {
                                    const bTitle = isRtl
                                      ? bundle.name_ar || bundle.name_en
                                      : bundle.name_en || bundle.name_ar;

                                    return (
                                      <div
                                        key={bundle.id || bIdx}
                                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                      >
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h5 className="text-xs sm:text-sm font-bold text-[#1C1A19]">{bTitle}</h5>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF0E6] text-[#643D26] border border-[#E8D5C4]">
                                              {t('عرض باقة', 'Bundle Offer')}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-[#736B63] mt-1">
                                            {t('الكمية:', 'Qty:')} <span className="font-semibold text-[#1C1A19]">{bundle.quantity}</span>
                                            {' • '}
                                            {t('سعر الباقة:', 'Bundle Price:')} <span className="font-semibold font-mono text-[#1C1A19]">{formatMoneySafe(bundle.bundle_price)}</span>
                                          </p>
                                        </div>
                                        <div className="text-start sm:text-end shrink-0">
                                          <span className="text-xs sm:text-sm font-bold font-mono text-[#1C1A19]">
                                            {formatMoneySafe(Number(bundle.bundle_price) * bundle.quantity)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* SHIPPING ADDRESS & PAYMENT DETAILS GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              {/* Address Box */}
                              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4DC] space-y-2">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-[#736B63] flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#643D26]" />
                                  <span>{t('عنوان الشحن والتوصيل', 'Delivery Residence')}</span>
                                </h5>

                                {ord.shipping_address ? (
                                  <div className="text-xs text-[#5C4A3E] space-y-1">
                                    <p className="font-bold text-[#1C1A19]">
                                      {ord.shipping_address.title || t('العنوان المعتمد', 'Saved Residence')}
                                    </p>
                                    <p>
                                      {ord.shipping_address.street}
                                      {ord.shipping_address.building_number ? `، عمارة ${ord.shipping_address.building_number}` : ''}
                                      {ord.shipping_address.apartment_number ? `، شقة ${ord.shipping_address.apartment_number}` : ''}
                                    </p>
                                    <p className="text-[#736B63]">
                                      {ord.shipping_address.city}
                                      {ord.shipping_governorate_name_ar || ord.shipping_address.shipping_governorate_name_ar
                                        ? `، ${ord.shipping_governorate_name_ar || ord.shipping_address.shipping_governorate_name_ar}`
                                        : ''}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#8F8880]">{t('غير محدد', 'Not specified')}</p>
                                )}

                                {ord.customer_notes && (
                                  <div className="pt-2 border-t border-[#EAE4DC]/80">
                                    <span className="text-[10px] font-bold text-[#736B63] block mb-0.5">
                                      {t('ملاحظات العميل مع الطلب:', 'Customer Notes:')}
                                    </span>
                                    <p className="text-xs text-[#5C4A3E] bg-white p-2 rounded-lg border border-[#EAE4DC]">
                                      {ord.customer_notes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Payment Box */}
                              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4DC] space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#736B63] flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-[#643D26]" />
                                    <span>{t('بيانات وطريقة السداد', 'Payment Details')}</span>
                                  </h5>
                                  {getPaymentStatusBadge(ord.payment?.status)}
                                </div>

                                <div className="text-xs text-[#5C4A3E] space-y-2">
                                  <div>
                                    <span className="text-[#8F8880] text-[11px] block">{t('طريقة الدفع:', 'Method:')}</span>
                                    <span className="font-bold text-[#1C1A19]">
                                      {getPaymentMethodLabel(ord.payment?.method)}
                                    </span>
                                  </div>

                                  {/* Payment Breakdown according to payment_type */}
                                  {ord.payment?.payment_type === 'SHIPPING_ONLY' ? (
                                    <div className="bg-white p-2.5 rounded-lg border border-[#EAE4DC] space-y-1.5 text-[11px]">
                                      <p className="font-bold text-[#643D26]">
                                        {t(
                                          'خطة السداد: عربون الشحن مقدماً والباقي عند الاستلام',
                                          'Plan: Shipping deposit in advance, balance on delivery'
                                        )}
                                      </p>
                                      <div className="flex justify-between items-center pt-1 border-t border-[#FAF8F5]">
                                        <span className="text-[#736B63]">{t('عربون الشحن المسدد:', 'Shipping Deposit:')}</span>
                                        <span className="font-bold font-mono text-[#643D26]">
                                          {formatMoneySafe(ord.payment.amount)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-[#736B63]">{t('المتبقي نقداً عند الاستلام:', 'Remainder on Delivery:')}</span>
                                        <span className="font-bold font-mono text-[#1C1A19]">
                                          {formatMoneySafe(
                                            Math.max(
                                              0,
                                              Number(ord.total_price || 0) - Number(ord.payment.amount || 0)
                                            )
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  ) : ord.payment?.payment_type === 'FULL_ORDER' ? (
                                    <div className="bg-white p-2.5 rounded-lg border border-[#EAE4DC] space-y-1.5 text-[11px]">
                                      <p className="font-bold text-[#643D26]">
                                        {t('خطة السداد: سداد كامل قيمة الطلب والشحن مقدماً', 'Plan: Full order & shipping in advance')}
                                      </p>
                                      <div className="flex justify-between items-center pt-1 border-t border-[#FAF8F5]">
                                        <span className="text-[#736B63]">{t('إجمالي المبلغ المسدد:', 'Total Paid:')}</span>
                                        <span className="font-bold font-mono text-[#643D26]">
                                          {formatMoneySafe(ord.payment.amount)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-[#736B63]">{t('المتبقي عند الاستلام:', 'Remainder on Delivery:')}</span>
                                        <span className="font-bold font-mono text-emerald-700">{formatMoneySafe(0)}</span>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* FINANCIAL SUMMARY & CONCIERGE FOOTER */}
                          <div className="p-4 sm:p-5 bg-[#FAF8F5] border-t border-[#EAE4DC] flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                              {ord.subtotal && (
                                <div>
                                  <span className="text-[#736B63] block text-[11px]">{t('المجموع الفرعي', 'Subtotal')}</span>
                                  <span className="font-bold font-mono text-[#1C1A19]">{formatMoneySafe(ord.subtotal)}</span>
                                </div>
                              )}
                              {ord.discount_amount && Number(ord.discount_amount) > 0 && (
                                <div>
                                  <span className="text-emerald-700 block text-[11px]">{t('الخصم', 'Discount')}</span>
                                  <span className="font-bold font-mono text-emerald-700">-{formatMoneySafe(ord.discount_amount)}</span>
                                </div>
                              )}
                              {ord.shipping_amount !== undefined && ord.shipping_amount !== null && (
                                <div>
                                  <span className="text-[#736B63] block text-[11px]">
                                    {t('الشحن', 'Shipping')}
                                    {ord.shipping_governorate_name_ar ? ` (${ord.shipping_governorate_name_ar})` : ''}
                                  </span>
                                  <span className="font-bold font-mono text-[#1C1A19]">
                                    {Number(ord.shipping_amount) === 0 ? t('مجاني', 'Free') : formatMoneySafe(ord.shipping_amount)}
                                  </span>
                                </div>
                              )}
                              <div className="pe-4 border-e border-[#EAE4DC]">
                                <span className="text-[#643D26] font-bold block text-[11px] uppercase tracking-wider">
                                  {t('الإجمالي الكلي', 'Grand Total')}
                                </span>
                                <span className="text-base sm:text-lg font-black font-mono text-[#251811]">
                                  {formatMoneySafe(ord.total_price)}
                                </span>
                              </div>
                            </div>

                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F5F1EA] text-[#251811] border border-[#D8CEBF] text-xs font-bold transition-all shadow-2xs self-start md:self-auto shrink-0"
                            >
                              <MessageCircle className="w-4 h-4 text-[#25D366]" />
                              <span>{t('تواصل مع خدمة العملاء', 'Concierge Support')}</span>
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
