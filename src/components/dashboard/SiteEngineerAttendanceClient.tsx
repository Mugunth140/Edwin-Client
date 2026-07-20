'use client';

import { useMemo, useState, useTransition } from 'react';
import { App, Button, Card, DatePicker, Flex, Input, Select, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import type { WeeklyTimesheet, Project } from '@/types/erp';
import { useRouter } from 'next/navigation';
import { verifyTimesheet, approveTimesheet, rejectTimesheet } from '@/actions/timesheet-approval';
import { cardClassName, formatCurrency, formatDate, pageHeaderClassName, pageTitleClassName, titleIconClassName } from './ui';
import dayjs from 'dayjs';

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Admin Approved', value: 'admin_approved' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const TAB_ROLES = [
  { key: 'site_engineer', label: 'Site Engineer' },
  { key: 'purchase_team', label: 'Purchase Team' },
];

type Props = {
  projects: Project[];
  timesheets: WeeklyTimesheet[];
};

export function SiteEngineerAttendanceClient({ projects, timesheets }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [engineerFilter, setEngineerFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [activeTab, setActiveTab] = useState('site_engineer');
  const { message } = App.useApp();

  const timesheetsByRole = useMemo(() => {
    const map: Record<string, WeeklyTimesheet[]> = { site_engineer: [], purchase_team: [] };
    for (const ts of timesheets) {
      const role = ts.siteEngineer?.role || '';
      if (map[role]) map[role].push(ts);
    }
    return map;
  }, [timesheets]);

  const currentList = timesheetsByRole[activeTab] || [];

  const engineers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const ts of currentList) {
      if (ts.siteEngineer && !map.has(ts.siteEngineer.id)) {
        map.set(ts.siteEngineer.id, { id: ts.siteEngineer.id, name: ts.siteEngineer.name });
      }
    }
    return Array.from(map.values());
  }, [currentList]);

  const filtered = useMemo(() => {
    const from = dateRange[0]?.format('YYYY-MM-DD');
    const to = dateRange[1]?.format('YYYY-MM-DD');
    return currentList.filter((ts) => {
      if (statusFilter && ts.status !== statusFilter) return false;
      if (engineerFilter && ts.siteEngineerId !== engineerFilter) return false;
      if (from && to) {
        const d = typeof ts.weekStart === 'string' ? ts.weekStart.split('T')[0] : '';
        if (d < from || d > to) return false;
      }
      if (searchText) {
        const name = ts.siteEngineer?.name?.toLowerCase() || '';
        const email = ts.siteEngineer?.email?.toLowerCase() || '';
        if (!name.includes(searchText.toLowerCase()) && !email.includes(searchText.toLowerCase())) return false;
      }
      return true;
    });
  }, [currentList, dateRange, searchText, statusFilter, engineerFilter]);

  const handleVerify = (id: string) => {
    startTransition(async () => {
      try { await verifyTimesheet(id); message.success('Timesheet verified'); } catch (e: any) { message.error(e.message); }
    });
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try { await approveTimesheet(id); message.success('Timesheet approved & payment created'); } catch (e: any) { message.error(e.message); }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      try { await rejectTimesheet(id); message.success('Timesheet rejected'); } catch (e: any) { message.error(e.message); }
    });
  };

  const calcCost = (ts: WeeklyTimesheet) => {
    const avgCostPerHr = Number(ts.siteEngineer?.salaryGrade?.avgCostPerHr || 0);
    return Number(ts.totalHours || 0) * avgCostPerHr;
  };

  const columns: ColumnsType<WeeklyTimesheet> = [
    {
      title: 'Engineer', key: 'engineer', width: 200,
      render: (_, record) => (
        <Flex align="center" gap={6}>
          <UserOutlined className="text-sky-400" />
          <Typography.Text strong className="text-slate-200">{record.siteEngineer?.name || record.siteEngineerId}</Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Email', key: 'email', width: 200,
      render: (_, record) => (
        <Typography.Text className="text-slate-400 text-sm">{record.siteEngineer?.email || '-'}</Typography.Text>
      ),
    },
    {
      title: 'Week', key: 'week', width: 220,
      render: (_, record) => (
        <Typography.Text className="text-slate-300">{formatDate(record.weekStart)} - {formatDate(record.weekEnd)}</Typography.Text>
      ),
    },
    {
      title: 'Total Hours', dataIndex: 'totalHours', width: 120, align: 'right',
      render: (v) => <Typography.Text strong className="text-sky-300">{Number(v || 0).toFixed(1)} hrs</Typography.Text>,
    },
    {
      title: 'Total Cost', key: 'cost', width: 120, align: 'right',
      render: (_, record) => <Typography.Text className="text-emerald-400">{formatCurrency(calcCost(record))}</Typography.Text>,
    },
    {
      title: 'Projects', key: 'projects', width: 200, ellipsis: true,
      render: (_, record) => {
        const names = record.rows
          ?.filter((r) => r.projectId)
          .map((r) => projects.find((p) => p.id === r.projectId)?.name)
          .filter(Boolean)
          .join(', ');
        return <Typography.Text className="text-slate-400 text-xs">{names || '-'}</Typography.Text>;
      },
    },
    {
      title: 'Status', key: 'status', width: 150,
      render: (_, record) => {
        const color: Record<string, string> = { pending: 'orange', verified: 'purple', admin_approved: 'blue', approved: 'green', rejected: 'red' };
        return (
          <Select
            value={record.status}
            size="small"
            variant="borderless"
            className="w-full"
            style={{ color: color[record.status] || undefined, fontWeight: 600 }}
            onChange={(newStatus) => {
              if (newStatus === record.status) return;
              if (newStatus === 'verified') handleVerify(record.id);
              else if (newStatus === 'admin_approved' || newStatus === 'approved') handleApprove(record.id);
              else if (newStatus === 'rejected') handleReject(record.id);
            }}
            options={STATUS_OPTIONS.filter((o) => o.value)}
            popupMatchSelectWidth={false}
            disabled={isPending}
          />
        );
      },
    },
    {
      title: 'Actions', key: 'actions', width: 100,
      render: (_, record) => (
        <Flex gap={4} wrap="wrap">
          <Button size="small" icon={<EyeOutlined />} onClick={() => router.push(`/dashboard/timesheet-attendance`)}>
            View
          </Button>
        </Flex>
      ),
    },
  ];

  const renderTable = (dataSource: WeeklyTimesheet[]) => (
    <>
      <Flex gap={12} wrap="wrap" className="mb-4" align="center">
        <Input.Search
          placeholder="Search..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined className="text-slate-400" />}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          placeholder="Engineer"
          className="w-44"
          value={engineerFilter || undefined}
          onChange={(val) => setEngineerFilter(val || '')}
          options={engineers.map((e) => ({ label: e.name, value: e.id }))}
        />
        <Select
          allowClear
          placeholder="Status"
          className="w-36"
          value={statusFilter || undefined}
          onChange={(val) => setStatusFilter(val || '')}
          options={STATUS_OPTIONS}
        />
        <DatePicker.RangePicker
          value={dateRange[0] || dateRange[1] ? dateRange : [null, null]}
          onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : [null, null])}
          allowClear
          placeholder={['From', 'To']}
        />
      </Flex>

      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `${t} timesheets` }}
        scroll={{ x: 1400 }}
        locale={{ emptyText: 'No timesheets found' }}
      />
    </>
  );

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName}>
        <Typography.Title level={3} className={pageTitleClassName}>
          <TeamOutlined className={titleIconClassName} /> Attendance
        </Typography.Title>
      </Flex>

      <Card className={cardClassName}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setSearchText(''); setStatusFilter(''); setEngineerFilter(''); }}
          items={TAB_ROLES.map((tab) => ({
            key: tab.key,
            label: tab.label,
            children: renderTable(filtered),
          }))}
        />
      </Card>
    </div>
  );
}
