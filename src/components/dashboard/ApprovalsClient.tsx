'use client';

import { useMemo, useState, useTransition } from 'react';
import { App, Card, Col, DatePicker, Flex, Row, Select, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, FileDoneOutlined, FilterOutlined, WalletOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { updateBillStatus } from '@/actions/invoices';
import { updateExpenseStatus } from '@/actions/expenses';
import type { PurchaseBill, Expense } from '@/types/erp';
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
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const BILL_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

type Props = {
  bills: PurchaseBill[];
  expenses: Expense[];
};

export function ApprovalsClient({ bills, expenses }: Props) {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const { message } = App.useApp();

  const filteredExpenses = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return expenses;
    return expenses.filter((e) => {
      const d = dayjs(e.expenseDate);
      return d.isAfter(dateRange[0]!.startOf('day')) && d.isBefore(dateRange[1]!.endOf('day'));
    });
  }, [expenses, dateRange]);

  const filteredBills = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return bills;
    return bills.filter((b) => {
      const d = dayjs(b.billDate);
      return d.isAfter(dateRange[0]!.startOf('day')) && d.isBefore(dateRange[1]!.endOf('day'));
    });
  }, [bills, dateRange]);

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

  const expenseColumns: ColumnsType<Expense> = [
    { title: '#', key: 'sno', width: 50, render: (_, __, i) => i + 1 },
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      render: formatDate,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (val) => (val ? <StatusTag value={val} /> : '-'),
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
    approved: filteredExpenses.filter((e) => e.status === 'approved').length,
    rejected: filteredExpenses.filter((e) => e.status === 'rejected').length,
  }), [filteredExpenses]);

  const billCounts = useMemo(() => ({
    pending: filteredBills.filter((b) => b.status === 'pending').length,
    approved: filteredBills.filter((b) => b.status === 'approved').length,
    rejected: filteredBills.filter((b) => b.status === 'rejected').length,
  }), [filteredBills]);

  return (
    <div>
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

      <Card
        className={cardClassName}
        title={
          <Flex align="center" gap={8}>
            <WalletOutlined /> Expenses
          </Flex>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Card size="small" className="border! border-amber-500/20! bg-amber-500/5!">
              <Statistic
                title={<Tag color="warning">Pending</Tag>}
                value={expenseCounts.pending}
                prefix={<ClockCircleOutlined className="text-amber-500" />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="border! border-emerald-500/20! bg-emerald-500/5!">
              <Statistic
                title={<Tag color="success">Approved</Tag>}
                value={expenseCounts.approved}
                prefix={<CheckCircleOutlined className="text-emerald-500" />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="border! border-red-500/20! bg-red-500/5!">
              <Statistic
                title={<Tag color="error">Rejected</Tag>}
                value={expenseCounts.rejected}
                prefix={<CloseCircleOutlined className="text-red-500" />}
              />
            </Card>
          </Col>
        </Row>
        <Table
          dataSource={filteredExpenses}
          columns={expenseColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 700 }}
          locale={{ emptyText: 'No expenses pending approval' }}
        />
      </Card>

      <Card
        className={cardClassName}
        title={
          <Flex align="center" gap={8}>
            <FileDoneOutlined /> Purchase Bills
          </Flex>
        }
      >
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Card size="small" className="border! border-amber-500/20! bg-amber-500/5!">
              <Statistic
                title={<Tag color="warning">Pending</Tag>}
                value={billCounts.pending}
                prefix={<ClockCircleOutlined className="text-amber-500" />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="border! border-emerald-500/20! bg-emerald-500/5!">
              <Statistic
                title={<Tag color="success">Approved</Tag>}
                value={billCounts.approved}
                prefix={<CheckCircleOutlined className="text-emerald-500" />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="border! border-red-500/20! bg-red-500/5!">
              <Statistic
                title={<Tag color="error">Rejected</Tag>}
                value={billCounts.rejected}
                prefix={<CloseCircleOutlined className="text-red-500" />}
              />
            </Card>
          </Col>
        </Row>
        <Table
          dataSource={filteredBills}
          columns={billColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 700 }}
          locale={{ emptyText: 'No purchase bills' }}
        />
      </Card>
    </div>
  );
}
