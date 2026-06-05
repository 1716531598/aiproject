import { ExportOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalForm, ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { Button, Divider, Form, Input, InputNumber, message, Select, Space, Statistic, Tag, theme } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  apiProductOptions,
  apiResponsibilityExport,
  apiResponsibilityList,
  apiResponsibilitySave,
  apiResponsibilityScore,
  apiStaffActiveOptions,
} from './service';

const ASSIGNED_OPTIONS = [
  { label: '已分配', value: true },
  { label: '未分配', value: false },
];

const Responsibility = () => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const actionRef = useRef<any>();
  const scoreRef = useRef<any>();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<any>({});
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const records = Form.useWatch('records', form) || [];
  const totalRatio = useMemo(
    () => records.reduce((sum: number, item: any) => sum + Number(item?.ratio || 0), 0),
    [records],
  );

  useEffect(() => {
    const loadOptions = async () => {
      const [{ data: staffs = [] }, { data: products = {} }] = await Promise.all([
        apiStaffActiveOptions(),
        apiProductOptions(),
      ]);
      setStaffOptions(staffs.map((item: any) => ({ label: item.name, value: item.id })));
      setProductOptions((products.aaData || []).map((item: any) => ({ label: item.name, value: item.id })));
    };
    loadOptions();
  }, []);

  const openEdit = (record: any) => {
    setCurrent(record);
    form.setFieldsValue({
      records: record.responsibilities?.length
        ? record.responsibilities.map((item: any) => ({
            staff_id: item.staff_id,
            role: item.role,
            ratio: item.ratio,
            description: item.description,
          }))
        : [{}],
    });
    setVisible(true);
  };

  const request = async (params: any = {}) => {
    const { data = {} } = await apiResponsibilityList({
      page: params.current,
      pageSize: params.pageSize,
      product_id: params.product_id,
      assigned: params.assigned,
    });
    return { data: data.aaData || [], total: data.total || 0, success: true };
  };

  const downloadExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await apiResponsibilityExport({});
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      document.body.appendChild(link);
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename;
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      message.error(error?.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      title: '产品',
      dataIndex: 'product_id',
      valueType: 'select',
      fieldProps: { options: productOptions, showSearch: true, optionFilterProp: 'label' },
      render: (_: any, record: any) => record.product_name,
      width: 160,
    },
    { title: '版本', dataIndex: 'affect_version', search: false, width: 120 },
    { title: 'Bug ID', dataIndex: 'bug_id', search: false, width: 130 },
    {
      title: '严重级别',
      dataIndex: 'severity',
      search: false,
      width: 100,
      render: (_: any, record: any) => <Tag>P{record.severity}</Tag>,
    },
    { title: '标题', dataIndex: 'title', search: false, ellipsis: true },
    { title: '创建时间', dataIndex: 'created_date', valueType: 'dateTime', search: false, width: 170 },
    {
      title: '分配状态',
      dataIndex: 'assigned',
      valueType: 'select',
      fieldProps: { options: ASSIGNED_OPTIONS },
      width: 120,
      render: (_: any, record: any) => (
        <Tag color={record.has_responsibility ? 'success' : 'warning'}>
          {record.has_responsibility ? '已分配' : '未分配'}
        </Tag>
      ),
    },
    {
      title: '责任人',
      dataIndex: 'responsibilities',
      search: false,
      ellipsis: true,
      render: (_: any, record: any) =>
        (record.responsibilities || []).map((item: any) => item.staff_name).join('、'),
    },
    {
      title: '操作',
      search: false,
      width: 100,
      render: (_: any, record: any) => (
        <a onClick={() => openEdit(record)} style={{ color: token.colorPrimary }}>
          编辑
        </a>
      ),
    },
  ];

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="责任分配"
        columns={columns}
        pagination={{ ...PAGINATION_PROPS }}
        request={request}
        actionRef={actionRef}
        toolBarRender={() => [
          <Button icon={<ExportOutlined />} loading={exporting} onClick={downloadExport}>
            导出
          </Button>,
          <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            刷新
          </Button>,
        ]}
        options={{ reload: false, setting: false, density: false }}
      />

      <ProTable
        rowKey="staff_id"
        headerTitle="年度扣分排行"
        style={{ marginTop: 16 }}
        search={false}
        pagination={false}
        actionRef={scoreRef}
        request={async () => {
          const { data = [] } = await apiResponsibilityScore({});
          return { data, success: true };
        }}
        columns={[
          { title: '人员', dataIndex: 'staff_name' },
          { title: '部门', dataIndex: 'department' },
          { title: '涉及 Bug 数', dataIndex: 'bug_count' },
          { title: '原始扣分', dataIndex: 'raw_score' },
          { title: '封顶扣分', dataIndex: 'total_score' },
        ]}
        toolBarRender={() => [
          <Button icon={<ReloadOutlined />} onClick={() => scoreRef.current?.reload()}>
            刷新
          </Button>,
        ]}
        options={{ reload: false, setting: false, density: false }}
      />

      <ModalForm
        title={`责任分配 - ${current.bug_id || ''}`}
        width={860}
        visible={visible}
        form={form}
        onFinish={async (values: any) => {
          const filteredRecords = (values.records || []).filter((item: any) => item?.staff_id);
          const ratio = filteredRecords.reduce((sum: number, item: any) => sum + Number(item?.ratio || 0), 0);
          if (filteredRecords.length && Math.abs(ratio - 1) > 0.001) {
            message.error('责任占比合计不为 100%');
            return false;
          }
          const { code = 470, msg = '', msgType = 'info' } = await apiResponsibilitySave({
            bug_id: current.id,
            records: filteredRecords,
          });
          message[msgType === 'success' || code === 200 ? 'success' : 'error'](msg);
          if (code === 200) {
            setVisible(false);
            actionRef.current?.reload();
            scoreRef.current?.reload();
          }
          return code === 200;
        }}
        modalProps={{ destroyOnHidden: true, onCancel: () => setVisible(false) }}
        submitter={{ submitButtonProps: { disabled: records.length > 0 && Math.abs(totalRatio - 1) > 0.001 } }}
      >
        <Space style={{ marginBottom: 16 }}>
          <Statistic title="责任占比合计" value={Math.round(totalRatio * 100)} suffix="%" />
          {records.length > 0 && Math.abs(totalRatio - 1) > 0.001 ? (
            <span style={{ color: token.colorError }}>合计必须等于 100%</span>
          ) : null}
        </Space>
        <Form.List name="records">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item
                    {...field}
                    label="责任人"
                    name={[field.name, 'staff_id']}
                    rules={[{ required: true, message: '请选择责任人' }]}
                  >
                    <Select options={staffOptions} showSearch optionFilterProp="label" style={{ width: 160 }} />
                  </Form.Item>
                  <Form.Item {...field} label="角色" name={[field.name, 'role']}>
                    <Input style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label="占比"
                    name={[field.name, 'ratio']}
                    rules={[{ required: true, message: '请输入占比' }]}
                  >
                    <InputNumber min={0} max={1} step={0.1} style={{ width: 100 }} />
                  </Form.Item>
                  <Form.Item {...field} label="说明" name={[field.name, 'description']}>
                    <Input style={{ width: 260 }} />
                  </Form.Item>
                  <Divider type="vertical" />
                  <Button onClick={() => remove(field.name)}>删除</Button>
                </Space>
              ))}
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                添加责任人
              </Button>
            </>
          )}
        </Form.List>
      </ModalForm>
    </>
  );
};

export default Responsibility;
