'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

export async function uploadDpr(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(`${API_URL}/dpr`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload DPR');
  revalidatePath('/dashboard/dpr');
  return res.json();
}
