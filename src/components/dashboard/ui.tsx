'use client';

import { Tag } from 'antd';

const statusColors: Record<string, string> = {
  planning: 'blue',
  in_progress: 'processing',
  on_hold: 'warning',
  completed: 'success',
  draft: 'default',
  sent: 'processing',
  approved: 'success',
  paid: 'success',
  overdue: 'error',
  cancelled: 'default',
  staff: 'geekblue',
  office: 'purple',
  transport: 'cyan',
  travel: 'gold',
};

export const cardStyle = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
};

export function formatCurrency(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function titleCase(value?: string | null) {
  if (!value) return '-';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function StatusTag({ value }: { value?: string | null }) {
  if (!value) return <Tag>-</Tag>;
  return <Tag color={statusColors[value] || 'default'}>{titleCase(value)}</Tag>;
}

export function getPagedData<T>(result: T[] | { data?: T[] } | null | undefined): T[] {
  if (Array.isArray(result)) return result;
  return result?.data || [];
}
