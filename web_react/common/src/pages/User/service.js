import request from '@ray/common/utils/request';

export async function apiUserQuery(params) {
  return request(`/api/mock/user/query`, {
    method: 'POST',
    body: params,
  });
}
export async function apiUserMgrAdd(params) {
  return request('/api/v1/user/add', {
    method: 'POST',
    body: params,
  });
}
export async function apiUserMgrDelete(params) {
  return request('/api/mock/user/delete', {
    method: 'POST',
    body: params,
  });
}

export async function apiUserMgrUpdate(params) {
  return request('/api/v1/user/update', {
    method: 'POST',
    body: params,
  });
}
export async function apiUserMgRestpwd(params) {
  return request('/api/v1/user/resetpwd', {
    method: 'POST',
    body: params,
  });
}
