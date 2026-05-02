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

export const cardClassName = '!rounded-xl !border !border-white/10 !bg-white/[0.02]';
export const pageHeaderClassName = 'mb-6 flex flex-wrap items-center justify-between gap-4';
export const pageTitleClassName = '!m-0 !text-slate-200';
export const titleIconClassName = 'mr-2';
export const mutedTextClassName = '!text-slate-500';
export const secondaryTextClassName = '!text-slate-400';

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
