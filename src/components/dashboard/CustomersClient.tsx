'use client';

import { useEffect, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button, Card, Drawer, Flex, Form, Input, Popconfirm, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { createCustomer, deleteCustomer, updateCustomer } from '@/actions/customers';
import type { Customer } from '@/types/erp';
import {
  cardClassName,
  pageHeaderClassName,
  pageTitleClassName,
  titleIconClassName,
} from './ui';

const customerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  state: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

type CustomersClientProps = {
  customers: Customer[];
};

export function CustomersClient({ customers }: CustomersClientProps) {
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isPending, startTransition] = useTransition();
  const { message } = App.useApp();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      state: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  useEffect(() => {
    if (editingCustomer) {
      setValue('name', editingCustomer.name);
      setValue('state', editingCustomer.state || '');
      setValue('contactEmail', editingCustomer.contactEmail || '');
      setValue('contactPhone', editingCustomer.contactPhone || '');
    } else {
      reset({
        name: '',
        state: '',
        contactEmail: '',
        contactPhone: '',
      });
    }
  }, [editingCustomer, setValue, reset]);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteCustomer(id);
        message.success('Customer deleted successfully');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to delete customer');
      }
    });
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'State',
      dataIndex: 'state',
      render: (value) => value || '-',
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Flex vertical gap={0}>
          {record.contactEmail && <Typography.Text className="text-xs">{record.contactEmail}</Typography.Text>}
          {record.contactPhone && <Typography.Text type="secondary" className="text-xs">{record.contactPhone}</Typography.Text>}
          {!record.contactEmail && !record.contactPhone && '-'}
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
            title="Delete Customer"
            description="Are you sure you want to delete this customer?"
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

  const submit = (values: CustomerFormValues) => {
    startTransition(async () => {
      try {
        if (editingCustomer) {
          await updateCustomer(editingCustomer.id, values);
          message.success('Customer updated successfully');
        } else {
          await createCustomer(values);
          message.success('Customer created successfully');
        }
        setOpen(false);
        setEditingCustomer(null);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to save customer');
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <UserOutlined className={titleIconClassName} /> Customers
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Add Customer
        </Button>
      </Flex>

      <Card className={cardClassName}>
        <Table
          dataSource={customers}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} customers` }}
        />
      </Card>

      <Drawer
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="large"
        open={open}
        onClose={handleClose}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit(submit)}>
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
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
                label="Customer Name"
                required
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <Input {...field} placeholder="Legal company or person name" />
              </Form.Item>
            )}
          />

          <Controller
            control={control}
            name="state"
            render={({ field }) => (
              <Form.Item label="State">
                <Input {...field} placeholder="e.g. Tamil Nadu" />
              </Form.Item>
            )}
          />

          <Flex gap={16}>
            <Controller
              control={control}
              name="contactEmail"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Contact Email"
                  className="flex-1"
                  validateStatus={fieldState.error ? 'error' : undefined}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="email@customer.com" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="contactPhone"
              render={({ field }) => (
                <Form.Item label="Contact Phone" className="flex-1">
                  <Input {...field} placeholder="+91..." />
                </Form.Item>
              )}
            />
          </Flex>
        </Form>
      </Drawer>
    </div>
  );
}
