'use client';

import { useEffect, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Drawer, Flex, Form, Input, Popconfirm, Select, Space, Table, Typography, Upload, App, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, FilePdfOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { createPurchaseOrder, updatePurchaseOrderStatus, updatePurchaseOrder, deletePurchaseOrder, uploadBillFile } from '@/actions/purchase-orders';
import { createItemDescription, deleteItemDescription } from '@/actions/item-descriptions';
import type { Project, Vendor, PurchaseOrder, ItemDescription, PurchaseEnquiry } from '@/types/erp';
import { LineItemsEditor } from './LineItemsEditor';
import { useAuthStore } from '@/store/auth';
import {
  cardClassName,
  formatCurrency,
  formatDate,
  pageHeaderClassName,
  pageTitleClassName,
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
  itemDescriptions?: ItemDescription[];
  purchaseEnquiries?: PurchaseEnquiry[];
};

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Admin Approved', value: 'admin_approved' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export function PurchaseOrdersClient({ purchaseOrders, projects, vendors, itemDescriptions, purchaseEnquiries }: PurchaseOrdersClientProps) {
  const user = useAuthStore((s) => s.user);
  const canUpdateStatus = user?.role === 'admin' || user?.role === 'accounts_manager';
  const [open, setOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [descOpen, setDescOpen] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const { message } = App.useApp();

  const handleEnquirySelect = (enquiryId: string) => {
    const enquiry = purchaseEnquiries?.find((e) => e.id === enquiryId);
    if (!enquiry) return;
    reset({
      vendorId: enquiry.vendorId ?? undefined,
      projectId: enquiry.projectId,
      paymentTerms: '',
      items: enquiry.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: 'nos',
        rate: 0,
      })),
    });
    message.success(`Loaded ${enquiry.items.length} items from enquiry ${enquiry.enquiryNo}`);
  };

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
      setBillFile(null);
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
      render: (value: string, record) =>
        canUpdateStatus ? (
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
        ) : (
          <Typography.Text>{value.charAt(0).toUpperCase() + value.slice(1)}</Typography.Text>
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
      title: 'PO',
      key: 'billFile',
      width: 120,
      render: (_, record) =>
        record.billFileUrl ? (
          <Button type="link" size="small" icon={<FilePdfOutlined />} href={record.billFileUrl} target="_blank">
            View PO
          </Button>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: 'Fulfillment',
      key: 'fulfillment',
      width: 150,
      render: (_, record) => {
        const totalQty = record.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
        const totalBilled = record.items?.reduce((sum, item) => sum + Number(item.billedQuantity || 0), 0) || 0;
        const percent = totalQty > 0 ? Math.round((totalBilled / totalQty) * 100) : 0;
        
        let status: "success" | "active" | "normal" | "exception" = "normal";
        if (percent === 100) status = "success";
        else if (percent > 0) status = "active";
        
        return (
          <Flex vertical gap={4}>
            <Progress percent={percent} size="small" status={status} strokeColor={percent === 100 ? '#52c41a' : '#1890ff'} />
            <Typography.Text className="text-[10px]" type="secondary">
              {totalBilled} / {totalQty} items billed
            </Typography.Text>
          </Flex>
        );
      },
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
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            title="Edit"
            onClick={() => handleEdit(record)}
          />
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

  const submit = async (values: PoFormValues) => {
    startTransition(async () => {
      try {
        let billFileUrl: string | undefined;
        let billFileKey: string | undefined;

        if (billFile) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(billFile);
          });
          const { fileUrl, fileKey } = await uploadBillFile({ name: billFile.name, base64 });
          billFileUrl = fileUrl;
          billFileKey = fileKey;
        }

        const payload: Record<string, unknown> = { ...values };
        if (billFileUrl) payload.billFileUrl = billFileUrl;
        if (billFileKey) payload.billFileKey = billFileKey;

        if (editingPo) {
          await updatePurchaseOrder(editingPo.id, payload);
          message.success('Purchase order updated successfully');
        } else {
          await createPurchaseOrder(payload);
          message.success('Purchase order created successfully');
        }
        setOpen(false);
        setEditingPo(null);
        setBillFile(null);
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
            setBillFile(null);
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
          {purchaseEnquiries && purchaseEnquiries.length > 0 && (
            <Form.Item label="Import from Material Requirement" className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <Select
                showSearch
                placeholder="Search enquiry to autofill..."
                optionFilterProp="label"
                onChange={handleEnquirySelect}
                options={purchaseEnquiries.map((enq) => ({
                  value: enq.id,
                  label: `${enq.enquiryNo} - ${enq.vendor?.name || 'Unknown Vendor'}`,
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
          <Flex justify="flex-end" className="mb-1">
                        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setDescOpen(true)}>
                          Manage item descriptions
                        </Button>
                      </Flex>
                      <LineItemsEditor
                        control={control}
                        name="items"
                        descriptionOptions={itemDescriptions?.map((d) => ({ label: d.name, value: d.name }))}
                      />
          {errors.items?.message && (
            <Typography.Text type="danger" className="mt-2 block">
              {errors.items.message}
            </Typography.Text>
          )}

          <Typography.Text strong className="mt-4 block">PO</Typography.Text>
          <Upload
            accept=".pdf,.jpg,.jpeg,.png"
            showUploadList={false}
            beforeUpload={(file) => { setBillFile(file); return false; }}
            onRemove={() => setBillFile(null)}
          >
            <Button icon={<FilePdfOutlined />}>
              {billFile ? billFile.name : (editingPo?.billFileUrl ? 'Replace PO' : 'Upload PO')}
            </Button>
          </Upload>
          {billFile && (
            <Typography.Text type="secondary" className="text-xs">{billFile.name}</Typography.Text>
          )}
          {editingPo?.billFileUrl && !billFile && (
            <Button type="link" size="small" href={editingPo.billFileUrl} target="_blank">
              View uploaded PO
            </Button>
          )}
        </Form>
      </Drawer>

      <Drawer
        title="Manage Item Descriptions"
        size="small"
        open={descOpen}
        onClose={() => setDescOpen(false)}
        destroyOnClose
        extra={
          <Button type="primary" loading={isPending} onClick={async () => {
            if (!newDesc.trim()) return;
            startTransition(async () => {
              try {
                await createItemDescription(newDesc.trim());
                setNewDesc('');
                message.success('Description added');
              } catch (error) {
                message.error(error instanceof Error ? error.message : 'Failed to add');
              }
            });
          }}>
            Add
          </Button>
        }
      >
        <Flex gap={8} className="mb-4">
          <Input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="New description name"
            onPressEnter={async () => {
              if (!newDesc.trim()) return;
              startTransition(async () => {
                try {
                  await createItemDescription(newDesc.trim());
                  setNewDesc('');
                  message.success('Description added');
                } catch (error) {
                  message.error(error instanceof Error ? error.message : 'Failed to add');
                }
              });
            }}
          />
        </Flex>
        <Flex vertical gap={4}>
          {itemDescriptions?.map((desc) => (
            <Flex key={desc.id} justify="space-between" align="center" className="rounded-lg border border-[var(--border)] px-3 py-2">
              <Typography.Text>{desc.name}</Typography.Text>
              <Popconfirm
                title="Delete"
                description={`Remove "${desc.name}"?`}
                onConfirm={async () => {
                  startTransition(async () => {
                    try {
                      await deleteItemDescription(desc.id);
                      message.success('Deleted');
                    } catch (error) {
                      message.error(error instanceof Error ? error.message : 'Failed to delete');
                    }
                  });
                }}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            </Flex>
          ))}
        </Flex>
      </Drawer>
    </div>
  );
}
