'use client';

import { useEffect, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Drawer, Flex, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, FilePdfOutlined, PlusOutlined, ShoppingCartOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { createPurchaseOrder, convertPoToBill } from '@/actions/purchase-orders';
import type { Project, Vendor, PurchaseOrder } from '@/types/erp';
import { LineItemsEditor } from './LineItemsEditor';
import { PurchaseOrderPdf } from './PurchaseOrderPdf';
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

const poSchema = z.object({
  vendorId: z.string().min(1, 'Select a vendor'),
  projectId: z.string().min(1, 'Select a project'),
  paymentTerms: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one line item'),
});

type PoFormValues = z.infer<typeof poSchema>;

type PurchaseOrdersClientProps = {
  purchaseOrders: PurchaseOrder[];
  projects: Project[];
  vendors: Vendor[];
};

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Approved', value: 'approved' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function PurchaseOrdersClient({ purchaseOrders, projects, vendors }: PurchaseOrdersClientProps) {
  const [open, setOpen] = useState(false);
  const [previewPo, setPreviewPo] = useState<PurchaseOrder | null>(null);
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
  } = useForm<PoFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      vendorId: '',
      projectId: '',
      paymentTerms: '',
      items: [{ description: '', quantity: 1, unit: 'nos', rate: 0 }],
    },
  });

  const handleConvert = (id: string) => {
    startTransition(async () => {
      try {
        await convertPoToBill(id);
        message.success('Converted to Bill successfully');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Conversion failed');
      }
    });
  };

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: 'S.No',
      key: 'sno',
      width: 60,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      sorter: (a, b) => a.poNumber.localeCompare(b.poNumber),
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      sorter: (a, b) => (a.vendor?.name || '').localeCompare(b.vendor?.name || ''),
      render: (_value, record) => record.vendor?.name || '-',
    },
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      sorter: (a, b) => (a.project?.name || '').localeCompare(b.project?.name || ''),
      render: (_value, record) => record.project?.name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      filters: STATUS_OPTIONS.map(opt => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.status === value,
      render: (value: string) => <StatusTag value={value} />,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      align: 'right',
      sorter: (a, b) => Number(a.totalAmount) - Number(b.totalAmount),
      render: (value: number | string) => formatCurrency(value),
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
      width: 130,
      render: (_, record) => (
        <Space>
          {isClient && (
            <Button
              type="text"
              icon={<FilePdfOutlined className="text-red-500" />}
              title="Preview PDF"
              onClick={() => setPreviewPo(record)}
            />
          )}
          <Popconfirm
            title="Convert to Bill?"
            description="This will create a purchase bill from this PO."
            onConfirm={() => handleConvert(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<CheckCircleOutlined className="text-green-500" />}
              title="Convert to Bill"
              loading={isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const submit = (values: PoFormValues) => {
    startTransition(async () => {
      try {
        await createPurchaseOrder(values);
        message.success('Purchase order created successfully');
        setOpen(false);
        reset();
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to create purchase order');
      }
    });
  };

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <ShoppingCartOutlined className={titleIconClassName} /> Purchase Orders
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Create PO
        </Button>
      </Flex>

      <Card className={cardClassName}>
        <Table
          dataSource={purchaseOrders}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} POs` }}
        />
      </Card>

      <Drawer
        title="Create Purchase Order"
        size="large"
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose
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
            name="paymentTerms"
            render={({ field }) => (
              <Form.Item label="Payment Terms">
                <Input.TextArea {...field} rows={3} placeholder="Net 30, 50% advance, etc..." />
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
        title={`Purchase Order Preview — ${previewPo?.poNumber}`}
        open={!!previewPo}
        onCancel={() => setPreviewPo(null)}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setPreviewPo(null)}>Close</Button>,
          previewPo && (
            <PDFDownloadLink
              key="download"
              document={<PurchaseOrderPdf purchaseOrder={previewPo} />}
              fileName={`${previewPo.poNumber}.pdf`}
            >
              <Button type="primary" icon={<FilePdfOutlined />}>
                Download PDF
              </Button>
            </PDFDownloadLink>
          )
        ]}
      >
        <div style={{ height: '75vh', width: '100%', backgroundColor: '#f0f2f5' }}>
          {previewPo && (
            <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none' }}>
              <PurchaseOrderPdf purchaseOrder={previewPo} />
            </PDFViewer>
          )}
        </div>
      </Modal>
    </div>
  );
}
