'use client';

import { Card, Flex, Progress, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ProjectOutlined } from '@ant-design/icons';
import type { Project } from '@/types/erp';
import {
  StatusTag,
  cardClassName,
  formatCurrency,
  formatDate,
  pageHeaderClassName,
  pageTitleClassName,
  secondaryTextClassName,
  titleIconClassName,
} from './ui';

type ProjectsClientProps = {
  projects: Project[];
};

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const columns: ColumnsType<Project> = [
    {
      title: 'Project',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary" className={`${secondaryTextClassName} text-xs`}>
            {record.clientName || record.location || 'No client assigned'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      filters: [
        { text: 'Planning', value: 'planning' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'On Hold', value: 'on_hold' },
        { text: 'Completed', value: 'completed' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (value: string) => <StatusTag value={value} />,
    },
    {
      title: 'Completion',
      dataIndex: 'completionPct',
      sorter: (a, b) => Number(a.completionPct) - Number(b.completionPct),
      render: (value: number | string) => (
        <Progress
          percent={Number(value || 0)}
          size="small"
          strokeColor={{ from: '#3b82f6', to: '#10b981' }}
        />
      ),
    },
    {
      title: 'Budget',
      dataIndex: 'estimatedBudget',
      align: 'right',
      sorter: (a, b) => Number(a.estimatedBudget) - Number(b.estimatedBudget),
      render: formatCurrency,
    },
    {
      title: 'Timeline',
      key: 'timeline',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{formatDate(record.startDate)}</Typography.Text>
          <Typography.Text type="secondary" className={`${secondaryTextClassName} text-xs`}>
            to {formatDate(record.endDate)}
          </Typography.Text>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <ProjectOutlined className={titleIconClassName} /> Projects
        </Typography.Title>
      </Flex>
      <Card className={cardClassName}>
        <Table
          dataSource={projects}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 920 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} projects` }}
        />
      </Card>
    </div>
  );
}
