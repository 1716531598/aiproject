import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { transformSort } from '@ray/common/utils/utilFn';
import { Button, Divider, Form, Input, message, Modal, Select, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import {
  apiModuleAdd,
  apiModuleDelete,
  apiModuleQuery,
  apiModuleUpdate,
  apiProductOptions,
} from './service';

const Module = () => {
  const { token } = theme.useToken();
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增模块');
  const [current, setCurrent] = useState<any>({});
  const [productOptions, setProductOptions] = useState<any[]>([]);

  const loadProducts = async () => {
    const { data = {} } = await apiProductOptions();
    const options = (data.aaData || []).map((item: any) => ({
      label: item.name,
      value: item.id,
    }));
    setProductOptions(options);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const request = async (params: any = {}, sort = {}) => {
    const { data = {} } = await apiModuleQuery({
      pageSize: params.pageSize,
      page: params.current,
      product_id: params.product_id,
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
    setModalTitle('新增模块');
    setVisible(true);
  };

  const showEditModal = (record: any) => {
    setCurrent(record);
    setModalTitle('编辑模块');
    setVisible(true);
  };

  const onFinish = async (values: any) => {
    const apiCall =
      modalTitle === '编辑模块'
        ? apiModuleUpdate({ ...values, id: current.id })
        : apiModuleAdd(values);
    const { code = 470, msg = '', msgType = 'info' } = await apiCall;
    message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
    if (code === 200) {
      actionRef.current?.reload();
      setVisible(false);
      setCurrent({});
    }
  };

  const deleteItem = (record: any) => {
    Modal.confirm({
      title: '删除模块',
      content: `确定删除模块“${record.name}”吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const { code = 470, msg = '', msgType = 'info' } = await apiModuleDelete({ id: record.id });
        message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
        if (code === 200) {
          actionRef.current?.reload();
        }
      },
    });
  };

  const columns = [
    {
      title: '产品',
      dataIndex: 'product_id',
      valueType: 'select',
      fieldProps: {
        options: productOptions,
        showSearch: true,
        optionFilterProp: 'label',
      },
      render: (_: any, record: any) => record.product_name || '-',
    },
    {
      title: '模块名称',
      dataIndex: 'name',
      sorter: true,
      render: (text: string, record: any) => (
        <a onClick={() => showEditModal(record)} style={{ color: token.colorPrimary }}>
          {text}
        </a>
      ),
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
      width: 140,
      render: (_: any, record: any) => (
        <>
          <a onClick={() => showEditModal(record)} style={{ color: token.colorPrimary }}>
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
        headerTitle="模块管理"
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
            placeholder: '请输入模块名称',
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
          label="产品"
          name="product_id"
          initialValue={current.product_id}
          rules={[{ required: true, message: '请选择产品' }]}
        >
          <Select options={productOptions} showSearch optionFilterProp="label" placeholder="请选择产品" />
        </Form.Item>
        <Form.Item
          label="模块名称"
          name="name"
          initialValue={current.name}
          rules={[{ required: true, message: '请输入模块名称' }]}
        >
          <Input placeholder="请输入模块名称" />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default Module;
