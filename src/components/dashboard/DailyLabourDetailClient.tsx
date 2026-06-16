'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Flex, Typography, Tag, Table, Space, Row, Col, Image, Button, Breadcrumb, Spin, Alert } from 'antd';
import { CalendarOutlined, ArrowLeftOutlined, ProjectOutlined, TeamOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { clientApiFetch } from '@/lib/client-api';
import type { DailyLabourReport } from '@/types/erp';
import { formatCurrency } from '@/components/dashboard/ui';
import { getApiOrigin } from '@/lib/api-url';

export function DailyLabourDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<DailyLabourReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await clientApiFetch<DailyLabourReport>(`/daily-labour/${id}`);
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0b1120]"><Spin size="large" /></div>;
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!report) return null;

  const getPhotoUrls = (type: 'morning' | 'evening') => {
    const urls: string[] = [];
    if (type === 'morning') {
      if (report.morningPhoto1Url) urls.push(`${getApiOrigin()}${report.morningPhoto1Url}`);
      if (report.morningPhoto2Url) urls.push(`${getApiOrigin()}${report.morningPhoto2Url}`);
    } else {
      if (report.eveningPhoto1Url) urls.push(`${getApiOrigin()}${report.eveningPhoto1Url}`);
      if (report.eveningPhoto2Url) urls.push(`${getApiOrigin()}${report.eveningPhoto2Url}`);
    }
    return urls;
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    // Use a dummy date to parse the time string correctly
    return dayjs(`2000-01-01 ${time}`).format('hh:mm A');
  };

  const workerColumns = [
    {
      title: 'Worker Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Typography.Text strong className="text-slate-200">{text}</Typography.Text>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: 'Trade',
      dataIndex: 'trade',
      key: 'trade',
      render: (trade: string) => <Tag color="blue">{trade}</Tag>,
    },
    {
      title: 'In Time',
      dataIndex: 'inTime',
      key: 'inTime',
      render: (time: string) => <Tag color="green">{formatTime(time)}</Tag>,
    },
    {
      title: 'Out Time',
      dataIndex: 'outTime',
      key: 'outTime',
      render: (time: string) => <Tag color="orange">{formatTime(time)}</Tag>,
    },
    {
      title: 'Task/Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text: string) => text || '-',
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <Flex justify="space-between" align="center">
        <Typography.Title level={2}  className="mb-12">Daily Labour Detail</Typography.Title>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Back to List</Button>
      </Flex>

      <Row gutter={[24, 24]}>
        {/* Basic Info */}
        <Col xs={24} lg={8}>
          <Card 
            title={<><ProjectOutlined className="mr-2 text-sky-400" /> Project Info</>} 
            className="border-white/10 bg-slate-900/50"
          >
            <Space direction="vertical" size={16} className="w-full">
              <div>
                <Typography.Text type="secondary" className="text-xs uppercase block">Project Name</Typography.Text>
                <Typography.Text strong className="text-lg">{report.project?.name || 'N/A'}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary" className="text-xs uppercase block">Report Date</Typography.Text>
                <Typography.Text strong className="text-lg">{dayjs(report.reportDate).format('DD MMMM YYYY')}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary" className="text-xs uppercase block">Total Manpower</Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, color: '#38bdf8' }}>{report.workers.length} Workers</Typography.Title>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <Typography.Text type="secondary" className="text-xs uppercase block mb-3">Trade Breakdown</Typography.Text>
                <Space direction="vertical" size={8} className="w-full">
                  {Object.entries(
                    report.workers.reduce((acc, w) => {
                      const trade = w.trade || 'Other';
                      acc[trade] = (acc[trade] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([trade, count]) => (
                    <Flex key={trade} justify="space-between" align="center" className="bg-white/5 px-3 py-2 rounded-md">
                      <Typography.Text className="text-slate-300">{trade}</Typography.Text>
                      <Tag color="blue" className="m-0!">{count} Members</Tag>
                    </Flex>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>

          <Card 
            title={<><TeamOutlined className="mr-2 text-sky-400" /> Site Remarks</>} 
            className="mt-6 border-white/10 bg-slate-900/50"
          >
            <Typography.Paragraph className="text-slate-300 italic">
              {report.remarks || "No overall remarks provided for this date."}
            </Typography.Paragraph>
          </Card>
        </Col>

        {/* Worker Table */}
        <Col xs={24} lg={16}>
          <Card 
            title={<><TeamOutlined className="mr-2 text-sky-400" /> Attendance Log</>} 
            className="border-white/10 bg-slate-900/50"
            styles={{ body: { padding: 0 } }}
          >
            <Table
              dataSource={report.workers}
              columns={workerColumns}
              rowKey="id"
              pagination={false}
              className="border-none"
              size="middle"
            />
          </Card>
        </Col>

        {/* Photos Section */}
        <Col xs={24}>
          <Card 
            title={<><PictureOutlined className="mr-2 text-sky-400" /> Site Photographs</>} 
            className="border-white/10 bg-slate-900/50"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Typography.Title level={5} className="mb-4 text-slate-400 border-b border-white/5 pb-2">Morning Session Photos</Typography.Title>
                <Image.PreviewGroup>
                  <Row gutter={[12, 12]}>
                    {getPhotoUrls('morning').map((url, i) => (
                      <Col span={12} key={i}>
                        <Image
                          src={url}
                          className="rounded-lg object-cover w-full aspect-video border border-white/10 shadow-lg hover:scale-[1.02] transition-transform"
                          placeholder={<div className="w-full aspect-video bg-slate-800 animate-pulse rounded-lg" />}
                        />
                      </Col>
                    ))}
                    {getPhotoUrls('morning').length === 0 && (
                      <Col span={24}>
                        <div className="py-10 text-center bg-white/5 rounded-lg border border-dashed border-white/10">
                          <Typography.Text type="secondary" italic>No morning photos uploaded</Typography.Text>
                        </div>
                      </Col>
                    )}
                  </Row>
                </Image.PreviewGroup>
              </Col>
              
              <Col xs={24} md={12}>
                <Typography.Title level={5} className="mb-4 text-slate-400 border-b border-white/5 pb-2">Evening Session Photos</Typography.Title>
                <Image.PreviewGroup>
                  <Row gutter={[12, 12]}>
                    {getPhotoUrls('evening').map((url, i) => (
                      <Col span={12} key={i}>
                        <Image
                          src={url}
                          className="rounded-lg object-cover w-full aspect-video border border-white/10 shadow-lg hover:scale-[1.02] transition-transform"
                          placeholder={<div className="w-full aspect-video bg-slate-800 animate-pulse rounded-lg" />}
                        />
                      </Col>
                    ))}
                    {getPhotoUrls('evening').length === 0 && (
                      <Col span={24}>
                        <div className="py-10 text-center bg-white/5 rounded-lg border border-dashed border-white/10">
                          <Typography.Text type="secondary" italic>No evening photos uploaded</Typography.Text>
                        </div>
                      </Col>
                    )}
                  </Row>
                </Image.PreviewGroup>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
