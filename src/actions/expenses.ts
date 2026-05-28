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

export async function createExpense(data: Record<string, unknown>) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/expenses`, {
    method: 'POST', headers, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create expense');
  revalidatePath('/dashboard/expenses');
  return res.json();
}


export async function updateExpense(id: string, data: Record<string, unknown>) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/expenses/${id}`, {
    method: 'PATCH', headers, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update expense');
  revalidatePath('/dashboard/expenses');
  return res.json();
}

export async function deleteExpense(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/expenses/${id}`, {
    method: 'DELETE', headers,
  });
  if (!res.ok) throw new Error('Failed to delete expense');
  revalidatePath('/dashboard/expenses');
  return { success: true };
}
