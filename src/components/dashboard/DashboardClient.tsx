'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Card, Col, Progress, Row, Statistic, Table, Typography } from 'antd';
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
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardData, DashboardProject, ExpenseSummary } from '@/types/erp';
import { cardClassName, formatCurrency, secondaryTextClassName, titleCase } from './ui';

type DashboardClientProps = {
  data: DashboardData;
  expenseSummary: ExpenseSummary[];
};

const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7'];
const chartHeight = 280;

const statisticClassNames = { content: '!text-slate-200 !font-bold' };

const kpiCardClassNames = {
  blue: '!rounded-xl !border !border-blue-500/20 !bg-gradient-to-br !from-blue-500/15 !to-blue-500/5',
  green: '!rounded-xl !border !border-emerald-500/20 !bg-gradient-to-br !from-emerald-500/15 !to-emerald-500/5',
  amber: '!rounded-xl !border !border-amber-500/20 !bg-gradient-to-br !from-amber-500/15 !to-amber-500/5',
  violet: '!rounded-xl !border !border-violet-500/20 !bg-gradient-to-br !from-violet-500/15 !to-violet-500/5',
};

function ChartFrame({ children }: { children: (width: number, height: number) => ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="h-[280px] min-w-0 w-full">
      {width > 0 ? children(width, chartHeight) : null}
    </div>
  );
}

export function DashboardClient({ data, expenseSummary }: DashboardClientProps) {
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
      <Typography.Title level={3} className="!mb-6 !text-slate-200">
        Master Dashboard
      </Typography.Title>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className={kpiCardClassNames.blue}>
            <Statistic
              title={<Typography.Text className={secondaryTextClassName}>Total Projects</Typography.Text>}
              value={data.totalProjects}
              prefix={<ProjectOutlined className="text-blue-500" />}
              classNames={statisticClassNames}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={kpiCardClassNames.green}>
            <Statistic
              title={<Typography.Text className={secondaryTextClassName}>Total Revenue</Typography.Text>}
              value={formatCurrency(totalRevenue)}
              prefix={<DollarOutlined className="text-emerald-500" />}
              classNames={statisticClassNames}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={kpiCardClassNames.amber}>
            <Statistic
              title={<Typography.Text className={secondaryTextClassName}>Total Cost</Typography.Text>}
              value={formatCurrency(totalCost)}
              prefix={<RiseOutlined className="text-amber-500" />}
              classNames={statisticClassNames}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={kpiCardClassNames.violet}>
            <Statistic
              title={<Typography.Text className={secondaryTextClassName}>Profit Margin</Typography.Text>}
              value={margin}
              precision={1}
              suffix="%"
              prefix={<TeamOutlined className="text-violet-500" />}
              classNames={statisticClassNames}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={14}>
          <Card title={<Typography.Text strong>Revenue vs Cost</Typography.Text>} className={cardClassName}>
            <ChartFrame>
              {(width, height) => (
                <BarChart width={width} height={height} data={revenueCostData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `₹${Number(value) / 100000}L`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {revenueCostData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ChartFrame>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<Typography.Text strong>Expenses by Category</Typography.Text>} className={cardClassName}>
            <ChartFrame>
              {(width, height) => (
                expenseChartData.length > 0 ? (
                  <PieChart width={width} height={height}>
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
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Typography.Text type="secondary">No expense data yet</Typography.Text>
                  </div>
                )
              )}
            </ChartFrame>
          </Card>
        </Col>
      </Row>

      <Card title={<Typography.Text strong>Active Projects</Typography.Text>} className={cardClassName}>
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
