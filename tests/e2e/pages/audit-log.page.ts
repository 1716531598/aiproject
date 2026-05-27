import { Page, Locator } from '@playwright/test';

export class AuditLogPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/common/auditlog');
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/audit-logs/query')
    );
  }

  getTable(): Locator {
    return this.page.locator('.ant-pro-table .ant-table');
  }

  getRows(): Locator {
    return this.page.locator('.ant-table-row');
  }
}
