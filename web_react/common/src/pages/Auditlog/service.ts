import request from '@ray/common/utils/request';

export async function apiQuery(params) {
  return request('/api/mock/auditlog/query', {
    method: 'POST',
    body: params,
  });
}
