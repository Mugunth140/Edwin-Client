'use client';

import { useState } from 'react';
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
          fontFamily: 'inherit',
        },
      }}
    >
      <Layout className="min-h-screen">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          className="fixed left-0 top-0 z-[100] h-screen border-r border-white/10 !bg-gradient-to-b !from-slate-900 !to-[#0a0f1a]"
        >
          <div
            className={`mb-2 flex items-center gap-3 border-b border-white/10 ${
              collapsed ? 'px-3 py-5' : 'px-5 py-5'
            }`}
          >
            <SafetyCertificateOutlined className="text-[28px] text-blue-500" />
            {!collapsed && (
              <div>
                <Text strong className="block text-base !leading-tight !text-slate-200">
                  Edwin ERP
                </Text>
                <Text className="text-[11px] !text-slate-500">Construction Management</Text>
              </div>
            )}
          </div>

          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            className="!border-none !bg-transparent px-2"
          />
        </Sider>

        <Layout className={`transition-[margin-left] duration-200 ${collapsed ? 'ml-20' : 'ml-[260px]'}`}>
          <Header
            className="sticky top-0 z-[99] flex h-16 items-center justify-between border-b border-white/10 !bg-slate-900/80 px-6 backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="cursor-pointer border-0 bg-transparent p-0 text-lg text-slate-400"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>

            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') handleLogout();
                },
              }}
              placement="bottomRight"
            >
              <Space className="cursor-pointer">
                <Avatar
                  className="!bg-gradient-to-br !from-blue-500 !to-violet-500"
                  icon={<UserOutlined />}
                />
                {user && <Text className="!text-slate-200">{user.name}</Text>}
              </Space>
            </Dropdown>
          </Header>

          <Content
            className="min-h-[calc(100vh-64px)] bg-[#0a0f1a] p-6"
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
