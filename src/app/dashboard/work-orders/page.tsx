'use client';

import { Card, Typography, Empty } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function WorkOrdersPage() {
  return (
    <div>
      <Title level={3} style={{ color: '#e2e8f0', marginBottom: 24 }}>
        <ShoppingCartOutlined style={{ marginRight: 8 }} /> Work Orders
      </Title>
      <Card
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}
      >
        <Empty description={<Text style={{ color: '#64748b' }}>Connect to backend to manage work orders</Text>} />
      </Card>
    </div>
  );
}
