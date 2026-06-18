import { Alert } from 'antd';
import { PurchaseEnquiryClient } from '@/components/dashboard/PurchaseEnquiryClient';
import { fetchProjects, fetchPurchaseEnquiries, fetchVendors, fetchItemDescriptions } from '@/lib/api';

async function loadPageData() {
  try {
    const [enquiries, projects, vendors, itemDescriptions] = await Promise.all([
      fetchPurchaseEnquiries(),
      fetchProjects(),
      fetchVendors(),
      fetchItemDescriptions(),
    ]);
    return { enquiries, projects, vendors, itemDescriptions };
  } catch (error) {
    return {
      enquiries: [],
      projects: [],
      vendors: [],
      itemDescriptions: [],
      error: error instanceof Error ? error.message : 'Unable to load purchase enquiries',
    };
  }
}

export default async function PurchaseEnquiryPage() {
  const { enquiries, projects, vendors, itemDescriptions, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <PurchaseEnquiryClient enquiries={enquiries} projects={projects} vendors={vendors} itemDescriptions={itemDescriptions} />
    </>
  );
}
