'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Typography, Avatar, Dropdown, Space, theme, ConfigProvider } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  FileImageOutlined,
  BankOutlined,
  DollarOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/dashboard/projects', icon: <ProjectOutlined />, label: 'Projects' },
  { key: '/dashboard/work-orders', icon: <ShoppingCartOutlined />, label: 'Work Orders' },
  { key: '/dashboard/dpr', icon: <CalendarOutlined />, label: 'Daily Reports' },
  { key: '/dashboard/drawings', icon: <FileImageOutlined />, label: 'Drawings' },
  { key: '/dashboard/accounts', icon: <BankOutlined />, label: 'Accounts' },
  { key: '/dashboard/accounts/invoices', icon: <FileTextOutlined />, label: 'Invoices' },
  { key: '/dashboard/accounts/bills', icon: <FileTextOutlined />, label: 'Bills' },
  { key: '/dashboard/expenses', icon: <DollarOutlined />, label: 'Expenses' },
  { key: '/dashboard/payments', icon: <CreditCardOutlined />, label: 'Payments' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: `${user?.name || 'User'} (${user?.role || ''})` },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out', danger: true },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorBgContainer: '#111827',
          colorBgElevated: '#1f2937',
          colorBgLayout: '#0a0f1a',
          borderRadius: 10,
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          style={{
            background: 'linear-gradient(180deg, #111827 0%, #0a0f1a 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: collapsed ? '20px 12px' : '20px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 8,
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 28, color: '#3b82f6' }} />
            {!collapsed && (
              <div>
                <Text strong style={{ color: '#e2e8f0', fontSize: 16, display: 'block', lineHeight: 1.2 }}>
                  Edwin ERP
                </Text>
                <Text style={{ color: '#64748b', fontSize: 11 }}>Construction Management</Text>
              </div>
            )}
          </div>

          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0 8px',
            }}
          />
        </Sider>

        <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
          <Header
            style={{
              background: 'rgba(17, 24, 39, 0.8)',
              backdropFilter: 'blur(12px)',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              position: 'sticky',
              top: 0,
              zIndex: 99,
              height: 64,
            }}
          >
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{ cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>

            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') handleLogout();
                },
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                  icon={<UserOutlined />}
                />
                {user && <Text style={{ color: '#e2e8f0' }}>{user.name}</Text>}
              </Space>
            </Dropdown>
          </Header>

          <Content
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 64px)',
              background: '#0a0f1a',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
