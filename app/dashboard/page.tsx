'use client';

import React from 'react';
import { StoreProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/context/AuthContext';
import AdminDashboard from '@/components/AdminDashboard';

export default function DashboardPage() {
  return (
    <StoreProvider>
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    </StoreProvider>
  );
}
