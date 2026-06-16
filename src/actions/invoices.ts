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
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create invoice' }));
    throw new Error(error.message || 'Failed to create invoice');
  }
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
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create bill' }));
    throw new Error(error.message || 'Failed to create bill');
  }
  revalidatePath('/dashboard/accounts/bills');
  return res.json();
}

export async function updateBillStatus(id: string, status: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/bills/${id}/status`, {
    method: 'PATCH', headers, body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update bill status');
  revalidatePath('/dashboard/accounts/bills');
  revalidatePath('/dashboard/approvals');
  return res.json();
}

export async function deleteInvoice(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/invoices/${id}`, {
    method: 'DELETE', headers,
  });
  if (!res.ok) throw new Error('Failed to delete invoice');
  revalidatePath('/dashboard/accounts/invoices');
  return { success: true };
}
