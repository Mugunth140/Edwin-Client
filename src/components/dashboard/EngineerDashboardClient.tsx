'use client';

import { Alert, Button, Card, Col, Progress, Row, Skeleton, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ProjectOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { DashboardData, DashboardProject } from '@/types/erp';
import { clientApiFetch } from '@/lib/client-api';
import { cardClassName, secondaryTextClassName } from './ui';

const emptyDashboard: DashboardData = {
  totalProjects: 0,
  projects: [],
  revenueVsCost: { totalRevenue: 0, totalCost: 0 },
  weeklyLabour: [],
  criticalActions: [],
};

async function loadEngineerDashboard(): Promise<DashboardData> {
  return await clientApiFetch<DashboardData>('/dashboard/engineer');
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton.Input active size="large" className="w-64!" />
        <Skeleton.Button active />
      </div>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card className={cardClassName}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      </Row>
      <Card className={cardClassName}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    </div>
  );
}

export function EngineerDashboardClient() {
  const {
    data: dashboardData,
    error,
    isError,
    isFetching,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', 'engineer'],
    queryFn: loadEngineerDashboard,
  });

  if (isPending) {
    return <DashboardSkeleton />;
  }

  const data = dashboardData || emptyDashboard;

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
      {isError && (
        <Alert
          type="error"
          showIcon
          title="Dashboard data is unavailable"
          description={error instanceof Error ? error.message : 'Unable to load dashboard data.'}
          action={
            <Button size="small" onClick={() => void refetch()} loading={isFetching}>
              Retry
            </Button>
          }
          className="mb-4"
        />
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={3} className="m-0! text-[var(--text-primary)]!">
          My Dashboard
        </Typography.Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void refetch()}
          loading={isFetching}
        >
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-xl! border! border-blue-500/20! bg-linear-to-br! from-blue-500/15! to-blue-500/5!">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500 text-xl">
                <ProjectOutlined />
              </div>
              <div>
                <Typography.Text className={secondaryTextClassName}>Assigned Projects</Typography.Text>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{data.totalProjects}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title={<Typography.Text strong>My Active Projects</Typography.Text>} className={cardClassName}>
        <Table
          dataSource={data.projects}
          columns={projectColumns}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{ emptyText: <Space>No assigned projects</Space> }}
        />
      </Card>
    </div>
  );
}
