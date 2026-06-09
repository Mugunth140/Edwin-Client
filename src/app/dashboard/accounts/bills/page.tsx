import { Alert } from 'antd';
import { BillsClient } from '@/components/dashboard/BillsClient';
import { fetchBills, fetchProjects, fetchVendors, fetchPurchaseOrders } from '@/lib/api';

async function loadPageData() {
  try {
    const [bills, vendors, projects, purchaseOrders] = await Promise.all([
      fetchBills(),
      fetchVendors(),
      fetchProjects(),
      fetchPurchaseOrders(),
    ]);
    return { bills, vendors, projects, purchaseOrders };
  } catch (error) {
    return {
      bills: [],
      vendors: [],
      projects: [],
      purchaseOrders: [],
      error: error instanceof Error ? error.message : 'Unable to load bills',
    };
  }
}

export default async function BillsPage() {
  const { bills, vendors, projects, purchaseOrders, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <BillsClient bills={bills} vendors={vendors} projects={projects} purchaseOrders={purchaseOrders} />
    </>
  );
}

