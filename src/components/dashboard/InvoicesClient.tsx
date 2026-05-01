'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, DatePicker, Drawer, Flex, Form, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { createInvoice } from '@/actions/invoices';
import type { Customer, Project, SalesInvoice } from '@/types/erp';
import { LineItemsEditor } from './LineItemsEditor';
import { StatusTag, cardStyle, formatCurrency, formatDate } from './ui';

const itemSchema = z.object({
  description: z.string().min(2, 'Enter an item description'),
  quantity: z.number().positive('Qty must be greater than zero'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.number().nonnegative('Rate cannot be negative'),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one line item'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

type InvoicesClientProps = {
  invoices: SalesInvoice[];
  customers: Customer[];
  projects: Project[];
};

export function InvoicesClient({ invoices, customers, projects }: InvoicesClientProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [messageApi, contextHolder] = message.useMessage();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      projectId: undefined,
      dueDate: undefined,
      items: [{ description: '', quantity: 1, unit: 'nos', rate: 0 }],
    },
  });

  const columns: ColumnsType<SalesInvoice> = [
    {
      title: 'Invoice',
      dataIndex: 'invoiceNumber',
      sorter: (a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      sorter: (a, b) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
      render: (_value, record) => record.customer?.name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Sent', value: 'sent' },
        { text: 'Paid', value: 'paid' },
        { text: 'Overdue', value: 'overdue' },
        { text: 'Cancelled', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (value: string) => <StatusTag value={value} />,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      sorter: (a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime(),
      render: formatDate,
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

  const submit = (values: InvoiceFormValues) => {
    startTransition(async () => {
      try {
        await createInvoice({
          ...values,
          projectId: values.projectId || undefined,
          dueDate: values.dueDate || undefined,
        });
        messageApi.success('Invoice created');
        reset();
        setOpen(false);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : 'Failed to create invoice');
      }
    });
  };

  return (
    <div>
      {contextHolder}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} gap={16} wrap="wrap">
        <Typography.Title level={3} style={{ color: '#e2e8f0', margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} /> Sales Invoices
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Create Invoice
        </Button>
      </Flex>

      <Card style={cardStyle}>
        <Table
          dataSource={invoices}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 920 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} invoices` }}
        />
      </Card>

      <Drawer
        title="Create Sales Invoice"
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
            name="customerId"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Customer"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Select
                  {...field}
                  showSearch
                  placeholder="Select customer"
                  optionFilterProp="label"
                  options={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
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
                  allowClear
                  showSearch
                  placeholder="Link to project"
                  optionFilterProp="label"
                  options={projects.map((project) => ({ value: project.id, label: project.name }))}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="dueDate"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Due Date"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  onChange={(_, dateString) => field.onChange(Array.isArray(dateString) ? dateString[0] : dateString)}
                />
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
