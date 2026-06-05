import request from '@ray/common/utils/request';

export async function apiSyncLogQuery(params: any) {
  return request('/api/issue/admin/sync-logs/query', { method: 'POST', body: params });
}
