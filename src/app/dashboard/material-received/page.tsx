import { Alert } from 'antd';
import { MaterialReceivedClient } from '@/components/dashboard/MaterialReceivedClient';
import { fetchProjects, fetchItemDescriptions, fetchMaterialReceived } from '@/lib/api';

async function loadPageData() {
  try {
    const [records, projects, itemDescriptions] = await Promise.all([
      fetchMaterialReceived(),
      fetchProjects(),
      fetchItemDescriptions(),
    ]);
    return { records, projects, itemDescriptions };
  } catch (error) {
    return {
      records: [],
      projects: [],
      itemDescriptions: [],
      error: error instanceof Error ? error.message : 'Unable to load material received records',
    };
  }
}

export default async function MaterialReceivedPage() {
  const { records, projects, itemDescriptions, error } = await loadPageData();

  return (
    <>
      {error && <Alert type="warning" showIcon title={error} className="mb-4" />}
      <MaterialReceivedClient records={records} projects={projects} itemDescriptions={itemDescriptions} />
    </>
  );
}