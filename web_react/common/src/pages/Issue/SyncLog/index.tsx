import { ProTable } from '@ant-design/pro-components';
import { PAGINATION_PROPS } from '@ray/common/constants/index';
import { apiSyncLogQuery } from './service';

const SyncLog = () => {
  const request = async (params: any = {}) => {
    const { data = {} } = await apiSyncLogQuery({
      page: params.current,
      pageSize: params.pageSize,
      status: params.status,
    });
    return { data: data.aaData || [], total: data.total || 0, success: true };
  };

  return (
    <ProTable
      rowKey="id"
      headerTitle="同步日志"
      pagination={{ ...PAGINATION_PROPS }}
      request={request}
      columns={[
        { title: '触发方式', dataIndex: 'trigger_type', search: false },
        { title: '新增数', dataIndex: 'new_count', search: false },
        { title: '更新数', dataIndex: 'update_count', search: false },
        { title: '失败数', dataIndex: 'fail_count', search: false },
        {
          title: '状态',
          dataIndex: 'status',
          valueType: 'select',
          valueEnum: {
            成功: { text: '成功' },
            失败: { text: '失败' },
            部分成功: { text: '部分成功' },
          },
        },
        { title: '错误详情', dataIndex: 'error_detail', search: false, ellipsis: true },
        { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
      ]}
    />
  );
};

export default SyncLog;
