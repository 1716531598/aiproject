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
      width: '15%',
      filters: true,
    },
    {
      title: '操作类型',
      dataIndex: 'type',
      width: '15%',
      ellipsis: true,
      valueEnum: {
        登录: { text: '登录' },
        退出: { text: '退出' },
        下载: { text: '下载' },
      },
    },
    {
      title: '操作IP',
      dataIndex: 'ip',
      width: '15%',
      search: true,
    },
    {
      title: '日期时间',
      dataIndex: 'createtime',
      width: '20%',
      sorter: true,
      valueType: 'dateTimeRange',
      render: (_, record) => record.createtime,
    },
    {
      title: '日志内容',
      width: '40%',
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
