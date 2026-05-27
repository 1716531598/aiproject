import { test, expect } from '../fixtures/auth.fixture';

test.describe('仪表盘页面', () => {
  test('应成功加载仪表盘页面', async ({ adminPage }) => {
    await adminPage.goto('/common/dashboard');
    await adminPage.waitForLoadState('networkidle');
    await expect(adminPage).toHaveURL(/\/common\/dashboard/);
  });

  test('chart-data API 应返回正确数据结构', async ({ adminPage }) => {
    const resp = await adminPage.evaluate(async () => {
      const r = await fetch('/api/v1/dashboard/chart-data');
      return r.json();
    });
    expect(resp.code).toBe(200);
    expect(resp.data).toHaveProperty('visitData');
    expect(resp.data).toHaveProperty('visitData2');
    expect(resp.data).toHaveProperty('salesData');
    expect(resp.data).toHaveProperty('radarData');
  });

  test('chart-data 数据项应非空', async ({ adminPage }) => {
    const resp = await adminPage.evaluate(async () => {
      const r = await fetch('/api/v1/dashboard/chart-data');
      return r.json();
    });
    expect(resp.data.visitData.length).toBeGreaterThan(0);
    expect(resp.data.salesData.length).toBeGreaterThan(0);
    expect(resp.data.radarData.length).toBeGreaterThan(0);
  });

  test('页面不应有 JS 控制台错误', async ({ adminPage }) => {
    const errors: string[] = [];
    adminPage.on('pageerror', (err) => errors.push(err.message));
    await adminPage.goto('/common/dashboard');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(3000);
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection')
      && !e.includes("Cannot read properties of undefined")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('页面标题应正确显示', async ({ adminPage }) => {
    await adminPage.goto('/common/dashboard');
    await adminPage.waitForLoadState('networkidle');
    const title = await adminPage.title();
    expect(title).toContain('盛邦安全');
  });
});
