import { PlusOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, Tag, Tree, theme } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useRef, useState } from 'react';

// 菜单树定义，与路由结构对应
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

const DEFAULT_ROLES: RoleItem[] = [
  { id: 1, name: '超级管理员', builtIn: true, checkedKeys: ['common', 'common/dashboard', 'common/user', 'common/role', 'common/auditlog'] },
  { id: 2, name: '普通用户', builtIn: true, checkedKeys: ['common', 'common/dashboard'] },
  { id: 3, name: '审计角色', builtIn: true, checkedKeys: ['common', 'common/auditlog'] },
];

// 从 checkedKeys 中提取功能组和功能菜单的展示信息
function getGroupMenuDisplay(checkedKeys: string[]) {
  const result: { group: string; menus: string[] }[] = [];
  const menuMap: Record<string, string> = {
    'common/dashboard': '主页面',
    'common/user': '用户管理',
    'common/role': '角色管理',
    'common/auditlog': '审计日志',
  };
  const groupMap: Record<string, string> = { common: '系统配置' };
  // 按 key 前缀分组
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

let nextId = 100;

const Role = () => {
  const { token } = theme.useToken();
  const actionRef = useRef();
  const [roles, setRoles] = useState<RoleItem[]>(DEFAULT_ROLES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [form] = Form.useForm();
  const menus = Form.useWatch('menus', form);

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
  };

  const handleDelete = (role: RoleItem) => {
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
  };

  const handleAdd = () => {
    setEditingRole(null);
    setModalVisible(true);
  };

  const onFinish = async (values: { name: string; menus: string[] }) => {
    // 收集所有选中的 key（包含父节点和子节点）
    const checkedKeys = values.menus || [];
    if (editingRole) {
      setRoles((prev) =>
        prev.map((r) => (r.id === editingRole.id ? { ...r, name: values.name, checkedKeys } : r)),
      );
    } else {
      setRoles((prev) => [
        ...prev,
        { id: nextId++, name: values.name, builtIn: false, checkedKeys },
      ]);
    }
    setModalVisible(false);
    setEditingRole(null);
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
          },
        }}
        initialValues={
          editingRole
            ? { name: editingRole.name, menus: editingRole.checkedKeys }
            : { name: '', menus: [] }
        }
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
