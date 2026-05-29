'use client';

import { Card, Col, Row, Statistic, Table, Typography, Tag, Space, Flex } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, BankOutlined, HistoryOutlined } from '@ant-design/icons';
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

type AccountsClientProps = {
  ledger: any[];
  balance: { totalRevenue: number; totalCost: number };
};

export function AccountsClient({ ledger, balance }: AccountsClientProps) {
  const netProfit = balance.totalRevenue - balance.totalCost;

  const columns: ColumnsType<any> = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: formatDate,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (type: string) => (
        <Tag color={type === 'RECEIVABLE' ? 'success' : 'warning'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Ref Number',
      dataIndex: 'refNumber',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Party',
      dataIndex: 'party',
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
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : 'blue'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Title level={3} className={pageTitleClassName}>
          <BankOutlined className={titleIconClassName} /> Accounts & Purchase Summary
        </Title>
      </Flex>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className={cardClassName} variant="borderless">
            <Statistic
              title="Total Revenue (Paid Invoices)"
              value={balance.totalRevenue}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              formatter={(val) => formatCurrency(val as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={cardClassName} variant="borderless">
            <Statistic
              title="Total Cost (Bills)"
              value={balance.totalCost}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              formatter={(val) => formatCurrency(val as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={cardClassName} variant="borderless">
            <Statistic
              title="Estimated Balance"
              value={netProfit}
              precision={2}
              valueStyle={{ color: netProfit >= 0 ? '#3f8600' : '#cf1322' }}
              formatter={(val) => formatCurrency(val as number)}
            />
          </Card>
        </Col>
      </Row>

      <Title level={4} className="mb-4">
        <HistoryOutlined /> General Ledger (Derived)
      </Title>
      <Card className={cardClassName} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={ledger}
          columns={columns}
          rowKey={(record) => record.refNumber + record.date}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
