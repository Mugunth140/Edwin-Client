import { Card, Typography, Tag, Empty } from 'antd';
import { ProjectOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default async function ProjectsPage() {
  // When backend runs: const projects = await fetchProjects();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ color: '#e2e8f0', margin: 0 }}>
          <ProjectOutlined style={{ marginRight: 8 }} /> Projects
        </Title>
      </div>
      <Card
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}
      >
        <Empty description={<Text style={{ color: '#64748b' }}>Connect to backend to view projects</Text>} />
      </Card>
    </div>
  );
}
