'use client';

import { Card, Typography, Empty } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { cardClassName, mutedTextClassName, pageTitleClassName, titleIconClassName } from '@/components/dashboard/ui';

const { Title, Text } = Typography;

export default function BillsPage() {
  return (
    <div>
      <Title level={3} className={`${pageTitleClassName} mb-6`}>
        <FileTextOutlined className={titleIconClassName} /> Purchase Bills
      </Title>
      <Card className={cardClassName}>
        <Empty description={<Text className={mutedTextClassName}>Connect to backend to manage bills</Text>} />
      </Card>
    </div>
  );
}
