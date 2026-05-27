import { Page, Locator } from '@playwright/test';

export class RoleManagementPage {
  readonly page: Page;
  readonly addButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.locator('button', { hasText: '新建' });
  }

  async goto() {
    await this.page.goto('/common/role');
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/roles/query')
    );
  }

  getTable(): Locator {
    return this.page.locator('.ant-pro-table .ant-table');
  }

  getRow(name: string): Locator {
    return this.page.locator('.ant-table-row').filter({ hasText: name });
  }

  getRowAction(name: string, action: string): Locator {
    return this.getRow(name).locator('a', { hasText: action });
  }

  getModal(): Locator {
    return this.page.locator('.ant-modal').filter({ hasText: '角色' }).first();
  }

  async addRole(name: string, checkKeys: string[]) {
    await this.addButton.click();
    await this.page.waitForSelector('.ant-modal');

    await this.page.locator('#name').fill(name);
    for (const key of checkKeys) {
      await this.page.locator('.ant-tree-treenode').filter({ hasText: new RegExp(key.replace('/', '\\/')) }).locator('.ant-tree-checkbox').click();
    }

    await this.page.locator('.ant-modal .ant-btn-primary').click();
  }

  async confirmModal() {
    const confirmBtn = this.page.locator('.ant-modal-confirm-btns .ant-btn-primary');
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    } else {
      await this.page.locator('.ant-popconfirm .ant-btn-primary').click();
    }
  }
}
