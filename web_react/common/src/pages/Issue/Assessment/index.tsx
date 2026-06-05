import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { Button, Divider, Form, message, Modal, Select, Tag, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { apiAssessmentAdd, apiAssessmentQuery, apiAssessmentRemove, apiProductOptions, apiVersionByProduct } from './service';

const Assessment = () => {
  const { token } = theme.useToken();
  const actionRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [versionOptions, setVersionOptions] = useState<any[]>([]);

  const loadProducts = async () => {
    const { data = {} } = await apiProductOptions();
    setProductOptions((data.aaData || []).map((item: any) => ({ label: item.name, value: item.id })));
  };

  useEffect(() => { loadProducts(); }, []);

  const request = async (params: any = {}) => {
    const { data = {} } = await apiAssessmentQuery({ page: params.current, pageSize: params.pageSize, product_id: params.product_id });
    return { data: data.aaData || [], total: data.total || 0, success: true };
  };

  const removeItem = (record: any) => {
    Modal.confirm({
      title: '移除考核配置',
      content: `确定移除“${record.product_name} / ${record.version}”吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const { code = 470, msg = '', msgType = 'info' } = await apiAssessmentRemove({ id: record.id });
        message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
        if (code === 200) actionRef.current?.reload();
      },
    });
  };

  const columns = [
    { title: '产品', dataIndex: 'product_id', valueType: 'select', fieldProps: { options: productOptions }, render: (_: any, r: any) => r.product_name },
    { title: '版本', dataIndex: 'version', search: false },
    { title: '计划时间', dataIndex: 'plan_date', valueType: 'date', search: false },
    { title: '状态', dataIndex: 'status', search: false, render: (_: any, r: any) => <Tag>{r.status}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作',
      search: false,
      width: 100,
      render: (_: any, record: any) => <a onClick={() => removeItem(record)} style={{ color: token.colorPrimary }}>移除</a>,
    },
  ];

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="考核配置"
        columns={columns}
        pagination={{ ...PAGINATION_PROPS }}
        request={request}
        actionRef={actionRef}
        toolBarRender={() => [
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setVisible(true)}>新增</Button>,
          <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>刷新</Button>,
        ]}
        options={{ reload: false, setting: false, density: false }}
      />
      <ModalForm
        title="新增考核配置"
        width={560}
        visible={visible}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        onFinish={async (values: any) => {
          const { code = 470, msg = '', msgType = 'info' } = await apiAssessmentAdd(values);
          message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
          if (code === 200) { setVisible(false); actionRef.current?.reload(); }
        }}
        modalProps={{ destroyOnHidden: true, onCancel: () => setVisible(false) }}
      >
        <Form.Item label="产品" name="product_id" rules={[{ required: true, message: '请选择产品' }]}>
          <Select
            options={productOptions}
            showSearch
            optionFilterProp="label"
            onChange={async (productId) => {
              const { data = [] } = await apiVersionByProduct(productId);
              setVersionOptions(data.map((item: any) => ({ label: item.version, value: item.id })));
            }}
          />
        </Form.Item>
        <Form.Item label="版本" name="version_id" rules={[{ required: true, message: '请选择版本' }]}>
          <Select options={versionOptions} showSearch optionFilterProp="label" />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default Assessment;
