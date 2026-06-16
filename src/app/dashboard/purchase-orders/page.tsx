import { Alert } from 'antd';
import { PurchaseOrdersClient } from '@/components/dashboard/PurchaseOrdersClient';
import { fetchProjects, fetchPurchaseOrders, fetchVendors } from '@/lib/api';

async function loadPageData() {
  try {
    const [purchaseOrders, projects, vendors] = await Promise.all([
      fetchPurchaseOrders(),
      fetchProjects(),
      fetchVendors(),
    ]);

    return { 
      purchaseOrders, 
      projects, 
      vendors 
    };
  } catch (error) {
    return {
      purchaseOrders: [],
      projects: [],
      vendors: [],
      error: error instanceof Error ? error.message : 'Unable to load purchase orders',
    };
  }
}

export default async function PurchaseOrdersPage() {
  const { purchaseOrders, projects, vendors, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <PurchaseOrdersClient 
        purchaseOrders={purchaseOrders} 
        projects={projects} 
        vendors={vendors}
      />
    </>
  );
}
