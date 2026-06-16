'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, Table, Typography, Tag, Space, Flex, Button, Drawer, Form, Input, InputNumber, Select, DatePicker, Row, Col, Statistic } from 'antd';
import { CreditCardOutlined, PlusOutlined, ArrowDownOutlined, ArrowUpOutlined, BankOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import { createPayment, syncExpensesToLedger } from '@/actions/payments';
import type { Payment, Project, Vendor } from '@/types/erp';
import {
  StatusTag,
  cardClassName,
  formatCurrency,
  formatDate,
  pageHeaderClassName,
  pageTitleClassName,
  titleIconClassName,
  titleCase,
} from './ui';

const { Title, Text } = Typography;

const paymentSchema = z.object({
  paymentType: z.string().min(1, 'Select category'),
  payeeName: z.string().optional(),
  vendorId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Select date'),
  paymentMode: z.string().min(1, 'Select mode'),
  referenceNumber: z.string().optional(),
  projectId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type PaymentsClientProps = {
  payments: Payment[];
  summary: Array<{ paymentType: string; total: string | number }>;
  projects: Project[];
  vendors: Vendor[];
};

export function PaymentsClient({ payments, summary, projects, vendors }: PaymentsClientProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Automatically sync missing expenses when page loads
    syncExpensesToLedger().catch(console.error);
  }, []);

  const { control, handleSubmit, reset, watch, setValue } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentType: 'labour',
      paymentDate: dayjs().format('YYYY-MM-DD'),
      paymentMode: 'upi',
      amount: 0,
    },
  });

  const selectedType = watch('paymentType');

  const onSubmit = (values: PaymentFormValues) => {
    startTransition(async () => {
      try {
        await createPayment(values);
        reset();
        setOpen(false);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const columns: ColumnsType<Payment> = [
    {
      title: '#',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      render: formatDate,
      sorter: (a, b) => dayjs(a.paymentDate).unix() - dayjs(b.paymentDate).unix(),
    },
    {
      title: 'Category',
      dataIndex: 'paymentType',
      render: (type) => <StatusTag value={type} />,
    },
    {
      title: 'Payee / Vendor',
      key: 'payee',
      render: (_, record) => {
        const payee = record.salesInvoice?.project?.clientName || record.vendor?.name || record.payeeName || '-';
        const project = record.project?.name || record.salesInvoice?.project?.name || 'General Office';
        return (
          <Flex vertical gap={0}>
            <Text strong>{payee}</Text>
            <Text type="secondary" className="text-xs">{project}</Text>
          </Flex>
        );
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      render: (amount) => <Text strong type="danger">{formatCurrency(amount)}</Text>,
    },
    {
      title: 'Total Amount',
      key: 'totalAmount',
      align: 'right',
      render: (_, record) => {
        if (record.purchaseBill?.amount) return formatCurrency(record.purchaseBill.amount);
        if (record.salesInvoice?.totalAmount) return formatCurrency(Number(record.salesInvoice.totalAmount) + Number(record.salesInvoice.gstAmount || 0));
        return '-';
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = record.expense?.status || record.salesInvoice?.status || 'completed';
        return <StatusTag value={status} />;
      },
    },
    {
      title: 'Mode',
      dataIndex: 'paymentMode',
      render: (mode) => <Text className="uppercase text-xs">{mode}</Text>,
    },
    {
      title: 'Ref No',
      dataIndex: 'referenceNumber',
      render: (val) => val || '-',
    },
  ];

  const totalOutflow = summary
    .filter((item) => item.paymentType !== 'revenue')
    .reduce((sum, item) => sum + Number(item.total), 0);
  const totalInflow = summary.find((item) => item.paymentType === 'revenue')?.total || 0;

  return (
    <div>
      <Flex justify="space-between" align="center" className={pageHeaderClassName} gap={16} wrap="wrap">
        <Title level={3} className={pageTitleClassName}>
          <CreditCardOutlined className={titleIconClassName} /> Master Ledger
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Record Direct Payment
        </Button>
      </Flex>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card className={cardClassName}>
            <Statistic 
              title="Total Outflow" 
              value={totalOutflow} 
              prefix={<ArrowDownOutlined className="text-red-500" />} 
              formatter={(val) => formatCurrency(val as number)}
            />
          </Card>
        </Col>
        {summary.map((item) => (
          <Col xs={24} sm={12} md={6} key={item.paymentType}>
            <Card className={cardClassName}>
              <Statistic 
                title={titleCase(item.paymentType)} 
                value={Number(item.total)} 
                formatter={(val) => formatCurrency(val as number)}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card className={cardClassName} title="Transaction History">
        <Table
          dataSource={payments}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Drawer
        title="Record Direct Payment"
        width={450}
        onClose={() => setOpen(false)}
        open={open}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit(onSubmit)}>
              Save Transaction
            </Button>
          </Space>
        }
      >
        <Form layout="vertical">
          <Controller
            name="paymentType"
            control={control}
            render={({ field }) => (
              <Form.Item label="Payment Category" required>
                <Select {...field}>
                  <Select.Option value="material">Material (Vendor)</Select.Option>
                  <Select.Option value="labour">Labour Contractor</Select.Option>
                  <Select.Option value="rent">Site/Office Rent</Select.Option>
                  <Select.Option value="accommodation">Staff Accommodation</Select.Option>
                  <Select.Option value="office_maintenance">Office Maintenance</Select.Option>
                  <Select.Option value="staff_expense">Staff Expense</Select.Option>
                  <Select.Option value="travel">Travel</Select.Option>
                  <Select.Option value="transport">Transport</Select.Option>
                </Select>
              </Form.Item>
            )}
          />

          {selectedType === 'material' ? (
            <Controller
              name="vendorId"
              control={control}
              render={({ field }) => (
                <Form.Item label="Select Vendor">
                  <Select {...field} showSearch optionFilterProp="label" options={vendors.map(v => ({ label: v.name, value: v.id }))} />
                </Form.Item>
              )}
            />
          ) : (
            <Controller
              name="payeeName"
              control={control}
              render={({ field }) => (
                <Form.Item label="Payee Name">
                  <Input {...field} placeholder="Enter name of person/company" />
                </Form.Item>
              )}
            />
          )}

          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <Form.Item label="Amount Paid" required>
                <InputNumber {...field} className="w-full" prefix="₹" min={1} />
              </Form.Item>
            )}
          />

          <Controller
            name="projectId"
            control={control}
            render={({ field }) => (
              <Form.Item label="Link to Project (Optional)">
                <Select {...field} allowClear showSearch optionFilterProp="label" options={projects.map(p => ({ label: p.name, value: p.id }))} />
              </Form.Item>
            )}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Date">
                    <DatePicker className="w-full" value={dayjs(field.value)} onChange={(_, dateStr) => field.onChange(dateStr)} />
                  </Form.Item>
                )}
              />
            </Col>
            <Col span={12}>
              <Controller
                name="paymentMode"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Mode">
                    <Select {...field}>
                      <Select.Option value="upi">UPI</Select.Option>
                      <Select.Option value="rtgs">RTGS</Select.Option>
                      <Select.Option value="cash">Cash</Select.Option>
                      <Select.Option value="cheque">Cheque</Select.Option>
                    </Select>
                  </Form.Item>
                )}
              />
            </Col>
          </Row>

          <Controller
            name="referenceNumber"
            control={control}
            render={({ field }) => (
              <Form.Item label="UTR / Reference Number">
                <Input {...field} placeholder="Transaction ID" />
              </Form.Item>
            )}
          />

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Form.Item label="Notes">
                <Input.TextArea {...field} rows={3} />
              </Form.Item>
            )}
          />
        </Form>
      </Drawer>
    </div>
  );
}
