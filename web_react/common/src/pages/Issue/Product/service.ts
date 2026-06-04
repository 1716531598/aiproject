import request from '@ray/common/utils/request';

export async function apiProductQuery(params: any) {
  return request('/api/issue/products/query', {
    method: 'POST',
    body: params,
  });
}

export async function apiProductAdd(params: any) {
  return request('/api/issue/products/add', {
    method: 'POST',
    body: params,
  });
}

export async function apiProductUpdate(params: any) {
  return request('/api/issue/products/update', {
    method: 'POST',
    body: params,
  });
}

export async function apiProductDelete(params: any) {
  return request('/api/issue/products/delete', {
    method: 'POST',
    body: params,
  });
}

export async function apiProductMappingUpdate(params: any) {
  return request('/api/issue/products/mapping/update', {
    method: 'POST',
    body: params,
  });
}
