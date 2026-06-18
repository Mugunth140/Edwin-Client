import { Alert } from 'antd';
import { PurchaseOrdersClient } from '@/components/dashboard/PurchaseOrdersClient';
import { fetchProjects, fetchPurchaseOrders, fetchVendors, fetchItemDescriptions, fetchPurchaseEnquiries } from '@/lib/api';

async function loadPageData() {
  try {
    const [purchaseOrders, projects, vendors, itemDescriptions, purchaseEnquiries] = await Promise.all([
      fetchPurchaseOrders(),
      fetchProjects(),
      fetchVendors(),
      fetchItemDescriptions(),
      fetchPurchaseEnquiries(),
    ]);

    return { 
      purchaseOrders, 
      projects, 
      vendors,
      itemDescriptions,
      purchaseEnquiries,
    };
  } catch (error) {
    return {
      purchaseOrders: [],
      projects: [],
      vendors: [],
      itemDescriptions: [],
      purchaseEnquiries: [],
      error: error instanceof Error ? error.message : 'Unable to load purchase orders',
    };
  }
}

export default async function PurchaseOrdersPage() {
  const { purchaseOrders, projects, vendors, itemDescriptions, purchaseEnquiries, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <PurchaseOrdersClient 
        purchaseOrders={purchaseOrders} 
        projects={projects} 
        vendors={vendors}
        itemDescriptions={itemDescriptions}
        purchaseEnquiries={purchaseEnquiries}
      />
    </>
  );
}
