import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { transformSort } from '@ray/common/utils/utilFn';
import { Button, Divider, Form, Input, InputNumber, message, Modal, Select, Space, theme } from 'antd';
import { useRef, useState } from 'react';
import {
  apiProductAdd,
  apiProductDelete,
  apiProductMappingUpdate,
  apiProductQuery,
  apiProductUpdate,
} from './service';

const SOURCE_TYPE_OPTIONS = [
  { label: '禅道', value: 'zentao' },
  { label: '周报', value: 'weekly' },
];

const Product = () => {
  const { token } = theme.useToken();
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [mappingVisible, setMappingVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增产品');
  const [current, setCurrent] = useState<any>({});

  const request = async (params = {}, sort = {}) => {
    const { data = {} } = await apiProductQuery({
      pageSize: params.pageSize,
      page: params.current,
      sSearch: params?.keyword,
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
    setModalTitle('新增产品');
    setVisible(true);
  };

  const showEditModal = (record: any) => {
    setCurrent(record);
    setModalTitle('编辑产品');
    setVisible(true);
  };

  const showMappingModal = (record: any) => {
    setCurrent(record);
    setMappingVisible(true);
  };

  const onFinish = async (values: any) => {
    const apiCall =
      modalTitle === '编辑产品'
        ? apiProductUpdate({ ...values, id: current.id })
        : apiProductAdd(values);
    const { code = 470, msg = '', msgType = 'info' } = await apiCall;
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) {
      actionRef.current?.reload();
      setVisible(false);
      setCurrent({});
    }
  };

  const onMappingFinish = async (values: any) => {
    const mappings = (values.mappings || []).filter((item: any) => item?.source_type && item?.source_name);
    const { code = 470, msg = '', msgType = 'info' } = await apiProductMappingUpdate({
      product_id: current.id,
      mappings,
    });
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) {
      actionRef.current?.reload();
      setMappingVisible(false);
      setCurrent({});
    }
  };

  const deleteItem = (record: any) => {
    Modal.confirm({
      title: '删除产品',
      content: `确定删除产品“${record.name}”吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const { code = 470, msg = '', msgType = 'info' } = await apiProductDelete({ id: record.id });
        message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
        if (code === 200) {
          actionRef.current?.reload();
        }
      },
    });
  };

  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      sorter: true,
      render: (text: string, record: any) => (
        <a onClick={() => showEditModal(record)} style={{ color: token.colorPrimary }}>
          {text}
        </a>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      search: false,
      ellipsis: true,
    },
    {
      title: '关联 Bug 数',
      dataIndex: 'bug_count',
      search: false,
      width: 120,
    },
    {
      title: '操作',
      search: false,
      width: 180,
      render: (_: any, record: any) => (
        <>
          <a onClick={() => showEditModal(record)} style={{ color: token.colorPrimary }}>
            编辑
          </a>
          <Divider type="vertical" />
          <a onClick={() => showMappingModal(record)} style={{ color: token.colorPrimary }}>
            映射
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
        headerTitle="产品管理"
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
            placeholder: '请输入产品名称',
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
          label="产品名称"
          name="name"
          initialValue={current.name}
          rules={[{ required: true, message: '请输入产品名称' }]}
        >
          <Input placeholder="请输入产品名称" />
        </Form.Item>
        <Form.Item label="描述" name="description" initialValue={current.description}>
          <Input.TextArea placeholder="请输入产品描述" rows={4} />
        </Form.Item>
      </ModalForm>

      <ModalForm
        title={`产品映射 - ${current.name || ''}`}
        width={760}
        visible={mappingVisible}
        onFinish={onMappingFinish}
        initialValues={{ mappings: current.mappings?.length ? current.mappings : [{}] }}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => {
            setMappingVisible(false);
            setCurrent({});
          },
        }}
      >
        <Form.List name="mappings">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item
                    {...field}
                    label="来源"
                    name={[field.name, 'source_type']}
                    rules={[{ required: true, message: '请选择来源' }]}
                  >
                    <Select options={SOURCE_TYPE_OPTIONS} style={{ width: 140 }} />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label="原始名称"
                    name={[field.name, 'source_name']}
                    rules={[{ required: true, message: '请输入原始名称' }]}
                  >
                    <Input style={{ width: 320 }} />
                  </Form.Item>
                  <Button onClick={() => remove(field.name)}>删除</Button>
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block>
                添加映射
              </Button>
            </>
          )}
        </Form.List>
      </ModalForm>
    </>
  );
};

export default Product;
