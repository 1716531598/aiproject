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

export async function apiBugDetail(params: any) {
  return request('/api/issue/bugs/detail', { method: 'POST', body: params });
}

export async function apiBugUpdateExt(params: any) {
  return request('/api/issue/bugs/update-ext', { method: 'POST', body: params });
}

export async function apiBugCommentAdd(params: any) {
  return request('/api/issue/bugs/comment/add', { method: 'POST', body: params });
}

export async function apiBugCommentList(params: any) {
  return request('/api/issue/bugs/comment/list', { method: 'POST', body: params });
}

export async function apiBugHistory(params: any) {
  return request('/api/issue/bugs/history', { method: 'POST', body: params });
}

export async function apiModuleByProduct(product_id: number) {
  return request('/api/issue/modules/by-product', { method: 'POST', body: { product_id } });
}

export async function apiVersionByProduct(product_id: number) {
  return request('/api/issue/versions/by-product', { method: 'POST', body: { product_id } });
}

export async function apiStaffActiveOptions() {
  return request('/api/issue/staffs/all-active', { method: 'GET' });
}
