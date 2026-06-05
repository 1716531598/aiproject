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
