'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Typography, Avatar, Dropdown, Space, theme, ConfigProvider } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  FileDoneOutlined,
  FileImageOutlined,
  FileProtectOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SunOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const SIDEBAR_WIDTH = 280;
const COLLAPSED_WIDTH = 84;

type ThemeMode = 'dark' | 'light';
type NavItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
};

const navigationSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Workspace',
    items: [
      { key: '/dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
      { key: '/dashboard/projects', icon: <FolderOpenOutlined />, label: 'Projects' },
      { key: '/dashboard/work-orders', icon: <AuditOutlined />, label: 'Work Orders' },
      { key: '/dashboard/dpr', icon: <CalendarOutlined />, label: 'Daily Reports' },
      { key: '/dashboard/drawings', icon: <FileImageOutlined />, label: 'Drawings' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { key: '/dashboard/accounts', icon: <BankOutlined />, label: 'Accounts' },
      { key: '/dashboard/accounts/invoices', icon: <FileProtectOutlined />, label: 'Invoices' },
      { key: '/dashboard/accounts/bills', icon: <FileDoneOutlined />, label: 'Bills' },
      { key: '/dashboard/expenses', icon: <WalletOutlined />, label: 'Expenses' },
      { key: '/dashboard/payments', icon: <CreditCardOutlined />, label: 'Payments' },
    ],
  },
];

const navItems = navigationSections.flatMap((section) => section.items);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';

    const stored = localStorage.getItem('erp-theme');
    if (stored === 'light' || stored === 'dark') return stored;

    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp-theme', themeMode);
      document.documentElement.dataset.theme = themeMode;
    }
  }, [themeMode]);

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const isDark = themeMode === 'dark';

  const selectedKey = useMemo(() => {
    const match = navItems
      .filter((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))
      .sort((a, b) => b.key.length - a.key.length)[0];

    return match?.key || '/dashboard';
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: `${user?.name || 'User'} (${user?.role || ''})` },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out', danger: true },
  ];

  const themeConfig = useMemo(
    () => ({
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: isDark ? '#38bdf8' : '#0f766e',
        colorInfo: isDark ? '#38bdf8' : '#0f766e',
        colorBgBase: isDark ? '#0b1120' : '#f8fafc',
        colorBgContainer: isDark ? '#101827' : '#ffffff',
        colorBgElevated: isDark ? '#111827' : '#ffffff',
        colorBgLayout: isDark ? '#0b1120' : '#f6f8fb',
        colorText: isDark ? '#e5e7eb' : '#111827',
        colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
        colorBorder: isDark ? 'rgba(148,163,184,0.18)' : '#e2e8f0',
        colorBorderSecondary: isDark ? 'rgba(148,163,184,0.14)' : '#e5e7eb',
        fontFamily: 'var(--app-font)',
        borderRadius: 8,
      },
      components: {
        Button: {
          borderRadius: 8,
          controlHeight: 36,
        },
        Card: {
          borderRadiusLG: 8,
        },
        Layout: {
          headerBg: isDark ? '#101827' : '#ffffff',
          bodyBg: isDark ? '#0b1120' : '#f6f8fb',
          siderBg: isDark ? '#0b1120' : '#ffffff',
        },
        Menu: {
          itemBg: 'transparent',
          itemBorderRadius: 8,
          itemColor: isDark ? '#cbd5e1' : '#475569',
          itemHoverBg: isDark ? 'rgba(148,163,184,0.10)' : '#f1f5f9',
          itemHoverColor: isDark ? '#f8fafc' : '#0f172a',
          itemSelectedBg: isDark ? 'rgba(56,189,248,0.14)' : '#e0f2fe',
          itemSelectedColor: isDark ? '#e0f2fe' : '#075985',
        },
      },
    }),
    [isDark],
  );

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout className={`min-h-screen ${isDark ? 'bg-[#0b1120]' : 'bg-[#f6f8fb]'}`}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          collapsedWidth={COLLAPSED_WIDTH}
          width={SIDEBAR_WIDTH}
          className={`fixed! left-0 top-0 bottom-0 z-100 h-screen overflow-hidden border-r transition-[width] duration-300 ease-in-out ${
            isDark
              ? 'border-white/10 bg-[#0b1120]!'
              : 'border-slate-200 bg-white!'
          }`}
        >
          <div className="flex h-full flex-col">
            <div
              className={`flex h-18 items-center border-b ${
                collapsed ? 'justify-center px-3' : 'gap-3 px-5'
              } ${isDark ? 'border-white/10' : 'border-slate-200'}`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                  isDark
                    ? 'border-sky-400/30 bg-sky-400/10 text-sky-300'
                    : 'border-teal-200 bg-teal-50 text-teal-700'
                }`}
              >
                <SafetyCertificateOutlined className="text-[22px]" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <Text strong className={`block truncate text-[15px] leading-tight! ${isDark ? 'text-slate-100!' : 'text-slate-950!'}`}>
                    Edwin ERP
                  </Text>
                  <Text className={`block truncate text-xs ${isDark ? 'text-slate-400!' : 'text-slate-500!'}`}>
                    Construction Management
                  </Text>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              {navigationSections.map((section) => (
                <div key={section.title} className="mb-5 last:mb-0">
                  {!collapsed && (
                    <Text className={`mb-2 block px-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                      isDark ? 'text-slate-500!' : 'text-slate-400!'
                    }`}>
                      {section.title}
                    </Text>
                  )}
                  <Menu
                    mode="inline"
                    inlineCollapsed={collapsed}
                    selectedKeys={[selectedKey]}
                    items={section.items}
                    onClick={({ key }) => router.push(key)}
                    className="border-none! bg-transparent!"
                  />
                </div>
              ))}
            </div>

            <div className={`border-t p-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div
                className={`flex items-center rounded-lg border p-1 ${
                  isDark
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-slate-50'
                } ${collapsed ? 'justify-center' : 'justify-between'}`}
              >
                {!collapsed && (
                  <Text className={`pl-2 text-xs font-medium ${isDark ? 'text-slate-400!' : 'text-slate-500!'}`}>
                    Theme
                  </Text>
                )}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    aria-label="Switch to light mode"
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                      themeMode === 'light'
                        ? 'bg-white text-amber-600 shadow-sm'
                        : isDark
                          ? 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                          : 'text-slate-500 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <SunOutlined />
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    aria-label="Switch to dark mode"
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                      themeMode === 'dark'
                        ? 'bg-slate-800 text-sky-200 shadow-sm'
                        : isDark
                          ? 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                          : 'text-slate-500 hover:bg-white hover:text-slate-900'
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
          className="min-w-0 transition-[margin-left,width] duration-300 ease-in-out"
          style={{
            marginLeft: sidebarWidth,
            width: `calc(100% - ${sidebarWidth}px)`,
          }}
        >
          <Header
            className={`sticky top-0 z-90 flex h-16 items-center justify-between border-b px-5 backdrop-blur-xl ${
              isDark
                ? 'border-white/10 bg-[#101827]/95!'
                : 'border-slate-200 bg-white/95!'
            }`}
          >
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition ${
                isDark
                  ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-950'
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
              <Space className="cursor-pointer rounded-lg px-2 py-1 transition hover:bg-slate-500/10">
                <Avatar
                  className={`bg-linear-to-br! ${isDark ? 'from-sky-500! to-cyan-500!' : 'from-teal-600! to-sky-600!'}`}
                  icon={<UserOutlined />}
                />
                {user && (
                  <Text className={`hidden text-sm font-medium sm:inline ${isDark ? 'text-slate-200!' : 'text-slate-800!'}`}>
                    {user.name}
                  </Text>
                )}
              </Space>
            </Dropdown>
          </Header>

          <Content
            className={`min-h-[calc(100vh-64px)] px-6 py-6 ${
              isDark ? 'bg-[#0b1120]' : 'bg-[#f6f8fb]'
            }`}
          >
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
