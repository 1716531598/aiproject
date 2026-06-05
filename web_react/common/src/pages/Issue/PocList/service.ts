import request from '@ray/common/utils/request';

export async function apiPocQuery(params: any) {
  return request('/api/issue/poc/query', { method: 'POST', body: params });
}

export async function apiPocDetail(params: any) {
  return request('/api/issue/poc/detail', { method: 'POST', body: params });
}

export async function apiPocUpdate(params: any) {
  return request('/api/issue/poc/update', { method: 'POST', body: params });
}

export async function apiPocManualAdd(params: any) {
  return request('/api/issue/poc/manual-add', { method: 'POST', body: params });
}

export async function apiPocLinkBug(params: any) {
  return request('/api/issue/poc/link-bug', { method: 'POST', body: params });
}

export async function apiPocProgressAdd(params: any) {
  return request('/api/issue/poc/progress/add', { method: 'POST', body: params });
}

export async function apiPocTodoAdd(params: any) {
  return request('/api/issue/poc/todo/add', { method: 'POST', body: params });
}

export async function apiPocTodoStatus(params: any) {
  return request('/api/issue/poc/todo/update-status', { method: 'POST', body: params });
}

export async function apiPocCommentAdd(params: any) {
  return request('/api/issue/poc/comment/add', { method: 'POST', body: params });
}

export async function apiProductOptions() {
  return request('/api/issue/products/query', { method: 'POST', body: { page: 1, pageSize: 1000 } });
}

export async function apiStaffActiveOptions() {
  return request('/api/issue/staffs/all-active', { method: 'GET' });
}
