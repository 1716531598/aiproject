import request from '@ray/common/utils/request';

export async function apiQuery(params) {
  return request('/api/v1/audit-logs/query', {
    method: 'POST',
    body: params,
  });
}
