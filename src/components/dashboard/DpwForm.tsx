'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button, Card, Col, DatePicker, Divider, Flex, Form, Input, Row, Select, Space, Typography, App, Upload } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { createDailyLabourReport, updateDailyLabourReport, deleteDailyLabourReport } from '@/actions/daily-labour';
import { createTrade } from '@/actions/trades';
import type { Project, Trade, DailyLabourReport } from '@/types/erp';
import { cardClassName } from './ui';
import { useAuthStore } from '@/store/auth';

import { useRouter } from 'next/navigation';
import { getApiOrigin } from '@/lib/api-url';

type Props = {
  projects: Project[];
  trades: Trade[];
  initialValues?: DailyLabourReport;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function DpwForm({ projects, trades, initialValues, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [newTradeName, setNewTradeName] = useState('');
  const [localTrades, setLocalTrades] = useState<Trade[]>(trades);
  const { message, modal } = App.useApp();
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const [morningPhotos, setMorningPhotos] = useState<any[]>([]);
  const [eveningPhotos, setEveningPhotos] = useState<any[]>([]);

  // Pre-fill form if editing
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        projectId: initialValues.projectId,
        reportDate: dayjs(initialValues.reportDate),
        remarks: initialValues.remarks,
        workers: initialValues.workers.map(w => ({
          ...w,
          inTime: w.inTime ? dayjs(w.inTime, 'HH:mm:ss') : undefined,
          outTime: w.outTime ? dayjs(w.outTime, 'HH:mm:ss') : undefined,
        }))
      });

      // Populate existing photos
      const mPhotos = [];
      if (initialValues.morningPhoto1Url) {
        mPhotos.push({
          uid: '-1',
          name: 'morning1.jpg',
          status: 'done',
          url: `${getApiOrigin()}${initialValues.morningPhoto1Url}`,
        });
      }
      if (initialValues.morningPhoto2Url) {
        mPhotos.push({
          uid: '-2',
          name: 'morning2.jpg',
          status: 'done',
          url: `${getApiOrigin()}${initialValues.morningPhoto2Url}`,
        });
      }
      setMorningPhotos(mPhotos);

      const ePhotos = [];
      if (initialValues.eveningPhoto1Url) {
        ePhotos.push({
          uid: '-3',
          name: 'evening1.jpg',
          status: 'done',
          url: `${getApiOrigin()}${initialValues.eveningPhoto1Url}`,
        });
      }
      if (initialValues.eveningPhoto2Url) {
        ePhotos.push({
          uid: '-4',
          name: 'evening2.jpg',
          status: 'done',
          url: `${getApiOrigin()}${initialValues.eveningPhoto2Url}`,
        });
      }
      setEveningPhotos(ePhotos);
    }
  }, [initialValues, form]);

  const handleDeleteReport = async () => {
    if (!initialValues?.id) return;
    
    modal.confirm({
      title: 'Delete this report?',
      content: 'Are you sure you want to delete this daily labour report? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        setIsDeleting(true);
        try {
          await deleteDailyLabourReport(initialValues.id);
          message.success('Report deleted successfully');
          router.push('/dashboard/dpw');
        } catch (error) {
          message.error('Failed to delete report');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  // Only show projects assigned to the current site engineer if they are a site engineer
  const availableProjects = user?.role === 'site_engineer' && user.projects 
    ? projects.filter(p => user.projects?.some(up => up.id === p.id))
    : projects;

  const handleAddTrade = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (!newTradeName.trim()) return;

    setIsAddingTrade(true);
    try {
      const trade = await createTrade({ name: newTradeName });
      setLocalTrades([...localTrades, trade]);
      setNewTradeName('');
      message.success('Trade added successfully');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to add trade');
    } finally {
      setIsAddingTrade(false);
    }
  };

  const handleSubmit = (values: any) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('projectId', values.projectId);
        formData.append('reportDate', values.reportDate.format('YYYY-MM-DD'));
        formData.append('remarks', values.remarks || '');
        
        const workers = values.workers?.map((w: any) => {
          const selectedTrade = localTrades.find(t => t.id === w.tradeId);
          return {
            name: w.name,
            phone: w.phone || '',
            tradeId: w.tradeId,
            trade: selectedTrade?.name || w.tradeId,
            inTime: w.inTime ? w.inTime.format('HH:mm:ss') : undefined,
            outTime: w.outTime ? w.outTime.format('HH:mm:ss') : undefined,
            remarks: w.remarks || ''
          };
        }) || [];
        
        formData.append('workers', JSON.stringify(workers));

        // Add photos
        if (morningPhotos[0]?.originFileObj) formData.append('morningPhoto1', morningPhotos[0].originFileObj);
        if (morningPhotos[1]?.originFileObj) formData.append('morningPhoto2', morningPhotos[1].originFileObj);
        if (eveningPhotos[0]?.originFileObj) formData.append('eveningPhoto1', eveningPhotos[0].originFileObj);
        if (eveningPhotos[1]?.originFileObj) formData.append('eveningPhoto2', eveningPhotos[1].originFileObj);

        if (initialValues?.id) {
          await updateDailyLabourReport(initialValues.id, formData);
          message.success('Daily report updated successfully');
        } else {
          await createDailyLabourReport(formData);
          message.success('Daily report submitted successfully');
        }
        
        form.resetFields();
        setMorningPhotos([]);
        setEveningPhotos([]);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard/dpw');
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Failed to submit report');
      }
    });
  };

  return (
    <Card className={cardClassName} bordered={false}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item name="projectId" label="Project" rules={[{ required: true }]}>
              <Select
                options={availableProjects.map((p) => ({ label: p.name, value: p.id }))}
                placeholder="Select project"
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="reportDate" label="Date" rules={[{ required: true }]} initialValue={dayjs()}>
              <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Divider className="border-white/10 text-slate-400">Workers Present</Divider>
        
        <Form.List name="workers">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card size="small" key={key} className="mb-4 border-white/10 bg-white/5" 
                  extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}
                >
                    <Row gutter={12}>
                      <Col xs={24} sm={8}>
                        <Form.Item {...restField} name={[name, 'name']} label="Name" rules={[{ required: true }]}>
                          <Input placeholder="Worker name" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item {...restField} name={[name, 'phone']} label="Phone">
                          <Input placeholder="Phone number" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item {...restField} name={[name, 'tradeId']} label="Trade" rules={[{ required: true }]}>
                          <Select
                            showSearch
                            placeholder="Select trade"
                            options={localTrades.map(t => ({ label: t.name, value: t.id }))}
                            dropdownRender={(menu) => (
                              <>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <Space style={{ padding: '0 8px 4px' }}>
                                  <Input
                                    placeholder="New trade"
                                    value={newTradeName}
                                    onChange={(e) => setNewTradeName(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  />
                                  <Button type="text" icon={<PlusOutlined />} onClick={handleAddTrade} loading={isAddingTrade}>
                                    Add
                                  </Button>
                                </Space>
                              </>
                            )}
                          />
                        </Form.Item>
                      </Col>
                    <Col xs={12}>
                      <Form.Item {...restField} name={[name, 'inTime']} label="In">
                        <DatePicker picker="time" format="hh:mm A" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item {...restField} name={[name, 'outTime']} label="Out">
                        <DatePicker picker="time" format="hh:mm A" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item {...restField} name={[name, 'remarks']} label="Remarks">
                        <Input placeholder="Task details..." />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Worker
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider className="border-white/10 text-slate-400">Site Photos</Divider>
        
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item label="Morning Photos (Max 2)">
              <Upload
                beforeUpload={() => false}
                listType="picture"
                maxCount={2}
                fileList={morningPhotos}
                onChange={({ fileList }) => setMorningPhotos(fileList)}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} block>Select Photos</Button>
              </Upload>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="Evening Photos (Max 2)">
              <Upload
                beforeUpload={() => false}
                listType="picture"
                maxCount={2}
                fileList={eveningPhotos}
                onChange={({ fileList }) => setEveningPhotos(fileList)}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} block>Select Photos</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Divider className="border-white/10 text-slate-400">Summary</Divider>
        
        <Form.Item name="remarks" label="Overall Remarks">
          <Input.TextArea rows={3} placeholder="E.g., First floor column work completed." />
        </Form.Item>

        <Flex justify="space-between" className="mt-6">
          <Space>
            {initialValues?.id && (
              <Button danger icon={<DeleteOutlined />} loading={isDeleting} onClick={handleDeleteReport}>
                Delete Report
              </Button>
            )}
          </Space>
          <Space>
            {onCancel && <Button onClick={onCancel}>Cancel</Button>}
            <Button type="primary" loading={isPending} icon={<SaveOutlined />} onClick={() => form.submit()}>
              {initialValues?.id ? 'Update Report' : 'Submit Report'}
            </Button>
          </Space>
        </Flex>
      </Form>
    </Card>
  );
}
