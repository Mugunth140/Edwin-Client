'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, DatePicker, Drawer, Flex, Form, Input, InputNumber, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileDoneOutlined, PlusOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { createBill } from '@/actions/invoices';
import type { Vendor, Project, PurchaseBill } from '@/types/erp';
import {
  cardClassName,
  formatCurrency,
  formatDate,
  pageHeaderClassName,
  pageTitleClassName,
  secondaryTextClassName,
  titleIconClassName,
} from './ui';

const billSchema = z.object({
  vendorId: z.string().min(1, 'Select a vendor'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().optional(),
  billDate: z.string().min(1, 'Select bill date'),
  projectId: z.string().optional(),
});

type BillFormValues = z.infer<typeof billSchema>;

type BillsClientProps = {
  bills: PurchaseBill[];
  vendors: Vendor[];
  projects: Project[];
};

export function BillsClient({ bills, vendors, projects }: BillsClientProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [messageApi, contextHolder] = message.useMessage();

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      vendorId: '',
      amount: 0,
      dueDate: undefined,
      billDate: '',
      projectId: undefined,
    },
  });

  const columns: ColumnsType<PurchaseBill> = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      render: (_value, record) => record.vendor?.name || '-',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Bill Date',
      dataIndex: 'billDate',
      render: formatDate,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      render: formatDate,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: formatDate,
    },
  ];

  const submit = (values: BillFormValues) => {
    startTransition(async () => {
      try {
        await createBill({
          ...values,
          projectId: values.projectId || undefined,
          dueDate: values.dueDate || undefined,
        });
        messageApi.success('Bill recorded successfully');
        reset();
        setOpen(false);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : 'Failed to record bill');
      }
    });
  };

  return (
    <div>
      {contextHolder}
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <FileDoneOutlined className={titleIconClassName} /> Purchase Bills
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Record Bill
        </Button>
      </Flex>

      <Card className={cardClassName}>
        <Table
          dataSource={bills}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} bills` }}
        />
      </Card>

      <Drawer
        title="Record Purchase Bill"
        size="default"
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
                  options={vendors.map((v) => ({ value: v.id, label: v.name }))}
                />
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
                  className="w-full"
                  prefix="₹"
                  value={field.value}
                  onChange={field.onChange}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="billDate"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Bill Date"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <DatePicker
                  className="w-full"
                  onChange={(_, dateString) => field.onChange(Array.isArray(dateString) ? dateString[0] : dateString)}
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
                  className="w-full"
                  onChange={(_, dateString) => field.onChange(Array.isArray(dateString) ? dateString[0] : dateString)}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={control}
            name="projectId"
            render={({ field }) => (
              <Form.Item label="Project (Optional)">
                <Select
                  {...field}
                  allowClear
                  showSearch
                  placeholder="Link to project"
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                />
              </Form.Item>
            )}
          />
        </Form>
      </Drawer>
    </div>
  );
}
