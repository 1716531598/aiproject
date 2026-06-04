import request from '@ray/common/utils/request';

export async function apiStaffQuery(params: any) {
  return request('/api/issue/staffs/query', {
    method: 'POST',
    body: params,
  });
}

export async function apiStaffAdd(params: any) {
  return request('/api/issue/staffs/add', {
    method: 'POST',
    body: params,
  });
}

export async function apiStaffUpdate(params: any) {
  return request('/api/issue/staffs/update', {
    method: 'POST',
    body: params,
  });
}

export async function apiStaffDelete(params: any) {
  return request('/api/issue/staffs/delete', {
    method: 'POST',
    body: params,
  });
}

export async function apiStaffActiveOptions() {
  return request('/api/issue/staffs/all-active', {
    method: 'GET',
  });
}

export async function apiUserOptions() {
  return request('/api/v1/users/query', {
    method: 'POST',
    body: { page: 1, pageSize: 1000 },
  });
}
