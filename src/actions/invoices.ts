'use server';

import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

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
  const res = await fetch(`${API_URL}/invoices`, {
    method: 'POST', headers, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create invoice');
  revalidateTag('invoices');
  return res.json();
}

export async function updateInvoiceStatus(id: string, status: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/invoices/${id}/status`, {
    method: 'PATCH', headers, body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update invoice');
  revalidateTag('invoices');
  return res.json();
}
