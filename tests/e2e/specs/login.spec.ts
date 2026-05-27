import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/login.page';

test.describe('登录页面', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('应显示登录表单所有字段', async ({ page }) => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.captchaInput).toBeVisible();
    await expect(page.locator('input')).toHaveCount(4, { timeout: 5000 });
  });

  test('空字段提交应显示必填校验', async () => {
    await loginPage.submitButton.click();
    await expect(loginPage.page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 5000 });
  });

  test('错误验证码应提示错误', async () => {
    await loginPage.usernameInput.fill('admin');
    await loginPage.passwordInput.fill('Test@123');
    await loginPage.captchaInput.fill('XXXX');
    await loginPage.submitButton.click();
    await expect(loginPage.page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
  });

  test('错误密码应提示错误', async () => {
    const code = await loginPage.getCaptchaCodeByRefreshing();
    await loginPage.login('admin', 'WrongPassword1', code);
    await expect(loginPage.page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
  });

  test('admin 登录成功跳转仪表盘', async () => {
    const code = await loginPage.getCaptchaCodeByRefreshing();
    await loginPage.login('admin', 'Test@123', code);
    await expect(loginPage.page).toHaveURL(/\/common\/dashboard/, { timeout: 15000 });
  });

  test('user 角色登录成功', async () => {
    const code = await loginPage.getCaptchaCodeByRefreshing();
    await loginPage.login('user', 'Test@123', code);
    await expect(loginPage.page).toHaveURL(/\/common\/dashboard/, { timeout: 15000 });
  });

  test('未登录访问受保护页面应重定向到登录页', async ({ page }) => {
    await page.goto('/common/dashboard');
    await page.waitForURL(/\/user\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/user/login');
  });

  test('无验证码Cookie应提示错误', async ({ page }) => {
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Test@123', imgCode: '1234' }),
      });
      return r.json();
    });
    expect(resp.code).not.toBe(200);
    expect(resp.msg).toContain('验证码');
  });
});
