import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { transformSort } from '@ray/common/utils/utilFn';
import { Button, Divider, Form, Input, InputNumber, message, Modal, Select, Tag, theme } from 'antd';
import { useRef, useState } from 'react';
import { apiTypeAdd, apiTypeDelete, apiTypeQuery, apiTypeUpdate } from './service';

const STATUS_OPTIONS = [
  { label: '启用', value: '启用' },
  { label: '禁用', value: '禁用' },
];

const IssueType = () => {
  const { token } = theme.useToken();
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<any>({});

  const request = async (params: any = {}, sort = {}) => {
    const { data = {} } = await apiTypeQuery({
      page: params.current,
      pageSize: params.pageSize,
      sSearch: params?.keyword,
      status: params.status,
      ...transformSort(sort),
    });
    return { data: data.aaData || [], total: data.total || 0, success: true };
  };

  const onFinish = async (values: any) => {
    const api = current.id ? apiTypeUpdate({ ...values, id: current.id }) : apiTypeAdd(values);
    const { code = 470, msg = '', msgType = 'info' } = await api;
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) {
      setVisible(false);
      setCurrent({});
      actionRef.current?.reload();
    }
  };

  const deleteItem = (record: any) => {
    Modal.confirm({
      title: '删除问题类型',
      content: `确定删除或禁用“${record.name}”吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const { code = 470, msg = '', msgType = 'info' } = await apiTypeDelete({ id: record.id });
        message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
        if (code === 200) actionRef.current?.reload();
      },
    });
  };

  const columns = [
    {
      title: '类型名称',
      dataIndex: 'name',
      render: (text: string, record: any) => (
        <a onClick={() => { setCurrent(record); setVisible(true); }} style={{ color: token.colorPrimary }}>
          {text}
        </a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      fieldProps: { options: STATUS_OPTIONS },
      render: (_: any, record: any) => <Tag color={record.status === '启用' ? 'success' : 'default'}>{record.status}</Tag>,
    },
    { title: '排序', dataIndex: 'sort_order', search: false, width: 100 },
    {
      title: '操作',
      search: false,
      width: 140,
      render: (_: any, record: any) => (
        <>
          <a onClick={() => { setCurrent(record); setVisible(true); }} style={{ color: token.colorPrimary }}>编辑</a>
          <Divider type="vertical" />
          <a onClick={() => deleteItem(record)} style={{ color: token.colorPrimary }}>删除</a>
        </>
      ),
    },
  ];

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="问题类型管理"
        columns={columns}
        pagination={{ ...PAGINATION_PROPS }}
        request={request}
        actionRef={actionRef}
        toolBarRender={() => [
          <Button icon={<PlusOutlined />} type="primary" onClick={() => { setCurrent({}); setVisible(true); }}>新建</Button>,
          <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>刷新</Button>,
        ]}
        options={{ search: { placeholder: '请输入类型名称' }, reload: false, setting: false, density: false }}
      />
      <ModalForm
        title={current.id ? '编辑问题类型' : '新增问题类型'}
        width={560}
        visible={visible}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        onFinish={onFinish}
        modalProps={{ destroyOnHidden: true, onCancel: () => { setVisible(false); setCurrent({}); } }}
      >
        <Form.Item label="类型名称" name="name" initialValue={current.name} rules={[{ required: true, message: '请输入类型名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="状态" name="status" initialValue={current.status || '启用'} rules={[{ required: true, message: '请选择状态' }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item label="排序" name="sort_order" initialValue={current.sort_order || 0}>
          <InputNumber min={0} />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default IssueType;
