'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  Button, Card, DatePicker, Flex, Input, InputNumber, Select, Spin, Typography, App,
} from 'antd';
import {
  LeftOutlined, RightOutlined, SaveOutlined, ClockCircleOutlined, PlusOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { saveTimesheet, updateTimesheet } from '@/actions/timesheet-attendance';
import type { Project } from '@/types/erp';
import { cardClassName, pageHeaderClassName, pageTitleClassName, titleIconClassName } from './ui';
import dayjs from 'dayjs';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS = ['monHours', 'tueHours', 'wedHours', 'thuHours', 'friHours', 'satHours', 'sunHours'] as const;

const FIXED_CATEGORIES = [
  { kind: 'holiday', label: 'Public Holiday' },
  { kind: 'idle', label: 'Idle Time' },
  { kind: 'leave', label: 'Leave' },
] as const;

const STANDARD_DAILY_HOURS = 8.5;
const STANDARD_WORKING_DAYS = 6;
const STANDARD_WEEKLY_HOURS = STANDARD_DAILY_HOURS * STANDARD_WORKING_DAYS;

type FixedKind = (typeof FIXED_CATEGORIES)[number]['kind'];

type GridRow = {
  key: string;
  kind: 'project' | FixedKind;
  rowId?: string;
  projectId: string | null;
  hours: number[];
  remark: string;
};

type Props = { projects: Project[] };

let rowSeq = 0;
function nextKey() {
  rowSeq += 1;
  return `row-${rowSeq}`;
}

function emptyHours(): number[] {
  return [0, 0, 0, 0, 0, 0, 0];
}

function emptyProjectRow(): GridRow {
  return { key: nextKey(), kind: 'project', projectId: null, hours: emptyHours(), remark: '' };
}

function emptyFixedRows(): GridRow[] {
  return FIXED_CATEGORIES.map((c) => ({ key: nextKey(), kind: c.kind, projectId: null, hours: emptyHours(), remark: '' }));
}

function defaultRows(): GridRow[] {
  return [emptyProjectRow(), ...emptyFixedRows()];
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rowsFromServer(tsRows: any[]): GridRow[] {
  const projectRows: GridRow[] = [];
  const fixedMap = new Map<string, GridRow>();
  for (const c of FIXED_CATEGORIES) fixedMap.set(c.kind, { key: nextKey(), kind: c.kind, projectId: null, hours: emptyHours(), remark: '' });

  for (const row of tsRows) {
    const hours = DAYS.map((d) => Number((row as any)[d] || 0));
    const remark = row.remark || '';
    if (row.entryType === 'project') {
      projectRows.push({ key: nextKey(), kind: 'project', rowId: row.id, projectId: row.projectId || null, hours, remark });
    } else if (fixedMap.has(row.entryType)) {
      fixedMap.set(row.entryType, { key: nextKey(), kind: row.entryType, rowId: row.id, projectId: null, hours, remark });
    }
  }

  if (projectRows.length === 0) projectRows.push(emptyProjectRow());
  return [...projectRows, ...FIXED_CATEGORIES.map((c) => fixedMap.get(c.kind)!)];
}

function rowsToPayload(rows: GridRow[]): any[] {
  const out: any[] = [];
  for (const row of rows) {
    const total = row.hours.reduce((a, b) => a + b, 0);
    const remark = row.remark.trim();
    if (row.kind === 'project') {
      if (!row.projectId) continue;
    } else if (total <= 0 && !remark) {
      continue;
    }
    out.push({
      ...(row.rowId ? { id: row.rowId } : {}),
      ...(row.kind === 'project' ? { projectId: row.projectId } : {}),
      entryType: row.kind,
      remark: remark || undefined,
      monHours: row.hours[0],
      tueHours: row.hours[1],
      wedHours: row.hours[2],
      thuHours: row.hours[3],
      friHours: row.hours[4],
      satHours: row.hours[5],
      sunHours: row.hours[6],
    });
  }
  return out;
}

export function TimesheetAttendanceClient({ projects }: Props) {
  const [month, setMonth] = useState<dayjs.Dayjs>(dayjs().startOf('month'));
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [existingTs, setExistingTs] = useState<any>(null);
  const [rows, setRows] = useState<GridRow[]>(defaultRows());
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const weekStartStr = formatDate(weekStart);

  const weeksInMonth = useMemo(() => {
    const start = month.startOf('month').toDate();
    const end = month.endOf('month').toDate();
    const weeks: Date[] = [];
    let m = getMonday(start);
    while (m <= end) {
      weeks.push(new Date(m));
      m.setDate(m.getDate() + 7);
    }
    return weeks;
  }, [month]);

  const weekIndex = weeksInMonth.findIndex((w) => formatDate(w) === weekStartStr);

  const goPrevWeek = () => {
    if (weekIndex > 0) {
      setWeekStart(weeksInMonth[weekIndex - 1]);
      setExistingTs(null);
      setRows(defaultRows());
    }
  };

  const goNextWeek = () => {
    if (weekIndex < weeksInMonth.length - 1) {
      setWeekStart(weeksInMonth[weekIndex + 1]);
      setExistingTs(null);
      setRows(defaultRows());
    }
  };

  const loadTs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/timesheet-attendance/current?weekStart=${weekStartStr}`);
      if (res.ok) {
        const data = await res.json();
        setExistingTs(data);
        setRows(data && data.rows && data.rows.length > 0 ? rowsFromServer(data.rows) : defaultRows());
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [weekStartStr]);

  useEffect(() => { loadTs(); }, [loadTs]);

  const dayTotals = useMemo(
    () => DAY_LABELS.map((_, dayIdx) => rows.reduce((s, r) => s + (r.hours[dayIdx] || 0), 0)),
    [rows],
  );
  const totalHours = useMemo(() => dayTotals.reduce((s, v) => s + v, 0), [dayTotals]);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const addProjectRow = () => {
    setRows((prev) => {
      const projectRows = prev.filter((r) => r.kind === 'project');
      const fixedRows = prev.filter((r) => r.kind !== 'project');
      return [...projectRows, emptyProjectRow(), ...fixedRows];
    });
  };

  const removeProjectRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const setProjectId = (key: string, projectId: string | null) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, projectId } : r)));
  };

  const setHour = (key: string, dayIdx: number, value: number) => {
    setRows((prev) => prev.map((r) => {
      if (r.key !== key) return r;
      const hours = [...r.hours];
      hours[dayIdx] = value;
      return { ...r, hours };
    }));
  };

  const setRemark = (key: string, remark: string) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, remark } : r)));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payloadRows = rowsToPayload(rows);
        const payload = { weekStart: weekStartStr, rows: payloadRows };
        if (existingTs?.id) { await updateTimesheet(existingTs.id, payload); message.success('Updated'); }
        else { await saveTimesheet(payload); message.success('Saved'); }
        loadTs();
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to save');
      }
    });
  };

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName}>
        <Typography.Title level={3} className={pageTitleClassName}>
          <ClockCircleOutlined className={titleIconClassName} /> Timesheet
        </Typography.Title>
      </Flex>

      <Card className={cardClassName}>
        <Flex gap={16} wrap="wrap" className="mb-4" align="center" justify="space-between">
          <Flex gap={12} align="center">
            <DatePicker
              picker="month"
              value={month}
              onChange={(d) => {
                if (d) {
                  setMonth(d);
                  const m = getMonday(d.startOf('month').toDate());
                  setWeekStart(m);
                  setExistingTs(null);
                  setRows(defaultRows());
                }
              }}
              style={{ width: 160 }}
              allowClear={false}
            />
            <Button icon={<LeftOutlined />} size="small" onClick={goPrevWeek} disabled={weekIndex <= 0} />
            <Typography.Text strong className="text-[var(--text-primary)] text-sm" style={{ minWidth: 180, textAlign: 'center' }}>
              {formatDate(weekStart)} - {formatDate(weekEnd)}
            </Typography.Text>
            <Button icon={<RightOutlined />} size="small" onClick={goNextWeek} disabled={weekIndex >= weeksInMonth.length - 1} />
          </Flex>

          <Flex gap={12} align="center">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-4 py-1.5">
              <Typography.Text strong className="text-emerald-300">
                Total: {totalHours.toFixed(1)} / {STANDARD_WEEKLY_HOURS.toFixed(1)} hrs
              </Typography.Text>
            </div>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={isPending}>
              {existingTs?.id ? 'Update' : 'Save'}
            </Button>
          </Flex>
        </Flex>

        <Spin spinning={loading}>
        <div className="overflow-x-auto" style={{ marginTop: 20 }}>
          <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="border border-[var(--border)] bg-[var(--subtle-bg)] px-3 py-2 text-left text-[var(--text-secondary)]" style={{ width: 260 }}>
                  Project / Category
                </th>
                {DAY_LABELS.map((label, i) => {
                  const dateObj = new Date(weekStart);
                  dateObj.setDate(dateObj.getDate() + i);
                  return (
                    <th key={label} className="border border-[var(--border)] bg-[var(--subtle-bg)] px-2 py-2 text-center text-[var(--text-secondary)]" style={{ width: 90 }}>
                      <div>{label}</div>
                      <div className="text-xs font-normal text-[var(--text-very-muted)]">{dateObj.getDate()}</div>
                    </th>
                  );
                })}
                <th className="border border-[var(--border)] bg-[var(--subtle-bg)] px-2 py-2 text-left text-[var(--text-secondary)]" style={{ width: 180 }}>
                  Remark
                </th>
                <th className="border border-[var(--border)] bg-[var(--subtle-bg)] px-2 py-2 text-center text-[var(--text-secondary)]" style={{ width: 56 }} />
              </tr>
            </thead>
            <tbody>
              {rows.filter((r) => r.kind === 'project').map((row) => (
                <tr key={row.key}>
                  <td className="border border-[var(--border)] px-2 py-1.5">
                    <Select
                      className="w-full"
                      placeholder="Select project"
                      allowClear
                      value={row.projectId || undefined}
                      onChange={(val) => setProjectId(row.key, val || null)}
                      options={projects.map((p) => ({ label: p.name, value: p.id }))}
                      size="small"
                    />
                  </td>
                  {DAYS.map((_, dayIdx) => (
                    <td key={dayIdx} className="border border-[var(--border)] p-1 text-center">
                      <InputNumber
                        className="w-full!"
                        size="small"
                        min={0}
                        max={24}
                        step={0.5}
                        value={row.hours[dayIdx] || 0}
                        onChange={(v) => setHour(row.key, dayIdx, v ?? 0)}
                        variant="borderless"
                        style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}
                      />
                    </td>
                  ))}
                  <td className="border border-[var(--border)] p-1">
                    <Input
                      className="w-full"
                      size="small"
                      placeholder="Remark"
                      allowClear
                      maxLength={1000}
                      value={row.remark}
                      onChange={(e) => setRemark(row.key, e.target.value)}
                    />
                  </td>
                  <td className="border border-[var(--border)] text-center">
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeProjectRow(row.key)}
                    />
                  </td>
                </tr>
              ))}

              <tr>
                <td colSpan={10} className="border border-[var(--border)] p-1.5">
                  <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addProjectRow} block>
                    Add Project
                  </Button>
                </td>
              </tr>

              {rows.filter((r) => r.kind !== 'project').map((row) => (
                <tr key={row.key}>
                  <td className="border border-[var(--border)] px-3 py-1.5 text-[var(--text-muted)] italic">
                    {FIXED_CATEGORIES.find((c) => c.kind === row.kind)?.label}
                  </td>
                  {DAYS.map((_, dayIdx) => (
                    <td key={dayIdx} className="border border-[var(--border)] p-1 text-center">
                      <InputNumber
                        className="w-full!"
                        size="small"
                        min={0}
                        max={24}
                        step={0.5}
                        value={row.hours[dayIdx] || 0}
                        onChange={(v) => setHour(row.key, dayIdx, v ?? 0)}
                        variant="borderless"
                        style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}
                      />
                    </td>
                  ))}
                  <td className="border border-[var(--border)] p-1">
                    <Input
                      className="w-full"
                      size="small"
                      placeholder="Remark"
                      allowClear
                      maxLength={1000}
                      value={row.remark}
                      onChange={(e) => setRemark(row.key, e.target.value)}
                    />
                  </td>
                  <td className="border border-[var(--border)]" />
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="border border-[var(--border)] px-3 py-2 font-semibold text-[var(--text-secondary)]">Daily Total</td>
                {dayTotals.map((t, i) => (
                  <td
                    key={i}
                    className={`border border-[var(--border)] px-2 py-2 text-center font-semibold ${t > 24 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}
                  >
                    {t.toFixed(1)}
                  </td>
                ))}
                <td className="border border-[var(--border)]" />
                <td className="border border-[var(--border)]" />
              </tr>
            </tfoot>
          </table>
        </div>
        </Spin>

        <Typography.Text type="secondary" className="mt-2 block text-xs">
          Add a row per project — the same day can be split across multiple projects (e.g. 4 hrs on Project A and 4 hrs on Project B). Use Public Holiday, Idle Time or Leave for non-project days.
        </Typography.Text>
      </Card>
    </div>
  );
}
