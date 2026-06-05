import request from '@ray/common/utils/request';

export async function apiAssessmentQuery(params: any) {
  return request('/api/issue/admin/assessment/query', { method: 'POST', body: params });
}

export async function apiAssessmentAdd(params: any) {
  return request('/api/issue/admin/assessment/add', { method: 'POST', body: params });
}

export async function apiAssessmentRemove(params: any) {
  return request('/api/issue/admin/assessment/remove', { method: 'POST', body: params });
}

export async function apiProductOptions() {
  return request('/api/issue/products/query', { method: 'POST', body: { page: 1, pageSize: 1000 } });
}

export async function apiVersionByProduct(product_id: number) {
  return request('/api/issue/versions/by-product', { method: 'POST', body: { product_id } });
}
