import { Alert } from 'antd';
import { PaymentsClient } from '@/components/dashboard/PaymentsClient';
import { fetchPayables, fetchReceivables } from '@/lib/api';

async function loadPageData() {
  try {
    const [payables, receivables] = await Promise.all([
      fetchPayables(),
      fetchReceivables(),
    ]);
    return { payables, receivables };
  } catch (error) {
    return {
      payables: [],
      receivables: [],
      error: error instanceof Error ? error.message : 'Unable to load payments data',
    };
  }
}

export default async function PaymentsPage() {
  const { payables, receivables, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <PaymentsClient payables={payables} receivables={receivables} />
    </>
  );
}
