import { request } from '@umijs/max';
import issueRequest from '@ray/common/utils/request';
import type { AnalysisData } from './data';

export async function fakeChartData(): Promise<AnalysisData> {
  const resp = await request('/api/v1/dashboard/chart-data');
  return resp.data || resp;
}

export async function apiIssueMySummary(params: any = {}) {
  const resp = await issueRequest('/api/issue/statistics/my-summary', { method: 'POST', body: params });
  return resp?.data || {};
}

export async function apiIssueScoreRanking(params: any = {}) {
  const resp = await issueRequest('/api/issue/statistics/score-ranking', { method: 'POST', body: params });
  return resp?.data || [];
}

export async function apiTodoStatus(params: any) {
  return issueRequest('/api/issue/poc/todo/update-status', { method: 'POST', body: params });
}
