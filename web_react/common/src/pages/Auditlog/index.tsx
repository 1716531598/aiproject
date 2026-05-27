import { ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { transformSort } from '@ray/common/utils/utilFn';
import { useRef, useState } from 'react';
import { apiQuery } from './service';

const Auditlog = () => {
  const actionRef = useRef();
  const [data, setData] = useState([]);

  const request = async (params = {}, sort = {}) => {
    const { data = {} } = await apiQuery({
      ...params,
      pageSize: params.pageSize,
      page: params.current,
      ...transformSort(sort),
    });
    const { aaData = [], total = 0 } = data;
    return {
      total: total,
      data: aaData,
      success: true,
    };
  };

  const columns = [
    {
      title: '操作人员',
      dataIndex: 'adminname',
      sorter: true,
      width: '12%',
      filters: true,
    },
    {
      title: '操作类型',
      dataIndex: 'type',
      width: '10%',
      ellipsis: true,
      valueEnum: {
        登录: { text: '登录' },
        退出: { text: '退出' },
        新增: { text: '新增' },
        修改: { text: '修改' },
        删除: { text: '删除' },
        禁用: { text: '禁用' },
        启用: { text: '启用' },
        锁定: { text: '锁定' },
        权限变更: { text: '权限变更' },
        密码重置: { text: '密码重置' },
      },
    },
    {
      title: '操作结果',
      dataIndex: 'result',
      width: '8%',
      valueEnum: {
        成功: { text: '成功', status: 'Success' },
        失败: { text: '失败', status: 'Error' },
      },
    },
    {
      title: '操作资源',
      dataIndex: 'resource',
      width: '10%',
      search: true,
    },
    {
      title: '操作IP',
      dataIndex: 'ip',
      width: '12%',
      search: true,
    },
    {
      title: '日期时间',
      dataIndex: 'createtime',
      width: '18%',
      sorter: true,
      valueType: 'dateTimeRange',
      render: (_, record) => record.createtime,
    },
    {
      title: '日志内容',
      width: '30%',
      dataIndex: 'msg',
      search: true,
    },
  ];

  return (
    <>
      <ProTable
        rowKey="id"
        headerTitle="审计日志"
        columns={columns}
        pagination={{ ...PAGINATION_PROPS }}
        request={request}
        actionRef={actionRef}
        // options={false}
      />
    </>
  );
};

export default Auditlog;
