import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { transformSort } from '@ray/common/utils/utilFn';
import { useModel } from '@umijs/max';
import {
  Badge,
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Tag,
  theme,
} from 'antd';
import { useRef, useState } from 'react';
import {
  apiUserMgrAdd,
  apiUserMgrDelete,
  apiUserMgRestpwd,
  apiUserQuery,
} from './service';

const User = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  const [visible, setVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增用户');
  const actionRef = useRef();
  const [current, setCurrent] = useState({});

  const request = async (params = {}, sort = {}) => {
    const { data = {} } = await apiUserQuery({
      pageSize: params.pageSize,
      page: params.current,
      sSearch: params?.keyword,
      ...transformSort(sort),
    });
    const { aaData = [], total = 0 } = data;
    return {
      total: total,
      data: aaData,
      success: true,
    };
  };

  const onFinish = async (vaule) => {
    const {
      code = 470,
      msgType = 'info',
      msg = '',
    } = await apiUserMgrAdd({ ...vaule });
    message[msgType](msg);
    if (code == 200) {
      actionRef.current.reload();
      setVisible(false);
    }
  };

  const deleteItem = ({ id }) => {
    Modal.confirm({
      title: '删除用户',
      content: '确定删除所选用户吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const {
          code = 470,
          msgType = 'info',
          msg = '',
        } = await apiUserMgrDelete({ id });
        message[msgType](msg);
        code == 200 && actionRef.current.reload();
      },
    });
  };

  const showModal = () => {
    setCurrent({});
    setModalTitle('新增用户');
    setVisible(true);
  };

  const showEditModal = (item) => {
    setCurrent(item);
    setVisible(true);
    setModalTitle('编辑用户');
  };

  const resetItem = (item) => {
    Modal.confirm({
      title: '密码重置',
      content: '密码将重置为 adMin@123 ，确认重置？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const {
          code = 470,
          msgType = 'info',
          msg = '',
        } = await apiUserMgRestpwd({ user_id: item.id });
        message[msgType](msg);
      },
    });
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'name',
      sorter: true,
      render: (text, record) => (
        <a
          onClick={() => showEditModal(record)}
          style={{ color: token.colorPrimary }}
        >
          {text}
        </a>
      ),
    },
    {
      title: '用户类型',
      dataIndex: 'role_type',
      sorter: true,
      render: (text) => {
        if (text === 1) return <>超级管理员</>;
        if (text === 2) return <>普通用户</>;
        if (text === 3) return <>审计角色</>;
        return <>-</>;
      },
    },
    {
      title: '所属用户',
      dataIndex: 'parentName',
    },
    {
      title: '账号状态',
      dataIndex: 'is_login',
      sorter: true,
      render: (text) => {
        if (text === 1) return <Badge status="processing" text="启用" />;
        return <Badge status="error" text="禁用" />;
      },
    },
    {
      title: '登录错误锁定',
      dataIndex: 'errcount',
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: '登录超时(min)',
      dataIndex: 'timeout',
    },
    {
      title: '操作',
      width: 250,
      render: (_, record) => (
        <>
          <a
            onClick={() => showEditModal(record)}
            style={{ color: token.colorPrimary }}
          >
            编辑
          </a>
          <Divider type="vertical" />
          <a
            onClick={() => resetItem(record)}
            style={{ color: token.colorPrimary }}
          >
            重置密码
          </a>
          <Divider type="vertical" />
          <a
            onClick={() => deleteItem(record)}
            style={{ color: token.colorPrimary }}
          >
            删除
          </a>
        </>
      ),
    },
  ];

  const getModalContent = () => (
    <>
      <Form.Item
        label="用户名"
        name="username"
        rules={[
          {
            required: true,
            message: '请输入4-32数字/字母',
            min: 4,
            max: 32,
            pattern: /^[A-Za-z0-9]{4,32}$/,
          },
        ]}
        initialValue={current.name}
      >
        <Input placeholder="请输入用户名" disabled={modalTitle == '编辑用户'} />
      </Form.Item>
      {modalTitle !== '编辑用户' && (
        <>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              {
                required: true,
                message: '请输入8至32位密码！',
                min: 8,
                max: 32,
              },
              // { validator: securityCheck },
            ]}
          >
            <Input.Password placeholder="请输入密码！" />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="rePassword"
            dependencies={['password']}
            rules={[
              {
                required: true,
                message: '请与密码输入一致！',
                min: 8,
                max: 32,
              },
              // { validator: checkPass2 },
              // { validator: securityCheck },
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
        </>
      )}
      <Form.Item
        label="用户类型"
        name="role_type"
        rules={[{ required: true, message: '请选择用户类型' }]}
        initialValue={current.role_type}
      >
        <Select
          disabled={current.role_type}
          placeholder="请选择用户类型"
          options={[
            { value: 1, label: '超级管理员' },
            { value: 2, label: '普通用户' },
            { value: 3, label: '审计角色' },
          ]}
        />
      </Form.Item>
      <Form.Item
        label="账号状态"
        name="isLogin"
        rules={[{ required: true, message: '请选择账号状态' }]}
        initialValue={current.is_login === undefined ? 1 : current.is_login}
      >
        <Radio.Group>
          <Radio value={1}> 启用 </Radio>
          <Radio value={0}> 禁用 </Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        label="登录错误锁定"
        name="errcount"
        rules={[
          {
            required: true,
            message: '请输入1~10数字',
            min: 1,
            max: 10,
            type: 'integer',
          },
        ]}
        initialValue={current.errcount ? current.errcount : 5}
      >
        <InputNumber min={1} max={10} />
      </Form.Item>
      <Form.Item
        label="登录超时(min)"
        name="timeout"
        rules={[
          {
            required: true,
            message: '请输入1~60数字',
            min: 1,
            max: 60,
            type: 'integer',
          },
        ]}
        initialValue={current.timeout ? current.timeout : 30}
      >
        <InputNumber min={1} max={60} />
      </Form.Item>
    </>
  );

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="用户管理"
        toolBarRender={() => [
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => showModal()}
          >
            新建
          </Button>,
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              actionRef.current.reload();
            }}
          >
            刷新
          </Button>,
        ]}
        columns={columns}
        pagination={{ ...PAGINATION_PROPS }}
        search={false}
        request={request}
        actionRef={actionRef}
        options={{
          search: {
            placeholder: '请输入用户名',
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
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 13 }}
        visible={visible}
        onFinish={onFinish}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => {
            setVisible(false);
            setCurrent({});
            setModalTitle('');
          },
        }}
      >
        {getModalContent()}
      </ModalForm>
    </>
  );
};

export default User;
