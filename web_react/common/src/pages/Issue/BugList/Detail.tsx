import { ArrowLeftOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { PageContainer, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Button, Card, Col, Form, Input, message, Row, Select, Space, Spin, Tabs, Tag } from 'antd';
import { useEffect, useState } from 'react';
import {
  apiBugCommentAdd,
  apiBugCommentList,
  apiBugDetail,
  apiBugHistory,
  apiBugUpdateExt,
  apiIssueTypeOptions,
  apiModuleByProduct,
  apiProductOptions,
  apiStaffActiveOptions,
  apiVersionByProduct,
} from './service';

const severityColor = { 1: 'red', 2: 'orange', 3: 'blue', 4: 'default' };
const statusColor = { 激活: 'red', 已解决: 'green', 已关闭: 'default', 重新打开: 'orange' };

const BugDetail = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<any>();
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [moduleOptions, setModuleOptions] = useState<any[]>([]);
  const [versionOptions, setVersionOptions] = useState<any[]>([]);
  const [issueTypeOptions, setIssueTypeOptions] = useState<any[]>([]);
  const [staffOptions, setStaffOptions] = useState<any[]>([]);

  const loadModuleAndVersion = async (productId: number) => {
    if (!productId) {
      setModuleOptions([]);
      setVersionOptions([]);
      return;
    }
    const [{ data: modules = [] }, { data: versions = [] }] = await Promise.all([
      apiModuleByProduct(productId),
      apiVersionByProduct(productId),
    ]);
    setModuleOptions(modules.map((item: any) => ({ label: item.name, value: item.id })));
    setVersionOptions(versions.map((item: any) => ({ label: item.version, value: item.id })));
  };

  const loadOptions = async () => {
    const [{ data: products = {} }, { data: types = {} }, { data: staffs = [] }] = await Promise.all([
      apiProductOptions(),
      apiIssueTypeOptions(),
      apiStaffActiveOptions(),
    ]);
    setProductOptions((products.aaData || []).map((item: any) => ({ label: item.name, value: item.id })));
    setIssueTypeOptions((types.aaData || []).map((item: any) => ({ label: item.name, value: item.id })));
    setStaffOptions(staffs.map((item: any) => ({ label: item.name, value: item.id })));
  };

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    const { code = 470, msg = '', data = {} } = await apiBugDetail({ id: Number(id) });
    setLoading(false);
    if (code !== 200) {
      message.error(msg);
      return;
    }
    setDetail(data);
    form.setFieldsValue({
      affect_version: data.affect_version,
      module_id: data.module_id,
      root_cause: data.root_cause,
      impact_scope: data.impact_scope,
      plan_version_id: data.plan_version_id,
      issue_type_id: data.issue_type_id,
      escape_analysis: data.escape_analysis,
      staff_id: data.staff_id,
      remark: data.remark,
    });
    await loadModuleAndVersion(data.product_id);
  };

  useEffect(() => {
    loadOptions();
    loadDetail();
  }, [id]);

  const saveExt = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const { code = 470, msg = '', msgType = 'info' } = await apiBugUpdateExt({
      id: Number(id),
      updated_at: detail?.updated_at,
      ...values,
    });
    setSaving(false);
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) {
      loadDetail();
    }
  };

  const addComment = async () => {
    const values = await commentForm.validateFields();
    const { code = 470, msg = '', msgType = 'info' } = await apiBugCommentAdd({
      bug_id: Number(id),
      content: values.content,
    });
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) {
      commentForm.resetFields();
    }
  };

  if (loading && !detail) {
    return <Spin />;
  }

  return (
    <PageContainer
      title={detail?.bug_id || '问题详情'}
      extra={[
        <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/issue/bugs')}>
          返回
        </Button>,
        <Button icon={<ReloadOutlined />} onClick={loadDetail}>
          刷新
        </Button>,
        <Button icon={<SaveOutlined />} type="primary" loading={saving} onClick={saveExt}>
          保存
        </Button>,
      ]}
    >
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space>
            <Tag color={severityColor[detail?.severity]}>P{detail?.severity}</Tag>
            <Tag color={statusColor[detail?.status] || 'default'}>{detail?.status}</Tag>
            <span>{detail?.title}</span>
          </Space>
          <ProDescriptions column={3} dataSource={detail || {}}>
            <ProDescriptions.Item label="产品" dataIndex="product_name" />
            <ProDescriptions.Item label="解决者" dataIndex="resolver" />
            <ProDescriptions.Item label="解决方案" dataIndex="resolution" />
            <ProDescriptions.Item label="确认状态" dataIndex="confirmed" />
            <ProDescriptions.Item label="创建人" dataIndex="created_by" />
            <ProDescriptions.Item label="阶段" dataIndex="stage" />
            <ProDescriptions.Item label="创建时间" dataIndex="created_date" valueType="dateTime" />
            <ProDescriptions.Item label="解决时间" dataIndex="resolved_date" valueType="dateTime" />
          </ProDescriptions>
          <Card size="small" title="重现步骤">
            <div style={{ whiteSpace: 'pre-wrap' }}>{detail?.steps || '-'}</div>
          </Card>
        </Space>
      </Card>

      <Card title="扩展信息" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="影响版本" name="affect_version">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="问题模块" name="module_id">
                <Select allowClear options={moduleOptions} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="计划解决版本" name="plan_version_id">
                <Select allowClear options={versionOptions} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="问题类型" name="issue_type_id">
                <Select allowClear options={issueTypeOptions} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="解决人员" name="staff_id">
                <Select allowClear options={staffOptions} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="根因分析" name="root_cause">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="影响范围" name="impact_scope">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="逃逸分析" name="escape_analysis">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Tabs
        items={[
          {
            key: 'comments',
            label: '评论',
            children: (
              <>
                <Form form={commentForm} layout="vertical" onFinish={addComment}>
                  <Form.Item label="新增评论" name="content" rules={[{ required: true, message: '请输入评论内容' }]}>
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    添加评论
                  </Button>
                </Form>
                <ProTable
                  rowKey="id"
                  style={{ marginTop: 16 }}
                  search={false}
                  request={async (params: any = {}) => {
                    const { data = {} } = await apiBugCommentList({
                      bug_id: Number(id),
                      page: params.current,
                      pageSize: params.pageSize,
                    });
                    return { data: data.aaData || [], total: data.total || 0, success: true };
                  }}
                  columns={[
                    { title: '评论人', dataIndex: 'commenter', width: 140 },
                    { title: '内容', dataIndex: 'content', ellipsis: true },
                    { title: '来源', dataIndex: 'source', width: 120 },
                    { title: '时间', dataIndex: 'created_at', valueType: 'dateTime', width: 180 },
                  ]}
                  options={{ reload: true, setting: false, density: false }}
                />
              </>
            ),
          },
          {
            key: 'history',
            label: '变更历史',
            children: (
              <ProTable
                rowKey="id"
                search={false}
                pagination={false}
                request={async () => {
                  const { data = [] } = await apiBugHistory({ bug_id: Number(id) });
                  return { data, success: true };
                }}
                columns={[
                  { title: '字段', dataIndex: 'field_name', width: 160 },
                  { title: '旧值', dataIndex: 'old_value', ellipsis: true },
                  { title: '新值', dataIndex: 'new_value', ellipsis: true },
                  { title: '操作人', dataIndex: 'operator', width: 140 },
                  { title: '时间', dataIndex: 'created_at', valueType: 'dateTime', width: 180 },
                ]}
                options={{ reload: true, setting: false, density: false }}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default BugDetail;
