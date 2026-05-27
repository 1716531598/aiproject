import { request, APIRequestContext } from '@playwright/test';

let _context: APIRequestContext;

export async function getApiContext(): Promise<APIRequestContext> {
  if (!_context) {
    _context = await request.newContext({ baseURL: 'http://localhost:888' });
  }
  return _context;
}

export async function loginAndGetSid(username: string, password: string): Promise<string> {
  const api = await getApiContext();
  const captchaResp = await api.post('/api/v1/auth/createcode');
  const captchaBody = await captchaResp.json();
  const tempSid = captchaResp.headers()['set-cookie']?.match(/temp_sid=([^;]+)/)?.[1];

  const loginResp = await api.post('/api/v1/auth/login', {
    data: { username, password, imgCode: captchaBody.data?.code },
    headers: { Cookie: `temp_sid=${tempSid}`, 'Content-Type': 'application/json' },
  });
  const loginBody = await loginResp.json();
  return loginResp.headers()['set-cookie']?.match(/sid=([^;]+)/)?.[1] || '';
}

export async function createTestUser(adminSid: string, params: {
  username: string; password: string; roleType: number;
}) {
  const api = await getApiContext();
  return api.post('/api/v1/users/add', {
    data: {
      username: params.username,
      password: params.password,
      role_type: params.roleType,
      isLogin: 1,
      errcount: 5,
      timeout: 30,
    },
    headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
  });
}

export async function deleteTestUser(adminSid: string, userId: number) {
  const api = await getApiContext();
  return api.post('/api/v1/users/delete', {
    data: { id: userId },
    headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
  });
}

export async function queryUsers(adminSid: string, search?: string) {
  const api = await getApiContext();
  return api.post('/api/v1/users/query', {
    data: { page: 1, pageSize: 50, sSearch: search || '' },
    headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
  });
}

export async function createTestRole(adminSid: string, name: string, checkedKeys: string[]) {
  const api = await getApiContext();
  return api.post('/api/v1/roles/add', {
    data: { name, checkedKeys },
    headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
  });
}

export async function deleteTestRole(adminSid: string, roleId: number) {
  const api = await getApiContext();
  return api.post('/api/v1/roles/delete', {
    data: { id: roleId },
    headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
  });
}
