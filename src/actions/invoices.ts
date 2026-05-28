'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getApiBaseUrl } from '@/lib/api-url';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createInvoice(data: Record<string, unknown>) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/invoices`, {
    method: 'POST', headers, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create invoice');
  revalidatePath('/dashboard/accounts/invoices');
  return res.json();
}

export async function updateInvoiceStatus(id: string, status: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/invoices/${id}/status`, {
    method: 'PATCH', headers, body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update invoice');
  revalidatePath('/dashboard/accounts/invoices');
  return res.json();
}

export async function createBill(data: Record<string, unknown>) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/bills`, {
    method: 'POST', headers, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create bill');
  revalidatePath('/dashboard/accounts/bills');
  return res.json();
}
