import request from '@ray/common/utils/request';

export async function apiRoleQuery() {
  return request('/api/v1/roles/query', {
    method: 'POST',
    body: {},
  });
}
export async function apiRoleAdd(params) {
  return request('/api/v1/roles/add', {
    method: 'POST',
    body: params,
  });
}
export async function apiRoleUpdate(params) {
  return request('/api/v1/roles/update', {
    method: 'POST',
    body: params,
  });
}
export async function apiRoleDelete(params) {
  return request('/api/v1/roles/delete', {
    method: 'POST',
    body: params,
  });
}
