'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Card, Typography, message, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (isExpired) {
      // Small delay to ensure the UI is ready
      const timer = setTimeout(() => {
        message.warning('Your session has expired. Please log in again.');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isExpired]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        message.error(error.message || 'Login failed');
        return;
      }

      const data = await res.json();
      setUser(data.user);
      message.success('Login successful!');
      router.push('/dashboard');
    } catch {
      message.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#0a1628_0%,#1a2744_50%,#0d1f3c_100%)]"
    >
      {/* Ambient background circles */}
      <div className="absolute -right-25 -top-25 h-100 w-100 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
      <div className="absolute -bottom-12.5 -left-12.5 h-75 w-75 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,transparent_70%)]" />

      <Card
        className="w-105 rounded-2xl! border! border-white/10! bg-white/3! shadow-[0_32px_64px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
        classNames={{ body: 'px-8 py-10' }}
      >
        <Space orientation="vertical" size="large" className="w-full text-center">
          <div>
            <SafetyCertificateOutlined
              className="mb-3 text-5xl text-blue-500"
            />
            <Title level={3} className="m-0! font-bold! text-slate-200!">
              Edwin Constructions
            </Title>
            <Text className="text-sm text-slate-400!">ERP Management System</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            className="text-left"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Invalid email format' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-slate-500" />}
                placeholder="Email address"
                className="h-12 rounded-[10px]! border-white/10! bg-white/5! text-slate-200!"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-500" />}
                placeholder="Password"
                className="h-12 rounded-[10px]! border-white/10! bg-white/5! text-slate-200!"
              />
            </Form.Item>

            <Form.Item className="mb-0! mt-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="h-12 rounded-[10px] border-0 bg-linear-to-br! from-blue-500! to-violet-500! text-[15px] font-semibold"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Text className="text-xs text-slate-500!">
            Default: admin@edwinconstructions.com / admin123
          </Text>
        </Space>
      </Card>
    </div>
  );
}
