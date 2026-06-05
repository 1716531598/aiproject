import request from '@ray/common/utils/request';

export async function apiEmailConfig() {
  return request('/api/issue/admin/email/config', { method: 'GET' });
}

export async function apiEmailConfigSave(params: any) {
  return request('/api/issue/admin/email/config', { method: 'POST', body: params });
}

export async function apiEmailTest(params: any) {
  return request('/api/issue/admin/email/test', { method: 'POST', body: params });
}

export async function apiEmailLogs() {
  return request('/api/issue/admin/email/logs', { method: 'GET' });
}
