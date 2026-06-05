import request from '@ray/common/utils/request';

export async function apiTodoQuery(params: any) {
  return request('/api/issue/poc/todo/query-all', { method: 'POST', body: params });
}

export async function apiTodoUpdate(params: any) {
  return request('/api/issue/poc/todo/update', { method: 'POST', body: params });
}

export async function apiTodoDelete(params: any) {
  return request('/api/issue/poc/todo/delete', { method: 'POST', body: params });
}

export async function apiStaffActiveOptions() {
  return request('/api/issue/staffs/all-active', { method: 'GET' });
}
