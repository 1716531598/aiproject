import { ImportOutlined, ReloadOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { transformSort } from '@ray/common/utils/utilFn';
import { Button, Tag, theme } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { apiBugQuery, apiIssueTypeOptions, apiProductOptions } from './service';

const SEVERITY_OPTIONS = [
  { label: 'P1', value: 1 },
  { label: 'P2', value: 2 },
  { label: 'P3', value: 3 },
  { label: 'P4', value: 4 },
];

const STATUS_OPTIONS = [
  { label: '激活', value: '激活' },
  { label: '已解决', value: '已解决' },
  { label: '已关闭', value: '已关闭' },
  { label: '重新打开', value: '重新打开' },
];

const severityColor = {
  1: 'red',
  2: 'orange',
  3: 'blue',
  4: 'default',
};

const statusColor = {
  激活: 'red',
  已解决: 'green',
  已关闭: 'default',
  重新打开: 'orange',
};

const BugList = () => {
  const { token } = theme.useToken();
  const actionRef = useRef<any>();
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [issueTypeOptions, setIssueTypeOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const [{ data: productData = {} }, { data: typeData = {} }] = await Promise.all([
        apiProductOptions(),
        apiIssueTypeOptions(),
      ]);
      setProductOptions((productData.aaData || []).map((item: any) => ({ label: item.name, value: item.id })));
      setIssueTypeOptions((typeData.aaData || []).map((item: any) => ({ label: item.name, value: item.id })));
    };
    loadOptions();
  }, []);

  const request = async (params: any = {}, sort = {}) => {
    const { data = {} } = await apiBugQuery({
      page: params.current,
      pageSize: params.pageSize,
      keyword: params.keyword,
      product_id: params.product_id,
      severity: params.severity,
      status: params.status,
      issue_type_id: params.issue_type_id,
      ...transformSort(sort),
    });
    return { data: data.aaData || [], total: data.total || 0, success: true };
  };

  const columns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
    },
    {
      title: 'Bug 编号',
      dataIndex: 'bug_id',
      width: 140,
      sorter: true,
      search: false,
      render: (text: string, record: any) => (
        <a onClick={() => history.push(`/issue/bugs/${record.id}`)} style={{ color: token.colorPrimary }}>
          {text}
        </a>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      search: false,
      ellipsis: true,
    },
    {
      title: '问题模块',
      dataIndex: 'module_name',
      search: false,
      width: 140,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      valueType: 'select',
      fieldProps: { options: SEVERITY_OPTIONS },
      width: 120,
      render: (_: any, record: any) => <Tag color={severityColor[record.severity]}>P{record.severity}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      fieldProps: { options: STATUS_OPTIONS },
      width: 120,
      render: (_: any, record: any) => <Tag color={statusColor[record.status] || 'default'}>{record.status}</Tag>,
    },
    {
      title: '产品',
      dataIndex: 'product_id',
      valueType: 'select',
      fieldProps: { options: productOptions, showSearch: true, optionFilterProp: 'label' },
      render: (_: any, record: any) => record.product_name,
      width: 160,
    },
    {
      title: '问题类型',
      dataIndex: 'issue_type_id',
      valueType: 'select',
      fieldProps: { options: issueTypeOptions, showSearch: true, optionFilterProp: 'label' },
      render: (_: any, record: any) => record.issue_type_name,
      width: 140,
    },
    {
      title: '解决人员',
      dataIndex: 'staff_name',
      search: false,
      width: 120,
    },
    {
      title: '计划解决版本',
      dataIndex: 'plan_version',
      search: false,
      width: 140,
    },
    {
      title: '创建时间',
      dataIndex: 'created_date',
      valueType: 'dateTime',
      sorter: true,
      search: false,
      width: 170,
    },
  ];

  return (
    <ProTable
      rowKey="id"
      headerTitle="网上问题"
      columns={columns}
      pagination={{ ...PAGINATION_PROPS }}
      request={request}
      actionRef={actionRef}
      onRow={(record) => ({
        onDoubleClick: () => history.push(`/issue/bugs/${record.id}`),
      })}
      toolBarRender={() => [
        <Button icon={<ImportOutlined />} type="primary" onClick={() => history.push('/issue/bugs/import')}>
          导入
        </Button>,
        <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
          刷新
        </Button>,
      ]}
      options={{ reload: false, setting: false, density: false }}
    />
  );
};

export default BugList;
