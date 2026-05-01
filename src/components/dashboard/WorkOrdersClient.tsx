'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Drawer, Flex, Form, Input, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { createWorkOrder } from '@/actions/workorders';
import type { Project, Vendor, WorkOrder } from '@/types/erp';
import { LineItemsEditor } from './LineItemsEditor';
import { StatusTag, cardStyle, formatCurrency, formatDate } from './ui';

const itemSchema = z.object({
  description: z.string().min(2, 'Enter an item description'),
  quantity: z.number().positive('Qty must be greater than zero'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.number().nonnegative('Rate cannot be negative'),
});

const workOrderSchema = z.object({
  vendorId: z.string().min(1, 'Select a vendor'),
  projectId: z.string().min(1, 'Select a project'),
  terms: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one line item'),
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

type WorkOrdersClientProps = {
  workOrders: WorkOrder[];
  projects: Project[];
  vendors: Vendor[];
};

export function WorkOrdersClient({ workOrders, projects, vendors }: WorkOrdersClientProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [messageApi, contextHolder] = message.useMessage();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      vendorId: '',
      projectId: '',
      terms: '',
      items: [{ description: '', quantity: 1, unit: 'nos', rate: 0 }],
    },
  });

  const columns: ColumnsType<WorkOrder> = [
    {
      title: 'WO Number',
      dataIndex: 'woNumber',
      sorter: (a, b) => a.woNumber.localeCompare(b.woNumber),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      sorter: (a, b) => (a.vendor?.name || '').localeCompare(b.vendor?.name || ''),
      render: (_value, record) => record.vendor?.name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Sent', value: 'sent' },
        { text: 'Approved', value: 'approved' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (value: string) => <StatusTag value={value} />,
    },
    {
      title: 'Items',
      dataIndex: 'items',
      render: (items: WorkOrder['items']) => items?.length || 0,
      sorter: (a, b) => (a.items?.length || 0) - (b.items?.length || 0),
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      align: 'right',
      sorter: (a, b) => Number(a.totalAmount) - Number(b.totalAmount),
      render: (value: number | string, record) => (
        <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
          <Typography.Text>{formatCurrency(value)}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            GST {formatCurrency(record.gstAmount)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
      render: formatDate,
    },
  ];

  const submit = (values: WorkOrderFormValues) => {
    startTransition(async () => {
      try {
        await createWorkOrder(values);
        messageApi.success('Work order created');
        reset();
        setOpen(false);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : 'Failed to create work order');
      }
    });
  };

  return (
    <div>
      {contextHolder}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} gap={16} wrap="wrap">
        <Typography.Title level={3} style={{ color: '#e2e8f0', margin: 0 }}>
          <ShoppingCartOutlined style={{ marginRight: 8 }} /> Work Orders
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Create Work Order
        </Button>
      </Flex>

      <Card style={cardStyle}>
        <Table
          dataSource={workOrders}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} work orders` }}
        />
      </Card>

      <Drawer
        title="Create Work Order"
        width={720}
        open={open}
        onClose={() => setOpen(false)}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit(submit)}>
              Save
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" onFinish={handleSubmit(submit)}>
          <Controller
            control={control}
            name="vendorId"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Vendor"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Select
                  {...field}
                  showSearch
                  placeholder="Select vendor"
                  optionFilterProp="label"
                  options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="projectId"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Project"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Select
                  {...field}
                  showSearch
                  placeholder="Select project"
                  optionFilterProp="label"
                  options={projects.map((project) => ({ value: project.id, label: project.name }))}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <Form.Item label="Terms">
                <Input.TextArea {...field} rows={3} placeholder="Commercial terms, execution notes, payment schedule..." />
              </Form.Item>
            )}
          />
          <LineItemsEditor control={control} name="items" />
          {errors.items?.message && (
            <Typography.Text type="danger" style={{ display: 'block', marginTop: 8 }}>
              {errors.items.message}
            </Typography.Text>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
