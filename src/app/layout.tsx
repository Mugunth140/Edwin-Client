import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { App } from 'antd';
import './globals.css';

export const metadata: Metadata = {
  title: 'Edwin Constructions ERP',
  description: 'ERP Management System for Edwin Constructions - Projects, Accounts, Expenses & Payments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b1120] text-slate-200 antialiased font-(--app-font)">
        <AntdRegistry>
          <App>
            <QueryProvider>{children}</QueryProvider>
          </App>
        </AntdRegistry>
      </body>
    </html>
  );
}
