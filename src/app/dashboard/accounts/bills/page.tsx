import { Alert } from 'antd';
import { BillsClient } from '@/components/dashboard/BillsClient';
import { fetchBills, fetchProjects, fetchVendors } from '@/lib/api';

async function loadPageData() {
  try {
    const [bills, vendors, projects] = await Promise.all([
      fetchBills(),
      fetchVendors(),
      fetchProjects(),
    ]);
    return { bills, vendors, projects };
  } catch (error) {
    return {
      bills: [],
      vendors: [],
      projects: [],
      error: error instanceof Error ? error.message : 'Unable to load bills',
    };
  }
}

export default async function BillsPage() {
  const { bills, vendors, projects, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <BillsClient bills={bills} vendors={vendors} projects={projects} />
    </>
  );
}

