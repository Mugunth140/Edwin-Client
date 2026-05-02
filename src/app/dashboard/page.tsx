import { Alert } from 'antd';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { fetchDashboard, fetchExpenseSummary } from '@/lib/api';
import type { DashboardData, ExpenseSummary } from '@/types/erp';

const emptyDashboard: DashboardData = {
  totalProjects: 0,
  projects: [],
  revenueVsCost: { totalRevenue: 0, totalCost: 0 },
  weeklyLabour: [],
  criticalActions: [],
};

async function loadDashboard(): Promise<{
  data: DashboardData;
  expenseSummary: ExpenseSummary[];
  error?: string;
}> {
  try {
    const [data, expenseSummary] = await Promise.all([
      fetchDashboard(),
      fetchExpenseSummary(),
    ]);
    return { data, expenseSummary };
  } catch (error) {
    return {
      data: emptyDashboard,
      expenseSummary: [],
      error: error instanceof Error ? error.message : 'Unable to load dashboard',
    };
  }
}

export default async function DashboardPage() {
  const { data, expenseSummary, error } = await loadDashboard();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <DashboardClient data={data} expenseSummary={expenseSummary} />
    </>
  );
}
