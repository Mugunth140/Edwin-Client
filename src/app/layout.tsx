import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--app-font',
});

export const metadata: Metadata = {
  title: 'Edwin Constructions ERP',
  description: 'ERP Management System for Edwin Constructions - Projects, Accounts, Expenses & Payments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} bg-[#0b1120] text-slate-200 antialiased font-(--app-font)`}
      >
        <AntdRegistry>
          <QueryProvider>{children}</QueryProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
