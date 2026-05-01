'use client';

import { useSyncExternalStore } from 'react';
import { Card, Col, Progress, Row, Space, Statistic, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DollarOutlined,
  ProjectOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardData, DashboardProject, ExpenseSummary } from '@/types/erp';
import { cardStyle, formatCurrency, titleCase } from './ui';

type DashboardClientProps = {
  data: DashboardData;
  expenseSummary: ExpenseSummary[];
};

const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7'];
const subscribe = () => () => undefined;

const kpiCard = (color: string) => ({
  background: `linear-gradient(135deg, ${color}26 0%, ${color}0d 100%)`,
  border: `1px solid ${color}33`,
  borderRadius: 12,
});

export function DashboardClient({ data, expenseSummary }: DashboardClientProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const totalRevenue = Number(data.revenueVsCost.totalRevenue || 0);
  const totalCost = Number(data.revenueVsCost.totalCost || 0);
  const margin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  const revenueCostData = [
    { name: 'Revenue', amount: totalRevenue },
    { name: 'Cost', amount: totalCost },
  ];
  const expenseChartData = expenseSummary.map((item) => ({
    name: titleCase(item.category),
    value: Number(item.total || 0),
  }));

  const projectColumns: ColumnsType<DashboardProject> = [
    {
      title: 'Project',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Completion',
      dataIndex: 'completionPct',
      sorter: (a, b) => Number(a.completionPct) - Number(b.completionPct),
      render: (pct: number | string) => (
        <Progress
          percent={Number(pct || 0)}
          size="small"
          strokeColor={{ from: '#3b82f6', to: '#10b981' }}
        />
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ color: '#e2e8f0', marginBottom: 24 }}>
        Master Dashboard
      </Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={kpiCard('#3b82f6')}>
            <Statistic
              title={<Typography.Text style={{ color: '#94a3b8' }}>Total Projects</Typography.Text>}
              value={data.totalProjects}
              prefix={<ProjectOutlined style={{ color: '#3b82f6' }} />}
              valueStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={kpiCard('#10b981')}>
            <Statistic
              title={<Typography.Text style={{ color: '#94a3b8' }}>Total Revenue</Typography.Text>}
              value={formatCurrency(totalRevenue)}
              prefix={<DollarOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={kpiCard('#f59e0b')}>
            <Statistic
              title={<Typography.Text style={{ color: '#94a3b8' }}>Total Cost</Typography.Text>}
              value={formatCurrency(totalCost)}
              prefix={<RiseOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={kpiCard('#a855f7')}>
            <Statistic
              title={<Typography.Text style={{ color: '#94a3b8' }}>Profit Margin</Typography.Text>}
              value={margin}
              precision={1}
              suffix="%"
              prefix={<TeamOutlined style={{ color: '#a855f7' }} />}
              valueStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title={<Typography.Text strong>Revenue vs Cost</Typography.Text>} style={cardStyle}>
            <div style={{ height: 280 }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueCostData}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(value) => `₹${Number(value) / 100000}L`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {revenueCostData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<Typography.Text strong>Expenses by Category</Typography.Text>} style={cardStyle}>
            <div style={{ height: 280 }}>
              {mounted && expenseChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={98}
                      paddingAngle={3}
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : mounted ? (
                <Space align="center" style={{ height: '100%', width: '100%', justifyContent: 'center' }}>
                  <Typography.Text type="secondary">No expense data yet</Typography.Text>
                </Space>
              ) : null}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title={<Typography.Text strong>Active Projects</Typography.Text>} style={cardStyle}>
        <Table
          dataSource={data.projects}
          columns={projectColumns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
