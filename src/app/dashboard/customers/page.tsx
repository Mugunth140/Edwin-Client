import { Alert } from 'antd';
import { CustomersClient } from '@/components/dashboard/CustomersClient';
import { fetchCustomers } from '@/lib/api';
import type { Customer } from '@/types/erp';

async function loadPageData() {
  try {
    const customers = await fetchCustomers();
    return { customers };
  } catch (error) {
    return {
      customers: [],
      error: error instanceof Error ? error.message : 'Unable to load customers',
    };
  }
}

export default async function CustomersPage() {
  const { customers, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <CustomersClient customers={customers} />
    </>
  );
}
