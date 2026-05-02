'use client';

import { useEffect, useMemo, useState } from 'react';
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
  SunOutlined,
  MoonOutlined,
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

type ThemeMode = 'dark' | 'light';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('erp-theme') : null;
    if (stored === 'light' || stored === 'dark') {
      setThemeMode(stored);
      return;
    }
    const prefersLight = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
      : false;
    setThemeMode(prefersLight ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp-theme', themeMode);
    }
  }, [themeMode]);

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

  const isDark = themeMode === 'dark';
  const themeConfig = useMemo(
    () => ({
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: isDark ? '#38bdf8' : '#0284c7',
        colorBgContainer: isDark ? '#0f172a' : '#ffffff',
        colorBgElevated: isDark ? '#111827' : '#ffffff',
        colorBgLayout: isDark ? '#0b1120' : '#f8fafc',
        colorText: isDark ? '#e2e8f0' : '#0f172a',
        colorTextSecondary: isDark ? '#94a3b8' : '#475569',
        colorBorderSecondary: isDark ? 'rgba(148,163,184,0.25)' : '#e2e8f0',
        fontFamily: 'var(--app-font)',
        borderRadius: 12,
      },
      components: {
        Menu: {
          itemBg: 'transparent',
          subMenuItemBg: 'transparent',
          itemSelectedBg: isDark ? 'rgba(56,189,248,0.18)' : 'rgba(14,116,144,0.12)',
          itemSelectedColor: isDark ? '#e0f2fe' : '#0e7490',
          itemHoverBg: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.08)',
          itemHoverColor: isDark ? '#e2e8f0' : '#0f172a',
        },
      },
    }),
    [isDark],
  );

  return (
    <ConfigProvider
      theme={themeConfig}
    >
      <Layout className={`min-h-screen ${isDark ? 'bg-[#0b1120]' : 'bg-slate-100'}`}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          collapsedWidth={88}
          width={260}
          className={`fixed left-0 top-0 z-100 h-screen border-r transition-[width] duration-300 ease-in-out will-change-[width] ${
            isDark
              ? 'border-white/10 bg-linear-to-b! from-[#0d1321]! via-[#0b1120]! to-[#090c15]!'
              : 'border-slate-200 bg-linear-to-b! from-white! via-slate-50! to-slate-100!'
          }`}
        >
          <div className="flex h-full flex-col">
            <div
              className={`mb-2 flex items-center gap-3 border-b ${
                collapsed ? 'px-3 py-5' : 'px-5 py-5'
              } ${isDark ? 'border-white/10' : 'border-slate-200'}`}
            >
              <SafetyCertificateOutlined className={`text-[28px] ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              {!collapsed && (
                <div>
                  <Text strong className={`block text-base leading-tight! ${isDark ? 'text-slate-100!' : 'text-slate-900!'}`}>
                    Edwin ERP
                  </Text>
                  <Text className={`text-[11px] ${isDark ? 'text-slate-500!' : 'text-slate-500!'}`}>
                    Construction Management
                  </Text>
                </div>
              )}
            </div>

            <Menu
              mode="inline"
              selectedKeys={[pathname]}
              items={menuItems}
              onClick={({ key }) => router.push(key)}
              className="border-none! bg-transparent! px-2"
            />

            <div className={`mt-auto px-4 pb-5 ${collapsed ? 'flex justify-center' : ''}`}>
              <div
                className={`flex items-center gap-2 rounded-full border px-2 py-1 transition-all ${
                  isDark
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white'
                } ${collapsed ? 'w-fit' : 'w-full justify-between'}`}
              >
                {!collapsed && (
                  <Text className={`text-xs ${isDark ? 'text-slate-400!' : 'text-slate-500!'}`}>
                    Theme
                  </Text>
                )}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    aria-label="Switch to light mode"
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      themeMode === 'light'
                        ? 'bg-amber-200 text-amber-900'
                        : isDark
                          ? 'text-slate-400 hover:bg-white/10'
                          : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <SunOutlined />
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    aria-label="Switch to dark mode"
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      themeMode === 'dark'
                        ? 'bg-slate-800 text-slate-100'
                        : isDark
                          ? 'text-slate-400 hover:bg-white/10'
                          : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <MoonOutlined />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Sider>

        <Layout
          className={`transition-[margin-left] duration-300 ease-in-out ${
            collapsed ? 'ml-22' : 'ml-65'
          }`}
        >
          <Header
            className={`sticky top-0 z-99 flex h-16 items-center justify-between border-b pl-4 pr-6 backdrop-blur-xl ${
              isDark
                ? 'border-white/10 bg-slate-900/80!'
                : 'border-slate-200 bg-white/80!'
            }`}
          >
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className={`cursor-pointer border-0 bg-transparent p-0 text-lg ${
                isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'
              }`}
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
                  className={`bg-linear-to-br! ${isDark ? 'from-sky-500! to-cyan-500!' : 'from-sky-600! to-indigo-500!'}`}
                  icon={<UserOutlined />}
                />
                {user && (
                  <Text className={isDark ? 'text-slate-200!' : 'text-slate-800!'}>
                    {user.name}
                  </Text>
                )}
              </Space>
            </Dropdown>
          </Header>

          <Content
            className={`min-h-[calc(100vh-64px)] py-6 pl-4 pr-6 ${
              isDark
                ? 'bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),rgba(2,6,23,0.95))]'
                : 'bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),rgba(248,250,252,0.95))]'
            }`}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
