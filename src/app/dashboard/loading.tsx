import { Spin } from 'antd';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spin size="large" description="Loading dashboard..." />
    </div>
  );
}
