'use client';

import { Card, Typography, Empty } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { cardClassName, mutedTextClassName, pageTitleClassName, titleIconClassName } from '@/components/dashboard/ui';

const { Title, Text } = Typography;

export default function DprPage() {
  return (
    <div>
      <Title level={3} className={`${pageTitleClassName} mb-6`}>
        <CalendarOutlined className={titleIconClassName} /> Daily Progress Reports
      </Title>
      <Card className={cardClassName}>
        <Empty description={<Text className={mutedTextClassName}>Connect to backend to manage DPR</Text>} />
      </Card>
    </div>
  );
}
