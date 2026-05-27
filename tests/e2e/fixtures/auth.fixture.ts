import { test as base, expect, request } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: import('@playwright/test').Page;
  adminPage: import('@playwright/test').Page;
  userPage: import('@playwright/test').Page;
  auditPage: import('@playwright/test').Page;
  adminSid: string;
};

async function loginViaApi(username: string, password: string) {
  const apiContext = await request.newContext({ baseURL: 'http://localhost:888' });

  const captchaResp = await apiContext.post('/api/v1/auth/createcode');
  const captchaBody = await captchaResp.json();
  const tempSid = captchaResp.headers()['set-cookie']?.match(/temp_sid=([^;]+)/)?.[1];
  const captchaCode = captchaBody.data?.code;

  if (!captchaCode) {
    await apiContext.dispose();
    throw new Error('验证码未返回。请确保 E2E_MODE=true 已设置。');
  }

  const loginResp = await apiContext.post('/api/v1/auth/login', {
    data: { username, password, imgCode: captchaCode },
    headers: {
      Cookie: `temp_sid=${tempSid}`,
      'Content-Type': 'application/json',
    },
  });
  const loginBody = await loginResp.json();
  expect(loginBody.code).toBe(200);

  const sid = loginResp.headers()['set-cookie']?.match(/sid=([^;]+)/)?.[1];
  await apiContext.dispose();
  return { sid, access: loginBody.data?.access };
}

async function createAuthenticatedPage(browser: import('@playwright/test').Browser, username: string, password: string) {
  const { sid } = await loginViaApi(username, password);
  const context = await browser.newContext();
  await context.addCookies([{
    name: 'sid',
    value: sid!,
    domain: 'localhost',
    path: '/',
  }]);
  const page = await context.newPage();
  await page.goto('/common/dashboard');
  await page.waitForLoadState('networkidle');
  return { page, context, sid: sid! };
}

export const test = base.extend<AuthFixtures>({
  adminSid: async ({ browser }, use) => {
    const { sid, context } = await createAuthenticatedPage(browser, 'admin', 'Test@123');
    await use(sid);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const { page, context } = await createAuthenticatedPage(browser, 'admin', 'Test@123');
    await use(page);
    await context.close();
  },

  userPage: async ({ browser }, use) => {
    const { page, context } = await createAuthenticatedPage(browser, 'user', 'Test@123');
    await use(page);
    await context.close();
  },

  auditPage: async ({ browser }, use) => {
    const { page, context } = await createAuthenticatedPage(browser, 'audit', 'Test@123');
    await use(page);
    await context.close();
  },

  authenticatedPage: async ({ adminPage }, use) => {
    await use(adminPage);
  },
});

export { expect };
