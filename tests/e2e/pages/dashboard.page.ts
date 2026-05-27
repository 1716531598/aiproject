import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/common/dashboard');
    try {
      await this.page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/dashboard/chart-data') && resp.status() === 200,
        { timeout: 10000 }
      );
    } catch {
      // chart-data might have loaded before navigation
    }
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  getCard(title: string): Locator {
    return this.page.locator('.ant-card-head-title').filter({ hasText: title });
  }

  getTable(): Locator {
    return this.page.locator('.ant-table');
  }
}
