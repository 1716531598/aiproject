import request from '@ray/common/utils/request';

export async function apiUserQuery(params) {
  return request(`/api/v1/users/query`, {
    method: 'POST',
    body: params,
  });
}
export async function apiUserMgrAdd(params) {
  return request('/api/v1/users/add', {
    method: 'POST',
    body: params,
  });
}
export async function apiUserMgrDelete(params) {
  return request('/api/v1/users/delete', {
    method: 'POST',
    body: params,
  });
}

export async function apiUserMgrUpdate(params) {
  return request('/api/v1/users/update', {
    method: 'POST',
    body: params,
  });
}
export async function apiUserMgRestpwd(params) {
  return request('/api/v1/users/reset-password', {
    method: 'POST',
    body: params,
  });
}
