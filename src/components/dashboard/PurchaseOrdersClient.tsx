'use client';

import { useEffect, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Drawer, Flex, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, FilePdfOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { createPurchaseOrder, updatePurchaseOrderStatus, updatePurchaseOrder, deletePurchaseOrder } from '@/actions/purchase-orders';
import type { Project, Vendor, PurchaseOrder, WorkOrder } from '@/types/erp';
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
  workOrders: WorkOrder[];
};

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Issued', value: 'issued' },
  { label: 'Partially Received', value: 'partially_received' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function PurchaseOrdersClient({ purchaseOrders, projects, vendors, workOrders }: PurchaseOrdersClientProps) {
  const [open, setOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
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
    setValue,
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

  useEffect(() => {
    if (editingPo) {
      reset({
        vendorId: editingPo.vendorId,
        projectId: editingPo.projectId,
        paymentTerms: editingPo.paymentTerms || '',
        items: editingPo.items?.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || 'nos',
          rate: Number(item.rate),
        })) || [{ description: '', quantity: 1, unit: 'nos', rate: 0 }],
      });
      setOpen(true);
    }
  }, [editingPo, reset]);

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPo(po);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deletePurchaseOrder(id);
        message.success('Purchase order deleted');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Delete failed');
      }
    });
  };

  const handleWoSelect = (woId: string) => {
    const wo = workOrders.find((w) => w.id === woId);
    if (!wo) return;

    setValue('vendorId', wo.vendorId);
    setValue('projectId', wo.projectId);
    setValue('paymentTerms', wo.terms || '');

    if (wo.items && wo.items.length > 0) {
      const items = wo.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit || 'nos',
        rate: Number(item.rate),
      }));
      setValue('items', items);
    }

    message.info(`Autofilled from Work Order ${wo.woNumber}`);
  };

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updatePurchaseOrderStatus(id, status);
        message.success('Status updated');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to update status');
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
      width: 150,
      filters: STATUS_OPTIONS.map((opt) => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.status === value,
      render: (value: string, record) => (
        <Select
          defaultValue={value}
          size="small"
          variant="borderless"
          className="w-full"
          onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
          options={STATUS_OPTIONS}
          popupMatchSelectWidth={false}
          styles={{ popup: { root: { minWidth: 140 } } }}
          disabled={isPending}
        />
      ),
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
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            title="Edit"
            onClick={() => handleEdit(record)}
          />
          {isClient && (
            <Button
              type="text"
              icon={<FilePdfOutlined className="text-red-500" />}
              title="Preview PDF"
              onClick={() => setPreviewPo(record)}
            />
          )}
          <Popconfirm
            title="Delete Purchase Order?"
            description="This will permanently delete this PO."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined className="text-red-500" />}
              title="Delete"
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
        if (editingPo) {
          await updatePurchaseOrder(editingPo.id, values);
          message.success('Purchase order updated successfully');
        } else {
          await createPurchaseOrder(values);
          message.success('Purchase order created successfully');
        }
        setOpen(false);
        setEditingPo(null);
        reset();
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Operation failed');
      }
    });
  };

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <ShoppingCartOutlined className={titleIconClassName} /> Purchase Orders
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingPo(null);
            reset({
              vendorId: '',
              projectId: '',
              paymentTerms: '',
              items: [{ description: '', quantity: 1, unit: 'nos', rate: 0 }],
            });
            setOpen(true);
          }}
        >
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
        title={editingPo ? `Edit Purchase Order — ${editingPo.poNumber}` : 'Create Purchase Order'}
        size="large"
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingPo(null);
        }}
        destroyOnClose
        extra={
          <Space>
            <Button
              onClick={() => {
                setOpen(false);
                setEditingPo(null);
              }}
            >
              Cancel
            </Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit(submit)}>
              {editingPo ? 'Update' : 'Save'}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" onFinish={handleSubmit(submit)}>
          {!editingPo && (
            <Form.Item
              label="Import from Work Order"
              className="mb-6 rounded-lg border border-white/10 bg-slate-50/5 p-4"
            >
              <Select
                showSearch
                placeholder="Search Work Order number to autofill..."
                optionFilterProp="label"
                onChange={handleWoSelect}
                options={workOrders.map((wo) => ({
                  value: wo.id,
                  label: `${wo.woNumber} - ${wo.vendor?.name || 'Unknown Vendor'}`,
                }))}
              />
            </Form.Item>
          )}

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
