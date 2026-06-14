'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button, Card, DatePicker, Drawer, Flex, Form, Select, Space, Table, Typography, Modal, Input, Popconfirm, Dropdown, MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileTextOutlined, PlusOutlined, FilePdfOutlined, DeleteOutlined, MoreOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { createInvoice, deleteInvoice, updateInvoiceStatus } from '@/actions/invoices';
import type { Project, SalesInvoice } from '@/types/erp';
import { LineItemsEditor } from './LineItemsEditor';
import { InvoicePdf } from './InvoicePdf';
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

const itemSchema = z.object({
  description: z.string().min(2, 'Enter an item description'),
  quantity: z.number().positive('Qty must be greater than zero'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.number().nonnegative('Rate cannot be negative'),
});

const invoiceSchema = z.object({
  projectId: z.string().min(1, 'Select a project'),
  dueDate: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one line item'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

type InvoicesClientProps = {
  invoices: SalesInvoice[];
  projects: Project[];
};

export function InvoicesClient({ invoices, projects }: InvoicesClientProps) {
  const [open, setOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<SalesInvoice | null>(null);
  const [isPending, startTransition] = useTransition();
  const { message } = App.useApp();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      projectId: '',
      dueDate: undefined,
      items: [{ description: '', quantity: 1, unit: 'nos', rate: 0 }],
    },
  });

  const selectedProjectId = useWatch({ control, name: 'projectId' });

  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId),
    [selectedProjectId, projects]
  );

  const handleStatusUpdate = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updateInvoiceStatus(id, status);
        message.success(`Status updated to ${status}`);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Update failed');
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteInvoice(id);
        message.success('Invoice deleted');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Delete failed');
      }
    });
  };

  const columns: ColumnsType<SalesInvoice> = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'Invoice',
      dataIndex: 'invoiceNumber',
      sorter: (a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      render: (_value, record) => record.project?.name || '-',
    },
    {
      title: 'Client',
      dataIndex: ['project', 'clientName'],
      sorter: (a, b) => (a.project?.clientName || '').localeCompare(b.project?.clientName || ''),
      render: (_value, record) => record.project?.clientName || '-',
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
        <Flex vertical gap={0} className="items-end">
          <Typography.Text>{formatCurrency(value)}</Typography.Text>
          <Typography.Text type="secondary" className={`${secondaryTextClassName} text-xs`}>
            GST {formatCurrency(record.gstAmount)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
      render: formatDate,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          {isClient && (
            <Button
              type="text"
              icon={<FilePdfOutlined className="text-red-500" />}
              title="Preview PDF"
              onClick={() => setPreviewInvoice(record)}
            />
          )}
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'paid',
                  label: 'Mark as Paid',
                  icon: <CheckCircleOutlined className="text-green-500" />,
                  onClick: () => handleStatusUpdate(record.id, 'paid'),
                },
                {
                  key: 'sent',
                  label: 'Mark as Sent',
                  icon: <FileTextOutlined />,
                  onClick: () => handleStatusUpdate(record.id, 'sent'),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  danger: true,
                  label: (
                    <Popconfirm
                      title="Delete Invoice"
                      description="Are you sure you want to delete this invoice?"
                      onConfirm={() => handleDelete(record.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <span>Delete</span>
                    </Popconfirm>
                  ),
                  icon: <DeleteOutlined />,
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
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
        message.success('Invoice created');
        reset();
        setOpen(false);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to create invoice');
      }
    });
  };

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <FileTextOutlined className={titleIconClassName} /> Sales Invoices
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Create Invoice
        </Button>
      </Flex>

      <Card className={cardClassName}>
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
        size="large"
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

          <Form.Item label="Client Billing Name">
            <Input 
              value={selectedProject?.clientName || 'Select a project to see client name'} 
              disabled 
              placeholder="Client name will autofill"
            />
          </Form.Item>

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
          <LineItemsEditor control={control} name="items" />
          {errors.items?.message && (
            <Typography.Text type="danger" className="mt-2 block">
              {errors.items.message}
            </Typography.Text>
          )}
        </Form>
      </Drawer>

      <Modal
        title={`Invoice Preview — ${previewInvoice?.invoiceNumber}`}
        open={!!previewInvoice}
        onCancel={() => setPreviewInvoice(null)}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setPreviewInvoice(null)}>Close</Button>,
          previewInvoice && (
            <PDFDownloadLink
              key="download"
              document={<InvoicePdf invoice={previewInvoice} />}
              fileName={`${previewInvoice.invoiceNumber}.pdf`}
            >
              <Button type="primary" icon={<FilePdfOutlined />}>
                Download PDF
              </Button>
            </PDFDownloadLink>
          )
        ]}
      >
        <div style={{ height: '75vh', width: '100%', backgroundColor: '#f0f2f5' }}>
          {previewInvoice && (
            <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none' }}>
              <InvoicePdf invoice={previewInvoice} />
            </PDFViewer>
          )}
        </div>
      </Modal>
    </div>
  );
}
