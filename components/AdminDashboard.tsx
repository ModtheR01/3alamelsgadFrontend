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

const PREVIEW_ORDERS: BackendOrder[] = [
  {
    id: 101,
    order_number: 'ORD-2026-001',
    user: {
      id: 1,
      first_name: 'أحمد',
      last_name: 'محمود',
      email: 'ahmed.m@example.com',
      phone: '01012345678',
    },
    address_id: 1,
    shipping_address: {
      title: 'المنزل',
      country: 'مصر',
      city: 'القاهرة - التجمع الخامس',
      street: 'شارع التسعين الشمالي',
      building_number: '14',
      apartment_number: '3',
    },
    status: 'NOT_CONFIRMED',
    customer_notes: 'يرجى الاتصال قبل التوصيل بساعة للتأكيد.',
    total_price: '4800.00',
    deposit_percentage: '50',
    deposit_amount: '2400.00',
    items: [
      {
        id: 1,
        product_id: 1,
        product_name: 'سجاد تبريز أصفهان كلاسيك فاخر',
        product_price: '4800.00',
        color_name: 'كريمي وبيج ملكي',
        color_hex_code: '#E8DEC0',
        selected_finish: 'MATTE',
        quantity: 1,
        subtotal: '4800.00',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 102,
    order_number: 'ORD-2026-002',
    user: {
      id: 2,
      first_name: 'سارة',
      last_name: 'خالد',
      email: 'sara.k@example.com',
      phone: '01123456789',
    },
    address_id: 2,
    shipping_address: {
      title: 'شقة العروسين',
      country: 'مصر',
      city: 'المنصورة - حي الجامعة',
      street: 'شارع جيهان',
      building_number: '8',
      apartment_number: '12',
    },
    status: 'CONFIRMED',
    customer_notes: 'تم تحويل العربون عبر إنستاباي بنجاح.',
    total_price: '3200.00',
    deposit_percentage: '50',
    deposit_amount: '1600.00',
    items: [
      {
        id: 2,
        product_id: 2,
        product_name: 'رول أروال ممرات تركي فاخر (عرض 80 سم)',
        product_price: '3200.00',
        color_name: 'رمادي مودرن',
        color_hex_code: '#8C8C8C',
        selected_finish: 'MATTE',
        quantity: 1,
        subtotal: '3200.00',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 103,
    order_number: 'ORD-2026-003',
    user: {
      id: 3,
      first_name: 'محمد',
      last_name: 'عبد الله',
      email: 'm.abdallah@example.com',
      phone: '01234567890',
    },
    address_id: 3,
    shipping_address: {
      title: 'الفيلا',
      country: 'مصر',
      city: 'الإسكندرية - سموحة',
      street: 'شارع فوزي معاذ',
      building_number: '22',
      apartment_number: '1',
    },
    status: 'CONFIRMED',
    customer_notes: 'تغليف خاص للهدايا من فضلكم.',
    total_price: '6500.00',
    deposit_percentage: '50',
    deposit_amount: '3250.00',
    items: [
      {
        id: 3,
        product_id: 3,
        product_name: 'سجاد كشمير حرير عالي الكثافة',
        product_price: '6500.00',
        color_name: 'كحلي وذهبي',
        color_hex_code: '#1A2B4C',
        selected_finish: 'GLOSSY',
        quantity: 1,
        subtotal: '6500.00',
      },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

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

  const { user } = useAuth();

  // Active Section in Sidebar
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  // Backend Orders state (defaults to preview orders until backend is connected)
  const [backendOrders, setBackendOrders] = useState<BackendOrder[]>(PREVIEW_ORDERS);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Offers state
  const [offers, setOffers] = useState<BackendOffer[]>([]);
  const [isOffersLoading, setIsOffersLoading] = useState(false);

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

  // Fetch real Backend Orders (if backend is connected)
  const fetchBackendOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await orderService.getAllOrders();
      if (data && data.length > 0) {
        setBackendOrders(data);
      }
    } catch {
      // Backend not yet connected: keep preview orders
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  // Initial data load on mount
  useEffect(() => {
    let active = true;

    orderService
      .getAllOrders()
      .then((data) => {
        if (active && data && data.length > 0) setBackendOrders(data);
      })
      .catch(() => {
        // Handled silently: preserve preview orders for frontend UI testing
      })
      .finally(() => {
        if (active) setIsOrdersLoading(false);
      });

    offerService
      .getOffers()
      .then((data) => {
        if (active && data) setOffers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsOffersLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: number | string, newStatus: BackendOrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
    } catch {
      // Backend not connected yet: update local state for preview
    }
    setBackendOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
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
    try {
      if (offerId) {
        const updated = await offerService.updateOffer(offerId, data);
        setOffers((prev) => prev.map((o) => (o.id === offerId ? updated : o)));
      } else {
        const created = await offerService.createOffer(data);
        setOffers((prev) => [created, ...prev]);
      }
    } catch {
      // Local fallback for preview
      if (offerId) {
        setOffers((prev) =>
          prev.map((o) => (o.id === offerId ? ({ ...o, ...data, id: offerId } as any) : o))
        );
      } else {
        const mockCreated = {
          id: Date.now(),
          ...data,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any;
        setOffers((prev) => [mockCreated, ...prev]);
      }
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    try {
      await offerService.deleteOffer(offerId);
    } catch {
      // Local fallback
    }
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
            totalUsers={128}
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
