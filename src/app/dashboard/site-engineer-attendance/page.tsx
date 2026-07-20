import { Alert } from 'antd';
import { fetchProjects, fetchTimesheets } from '@/lib/api';
import { SiteEngineerAttendanceClient } from '@/components/dashboard/SiteEngineerAttendanceClient';

async function loadData() {
  try {
    const [projects, tsResult] = await Promise.all([
      fetchProjects(),
      fetchTimesheets(),
    ]);
    return { projects, timesheets: tsResult.data ?? [] };
  } catch {
    return null;
  }
}

export default async function SiteEngineerAttendancePage() {
  const data = await loadData();
  if (data === null) return <Alert message="Error" description="Failed to load data" type="error" showIcon />;
  return <SiteEngineerAttendanceClient projects={data.projects} timesheets={data.timesheets} />;
}
