'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  Button, Card, DatePicker, Flex, InputNumber, Select, Space, Table, Typography, App,
} from 'antd';
import { LeftOutlined, RightOutlined, SaveOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { saveTimesheet, updateTimesheet } from '@/actions/timesheet-attendance';
import type { Project, TimesheetRow } from '@/types/erp';
import { cardClassName, pageHeaderClassName, pageTitleClassName, titleIconClassName } from './ui';
import dayjs from 'dayjs';

const DAYS = ['monHours', 'tueHours', 'wedHours', 'thuHours', 'friHours', 'satHours', 'sunHours'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = { projects: Project[] };

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

export function TimesheetAttendanceClient({ projects }: Props) {
  const [month, setMonth] = useState<dayjs.Dayjs>(dayjs().startOf('month'));
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [existingTs, setExistingTs] = useState<any>(null);
  const [rows, setRows] = useState<TimesheetRow[]>([]);
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
    const idx = weekIndex;
    if (idx > 0) {
      setWeekStart(weeksInMonth[idx - 1]);
      setExistingTs(null); setRows([]); setSelectedIds([]);
    }
  };

  const goNextWeek = () => {
    const idx = weekIndex;
    if (idx < weeksInMonth.length - 1) {
      setWeekStart(weeksInMonth[idx + 1]);
      setExistingTs(null); setRows([]); setSelectedIds([]);
    }
  };

  const loadTs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/timesheet-attendance/current?weekStart=${weekStartStr}`);
      if (res.ok) {
        const data = await res.json();
        setExistingTs(data);
        if (data && data.rows) {
          setRows(data.rows.map((r: any) => ({
            id: r.id, projectId: r.projectId, entryType: r.entryType,
            monHours: Number(r.monHours), tueHours: Number(r.tueHours), wedHours: Number(r.wedHours),
            thuHours: Number(r.thuHours), friHours: Number(r.friHours), satHours: Number(r.satHours), sunHours: Number(r.sunHours),
          })));
          setSelectedIds(data.rows.map((r: any) => r.projectId).filter(Boolean));
        } else {
          setRows([]); setSelectedIds([]);
        }
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [weekStartStr]);

  useEffect(() => { loadTs(); }, [loadTs]);

  const builtRows = useMemo(() => {
    return selectedIds.map((pid) => rows.find((r) => r.projectId === pid)
      || { entryType: 'project', projectId: pid, monHours: 0, tueHours: 0, wedHours: 0, thuHours: 0, friHours: 0, satHours: 0, sunHours: 0 });
  }, [selectedIds, rows]);

  const updateCell = (idx: number, field: string, val: number | null) => {
    const r = builtRows[idx];
    const ri = rows.findIndex((x) => x.projectId === r.projectId);
    const v = val ?? 0;
    if (ri >= 0) {
      const copy = [...rows]; copy[ri] = { ...copy[ri], [field]: v }; setRows(copy);
    } else {
      setRows([...rows, { ...r, [field]: v } as TimesheetRow]);
    }
  };

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const d of DAYS) t[d] = builtRows.reduce((s, r) => s + Number((r as any)[d] || 0), 0);
    t.total = Object.values(t).reduce((s, v) => s + v, 0);
    return t;
  }, [builtRows]);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload = {
          weekStart: weekStartStr,
          rows: builtRows.map((r) => ({
            projectId: r.projectId || null, entryType: 'project',
            monHours: Number(r.monHours), tueHours: Number(r.tueHours), wedHours: Number(r.wedHours),
            thuHours: Number(r.thuHours), friHours: Number(r.friHours), satHours: Number(r.satHours), sunHours: Number(r.sunHours),
          })),
        };
        if (existingTs?.id) { await updateTimesheet(existingTs.id, payload); message.success('Updated'); }
        else { await saveTimesheet(payload); message.success('Saved'); }
        loadTs();
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to save');
      }
    });
  };

  const nameOf = (pid: string) => projects.find((p) => p.id === pid)?.name || pid;

  const columns: any[] = [
    {
      title: 'Project', key: 'name', width: 200, fixed: 'left',
      render: (_: any, __: any, idx: number) => {
        const pid = builtRows[idx]?.projectId;
        return <Typography.Text strong>{pid ? nameOf(pid) : '-'}</Typography.Text>;
      },
    },
    ...DAYS.map((field, di) => {
      const dateObj = new Date(weekStart);
      dateObj.setDate(dateObj.getDate() + di);
      return {
        title: <div className="text-center text-xs">{DAY_LABELS[di]}<br/><span className="text-slate-500">{dateObj.getDate()}</span></div>,
        key: field, width: 90,
        render: (_: any, __: any, idx: number) => {
          const val = Number((builtRows[idx] as any)[field] || 0);
          return (
            <InputNumber
              className="w-full!"
              size="small" min={0} max={24} step={0.5}
              value={val}
              onChange={(v) => updateCell(idx, field, v)}
              variant="borderless"
              style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}
            />
          );
        },
      };
    }),
    {
      title: 'Total', key: 'rowTotal', width: 80,
      render: (_: any, __: any, idx: number) => {
        const r = builtRows[idx];
        if (!r) return <Typography.Text className="block text-center text-sm font-semibold">0.0</Typography.Text>;
        const t = DAYS.reduce((s, d) => s + Number((r as any)[d] || 0), 0);
        return <Typography.Text className="block text-center text-sm font-semibold">{t.toFixed(1)}</Typography.Text>;
      },
    },
  ];

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
                  setExistingTs(null); setRows([]); setSelectedIds([]);
                }
              }}
              style={{ width: 160 }}
              allowClear={false}
            />
            <Button icon={<LeftOutlined />} size="small" onClick={goPrevWeek} disabled={weekIndex <= 0} />
            <Typography.Text strong className="text-slate-200 text-sm" style={{ minWidth: 180, textAlign: 'center' }}>
              {formatDate(weekStart)} - {formatDate(weekEnd)}
            </Typography.Text>
            <Button icon={<RightOutlined />} size="small" onClick={goNextWeek} disabled={weekIndex >= weeksInMonth.length - 1} />
          </Flex>

          <Flex gap={12} align="center" style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Select
              mode="multiple"
              placeholder="Select projects"
              value={selectedIds}
              onChange={(vals) => {
                setSelectedIds(vals);
                setRows((prev) => prev.filter((r) => r.projectId && vals.includes(r.projectId)));
              }}
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
              style={{ minWidth: 280 }}
              loading={loading}
            />
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={isPending} disabled={selectedIds.length === 0}>
              {existingTs?.id ? 'Update' : 'Save'}
            </Button>
          </Flex>
        </Flex>

        <div className="overflow-x-auto">
          <Table
            dataSource={builtRows.map((_, i) => ({ key: i }))}
            columns={columns}
            rowKey="key"
            size="small"
            pagination={false}
            bordered
            scroll={{ x: 900 }}
            loading={loading}
          />

          <Table
            dataSource={[{ key: 'total-row' }]}
            columns={[
              { title: '', key: 'name', width: 200, render: () => <Typography.Text strong>Week Total</Typography.Text> },
              ...DAYS.map((field) => ({
                title: '', key: field, width: 90,
                render: () => <Typography.Text className="block text-center font-bold text-sky-400">{totals[field].toFixed(1)}</Typography.Text>,
              })),
              { title: '', key: 'grand', width: 80, render: () => <Typography.Text className="block text-center font-bold text-green-400">{totals.total.toFixed(1)}</Typography.Text> },
            ]}
            rowKey="key"
            size="small"
            pagination={false}
            showHeader={false}
            bordered
          />
        </div>

        <Typography.Text type="secondary" className="mt-2 block text-xs">
          Public holiday or leave? Just enter <strong>0</strong> for that day.
        </Typography.Text>
      </Card>
    </div>
  );
}
