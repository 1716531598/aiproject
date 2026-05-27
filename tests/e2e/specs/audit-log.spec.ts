import { test, expect } from '../fixtures/auth.fixture';
import { AuditLogPage } from '../pages/audit-log.page';

test.describe('审计日志页面', () => {
  let auditPage: AuditLogPage;

  test.beforeEach(async ({ adminPage }) => {
    auditPage = new AuditLogPage(adminPage);
    await auditPage.goto();
  });

  test('应显示审计日志表格', async () => {
    await expect(auditPage.getTable()).toBeVisible();
  });

  test('应显示日志条目', async ({ adminPage }) => {
    const rows = auditPage.getRows();
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('日志应包含正确列', async ({ adminPage }) => {
    const headers = adminPage.locator('.ant-table-thead th');
    await expect(headers.filter({ hasText: '操作人员' })).toBeVisible();
    await expect(headers.filter({ hasText: '操作类型' })).toBeVisible();
    await expect(headers.filter({ hasText: '操作IP' })).toBeVisible();
    await expect(headers.filter({ hasText: '日志内容' })).toBeVisible();
  });

  test('应显示登录类型的日志', async ({ adminPage }) => {
    const typeCells = adminPage.locator('.ant-table-row td').filter({ hasText: '登录' });
    await expect(typeCells.first()).toBeVisible({ timeout: 5000 });
  });

  test('日志应包含 IP 地址', async ({ adminPage }) => {
    const ipPattern = /\d+\.\d+\.\d+\.\d+/;
    const rows = auditPage.getRows();
    const firstRow = rows.first();
    await expect(firstRow).toBeVisible();
    const text = await firstRow.textContent();
    expect(text).toMatch(ipPattern);
  });

  test('分页器应可见', async ({ adminPage }) => {
    const pagination = adminPage.locator('.ant-pagination');
    await expect(pagination).toBeVisible({ timeout: 5000 });
  });

  test('日期范围筛选当天日志应返回结果', async ({ adminPage }) => {
    const today = new Date().toISOString().split('T')[0];
    const resp = await adminPage.evaluate(async (dateStr) => {
      const r = await fetch('/api/v1/audit-logs/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, pageSize: 10, createtime: `${dateStr}~${dateStr}` }),
      });
      return r.json();
    }, today);
    expect(resp.code).toBe(200);
    expect(resp.data.total).toBeGreaterThan(0);
  });
});
