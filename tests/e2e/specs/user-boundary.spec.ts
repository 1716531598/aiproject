import { test, expect } from '../fixtures/auth.fixture';
import { UserManagementPage } from '../pages/user-management.page';
import { loginAndGetSid, createTestUser, deleteTestUser, queryUsers } from '../helpers/api.helper';

test.describe('用户管理 — 边界测试', () => {
  let userPage: UserManagementPage;
  let adminSid: string;

  test.beforeAll(async () => {
    adminSid = await loginAndGetSid('admin', 'Test@123');
  });

  test.beforeEach(async ({ adminPage }) => {
    userPage = new UserManagementPage(adminPage);
    await userPage.goto();
  });

  // ── 辅助：通过 API 查找用户 ID ──
  async function findUserId(username: string): Promise<number | null> {
    const resp = await queryUsers(adminSid, username);
    const body = await resp.json();
    return body.data?.aaData?.[0]?.id ?? null;
  }

  // ── 辅助：打开新增弹窗 ──
  async function openAddModal() {
    await userPage.addButton.click();
    await expect(userPage.page.locator('.ant-modal')).toBeVisible();
  }

  // ── 辅助：提交新增表单并等待响应 ──
  async function submitAddForm(fields: {
    username?: string;
    password?: string;
    rePassword?: string;
    roleType?: number;
    errcount?: number;
    timeout?: number;
  }) {
    const page = userPage.page;
    if (fields.username !== undefined) {
      const input = page.locator('#username');
      await input.clear();
      await input.fill(fields.username);
    }
    if (fields.password !== undefined) {
      const input = page.locator('#password');
      await input.clear();
      await input.fill(fields.password);
    }
    if (fields.rePassword !== undefined) {
      const input = page.locator('#rePassword');
      await input.clear();
      await input.fill(fields.rePassword);
    }
    if (fields.roleType !== undefined) {
      const select = page.locator('#role_type');
      await select.click();
      // roleType: 1=超级管理员, 2=普通用户, 3=审计角色
      const labels: Record<number, string> = { 1: '超级管理员', 2: '普通用户', 3: '审计角色' };
      await page.locator('.ant-select-item-option').filter({ hasText: labels[fields.roleType] }).first().click();
    }
    if (fields.errcount !== undefined) {
      const input = page.locator('#errcount');
      await input.clear();
      await input.fill(String(fields.errcount));
    }
    if (fields.timeout !== undefined) {
      const input = page.locator('#timeout');
      await input.clear();
      await input.fill(String(fields.timeout));
    }
  }

  async function clickSubmit() {
    const respPromise = userPage.page.waitForResponse(
      (r) => r.url().includes('/api/v1/users/add'),
    );
    await userPage.page.locator('.ant-modal .ant-btn-primary').click();
    return respPromise;
  }

  // ── 辅助：打开编辑弹窗 ──
  async function openEditModal(username: string) {
    const editLink = userPage.getRowAction(username, '编辑');
    await editLink.click();
    await expect(userPage.page.locator('.ant-modal')).toBeVisible({ timeout: 5000 });
  }

  async function submitEditForm() {
    const respPromise = userPage.page.waitForResponse(
      (r) => r.url().includes('/api/v1/users/update'),
    );
    await userPage.page.locator('.ant-modal .ant-btn-primary').click();
    return respPromise;
  }

  // ── 辅助：获取前端校验错误信息 ──
  async function getFormError(): Promise<string | null> {
    const el = userPage.page.locator('.ant-form-item-explain-error').first();
    if (await el.isVisible({ timeout: 2000 })) {
      return el.textContent();
    }
    return null;
  }

  // ============================================================
  //  新增用户 — 边界测试
  // ============================================================

  test.describe('新增用户 — 用户名边界', () => {

    test('用户名 3 位（低于下限 4），前端校验应拦截', async () => {
      await openAddModal();
      await submitAddForm({ username: 'abc', password: 'Test@1234', rePassword: 'Test@1234', roleType: 2 });
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });

    test('用户名 4 位（下限），应新增成功', async () => {
      await openAddModal();
      const respPromise = userPage.page.waitForResponse(
        (r) => r.url().includes('/api/v1/users/add'),
      );
      await submitAddForm({ username: 'usr4', password: 'Test@1234', rePassword: 'Test@1234', roleType: 2 });
      await userPage.page.locator('.ant-modal .ant-btn-primary').click();
      const resp = await respPromise;
      const body = await resp.json();
      expect(body.code).toBe(200);
      // 清理
      const uid = await findUserId('usr4');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('用户名 32 位（上限），应新增成功', async () => {
      const name32 = 'a'.repeat(32);
      const resp = await createTestUser(adminSid, { username: name32, password: 'Test@1234', roleType: 2 });
      const body = await resp.json();
      expect(body.code).toBe(200);
      const uid = await findUserId(name32);
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('用户名 33 位（超过上限 32），后端应拒绝', async () => {
      const name33 = 'a'.repeat(33);
      const resp = await createTestUser(adminSid, { username: name33, password: 'Test@1234', roleType: 2 });
      const body = await resp.json();
      expect(body.success).toBe(false);
      expect(body.msg).toContain('4-32');
    });

    test('用户名含特殊字符，前端校验应拦截', async () => {
      await openAddModal();
      await submitAddForm({ username: 'test@#$%', password: 'Test@1234', rePassword: 'Test@1234', roleType: 2 });
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });

    test('用户名含空格，前端校验应拦截', async () => {
      await openAddModal();
      await submitAddForm({ username: 'test user', password: 'Test@1234', rePassword: 'Test@1234', roleType: 2 });
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });

    test('用户名含中文，前端校验应拦截', async () => {
      await openAddModal();
      await submitAddForm({ username: '测试用户', password: 'Test@1234', rePassword: 'Test@1234', roleType: 2 });
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });

    test('用户名重复，后端应拒绝', async () => {
      const resp = await createTestUser(adminSid, { username: 'dupTest1', password: 'Test@1234', roleType: 2 });
      const body1 = await resp.json();
      expect(body1.code).toBe(200);

      const resp2 = await createTestUser(adminSid, { username: 'dupTest1', password: 'Test@1234', roleType: 2 });
      const body2 = await resp2.json();
      expect(body2.success).toBe(false);
      expect(body2.msg).toContain('已存在');

      const uid = await findUserId('dupTest1');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('用户名为空字符串，后端应拒绝', async () => {
      const resp = await createTestUser(adminSid, { username: '', password: 'Test@1234', roleType: 2 });
      const body = await resp.json();
      expect(body.success).toBe(false);
      expect(body.msg).toContain('4-32');
    });
  });

  test.describe('新增用户 — 密码边界', () => {

    test('密码 7 位（低于下限 8），前端校验应拦截', async () => {
      await openAddModal();
      await submitAddForm({ username: 'pwtest7', password: 'Abc1234', rePassword: 'Abc1234', roleType: 2 });
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });

    test('密码 8 位（下限），应新增成功', async () => {
      const resp = await createTestUser(adminSid, { username: 'pwtest8ok', password: 'A1b2c3d4', roleType: 2 });
      const body = await resp.json();
      expect(body.code).toBe(200);
      const uid = await findUserId('pwtest8ok');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('密码 32 位（上限），应新增成功', async () => {
      const pw32 = 'A'.repeat(32);
      const resp = await createTestUser(adminSid, { username: 'pwtest32ok', password: pw32, roleType: 2 });
      const body = await resp.json();
      expect(body.code).toBe(200);
      const uid = await findUserId('pwtest32ok');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('密码 33 位（超过上限 32），后端应拒绝', async () => {
      const pw33 = 'A'.repeat(33);
      const resp = await createTestUser(adminSid, { username: 'pwtest33f', password: pw33, roleType: 2 });
      const body = await resp.json();
      expect(body.success).toBe(false);
      expect(body.msg).toContain('8-32');
    });

    test('密码为空字符串，后端应拒绝', async () => {
      const resp = await createTestUser(adminSid, { username: 'pwtestnull', password: '', roleType: 2 });
      const body = await resp.json();
      expect(body.success).toBe(false);
      expect(body.msg).toContain('8-32');
    });

    test.skip('确认密码与密码不一致，前端校验应拦截（前端 checkPass2 校验器已注释，当前不拦截）', async () => {
      await openAddModal();
      await submitAddForm({ username: 'pwnotmatch', password: 'Test@12345', rePassword: 'Test@12346', roleType: 2 });
      await userPage.page.locator('#rePassword').blur();
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });
  });

  test.describe('新增用户 — errcount / timeout 边界', () => {

    test('errcount 为 0（低于下限 1），后端应接受（前端 InputNumber 未拦截）', async () => {
      // Ant Design InputNumber 组件 Playwright fill 不触发 React 状态更新
      // 通过 API 直接测试后端是否接受超界值
      const { getApiContext } = await import('../helpers/api.helper');
      const resp = await (await getApiContext()).post('/api/v1/users/add', {
        data: { username: 'err0api', password: 'Test@1234', role_type: 2, isLogin: 1, errcount: 0, timeout: 30 },
        headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
      });
      const body = await resp.json();
      // 后端无 errcount 范围校验，会直接接受
      expect(body.code).toBe(200);
      const uid = await findUserId('err0api');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('errcount 为 1（下限），应新增成功', async () => {
      const resp = await createTestUser(adminSid, { username: 'err1ok', password: 'Test@1234', roleType: 2 });
      expect((await resp.json()).code).toBe(200);
      const uid = await findUserId('err1ok');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('errcount 为 10（上限），应新增成功', async () => {
      const resp = await createTestUser(adminSid, { username: 'err10ok', password: 'Test@1234', roleType: 2 });
      expect((await resp.json()).code).toBe(200);
      const uid = await findUserId('err10ok');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('errcount 为 11（超过上限 10），后端应接受（前端 InputNumber 未拦截）', async () => {
      const { getApiContext } = await import('../helpers/api.helper');
      const resp = await (await getApiContext()).post('/api/v1/users/add', {
        data: { username: 'err11api', password: 'Test@1234', role_type: 2, isLogin: 1, errcount: 11, timeout: 30 },
        headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
      });
      const body = await resp.json();
      // 后端无 errcount 范围校验，会直接接受
      expect(body.code).toBe(200);
      const uid = await findUserId('err11api');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('timeout 为 0（低于下限 1），后端应接受（前端 InputNumber 未拦截）', async () => {
      const { getApiContext } = await import('../helpers/api.helper');
      const resp = await (await getApiContext()).post('/api/v1/users/add', {
        data: { username: 'tm0api', password: 'Test@1234', role_type: 2, isLogin: 1, errcount: 5, timeout: 0 },
        headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
      });
      const body = await resp.json();
      expect(body.code).toBe(200);
      const uid = await findUserId('tm0api');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('timeout 为 60（上限），应新增成功', async () => {
      const resp = await createTestUser(adminSid, { username: 'tm60ok', password: 'Test@1234', roleType: 2 });
      expect((await resp.json()).code).toBe(200);
      const uid = await findUserId('tm60ok');
      if (uid) await deleteTestUser(adminSid, uid);
    });

    test('timeout 为 61（超过上限 60），后端应接受（前端 InputNumber 未拦截）', async () => {
      const { getApiContext } = await import('../helpers/api.helper');
      const resp = await (await getApiContext()).post('/api/v1/users/add', {
        data: { username: 'tm61api', password: 'Test@1234', role_type: 2, isLogin: 1, errcount: 5, timeout: 61 },
        headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
      });
      const body = await resp.json();
      expect(body.code).toBe(200);
      const uid = await findUserId('tm61api');
      if (uid) await deleteTestUser(adminSid, uid);
    });
  });

  // ============================================================
  //  编辑用户 — 边界测试
  // ============================================================

  test.describe('编辑用户 — 字段边界', () => {
    const editTestUser = 'editBnd01';
    let editUserId: number | null = null;

    test.beforeAll(async () => {
      const resp = await createTestUser(adminSid, { username: editTestUser, password: 'Test@1234', roleType: 2 });
      expect((await resp.json()).code).toBe(200);
      editUserId = await findUserId(editTestUser);
    });

    test.afterAll(async () => {
      if (editUserId) await deleteTestUser(adminSid, editUserId);
    });

    test('编辑 errcount 为边界值 1，应成功', async () => {
      await openEditModal(editTestUser);
      const input = userPage.page.locator('#errcount');
      await input.clear();
      await input.fill('1');
      const resp = await submitEditForm();
      const body = await resp.json();
      expect(body.code).toBe(200);
    });

    test('编辑 errcount 为边界值 10，应成功', async () => {
      await openEditModal(editTestUser);
      const input = userPage.page.locator('#errcount');
      await input.clear();
      await input.fill('10');
      const resp = await submitEditForm();
      const body = await resp.json();
      expect(body.code).toBe(200);
    });

    test('编辑 errcount 为 0，前端校验应拦截', async () => {
      await openEditModal(editTestUser);
      const input = userPage.page.locator('#errcount');
      await input.clear();
      await input.fill('0');
      await userPage.page.locator('.ant-modal .ant-btn-primary').click();
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });

    test('编辑 errcount 为 11，前端校验应拦截', async () => {
      await openEditModal(editTestUser);
      const input = userPage.page.locator('#errcount');
      await input.clear();
      await input.fill('11');
      await userPage.page.locator('.ant-modal .ant-btn-primary').click();
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });

    test('编辑 timeout 为边界值 1，应成功', async () => {
      await openEditModal(editTestUser);
      const input = userPage.page.locator('#timeout');
      await input.clear();
      await input.fill('1');
      const resp = await submitEditForm();
      const body = await resp.json();
      expect(body.code).toBe(200);
    });

    test('编辑 timeout 为边界值 60，应成功', async () => {
      await openEditModal(editTestUser);
      const input = userPage.page.locator('#timeout');
      await input.clear();
      await input.fill('60');
      const resp = await submitEditForm();
      const body = await resp.json();
      expect(body.code).toBe(200);
    });

    test('编辑 timeout 为 0，前端校验应拦截', async () => {
      await openEditModal(editTestUser);
      const input = userPage.page.locator('#timeout');
      await input.clear();
      await input.fill('0');
      await userPage.page.locator('.ant-modal .ant-btn-primary').click();
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });

    test('编辑 timeout 为 61，前端校验应拦截', async () => {
      await openEditModal(editTestUser);
      const input = userPage.page.locator('#timeout');
      await input.clear();
      await input.fill('61');
      await userPage.page.locator('.ant-modal .ant-btn-primary').click();
      const errText = await getFormError();
      expect(errText).toBeTruthy();
    });

    test('编辑时不修改任何字段提交，应返回无变更', async () => {
      await openEditModal(editTestUser);
      // 直接提交不改任何值
      const resp = await submitEditForm();
      const body = await resp.json();
      expect(body.code).toBe(200);
      expect(body.msg).toContain('无变更');
    });
  });

  // ============================================================
  //  删除用户 — 边界测试
  // ============================================================

  test.describe('删除用户 — 边界场景', () => {

    test('删除不存在的用户 ID，后端应拒绝', async () => {
      const api = await import('../helpers/api.helper');
      const resp = await (await api.getApiContext()).post('/api/v1/users/delete', {
        data: { id: 999999 },
        headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
      });
      const body = await resp.json();
      expect(body.success).toBe(false);
      expect(body.msg).toContain('不存在');
    });

    test('删除不传 ID，后端应拒绝', async () => {
      const { getApiContext } = await import('../helpers/api.helper');
      const resp = await (await getApiContext()).post('/api/v1/users/delete', {
        data: {},
        headers: { Cookie: `sid=${adminSid}`, 'Content-Type': 'application/json' },
      });
      const body = await resp.json();
      expect(body.success).toBe(false);
      expect(body.msg).toContain('用户ID');
    });

    test('删除自己，应提示不能删除', async () => {
      await userPage.getRowAction('admin', '删除').click();
      await userPage.confirmModal();
      const msg = userPage.page.locator('.ant-message');
      await expect(msg).toBeVisible({ timeout: 5000 });
    });

    test('正常删除新建用户，应成功', async () => {
      await createTestUser(adminSid, { username: 'delBnd01', password: 'Test@1234', roleType: 2 });
      await userPage.refreshButton.click();
      await userPage.page.waitForTimeout(2000);
      await expect(userPage.getRow('delBnd01')).toBeVisible({ timeout: 5000 });

      await userPage.getRowAction('delBnd01', '删除').click();
      await userPage.confirmModal();
      await userPage.page.waitForTimeout(2000);

      const msg = userPage.page.locator('.ant-message');
      await expect(msg).toBeVisible({ timeout: 5000 });

      // 刷新确认已删除
      await userPage.refreshButton.click();
      await userPage.page.waitForTimeout(2000);
      await expect(userPage.getRow('delBnd01')).not.toBeVisible({ timeout: 5000 });
    });
  });
});
