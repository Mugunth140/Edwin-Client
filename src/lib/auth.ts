import { cookies } from 'next/headers';

export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value;
}

export async function getUserFromToken(): Promise<{ id: string; email: string; role: string; name: string } | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const API_URL = process.env.API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
