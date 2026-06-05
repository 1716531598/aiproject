import request from '@ray/common/utils/request';
import signature from '@ray/common/utils/signature';

export async function apiStatisticOverview(params: any) {
  return request('/api/issue/statistics/overview', { method: 'POST', body: params });
}

export async function apiStatisticByProduct(params: any) {
  return request('/api/issue/statistics/by-product', { method: 'POST', body: params });
}

export async function apiStatisticByVersion(params: any) {
  return request('/api/issue/statistics/by-version', { method: 'POST', body: params });
}

export async function apiStatisticByResolver(params: any) {
  return request('/api/issue/statistics/by-resolver', { method: 'POST', body: params });
}

export async function apiStatisticByType(params: any) {
  return request('/api/issue/statistics/by-type', { method: 'POST', body: params });
}

export async function apiStatisticResolveTrend(params: any) {
  return request('/api/issue/statistics/resolve-trend', { method: 'POST', body: params });
}

export async function apiStatisticExport(params: any) {
  const url = '/api/issue/statistics/export';
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
    filename: filenameMatch ? decodeURIComponent(filenameMatch[1]) : '统计分析报表.xlsx',
  };
}
