import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { transformSort } from '@ray/common/utils/utilFn';
import { Button, Divider, Form, Input, message, Modal, Select, Tag, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import {
  apiStaffAdd,
  apiStaffDelete,
  apiStaffQuery,
  apiStaffUpdate,
  apiUserOptions,
} from './service';

const STATUS_OPTIONS = [
  { label: '启用', value: '启用' },
  { label: '禁用', value: '禁用' },
];

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  启用: { text: '启用', color: 'success' },
  禁用: { text: '禁用', color: 'default' },
};

const Staff = () => {
  const { token } = theme.useToken();
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增人员档案');
  const [current, setCurrent] = useState<any>({});
  const [userOptions, setUserOptions] = useState<any[]>([]);

  const loadUsers = async () => {
    const { data = {} } = await apiUserOptions();
    setUserOptions(
      (data.aaData || []).map((item: any) => ({
        label: item.username || item.name,
        value: item.id,
      })),
    );
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const request = async (params: any = {}, sort = {}) => {
    const { data = {} } = await apiStaffQuery({
      pageSize: params.pageSize,
      page: params.current,
      sSearch: params?.keyword,
      department: params.department,
      status: params.status,
      ...transformSort(sort),
    });
    const { aaData = [], total = 0 } = data;
    return {
      total,
      data: aaData,
      success: true,
    };
  };

  const showAddModal = () => {
    setCurrent({});
    setModalTitle('新增人员档案');
    setVisible(true);
  };

  const showEditModal = (record: any) => {
    setCurrent(record);
    setModalTitle('编辑人员档案');
    setVisible(true);
  };

  const onFinish = async (values: any) => {
    const apiCall =
      modalTitle === '编辑人员档案'
        ? apiStaffUpdate({ ...values, id: current.id })
        : apiStaffAdd(values);
    const { code = 470, msg = '', msgType = 'info' } = await apiCall;
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) {
      actionRef.current?.reload();
      setVisible(false);
      setCurrent({});
    }
  };

  const disableItem = (record: any) => {
    Modal.confirm({
      title: '禁用人员档案',
      content: `确定禁用人员档案“${record.name}”吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const { code = 470, msg = '', msgType = 'info' } = await apiStaffDelete({ id: record.id });
        message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
        if (code === 200) {
          actionRef.current?.reload();
        }
      },
    });
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      sorter: true,
      render: (text: string, record: any) => (
        <a onClick={() => showEditModal(record)} style={{ color: token.colorPrimary }}>
          {text}
        </a>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
    },
    {
      title: '岗位角色',
      dataIndex: 'job_role',
      search: false,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      search: false,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      search: false,
    },
    {
      title: '关联账号',
      dataIndex: 'user_name',
      search: false,
      render: (_: any, record: any) =>
        record.user_name ? record.user_name : <Tag color="default">未关联</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      fieldProps: {
        options: STATUS_OPTIONS,
      },
      render: (_: any, record: any) => {
        const status = STATUS_MAP[record.status] || { text: record.status || '-', color: 'default' };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '操作',
      search: false,
      width: 140,
      render: (_: any, record: any) => (
        <>
          <a onClick={() => showEditModal(record)} style={{ color: token.colorPrimary }}>
            编辑
          </a>
          <Divider type="vertical" />
          <a onClick={() => disableItem(record)} style={{ color: token.colorPrimary }}>
            禁用
          </a>
        </>
      ),
    },
  ];

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="人员档案管理"
        toolBarRender={() => [
          <Button icon={<PlusOutlined />} type="primary" onClick={showAddModal}>
            新建
          </Button>,
          <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            刷新
          </Button>,
        ]}
        columns={columns}
        pagination={{ ...PAGINATION_PROPS }}
        request={request}
        actionRef={actionRef}
        options={{
          search: {
            placeholder: '请输入姓名关键词',
          },
          reload: false,
          setting: false,
          density: false,
        }}
      />

      <ModalForm
        title={modalTitle}
        width={640}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        visible={visible}
        onFinish={onFinish}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => {
            setVisible(false);
            setCurrent({});
          },
        }}
      >
        <Form.Item
          label="姓名"
          name="name"
          initialValue={current.name}
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item
          label="部门"
          name="department"
          initialValue={current.department}
          rules={[{ required: true, message: '请输入部门' }]}
        >
          <Input placeholder="请输入部门" />
        </Form.Item>
        <Form.Item
          label="岗位角色"
          name="job_role"
          initialValue={current.job_role}
          rules={[{ required: true, message: '请输入岗位角色' }]}
        >
          <Input placeholder="请输入岗位角色" />
        </Form.Item>
        <Form.Item
          label="邮箱"
          name="email"
          initialValue={current.email}
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入正确的邮箱格式' },
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item
          label="电话"
          name="phone"
          initialValue={current.phone}
          rules={[{ required: true, message: '请输入电话' }]}
        >
          <Input placeholder="请输入电话" />
        </Form.Item>
        <Form.Item label="关联账号" name="user_id" initialValue={current.user_id}>
          <Select
            allowClear
            options={userOptions}
            showSearch
            optionFilterProp="label"
            placeholder="请选择关联账号"
          />
        </Form.Item>
        <Form.Item
          label="状态"
          name="status"
          initialValue={current.status || '启用'}
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default Staff;
