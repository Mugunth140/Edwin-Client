import { Alert } from 'antd';
import { ProjectsClient } from '@/components/dashboard/ProjectsClient';
import { fetchProjects } from '@/lib/api';
import type { Project } from '@/types/erp';

async function loadProjects(): Promise<{ projects: Project[]; error?: string }> {
  try {
    return { projects: await fetchProjects() };
  } catch (error) {
    return {
      projects: [],
      error: error instanceof Error ? error.message : 'Unable to load projects',
    };
  }
}

export default async function ProjectsPage() {
  const { projects, error } = await loadProjects();

  return (
    <>
      {error && <Alert type="warning" showIcon message={error} style={{ marginBottom: 16 }} />}
      <ProjectsClient projects={projects} />
    </>
  );
}
