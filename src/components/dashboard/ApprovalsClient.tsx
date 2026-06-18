'use client';

import { useMemo, useState, useTransition } from 'react';
import { App, Button, Card, Col, DatePicker, Flex, Input, Row, Select, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarOutlined, CameraOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, EyeOutlined, FileDoneOutlined, FilePdfOutlined, FilterOutlined, SearchOutlined, WalletOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SubcontractWorkOrderPdf } from './SubcontractWorkOrderPdf';
import { getApiBaseUrl } from '@/lib/api-url';
import dayjs from 'dayjs';
import { updateBillStatus } from '@/actions/invoices';
import { updateExpenseStatus } from '@/actions/expenses';
import { updateSubcontractWorkOrderStatus } from '@/actions/subcontract-work-orders';
import { updatePurchaseOrderStatus } from '@/actions/purchase-orders';
import { updateDailyLabourReportStatus } from '@/actions/daily-labour';
import type { PurchaseBill, Expense, PurchaseOrder, SubcontractWorkOrder, DailyLabourReport } from '@/types/erp';
import {
  StatusTag,
  cardClassName,
  formatCurrency,
  formatDate,
  pageHeaderClassName,
  pageTitleClassName,
  titleIconClassName,
} from './ui';

const { Title } = Typography;

const EXPENSE_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Admin Approved', value: 'admin_approved' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const BILL_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Admin Approved', value: 'admin_approved' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const PURCHASE_ORDER_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Admin Approved', value: 'admin_approved' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

type Props = {
  bills: PurchaseBill[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  subcontractWorkOrders: SubcontractWorkOrder[];
  dailyReports: DailyLabourReport[];
};

export function ApprovalsClient({ bills, expenses, purchaseOrders, subcontractWorkOrders, dailyReports }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('expenses');
  const { message } = App.useApp();

  const filteredExpenses = useMemo(() => {
    const from = dateRange[0]?.format('YYYY-MM-DD');
    const to = dateRange[1]?.format('YYYY-MM-DD');
    return expenses.filter((e) => {
      if (from && to) {
        const d = typeof e.expenseDate === 'string' ? e.expenseDate.split('T')[0] : '';
        if (d < from || d > to) return false;
      }
      if (statusFilter && e.status !== statusFilter) return false;
      if (searchText && !e.description?.toLowerCase().includes(searchText.toLowerCase()) && !e.category?.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [expenses, dateRange, searchText, statusFilter]);

  const filteredBills = useMemo(() => {
    const from = dateRange[0]?.format('YYYY-MM-DD');
    const to = dateRange[1]?.format('YYYY-MM-DD');
    return bills.filter((b) => {
      if (from && to) {
        const d = typeof b.billDate === 'string' ? b.billDate.split('T')[0] : '';
        if (d < from || d > to) return false;
      }
      if (statusFilter && b.status !== statusFilter) return false;
      if (searchText && !b.billNumber?.toLowerCase().includes(searchText.toLowerCase()) && !b.vendor?.name?.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [bills, dateRange, searchText, statusFilter]);

  const handleExpenseStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updateExpenseStatus(id, status);
        message.success('Expense status updated');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to update status');
      }
    });
  };

  const handleBillStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updateBillStatus(id, status);
        message.success('Bill status updated');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to update status');
      }
    });
  };

  const handleSwoStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updateSubcontractWorkOrderStatus(id, status);
        message.success('Subcontract WO status updated');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to update status');
      }
    });
  };

  const handlePoStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updatePurchaseOrderStatus(id, status);
        message.success('Purchase Order status updated');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to update status');
      }
    });
  };

  const filteredPurchaseOrders = useMemo(() => {
    const from = dateRange[0]?.format('YYYY-MM-DD');
    const to = dateRange[1]?.format('YYYY-MM-DD');
    return purchaseOrders.filter((po) => {
      if (from && to) {
        const d = typeof po.createdAt === 'string' ? po.createdAt.split('T')[0] : '';
        if (d < from || d > to) return false;
      }
      if (statusFilter && po.status !== statusFilter) return false;
      if (searchText && !po.poNumber?.toLowerCase().includes(searchText.toLowerCase()) && !po.vendor?.name?.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [purchaseOrders, dateRange, searchText, statusFilter]);

  const poCounts = useMemo(() => ({
    pending: filteredPurchaseOrders.filter((po) => po.status === 'pending').length,
    admin_approved: filteredPurchaseOrders.filter((po) => po.status === 'admin_approved').length,
    approved: filteredPurchaseOrders.filter((po) => po.status === 'approved').length,
    rejected: filteredPurchaseOrders.filter((po) => po.status === 'rejected').length,
  }), [filteredPurchaseOrders]);

  const handleDailyStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updateDailyLabourReportStatus(id, status);
        message.success('Daily report status updated');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to update status');
      }
    });
  };

  const filteredDaily = useMemo(() => {
    const from = dateRange[0]?.format('YYYY-MM-DD');
    const to = dateRange[1]?.format('YYYY-MM-DD');
    return dailyReports.filter((r) => {
      if (from && to) {
        const d = typeof r.reportDate === 'string' ? r.reportDate.split('T')[0] : '';
        if (d < from || d > to) return false;
      }
      if (statusFilter && r.status !== statusFilter) return false;
      if (searchText && !r.project?.name?.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [dailyReports, dateRange, searchText, statusFilter]);

  const dailyCounts = useMemo(() => ({
    pending: filteredDaily.filter((r) => r.status === 'pending').length,
    admin_approved: filteredDaily.filter((r) => r.status === 'admin_approved').length,
    approved: filteredDaily.filter((r) => r.status === 'approved').length,
    rejected: filteredDaily.filter((r) => r.status === 'rejected').length,
  }), [filteredDaily]);

  const dailyColumns: ColumnsType<DailyLabourReport> = [
    { title: '#', key: 'sno', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Date', dataIndex: 'reportDate', render: formatDate },
    {
      title: 'Project',
      key: 'project',
      render: (_, record) => record.project?.name || '-',
    },
    {
      title: 'Headcount',
      key: 'headcount',
      render: (_, record) => record.workers?.reduce((s, w) => s + Number(w.count || 1), 0) || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/dashboard/daily-labour/${record.id}`)}
          title="View Details"
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, record) => (
        <Select
          defaultValue={record.status || 'pending'}
          size="small"
          variant="borderless"
          className="w-full"
          onChange={(newStatus) => handleDailyStatusChange(record.id, newStatus)}
          options={EXPENSE_STATUS_OPTIONS}
          popupMatchSelectWidth={false}
          disabled={isPending}
        />
      ),
    },
  ];

  const poColumns: ColumnsType<PurchaseOrder> = [
    { title: '#', key: 'sno', width: 50, render: (_, __, i) => i + 1 },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
    },
    {
      title: 'Vendor',
      key: 'vendor',
      render: (_, record) => record.vendor?.name || '-',
    },
    {
      title: 'Project',
      key: 'project',
      render: (_, record) => record.project?.name || '-',
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      align: 'right',
      render: (value) => `₹${Number(value).toLocaleString()}`,
    },
    {
      title: 'Quotation Bill',
      key: 'billFile',
      width: 120,
      render: (_, record) =>
        record.billFileUrl ? (
          <Button type="link" size="small" icon={<FilePdfOutlined />} href={record.billFileUrl} target="_blank">
            View Bill
          </Button>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render: formatDate,
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, record) => (
        <Select
          defaultValue={record.status || 'pending'}
          size="small"
          variant="borderless"
          className="w-full"
          onChange={(newStatus) => handlePoStatusChange(record.id, newStatus)}
          options={PURCHASE_ORDER_STATUS_OPTIONS}
          popupMatchSelectWidth={false}
          disabled={isPending}
        />
      ),
    },
  ];

  const expenseColumns: ColumnsType<Expense> = [
    { title: '#', key: 'sno', width: 50, render: (_, __, i) => i + 1 },
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      render: formatDate,
    },
    {
      title: 'Expense Type',
      key: 'expenseType',
      render: (_, record) => record.expenseType?.name || record.category || '-',
    },
    {
      title: 'Project',
      key: 'project',
      render: (_, record) => record.project?.name || '-',
    },
    {
      title: 'Trade',
      key: 'trade',
      render: (_, record) => record.trade?.name || '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      render: formatCurrency,
    },
    {
      title: 'Receipts',
      key: 'receipts',
      width: 90,
      render: (_, record) =>
        record.receiptUrls?.length ? (
          <Flex gap={4} wrap="wrap">
            {record.receiptUrls.map((url, i) => (
              <Button key={i} type="link" size="small" icon={<FilePdfOutlined />} href={`${getApiBaseUrl().replace('/api/v1', '')}${url}`} target="_blank" />
            ))}
          </Flex>
        ) : '-',
    },
    {
      title: 'Site Photos',
      key: 'photos',
      width: 110,
      render: (_, record) =>
        record.sitePhotoUrls?.length ? (
          <Flex gap={4} wrap="wrap">
            {record.sitePhotoUrls.map((url, i) => (
              <Button key={i} type="link" size="small" icon={<CameraOutlined />} href={`${getApiBaseUrl().replace('/api/v1', '')}${url}`} target="_blank" />
            ))}
          </Flex>
        ) : '-',
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, record) => (
        <Select
          defaultValue={record.status || 'pending'}
          size="small"
          variant="borderless"
          className="w-full"
          onChange={(newStatus) => handleExpenseStatusChange(record.id, newStatus)}
          options={EXPENSE_STATUS_OPTIONS}
          popupMatchSelectWidth={false}
          disabled={isPending}
        />
      ),
    },
  ];

  const billColumns: ColumnsType<PurchaseBill> = [
    { title: '#', key: 'sno', width: 50, render: (_, __, i) => i + 1 },
    {
      title: 'Date',
      dataIndex: 'billDate',
      render: formatDate,
    },
    {
      title: 'Bill No',
      dataIndex: 'billNumber',
    },
    {
      title: 'Vendor',
      key: 'vendor',
      render: (_, record) => record.vendor?.name || '-',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      render: formatCurrency,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/dashboard/accounts/bills/${record.id}`)}
          title="View Details"
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, record) => (
        <Select
          defaultValue={record.status || 'pending'}
          size="small"
          variant="borderless"
          className="w-full"
          onChange={(newStatus) => handleBillStatusChange(record.id, newStatus)}
          options={BILL_STATUS_OPTIONS}
          popupMatchSelectWidth={false}
          disabled={isPending}
        />
      ),
    },
  ];

  const expenseCounts = useMemo(() => ({
    pending: filteredExpenses.filter((e) => e.status === 'pending').length,
    admin_approved: filteredExpenses.filter((e) => e.status === 'admin_approved').length,
    approved: filteredExpenses.filter((e) => e.status === 'approved').length,
    rejected: filteredExpenses.filter((e) => e.status === 'rejected').length,
  }), [filteredExpenses]);

  const billCounts = useMemo(() => ({
    pending: filteredBills.filter((b) => b.status === 'pending').length,
    admin_approved: filteredBills.filter((b) => b.status === 'admin_approved').length,
    approved: filteredBills.filter((b) => b.status === 'approved').length,
    rejected: filteredBills.filter((b) => b.status === 'rejected').length,
  }), [filteredBills]);

  const filteredSwo = useMemo(() => {
    const from = dateRange[0]?.format('YYYY-MM-DD');
    const to = dateRange[1]?.format('YYYY-MM-DD');
    return subcontractWorkOrders.filter((swo) => {
      if (from && to) {
        const d = typeof swo.createdAt === 'string' ? swo.createdAt.split('T')[0] : '';
        if (d < from || d > to) return false;
      }
      if (statusFilter && swo.status !== statusFilter) return false;
      if (searchText && !swo.woNumber?.toLowerCase().includes(searchText.toLowerCase()) && !swo.subcontractor?.name?.toLowerCase().includes(searchText.toLowerCase()) && !swo.description?.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [subcontractWorkOrders, dateRange, searchText, statusFilter]);

  const swoCounts = useMemo(() => ({
    pending: filteredSwo.filter((s) => s.status === 'pending').length,
    admin_approved: filteredSwo.filter((s) => s.status === 'admin_approved').length,
    approved: filteredSwo.filter((s) => s.status === 'approved').length,
    rejected: filteredSwo.filter((s) => s.status === 'rejected').length,
  }), [filteredSwo]);

  const swoColumns: ColumnsType<SubcontractWorkOrder> = [
    { title: '#', key: 'sno', width: 50, render: (_, __, i) => i + 1 },
    {
      title: 'WO Number',
      dataIndex: 'woNumber',
      width: 120,
      render: (value) => <span className="whitespace-nowrap">{value}</span>,
    },
    {
      title: 'Subcontractor',
      key: 'subcontractor',
      width: 160,
      render: (_, record) => <span className="whitespace-nowrap">{record.subcontractor?.name || '-'}</span>,
    },
    {
      title: 'Project',
      key: 'project',
      width: 160,
      render: (_, record) => <span className="whitespace-nowrap">{record.project?.name || '-'}</span>,
    },
    {
      title: 'Description of Work',
      dataIndex: 'description',
      ellipsis: true,
      width: 200,
      render: (value) => <span className="whitespace-nowrap">{value || '-'}</span>,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      width: 80,
      render: (value) => <span className="whitespace-nowrap">{Number(value).toLocaleString()}</span>,
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      width: 70,
      render: (value) => <span className="whitespace-nowrap">{value}</span>,
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      align: 'right',
      width: 110,
      render: (value) => <span className="whitespace-nowrap">₹{Number(value).toLocaleString()}</span>,
    },
    {
      title: 'Basic Amt',
      dataIndex: 'amount',
      align: 'right',
      width: 120,
      render: (value) => <span className="whitespace-nowrap">₹{Number(value).toLocaleString()}</span>,
    },
    {
      title: 'GST %',
      dataIndex: 'gstPercentage',
      align: 'right',
      width: 70,
      render: (value) => <span className="whitespace-nowrap">{value}%</span>,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      align: 'right',
      width: 120,
      render: (value) => <span className="whitespace-nowrap">₹{Number(value).toLocaleString()}</span>,
    },
    {
      title: 'PDF',
      key: 'pdf',
      width: 60,
      render: (_, record) => (
        <PDFDownloadLink
          document={<SubcontractWorkOrderPdf workOrder={record} />}
          fileName={`${record.woNumber || record.id}.pdf`}
        >
          {({ loading }) => (
            <Button
              type="text"
              size="small"
              icon={<FilePdfOutlined className="text-red-500" />}
              loading={loading}
              title="Download PDF"
            />
          )}
        </PDFDownloadLink>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, record) => (
        <Select
          defaultValue={record.status || 'pending'}
          size="small"
          variant="borderless"
          className="w-full whitespace-nowrap"
          onChange={(newStatus) => handleSwoStatusChange(record.id, newStatus)}
          options={EXPENSE_STATUS_OPTIONS}
          popupMatchSelectWidth={false}
          disabled={isPending}
        />
      ),
    },
  ];

  const renderContent = (
    counts: { pending: number; admin_approved: number; approved: number; rejected: number },
    dataSource: any[],
    columns: ColumnsType<any>,
    emptyText: string,
  ) => (
    <>
      <Row gutter={16} className="mb-4">
        <Col xs={12} sm={6} md={4} lg={3}>
          <Card size="small" className="border! border-amber-500/20! bg-amber-500/5!">
            <Statistic
              title={<Tag color="warning">Pending</Tag>}
              value={counts.pending}
              prefix={<ClockCircleOutlined className="text-amber-500" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4} lg={3}>
          <Card size="small" className="border! border-purple-500/20! bg-purple-500/5!">
            <Statistic
              title={<Tag color="purple">Admin Approved</Tag>}
              value={counts.admin_approved}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4} lg={3}>
          <Card size="small" className="border! border-emerald-500/20! bg-emerald-500/5!">
            <Statistic
              title={<Tag color="success">Approved</Tag>}
              value={counts.approved}
              prefix={<CheckCircleOutlined className="text-emerald-500" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4} lg={3}>
          <Card size="small" className="border! border-red-500/20! bg-red-500/5!">
            <Statistic
              title={<Tag color="error">Rejected</Tag>}
              value={counts.rejected}
              prefix={<CloseCircleOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
      </Row>
      <div className="flex flex-col gap-4">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined className="text-slate-400" />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Filter by status"
              className="w-full"
              value={statusFilter || undefined}
              onChange={(val) => setStatusFilter(val || '')}
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Admin Approved', value: 'admin_approved' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ]}
            />
          </Col>
        </Row>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
        locale={{ emptyText }}
      />
      </div>
    </>
  );

  return (
    <div style={{ marginBottom: 80 }}>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Title level={3} className={pageTitleClassName}>
          <CheckCircleOutlined className={titleIconClassName} /> Approvals
        </Title>
        <DatePicker.RangePicker
          value={dateRange[0] || dateRange[1] ? dateRange : [null, null]}
          onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : [null, null])}
          allowClear
          placeholder={['From date', 'To date']}
        />
      </Flex>

      <Card className={cardClassName}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setSearchText(''); setStatusFilter(''); }}
          items={[
            {
              key: 'expenses',
              label: <span><WalletOutlined /> Expenses</span>,
              children: renderContent(expenseCounts, filteredExpenses, expenseColumns, 'No expenses pending approval'),
            },
            {
              key: 'bills',
              label: <span><FileDoneOutlined /> Purchase Bills</span>,
              children: renderContent(billCounts, filteredBills, billColumns, 'No purchase bills'),
            },
            {
              key: 'swo',
              label: <span><FileDoneOutlined /> Subcontract Work Orders</span>,
              children: renderContent(swoCounts, filteredSwo, swoColumns, 'No subcontract work orders'),
            },
            {
              key: 'po',
              label: <span><FileDoneOutlined /> Purchase Orders</span>,
              children: renderContent(poCounts, filteredPurchaseOrders, poColumns, 'No purchase orders'),
            },
            {
              key: 'daily',
              label: <span><CalendarOutlined /> Daily Labour List</span>,
              children: renderContent(dailyCounts, filteredDaily, dailyColumns, 'No daily labour reports'),
            },
          ]}
        />
      </Card>
    </div>
  );
}
