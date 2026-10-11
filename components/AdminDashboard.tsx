'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToccoStore } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';
import { Product, Category } from '@/types';
import { BackendOrder, BackendOrderStatus } from '@/types/order';
import { BackendOffer, OfferCreateRequest } from '@/types/offer';
import { orderService } from '@/lib/api/services/orderService';
import { offerService } from '@/lib/api/services/offerService';
import { paymentService } from '@/lib/api/services/paymentService';
import { normalizeApiError } from '@/lib/api/errors';
import ConfirmDialog from '@/components/ConfirmDialog';

import AdminLayout, { DashboardSection } from './admin/AdminLayout';
import OverviewSection from './admin/OverviewSection';
import ProductsSection from './admin/ProductsSection';
import CategoriesSection from './admin/CategoriesSection';
import SubcategoriesSection from './admin/SubcategoriesSection';
import OrdersSection from './admin/OrdersSection';
import OffersSection from './admin/OffersSection';
import AiProductImageView from './admin/AiProductImageView';
import ShippingSection from './admin/ShippingSection';
import SettingsSection from './admin/SettingsSection';
import UserManagement from './UserManagement';
import { userService } from '@/lib/api/services/userService';

export default function AdminDashboard() {
  const {
    products,
    categories,
    subcategories,
    settings,
    saveProduct,
    deleteProduct,
    toggleProductFeatured,
    saveCategory,
    deleteCategory,
    saveSubcategory,
    deleteSubcategory,
    updateSettings,
    navigateTo,
  } = useToccoStore();

  const { user, isLoading: isAuthLoading } = useAuth();

  // Defense-in-depth: redirect if non-admin user mounts the dashboard
  useEffect(() => {
    if (!isAuthLoading && (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR'))) {
      navigateTo('home');
    }
  }, [user, isAuthLoading, navigateTo]);

  // Active Section in Sidebar
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  // Backend Orders state
  const [backendOrders, setBackendOrders] = useState<BackendOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Offers state
  const [offers, setOffers] = useState<BackendOffer[]>([]);
  const [isOffersLoading, setIsOffersLoading] = useState(false);

  // Total Users state (Admin only)
  const [totalUsersCount, setTotalUsersCount] = useState<number | null>(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Modals state for Products & Categories
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [selectedOrderForModal, setSelectedOrderForModal] = useState<BackendOrder | null>(null);

  // Generic Confirm Delete Dialog
  const [pendingDelete, setPendingDelete] = useState<{
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false);

  // Fetch real Backend Orders
  const fetchBackendOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await orderService.getAllOrders();
      setBackendOrders(data || []);
    } catch (err) {
      setOrdersError(normalizeApiError(err).message);
      setBackendOrders([]);
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  // Fetch real Backend Offers
  const fetchOffers = useCallback(async () => {
    setIsOffersLoading(true);
    try {
      const data = await offerService.getOffers();
      setOffers(data || []);
    } catch {
      setOffers([]);
    } finally {
      setIsOffersLoading(false);
    }
  }, []);

  // Fetch real Registered Users count (Admin only)
  const fetchTotalUsers = useCallback(async () => {
    if (user?.role !== 'ADMIN') {
      setTotalUsersCount(null);
      return;
    }
    setIsUsersLoading(true);
    try {
      const res = await userService.getUsersPaginated({ page_size: 1 });
      setTotalUsersCount(typeof res.count === 'number' ? res.count : null);
    } catch {
      setTotalUsersCount(null);
    } finally {
      setIsUsersLoading(false);
    }
  }, [user?.role]);

  // Combined Refresh for Overview
  const handleRefreshAll = useCallback(async () => {
    await Promise.all([
      fetchBackendOrders(),
      fetchOffers(),
      fetchTotalUsers(),
    ]);
  }, [fetchBackendOrders, fetchOffers, fetchTotalUsers]);

  // Initial data load on mount
  useEffect(() => {
    fetchBackendOrders();
    fetchOffers();
    fetchTotalUsers();
  }, [fetchBackendOrders, fetchOffers, fetchTotalUsers]);

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: number | string, newStatus: BackendOrderStatus) => {
    const updated = await orderService.updateOrderStatus(orderId, { status: newStatus });
    setBackendOrders((prev) =>
      prev.map((o) => (o.id === orderId ? (updated ? { ...o, ...updated } : { ...o, status: newStatus }) : o))
    );
  };

  // Handle Payment Confirmation (PATCH /api/payments/<id>/status/)
  const handleConfirmPayment = async (order: BackendOrder) => {
    if (order.payment?.id) {
      await paymentService.updatePaymentStatus(order.payment.id, 'PAID');
      await fetchBackendOrders();
    } else {
      await handleUpdateOrderStatus(order.id, 'CONFIRMED');
    }
  };

  // Handle Save / Delete Offers
  const handleSaveOffer = async (data: OfferCreateRequest, offerId?: number) => {
    if (offerId) {
      const updated = await offerService.updateOffer(offerId, data);
      setOffers((prev) => prev.map((o) => (o.id === offerId ? updated : o)));
    } else {
      const created = await offerService.createOffer(data);
      setOffers((prev) => [created, ...prev]);
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    await offerService.deleteOffer(offerId);
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
  };

  // Compute category product counts
  const productCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });
    return counts;
  }, [products]);

  const unconfirmedCount = useMemo(() => {
    return backendOrders.filter(
      (o) => o.status === 'NOT_CONFIRMED' || (o.status as string) === 'unconfirmed'
    ).length;
  }, [backendOrders]);

  const requestDeleteConfirm = (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>
  ) => {
    setPendingDelete({ title, description, onConfirm });
  };

  const handleExecuteDelete = async () => {
    if (!pendingDelete || isDeleteProcessing) return;
    setIsDeleteProcessing(true);
    try {
      await pendingDelete.onConfirm();
      setPendingDelete(null);
    } catch (err: any) {
      alert(normalizeApiError(err).message);
    } finally {
      setIsDeleteProcessing(false);
    }
  };

  return (
    <>
      <AdminLayout
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        orderCount={backendOrders.length}
        unconfirmedOrderCount={unconfirmedCount}
      >
        {/* SECTION 1: OVERVIEW */}
        {activeSection === 'overview' && (
          <OverviewSection
            products={products}
            categories={categories}
            subcategories={subcategories}
            orders={backendOrders}
            offers={offers}
            totalUsers={totalUsersCount}
            isUsersLoading={isUsersLoading}
            isOrdersLoading={isOrdersLoading}
            onRefreshData={handleRefreshAll}
            onNavigateSection={setActiveSection}
            onOpenAddProduct={() => {
              setActiveSection('products');
              setEditingProduct({
                id: `prod-${Date.now()}`,
                slug: `product-${Date.now()}`,
                name: '',
                categoryId: categories[0]?.id || '',
                subcategoryIds: [],
                description: '',
                price: 2500,
                originalPrice: undefined,
                discountPercentage: undefined,
                images: [
                  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85',
                ],
                dimensions: '200x300 سم',
                material: 'صوف تركي فاخر ومقاوم للبقع',
                finishes: ['MATTE'],
                colors: [{ id: 'col-1', name: 'بيج وكريمي', hex: '#EBE3D5' }],
                sizes: [],
                faq: [],
                leadTime: 'شحن سريع لجميع المحافظات',
                shippingTime: 'توصيل خلال ٢-٤ أيام عمل',
                isFeatured: false,
                isPublished: true,
                inStock: true,
                allowsCustomization: false,
                isArawal: false,
                createdAt: new Date().toISOString(),
              });
              setIsProductModalOpen(true);
            }}
            onOpenAddCategory={() => {
              setActiveSection('categories');
              setEditingCategory({
                id: `cat-${Date.now()}`,
                name: '',
                slug: `category-${Date.now()}`,
                description: '',
                image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
                isFeatured: false,
                isVisible: true,
                displayOrder: categories.length + 1,
              });
              setIsCategoryModalOpen(true);
            }}
            onOpenAddSubcategory={() => {
              setActiveSection('subcategories');
            }}
            onOpenAddOffer={() => {
              setActiveSection('offers');
            }}
            onSelectOrder={(ord) => {
              setSelectedOrderForModal(ord);
              setActiveSection('orders');
            }}
          />
        )}

        {/* SECTION 2: PRODUCTS */}
        {activeSection === 'products' && (
          <ProductsSection
            products={products}
            categories={categories}
            subcategories={subcategories}
            onSaveProduct={saveProduct}
            onDeleteProduct={deleteProduct}
            onToggleFeatured={toggleProductFeatured}
            onRequestDeleteConfirm={requestDeleteConfirm}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            isModalOpen={isProductModalOpen}
            setIsModalOpen={setIsProductModalOpen}
          />
        )}

        {/* SECTION 3: CATEGORIES */}
        {activeSection === 'categories' && (
          <CategoriesSection
            categories={categories}
            productCountsByCategory={productCountsByCategory}
            onSaveCategory={saveCategory}
            onDeleteCategory={deleteCategory}
            onRequestDeleteConfirm={requestDeleteConfirm}
            editingCategory={editingCategory}
            setEditingCategory={setEditingCategory}
            isModalOpen={isCategoryModalOpen}
            setIsModalOpen={setIsCategoryModalOpen}
          />
        )}

        {/* SECTION 4: SUBCATEGORIES (CORE REQUIREMENT) */}
        {activeSection === 'subcategories' && (
          <SubcategoriesSection
            categories={categories}
            subcategories={subcategories}
            onSaveSubcategory={saveSubcategory}
            onDeleteSubcategory={deleteSubcategory}
            onRequestDeleteConfirm={requestDeleteConfirm}
          />
        )}

        {/* SECTION 5: ORDERS */}
        {activeSection === 'orders' && (
          <OrdersSection
            orders={backendOrders}
            isLoading={isOrdersLoading}
            onRefreshOrders={fetchBackendOrders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onConfirmPayment={handleConfirmPayment}
            selectedOrderForModal={selectedOrderForModal}
            setSelectedOrderForModal={setSelectedOrderForModal}
          />
        )}

        {/* SECTION 6: OFFERS */}
        {activeSection === 'offers' && (
          <OffersSection
            offers={offers}
            products={products}
            isLoading={isOffersLoading}
            onSaveOffer={handleSaveOffer}
            onDeleteOffer={handleDeleteOffer}
            onRequestDeleteConfirm={requestDeleteConfirm}
          />
        )}

        {/* SECTION 7: AI PRODUCT IMAGES */}
        {activeSection === 'ai-images' && (
          <AiProductImageView
            products={products}
            onAssignImageToProduct={(prodId, newImgUrl) => {
              const target = products.find((p) => String(p.id) === String(prodId));
              if (target) {
                const updatedImages = [newImgUrl, ...target.images.filter((img) => img !== newImgUrl)];
                saveProduct({
                  ...target,
                  images: updatedImages,
                });
              }
            }}
            onNavigateSection={setActiveSection}
          />
        )}

        {/* SECTION 8: SHIPPING */}
        {activeSection === 'shipping' && <ShippingSection />}

        {/* SECTION 9: SETTINGS */}
        {activeSection === 'settings' && (
          <SettingsSection
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        )}

        {/* SECTION 10: USER MANAGEMENT */}
        {activeSection === 'users' && <UserManagement />}
      </AdminLayout>

      {/* Confirmation Dialog for Destructive Actions */}
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title={pendingDelete?.title || ''}
        description={pendingDelete?.description || ''}
        confirmLabel="نعم، حذف نهائي"
        cancelLabel="إلغاء"
        variant="danger"
        isLoading={isDeleteProcessing}
        onConfirm={handleExecuteDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
