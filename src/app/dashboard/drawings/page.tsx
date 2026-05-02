'use client';

import { Card, Typography, Empty } from 'antd';
import { FileImageOutlined } from '@ant-design/icons';
import { cardClassName, mutedTextClassName, pageTitleClassName, titleIconClassName } from '@/components/dashboard/ui';

const { Title, Text } = Typography;

export default function DrawingsPage() {
  return (
    <div>
      <Title level={3} className={`${pageTitleClassName} mb-6`}>
        <FileImageOutlined className={titleIconClassName} /> Project Drawings
      </Title>
      <Card className={cardClassName}>
        <Empty description={<Text className={mutedTextClassName}>Connect to backend to manage drawings</Text>} />
      </Card>
    </div>
  );
}
