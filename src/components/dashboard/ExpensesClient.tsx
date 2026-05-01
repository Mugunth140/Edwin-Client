'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, DatePicker, Drawer, Flex, Form, Input, InputNumber, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DollarOutlined, PlusOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { createExpense } from '@/actions/expenses';
import type { Expense, ExpenseCategory, Project } from '@/types/erp';
import { StatusTag, cardStyle, formatCurrency, formatDate, titleCase } from './ui';

const categories = ['staff', 'office', 'transport', 'travel'] as const satisfies readonly ExpenseCategory[];

const expenseSchema = z.object({
  category: z.enum(categories),
  description: z.string().min(2, 'Enter a description'),
  amount: z.number().positive('Amount must be greater than zero'),
  expenseDate: z.string().min(1, 'Select a date'),
  paidBy: z.string().optional(),
  projectId: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

type ExpensesClientProps = {
  expenses: Expense[];
  projects: Project[];
};

export function ExpensesClient({ expenses, projects }: ExpensesClientProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [messageApi, contextHolder] = message.useMessage();

  const { control, handleSubmit, reset } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'staff',
      description: '',
      amount: 0,
      expenseDate: '',
      paidBy: '',
      projectId: undefined,
    },
  });

  const columns: ColumnsType<Expense> = [
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      sorter: (a, b) => new Date(a.expenseDate || 0).getTime() - new Date(b.expenseDate || 0).getTime(),
      render: formatDate,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      filters: categories.map((category) => ({ text: titleCase(category), value: category })),
      onFilter: (value, record) => record.category === value,
      render: (value: string) => <StatusTag value={value} />,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      sorter: (a, b) => a.description.localeCompare(b.description),
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.project?.name || 'General'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Paid By',
      dataIndex: 'paidBy',
      sorter: (a, b) => (a.paidBy || '').localeCompare(b.paidBy || ''),
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      sorter: (a, b) => Number(a.amount) - Number(b.amount),
      render: formatCurrency,
    },
  ];

  const submit = (values: ExpenseFormValues) => {
    startTransition(async () => {
      try {
        await createExpense({
          ...values,
          paidBy: values.paidBy || undefined,
          projectId: values.projectId || undefined,
        });
        messageApi.success('Expense added');
        reset();
        setOpen(false);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : 'Failed to add expense');
      }
    });
  };

  return (
    <div>
      {contextHolder}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} gap={16} wrap="wrap">
        <Typography.Title level={3} style={{ color: '#e2e8f0', margin: 0 }}>
          <DollarOutlined style={{ marginRight: 8 }} /> Expenses
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Add Expense
        </Button>
      </Flex>

      <Card style={cardStyle}>
        <Table
          dataSource={expenses}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} expenses` }}
        />
      </Card>

      <Drawer
        title="Add Expense"
        width={560}
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
            name="category"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Category"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Select
                  {...field}
                  options={categories.map((category) => ({ value: category, label: titleCase(category) }))}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Description"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Input {...field} placeholder="Site staff, office supplies, travel..." />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Amount"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  prefix="₹"
                  style={{ width: '100%' }}
                  value={field.value}
                  onChange={field.onChange}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="expenseDate"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Expense Date"
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
                  placeholder="Optional project"
                  optionFilterProp="label"
                  options={projects.map((project) => ({ value: project.id, label: project.name }))}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="paidBy"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Paid By"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Input {...field} placeholder="Account, employee, petty cash..." />
              </Form.Item>
            )}
          />
        </Form>
      </Drawer>
    </div>
  );
}
