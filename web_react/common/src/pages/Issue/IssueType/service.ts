import request from '@ray/common/utils/request';

export async function apiTypeQuery(params: any) {
  return request('/api/issue/admin/types/query', { method: 'POST', body: params });
}

export async function apiTypeAdd(params: any) {
  return request('/api/issue/admin/types/add', { method: 'POST', body: params });
}

export async function apiTypeUpdate(params: any) {
  return request('/api/issue/admin/types/update', { method: 'POST', body: params });
}

export async function apiTypeDelete(params: any) {
  return request('/api/issue/admin/types/delete', { method: 'POST', body: params });
}
