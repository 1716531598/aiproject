import request from '@ray/common/utils/request';

export async function apiBugQuery(params: any) {
  return request('/api/issue/bugs/query', { method: 'POST', body: params });
}

export async function apiProductOptions() {
  return request('/api/issue/products/query', { method: 'POST', body: { page: 1, pageSize: 1000 } });
}

export async function apiIssueTypeOptions() {
  return request('/api/issue/admin/types/query', { method: 'POST', body: { page: 1, pageSize: 1000, status: '启用' } });
}
