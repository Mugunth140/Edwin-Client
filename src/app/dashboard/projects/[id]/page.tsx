import { Card, Typography, Empty } from 'antd';
import { cardClassName, mutedTextClassName, pageTitleClassName } from '@/components/dashboard/ui';

const { Title, Text } = Typography;

export default async function ProjectDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <Title level={3} className={`${pageTitleClassName} mb-6`}>
        Project Dashboard
      </Title>
      <Card className={cardClassName}>
        <Empty description={<Text className={mutedTextClassName}>Project ID: {id} — Connect to backend for details</Text>} />
      </Card>
    </div>
  );
}
