'use client';

import { useEffect, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  App,
  Select,
  DatePicker,
  InputNumber,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  FilePdfOutlined,
  PlusOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import {
  createSubcontractWorkOrder,
  deleteSubcontractWorkOrder,
  updateSubcontractWorkOrder,
} from '@/actions/subcontract-work-orders';
import type { SubcontractWorkOrder, Project, Subcontractor, WorkCategory } from '@/types/erp';
import { SubcontractWorkOrderPdf } from './SubcontractWorkOrderPdf';
import {
  cardClassName,
  formatDate,
  pageHeaderClassName,
  pageTitleClassName,
  titleIconClassName,
} from './ui';

const swoSchema = z.object({
  woNumber: z.string().min(2, 'WO number is required'),
  projectId: z.string().min(1, 'Project is required'),
  subcontractorId: z.string().min(1, 'Subcontractor is required'),
  workCategoryId: z.string().min(1, 'Work category is required'),
  description: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.number().min(0.01, 'Rate must be greater than 0'),
  gstPercentage: z.number().min(0, 'GST % cannot be negative'),
  startDate: z.any().optional(),
  endDate: z.any().optional(),
  notes: z.string().optional(),
});

type SwoFormValues = z.infer<typeof swoSchema>;

type SubcontractWorkOrdersClientProps = {
  workOrders: SubcontractWorkOrder[];
  projects: Project[];
  subcontractors: Subcontractor[];
  workCategories: WorkCategory[];
};

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Admin Approved', value: 'admin_approved' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export function SubcontractWorkOrdersClient({
  workOrders,
  projects,
  subcontractors,
  workCategories,
}: SubcontractWorkOrdersClientProps) {
  const [open, setOpen] = useState(false);
  const [editingSwo, setEditingSwo] = useState<SubcontractWorkOrder | null>(null);
  const [previewSwo, setPreviewSwo] = useState<SubcontractWorkOrder | null>(null);
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
    watch,
  } = useForm<SwoFormValues>({
    resolver: zodResolver(swoSchema),
    defaultValues: {
      woNumber: '',
      projectId: '',
      subcontractorId: '',
      workCategoryId: '',
      description: '',
      quantity: 0,
      unit: 'sqft',
      rate: 0,
      gstPercentage: 18,
      notes: '',
    },
  });

  const selectedSubcontractorId = watch('subcontractorId');
  const quantity = watch('quantity');
  const rate = watch('rate');
  const gstPercentage = watch('gstPercentage');

  // Autofill Work Category when Subcontractor is selected
  useEffect(() => {
    if (selectedSubcontractorId && !editingSwo) {
      const sub = subcontractors.find((s) => s.id === selectedSubcontractorId);
      if (sub && sub.workCategory) {
        setValue('workCategoryId', sub.workCategory.id);
      }
    }
  }, [selectedSubcontractorId, subcontractors, setValue, editingSwo]);

  const amount = (quantity || 0) * (rate || 0);
  const gstAmount = (amount * (gstPercentage || 0)) / 100;
  const totalAmount = amount + gstAmount;

  useEffect(() => {
    if (editingSwo) {
      setValue('woNumber', editingSwo.woNumber);
      setValue('projectId', editingSwo.projectId);
      setValue('subcontractorId', editingSwo.subcontractorId);
      setValue('workCategoryId', editingSwo.workCategoryId);
      setValue('description', editingSwo.description || '');
      setValue('quantity', Number(editingSwo.quantity));
      setValue('unit', editingSwo.unit);
      setValue('rate', Number(editingSwo.rate));
      setValue('gstPercentage', Number(editingSwo.gstPercentage));
      setValue('notes', editingSwo.notes || '');
      setValue('startDate', editingSwo.startDate ? dayjs(editingSwo.startDate) : undefined);
      setValue('endDate', editingSwo.endDate ? dayjs(editingSwo.endDate) : undefined);
    } else {
      reset({
        woNumber: `SWO-${dayjs().format('YYYY')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        projectId: '',
        subcontractorId: '',
        workCategoryId: '',
        description: '',
        quantity: 0,
        unit: 'sqft',
        rate: 0,
        gstPercentage: 18,
        notes: '',
      });
    }
  }, [editingSwo, setValue, reset]);

  const handleEdit = (swo: SubcontractWorkOrder) => {
    setEditingSwo(swo);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteSubcontractWorkOrder(id);
        message.success('Work order deleted successfully');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to delete work order');
      }
    });
  };

  const columns: ColumnsType<SubcontractWorkOrder> = [
    {
      title: 'WO Number',
      dataIndex: 'woNumber',
      key: 'woNumber',
      render: (text) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      key: 'project',
    },
    {
      title: 'Subcontractor',
      dataIndex: ['subcontractor', 'name'],
      key: 'subcontractor',
    },
    {
      title: 'Category',
      dataIndex: ['workCategory', 'name'],
      key: 'category',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (value) => `₹${Number(value).toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      filters: STATUS_OPTIONS.map(opt => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.status === value,
      render: (value: string) => (
        <Typography.Text>{value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'}</Typography.Text>
      ),
    },
    {
      title: 'Date Range',
      key: 'dates',
      render: (_, record) => (
        <Typography.Text className="text-xs">
          {record.startDate ? dayjs(record.startDate).format('DD/MM/YY') : '-'} to{' '}
          {record.endDate ? dayjs(record.endDate).format('DD/MM/YY') : '-'}
        </Typography.Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          {isClient && (
            <Button
              type="text"
              icon={<FilePdfOutlined className="text-red-500" />}
              title="Preview PDF"
              onClick={() => setPreviewSwo(record)}
            />
          )}
          <Button
            type="text"
            icon={<EditOutlined className="text-sky-500" />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Work Order"
            description="Are you sure?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, loading: isPending }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const submit = (values: SwoFormValues) => {
    const formattedValues = {
      ...values,
      startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : undefined,
      endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : undefined,
    };

    startTransition(async () => {
      try {
        if (editingSwo) {
          await updateSubcontractWorkOrder(editingSwo.id, formattedValues);
          message.success('Work order updated');
        } else {
          await createSubcontractWorkOrder(formattedValues);
          message.success('Work order created');
        }
        setOpen(false);
        setEditingSwo(null);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to save');
      }
    });
  };

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Typography.Title level={3} className={pageTitleClassName}>
          <FileTextOutlined className={titleIconClassName} /> Subcontract Work Orders
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          New Subcontract WO
        </Button>
      </Flex>

      <Card className={cardClassName}>
        <Table
          dataSource={workOrders}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Drawer
        title={editingSwo ? 'Edit Subcontract WO' : 'New Subcontract WO'}
        size="large"
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit(submit)}>
              Save Work Order
            </Button>
          </Space>
        }
      >
        <Form layout="vertical">
          <Flex gap={16}>
            <Controller
              control={control}
              name="woNumber"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="WO Number"
                  required
                  className="flex-1"
                  validateStatus={fieldState.error ? 'error' : undefined}
                  help={fieldState.error?.message}
                >
                  <Input {...field} placeholder="WO-2026-001" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="projectId"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Project"
                  required
                  className="flex-1"
                  validateStatus={fieldState.error ? 'error' : undefined}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    options={projects.map((p) => ({ label: p.name, value: p.id }))}
                    placeholder="Select Project"
                  />
                </Form.Item>
              )}
            />
          </Flex>

          <Flex gap={16}>
            <Controller
              control={control}
              name="subcontractorId"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Subcontractor"
                  required
                  className="flex-1"
                  validateStatus={fieldState.error ? 'error' : undefined}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    options={subcontractors.map((s) => ({ label: s.name, value: s.id }))}
                    placeholder="Select Subcontractor"
                  />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="workCategoryId"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Work Category"
                  required
                  className="flex-1"
                  validateStatus={fieldState.error ? 'error' : undefined}
                  help={fieldState.error?.message}
                >
                  <Select
                    {...field}
                    options={workCategories.map((c) => ({ label: c.name, value: c.id }))}
                    placeholder="Select Category"
                  />
                </Form.Item>
              )}
            />
          </Flex>

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Form.Item label="Description of Work">
                <Input.TextArea {...field} rows={2} placeholder="Briefly describe the scope of work" />
              </Form.Item>
            )}
          />

          <Flex gap={16}>
            <Controller
              control={control}
              name="quantity"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Quantity"
                  required
                  className="flex-1"
                  validateStatus={fieldState.error ? 'error' : undefined}
                  help={fieldState.error?.message}
                >
                  <InputNumber {...field} style={{ width: '100%' }} placeholder="e.g. 1000" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <Form.Item label="Unit" className="w-32">
                  <Input {...field} placeholder="sqft" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="rate"
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Rate"
                  required
                  className="flex-1"
                  validateStatus={fieldState.error ? 'error' : undefined}
                  help={fieldState.error?.message}
                >
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => v!.replace(/₹\s?|(,*)/g, '') as unknown as number}
                  />
                </Form.Item>
              )}
            />
          </Flex>

          <Flex gap={16}>
            <Controller
              control={control}
              name="gstPercentage"
              render={({ field }) => (
                <Form.Item label="GST %" className="w-32">
                  <InputNumber {...field} style={{ width: '100%' }} />
                </Form.Item>
              )}
            />
            <Form.Item label="Basic Amount" className="flex-1">
              <Input value={`₹ ${amount.toLocaleString()}`} disabled className="bg-slate-800!" />
            </Form.Item>
            <Form.Item label="Total with GST" className="flex-1">
              <Input value={`₹ ${totalAmount.toLocaleString()}`} disabled className="bg-sky-900/20! border-sky-500/30!" />
            </Form.Item>
          </Flex>

          <Flex gap={16}>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <Form.Item label="Start Date" className="flex-1">
                  <DatePicker {...field} style={{ width: '100%' }} />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <Form.Item label="End Date" className="flex-1">
                  <DatePicker {...field} style={{ width: '100%' }} />
                </Form.Item>
              )}
            />
          </Flex>

          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <Form.Item label="Notes">
                <Input.TextArea {...field} rows={4} placeholder="Execution terms, special instructions, etc." />
              </Form.Item>
            )}
          />
        </Form>
      </Drawer>

      {/* PDF Preview Modal */}
      <Modal
        title={`Subcontract Work Order Preview — ${previewSwo?.woNumber}`}
        open={!!previewSwo}
        onCancel={() => setPreviewSwo(null)}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setPreviewSwo(null)}>Close</Button>,
          previewSwo && (
            <PDFDownloadLink
              key="download"
              document={<SubcontractWorkOrderPdf workOrder={previewSwo} />}
              fileName={`${previewSwo.woNumber}.pdf`}
            >
              <Button type="primary" icon={<FilePdfOutlined />}>
                Download PDF
              </Button>
            </PDFDownloadLink>
          )
        ]}
      >
        <div style={{ height: '75vh', width: '100%', backgroundColor: '#f0f2f5' }}>
          {previewSwo && (
            <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none' }}>
              <SubcontractWorkOrderPdf workOrder={previewSwo} />
            </PDFViewer>
          )}
        </div>
      </Modal>
    </div>
  );
}
