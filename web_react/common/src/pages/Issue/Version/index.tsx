import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { transformSort } from '@ray/common/utils/utilFn';
import { Button, DatePicker, Divider, Form, Input, message, Modal, Select, Tag, theme } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import {
  apiProductOptions,
  apiVersionAdd,
  apiVersionDelete,
  apiVersionQuery,
  apiVersionUpdate,
} from './service';

const STATUS_OPTIONS = [
  { label: '规划中', value: '规划中' },
  { label: '开发中', value: '开发中' },
  { label: '已发布', value: '已发布' },
];

const Version = () => {
  const { token } = theme.useToken();
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增版本');
  const [current, setCurrent] = useState<any>({});
  const [productOptions, setProductOptions] = useState<any[]>([]);

  const loadProducts = async () => {
    const { data = {} } = await apiProductOptions();
    setProductOptions(
      (data.aaData || []).map((item: any) => ({
        label: item.name,
        value: item.id,
      })),
    );
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const request = async (params: any = {}, sort = {}) => {
    const { data = {} } = await apiVersionQuery({
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
    setModalTitle('新增版本');
    setVisible(true);
  };

  const showEditModal = (record: any) => {
    setCurrent(record);
    setModalTitle('编辑版本');
    setVisible(true);
  };

  const onFinish = async (values: any) => {
    const payload = {
      ...values,
      plan_date: values.plan_date ? values.plan_date.format('YYYY-MM-DD') : undefined,
    };
    const apiCall =
      modalTitle === '编辑版本'
        ? apiVersionUpdate({ ...payload, id: current.id })
        : apiVersionAdd(payload);
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
      title: '删除版本',
      content: `确定删除版本“${record.version}”吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const { code = 470, msg = '', msgType = 'info' } = await apiVersionDelete({ id: record.id });
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
      title: '版本号',
      dataIndex: 'version',
      sorter: true,
      render: (text: string, record: any) => (
        <a onClick={() => showEditModal(record)} style={{ color: token.colorPrimary }}>
          {text}
        </a>
      ),
    },
    {
      title: '计划时间',
      dataIndex: 'plan_date',
      valueType: 'date',
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        规划中: { text: '规划中' },
        开发中: { text: '开发中' },
        已发布: { text: '已发布' },
      },
      render: (_: any, record: any) => <Tag>{record.status}</Tag>,
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
        headerTitle="版本管理"
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
            placeholder: '请输入版本号',
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
          label="版本号"
          name="version"
          initialValue={current.version}
          rules={[{ required: true, message: '请输入版本号' }]}
        >
          <Input placeholder="请输入版本号" />
        </Form.Item>
        <Form.Item
          label="计划时间"
          name="plan_date"
          initialValue={current.plan_date ? dayjs(current.plan_date) : undefined}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="状态"
          name="status"
          initialValue={current.status || '规划中'}
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default Version;
