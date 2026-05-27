import { request } from '@umijs/max';
import type { AnalysisData } from './data';

export async function fakeChartData(): Promise<AnalysisData> {
  const resp = await request('/api/v1/dashboard/chart-data');
  return resp.data || resp;
}
