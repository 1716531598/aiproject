import { ArrowLeftOutlined, LinkOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { ModalForm, PageContainer, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Button, Card, Col, Form, Input, message, Row, Select, Space, Spin, Tag } from 'antd';
import { useEffect, useState } from 'react';
import {
  apiPocCommentAdd,
  apiPocDetail,
  apiPocLinkBug,
  apiPocProgressAdd,
  apiPocTodoAdd,
  apiPocTodoStatus,
  apiPocUpdate,
  apiStaffActiveOptions,
} from './service';

const PocDetail = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>();
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [progressVisible, setProgressVisible] = useState(false);
  const [todoVisible, setTodoVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [bugVisible, setBugVisible] = useState(false);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    const { code = 470, msg = '', data = {} } = await apiPocDetail({ id: Number(id) });
    setLoading(false);
    if (code !== 200) {
      message.error(msg);
      return;
    }
    setDetail(data);
    form.setFieldsValue({
      has_risk: data.has_risk,
      root_cause: data.root_cause,
      next_step: data.next_step,
      risk_desc: data.risk_desc,
      risk_category: data.risk_category,
      close_party: data.close_party,
      current_status: data.current_status,
    });
  };

  useEffect(() => {
    const loadOptions = async () => {
      const { data = [] } = await apiStaffActiveOptions();
      setStaffOptions(data.map((item: any) => ({ label: item.name, value: item.id })));
    };
    loadOptions();
    loadDetail();
  }, [id]);

  const save = async () => {
    const values = await form.validateFields();
    const { code = 470, msg = '', msgType = 'info' } = await apiPocUpdate({ id: Number(id), ...values });
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) loadDetail();
  };

  if (loading && !detail) return <Spin />;

  return (
    <PageContainer
      title={detail?.project_code || 'PoC 项目详情'}
      extra={[
        <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/issue/poc')}>
          返回
        </Button>,
        <Button icon={<ReloadOutlined />} onClick={loadDetail}>
          刷新
        </Button>,
        <Button icon={<SaveOutlined />} type="primary" onClick={save}>
          保存
        </Button>,
      ]}
    >
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Tag color={detail?.has_risk ? 'red' : 'success'}>{detail?.has_risk ? '有风险' : '无风险'}</Tag>
            <span>{detail?.customer_name}</span>
          </Space>
          <ProDescriptions column={3} dataSource={detail || {}}>
            <ProDescriptions.Item label="产品" dataIndex="product_name" />
            <ProDescriptions.Item label="版本" dataIndex="version" />
            <ProDescriptions.Item label="销售支撑" dataIndex="sales_staff" />
            <ProDescriptions.Item label="闭环方" dataIndex="close_party" />
            <ProDescriptions.Item label="状态" dataIndex="current_status" />
            <ProDescriptions.Item label="来源周报" dataIndex="source_report" />
          </ProDescriptions>
          <Card size="small" title="本周支撑内容">
            <div style={{ whiteSpace: 'pre-wrap' }}>{detail?.weekly_content || '-'}</div>
          </Card>
        </Space>
      </Card>

      <Card title="风险维护" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="是否有风险" name="has_risk">
                <Select options={[{ label: '无风险', value: 0 }, { label: '有风险', value: 1 }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="分类" name="risk_category">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="当前状态" name="current_status">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="风险描述" name="risk_desc">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="问题原因" name="root_cause">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="下一步计划" name="next_step">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <ProTable
        rowKey="bug_id"
        headerTitle="关联 Bug"
        search={false}
        pagination={false}
        dataSource={detail?.linked_bugs || []}
        toolBarRender={() => [
          <Button icon={<LinkOutlined />} onClick={() => setBugVisible(true)}>
            添加关联
          </Button>,
        ]}
        columns={[
          { title: 'Bug ID', dataIndex: 'bug_id' },
          { title: '标题', dataIndex: 'title', ellipsis: true },
          { title: '严重级别', dataIndex: 'severity', render: (_: any, record: any) => <Tag>P{record.severity}</Tag> },
          { title: '状态', dataIndex: 'status' },
          {
            title: '操作',
            render: (_: any, record: any) => (
              <a
                onClick={async () => {
                  await apiPocLinkBug({ project_id: Number(id), bug_id: record.bug_id, action: 'remove' });
                  loadDetail();
                }}
              >
                取消关联
              </a>
            ),
          },
        ]}
      />

      <ProTable
        rowKey="id"
        headerTitle="进展记录"
        style={{ marginTop: 16 }}
        search={false}
        pagination={false}
        dataSource={detail?.progresses || []}
        toolBarRender={() => [
          <Button icon={<PlusOutlined />} onClick={() => setProgressVisible(true)}>
            添加进展
          </Button>,
        ]}
        columns={[
          { title: '日期', dataIndex: 'date', valueType: 'date' },
          { title: '描述', dataIndex: 'description', ellipsis: true },
          { title: '状态', dataIndex: 'status' },
          { title: '来源', dataIndex: 'source_report' },
        ]}
      />

      <ProTable
        rowKey="id"
        headerTitle="TODO"
        style={{ marginTop: 16 }}
        search={false}
        pagination={false}
        dataSource={detail?.todos || []}
        toolBarRender={() => [
          <Button icon={<PlusOutlined />} onClick={() => setTodoVisible(true)}>
            添加 TODO
          </Button>,
        ]}
        columns={[
          { title: '内容', dataIndex: 'content', ellipsis: true },
          { title: '责任人', dataIndex: 'staff_name' },
          { title: '截止日期', dataIndex: 'deadline', valueType: 'date' },
          { title: '状态', dataIndex: 'status' },
          {
            title: '操作',
            render: (_: any, record: any) => (
              <Select
                value={record.status}
                style={{ width: 120 }}
                options={['待处理', '进行中', '已完成'].map((value) => ({ label: value, value }))}
                onChange={async (status) => {
                  await apiPocTodoStatus({ id: record.id, status });
                  loadDetail();
                }}
              />
            ),
          },
        ]}
      />

      <ProTable
        rowKey="id"
        headerTitle="评论"
        style={{ marginTop: 16 }}
        search={false}
        pagination={false}
        dataSource={detail?.comments || []}
        toolBarRender={() => [
          <Button icon={<PlusOutlined />} onClick={() => setCommentVisible(true)}>
            添加评论
          </Button>,
        ]}
        columns={[
          { title: '评论人', dataIndex: 'commenter', width: 140 },
          { title: '内容', dataIndex: 'content', ellipsis: true },
          { title: '时间', dataIndex: 'created_at', valueType: 'dateTime' },
        ]}
      />

      <ModalForm
        title="添加关联 Bug"
        visible={bugVisible}
        onFinish={async (values: any) => {
          const { code = 470, msg = '', msgType = 'info' } = await apiPocLinkBug({ project_id: Number(id), ...values, action: 'add' });
          message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
          if (code === 200) {
            setBugVisible(false);
            loadDetail();
          }
          return code === 200;
        }}
        modalProps={{ destroyOnHidden: true, onCancel: () => setBugVisible(false) }}
      >
        <Form.Item label="Bug ID" name="bug_id" rules={[{ required: true, message: '请输入 Bug ID' }]}>
          <Input />
        </Form.Item>
      </ModalForm>

      <ModalForm
        title="添加进展"
        visible={progressVisible}
        onFinish={async (values: any) => {
          const { code = 470, msg = '', msgType = 'info' } = await apiPocProgressAdd({ project_id: Number(id), ...values });
          message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
          if (code === 200) {
            setProgressVisible(false);
            loadDetail();
          }
          return code === 200;
        }}
        modalProps={{ destroyOnHidden: true, onCancel: () => setProgressVisible(false) }}
      >
        <Form.Item label="日期" name="date">
          <Input placeholder="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item label="描述" name="description" rules={[{ required: true, message: '请输入进展描述' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Input />
        </Form.Item>
      </ModalForm>

      <ModalForm
        title="添加 TODO"
        visible={todoVisible}
        onFinish={async (values: any) => {
          const { code = 470, msg = '', msgType = 'info' } = await apiPocTodoAdd({ project_id: Number(id), ...values });
          message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
          if (code === 200) {
            setTodoVisible(false);
            loadDetail();
          }
          return code === 200;
        }}
        modalProps={{ destroyOnHidden: true, onCancel: () => setTodoVisible(false) }}
      >
        <Form.Item label="内容" name="content" rules={[{ required: true, message: '请输入 TODO 内容' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="责任人" name="staff_id" rules={[{ required: true, message: '请选择责任人' }]}>
          <Select options={staffOptions} showSearch optionFilterProp="label" />
        </Form.Item>
        <Form.Item label="截止日期" name="deadline">
          <Input placeholder="YYYY-MM-DD" />
        </Form.Item>
      </ModalForm>

      <ModalForm
        title="添加评论"
        visible={commentVisible}
        onFinish={async (values: any) => {
          const { code = 470, msg = '', msgType = 'info' } = await apiPocCommentAdd({ project_id: Number(id), ...values });
          message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
          if (code === 200) {
            setCommentVisible(false);
            loadDetail();
          }
          return code === 200;
        }}
        modalProps={{ destroyOnHidden: true, onCancel: () => setCommentVisible(false) }}
      >
        <Form.Item label="评论" name="content" rules={[{ required: true, message: '请输入评论内容' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </ModalForm>
    </PageContainer>
  );
};

export default PocDetail;
