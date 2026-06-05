import request from '@ray/common/utils/request';

export async function apiSyncLogQuery(params: any) {
  return request('/api/issue/admin/sync-logs/query', { method: 'POST', body: params });
}

export async function apiSyncConfig() {
  return request('/api/issue/admin/sync/config', { method: 'GET' });
}

export async function apiSyncConfigSave(params: any) {
  return request('/api/issue/admin/sync/config', { method: 'POST', body: params });
}

export async function apiSyncTest(params: any) {
  return request('/api/issue/admin/sync/test', { method: 'POST', body: params });
}

export async function apiSyncTrigger(params: any) {
  return request('/api/issue/admin/sync/trigger', { method: 'POST', body: params || {} });
}
