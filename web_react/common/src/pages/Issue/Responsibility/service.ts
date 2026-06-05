import request from '@ray/common/utils/request';
import signature from '@ray/common/utils/signature';

export async function apiResponsibilityList(params: any) {
  return request('/api/issue/responsibilities/list', { method: 'POST', body: params });
}

export async function apiResponsibilitySave(params: any) {
  return request('/api/issue/responsibilities/save', { method: 'POST', body: params });
}

export async function apiResponsibilityScore(params: any) {
  return request('/api/issue/responsibilities/score/query', { method: 'POST', body: params });
}

export async function apiStaffActiveOptions() {
  return request('/api/issue/staffs/all-active', { method: 'GET' });
}

export async function apiProductOptions() {
  return request('/api/issue/products/query', { method: 'POST', body: { page: 1, pageSize: 1000 } });
}

export async function apiResponsibilityExport(params: any) {
  const url = '/api/issue/responsibilities/export';
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
    filename: filenameMatch ? decodeURIComponent(filenameMatch[1]) : '责任分配报表.xlsx',
  };
}
