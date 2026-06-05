import { ProTable } from '@ant-design/pro-components';
import { Button, Card, Form, Input, InputNumber, message, Switch } from 'antd';
import { useEffect, useState } from 'react';
import { apiEmailConfig, apiEmailConfigSave, apiEmailLogs, apiEmailTest } from './service';

const EmailConfig = () => {
  const [form] = Form.useForm();
  const [testEmail, setTestEmail] = useState('');

  const loadConfig = async () => {
    const { data = {} } = await apiEmailConfig();
    form.setFieldsValue(data);
  };

  useEffect(() => { loadConfig(); }, []);

  const save = async (values: any) => {
    const { code = 470, msg = '', msgType = 'info' } = await apiEmailConfigSave(values);
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) loadConfig();
  };

  return (
    <>
      <Card title="邮件配置" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item label="SMTP Host" name="smtp_host" rules={[{ required: true, message: '请输入 SMTP Host' }]}><Input /></Form.Item>
          <Form.Item label="SMTP Port" name="smtp_port" rules={[{ required: true, message: '请输入 SMTP Port' }]}><InputNumber min={1} style={{ width: 180 }} /></Form.Item>
          <Form.Item label="发件人" name="smtp_sender" rules={[{ required: true, message: '请输入发件人' }]}><Input /></Form.Item>
          <Form.Item label="密码" name="smtp_password"><Input.Password placeholder="不修改时可保留为空" /></Form.Item>
          <Form.Item label="新 Bug 通知" name="notify_bug_new" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="责任分配通知" name="notify_responsibility" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="TODO 通知" name="notify_todo" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="Bug 重新打开通知" name="notify_bug_reopen" valuePropName="checked"><Switch /></Form.Item>
          <Button type="primary" htmlType="submit">保存配置</Button>
        </Form>
      </Card>
      <Card title="测试邮件" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="请输入测试收件人邮箱"
          value={testEmail}
          enterButton="发送测试邮件"
          onChange={(e) => setTestEmail(e.target.value)}
          onSearch={async () => {
            const { code = 470, msg = '', msgType = 'info' } = await apiEmailTest({ to_email: testEmail });
            message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
          }}
        />
      </Card>
      <ProTable
        rowKey="created_at"
        headerTitle="邮件发送日志"
        search={false}
        pagination={false}
        request={async () => {
          const { data = [] } = await apiEmailLogs();
          return { data, success: true };
        }}
        columns={[
          { title: '收件人', dataIndex: 'to_email' },
          { title: '主题', dataIndex: 'subject' },
          { title: '状态', dataIndex: 'status' },
          { title: '错误', dataIndex: 'error', ellipsis: true },
          { title: '发送时间', dataIndex: 'created_at', valueType: 'dateTime' },
        ]}
      />
    </>
  );
};

export default EmailConfig;
