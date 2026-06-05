import request from '@ray/common/utils/request';

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
