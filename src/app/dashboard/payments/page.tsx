'use client';

import { Card, Typography, Empty } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import { cardClassName, mutedTextClassName, pageTitleClassName, titleIconClassName } from '@/components/dashboard/ui';

const { Title, Text } = Typography;

export default function PaymentsPage() {
  return (
    <div>
      <Title level={3} className={`${pageTitleClassName} mb-6`}>
        <CreditCardOutlined className={titleIconClassName} /> Payments
      </Title>
      <Card className={cardClassName}>
        <Empty description={<Text className={mutedTextClassName}>Connect to backend to manage payments</Text>} />
      </Card>
    </div>
  );
}
