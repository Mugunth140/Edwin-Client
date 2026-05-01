import { Alert } from 'antd';
import { InvoicesClient } from '@/components/dashboard/InvoicesClient';
import { fetchCustomers, fetchInvoices, fetchProjects } from '@/lib/api';
import type { Customer, Project, SalesInvoice } from '@/types/erp';

type InvoicesPageData = {
  invoices: SalesInvoice[];
  customers: Customer[];
  projects: Project[];
  error?: string;
};

async function loadPageData(): Promise<InvoicesPageData> {
  try {
    const [invoices, customers, projects] = await Promise.all([
      fetchInvoices(),
      fetchCustomers(),
      fetchProjects(),
    ]);
    return { invoices, customers, projects };
  } catch (error) {
    return {
      invoices: [],
      customers: [],
      projects: [],
      error: error instanceof Error ? error.message : 'Unable to load invoices',
    };
  }
}

export default async function InvoicesPage() {
  const { invoices, customers, projects, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon message={error} style={{ marginBottom: 16 }} />}
      <InvoicesClient invoices={invoices} customers={customers} projects={projects} />
    </>
  );
}
