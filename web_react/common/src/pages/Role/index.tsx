import { PlusOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, Tag, Tree, theme, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useRef, useState, useEffect } from 'react';
import { apiRoleQuery, apiRoleAdd, apiRoleUpdate, apiRoleDelete } from './service';

const MENU_TREE: DataNode[] = [
  {
    title: '系统配置',
    key: 'common',
    children: [
      { title: '主页面', key: 'common/dashboard' },
      { title: '用户管理', key: 'common/user' },
      { title: '角色管理', key: 'common/role' },
      { title: '审计日志', key: 'common/auditlog' },
    ],
  },
];

interface RoleItem {
  id: number;
  name: string;
  builtIn: boolean;
  checkedKeys: string[];
}

function getGroupMenuDisplay(checkedKeys: string[]) {
  const result: { group: string; menus: string[] }[] = [];
  const menuMap: Record<string, string> = {
    'common/dashboard': '主页面',
    'common/user': '用户管理',
    'common/role': '角色管理',
    'common/auditlog': '审计日志',
  };
  const groupMap: Record<string, string> = { common: '系统配置' };
  const grouped: Record<string, string[]> = {};
  for (const key of checkedKeys) {
    if (key.includes('/')) {
      const groupKey = key.split('/')[0];
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(key);
    }
  }
  for (const [gk, keys] of Object.entries(grouped)) {
    result.push({
      group: groupMap[gk] || gk,
      menus: keys.map((k) => menuMap[k] || k),
    });
  }
  return result;
}

const Role = () => {
  const { token } = theme.useToken();
  const actionRef = useRef();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [form] = Form.useForm();
  const menus = Form.useWatch('menus', form);

  const fetchRoles = async () => {
    const { code, data = {} } = await apiRoleQuery();
    if (code === 200) {
      setRoles(data.aaData || []);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      render: (text: string, record: RoleItem) =>
        record.builtIn ? <Tag color="orange">{text}</Tag> : <Tag color="blue">{text}</Tag>,
    },
    {
      title: '功能组',
      dataIndex: 'checkedKeys',
      render: (_: string[], record: RoleItem) => {
        const groups = getGroupMenuDisplay(record.checkedKeys);
        return groups.map((g) => (
          <Tag key={g.group}>{g.group}</Tag>
        ));
      },
    },
    {
      title: '功能菜单',
      dataIndex: 'checkedKeys',
      render: (_: string[], record: RoleItem) => {
        const groups = getGroupMenuDisplay(record.checkedKeys);
        return groups.flatMap((g) =>
          g.menus.map((m) => (
            <Tag key={m} style={{ marginInlineEnd: 4, marginBlockEnd: 4 }}>
              {m}
            </Tag>
          )),
        );
      },
    },
    {
      title: '操作',
      width: 150,
      render: (_: unknown, record: RoleItem) => {
        if (record.builtIn) return null;
        return (
          <>
            <a onClick={() => handleEdit(record)} style={{ color: token.colorPrimary }}>
              编辑
            </a>
            <span style={{ marginInline: 8, color: token.colorBorder }}>|</span>
            <a onClick={() => handleDelete(record)} style={{ color: token.colorPrimary }}>
              删除
            </a>
          </>
        );
      },
    },
  ];

  const handleEdit = (role: RoleItem) => {
    setEditingRole(role);
    setModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue({ name: role.name, menus: role.checkedKeys });
    }, 0);
  };

  const handleDelete = async (role: RoleItem) => {
    const { code, msgType, msg } = await apiRoleDelete({ id: role.id });
    message[msgType === 'success' ? 'success' : 'error'](msg);
    if (code === 200) {
      fetchRoles();
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    setModalVisible(true);
    setTimeout(() => {
      form.resetFields();
    }, 0);
  };

  const onFinish = async (values: { name: string; menus: string[] }) => {
    const checkedKeys = values.menus || [];
    if (editingRole) {
      const { code, msgType, msg } = await apiRoleUpdate({
        id: editingRole.id,
        name: values.name,
        checkedKeys,
      });
      message[msgType === 'success' ? 'success' : 'error'](msg);
      if (code !== 200) return false;
    } else {
      const { code, msgType, msg } = await apiRoleAdd({
        name: values.name,
        checkedKeys,
      });
      message[msgType === 'success' ? 'success' : 'error'](msg);
      if (code !== 200) return false;
    }
    setModalVisible(false);
    setEditingRole(null);
    fetchRoles();
    return true;
  };

  return (
    <>
      <ProTable<RoleItem>
        rowKey="id"
        headerTitle="角色管理"
        toolBarRender={() => [
          <Button key="add" icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
            新建
          </Button>,
        ]}
        columns={columns}
        dataSource={roles}
        search={false}
        options={false}
        pagination={false}
        actionRef={actionRef}
        rowSelection={{
          type: 'checkbox',
          getCheckboxProps: (record) => ({ disabled: record.builtIn }),
        }}
      />
      <ModalForm
        form={form}
        title={editingRole ? '编辑角色' : '新建角色'}
        width={640}
        layout="horizontal"
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 13 }}
        open={modalVisible}
        onFinish={onFinish}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setModalVisible(false);
            setEditingRole(null);
            form.resetFields();
          },
        }}
      >
        <Form.Item
          label="角色名称"
          name="name"
          rules={[{ required: true, message: '请输入角色名称' }]}
        >
          <Input placeholder="请输入角色名称" />
        </Form.Item>
        <Form.Item
          label="功能菜单"
          name="menus"
          rules={[{ required: true, message: '请选择功能菜单' }]}
        >
          <Tree
            checkable
            defaultExpandAll
            treeData={MENU_TREE}
            checkedKeys={menus || []}
            style={{ maxHeight: 240, overflow: 'auto' }}
            onCheck={(checked) => {
              const keys = Array.isArray(checked) ? checked : (checked as { checked: React.Key[] }).checked;
              form.setFieldValue('menus', keys);
            }}
          />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default Role;
