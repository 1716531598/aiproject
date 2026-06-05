import { ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { transformSort } from '@ray/common/utils/utilFn';
import { Button, Divider, Form, Input, message, Modal, Select, Tag, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { apiStaffActiveOptions, apiTodoDelete, apiTodoQuery, apiTodoUpdate } from './service';

const STATUS_OPTIONS = ['待处理', '进行中', '已完成'].map((value) => ({ label: value, value }));

const TodoList = () => {
  const { token } = theme.useToken();
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<any>({});
  const [staffOptions, setStaffOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadStaffs = async () => {
      const { data = [] } = await apiStaffActiveOptions();
      setStaffOptions(data.map((item: any) => ({ label: item.name, value: item.id })));
    };
    loadStaffs();
  }, []);

  const request = async (params: any = {}, sort = {}) => {
    const { data = {} } = await apiTodoQuery({
      page: params.current,
      pageSize: params.pageSize,
      status: params.status,
      staff_id: params.staff_id,
      ...transformSort(sort),
    });
    return { data: data.aaData || [], total: data.total || 0, success: true };
  };

  const deleteItem = (record: any) => {
    Modal.confirm({
      title: '删除 TODO',
      content: `确定删除“${record.content}”吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const { code = 470, msg = '', msgType = 'info' } = await apiTodoDelete({ id: record.id });
        message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
        if (code === 200) actionRef.current?.reload();
      },
    });
  };

  const columns = [
    { title: '内容', dataIndex: 'content', search: false, ellipsis: true },
    { title: '项目编码', dataIndex: 'project_code', search: false, width: 140 },
    { title: '客户', dataIndex: 'customer_name', search: false, width: 160 },
    {
      title: '责任人',
      dataIndex: 'staff_id',
      valueType: 'select',
      fieldProps: { options: staffOptions, showSearch: true, optionFilterProp: 'label' },
      render: (_: any, record: any) => record.staff_name,
      width: 140,
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      valueType: 'date',
      sorter: true,
      search: false,
      width: 130,
      render: (_: any, record: any) => {
        const overdue = record.deadline && record.status !== '已完成' && new Date(record.deadline) < new Date();
        return <span style={{ color: overdue ? token.colorError : undefined }}>{record.deadline || '-'}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      fieldProps: { options: STATUS_OPTIONS },
      width: 120,
      render: (_: any, record: any) => <Tag color={record.status === '已完成' ? 'success' : 'processing'}>{record.status}</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false, width: 170 },
    {
      title: '操作',
      search: false,
      width: 120,
      render: (_: any, record: any) => (
        <>
          <a onClick={() => { setCurrent(record); setVisible(true); }} style={{ color: token.colorPrimary }}>
            编辑
          </a>
          <Divider type="vertical" />
          <a onClick={() => deleteItem(record)} style={{ color: token.colorPrimary }}>
            删除
          </a>
        </>
      ),
    },
  ];

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="全部 TODO"
        columns={columns}
        pagination={{ ...PAGINATION_PROPS }}
        request={request}
        actionRef={actionRef}
        toolBarRender={() => [
          <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            刷新
          </Button>,
        ]}
        options={{ reload: false, setting: false, density: false }}
      />
      <ModalForm
        title="编辑 TODO"
        width={620}
        visible={visible}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        onFinish={async (values: any) => {
          const { code = 470, msg = '', msgType = 'info' } = await apiTodoUpdate({ id: current.id, ...values });
          message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
          if (code === 200) {
            setVisible(false);
            actionRef.current?.reload();
          }
          return code === 200;
        }}
        modalProps={{ destroyOnHidden: true, onCancel: () => setVisible(false) }}
      >
        <Form.Item label="内容" name="content" initialValue={current.content} rules={[{ required: true, message: '请输入内容' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="责任人" name="staff_id" initialValue={current.staff_id} rules={[{ required: true, message: '请选择责任人' }]}>
          <Select options={staffOptions} showSearch optionFilterProp="label" />
        </Form.Item>
        <Form.Item label="截止日期" name="deadline" initialValue={current.deadline}>
          <Input placeholder="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item label="状态" name="status" initialValue={current.status || '待处理'}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default TodoList;
