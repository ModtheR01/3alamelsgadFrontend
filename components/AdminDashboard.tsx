'use client';

import React, { useState, useRef } from 'react';
import { useToccoStore } from '@/lib/store';
import { toWhatsAppNumber } from '@/lib/utils';
import CategoriesManagement from '@/components/CategoriesManagement';
import UserManagement from '@/components/UserManagement';
import CloudinaryImageUploader from '@/components/CloudinaryImageUploader';
import CloudinaryImageField from '@/components/CloudinaryImageField';
import {
  Product,
  Category,
  Order,
  EventItem,
  ProjectItem,
  OrderStatus,
  PaymentStatus,
  ProductFinish,
  ProductColor,
  BannerItem,
} from '@/types';
import {
  Layers,
  Package,
  FolderTree,
  Calendar,
  Image as ImageIcon,
  Settings,
  MessageCircle,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  DollarSign,
  Eye,
  EyeOff,
  Star,
  RefreshCw,
  Phone,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Flame,
  Tag,
  Compass,
  AlertCircle,
  Loader2,
  Palette,
  Search,
  Users,
  FileText,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import { orderService } from '@/lib/api/services/orderService';
import { offerService } from '@/lib/api/services/offerService';
import { collaborationService } from '@/lib/api/services/collaborationService';
import { colorService } from '@/lib/api/services/colorService';
import CustomDesignRequestsManagement from '@/components/CustomDesignRequestsManagement';
import { BackendOrder, BackendOrderStatus } from '@/types/order';
import { BackendOffer, OfferCreateRequest, OfferProductRequest, OfferType } from '@/types/offer';
import { BackendCollaboration, CollaborationCreateRequest } from '@/types/collaboration';
import { BackendColor, ColorCreateRequest } from '@/types/product';
import { normalizeApiError } from '@/lib/api/errors';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonTableRows, SkeletonCardGrid, SkeletonListRows } from '@/components/DashboardSkeleton';

type OfferDraft = {
  id?: number;
  name: string;
  offer_type: OfferType;
  percentage: string;
  bundle_price: string;
  products: { product_id: string; quantity: string }[];
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

type CollaborationDraft = {
  id?: number;
  title: string;
  image: string;
  public_id: string;
};

type ColorDraft = {
  id?: number;
  name: string;
  hex_code: string;
};

const formatCurrency = (value: string | number | null | undefined) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount);
};

const toDateTimeInputValue = (value: string | null) => (value ? value.slice(0, 16) : '');

const toBackendDateTime = (value: string) => (value ? new Date(value).toISOString() : null);

const createNewProductDraft = (categories: Category[]): Product => ({
  id: `prod-${Date.now()}`,
  name: '',
  slug: `product-${Date.now()}`,
  categoryId: categories[0]?.id || 'cat-tables',
  subcategoryIds: [],
  description: '',
  price: 25000,
  images: [
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85',
  ],
  finishes: ['MATTE', 'GLOSSY'],
  colors: [],
  dimensions: '80 x 80 x 42 cm',
  deliveryDays: 21,
  height: '',
  material: 'Reinforced marine-grade fiberglass with UV-stable gelcoat',
  faq: [],
  leadTime: '21 days',
  shippingTime: '5–7 days white-glove delivery',
  isFeatured: false,
  isPublished: true,
  inStock: true,
  allowsCustomization: true,
  createdAt: new Date().toISOString(),
});

export default function AdminDashboard() {
  const {
    products,
    categories,
    subcategories,
    orders,
    events,
    projects,
    banners,
    settings,
    isCatalogLoading,
    isEventsLoading,
    isProjectsLoading,
    saveProduct,
    deleteProduct,
    toggleProductFeatured,
    saveCategory,
    deleteCategory,
    saveEvent,
    deleteEvent,
    saveProject,
    deleteProject,
    saveBanner,
    deleteBanner,
    toggleBannerActive,
    updateSettings,
    updateOrderStatus,
    updatePaymentStatus,
    navigateTo,
  } = useToccoStore();

  const [depositPercentageDraft, setDepositPercentageDraft] = useState({
    source: settings.depositPercentage,
    value: String(settings.depositPercentage),
  });
  const [instapayAddressDraft, setInstapayAddressDraft] = useState({
    source: settings.paymentMethods.instapay.address,
    value: settings.paymentMethods.instapay.address,
  });
  const [mobileWalletDraft, setMobileWalletDraft] = useState({
    source: settings.paymentMethods.mobileWallet.number,
    value: settings.paymentMethods.mobileWallet.number,
  });

  const depositPercentageValue =
    depositPercentageDraft.source === settings.depositPercentage
      ? depositPercentageDraft.value
      : String(settings.depositPercentage);
  const instapayAddressValue =
    instapayAddressDraft.source === settings.paymentMethods.instapay.address
      ? instapayAddressDraft.value
      : settings.paymentMethods.instapay.address;
  const mobileWalletValue =
    mobileWalletDraft.source === settings.paymentMethods.mobileWallet.number
      ? mobileWalletDraft.value
      : settings.paymentMethods.mobileWallet.number;

  const [activeTab, setActiveTab] = useState<
    | 'products'
    | 'banners'
    | 'categories'
    | 'orders'
    | 'events'
    | 'offers'
    | 'collaborations'
    | 'custom-requests'
    | 'projects'
    | 'colors'
    | 'users'
    | 'settings'
  >('products');

  // Banner Modal states
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const handleNewBanner = () => {
    setEditingBanner({
      id: `ban-${Date.now()}`,
      type: 'new_product',
      categoryLabel: 'New Release',
      badgeText: 'NEW RELEASE · 2026 EDITION',
      title: '',
      subtitle: '',
      tagHighlight: '',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      ctaText: 'Explore New Piece',
      actionType: 'navigate',
      targetView: 'shop',
      targetId: '',
      promoCode: '',
      isActive: true,
      displayOrder: banners.length + 1,
    });
    setIsBannerModalOpen(true);
  };

  // Real Backend Orders Management State
  const [backendOrders, setBackendOrders] = useState<BackendOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const [offers, setOffers] = useState<BackendOffer[]>([]);
  const [collaborations, setCollaborations] = useState<BackendCollaboration[]>([]);
  const [colors, setColors] = useState<BackendColor[]>([]);
  const [isOffersLoading, setIsOffersLoading] = useState(true);
  const [isCollaborationsLoading, setIsCollaborationsLoading] = useState(true);
  const [isColorsLoading, setIsColorsLoading] = useState(true);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [collaborationsError, setCollaborationsError] = useState<string | null>(null);
  const [colorsError, setColorsError] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<OfferDraft | null>(null);
  const [editingCollaboration, setEditingCollaboration] = useState<CollaborationDraft | null>(null);
  const [editingColor, setEditingColor] = useState<ColorDraft | null>(null);
  const [isOfferSaving, setIsOfferSaving] = useState(false);
  const [isCollaborationSaving, setIsCollaborationSaving] = useState(false);
  const [isColorSaving, setIsColorSaving] = useState(false);
  const [deletingOfferId, setDeletingOfferId] = useState<number | null>(null);
  const [deletingCollaborationId, setDeletingCollaborationId] = useState<number | null>(null);
  const [deletingColorId, setDeletingColorId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const requestDeleteConfirmation = (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>
  ) => {
    setPendingDelete({ title, description, onConfirm });
  };

  const handlePendingDelete = async () => {
    if (!pendingDelete || isDeleteProcessing) return;
    setIsDeleteProcessing(true);
    try {
      await pendingDelete.onConfirm();
      setPendingDelete(null);
    } catch (err) {
      setDashboardError(normalizeApiError(err).message);
    } finally {
      setIsDeleteProcessing(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDashboardError(null);
    try {
      await deleteProduct(productId);
    } catch (err) {
      setDashboardError(normalizeApiError(err).message);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !editingProduct.name.trim()) return;
    setDashboardError(null);
    try {
      await saveProduct(editingProduct);
      setIsProductModalOpen(false);
    } catch (err) {
      setDashboardError(normalizeApiError(err).message);
    }
  };

  React.useEffect(() => {
    let active = true;

    offerService
      .getOffers()
      .then((data) => {
        if (active) setOffers(data);
      })
      .catch((err) => {
        if (active) setOffersError(normalizeApiError(err).message);
      })
      .finally(() => {
        if (active) setIsOffersLoading(false);
      });

    collaborationService
      .getCollaborations()
      .then((data) => {
        if (active) setCollaborations(data);
      })
      .catch((err) => {
        if (active) setCollaborationsError(normalizeApiError(err).message);
      })
      .finally(() => {
        if (active) setIsCollaborationsLoading(false);
      });

    colorService
      .getColors()
      .then((data) => {
        if (active) setColors(data);
      })
      .catch((err) => {
        if (active) setColorsError(normalizeApiError(err).message);
      })
      .finally(() => {
        if (active) setIsColorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const fetchBackendOrders = React.useCallback(async (search?: string) => {
    setIsOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await orderService.getAllOrders(search ? { search } : undefined);
      setBackendOrders(data);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setOrdersError(normalized.message);
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  // Load immediately on mount, then debounce reloads as the search box changes.
  const didMountOrders = useRef(false);
  React.useEffect(() => {
    const query = orderSearchQuery.trim();
    if (!didMountOrders.current) {
      didMountOrders.current = true;
      fetchBackendOrders(query);
      return;
    }
    const handle = setTimeout(() => fetchBackendOrders(query), 350);
    return () => clearTimeout(handle);
  }, [orderSearchQuery, fetchBackendOrders]);

  const handleUpdateOrderStatus = async (orderId: number, newStatus: BackendOrderStatus) => {
    setUpdatingOrderId(orderId);
    setOrdersError(null);
    setStatusUpdateSuccess(null);
    try {
      const updated = await orderService.updateOrderStatus(orderId, { status: newStatus });
      setBackendOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setStatusUpdateSuccess(`Order #${updated.order_number} status updated to ${newStatus}`);
      setTimeout(() => setStatusUpdateSuccess(null), 4000);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setOrdersError(normalized.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const createOfferDraft = (offer?: BackendOffer): OfferDraft => ({
    id: offer?.id,
    name: offer?.name || '',
    offer_type: offer?.offer_type || 'PERCENTAGE',
    percentage: offer?.percentage != null ? String(offer.percentage) : '',
    bundle_price: offer?.bundle_price != null ? String(offer.bundle_price) : '',
    products: Array.isArray(offer?.products) && offer.products.length > 0
      ? offer.products.map((item) => ({
          product_id: String(item.product_id),
          quantity: String(item.quantity),
        }))
      : [{ product_id: products[0]?.id || '', quantity: '1' }],
    starts_at: toDateTimeInputValue(offer?.starts_at || null),
    ends_at: toDateTimeInputValue(offer?.ends_at || null),
    is_active: offer?.is_active ?? true,
  });

  const createCollaborationDraft = (collaboration?: BackendCollaboration): CollaborationDraft => ({
    id: collaboration?.id,
    title: collaboration?.title || '',
    image: collaboration?.image || '',
    public_id: collaboration?.public_id || '',
  });

  const buildOfferPayload = (draft: OfferDraft): OfferCreateRequest => {
    const selectedProducts: OfferProductRequest[] = draft.products
      .map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity || 1),
      }))
      .filter((item) => Number.isInteger(item.product_id) && item.product_id > 0 && item.quantity > 0);

    if (!draft.name.trim()) throw new Error('Offer name is required.');
    if (!selectedProducts.length) throw new Error('Select at least one backend product for this offer.');
    if (draft.offer_type === 'PERCENTAGE' && Number(draft.percentage) <= 0) {
      throw new Error('Add a valid percentage for this offer.');
    }
    if (draft.offer_type === 'BUNDLE' && Number(draft.bundle_price) <= 0) {
      throw new Error('Add a valid bundle price for this offer.');
    }

    return {
      name: draft.name.trim(),
      offer_type: draft.offer_type,
      percentage: draft.offer_type === 'PERCENTAGE' ? Number(draft.percentage) : null,
      bundle_price: draft.offer_type === 'BUNDLE' ? Number(draft.bundle_price) : null,
      products: selectedProducts,
      starts_at: toBackendDateTime(draft.starts_at),
      ends_at: toBackendDateTime(draft.ends_at),
      is_active: draft.is_active,
    };
  };

  const handleSaveOffer = async () => {
    if (!editingOffer) return;
    setIsOfferSaving(true);
    setOffersError(null);
    try {
      const payload = buildOfferPayload(editingOffer);
      const saved = editingOffer.id
        ? await offerService.updateOffer(editingOffer.id, payload)
        : await offerService.createOffer(payload);
      setOffers((prev) => {
        const exists = prev.some((offer) => offer.id === saved.id);
        return exists ? prev.map((offer) => (offer.id === saved.id ? saved : offer)) : [saved, ...prev];
      });
      setEditingOffer(null);
    } catch (err) {
      setOffersError(normalizeApiError(err).message);
    } finally {
      setIsOfferSaving(false);
    }
  };

  const handleDeleteOffer = async (offer: BackendOffer) => {
    setDeletingOfferId(offer.id);
    setOffersError(null);
    try {
      await offerService.deleteOffer(offer.id);
      setOffers((prev) => prev.filter((item) => item.id !== offer.id));
    } catch (err) {
      setOffersError(normalizeApiError(err).message);
    } finally {
      setDeletingOfferId(null);
    }
  };

  const handleSaveCollaboration = async () => {
    if (!editingCollaboration) return;
    setIsCollaborationSaving(true);
    setCollaborationsError(null);
    try {
      if (!editingCollaboration.title.trim()) throw new Error('Collaboration title is required.');
      if (!editingCollaboration.image || !editingCollaboration.public_id) {
        throw new Error('Upload the collaboration image before saving.');
      }
      const payload: CollaborationCreateRequest = {
        title: editingCollaboration.title.trim(),
        image: editingCollaboration.image,
        public_id: editingCollaboration.public_id,
      };
      const saved = await collaborationService.createCollaboration(payload);
      setCollaborations((prev) => [saved, ...prev]);
      setEditingCollaboration(null);
    } catch (err) {
      setCollaborationsError(normalizeApiError(err).message);
    } finally {
      setIsCollaborationSaving(false);
    }
  };

  const handleDeleteCollaboration = async (collaboration: BackendCollaboration) => {
    setDeletingCollaborationId(collaboration.id);
    setCollaborationsError(null);
    try {
      await collaborationService.deleteCollaboration(collaboration.id);
      setCollaborations((prev) => prev.filter((item) => item.id !== collaboration.id));
    } catch (err) {
      setCollaborationsError(normalizeApiError(err).message);
    } finally {
      setDeletingCollaborationId(null);
    }
  };

  const createColorDraft = (color?: BackendColor): ColorDraft => ({
    id: color?.id,
    name: color?.name || '',
    hex_code: color?.hex_code || '#EBE3D5',
  });

  const handleSaveColor = async () => {
    if (!editingColor) return;
    setIsColorSaving(true);
    setColorsError(null);
    try {
      if (!editingColor.name.trim()) throw new Error('Color name is required.');
      const payload: ColorCreateRequest = {
        name: editingColor.name.trim(),
        hex_code: editingColor.hex_code.trim(),
      };
      const saved = editingColor.id
        ? await colorService.updateColor(editingColor.id, payload)
        : await colorService.createColor(payload);
      setColors((prev) => {
        const exists = prev.some((color) => color.id === saved.id);
        return exists ? prev.map((color) => (color.id === saved.id ? saved : color)) : [saved, ...prev];
      });
      setEditingColor(null);
    } catch (err) {
      setColorsError(normalizeApiError(err).message);
    } finally {
      setIsColorSaving(false);
    }
  };

  const handleDeleteColor = async (color: BackendColor) => {
    setDeletingColorId(color.id);
    setColorsError(null);
    try {
      await colorService.deleteColor(color.id);
      setColors((prev) => prev.filter((item) => item.id !== color.id));
    } catch (err) {
      setColorsError(normalizeApiError(err).message);
    } finally {
      setDeletingColorId(null);
    }
  };

  const toggleProductColor = (color: BackendColor) => {
    if (!editingProduct) return;
    const colorIdStr = String(color.id);
    const exists = editingProduct.colors.some((c) => c.id === colorIdStr);
    const nextColors: ProductColor[] = exists
      ? editingProduct.colors.filter((c) => c.id !== colorIdStr)
      : [...editingProduct.colors, { id: colorIdStr, name: color.name, hex: color.hex_code }];
    setEditingProduct({ ...editingProduct, colors: nextColors });
  };

  // Product Modal / Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Category Modal states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Event Modal states
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventSaving, setIsEventSaving] = useState(false);
  const [eventSaveError, setEventSaveError] = useState<string | null>(null);

  // Project Modal states
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Helper to open new product
  const handleNewProduct = () => {
    setEditingProduct(createNewProductDraft(categories));
    setIsProductModalOpen(true);
  };

  // Helper to open new category
  const handleNewCategory = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      slug: `category-${Date.now()}`,
      description: '',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
      isFeatured: false,
      isVisible: true,
      displayOrder: categories.length + 1,
    });
    setIsCategoryModalOpen(true);
  };

  // Helper to open new event
  const handleNewEvent = () => {
    setEditingEvent({
      id: `ev-${Date.now()}`,
      title: '',
      location: 'Cairo Atelier',
      city: 'Cairo',
      date: '2026-05-01',
      description: '',
      coverImage: '',
      publicId: '',
      status: 'upcoming',
    });
    setEventSaveError(null);
    setIsEventModalOpen(true);
  };

  // Helper to open new project
  const handleNewProject = () => {
    setEditingProject({
      id: `proj-${Date.now()}`,
      title: '',
      subtitle: 'Tocco House Installation',
      location: '',
      year: String(new Date().getFullYear()),
      description: '',
      coverImage: '',
      gallery: [],
      productsUsed: [],
      customerName: '',
      publicId: '',
      productId: undefined,
    });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!editingProject || !editingProject.title.trim()) return;
    setDashboardError(null);
    try {
      await saveProject(editingProject);
      setIsProjectModalOpen(false);
    } catch (err) {
      setDashboardError(normalizeApiError(err).message);
    }
  };

  return (
    <div id="admin-studio-dashboard" className="pt-24 pb-24 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {dashboardError && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <span>{dashboardError}</span>
            <button
              type="button"
              onClick={() => setDashboardError(null)}
              className="text-rose-700 hover:text-rose-950"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Top Bar with Live Return link and reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE4DC]">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('home')}
                className="text-xs uppercase tracking-wider text-[#736B63] hover:text-[#1C1A19] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Live Store</span>
              </button>
            </div>
            <h1 className="text-3xl font-normal tracking-tight text-[#1C1A19] mt-2">
              Tocco House Atelier CMS Studio
            </h1>
            <p className="text-xs text-[#736B63]">
              Manage products, prices, deposit workflows, and content in real-time.
            </p>
          </div>

        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-[#EAE4DC] gap-1 overflow-x-auto pb-1 text-xs uppercase tracking-wider font-medium scrollbar-none">
          {[
            { key: 'products', label: `Products (${products.length})`, icon: Package },
            { key: 'orders', label: `Orders (${backendOrders.length})`, icon: DollarSign },
            { key: 'categories', label: 'Categories & Subcategories', icon: FolderTree },
            { key: 'events', label: `Events (${events.length})`, icon: Calendar },
            { key: 'offers', label: `Offers (${offers.length})`, icon: Tag },
            { key: 'collaborations', label: `Collaborations (${collaborations.length})`, icon: Compass },
            { key: 'custom-requests', label: 'Custom Requests', icon: FileText },
            { key: 'projects', label: `In Their Space (${projects.length})`, icon: ImageIcon },
            { key: 'colors', label: `Colors (${colors.length})`, icon: Palette },
            { key: 'users', label: 'Users & Roles', icon: Users },
            { key: 'settings', label: 'Store & Deposit Settings', icon: Settings },
          ].map((t) => {
            const Icon = t.icon;
            const isCurrent = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-[#1C1A19] text-white shadow-xs'
                    : 'text-[#524B45] hover:bg-[#EFEBE3]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'custom-requests' && <CustomDesignRequestsManagement />}

        {/* ----------------- TAB 1: PRODUCTS ----------------- */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
                  Design Catalogue Archive
                </h3>
                <p className="text-xs text-[#736B63]">
                  Configure product details, price, and color swatches.
                </p>
              </div>
              <button
                onClick={handleNewProduct}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D] shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Piece</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE4DC] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#EAE4DC] text-[#736B63] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Piece</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price / {settings.depositPercentage}% Deposit</th>
                      <th className="py-3 px-4">Finishes</th>
                      <th className="py-3 px-4">Featured</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  {isCatalogLoading ? (
                    <SkeletonTableRows rows={5} columns={6} />
                  ) : (
                  <tbody className="divide-y divide-[#EAE4DC]">
                    {products.map((p) => {
                      const cat = categories.find((c) => c.id === p.categoryId);

                      return (
                        <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#EFEBE3] shrink-0 border border-[#E0D8CB]">
                                <Image
                                  src={p.images[0]}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <span className="font-medium text-[#1C1A19] block">{p.name}</span>
                                <span className="text-[10px] text-[#8F8880] font-mono">{p.slug}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-[#524B45]">{cat?.name || '—'}</td>

                          <td className="py-3 px-4">
                            <div>
                              <span className="font-semibold text-[#1C1A19]">
                                {p.price?.toLocaleString()} EGP
                              </span>
                              <span className="text-[10px] text-[#736B63] block">
                                Deposit: {Math.round((p.price || 0) * settings.depositPercentage / 100).toLocaleString()} EGP
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-[#736B63]">
                            {p.finishes.join(', ')}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleProductFeatured(p.id)}
                              className={`p-1 rounded-md ${
                                p.isFeatured ? 'text-[#B85D38]' : 'text-[#D8CEBF] hover:text-[#736B63]'
                              }`}
                              title="Toggle Featured on Homepage"
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 text-[#524B45] hover:text-[#1C1A19]"
                              title="Edit Piece"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => requestDeleteConfirmation(
                                `Delete Piece: "${p.name}"`,
                                'This action permanently removes the piece from the catalogue and cannot be undone.',
                                () => { void handleDeleteProduct(p.id); }
                              )}
                              className="p-1.5 text-[#B85D38] hover:text-red-700"
                              title="Delete Piece"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: BANNERS & HIGHLIGHTS ----------------- */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
                  Atelier Highlights & Banners
                </h3>
                <p className="text-xs text-[#736B63]">
                  Manage mobile-first carousel banners for new arrivals, exclusive promotions, upcoming events, and bespoke commissions.
                </p>
              </div>
              <button
                id="admin-add-banner-btn"
                onClick={handleNewBanner}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D] shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Banner</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE4DC] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#EAE4DC] text-[#736B63] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Banner</th>
                      <th className="py-3 px-4">Category & Badge</th>
                      <th className="py-3 px-4">Highlight Pill / Code</th>
                      <th className="py-3 px-4">Target Action</th>
                      <th className="py-3 px-4">Active</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE4DC]">
                    {banners.map((b) => {
                      return (
                        <tr key={b.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#1C1A19] shrink-0 border border-[#E0D8CB]">
                                <Image
                                  src={b.image}
                                  alt={b.title}
                                  fill
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="max-w-xs">
                                <span className="font-medium text-[#1C1A19] block truncate">
                                  {b.title}
                                </span>
                                <span className="text-[11px] text-[#736B63] line-clamp-1">
                                  {b.subtitle}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-full bg-[#EFEBE3] text-[#524B45] text-[10px] font-semibold uppercase tracking-wider">
                              {b.categoryLabel}
                            </span>
                            <span className="block text-[10px] text-[#8E867D] mt-0.5">
                              {b.badgeText}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {b.tagHighlight ? (
                              <span className="inline-block px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[11px]">
                                {b.tagHighlight}
                              </span>
                            ) : (
                              <span className="text-[#8E867D]">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[#524B45]">
                            <span className="capitalize">{b.actionType === 'copy_code' ? 'Copy Code' : `Go to ${b.targetView || 'link'}`}</span>
                            <span className="block text-[10px] text-[#8E867D]">{b.ctaText}</span>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleBannerActive(b.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-colors ${
                                b.isActive
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                              }`}
                            >
                              {b.isActive ? 'Live' : 'Hidden'}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingBanner(b);
                                setIsBannerModalOpen(true);
                              }}
                              className="p-1.5 text-[#524B45] hover:text-[#1C1A19]"
                              title="Edit Banner"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => requestDeleteConfirmation(
                                `Delete Banner: "${b.title}"`,
                                'This action permanently removes the banner and cannot be undone.',
                                () => deleteBanner(b.id)
                              )}
                              className="p-1.5 text-[#B85D38] hover:text-red-700"
                              title="Delete Banner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: ORDERS ----------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
                  Customer Orders & Real-time Atelier Status
                </h3>
                <p className="text-xs text-[#736B63]">
                  Authoritative backend orders registry: confirm commissions, inspect deliveries, and advance orders into production.
                </p>
              </div>

              <button
                onClick={() => fetchBackendOrders(orderSearchQuery.trim())}
                disabled={isOrdersLoading}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-full border border-[#D8CEBF] text-xs text-[#524B45] hover:text-[#1C1A19] hover:border-[#1C1A19] flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isOrdersLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Orders</span>
              </button>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-[#8F8880] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by order number, customer name, email, phone, or status"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-lg border border-[#D8CEBF] bg-white text-xs font-mono text-[#1C1A19] placeholder:font-sans placeholder:text-[#8F8880] focus:outline-none focus:border-[#1C1A19]"
              />
              {orderSearchQuery && (
                <button
                  onClick={() => setOrderSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8F8880] hover:text-[#1C1A19]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {statusUpdateSuccess && (
              <div className="p-4 rounded-xl bg-[#EBF5EE] border border-[#C5E5D0] text-[#1E6B3A] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1E6B3A] shrink-0" />
                <span>{statusUpdateSuccess}</span>
              </div>
            )}

            {ordersError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{ordersError}</span>
                </div>
                <button
                  onClick={() => fetchBackendOrders(orderSearchQuery.trim())}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-800 font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {isOrdersLoading ? (
              <SkeletonListRows count={4} />
            ) : backendOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#EAE4DC] text-xs text-[#736B63] space-y-2">
                {orderSearchQuery.trim() ? (
                  <>
                    <p>No orders match &ldquo;{orderSearchQuery}&rdquo;.</p>
                    <button
                      onClick={() => setOrderSearchQuery('')}
                      className="text-[#643D26] underline underline-offset-2"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <p>No customer orders placed yet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {backendOrders.map((ord) => {
                  const deposit = Number(ord.deposit_amount);
                  const isUpdating = updatingOrderId === ord.id;
                  const clientWhatsAppNumber = toWhatsAppNumber(ord.user?.phone);
                  const whatsappUrl = `https://wa.me/${clientWhatsAppNumber}?text=${encodeURIComponent(
                    `Hello, this is Tocco House Atelier regarding Order #${ord.order_number}.`
                  )}`;

                  return (
                    <div
                      key={ord.id}
                      className="p-6 rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE4DC] gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-[#1C1A19]">
                            Order #{ord.order_number}
                          </span>
                          <span className="text-xs text-[#736B63] ml-2">
                            · {new Date(ord.created_at).toLocaleString('en-GB')}
                          </span>
                        </div>

                        {/* Status Pickers */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[#736B63]">Status:</span>
                            <select
                              value={ord.status}
                              disabled={isUpdating}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as BackendOrderStatus)}
                              className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] focus:outline-none disabled:opacity-50"
                            >
                              <option value="NOT_CONFIRMED">Not Confirmed (Pending)</option>
                              <option value="CONFIRMED">Confirmed (In Production)</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                            {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#643D26]" />}
                          </div>
                        </div>
                      </div>

                      {/* Customer & Address Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#524B45]">
                        <div>
                          <span className="font-semibold text-[#1C1A19] block">Residence & Recipient:</span>
                          <p className="font-medium text-[#1C1A19]">{ord.shipping_address?.title || 'Private Residence'}</p>
                          <p className="text-[#736B63]">
                            {ord.user ? `${ord.user.first_name} ${ord.user.last_name}`.trim() || ord.user.email : 'Unknown customer'}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-[#1C1A19] block">Delivery Destination:</span>
                          {ord.shipping_address ? (
                            <>
                              <p>
                                {ord.shipping_address.building_number ? `Bldg ${ord.shipping_address.building_number}, ` : ''}
                                {ord.shipping_address.street}
                              </p>
                              <p>
                                {ord.shipping_address.apartment_number ? `Apt ${ord.shipping_address.apartment_number}, ` : ''}
                                {ord.shipping_address.city}, {ord.shipping_address.country}
                              </p>
                            </>
                          ) : (
                            <p className="text-[#8F8880]">No address record attached</p>
                          )}
                        </div>

                        <div>
                          <span className="font-semibold text-[#1C1A19] block">{Number(ord.deposit_percentage)}% Handcrafted Deposit:</span>
                          <p className="text-[#643D26] font-semibold text-sm font-mono">
                            {deposit.toLocaleString()} EGP
                          </p>
                          <p className="text-[#736B63] font-mono">
                            Total: {Number(ord.total_price).toLocaleString()} EGP
                          </p>
                        </div>
                      </div>

                      {ord.customer_notes && (
                        <div className="text-xs text-[#524B45] bg-[#FAF8F5] border border-[#EAE4DC] rounded-xl p-3">
                          <span className="font-semibold text-[#1C1A19] block mb-0.5">Customer Notes:</span>
                          <p>{ord.customer_notes}</p>
                        </div>
                      )}

                      {/* Items List */}
                      <div className="pt-2 border-t border-[#EAE4DC] flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          {ord.items.map((it) => (
                            <div
                              key={it.id}
                              className="inline-flex items-center gap-2 mr-4 text-xs text-[#1C1A19] font-medium"
                            >
                              {it.color_hex_code && (
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: it.color_hex_code }}
                                  title={it.color_name || undefined}
                                />
                              )}
                              <span>
                                {it.product_name}
                                {it.color_name ? ` (${it.color_name})` : ''} x{it.quantity}
                              </span>
                              <span className="font-mono text-[#736B63]">
                                · {Number(it.subtotal).toLocaleString()} EGP
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {ord.status === 'NOT_CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'CONFIRMED')}
                              disabled={isUpdating}
                              className="px-3 py-1.5 rounded-lg bg-[#D1E7DD] text-[#0F5132] text-xs font-semibold hover:bg-[#C3E6CB] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>Confirm Order</span>
                            </button>
                          )}

                          {clientWhatsAppNumber ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-[#2A2624] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#3E3835] transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                              <span>WhatsApp Client</span>
                            </a>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg bg-[#EFEBE3] text-[#8F8880] text-xs font-medium">
                              No Client Phone
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 4: CATEGORIES & SUBCATEGORIES ----------------- */}
        {activeTab === 'categories' && (
          <CategoriesManagement />
        )}

        {/* ----------------- USERS & ROLES ----------------- */}
        {activeTab === 'users' && (
          <UserManagement />
        )}

        {/* ----------------- TAB 6: EVENTS ----------------- */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
                  Exhibitions & Showcases
                </h3>
                <p className="text-xs text-[#736B63]">
                  Manage presence at Cairo Design Week, pop-ups, and atelier salon viewings.
                </p>
              </div>
              <button
                onClick={handleNewEvent}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>

            {isEventsLoading ? (
              <SkeletonCardGrid count={3} imageAspectClassName="aspect-[16/9]" />
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4"
                >
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#EFEBE3]">
                    <Image
                      src={ev.coverImage}
                      alt={ev.title}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/90 text-[10px] uppercase font-semibold text-[#1C1A19]">
                      {ev.isUpcoming ? 'Upcoming' : 'Past'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[#B85D38] font-mono block">
                      {ev.date} · {ev.location}
                    </span>
                    <h4 className="text-base font-semibold text-[#1C1A19]">{ev.title}</h4>
                    <p className="text-xs text-[#736B63] line-clamp-2">{ev.description}</p>
                  </div>

                  <div className="pt-2 border-t border-[#EAE4DC] flex justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditingEvent(ev);
                        setEventSaveError(null);
                        setIsEventModalOpen(true);
                      }}
                      className="p-1.5 text-[#524B45] hover:text-[#1C1A19]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => requestDeleteConfirmation(
                        `Delete Event: "${ev.title}"`,
                        'This action permanently removes the event and cannot be undone.',
                        () => deleteEvent(ev.id)
                      )}
                      className="p-1.5 text-[#B85D38] hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 7: PROJECTS ----------------- */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
                  In Their Space (Architectural Portfolio)
                </h3>
                <p className="text-xs text-[#736B63]">
                  Showcase real residential and hospitality installations.
                </p>
              </div>
              <button
                onClick={handleNewProject}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            {isProjectsLoading ? (
              <SkeletonCardGrid count={3} imageAspectClassName="aspect-[16/9]" />
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4"
                >
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#EFEBE3]">
                    <Image
                      src={proj.coverImage}
                      alt={proj.title}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#B85D38] font-semibold">
                      {proj.subtitle} · {proj.location}
                    </span>
                    <h4 className="text-base font-semibold text-[#1C1A19]">{proj.title}</h4>
                    <p className="text-xs text-[#736B63] line-clamp-2">{proj.description}</p>
                  </div>

                  <div className="pt-2 border-t border-[#EAE4DC] flex justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditingProject(proj);
                        setIsProjectModalOpen(true);
                      }}
                      className="p-1.5 text-[#524B45] hover:text-[#1C1A19]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => requestDeleteConfirmation(
                        `Delete Project: "${proj.title}"`,
                        'This action permanently removes the project and cannot be undone.',
                        () => deleteProject(proj.id)
                      )}
                      className="p-1.5 text-[#B85D38] hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 8: OFFERS ----------------- */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
                  Atelier Offers
                </h3>
                <p className="text-xs text-[#736B63]">
                  Build percentage privileges, bundles, and free-shipping moments from catalogue products.
                </p>
              </div>
              <button
                onClick={() => setEditingOffer(createOfferDraft())}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Offer</span>
              </button>
            </div>

            {offersError && (
              <div className="flex items-start gap-2 rounded-2xl border border-[#E2B6A2] bg-[#FFF5F0] px-4 py-3 text-xs text-[#8A3D25]">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{offersError}</span>
              </div>
            )}

            {isOffersLoading ? (
              <SkeletonCardGrid count={4} columnsClassName="grid-cols-1 lg:grid-cols-2" showImage={false} />
            ) : offers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8CEBF] bg-white p-8 text-center">
                <p className="text-sm text-[#1C1A19]">No offers are configured yet.</p>
                <p className="text-xs text-[#736B63] mt-1">Create the first offer and it will be ready for customers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {offers.map((offer) => (
                  <div key={offer.id} className="rounded-2xl bg-white border border-[#EAE4DC] shadow-sm p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-widest text-[#B85D38] font-semibold">
                            {offer.offer_type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${offer.is_active ? 'bg-[#EAF4EA] text-[#2F6B3F]' : 'bg-[#EFEBE3] text-[#736B63]'}`}>
                            {offer.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-[#1C1A19]">{offer.name}</h4>
                        <p className="text-xs text-[#736B63]">
                          {Array.isArray(offer.products) ? offer.products.length : 0} product{Array.isArray(offer.products) && offer.products.length === 1 ? '' : 's'} · {formatCurrency(offer.offer_price)} offer price
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditingOffer(createOfferDraft(offer))}
                          className="p-2 rounded-full text-[#524B45] hover:bg-[#FAF8F5] hover:text-[#1C1A19]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => requestDeleteConfirmation(
                            `Delete Offer: "${offer.name}"`,
                            'This action permanently removes the offer and cannot be undone.',
                            () => { void handleDeleteOffer(offer); }
                          )}
                          disabled={deletingOfferId === offer.id}
                          className="p-2 rounded-full text-[#B85D38] hover:bg-[#FFF5F0] disabled:opacity-60"
                        >
                          {deletingOfferId === offer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-[#FAF8F5] p-3 min-w-0">
                        <span className="block text-[#8F8880]">Original</span>
                        <span className="font-mono text-[#1C1A19] break-words">{formatCurrency(offer.original_price)}</span>
                      </div>
                      <div className="rounded-xl bg-[#FAF8F5] p-3 min-w-0">
                        <span className="block text-[#8F8880]">Discount</span>
                        <span className="font-mono text-[#1C1A19] break-words">{formatCurrency(offer.discount_amount)}</span>
                      </div>
                      <div className="rounded-xl bg-[#FAF8F5] p-3 min-w-0">
                        <span className="block text-[#8F8880]">Final</span>
                        <span className="font-mono text-[#1C1A19] break-words">{formatCurrency(offer.offer_price)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {offer.products.map((item) => (
                        <div key={`${offer.id}-${item.product_id}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#EAE4DC] px-3 py-2 text-xs">
                          <span className="text-[#1C1A19] line-clamp-1">{item.product_name}</span>
                          <span className="font-mono text-[#736B63] shrink-0">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 9: COLLABORATIONS ----------------- */}
        {activeTab === 'collaborations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
                  Collaborations
                </h3>
                <p className="text-xs text-[#736B63]">
                  Curate partner moments with uploaded images.
                </p>
              </div>
              <button
                onClick={() => setEditingCollaboration(createCollaborationDraft())}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Collaboration</span>
              </button>
            </div>

            {collaborationsError && (
              <div className="flex items-start gap-2 rounded-2xl border border-[#E2B6A2] bg-[#FFF5F0] px-4 py-3 text-xs text-[#8A3D25]">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{collaborationsError}</span>
              </div>
            )}

            {isCollaborationsLoading ? (
              <SkeletonCardGrid count={6} imageAspectClassName="aspect-[4/3]" />
            ) : collaborations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8CEBF] bg-white p-8 text-center">
                <p className="text-sm text-[#1C1A19]">No collaborations have been published yet.</p>
                <p className="text-xs text-[#736B63] mt-1">Upload a Cloudinary image to save the first collaboration.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaborations.map((collaboration) => (
                  <div key={collaboration.id} className="rounded-2xl bg-white border border-[#EAE4DC] shadow-sm overflow-hidden">
                    <div className="relative aspect-[4/3] bg-[#EFEBE3]">
                      <Image
                        src={collaboration.image}
                        alt={collaboration.title}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-5 space-y-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#B85D38] font-semibold">Partner Feature</span>
                        <h4 className="text-base font-semibold text-[#1C1A19] mt-1">{collaboration.title}</h4>
                      </div>
                      <div className="pt-2 border-t border-[#EAE4DC] flex justify-end">
                        <button
                          onClick={() => requestDeleteConfirmation(
                            `Delete Collaboration: "${collaboration.title}"`,
                            'This action permanently removes the collaboration and cannot be undone.',
                            () => { void handleDeleteCollaboration(collaboration); }
                          )}
                          disabled={deletingCollaborationId === collaboration.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs uppercase tracking-wider text-[#B85D38] hover:bg-[#FFF5F0] disabled:opacity-60"
                        >
                          {deletingCollaborationId === collaboration.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: COLORS ----------------- */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
                  Colors
                </h3>
                <p className="text-xs text-[#736B63]">
                  Manage the swatch palette available for product color assignment.
                </p>
              </div>
              <button
                onClick={() => setEditingColor(createColorDraft())}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Color</span>
              </button>
            </div>

            {colorsError && (
              <div className="flex items-start gap-2 rounded-2xl border border-[#E2B6A2] bg-[#FFF5F0] px-4 py-3 text-xs text-[#8A3D25]">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{colorsError}</span>
              </div>
            )}

            {isColorsLoading ? (
              <SkeletonCardGrid count={6} columnsClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" showImage={false} />
            ) : colors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8CEBF] bg-white p-8 text-center">
                <p className="text-sm text-[#1C1A19]">No colors have been created yet.</p>
                <p className="text-xs text-[#736B63] mt-1">Add a color to make it available on product forms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {colors.map((color) => (
                  <div key={color.id} className="rounded-2xl bg-white border border-[#EAE4DC] shadow-sm p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-9 h-9 rounded-full border border-[#D8CEBF] shrink-0"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1C1A19] truncate">{color.name}</p>
                        <p className="text-[11px] font-mono text-[#736B63]">{color.hex_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingColor(createColorDraft(color))}
                        className="p-1.5 text-[#524B45] hover:text-[#1C1A19] hover:bg-[#EFEBE3] rounded-lg transition-colors"
                        title="Edit Color"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => requestDeleteConfirmation(
                          `Delete Color: "${color.name}"`,
                          'This action permanently removes the color and cannot be undone.',
                          () => { void handleDeleteColor(color); }
                        )}
                        disabled={deletingColorId === color.id}
                        className="p-1.5 text-[#B85D38] hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-60"
                        title="Delete Color"
                      >
                        {deletingColorId === color.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 10: SETTINGS & CMS ----------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-3xl">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
                Global Atelier & Payment Settings
              </h3>
              <p className="text-xs text-[#736B63]">
                Manage the deposit percentage and payment wallet details saved by the backend.
              </p>
            </div>

            {/* Deposit Configuration */}
            <div className="p-6 rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1C1A19]">
                Deposit Parameters
              </h4>
              <div className="text-xs">
                <div>
                  <label className="block text-[#736B63] mb-1">Handcrafted Deposit Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={depositPercentageValue}
                    onChange={(e) =>
                      setDepositPercentageDraft({ source: settings.depositPercentage, value: e.target.value })
                    }
                    onBlur={() => {
                      const value = Number(depositPercentageValue);
                      if (depositPercentageValue !== '' && Number.isFinite(value) && value >= 0 && value <= 100) {
                        updateSettings({ depositPercentage: value });
                      } else {
                        setDepositPercentageDraft({
                          source: settings.depositPercentage,
                          value: String(settings.depositPercentage),
                        });
                      }
                    }}
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods Configuration */}
            <div className="p-6 rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1C1A19]">
                Payment Wallets
              </h4>

              {/* InstaPay */}
              <div className="space-y-2 text-xs">
                <label className="block font-medium text-[#1C1A19]">InstaPay IPA / Address</label>
                <input
                  type="text"
                  value={instapayAddressValue}
                  onChange={(e) =>
                    setInstapayAddressDraft({
                      source: settings.paymentMethods.instapay.address,
                      value: e.target.value,
                    })
                  }
                  onBlur={() =>
                    updateSettings({
                      paymentMethods: {
                        ...settings.paymentMethods,
                        instapay: { ...settings.paymentMethods.instapay, address: instapayAddressValue },
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                />
              </div>

              {/* Mobile Wallet */}
              <div className="space-y-2 text-xs">
                <label className="block font-medium text-[#1C1A19]">Mobile Wallet (Vodafone / Orange / Etisalat / WE Pay)</label>
                <input
                  type="text"
                  value={mobileWalletValue}
                  onChange={(e) =>
                    setMobileWalletDraft({
                      source: settings.paymentMethods.mobileWallet.number,
                      value: e.target.value,
                    })
                  }
                  onBlur={() =>
                    updateSettings({
                      paymentMethods: {
                        ...settings.paymentMethods,
                        mobileWallet: {
                          ...settings.paymentMethods.mobileWallet,
                          number: mobileWalletValue,
                        },
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                />
              </div>

            </div>
          </div>
        )}

        {/* ----------------- MODAL: EDIT PRODUCT ----------------- */}
        {isProductModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 border border-[#EAE4DC] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-[#EAE4DC]">
                <h3 className="text-lg font-medium text-[#1C1A19]">
                  {editingProduct.name ? `Edit: ${editingProduct.name}` : 'Create New Design Piece'}
                </h3>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Piece Title *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          name: e.target.value,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        })
                      }
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Category</label>
                    <select
                      value={editingProduct.categoryId}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4DC]">
                  <label className="block text-[#1C1A19] font-medium mb-1">Price (EGP)</label>
                  <input
                    type="number"
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#1C1A19] font-medium mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[#1C1A19] font-medium">Dimensions / Available Widths</label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 80 cm or 60, 80, 100, 120 cm"
                      value={editingProduct.dimensions}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nums = (val.match(/\d+(\.\d+)?/g) || []).map(Number).filter((n) => n >= 30 && n <= 500);
                        const unique = Array.from(new Set(nums)).sort((a, b) => a - b);
                        setEditingProduct({
                          ...editingProduct,
                          dimensions: val,
                          availableWidths: unique.length > 0 ? unique : undefined,
                        });
                      }}
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono text-sm"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-[#7A6E65]">Roll width (cm):</span>
                      {[60, 80, 100, 120, 140, 160].map((preset) => {
                        const curNums = (editingProduct.dimensions.match(/\d+(\.\d+)?/g) || []).map(Number);
                        const isIncluded = curNums.includes(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              let nextNums: number[];
                              if (isIncluded) {
                                nextNums = curNums.filter((n) => n !== preset);
                              } else {
                                nextNums = [...curNums, preset].sort((a, b) => a - b);
                              }
                              const nextDims = nextNums.length > 0 ? nextNums.map((n) => `${n} سم`).join('، ') : '';
                              setEditingProduct({
                                ...editingProduct,
                                dimensions: nextDims,
                                availableWidths: nextNums.length > 0 ? nextNums : undefined,
                              });
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition-all font-medium ${
                              isIncluded
                                ? 'bg-[#1C1A19] text-white border-[#1C1A19]'
                                : 'bg-white text-[#524B45] border-[#D8CEBF] hover:border-[#1C1A19]'
                            }`}
                          >
                            {isIncluded ? `✓ ${preset}` : `+ ${preset}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Delivery Days</label>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.deliveryDays ?? ''}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setEditingProduct({
                          ...editingProduct,
                          deliveryDays: nextValue === '' ? null : Number(nextValue),
                          leadTime: nextValue === '' ? '' : `${Number(nextValue)} days`,
                        });
                      }}
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Material</label>
                    <input
                      type="text"
                      value={editingProduct.material}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, material: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Finish</label>
                    <div className="flex gap-2 p-2.5 rounded-lg border border-[#D8CEBF] bg-white">
                      {(['MATTE', 'GLOSSY'] as ProductFinish[]).map((finish) => {
                        const checked = editingProduct.finishes.includes(finish);
                        return (
                          <label key={finish} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setEditingProduct({
                                  ...editingProduct,
                                  finishes: checked
                                    ? editingProduct.finishes.filter((item) => item !== finish)
                                    : [...editingProduct.finishes, finish],
                                })
                              }
                              className="rounded border-[#D8CEBF]"
                            />
                            <span>{finish === 'MATTE' ? 'Matte' : 'Glossy'}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[#1C1A19] font-medium mb-1">Subcategories *</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-[#D8CEBF] bg-[#FAF8F5] max-h-32 overflow-y-auto">
                    {subcategories.length === 0 ? (
                      <p className="text-[#8F8880]">No subcategories available yet.</p>
                    ) : (
                      subcategories.map((sub) => {
                        const subId = String(sub.id);
                        const checked = editingProduct.subcategoryIds.includes(subId);
                        const parentCategory = categories.find((c) => c.id === String(sub.category_id));
                        return (
                          <label
                            key={sub.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] cursor-pointer ${
                              checked ? 'bg-[#1C1A19] text-white border-[#1C1A19]' : 'bg-white border-[#D8CEBF] text-[#524B45]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setEditingProduct({
                                  ...editingProduct,
                                  subcategoryIds: checked
                                    ? editingProduct.subcategoryIds.filter((id) => id !== subId)
                                    : [...editingProduct.subcategoryIds, subId],
                                })
                              }
                              className="hidden"
                            />
                            <span>{parentCategory ? `${parentCategory.name} · ${sub.name}` : sub.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[#1C1A19] font-medium mb-1">Colors</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-[#D8CEBF] bg-[#FAF8F5] max-h-32 overflow-y-auto">
                    {colors.length === 0 ? (
                      <p className="text-[#8F8880]">
                        No colors available yet. Add one from the Colors tab.
                      </p>
                    ) : (
                      colors.map((color) => {
                        const checked = editingProduct.colors.some((c) => c.id === String(color.id));
                        return (
                          <label
                            key={color.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] cursor-pointer ${
                              checked ? 'bg-[#1C1A19] text-white border-[#1C1A19]' : 'bg-white border-[#D8CEBF] text-[#524B45]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProductColor(color)}
                              className="hidden"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: color.hex_code }}
                            />
                            <span>{color.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Direct Cloudinary Image Uploader & Gallery */}
                <div className="pt-2">
                  <CloudinaryImageUploader
                    productId={editingProduct.id}
                    images={editingProduct.images || []}
                    onImagesChange={(newImages) =>
                      setEditingProduct({
                        ...editingProduct,
                        images: newImages,
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isFeatured}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                      }
                      className="rounded border-[#D8CEBF]"
                    />
                    <span>Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAE4DC] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { void handleSaveProduct(); }}
                  className="px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium"
                >
                  Save Piece
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: EDIT CATEGORY ----------------- */}
        {isCategoryModalOpen && editingCategory && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EAE4DC] shadow-xl">
              <h3 className="text-base font-medium text-[#1C1A19]">Category Details</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#1C1A19] mb-1">Category Name</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>
                <div>
                  <label className="block text-[#1C1A19] mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingCategory.description}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, description: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>
                <CloudinaryImageField
                  label="Cover Image"
                  value={editingCategory.image}
                  folder="tocco/categories"
                  onChange={(image) => setEditingCategory({ ...editingCategory, image })}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingCategory.name.trim()) {
                      saveCategory(editingCategory);
                      setIsCategoryModalOpen(false);
                    }
                  }}
                  className="px-5 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: EDIT EVENT ----------------- */}
        {isEventModalOpen && editingEvent && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setEventSaveError(null);
                if (!editingEvent.title.trim()) {
                  setEventSaveError('Please add an event title.');
                  return;
                }
                if (!editingEvent.date) {
                  setEventSaveError('Please choose the event date.');
                  return;
                }
                if (!editingEvent.coverImage || !editingEvent.publicId) {
                  setEventSaveError('Please upload a cover image before saving.');
                  return;
                }

                setIsEventSaving(true);
                try {
                  await saveEvent(editingEvent);
                  setIsEventModalOpen(false);
                } catch (err) {
                  setEventSaveError(normalizeApiError(err).message);
                } finally {
                  setIsEventSaving(false);
                }
              }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 my-8 border border-[#EAE4DC] shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 space-y-1">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-[#1C1A19]">
                    {Number.isInteger(Number(editingEvent.id)) ? 'Edit Event' : 'Add New Event'}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#736B63]">
                    Fields marked with <span className="text-rose-600">*</span> are required. Upload the cover image before saving.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEventSaveError(null);
                    setIsEventModalOpen(false);
                  }}
                  className="p-1 text-[#736B63] hover:text-[#1C1A19] shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {eventSaveError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{eventSaveError}</span>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-medium text-[#1C1A19]">
                    Event title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    placeholder="e.g. Tocco House Spring Exhibition"
                    className="w-full rounded-lg border border-[#D8CEBF] p-2.5 text-[#1C1A19] outline-none focus:border-[#1C1A19]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-medium text-[#1C1A19]">Location <span className="font-normal text-[#8F8880]">(optional)</span></label>
                    <input
                      type="text"
                      value={editingEvent.location}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, location: e.target.value })
                      }
                      placeholder="e.g. Cairo Atelier"
                      className="w-full rounded-lg border border-[#D8CEBF] p-2.5 text-[#1C1A19] outline-none focus:border-[#1C1A19]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-medium text-[#1C1A19]">
                      Event date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                      className="w-full rounded-lg border border-[#D8CEBF] p-2.5 text-[#1C1A19] outline-none focus:border-[#1C1A19]"
                    />
                  </div>
                </div>
                <CloudinaryImageField
                  label="Cover image"
                  required
                  value={editingEvent.coverImage}
                  folder="tocco/events"
                  onChange={(coverImage) =>
                    setEditingEvent({
                      ...editingEvent,
                      coverImage,
                      publicId: coverImage ? editingEvent.publicId : '',
                    })
                  }
                  onUploadResult={(result) =>
                    setEditingEvent({
                      ...editingEvent,
                      coverImage: result.secure_url || result.url,
                      publicId: result.public_id,
                    })
                  }
                />
                <div>
                  <label className="mb-1 block font-medium text-[#1C1A19]">
                    Description <span className="font-normal text-[#8F8880]">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={editingEvent.description}
                    onChange={(e) =>
                      setEditingEvent({ ...editingEvent, description: e.target.value })
                    }
                    placeholder="Add a short description for the event card."
                    className="w-full rounded-lg border border-[#D8CEBF] p-2.5 text-[#1C1A19] outline-none focus:border-[#1C1A19]"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEventSaveError(null);
                    setIsEventModalOpen(false);
                  }}
                  disabled={isEventSaving}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEventSaving}
                  className="inline-flex min-w-32 items-center justify-center gap-2 rounded-full bg-[#1C1A19] px-5 py-2 text-xs uppercase tracking-wider text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEventSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isEventSaving ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ----------------- MODAL: EDIT PROJECT ----------------- */}
        {isProjectModalOpen && editingProject && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 my-8 border border-[#EAE4DC] shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-[#1C1A19]">In Their Space Image</h3>
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#1C1A19] mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editingProject.customerName || editingProject.title}
                    onChange={(e) => setEditingProject({ ...editingProject, customerName: e.target.value, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>
                <div>
                  <label className="block text-[#1C1A19] mb-1">Featured Caption</label>
                  <textarea
                    rows={3}
                    value={editingProject.description}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>
                <div>
                  <label className="block text-[#1C1A19] mb-1">Location <span className="font-normal text-[#8F8880]">(optional)</span></label>
                  <input
                    type="text"
                    value={editingProject.location}
                    onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>
                <CloudinaryImageField
                  label="Project Image"
                  required
                  value={editingProject.coverImage}
                  folder="space_projects"
                  onChange={(coverImage) => setEditingProject({ ...editingProject, coverImage })}
                  onUploadResult={(result) => setEditingProject({ ...editingProject, publicId: result.public_id, coverImage: result.secure_url || result.url })}
                />
                <div>
                  <label className="block text-[#1C1A19] mb-1">Featured Product (Optional)</label>
                  <select
                    value={editingProject.productId || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, productId: e.target.value || undefined })}
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF] bg-white"
                  >
                    <option value="">No linked product</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSaveProject();
                  }}
                  className="px-5 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider"
                >
                  Save Project
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ----------------- MODAL: EDIT OFFER ----------------- */}
        {editingOffer && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-8 border border-[#EAE4DC] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAE4DC]">
                <div>
                  <h3 className="text-lg font-medium text-[#1C1A19]">
                    {editingOffer.id ? 'Edit Offer' : 'Create Offer'}
                  </h3>
                  <p className="text-xs text-[#736B63] mt-1">Create a customer-ready offer for the catalogue.</p>
                </div>
                <button
                  onClick={() => setEditingOffer(null)}
                  className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {offersError && (
                <div className="flex items-start gap-2 rounded-xl border border-[#E2B6A2] bg-[#FFF5F0] px-3 py-2 text-xs text-[#8A3D25]">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{offersError}</span>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Offer Name *</label>
                    <input
                      type="text"
                      value={editingOffer.name}
                      onChange={(e) => setEditingOffer({ ...editingOffer, name: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Offer Type</label>
                    <select
                      value={editingOffer.offer_type}
                      onChange={(e) => setEditingOffer({ ...editingOffer, offer_type: e.target.value as OfferType })}
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF] bg-white"
                    >
                      <option value="PERCENTAGE">Percentage Discount</option>
                      <option value="BUNDLE">Bundle Price</option>
                      <option value="FREE_SHIPPING">Free Shipping</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4DC]">
                  {editingOffer.offer_type === 'PERCENTAGE' && (
                    <div>
                      <label className="block text-[#1C1A19] font-medium mb-1">Percentage (%) *</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editingOffer.percentage}
                        onChange={(e) => setEditingOffer({ ...editingOffer, percentage: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono bg-white"
                      />
                    </div>
                  )}
                  {editingOffer.offer_type === 'BUNDLE' && (
                    <div>
                      <label className="block text-[#1C1A19] font-medium mb-1">Bundle Price (EGP) *</label>
                      <input
                        type="number"
                        min="1"
                        value={editingOffer.bundle_price}
                        onChange={(e) => setEditingOffer({ ...editingOffer, bundle_price: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono bg-white"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 self-end pb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingOffer.is_active}
                      onChange={(e) => setEditingOffer({ ...editingOffer, is_active: e.target.checked })}
                      className="rounded border-[#D8CEBF]"
                    />
                    <span className="font-medium text-[#1C1A19]">Active</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-[#1C1A19] font-medium">Included Products *</label>
                    <button
                      type="button"
                      onClick={() => setEditingOffer({
                        ...editingOffer,
                        products: [...editingOffer.products, { product_id: products[0]?.id || '', quantity: '1' }],
                      })}
                      className="text-[11px] uppercase tracking-wider text-[#B85D38] hover:text-[#1C1A19]"
                    >
                      Add Product
                    </button>
                  </div>
                  {editingOffer.products.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1fr_84px_32px] gap-2 items-center">
                      <select
                        value={item.product_id}
                        onChange={(e) => {
                          const nextProducts = editingOffer.products.map((current, itemIndex) =>
                            itemIndex === index ? { ...current, product_id: e.target.value } : current
                          );
                          setEditingOffer({ ...editingOffer, products: nextProducts });
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#D8CEBF] bg-white min-w-0"
                      >
                        <option value="">Select product</option>
                        {products
                          .filter((product) => Number.isInteger(Number(product.id)))
                          .map((product) => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const nextProducts = editingOffer.products.map((current, itemIndex) =>
                            itemIndex === index ? { ...current, quantity: e.target.value } : current
                          );
                          setEditingOffer({ ...editingOffer, products: nextProducts });
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingOffer({
                          ...editingOffer,
                          products: editingOffer.products.filter((_, itemIndex) => itemIndex !== index),
                        })}
                        disabled={!Array.isArray(editingOffer.products) || editingOffer.products.length <= 1}
                        className="p-2 text-[#B85D38] disabled:text-[#C9C0B4]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Starts At</label>
                    <input
                      type="datetime-local"
                      value={editingOffer.starts_at}
                      onChange={(e) => setEditingOffer({ ...editingOffer, starts_at: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Ends At</label>
                    <input
                      type="datetime-local"
                      value={editingOffer.ends_at}
                      onChange={(e) => setEditingOffer({ ...editingOffer, ends_at: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAE4DC] flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOffer(null)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOffer}
                  disabled={isOfferSaving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium disabled:opacity-70"
                >
                  {isOfferSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Offer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: EDIT COLLABORATION ----------------- */}
        {editingCollaboration && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 my-8 border border-[#EAE4DC] shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAE4DC]">
                <div>
                  <h3 className="text-base font-medium text-[#1C1A19]">Collaboration Details</h3>
                  <p className="text-xs text-[#736B63] mt-1">Upload a collaboration image and preview it before saving.</p>
                </div>
                <button
                  onClick={() => setEditingCollaboration(null)}
                  className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {collaborationsError && (
                <div className="flex items-start gap-2 rounded-xl border border-[#E2B6A2] bg-[#FFF5F0] px-3 py-2 text-xs text-[#8A3D25]">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{collaborationsError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#1C1A19] font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={editingCollaboration.title}
                    onChange={(e) => setEditingCollaboration({ ...editingCollaboration, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>
                <CloudinaryImageField
                  label="Collaboration Image"
                  required
                  value={editingCollaboration.image}
                  folder="tocco/collaborations"
                  onChange={(image) =>
                    setEditingCollaboration({
                      ...editingCollaboration,
                      image,
                      public_id: image ? editingCollaboration.public_id : '',
                    })
                  }
                  onUploadResult={(result) =>
                    setEditingCollaboration({
                      ...editingCollaboration,
                      image: result.secure_url || result.url,
                      public_id: result.public_id,
                    })
                  }
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCollaboration(null)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCollaboration}
                  disabled={isCollaborationSaving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider disabled:opacity-70"
                >
                  {isCollaborationSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Collaboration</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ----------------- MODAL: EDIT COLOR ----------------- */}
        {editingColor && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 my-8 border border-[#EAE4DC] shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAE4DC]">
                <div>
                  <h3 className="text-base font-medium text-[#1C1A19]">
                    {editingColor.id ? 'Edit Color' : 'Add Color'}
                  </h3>
                  <p className="text-xs text-[#736B63] mt-1">Colors become selectable on every product form.</p>
                </div>
                <button
                  onClick={() => setEditingColor(null)}
                  className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {colorsError && (
                <div className="flex items-start gap-2 rounded-xl border border-[#E2B6A2] bg-[#FFF5F0] px-3 py-2 text-xs text-[#8A3D25]">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{colorsError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#1C1A19] font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={editingColor.name}
                    onChange={(e) => setEditingColor({ ...editingColor, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>
                <div>
                  <label className="block text-[#1C1A19] font-medium mb-1">Hex Code *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingColor.hex_code}
                      onChange={(e) => setEditingColor({ ...editingColor, hex_code: e.target.value.toUpperCase() })}
                      className="w-10 h-10 rounded-lg border border-[#D8CEBF] p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={editingColor.hex_code}
                      onChange={(e) => setEditingColor({ ...editingColor, hex_code: e.target.value.toUpperCase() })}
                      placeholder="#EBE3D5"
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingColor(null)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveColor}
                  disabled={isColorSaving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider disabled:opacity-70"
                >
                  {isColorSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Color</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ----------------- MODAL: EDIT BANNER ----------------- */}
        {isBannerModalOpen && editingBanner && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 my-8 border border-[#EAE4DC] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-[#EAE4DC]">
                <h3 className="text-lg font-medium text-[#1C1A19]">
                  {editingBanner.title ? `Edit: ${editingBanner.title}` : 'Create New Banner Highlight'}
                </h3>
                <button
                  onClick={() => setIsBannerModalOpen(false)}
                  className="p-1 text-[#736B63] hover:text-[#1C1A19]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Banner Type *</label>
                    <select
                      value={editingBanner.type}
                      onChange={(e) => {
                        const t = e.target.value as any;
                        let catLabel = 'New Release';
                        if (t === 'special_offer') catLabel = 'Atelier Privilege';
                        if (t === 'upcoming_event') catLabel = 'Design Event';
                        if (t === 'custom_service') catLabel = 'Bespoke Studio';
                        setEditingBanner({
                          ...editingBanner,
                          type: t,
                          categoryLabel: catLabel,
                        });
                      }}
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF] bg-white"
                    >
                      <option value="new_product">منتج جديد (New Piece / Product)</option>
                      <option value="special_offer">اوفر وعرض استثنائي (Special Privilege / Offer)</option>
                      <option value="upcoming_event">ايفنت ومعرض (Upcoming Event / Exhibition)</option>
                      <option value="custom_service">خدمات وتجهيز المشاريع (Projects & Commercial)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Badge Text *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NEW RELEASE · 2026 EDITION"
                      value={editingBanner.badgeText}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, badgeText: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#1C1A19] font-medium mb-1">Banner Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Solis Monumental Dining Table"
                    value={editingBanner.title}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, title: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>

                <div>
                  <label className="block text-[#1C1A19] font-medium mb-1">Subtitle / Description *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe the highlight piece, event details, or promotional terms..."
                    value={editingBanner.subtitle}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Highlight Pill / Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Oct 14-18, New Cairo or Code: TOCCOWHITE"
                      value={editingBanner.tagHighlight || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, tagHighlight: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Promo Code (if offer)</label>
                    <input
                      type="text"
                      placeholder="e.g. TOCCOWHITE"
                      value={editingBanner.promoCode || ''}
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          promoCode: e.target.value,
                          actionType: e.target.value ? 'copy_code' : 'navigate',
                        })
                      }
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Button CTA Text *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Explore New Piece"
                      value={editingBanner.ctaText}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, ctaText: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#1C1A19] font-medium mb-1">Target Page</label>
                    <select
                      value={editingBanner.targetView || 'shop'}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, targetView: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg border border-[#D8CEBF] bg-white"
                    >
                      <option value="shop">Catalogue (Shop)</option>
                      <option value="events">Events & Exhibitions</option>
                      <option value="custom-design">Custom Design (Bespoke)</option>
                      <option value="our-story">Our Story</option>
                    </select>
                  </div>
                </div>

                <CloudinaryImageField
                  label="Background Image"
                  required
                  value={editingBanner.image}
                  folder="tocco/banners"
                  onChange={(image) => setEditingBanner({ ...editingBanner, image })}
                />

                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBanner.isActive}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, isActive: e.target.checked })
                      }
                      className="rounded border-[#D8CEBF]"
                    />
                    <span className="font-medium text-[#1C1A19]">Active (Display on Homepage)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAE4DC] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingBanner.title.trim()) {
                      saveBanner(editingBanner);
                      setIsBannerModalOpen(false);
                    }
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D]"
                >
                  Save Banner
                </button>
              </div>
            </div>
          </div>
        )}
        <ConfirmDialog
          isOpen={Boolean(pendingDelete)}
          title={pendingDelete?.title || 'Confirm Delete'}
          description={pendingDelete?.description || ''}
          confirmLabel="Delete"
          isLoading={isDeleteProcessing}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handlePendingDelete}
        />
      </div>
    </div>
  );
}
