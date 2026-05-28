'use client';

import { useEffect, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, DatePicker, Drawer, Flex, Form, Input, InputNumber, Popconfirm, Progress, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined, ProjectOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import { createProject, deleteProject, updateProject } from '@/actions/projects';
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

const projectSchema = z.object({
  name: z.string().min(3, 'Project name is required'),
  clientName: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed']),
  estimatedBudget: z.number().nonnegative().optional(),
  startDate: z.any().optional(),
  endDate: z.any().optional(),
  completionPct: z.number().min(0).max(100).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type ProjectsClientProps = {
  projects: Project[];
};

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isPending, startTransition] = useTransition();
  const [messageApi, contextHolder] = message.useMessage();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      clientName: '',
      location: '',
      description: '',
      status: 'planning',
      estimatedBudget: 0,
      completionPct: 0,
    },
  });

  useEffect(() => {
    if (editingProject) {
      setValue('name', editingProject.name);
      setValue('clientName', editingProject.clientName || '');
      setValue('location', editingProject.location || '');
      setValue('description', editingProject.description || '');
      setValue('status', editingProject.status);
      setValue('estimatedBudget', Number(editingProject.estimatedBudget) || 0);
      setValue('completionPct', Number(editingProject.completionPct) || 0);
      setValue('startDate', editingProject.startDate ? dayjs(editingProject.startDate) : undefined);
      setValue('endDate', editingProject.endDate ? dayjs(editingProject.endDate) : undefined);
    } else {
      reset({
        name: '',
        clientName: '',
        location: '',
        description: '',
        status: 'planning',
        estimatedBudget: 0,
        completionPct: 0,
        startDate: undefined,
        endDate: undefined,
      });
    }
  }, [editingProject, setValue, reset]);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteProject(id);
        messageApi.success('Project deleted successfully');
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : 'Failed to delete project');
      }
    });
  };

  const columns: ColumnsType<Project> = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'Project',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (value: string, record) => (
        <Flex vertical gap={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary" className={`${secondaryTextClassName} text-xs`}>
            {record.clientName || record.location || 'No client assigned'}
          </Typography.Text>
        </Flex>
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
      width: 150,
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
        <Flex vertical gap={0}>
          <Typography.Text>{formatDate(record.startDate)}</Typography.Text>
          <Typography.Text type="secondary" className={`${secondaryTextClassName} text-xs`}>
            to {formatDate(record.endDate)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined className="text-sky-500" />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Project"
            description="Are you sure you want to delete this project?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, loading: isPending }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const submit = (values: ProjectFormValues) => {
    const data = {
      ...values,
      startDate: values.startDate ? values.startDate.toISOString() : undefined,
      endDate: values.endDate ? values.endDate.toISOString() : undefined,
    };

    startTransition(async () => {
      try {
        if (editingProject) {
          await updateProject(editingProject.id, data);
          messageApi.success('Project updated successfully');
        } else {
          await createProject(data);
          messageApi.success('Project created successfully');
        }
        setOpen(false);
        setEditingProject(null);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : 'Failed to save project');
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProject(null);
  };

  return (
    <div>
      {contextHolder}
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <ProjectOutlined className={titleIconClassName} /> Projects
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Add Project
        </Button>
      </Flex>
      <Card className={cardClassName}>
        <Table
          dataSource={projects}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} projects` }}
        />
      </Card>

      <Drawer
        title={editingProject ? 'Edit Project' : 'Add New Project'}
        size="large"
        open={open}
        onClose={handleClose}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit(submit)}>
              {editingProject ? 'Update Project' : 'Save Project'}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" onFinish={handleSubmit(submit)}>
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Project Name"
                required
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Input {...field} placeholder="e.g. Skyline Apartments Phase 2" />
              </Form.Item>
            )}
          />

          <Flex gap={16}>
            <Controller
              control={control}
              name="clientName"
              render={({ field }) => (
                <Form.Item label="Client Name" className="flex-1">
                  <Input {...field} placeholder="Organization or person" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <Form.Item label="Location" className="flex-1">
                  <Input {...field} placeholder="City or specific site" />
                </Form.Item>
              )}
            />
          </Flex>

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Form.Item label="Description">
                <Input.TextArea {...field} rows={3} placeholder="Project scope and details..." />
              </Form.Item>
            )}
          />

          <Flex gap={16}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Form.Item label="Status" className="flex-1">
                  <Select {...field} options={[
                    { label: 'Planning', value: 'planning' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'On Hold', value: 'on_hold' },
                    { label: 'Completed', value: 'completed' },
                  ]} />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="completionPct"
              render={({ field }) => (
                <Form.Item label="Completion %" className="flex-1">
                  <InputNumber {...field} min={0} max={100} className="w-full" />
                </Form.Item>
              )}
            />
          </Flex>

          <Flex gap={16}>
            <Controller
              control={control}
              name="estimatedBudget"
              render={({ field }) => (
                <Form.Item label="Estimated Budget" className="flex-1">
                  <InputNumber
                    {...field}
                    min={0}
                    className="w-full"
                    formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => Number(value!.replace(/₹\s?|(,*)/g, ''))}
                  />
                </Form.Item>
              )}
            />
            <Space className="flex-1" />
          </Flex>

          <Flex gap={16}>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <Form.Item label="Start Date" className="flex-1">
                  <DatePicker {...field} className="w-full" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <Form.Item label="Expected End Date" className="flex-1">
                  <DatePicker {...field} className="w-full" />
                </Form.Item>
              )}
            />
          </Flex>
        </Form>
      </Drawer>
    </div>
  );
}
