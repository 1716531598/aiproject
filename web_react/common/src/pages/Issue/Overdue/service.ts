import request from '@ray/common/utils/request';
import signature from '@ray/common/utils/signature';

export async function apiOverdueQuery(params: any) {
  return request('/api/issue/statistics/overdue', { method: 'POST', body: params || {} });
}

export async function apiOverdueAnalysisSave(params: any) {
  return request('/api/issue/statistics/overdue/analysis', { method: 'POST', body: params });
}

export async function apiOverdueExport(params: any) {
  const url = '/api/issue/statistics/overdue/export';
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
    filename: filenameMatch ? decodeURIComponent(filenameMatch[1]) : '超期问题汇总.xlsx',
  };
}
