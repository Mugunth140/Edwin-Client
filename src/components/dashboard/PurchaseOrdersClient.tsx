'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Drawer, Flex, Form, Input, InputNumber, Popconfirm, Select, Space, Table, Typography, Upload, App, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, FilePdfOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { createPurchaseOrder, updatePurchaseOrderStatus, updatePurchaseOrder, deletePurchaseOrder, uploadBillFile } from '@/actions/purchase-orders';
import { createItemDescription, deleteItemDescription } from '@/actions/item-descriptions';
import type { Project, Vendor, PurchaseOrder, ItemDescription, VendorQuotation } from '@/types/erp';
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
  gstPercent: z.number().min(0).optional(),
  items: z.array(itemSchema).min(1, 'Add at least one line item'),
});

type PoFormValues = z.infer<typeof poSchema>;

type PurchaseOrdersClientProps = {
  purchaseOrders: PurchaseOrder[];
  projects: Project[];
  vendors: Vendor[];
  itemDescriptions?: ItemDescription[];
  vendorQuotations?: VendorQuotation[];
};

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Admin Approved', value: 'admin_approved' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const peGroupByEnquiryNo = (vqs: VendorQuotation[]) => {
  const map = new Map<string, VendorQuotation[]>();
  for (const vq of vqs) {
    if (vq.status === 'approved') {
      const key = vq.enquiryNo;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(vq);
    }
  }
  return Array.from(map.entries()).map(([enquiryNo, quotations]) => ({
    enquiryNo,
    quotations,
  }));
};

export function PurchaseOrdersClient({ purchaseOrders, projects, vendors, itemDescriptions, vendorQuotations: vendorQuotationsProp }: PurchaseOrdersClientProps) {
  const user = useAuthStore((s) => s.user);
  const canUpdateStatus = user?.role === 'admin' || user?.role === 'accounts_manager';
  const [open, setOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [descOpen, setDescOpen] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const { message } = App.useApp();

  const vendorQuotations = vendorQuotationsProp || [];

  const peGroups = useMemo(() => peGroupByEnquiryNo(vendorQuotations), [vendorQuotations]);

  const handleEnquirySelect = (enquiryNo: string) => {
    const group = peGroups.find((g) => g.enquiryNo === enquiryNo);
    if (!group) return;
    const first = group.quotations[0];
    const projectId = first.projectId;
    const vendorOptions = group.quotations.map((q) => ({
      value: q.vendorId,
      label: q.vendor?.name || q.vendorId,
    }));
    setPeVendorOptions(vendorOptions);
    setSelectedPEGroup(group);
    reset({
      vendorId: '',
      projectId,
      paymentTerms: '',
      gstPercent: 0,
      items: [],
    });
    message.success(`Loaded ${group.quotations.length} vendor(s) from PE ${enquiryNo}`);
  };

  const [selectedPEGroup, setSelectedPEGroup] = useState<{ enquiryNo: string; quotations: VendorQuotation[] } | null>(null);
  const [peVendorOptions, setPeVendorOptions] = useState<{ value: string; label: string }[]>([]);

  const handlePeVendorSelect = (vendorId: string) => {
    const vq = selectedPEGroup?.quotations.find((q) => q.vendorId === vendorId);
    if (!vq) return;
    reset({
      vendorId: vq.vendorId,
      projectId: vq.projectId,
      paymentTerms: '',
      gstPercent: 0,
      items: vq.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: 'nos',
        rate: 0,
      })),
    });
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PoFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      vendorId: '',
      projectId: '',
      paymentTerms: '',
      gstPercent: 0,
      items: [{ description: '', quantity: 1, unit: 'nos', rate: 0 }],
    },
  });

  const watchedItems = watch('items');
  const watchedGstPercent = watch('gstPercent') || 0;
  const basicAmount = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate || 0)), 0);
  }, [watchedItems]);
  const gstAmount = useMemo(() => Number((basicAmount * watchedGstPercent / 100).toFixed(2)), [basicAmount, watchedGstPercent]);
  const totalWithGst = useMemo(() => Number((basicAmount + gstAmount).toFixed(2)), [basicAmount, gstAmount]);

  useEffect(() => {
    if (editingPo) {
      reset({
        vendorId: editingPo.vendorId,
        projectId: editingPo.projectId,
        paymentTerms: editingPo.paymentTerms || '',
        gstPercent: Number(editingPo.gstPercent) || 0,
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
      title: 'Basic Amount',
      dataIndex: 'totalAmount',
      align: 'right',
      sorter: (a, b) => Number(a.totalAmount) - Number(b.totalAmount),
      render: (value: number | string) => formatCurrency(value),
    },
    {
      title: 'GST',
      key: 'gst',
      align: 'right',
      width: 100,
      render: (_, r) => (r.gstPercent ? `${Number(r.gstPercent)}%` : '-'),
    },
    {
      title: 'Total w/ GST',
      key: 'totalWithGst',
      align: 'right',
      width: 130,
      sorter: (a, b) => Number(a.totalWithGst || 0) - Number(b.totalWithGst || 0),
      render: (_, r) => formatCurrency(r.totalWithGst || r.totalAmount),
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
        if (values.gstPercent) payload.gstPercent = Number(values.gstPercent);
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
            setSelectedPEGroup(null);
            setPeVendorOptions([]);
            reset({
              vendorId: '',
              projectId: '',
              paymentTerms: '',
              gstPercent: 0,
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
          scroll={{ x: 1300 }}
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
          setSelectedPEGroup(null);
          setPeVendorOptions([]);
        }}
        destroyOnClose
        extra={
          <Space>
            <Button
              onClick={() => {
                setOpen(false);
                setEditingPo(null);
                setSelectedPEGroup(null);
                setPeVendorOptions([]);
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
          {peGroups.length > 0 && !editingPo && (
            <Form.Item label="Import from Purchase Enquiry" className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <Flex vertical gap={8}>
                <Select
                  showSearch
                  placeholder="Search PE number..."
                  optionFilterProp="label"
                  onChange={handleEnquirySelect}
                  value={selectedPEGroup?.enquiryNo || undefined}
                  options={peGroups.map((g) => ({
                    value: g.enquiryNo,
                    label: `${g.enquiryNo} (${g.quotations.length} vendor${g.quotations.length > 1 ? 's' : ''})`,
                  }))}
                />
                {peVendorOptions.length > 0 && (
                  <Select
                    showSearch
                    placeholder="Select approved vendor..."
                    optionFilterProp="label"
                    onChange={handlePeVendorSelect}
                    options={peVendorOptions}
                  />
                )}
              </Flex>
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

          <div className="mt-4 rounded-lg border border-gray-200! p-4">
            <Typography.Text strong className="block mb-3">GST & Totals</Typography.Text>
            <Flex gap={16} wrap="wrap">
              <Controller
                control={control}
                name="gstPercent"
                render={({ field }) => (
                  <Form.Item label="GST %" className="mb-0">
                    <InputNumber
                      {...field}
                      min={0}
                      max={100}
                      addonAfter="%"
                      onChange={(v) => field.onChange(v ?? 0)}
                    />
                  </Form.Item>
                )}
              />
              <Form.Item label="Basic Amount" className="mb-0">
                <Typography.Text strong className="text-lg">{formatCurrency(basicAmount)}</Typography.Text>
              </Form.Item>
              <Form.Item label="GST Amount" className="mb-0">
                <Typography.Text className="text-lg">{formatCurrency(gstAmount)}</Typography.Text>
              </Form.Item>
              <Form.Item label="Total with GST" className="mb-0">
                <Typography.Text strong className="text-lg">{formatCurrency(totalWithGst)}</Typography.Text>
              </Form.Item>
            </Flex>
          </div>

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