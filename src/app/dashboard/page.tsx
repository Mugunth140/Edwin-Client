'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { EngineerDashboardClient } from '@/components/dashboard/EngineerDashboardClient';
import { PurchaseDashboardClient } from '@/components/dashboard/PurchaseDashboardClient';
import { AccountsManagerDashboardClient } from '@/components/dashboard/AccountsManagerDashboardClient';
import { useAuthStore } from '@/store/auth';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  if (user?.role === 'site_engineer') {
    return <EngineerDashboardClient />;
  }

  if (user?.role === 'purchase_team') {
    return <PurchaseDashboardClient />;
  }

  if (user?.role === 'accounts_manager') {
    return <AccountsManagerDashboardClient />;
  }

  return <DashboardClient />;
}
