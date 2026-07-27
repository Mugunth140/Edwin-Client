'use client';

import { useEffect, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Drawer, Flex, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography, App, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, FilePdfOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { createPurchaseEnquiry, updatePurchaseEnquiry, deletePurchaseEnquiry } from '@/actions/purchase-enquiries';
import { createItemDescription, deleteItemDescription } from '@/actions/item-descriptions';
import type { Project, Vendor, PurchaseEnquiry, ItemDescription } from '@/types/erp';
import { cardClassName, formatDate, pageHeaderClassName, pageTitleClassName, titleIconClassName } from './ui';
import { PurchaseEnquiryPdf } from './PurchaseEnquiryPdf';

type Props = {
  enquiries: PurchaseEnquiry[];
  projects: Project[];
  vendors: Vendor[];
  itemDescriptions: ItemDescription[];
};

const itemSchema = z.object({
  description: z.string().min(1, 'Required'),
  quantity: z.number().min(1, 'Min 1'),
});

const peSchema = z.object({
  vendorId: z.string().min(1, 'Select a vendor'),
  projectId: z.string().min(1, 'Select a project'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
});

type PeFormValues = z.infer<typeof peSchema>;

export function PurchaseEnquiryClient({ enquiries, projects, vendors, itemDescriptions }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseEnquiry | null>(null);
  const [previewEnquiry, setPreviewEnquiry] = useState<PurchaseEnquiry | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isClient, setIsClient] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const { message } = App.useApp();

  useEffect(() => { setIsClient(true); }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PeFormValues>({
    resolver: zodResolver(peSchema),
    defaultValues: {
      vendorId: '',
      projectId: '',
      notes: '',
      items: [{ description: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (editing) {
      reset({
        vendorId: editing.vendorId,
        projectId: editing.projectId,
        notes: editing.notes || '',
        items: editing.items?.length ? editing.items.map((i) => ({ description: i.description, quantity: Number(i.quantity) })) : [{ description: '', quantity: 1 }],
      });
    }
  }, [editing, reset]);

  const submit = (values: PeFormValues) => {
    startTransition(async () => {
      try {
        if (editing) {
          await updatePurchaseEnquiry(editing.id, values);
          message.success('Purchase enquiry updated');
        } else {
          await createPurchaseEnquiry(values);
          message.success('Purchase enquiry created');
        }
        setOpen(false);
        setEditing(null);
        reset();
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Operation failed');
      }
    });
  };

  const columns: ColumnsType<PurchaseEnquiry> = [
    { title: 'S.No', key: 'sno', width: 60, render: (_, __, i) => i + 1 },
    { title: 'Enquiry No', dataIndex: 'enquiryNo', key: 'enquiryNo', width: 150 },
    { title: 'Vendor', key: 'vendor', width: 180, render: (_, r) => r.vendor?.name || r.vendorId },
    { title: 'Project', key: 'project', width: 180, render: (_, r) => r.project?.name || r.projectId },
    {
      title: 'Items',
      key: 'items',
      width: 250,
      render: (_, r) => (
        <Flex vertical>
          {r.items?.map((item, i) => (
            <Typography.Text key={i} type="secondary" className="text-xs">
              {item.description} — Qty: {item.quantity}
            </Typography.Text>
          ))}
        </Flex>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              setOpen(true);
            }}
          />
          <Button
            type="link"
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => setPreviewEnquiry(record)}
          />
          <Popconfirm title="Delete this enquiry?" onConfirm={() => startTransition(async () => {
            try {
              await deletePurchaseEnquiry(record.id);
              message.success('Deleted');
            } catch (e) {
              message.error('Failed to delete');
            }
          })}>
            <Button danger type="link" size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <ShoppingCartOutlined className={titleIconClassName} /> Purchase Enquiries
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            reset({ vendorId: '', projectId: '', notes: '', items: [{ description: '', quantity: 1 }] });
            setOpen(true);
          }}
        >
          New Enquiry
        </Button>
      </Flex>

      <Card className={cardClassName}>
        <Table
          dataSource={enquiries}
          columns={columns}
          rowKey="id"
          loading={isPending}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Drawer
        title={editing ? `Edit Enquiry — ${editing.enquiryNo}` : 'New Purchase Enquiry'}
        size="large"
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit(submit)}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Flex vertical gap={16}>
          <Controller
            control={control}
            name="vendorId"
            render={({ field, fieldState }) => (
              <Form.Item label="Vendor" validateStatus={fieldState.error ? 'error' : undefined} help={fieldState.error?.message}>
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
            name="projectId"
            render={({ field, fieldState }) => (
              <Form.Item label="Project" validateStatus={fieldState.error ? 'error' : undefined} help={fieldState.error?.message}>
                <Select
                  {...field}
                  showSearch
                  placeholder="Select project"
                  optionFilterProp="label"
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                />
              </Form.Item>
            )}
          />

          <Flex justify="space-between" align="center">
            <Typography.Text strong>Items</Typography.Text>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setDescOpen(true)}>
              Manage descriptions
            </Button>
          </Flex>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={8} align="flex-start" wrap="wrap">
              <Controller
                control={control}
                name={`items.${index}.description`}
                render={({ field: f, fieldState }) => (
                  <Form.Item
                    label="Description"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    className="mb-2 min-w-60 flex-1"
                  >
                    <Select
                      {...f}
                      showSearch
                      allowClear
                      placeholder="Select or type an item"
                      options={itemDescriptions?.map((d) => ({ label: d.name, value: d.name }))}
                    />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name={`items.${index}.quantity`}
                render={({ field: f, fieldState }) => (
                  <Form.Item
                    label="Qty"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    className="mb-2 w-30"
                  >
                    <InputNumber min={1} precision={0} className="w-full" value={f.value} onChange={(v) => f.onChange(v ?? 1)} />
                  </Form.Item>
                )}
              />
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="mt-7"
              />
            </Flex>
          ))}
          <Button icon={<PlusOutlined />} onClick={() => append({ description: '', quantity: 1 })}>
            Add Item
          </Button>
          {errors.items?.message && (
            <Typography.Text type="danger">{errors.items.message}</Typography.Text>
          )}

          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <Form.Item label="Notes">
                <Input.TextArea {...field} rows={4} placeholder="Any notes for the vendor..." />
              </Form.Item>
            )}
          />
        </Flex>
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

      <Modal
        title={`Purchase Enquiry — ${previewEnquiry?.enquiryNo || ''}`}
        open={!!previewEnquiry}
        onCancel={() => setPreviewEnquiry(null)}
        width="90%"
        style={{ top: 20 }}
        footer={
          previewEnquiry && isClient ? (
            <PDFDownloadLink document={<PurchaseEnquiryPdf enquiry={previewEnquiry} />} fileName={`${previewEnquiry.enquiryNo}.pdf`}>
              {({ loading }) => <Button type="primary" icon={<FilePdfOutlined />} loading={loading}>Download PDF</Button>}
            </PDFDownloadLink>
          ) : null
        }
      >
        {previewEnquiry && isClient && (
          <PDFViewer style={{ width: '100%', height: '80vh' }} showToolbar>
            <PurchaseEnquiryPdf enquiry={previewEnquiry} />
          </PDFViewer>
        )}
      </Modal>
    </div>
  );
}
