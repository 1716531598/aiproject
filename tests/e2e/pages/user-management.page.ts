import { Page, Locator } from '@playwright/test';

export class UserManagementPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.locator('button', { hasText: '新建' });
    this.refreshButton = page.locator('button', { hasText: '刷新' });
  }

  async goto() {
    await this.page.goto('/common/user/management');
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/users/query')
    );
  }

  getTable(): Locator {
    return this.page.locator('.ant-pro-table .ant-table');
  }

  getRow(username: string): Locator {
    return this.page.locator('.ant-table-row').filter({ hasText: new RegExp(`^${username}`) });
  }

  getRowAction(username: string, action: string): Locator {
    const row = this.getRow(username);
    return row.locator('a', { hasText: action });
  }

  getModal(): Locator {
    return this.page.locator('.ant-modal').filter({ hasText: '用户' }).first();
  }

  async addUser(params: {
    username: string; password: string; roleType: number;
  }) {
    await this.addButton.click();
    await this.page.waitForSelector('.ant-modal');

    await this.page.locator('#username').fill(params.username);
    await this.page.locator('#password').fill(params.password);
    await this.page.locator('#rePassword').fill(params.password);
    await this.page.locator('.ant-select').first().click();
    await this.page.locator('.ant-select-item-option').filter({ hasText: String(params.roleType) }).first().click();

    await this.page.locator('.ant-modal .ant-btn-primary').click();
  }

  async confirmModal() {
    await this.page.locator('.ant-modal-confirm-btns .ant-btn-primary').click();
  }
}
