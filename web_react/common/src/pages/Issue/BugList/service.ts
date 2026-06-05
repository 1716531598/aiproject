import request from '@ray/common/utils/request';
import signature from '@ray/common/utils/signature';

export async function apiBugQuery(params: any) {
  return request('/api/issue/bugs/query', { method: 'POST', body: params });
}

export async function apiProductOptions() {
  return request('/api/issue/products/query', { method: 'POST', body: { page: 1, pageSize: 1000 } });
}

export async function apiIssueTypeOptions() {
  return request('/api/issue/admin/types/query', { method: 'POST', body: { page: 1, pageSize: 1000, status: '启用' } });
}

export async function apiBugDetail(params: any) {
  return request('/api/issue/bugs/detail', { method: 'POST', body: params });
}

export async function apiBugUpdateExt(params: any) {
  return request('/api/issue/bugs/update-ext', { method: 'POST', body: params });
}

export async function apiBugCommentAdd(params: any) {
  return request('/api/issue/bugs/comment/add', { method: 'POST', body: params });
}

export async function apiBugCommentList(params: any) {
  return request('/api/issue/bugs/comment/list', { method: 'POST', body: params });
}

export async function apiBugHistory(params: any) {
  return request('/api/issue/bugs/history', { method: 'POST', body: params });
}

export async function apiModuleByProduct(product_id: number) {
  return request('/api/issue/modules/by-product', { method: 'POST', body: { product_id } });
}

export async function apiVersionByProduct(product_id: number) {
  return request('/api/issue/versions/by-product', { method: 'POST', body: { product_id } });
}

export async function apiStaffActiveOptions() {
  return request('/api/issue/staffs/all-active', { method: 'GET' });
}

export async function apiBugBatchAssign(params: any) {
  return request('/api/issue/bugs/batch-assign', { method: 'POST', body: params });
}

export async function apiBugExport(params: any) {
  const url = '/api/issue/bugs/export';
  const option: any = signature({ url, method: 'POST', body: params || {} });
  const response = await fetch(url, option);
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || contentType.includes('application/json')) {
    const body = contentType.includes('application/json') ? await response.json() : {};
    throw new Error(body?.msg || '导出失败');
  }
  const disposition = response.headers.get('content-disposition') || '';
  const filenameMatch = disposition.match(/filename\*=UTF-8''(.+)$/);
  return {
    blob: await response.blob(),
    filename: filenameMatch ? decodeURIComponent(filenameMatch[1]) : '网上问题报表.xlsx',
  };
}
