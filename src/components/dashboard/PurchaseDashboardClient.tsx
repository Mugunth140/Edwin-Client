'use client';

import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Typography, Progress, Flex, Alert, Spin, Divider } from 'antd';
import { ShoppingCartOutlined, FileDoneOutlined, HistoryOutlined, WarningOutlined } from '@ant-design/icons';
import { fetchPurchaseDashboard } from '@/lib/client-api';
import { formatCurrency, formatDate } from './ui';

export function PurchaseDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchPurchaseDashboard();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="flex h-[400px] items-center justify-center"><Spin size="large" /></div>;
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!data) return null;

  const poColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Vendor',
      dataIndex: 'vendorName',
      key: 'vendorName',
    },
    {
      title: 'Fulfillment',
      key: 'fulfillment',
      render: (_: any, record: any) => (
        <Flex vertical gap={4}>
          <Progress percent={record.fulfillment} size="small" status={record.fulfillment === 100 ? 'success' : 'active'} />
          <Typography.Text type="secondary" className="text-[10px]">{record.fulfillment}% billed</Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      render: (val: number) => formatCurrency(val),
    }
  ];

  return (
    <div className="space-y-6">
      <Typography.Title level={2}>Purchase Dashboard</Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="bg-blue-500/10 border border-blue-500/20">
            <Statistic
              title={<span className="text-blue-400">Total Payables</span>}
              value={data.kpis.totalPayable}
              precision={2}
              prefix={<ShoppingCartOutlined className="mr-2" />}
              formatter={(val) => formatCurrency(val)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="bg-orange-500/10 border border-orange-500/20">
            <Statistic
              title={<span className="text-orange-400">Unpaid Bills</span>}
              value={data.kpis.unpaidBillCount}
              prefix={<WarningOutlined className="mr-2" />}
              suffix="Bills"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="bg-green-500/10 border border-green-500/20">
            <Statistic
              title={<span className="text-green-400">Active POs</span>}
              value={data.kpis.activePOCount}
              prefix={<FileDoneOutlined className="mr-2" />}
              suffix="Pending"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="bg-purple-500/10 border border-purple-500/20">
            <Statistic
              title={<span className="text-purple-400">Recent PO Value</span>}
              value={data.kpis.totalPOValue}
              prefix={<HistoryOutlined className="mr-2" />}
              formatter={(val) => formatCurrency(val)}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Pending Purchase Orders (Fulfillment Tracking)" className="h-full border-white/10">
            <Table
              dataSource={data.pendingPOs}
              columns={poColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="middle"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Recent Activity" className="h-full border-white/10">
            <Typography.Text strong className="mb-3 block">Latest Bills</Typography.Text>
            <div className="space-y-4">
              {data.recentActivity.bills.map((bill: any) => (
                <Flex key={bill.id} justify="space-between" align="center" className="pb-3 border-b border-white/5 last:border-0">
                  <div>
                    <Typography.Text className="block">{bill.billNumber}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">{bill.vendor?.name}</Typography.Text>
                  </div>
                  <div className="text-right">
                    <Typography.Text strong className="block">{formatCurrency(bill.amount)}</Typography.Text>
                    <Typography.Text type="secondary" className="text-[10px]">{formatDate(bill.billDate)}</Typography.Text>
                  </div>
                </Flex>
              ))}
            </div>
            
            <Divider className="my-4 border-white/5" />
            
            <Typography.Text strong className="mb-3 block">Latest POs</Typography.Text>
            <div className="space-y-4">
              {data.recentActivity.pos.map((po: any) => (
                <Flex key={po.id} justify="space-between" align="center" className="pb-3 border-b border-white/5 last:border-0">
                  <div>
                    <Typography.Text className="block">{po.poNumber}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">{po.vendor?.name}</Typography.Text>
                  </div>
                  <div className="text-right">
                    <Typography.Text strong className="block">{formatCurrency(po.totalAmount)}</Typography.Text>
                    <Typography.Text type="secondary" className="text-[10px]">{formatDate(po.createdAt)}</Typography.Text>
                  </div>
                </Flex>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
