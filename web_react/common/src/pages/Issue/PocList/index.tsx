import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { Button, Form, Input, message, Select, Tag, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { apiPocManualAdd, apiPocQuery, apiProductOptions } from './service';

const RISK_OPTIONS = [
  { label: '有风险', value: 1 },
  { label: '无风险', value: 0 },
];

const PocList = () => {
  const { token } = theme.useToken();
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [productOptions, setProductOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      const { data = {} } = await apiProductOptions();
      setProductOptions((data.aaData || []).map((item: any) => ({ label: item.name, value: item.id })));
    };
    loadProducts();
  }, []);

  const request = async (params: any = {}) => {
    const { data = {} } = await apiPocQuery({
      page: params.current,
      pageSize: params.pageSize,
      product_id: params.product_id,
      has_risk: params.has_risk,
      keyword: params.keyword,
    });
    return { data: data.aaData || [], total: data.total || 0, success: true };
  };

  const columns = [
    { title: '关键词', dataIndex: 'keyword', hideInTable: true },
    {
      title: '项目编码',
      dataIndex: 'project_code',
      search: false,
      width: 160,
      render: (text: string, record: any) => (
        <a onClick={() => history.push(`/issue/poc/${record.id}`)} style={{ color: token.colorPrimary }}>
          {text}
        </a>
      ),
    },
    { title: '客户名称', dataIndex: 'customer_name', search: false },
    {
      title: '产品',
      dataIndex: 'product_id',
      valueType: 'select',
      fieldProps: { options: productOptions, showSearch: true, optionFilterProp: 'label' },
      render: (_: any, record: any) => record.product_name,
      width: 160,
    },
    { title: '版本', dataIndex: 'version', search: false, width: 120 },
    {
      title: '风险',
      dataIndex: 'has_risk',
      valueType: 'select',
      fieldProps: { options: RISK_OPTIONS },
      width: 110,
      render: (_: any, record: any) => <Tag color={record.has_risk ? 'red' : 'success'}>{record.has_risk ? '有风险' : '无风险'}</Tag>,
    },
    { title: '状态', dataIndex: 'current_status', search: false, width: 120 },
    { title: '风险描述', dataIndex: 'risk_desc', search: false, ellipsis: true },
  ];

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="PoC 风险项目"
        columns={columns}
        pagination={{ ...PAGINATION_PROPS }}
        request={request}
        actionRef={actionRef}
        toolBarRender={() => [
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setVisible(true)}>
            手动录入
          </Button>,
          <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            刷新
          </Button>,
        ]}
        options={{ reload: false, setting: false, density: false }}
      />
      <ModalForm
        title="手动录入风险项目"
        width={680}
        visible={visible}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        onFinish={async (values: any) => {
          const { code = 470, msg = '', msgType = 'info' } = await apiPocManualAdd(values);
          message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
          if (code === 200) {
            setVisible(false);
            actionRef.current?.reload();
          }
          return code === 200;
        }}
        modalProps={{ destroyOnHidden: true, onCancel: () => setVisible(false) }}
      >
        <Form.Item label="项目编码" name="project_code">
          <Input placeholder="为空时自动生成" />
        </Form.Item>
        <Form.Item label="客户名称" name="customer_name" rules={[{ required: true, message: '请输入客户名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="产品" name="product_id">
          <Select allowClear options={productOptions} showSearch optionFilterProp="label" />
        </Form.Item>
        <Form.Item label="版本" name="version">
          <Input />
        </Form.Item>
        <Form.Item label="风险描述" name="risk_desc">
          <Input.TextArea rows={3} />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default PocList;
