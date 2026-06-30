import { Alert } from 'antd';
import { ApprovalsClient } from '@/components/dashboard/ApprovalsClient';
import { fetchBills, fetchExpenses, fetchPurchaseOrders, fetchSubcontractWorkOrders, fetchDailyLabourReports, fetchTimesheets } from '@/lib/api';
import type { PurchaseBill, Expense, PurchaseOrder, SubcontractWorkOrder, DailyLabourReport, WeeklyTimesheet } from '@/types/erp';

type PageData = {
  bills: PurchaseBill[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  subcontractWorkOrders: SubcontractWorkOrder[];
  dailyReports: DailyLabourReport[];
  timesheets: WeeklyTimesheet[];
  error?: string;
};

async function loadPageData(): Promise<PageData> {
  try {
    const [bills, expensesResult, purchaseOrders, subcontractWorkOrders, dailyReports, tsResult] = await Promise.all([
      fetchBills(),
      fetchExpenses(),
      fetchPurchaseOrders(),
      fetchSubcontractWorkOrders(),
      fetchDailyLabourReports(),
      fetchTimesheets(),
    ]);
    return { bills, expenses: expensesResult.data, purchaseOrders, subcontractWorkOrders, dailyReports, timesheets: tsResult.data };
  } catch (error) {
    return {
      bills: [], expenses: [], purchaseOrders: [], subcontractWorkOrders: [], dailyReports: [], timesheets: [],
      error: error instanceof Error ? error.message : 'Failed to load data',
    };
  }
}

export default async function ApprovalsPage() {
  const { bills, expenses, purchaseOrders, subcontractWorkOrders, dailyReports, timesheets, error } = await loadPageData();
  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <ApprovalsClient
        bills={bills} expenses={expenses} purchaseOrders={purchaseOrders}
        subcontractWorkOrders={subcontractWorkOrders} dailyReports={dailyReports}
        timesheets={timesheets}
      />
    </>
  );
}
