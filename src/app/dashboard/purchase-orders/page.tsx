import { Alert } from 'antd';
import { PurchaseOrdersClient } from '@/components/dashboard/PurchaseOrdersClient';
import { fetchProjects, fetchPurchaseOrders, fetchVendors, fetchWorkOrders } from '@/lib/api';

async function loadPageData() {
  try {
    const [purchaseOrders, projects, vendors, workOrdersRes] = await Promise.all([
      fetchPurchaseOrders(),
      fetchProjects(),
      fetchVendors(),
      fetchWorkOrders('limit=1000'),
    ]);

    // Simple normalization logic that works on server
    const workOrders = Array.isArray(workOrdersRes) 
      ? workOrdersRes 
      : (workOrdersRes as any)?.data || [];

    return { 
      purchaseOrders, 
      projects, 
      vendors, 
      workOrders 
    };
  } catch (error) {
    return {
      purchaseOrders: [],
      projects: [],
      vendors: [],
      workOrders: [],
      error: error instanceof Error ? error.message : 'Unable to load purchase orders',
    };
  }
}

export default async function PurchaseOrdersPage() {
  const { purchaseOrders, projects, vendors, workOrders, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <PurchaseOrdersClient 
        purchaseOrders={purchaseOrders} 
        projects={projects} 
        vendors={vendors} 
        workOrders={workOrders}
      />
    </>
  );
}
