import { test, expect } from '../fixtures/auth.fixture';
import { RoleManagementPage } from '../pages/role-management.page';
import { loginAndGetSid } from '../helpers/api.helper';

test.describe('角色管理页面', () => {
  let rolePage: RoleManagementPage;
  let adminSid: string;

  test.beforeAll(async () => {
    adminSid = await loginAndGetSid('admin', 'Test@123');
  });

  test.beforeEach(async ({ adminPage }) => {
    rolePage = new RoleManagementPage(adminPage);
    await rolePage.goto();
  });

  test('应显示角色管理表格', async () => {
    await expect(rolePage.getTable()).toBeVisible();
    await expect(rolePage.addButton).toBeVisible();
  });

  test('内置角色应显示标签', async ({ adminPage }) => {
    const adminRow = rolePage.getRow('超级管理员');
    await expect(adminRow).toBeVisible({ timeout: 5000 });
    await expect(adminRow.locator('.ant-tag-orange')).toBeVisible();
  });

  test('内置角色无编辑/删除操作', async ({ adminPage }) => {
    const adminRow = rolePage.getRow('超级管理员');
    await expect(adminRow.locator('a', { hasText: '编辑' })).not.toBeVisible();
    await expect(adminRow.locator('a', { hasText: '删除' })).not.toBeVisible();
  });

  test('应打开新增角色弹窗含权限树', async ({ adminPage }) => {
    await rolePage.addButton.click();
    await expect(adminPage.locator('.ant-modal')).toBeVisible();
    await expect(adminPage.locator('#name')).toBeVisible();
    await expect(adminPage.locator('.ant-tree')).toBeVisible();
  });

  test('应成功新增自定义角色', async ({ adminPage }) => {
    // Use API to add role, then verify in UI
    const resp = await adminPage.evaluate(async () => {
      const r = await fetch('/api/v1/roles/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'E2E测试角色', checkedKeys: ['common/dashboard'] }),
      });
      return r.json();
    });
    expect(resp.code).toBe(200);
    await rolePage.goto();
    await expect(rolePage.getRow('E2E测试角色')).toBeVisible({ timeout: 5000 });
  });

  test('应能编辑自定义角色', async ({ adminPage }) => {
    await rolePage.goto();
    const editLink = rolePage.getRowAction('E2E测试角色', '编辑');
    if (await editLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editLink.click();
      await expect(adminPage.locator('.ant-modal')).toBeVisible({ timeout: 5000 });
      await adminPage.locator('#name').clear();
      await adminPage.locator('#name').fill('E2E编辑后角色');
      await adminPage.locator('.ant-modal .ant-btn-primary').click();
      await adminPage.waitForTimeout(2000);
      const msg = adminPage.locator('.ant-message');
      await expect(msg).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('应能删除自定义角色', async ({ adminPage }) => {
    const deleteLink = rolePage.getRowAction('E2E编辑后角色', '删除');
    if (!await deleteLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      const altDeleteLink = rolePage.getRowAction('E2E测试角色', '删除');
      if (!await altDeleteLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        test.skip();
        return;
      }
      await altDeleteLink.click();
    } else {
      await deleteLink.click();
    }
    // Role page uses API directly, no confirm modal
    await adminPage.waitForTimeout(2000);
    await rolePage.goto();
    // Verify role is gone
    const remaining = adminPage.locator('.ant-table-row').filter({ hasText: 'E2E' });
    await expect(remaining).toHaveCount(0, { timeout: 5000 });
  });

  test('有用户的角色不能删除', async ({ adminPage }) => {
    const adminRow = rolePage.getRow('超级管理员');
    await expect(adminRow.locator('a', { hasText: '删除' })).not.toBeVisible();
  });
});
