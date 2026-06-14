'use client';

import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { EngineerDashboardClient } from '@/components/dashboard/EngineerDashboardClient';
import { useAuthStore } from '@/store/auth';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === 'site_engineer') {
    return <EngineerDashboardClient />;
  }

  return <DashboardClient />;
}
