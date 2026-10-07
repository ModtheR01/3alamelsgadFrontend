'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StoreProvider, useToccoStore } from '@/lib/store';
import { AuthProvider, useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import AdminDashboard from '@/components/AdminDashboard';
import { Loader2, ShieldAlert } from 'lucide-react';

function DashboardProtectedContent() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { activeView, navigateTo } = useToccoStore();
  const { t } = useLanguage();

  const userRole = (user?.role || '').toLowerCase();
  const canAccessAdmin = userRole === 'admin' || userRole === 'moderator';

  // Ensure active view in store is set to admin on mount
  useEffect(() => {
    if (activeView !== 'admin') {
      navigateTo('admin');
    }
  }, [activeView, navigateTo]);

  // Route protection: If user is not admin or moderator, redirect to home page
  useEffect(() => {
    if (!isLoading && !canAccessAdmin) {
      router.replace('/');
    }
  }, [isLoading, canAccessAdmin, router]);

  // When admin clicks "Storefront" or navigates back to storefront views
  useEffect(() => {
    if (activeView !== 'admin' && activeView !== 'dashboard') {
      router.push('/');
    }
  }, [activeView, router]);

  // Loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-[#241710]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#A27B5C]" />
          <p className="text-xs font-semibold tracking-wide text-[#736B63]">
            {t('جاري التحقق من صلاحيات الدخول...', 'Verifying administrator credentials...')}
          </p>
        </div>
      </div>
    );
  }

  // Not authorized state before redirect finishes
  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-[#241710] text-center">
        <ShieldAlert className="w-12 h-12 text-amber-600 mb-3" />
        <h2 className="text-lg font-bold mb-1">
          {t('غير مصرح بالدخول', 'Access Denied')}
        </h2>
        <p className="text-xs text-[#736B63] max-w-sm mb-4">
          {t(
            'لوحة التحكم مخصصة للمشرفين والمسؤولين فقط. جاري توجيهك إلى المتجر...',
            'The dashboard is restricted to administrators and moderators only. Redirecting to storefront...'
          )}
        </p>
      </div>
    );
  }

  // Render the existing AdminDashboard component
  return <AdminDashboard />;
}

export default function DashboardPage() {
  return (
    <StoreProvider>
      <AuthProvider>
        <DashboardProtectedContent />
      </AuthProvider>
    </StoreProvider>
  );
}
