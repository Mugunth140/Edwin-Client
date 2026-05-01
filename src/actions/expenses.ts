'use server';

import { revalidatePath } from 'next/cache';
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

export async function createExpense(data: Record<string, unknown>) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/expenses`, {
    method: 'POST', headers, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create expense');
  revalidatePath('/dashboard/expenses');
  return res.json();
}
