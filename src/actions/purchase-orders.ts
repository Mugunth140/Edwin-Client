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

export async function createPurchaseOrder(data: Record<string, unknown>) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/purchase-orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create purchase order');
  revalidatePath('/dashboard/purchase-orders');
  return res.json();
}

export async function convertPoToBill(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/purchase-orders/${id}/convert`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to convert PO to bill');
  revalidatePath('/dashboard/purchase-orders');
  revalidatePath('/dashboard/accounts/bills');
  return res.json();
}
