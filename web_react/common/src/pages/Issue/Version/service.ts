import request from '@ray/common/utils/request';

export async function apiVersionQuery(params: any) {
  return request('/api/issue/versions/query', {
    method: 'POST',
    body: params,
  });
}

export async function apiVersionAdd(params: any) {
  return request('/api/issue/versions/add', {
    method: 'POST',
    body: params,
  });
}

export async function apiVersionUpdate(params: any) {
  return request('/api/issue/versions/update', {
    method: 'POST',
    body: params,
  });
}

export async function apiVersionDelete(params: any) {
  return request('/api/issue/versions/delete', {
    method: 'POST',
    body: params,
  });
}

export async function apiProductOptions() {
  return request('/api/issue/products/query', {
    method: 'POST',
    body: { page: 1, pageSize: 1000 },
  });
}
