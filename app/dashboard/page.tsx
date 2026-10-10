import { redirect } from 'next/navigation';
import { checkServerAdminAuth } from '@/lib/api/authServer';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const auth = await checkServerAdminAuth();

  if (!auth.authorized) {
    // If not authenticated (401), redirect to home with auth=login modal
    if (auth.status === 401) {
      redirect('/?auth=login');
    }
    // If authenticated as CUSTOMER (403), or auth service unavailable, redirect to home
    redirect('/');
  }

  return <DashboardClient />;
}
