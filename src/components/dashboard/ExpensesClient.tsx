'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button, Card, DatePicker, Drawer, Flex, Form, Input, InputNumber, Select, Space, Table, Typography, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DollarOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import { createExpense, updateExpense, deleteExpense } from '@/actions/expenses';
import type { Expense, ExpenseCategory, Project } from '@/types/erp';
import {
  StatusTag,
  cardClassName,
  formatCurrency,
  formatDate,
  pageHeaderClassName,
  pageTitleClassName,
  secondaryTextClassName,
  titleCase,
  titleIconClassName,
} from './ui';

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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isPending, startTransition] = useTransition();
  const { message } = App.useApp();

  const { control, handleSubmit, reset, setValue } = useForm<ExpenseFormValues>({
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

  const handleEdit = (record: Expense) => {
    setEditingExpense(record);
    setValue('category', record.category);
    setValue('description', record.description);
    setValue('amount', Number(record.amount));
    setValue('expenseDate', record.expenseDate ? dayjs(record.expenseDate).format('YYYY-MM-DD') : '');
    setValue('paidBy', record.paidBy || '');
    setValue('projectId', record.projectId || undefined);
    setOpen(true);
  };

  const handleAdd = () => {
    setEditingExpense(null);
    reset();
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteExpense(id);
        message.success('Expense deleted');
      } catch (error) {
        message.error('Failed to delete expense');
      }
    });
  };

  const columns: ColumnsType<Expense> = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_text, _record, index) => index + 1,
    },
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
        <Flex vertical gap={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary" className={`${secondaryTextClassName} text-xs`}>
            {record.project?.name || 'General'}
          </Typography.Text>
        </Flex>
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
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Expense"
            description="Are you sure you want to delete this expense?"
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

  const submit = (values: ExpenseFormValues) => {
    startTransition(async () => {
      try {
        const payload = {
          ...values,
          paidBy: values.paidBy || undefined,
          projectId: values.projectId || undefined,
        };
        
        if (editingExpense) {
          await updateExpense(editingExpense.id, payload);
          message.success('Expense updated');
        } else {
          await createExpense(payload);
          message.success('Expense added');
        }
        
        reset();
        setOpen(false);
        setEditingExpense(null);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to save expense');
      }
    });
  };

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <DollarOutlined className={titleIconClassName} /> Expenses
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Expense
        </Button>
      </Flex>

      <Card className={cardClassName}>
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
        title={editingExpense ? "Edit Expense" : "Add Expense"}
        size="default"
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingExpense(null);
          reset();
        }}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => {
              setOpen(false);
              setEditingExpense(null);
              reset();
            }}>Cancel</Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit(submit)}>
              {editingExpense ? "Update" : "Save"}
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
                  className="w-full"
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
                  className="w-full"
                  value={field.value ? dayjs(field.value) : null}
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
