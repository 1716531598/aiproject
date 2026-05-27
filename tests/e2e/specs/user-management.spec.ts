import { test, expect } from '../fixtures/auth.fixture';
import { UserManagementPage } from '../pages/user-management.page';
import { loginAndGetSid, createTestUser, deleteTestUser, queryUsers } from '../helpers/api.helper';

test.describe('用户管理页面', () => {
  let userPage: UserManagementPage;
  let adminSid: string;

  test.beforeAll(async () => {
    adminSid = await loginAndGetSid('admin', 'Test@123');
  });

  test.beforeEach(async ({ adminPage }) => {
    userPage = new UserManagementPage(adminPage);
    await userPage.goto();
  });

  test('应显示用户管理表格', async () => {
    await expect(userPage.getTable()).toBeVisible();
    await expect(userPage.addButton).toBeVisible();
    await expect(userPage.refreshButton).toBeVisible();
  });

  test('应显示种子用户', async () => {
    await expect(userPage.getRow('admin')).toBeVisible({ timeout: 5000 });
    await expect(userPage.getRow('user')).toBeVisible({ timeout: 5000 });
    await expect(userPage.getRow('audit')).toBeVisible({ timeout: 5000 });
  });

  test('应能按用户名搜索', async ({ adminPage }) => {
    const searchInput = adminPage.locator('input[placeholder="请输入用户名"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('admin');
      await adminPage.keyboard.press('Enter');
      await adminPage.waitForTimeout(2000);
      const rows = adminPage.locator('.ant-table-row');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('应打开新增用户弹窗', async ({ adminPage }) => {
    await userPage.addButton.click();
    await expect(adminPage.locator('.ant-modal')).toBeVisible();
    await expect(adminPage.locator('#username')).toBeVisible();
  });

  test('应成功新增用户', async ({ adminPage }) => {
    await createTestUser(adminSid, {
      username: 'e2etest01',
      password: 'Test@12345',
      roleType: 2,
    });

    await userPage.refreshButton.click();
    await adminPage.waitForTimeout(2000);
    await expect(userPage.getRow('e2etest01')).toBeVisible({ timeout: 5000 });

    const resp = await queryUsers(adminSid, 'e2etest01');
    const body = await resp.json();
    if (body.data?.aaData?.[0]?.id) {
      await deleteTestUser(adminSid, body.data.aaData[0].id);
    }
  });

  test('用户名过短应显示校验错误', async ({ adminPage }) => {
    await userPage.addButton.click();
    await expect(adminPage.locator('.ant-modal')).toBeVisible();
    await adminPage.locator('#username').fill('ab');
    await adminPage.locator('#username').blur();
    await expect(adminPage.locator('.ant-form-item-explain-error')).toBeVisible({ timeout: 3000 });
  });

  test('编辑用户应调用update接口', async ({ adminPage }) => {
    const updatePromise = adminPage.waitForResponse(
      (resp) => resp.url().includes('/api/v1/users/update')
    );
    const editLink = userPage.getRowAction('user', '编辑');
    await editLink.click();
    await expect(adminPage.locator('.ant-modal')).toBeVisible({ timeout: 5000 });
    const timeoutInput = adminPage.locator('#timeout');
    await timeoutInput.clear();
    await timeoutInput.fill('45');
    await adminPage.locator('.ant-modal .ant-btn-primary').click();
    const updateResp = await updatePromise;
    const body = await updateResp.json();
    expect(body.code).toBe(200);
    // 恢复原值
    const restorePromise = adminPage.waitForResponse(
      (resp) => resp.url().includes('/api/v1/users/update')
    );
    await userPage.getRowAction('user', '编辑').click();
    await expect(adminPage.locator('.ant-modal')).toBeVisible({ timeout: 5000 });
    await adminPage.locator('#timeout').clear();
    await adminPage.locator('#timeout').fill('30');
    await adminPage.locator('.ant-modal .ant-btn-primary').click();
    await restorePromise;
  });

  test('应能删除用户', async ({ adminPage }) => {
    await createTestUser(adminSid, {
      username: 'e2edelete01',
      password: 'Test@12345',
      roleType: 2,
    });
    await userPage.refreshButton.click();
    await adminPage.waitForTimeout(2000);
    await expect(userPage.getRow('e2edelete01')).toBeVisible({ timeout: 5000 });

    await userPage.getRowAction('e2edelete01', '删除').click();
    await userPage.confirmModal();
    await adminPage.waitForTimeout(2000);
    const msg = adminPage.locator('.ant-message');
    await expect(msg).toBeVisible({ timeout: 5000 });
  });

  test('应能重置密码', async ({ adminPage }) => {
    const resetLink = userPage.getRowAction('user', '重置密码');
    await resetLink.click();
    // 验证确认弹窗显示正确的密码
    const confirmText = adminPage.locator('.ant-modal-confirm-content');
    await expect(confirmText).toContainText('Test@123');
    await userPage.confirmModal();
    const msg = adminPage.locator('.ant-message');
    await expect(msg).toBeVisible({ timeout: 5000 });
  });

  test('不能删除自己', async ({ adminPage }) => {
    await userPage.getRowAction('admin', '删除').click();
    await userPage.confirmModal();
    const msg = adminPage.locator('.ant-message');
    await expect(msg).toBeVisible({ timeout: 5000 });
  });
});
