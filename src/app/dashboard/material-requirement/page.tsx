import { Alert } from 'antd';
import { PurchaseEnquiryClient } from '@/components/dashboard/PurchaseEnquiryClient';
import { fetchProjects, fetchPurchaseEnquiries, fetchItemDescriptions } from '@/lib/api';

async function loadPageData() {
  try {
    const [enquiries, projects, itemDescriptions] = await Promise.all([
      fetchPurchaseEnquiries(),
      fetchProjects(),
      fetchItemDescriptions(),
    ]);
    return { enquiries, projects, itemDescriptions };
  } catch (error) {
    return {
      enquiries: [],
      projects: [],
      itemDescriptions: [],
      error: error instanceof Error ? error.message : 'Unable to load material requirements',
    };
  }
}

export default async function MaterialRequirementPage() {
  const { enquiries, projects, itemDescriptions, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <PurchaseEnquiryClient enquiries={enquiries} projects={projects} itemDescriptions={itemDescriptions} />
    </>
  );
}
