import { ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { Button, Card, Form, Input, InputNumber, message, Space, Switch } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { apiSyncConfig, apiSyncConfigSave, apiSyncLogQuery, apiSyncTest, apiSyncTrigger } from './service';

const SyncLog = () => {
  const [form] = Form.useForm();
  const actionRef = useRef<any>();
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadConfig = async () => {
    const { data = {} } = await apiSyncConfig();
    form.setFieldsValue(data);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const saveConfig = async (values: any) => {
    const { code = 470, msg = '', msgType = 'info' } = await apiSyncConfigSave(values);
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) {
      loadConfig();
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const { code = 470, msg = '', msgType = 'info' } = await apiSyncTest(form.getFieldsValue());
      message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    } finally {
      setTesting(false);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const { code = 470, msg = '', msgType = 'info' } = await apiSyncTrigger({});
      message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
      actionRef.current?.reload();
    } finally {
      setSyncing(false);
    }
  };

  const request = async (params: any = {}) => {
    const { data = {} } = await apiSyncLogQuery({
      page: params.current,
      pageSize: params.pageSize,
      status: params.status,
    });
    return { data: data.aaData || [], total: data.total || 0, success: true };
  };

  return (
    <>
      <Card title="禅道同步配置" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={saveConfig}>
          <Form.Item label="禅道地址" name="zentao_url" rules={[{ required: true, message: '请输入禅道地址' }]}>
            <Input placeholder="https://zentao.example.com" />
          </Form.Item>
          <Form.Item label="访问 Token" name="zentao_token">
            <Input.Password placeholder="不修改时可保留为 ******" />
          </Form.Item>
          <Form.Item label="自动同步" name="auto_sync_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="同步间隔（分钟）" name="sync_interval_minutes">
            <InputNumber min={5} style={{ width: 180 }} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              保存配置
            </Button>
            <Button loading={testing} onClick={testConnection}>
              测试连接
            </Button>
            <Button loading={syncing} onClick={triggerSync}>
              手动同步
            </Button>
          </Space>
        </Form>
      </Card>
      <ProTable
        rowKey="id"
        actionRef={actionRef}
        headerTitle="同步日志"
        pagination={{ ...PAGINATION_PROPS }}
        request={request}
        columns={[
          { title: '触发方式', dataIndex: 'trigger_type', search: false },
          { title: '新增数', dataIndex: 'new_count', search: false },
          { title: '更新数', dataIndex: 'update_count', search: false },
          { title: '失败数', dataIndex: 'fail_count', search: false },
          {
            title: '状态',
            dataIndex: 'status',
            valueType: 'select',
            valueEnum: {
              成功: { text: '成功' },
              失败: { text: '失败' },
              部分成功: { text: '部分成功' },
            },
          },
          { title: '错误详情', dataIndex: 'error_detail', search: false, ellipsis: true },
          { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
        ]}
      />
    </>
  );
};

export default SyncLog;
