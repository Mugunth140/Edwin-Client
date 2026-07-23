'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  Button, Card, DatePicker, Flex, InputNumber, Select, Table, Typography, App,
} from 'antd';
import { LeftOutlined, RightOutlined, SaveOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { saveTimesheet, updateTimesheet } from '@/actions/timesheet-attendance';
import type { Project, TimesheetRow } from '@/types/erp';
import { cardClassName, pageHeaderClassName, pageTitleClassName, titleIconClassName } from './ui';
import dayjs from 'dayjs';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS = ['monHours', 'tueHours', 'wedHours', 'thuHours', 'friHours', 'satHours', 'sunHours'] as const;

type Props = { projects: Project[] };

type DayEntry = {
  day: number;
  projectId: string | null;
  hours: number;
};

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

function rowsToDayEntries(rows: TimesheetRow[]): DayEntry[] {
  const days: DayEntry[] = Array.from({ length: 7 }, (_, i) => ({ day: i, projectId: null, hours: 0 }));
  for (const row of rows) {
    for (let d = 0; d < 7; d++) {
      const h = Number((row as any)[DAYS[d]] || 0);
      if (h > 0) {
        days[d] = { day: d, projectId: row.projectId || null, hours: h };
      }
    }
  }
  return days;
}

function dayEntriesToRows(entries: DayEntry[], existingIdMap?: Map<string, string>): any[] {
  const projectMap = new Map<string, Record<string, number>>();
  for (const entry of entries) {
    if (!entry.projectId) continue;
    if (!projectMap.has(entry.projectId)) {
      projectMap.set(entry.projectId, { monHours: 0, tueHours: 0, wedHours: 0, thuHours: 0, friHours: 0, satHours: 0, sunHours: 0 });
    }
    const dayField = DAYS[entry.day];
    projectMap.get(entry.projectId)![dayField] = (projectMap.get(entry.projectId)![dayField] || 0) + entry.hours;
  }
  return Array.from(projectMap.entries()).map(([projectId, hours]) => ({
    ...(existingIdMap?.has(projectId) ? { id: existingIdMap.get(projectId) } : {}),
    projectId,
    entryType: 'project',
    ...hours,
  }));
}

export function TimesheetAttendanceClient({ projects }: Props) {
  const [month, setMonth] = useState<dayjs.Dayjs>(dayjs().startOf('month'));
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [existingTs, setExistingTs] = useState<any>(null);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>(Array.from({ length: 7 }, (_, i) => ({ day: i, projectId: null, hours: 0 })));
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
      setExistingTs(null);
      setDayEntries(Array.from({ length: 7 }, (_, i) => ({ day: i, projectId: null, hours: 0 })));
    }
  };

  const goNextWeek = () => {
    const idx = weekIndex;
    if (idx < weeksInMonth.length - 1) {
      setWeekStart(weeksInMonth[idx + 1]);
      setExistingTs(null);
      setDayEntries(Array.from({ length: 7 }, (_, i) => ({ day: i, projectId: null, hours: 0 })));
    }
  };

  const loadTs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/timesheet-attendance/current?weekStart=${weekStartStr}`);
      if (res.ok) {
        const data = await res.json();
        setExistingTs(data);
        if (data && data.rows && data.rows.length > 0) {
          setDayEntries(rowsToDayEntries(data.rows));
        } else {
          setDayEntries(Array.from({ length: 7 }, (_, i) => ({ day: i, projectId: null, hours: 0 })));
        }
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [weekStartStr]);

  useEffect(() => { loadTs(); }, [loadTs]);

  const totalHours = useMemo(() => dayEntries.reduce((s, e) => s + e.hours, 0), [dayEntries]);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const existingIdMap = existingTs?.rows
          ? new Map<string, string>(existingTs.rows.filter((r: any) => r.projectId).map((r: any) => [r.projectId, r.id]))
          : undefined;
        const rows = dayEntriesToRows(dayEntries, existingIdMap);
        const payload = { weekStart: weekStartStr, rows };
        if (existingTs?.id) { await updateTimesheet(existingTs.id, payload); message.success('Updated'); }
        else { await saveTimesheet(payload); message.success('Saved'); }
        loadTs();
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to save');
      }
    });
  };

  const columns: any[] = [
    {
      title: 'Day', key: 'day', width: 60,
      render: (_: any, __: any, idx: number) => {
        const dateObj = new Date(weekStart);
        dateObj.setDate(dateObj.getDate() + idx);
        return (
          <div>
            <Typography.Text strong className="text-slate-200">{DAY_LABELS[idx]}</Typography.Text>
            <Typography.Text className="ml-1 text-xs text-slate-500">{dateObj.getDate()}</Typography.Text>
          </div>
        );
      },
    },
    {
      title: 'Project', key: 'project', width: 280,
      render: (_: any, __: any, idx: number) => (
        <Select
          className="w-full"
          placeholder="Select project"
          allowClear
          value={dayEntries[idx]?.projectId || undefined}
          onChange={(val) => {
            const copy = [...dayEntries];
            copy[idx] = { ...copy[idx], projectId: val || null };
            setDayEntries(copy);
          }}
          options={projects.map((p) => ({ label: p.name, value: p.id }))}
          size="small"
        />
      ),
    },
    {
      title: 'Hours', key: 'hours', width: 100,
      render: (_: any, __: any, idx: number) => (
        <InputNumber
          className="w-full!"
          size="small"
          min={0} max={24} step={0.5}
          value={dayEntries[idx]?.hours || 0}
          onChange={(v) => {
            const copy = [...dayEntries];
            copy[idx] = { ...copy[idx], hours: v ?? 0 };
            setDayEntries(copy);
          }}
          variant="borderless"
          style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}
        />
      ),
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
                  setExistingTs(null);
                  setDayEntries(Array.from({ length: 7 }, (_, i) => ({ day: i, projectId: null, hours: 0 })));
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

          <Flex gap={12} align="center">
            <Typography.Text strong className="text-sky-400">
              Total: {totalHours.toFixed(1)} hrs
            </Typography.Text>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={isPending}>
              {existingTs?.id ? 'Update' : 'Save'}
            </Button>
          </Flex>
        </Flex>

        <div className="overflow-x-auto">
          <Table
            dataSource={dayEntries.map((_, i) => ({ key: i }))}
            columns={columns}
            rowKey="key"
            size="middle"
            pagination={false}
            bordered
            loading={loading}
          />
        </div>

        <Typography.Text type="secondary" className="mt-2 block text-xs">
          Public holiday or leave? Just leave hours as <strong>0</strong> and project empty for that day.
        </Typography.Text>
      </Card>
    </div>
  );
}
