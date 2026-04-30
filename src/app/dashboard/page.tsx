import { Card, Row, Col, Statistic, Typography, Table, Tag, Progress } from 'antd';
import {
  ProjectOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Mock data for initial setup (will be replaced with API data once backend is running)
const mockDashboardData = {
  totalProjects: 2,
  projects: [
    { id: '1', name: 'NH-48 Highway Extension', completionPct: 35 },
    { id: '2', name: 'Chennai Metro Phase 2 - Block C', completionPct: 5 },
  ],
  revenueVsCost: { totalRevenue: 12500000, totalCost: 8700000 },
  weeklyLabour: [],
  criticalActions: [],
};

export default async function DashboardPage() {
  // When backend is running, uncomment:
  // const data = await fetchDashboard();
  const data = mockDashboardData;

  const projectColumns = [
    { title: 'Project', dataIndex: 'name', key: 'name' },
    {
      title: 'Completion',
      dataIndex: 'completionPct',
      key: 'completionPct',
      render: (pct: number) => (
        <Progress
          percent={pct}
          size="small"
          strokeColor={{ from: '#3b82f6', to: '#8b5cf6' }}
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ color: '#e2e8f0', marginBottom: 24 }}>
        Master Dashboard
      </Title>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<Text style={{ color: '#94a3b8' }}>Total Projects</Text>}
              value={data.totalProjects}
              prefix={<ProjectOutlined style={{ color: '#3b82f6' }} />}
              valueStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<Text style={{ color: '#94a3b8' }}>Total Revenue</Text>}
              value={data.revenueVsCost.totalRevenue}
              prefix={<DollarOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#e2e8f0', fontWeight: 700 }}
              precision={0}
              formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<Text style={{ color: '#94a3b8' }}>Total Cost</Text>}
              value={data.revenueVsCost.totalCost}
              prefix={<RiseOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#e2e8f0', fontWeight: 700 }}
              precision={0}
              formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<Text style={{ color: '#94a3b8' }}>Profit Margin</Text>}
              value={
                data.revenueVsCost.totalRevenue > 0
                  ? (((data.revenueVsCost.totalRevenue - data.revenueVsCost.totalCost) /
                      data.revenueVsCost.totalRevenue) *
                      100)
                  : 0
              }
              prefix={<TeamOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#e2e8f0', fontWeight: 700 }}
              precision={1}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Projects Table */}
      <Card
        title={<Text style={{ color: '#e2e8f0', fontWeight: 600 }}>Active Projects</Text>}
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
        }}
      >
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
