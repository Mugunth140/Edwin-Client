import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

/**
 * Typed fetch wrapper for server-side API calls.
 * Reads JWT from httpOnly cookie and attaches Authorization header.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { tags?: string[] } = {},
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const { tags, ...fetchOptions } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
    ...(tags ? { next: { tags } } : {}),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'API Error' }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Convenience helpers
export const fetchDashboard = () => apiFetch('/dashboard/master', { tags: ['dashboard'] });
export const fetchProjects = () => apiFetch('/projects', { tags: ['projects'] });
export const fetchProjectDashboard = (id: string) => apiFetch(`/projects/${id}/dashboard`, { tags: ['project-dashboard'] });
export const fetchWorkOrders = (params?: string) => apiFetch(`/work-orders${params ? `?${params}` : ''}`, { tags: ['work-orders'] });
export const fetchVendors = () => apiFetch('/vendors', { tags: ['vendors'] });
export const fetchCustomers = () => apiFetch('/customers', { tags: ['customers'] });
export const fetchInvoices = () => apiFetch('/invoices', { tags: ['invoices'] });
export const fetchBills = () => apiFetch('/bills', { tags: ['bills'] });
export const fetchExpenses = (params?: string) => apiFetch(`/expenses${params ? `?${params}` : ''}`, { tags: ['expenses'] });
export const fetchPayments = (params?: string) => apiFetch(`/payments${params ? `?${params}` : ''}`, { tags: ['payments'] });
export const fetchDpr = (params?: string) => apiFetch(`/dpr${params ? `?${params}` : ''}`, { tags: ['dpr'] });
export const fetchDrawings = (params?: string) => apiFetch(`/drawings${params ? `?${params}` : ''}`, { tags: ['drawings'] });
