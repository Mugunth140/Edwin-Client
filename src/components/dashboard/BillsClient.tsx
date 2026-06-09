'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button, Card, DatePicker, Drawer, Flex, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileDoneOutlined, PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import { createBill } from '@/actions/invoices';
import { createPayment } from '@/actions/payments';
import type { Vendor, Project, PurchaseBill, PurchaseOrder } from '@/types/erp';
import { PaymentMode, BillStatus } from '@/types/erp';
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

const billSchema = z.object({
  vendorId: z.string().min(1, 'Select a vendor'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().optional(),
  billDate: z.string().min(1, 'Select bill date'),
  projectId: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Select payment date'),
  paymentMode: z.string().min(1, 'Select payment mode'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type BillFormValues = z.infer<typeof billSchema>;
type PaymentFormValues = z.infer<typeof paymentSchema>;

type BillsClientProps = {
  bills: PurchaseBill[];
  vendors: Vendor[];
  projects: Project[];
  purchaseOrders: PurchaseOrder[];
};

export function BillsClient({ bills, vendors, projects, purchaseOrders }: BillsClientProps) {
  const [open, setOpen] = useState(false);
  const [paymentBill, setPaymentBill] = useState<PurchaseBill | null>(null);
  const [historyBill, setHistoryBill] = useState<PurchaseBill | null>(null);
  const [isPending, startTransition] = useTransition();
  const { message } = App.useApp();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
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

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'upi',
      referenceNumber: '',
      notes: '',
    },
  });

  const handlePoSelect = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setValue('vendorId', po.vendorId);
      setValue('amount', Number(po.totalAmount));
      if (po.projectId) {
        setValue('projectId', po.projectId);
      }
      message.info(`Autofilled from PO ${po.poNumber}`);
    }
  };

  const submitPayment = (values: PaymentFormValues) => {
    if (!paymentBill) return;

    startTransition(async () => {
      try {
        await createPayment({
          ...values,
          purchaseBillId: paymentBill.id,
          paymentType: 'material', // Default for purchase bills
        });
        message.success('Payment recorded successfully');
        paymentForm.reset();
        setPaymentBill(null);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to record payment');
      }
    });
  };

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
      title: 'Total Amount',
      dataIndex: 'amount',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      align: 'right',
      render: (value) => <Typography.Text type="success">{formatCurrency(value)}</Typography.Text>,
    },
    {
      title: 'Balance',
      key: 'balance',
      align: 'right',
      render: (_, record) => {
        const balance = Number(record.amount) - Number(record.paidAmount);
        return <Typography.Text type={balance > 0 ? 'danger' : 'secondary'}>{formatCurrency(balance)}</Typography.Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (value) => <StatusTag value={value} />,
    },
    {
      title: 'Bill Date',
      dataIndex: 'billDate',
      render: formatDate,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            type="primary" 
            disabled={record.status === 'paid'}
            onClick={() => {
              setPaymentBill(record);
              paymentForm.setValue('amount', Number(record.amount) - Number(record.paidAmount));
            }}
          >
            Pay
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => setHistoryBill(record)}
            title="Payment History"
          />
        </Space>
      ),
    },
  ];

  const submit = (values: BillFormValues) => {
// ... rest of submit and return
    startTransition(async () => {
      try {
        await createBill({
          ...values,
          projectId: values.projectId || undefined,
          dueDate: values.dueDate || undefined,
        });
        message.success('Bill recorded successfully');
        reset();
        setOpen(false);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to record bill');
      }
    });
  };

  return (
    <div>
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
          scroll={{ x: 1000 }}
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
          <Form.Item label="Import from Purchase Order" className="mb-6 rounded-lg border border-white/10 bg-slate-50/5 p-4">
            <Select
              showSearch
              placeholder="Search PO number to autofill..."
              optionFilterProp="label"
              onChange={handlePoSelect}
              options={purchaseOrders.map((po) => ({
                value: po.id,
                label: `${po.poNumber} - ${po.vendor?.name || 'Unknown Vendor'}`,
              }))}
            />
          </Form.Item>

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

      <Drawer
        title="Record Payment"
        open={!!paymentBill}
        onClose={() => setPaymentBill(null)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setPaymentBill(null)}>Cancel</Button>
            <Button type="primary" loading={isPending} onClick={paymentForm.handleSubmit(submitPayment)}>
              Save Payment
            </Button>
          </Space>
        }
      >
        {/* ... payment drawer content */}
        {paymentBill && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50/5 border border-blue-500/20">
            <Typography.Text type="secondary" block>Recording payment for:</Typography.Text>
            <Typography.Title level={5} style={{ margin: '4px 0' }}>{paymentBill.billNumber}</Typography.Title>
            <Flex justify="space-between" className="mt-2">
              <Typography.Text>Total: {formatCurrency(paymentBill.amount)}</Typography.Text>
              <Typography.Text>Balance: {formatCurrency(Number(paymentBill.amount) - Number(paymentBill.paidAmount))}</Typography.Text>
            </Flex>
          </div>
        )}

        <Form layout="vertical">
          <Controller
            control={paymentForm.control}
            name="amount"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Amount to Pay"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <InputNumber
                  min={0.01}
                  className="w-full"
                  prefix="₹"
                  value={field.value}
                  onChange={field.onChange}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={paymentForm.control}
            name="paymentDate"
            render={({ field, fieldState }) => (
              <Form.Item
                label="Payment Date"
                validateStatus={fieldState.error ? 'error' : undefined}
                help={fieldState.error?.message}
              >
                <DatePicker
                  className="w-full"
                  defaultValue={dayjs(field.value)}
                  onChange={(_, dateString) => field.onChange(Array.isArray(dateString) ? dateString[0] : dateString)}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={paymentForm.control}
            name="paymentMode"
            render={({ field }) => (
              <Form.Item label="Payment Mode">
                <Select
                  {...field}
                  options={[
                    { label: 'UPI', value: 'upi' },
                    { label: 'RTGS/NEFT', value: 'rtgs' },
                    { label: 'Cash', value: 'cash' },
                    { label: 'Cheque', value: 'cheque' },
                  ]}
                />
              </Form.Item>
            )}
          />
          <Controller
            control={paymentForm.control}
            name="referenceNumber"
            render={({ field }) => (
              <Form.Item label="UTR / Reference Number">
                <Input {...field} placeholder="Enter transaction ID or cheque number" />
              </Form.Item>
            )}
          />
          <Controller
            control={paymentForm.control}
            name="notes"
            render={({ field }) => (
              <Form.Item label="Notes">
                <Input.TextArea {...field} rows={2} />
              </Form.Item>
            )}
          />
        </Form>
      </Drawer>

      <Modal
        title={`Payment History — ${historyBill?.billNumber}`}
        open={!!historyBill}
        onCancel={() => setHistoryBill(null)}
        footer={[<Button key="close" onClick={() => setHistoryBill(null)}>Close</Button>]}
        width={700}
      >
        {historyBill?.payments && historyBill.payments.length > 0 ? (
          <Table
            dataSource={historyBill.payments}
            pagination={false}
            size="small"
            rowKey="id"
            columns={[
              {
                title: 'Date',
                dataIndex: 'paymentDate',
                render: formatDate,
              },
              {
                title: 'Amount',
                dataIndex: 'amount',
                align: 'right',
                render: (val) => formatCurrency(val),
              },
              {
                title: 'Mode',
                dataIndex: 'paymentMode',
                render: (val) => <Typography.Text strong>{val?.toUpperCase()}</Typography.Text>,
              },
              {
                title: 'Ref No',
                dataIndex: 'referenceNumber',
                render: (val) => val || '-',
              },
            ]}
          />
        ) : (
          <div className="py-8 text-center text-slate-500">
            No payments recorded yet for this bill.
          </div>
        )}
      </Modal>
    </div>
  );
}
