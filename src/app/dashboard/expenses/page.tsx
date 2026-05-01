'use client';

import { Card, Typography, Empty } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ExpensesPage() {
  return (
    <div>
      <Title level={3} style={{ color: '#e2e8f0', marginBottom: 24 }}>
        <DollarOutlined style={{ marginRight: 8 }} /> Expenses
      </Title>
      <Card
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        }}
      >
        <Empty description={<Text style={{ color: '#64748b' }}>Connect to backend to manage expenses</Text>} />
      </Card>
    </div>
  );
}
