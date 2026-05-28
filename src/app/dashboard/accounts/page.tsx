import { Alert } from 'antd';
import { AccountsClient } from '@/components/dashboard/AccountsClient';
import { fetchBalance, fetchLedger } from '@/lib/api';

async function loadPageData() {
  try {
    const [ledger, balance] = await Promise.all([
      fetchLedger(),
      fetchBalance(),
    ]);
    return { ledger, balance };
  } catch (error) {
    return {
      ledger: [],
      balance: { totalRevenue: 0, totalCost: 0 },
      error: error instanceof Error ? error.message : 'Unable to load accounts data',
    };
  }
}

export default async function AccountsPage() {
  const { ledger, balance, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <AccountsClient ledger={ledger} balance={balance} />
    </>
  );
}
