import request from '@ray/common/utils/request';

export async function apiModuleQuery(params: any) {
  return request('/api/issue/modules/query', {
    method: 'POST',
    body: params,
  });
}

export async function apiModuleAdd(params: any) {
  return request('/api/issue/modules/add', {
    method: 'POST',
    body: params,
  });
}

export async function apiModuleUpdate(params: any) {
  return request('/api/issue/modules/update', {
    method: 'POST',
    body: params,
  });
}

export async function apiModuleDelete(params: any) {
  return request('/api/issue/modules/delete', {
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
