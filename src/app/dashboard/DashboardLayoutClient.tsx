'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Typography, Avatar, Dropdown, Space, theme, ConfigProvider, App } from 'antd';
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
  FileTextOutlined,
  FolderOpenOutlined,
  FormOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const SIDEBAR_WIDTH = 280;
const COLLAPSED_WIDTH = 84;

type NavItem = {
  key: string;
  icon?: React.ReactNode;
  label: string;
  children?: NavItem[];
  allowedRoles?: string[];
};

const navigationSections: Array<{ title: string; items: NavItem[]; allowedRoles?: string[] }> = [
  {
    title: 'Workspace',
    items: [
      { key: '/dashboard', icon: <AppstoreOutlined />, label: 'Dashboard', allowedRoles: ['admin', 'accounts_manager', 'site_engineer', 'purchase_team'] },
      { key: '/dashboard/new', icon: <FormOutlined />, label: 'Daily Entry List', allowedRoles: ['site_engineer'] },
      { key: '/dashboard/dpw', icon: <CalendarOutlined />, label: 'Attendance (DPW)', allowedRoles: ['site_engineer'] },
      { key: '/dashboard/expenses/new', icon: <WalletOutlined />, label: 'Expense', allowedRoles: ['site_engineer'] },
      { key: '/dashboard/projects', icon: <FolderOpenOutlined />, label: 'Projects', allowedRoles: ['admin'] },
      { key: '/dashboard/vendors', icon: <TeamOutlined />, label: 'Vendors', allowedRoles: ['admin', 'purchase_team'] },
      { key: '/dashboard/subcontractors', icon: <TeamOutlined />, label: 'Subcontractors', allowedRoles: ['admin'] },
      { key: '/dashboard/site-engineers', icon: <UserOutlined />, label: 'Site Engineers', allowedRoles: ['admin'] },
      { key: '/dashboard/accounts-managers', icon: <BankOutlined />, label: 'Accounts Managers', allowedRoles: ['admin'] },
      { key: '/dashboard/purchase-team', icon: <TeamOutlined />, label: 'Purchase Team', allowedRoles: ['admin'] },
      { key: '/dashboard/subcontract-work-orders', icon: <FileTextOutlined />, label: 'Subcontract WO', allowedRoles: ['admin'] },
      { key: '/dashboard/purchase-orders', icon: <FileProtectOutlined />, label: 'Purchase Orders', allowedRoles: ['admin', 'purchase_team'] },
      { key: '/dashboard/dpr', icon: <CalendarOutlined />, label: 'Daily Reports (DPR)', allowedRoles: ['admin'] },
      { key: '/dashboard/drawings', icon: <FileImageOutlined />, label: 'Drawings', allowedRoles: ['admin'] },
      { key: '/dashboard/architecture', icon: <NodeIndexOutlined />, label: 'System Architecture', allowedRoles: ['admin'] },
    ],
  },
  {
    title: 'Finance',
    allowedRoles: ['admin', 'accounts_manager', 'purchase_team'],
    items: [
      { key: '/dashboard/accounts', icon: <BankOutlined />, label: 'Accounts', allowedRoles: ['admin', 'accounts_manager'] },
      { key: '/dashboard/accounts/invoices', icon: <FileProtectOutlined />, label: 'Invoices', allowedRoles: ['admin', 'accounts_manager'] },
      { key: '/dashboard/accounts/bills', icon: <FileDoneOutlined />, label: 'Purchase Bills', allowedRoles: ['admin', 'accounts_manager', 'purchase_team'] },
      { key: '/dashboard/approvals', icon: <SafetyCertificateOutlined />, label: 'Approvals', allowedRoles: ['admin', 'accounts_manager'] },
      { key: '/dashboard/expenses', icon: <WalletOutlined />, label: 'Expenses', allowedRoles: ['admin', 'accounts_manager'] },
      { key: '/dashboard/payments', icon: <CreditCardOutlined />, label: 'Payments', allowedRoles: ['admin', 'accounts_manager'] },
    ],
  },
];

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      document.documentElement.dataset.theme = 'dark';
    }
  }, []);

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const filteredNavigationSections = useMemo(() => {
    const role = user?.role || 'viewer';

    
    return navigationSections
      .filter((section) => !section.allowedRoles || section.allowedRoles.includes(role))
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => !item.allowedRoles || item.allowedRoles.includes(role))
          .map((item) => {
             // eslint-disable-next-line @typescript-eslint/no-unused-vars
             const { allowedRoles, children, ...restItem } = item;
             if (children) {
               return {
                 ...restItem,
                 children: children
                   .filter((child) => !child.allowedRoles || child.allowedRoles.includes(role))
                   // eslint-disable-next-line @typescript-eslint/no-unused-vars
                   .map(({ allowedRoles: _childRoles, ...restChild }) => restChild)
               }
             }
             return restItem;
          })
      }))
      .filter(section => section.items.length > 0);
  }, [user]);

  const navItems = useMemo(() => {
    return filteredNavigationSections.flatMap((section) => section.items);
  }, [filteredNavigationSections]);

  const selectedKey = useMemo(() => {
    // Daily labour entry form (/dashboard/new) and detail (/dashboard/daily-labour/:id)
    // should both highlight "Daily Entry List" in the sidebar
    if (pathname.startsWith('/dashboard/daily-labour/')) {
      return '/dashboard/new';
    }

    const match = navItems
      .filter((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))
      .sort((a, b) => b.key.length - a.key.length)[0];

    return match?.key || '/dashboard';
  }, [pathname, navItems]);


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
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: '#38bdf8',
        colorInfo: '#38bdf8',
        colorBgBase: '#0b1120',
        colorBgContainer: '#101827',
        colorBgElevated: '#111827',
        colorBgLayout: '#0b1120',
        colorText: '#e5e7eb',
        colorTextSecondary: '#94a3b8',
        colorBorder: 'rgba(148,163,184,0.18)',
        colorBorderSecondary: 'rgba(148,163,184,0.14)',
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
          headerBg: '#101827',
          bodyBg: '#0b1120',
          siderBg: '#0b1120',
        },
        Menu: {
          itemBg: 'transparent',
          itemBorderRadius: 8,
          itemColor: '#cbd5e1',
          itemHoverBg: 'rgba(148,163,184,0.10)',
          itemHoverColor: '#f8fafc',
          itemSelectedBg: 'rgba(56,189,248,0.14)',
          itemSelectedColor: '#e0f2fe',
        },
      },
    }),
    [],
  );

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1120]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <App>
        <Layout className="min-h-screen bg-[#0b1120]">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          collapsedWidth={COLLAPSED_WIDTH}
          width={SIDEBAR_WIDTH}
          className="fixed! left-0 top-0 bottom-0 z-100 h-screen overflow-hidden border-r border-white/10 bg-[#0b1120]! transition-[width] duration-300 ease-in-out"
        >
          <div className="flex h-full flex-col">
            <div
              className={`flex h-18 items-center border-b border-white/10 ${
                collapsed ? 'justify-center px-3' : 'gap-3 px-5'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-300">
                <SafetyCertificateOutlined className="text-[22px]" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <Text strong className="block truncate text-[15px] leading-tight! text-slate-100!">
                    Edwin ERP
                  </Text>
                  <Text className="block truncate text-xs text-slate-400!">
                    Construction Management
                  </Text>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              {filteredNavigationSections.map((section) => (
                <div key={section.title} className="mb-5 last:mb-0">
                  {!collapsed && (
                    <Text className="mb-2 block px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500!">
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
          </div>
        </Sider>

        <Layout
          className="min-w-0 transition-[margin-left,width] duration-300 ease-in-out"
          style={{
            marginLeft: sidebarWidth,
            width: `calc(100% - ${sidebarWidth}px)`,
          }}
        >
          <Header className="sticky top-0 z-90 flex h-16 items-center justify-between border-b border-white/10 bg-[#101827]/95! px-5 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                  className="bg-linear-to-br! from-sky-500! to-cyan-500!"
                  icon={<UserOutlined />}
                />
                {user && (
                  <Text className="hidden text-sm font-medium sm:inline text-slate-200!">
                    {user.name}
                  </Text>
                )}
              </Space>
            </Dropdown>
          </Header>

          <Content className="min-h-[calc(100vh-64px)] bg-[#0b1120] px-6 py-6">
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </App>
  </ConfigProvider>
);
}
