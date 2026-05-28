'use client';

import { Card, Table, Typography, Tag, Space, Flex, Tabs } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  cardClassName,
  formatCurrency,
  formatDate,
  pageHeaderClassName,
  pageTitleClassName,
  titleIconClassName,
} from './ui';

const { Title, Text } = Typography;

type PaymentsClientProps = {
  payables: any[];
  receivables: any[];
};

export function PaymentsClient({ payables, receivables }: PaymentsClientProps) {
  const payableColumns: ColumnsType<any> = [
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      render: formatDate,
      sorter: (a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime(),
    },
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      render: (text) => text || '-',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      render: (amount) => formatCurrency(amount),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.paidAt ? 'green' : 'warning'}>
          {record.paidAt ? 'PAID' : 'UNPAID'}
        </Tag>
      ),
    },
  ];

  const receivableColumns: ColumnsType<any> = [
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      render: (val, record) => formatDate(val || record.createdAt),
      sorter: (a, b) => new Date(a.dueDate || a.createdAt).getTime() - new Date(b.dueDate || b.createdAt).getTime(),
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Party',
      key: 'party',
      render: (_, record) => (
        <Flex vertical gap={0}>
          <Text>{record.customer?.name || '-'}</Text>
          <Text type="secondary" className="text-xs">{record.project?.name || 'General'}</Text>
        </Flex>
      ),
    },
    {
      title: 'Total (inc. GST)',
      key: 'total',
      align: 'right',
      render: (_, record) => formatCurrency(Number(record.totalAmount) + Number(record.gstAmount)),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        let color = 'processing';
        if (status === 'overdue') color = 'error';
        if (status === 'paid') color = 'green';
        if (status === 'draft') color = 'default';
        return (
          <Tag color={color}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  const items = [
    {
      key: 'receivables',
      label: 'Accounts Receivable (Money In)',
      children: (
        <Table
          dataSource={receivables}
          columns={receivableColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: 'payables',
      label: 'Accounts Payable (Money Out)',
      children: (
        <Table
          dataSource={payables}
          columns={payableColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Title level={3} className={pageTitleClassName}>
          <CreditCardOutlined className={titleIconClassName} /> Payments Tracking
        </Title>
      </Flex>

      <Card className={cardClassName}>
        <Tabs defaultActiveKey="receivables" items={items} />
      </Card>
    </div>
  );
}
