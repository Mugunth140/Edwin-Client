'use client';

import { Card, Typography, Empty } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import { cardClassName, mutedTextClassName, pageTitleClassName, titleIconClassName } from '@/components/dashboard/ui';

const { Title, Text } = Typography;

export default function AccountsPage() {
  return (
    <div>
      <Title level={3} className={`${pageTitleClassName} mb-6`}>
        <BankOutlined className={titleIconClassName} /> Accounts & Purchase
      </Title>
      <Card className={cardClassName}>
        <Empty description={<Text className={mutedTextClassName}>Connect to backend to view accounts</Text>} />
      </Card>
    </div>
  );
}
