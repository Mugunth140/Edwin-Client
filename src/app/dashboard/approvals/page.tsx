import { Alert } from 'antd';
import { ApprovalsClient } from '@/components/dashboard/ApprovalsClient';
import { fetchBills, fetchExpenses } from '@/lib/api';
import type { PurchaseBill, Expense } from '@/types/erp';

type PageData = {
  bills: PurchaseBill[];
  expenses: Expense[];
  error?: string;
};

async function loadPageData(): Promise<PageData> {
  try {
    const [bills, expensesResult] = await Promise.all([
      fetchBills(),
      fetchExpenses(),
    ]);
    return { bills, expenses: expensesResult.data };
  } catch (error) {
    return {
      bills: [],
      expenses: [],
      error: error instanceof Error ? error.message : 'Failed to load data',
    };
  }
}

export default async function ApprovalsPage() {
  const { bills, expenses, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <ApprovalsClient bills={bills} expenses={expenses} />
    </>
  );
}
