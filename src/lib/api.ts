import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

/**
 * Typed fetch wrapper for server-side API calls.
 * Reads JWT from httpOnly cookie and attaches Authorization header.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'API Error' }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Convenience helpers
export const fetchDashboard = () => apiFetch('/dashboard/master');
export const fetchProjects = () => apiFetch('/projects');
export const fetchProjectDashboard = (id: string) => apiFetch(`/projects/${id}/dashboard`);
export const fetchWorkOrders = (params?: string) => apiFetch(`/work-orders${params ? `?${params}` : ''}`);
export const fetchVendors = () => apiFetch('/vendors');
export const fetchCustomers = () => apiFetch('/customers');
export const fetchInvoices = () => apiFetch('/invoices');
export const fetchBills = () => apiFetch('/bills');
export const fetchExpenses = (params?: string) => apiFetch(`/expenses${params ? `?${params}` : ''}`);
export const fetchPayments = (params?: string) => apiFetch(`/payments${params ? `?${params}` : ''}`);
export const fetchDpr = (params?: string) => apiFetch(`/dpr${params ? `?${params}` : ''}`);
export const fetchDrawings = (params?: string) => apiFetch(`/drawings${params ? `?${params}` : ''}`);
