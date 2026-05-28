import { cookies } from 'next/headers';
import type {
  Customer,
  DashboardData,
  Expense,
  ExpenseSummary,
  PagedResponse,
  Project,
  SalesInvoice,
  Vendor,
  WorkOrder,
  Drawing,
  PurchaseOrder,
  PurchaseBill,
} from '@/types/erp';
import { getApiBaseUrl } from './api-url';

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

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
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
export const fetchDashboard = () => apiFetch<DashboardData>('/dashboard/master');
export const fetchProjects = () => apiFetch<Project[]>('/projects');
export const fetchProjectDashboard = (id: string) => apiFetch<any>(`/projects/${id}/dashboard`);
export const fetchWorkOrders = (params?: string) => apiFetch<PagedResponse<WorkOrder>>(`/work-orders${params ? `?${params}` : ''}`);
export const fetchVendors = () => apiFetch<Vendor[]>('/vendors');
export const fetchCustomers = () => apiFetch<Customer[]>('/customers');
export const fetchInvoices = () => apiFetch<SalesInvoice[]>('/invoices');
export const fetchBills = () => apiFetch<PurchaseBill[]>('/bills');
export const fetchExpenses = (params?: string) => apiFetch<PagedResponse<Expense>>(`/expenses${params ? `?${params}` : ''}`);
export const fetchExpenseSummary = () => apiFetch<ExpenseSummary[]>('/expenses/summary');
export const fetchPayments = (params?: string) => apiFetch<any>(`/payments${params ? `?${params}` : ''}`);
export const fetchDpr = (params?: string) => apiFetch<any>(`/dpr${params ? `?${params}` : ''}`);
export const fetchDrawings = (params?: string) => apiFetch<Drawing[]>(`/drawings${params ? `?${params}` : ''}`);
export const fetchPurchaseOrders = () => apiFetch<PurchaseOrder[]>('/purchase-orders');
export const fetchLedger = () => apiFetch<any[]>('/accounts/ledger');
export const fetchBalance = () => apiFetch<{ totalRevenue: number; totalCost: number }>('/accounts/balance');
export const fetchPayables = () => apiFetch<PurchaseBill[]>('/accounts/payables');
export const fetchReceivables = () => apiFetch<SalesInvoice[]>('/accounts/receivables');
