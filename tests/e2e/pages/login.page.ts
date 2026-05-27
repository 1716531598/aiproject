import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly captchaInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.captchaInput = page.locator('#imgCode');
    this.submitButton = page.locator('button.ant-btn-primary');
  }

  async goto() {
    await this.page.goto('/user/login');
    await this.page.waitForLoadState('networkidle');
  }

  async getCaptchaCodeByRefreshing(): Promise<string> {
    const responsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/auth/createcode')
    );
    const captchaImg = this.page.locator('img[src^="data:image"]');
    await captchaImg.click();
    const response = await responsePromise;
    const body = await response.json();
    return body.data?.code || '';
  }

  async login(username: string, password: string, captchaCode: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.captchaInput.fill(captchaCode);
    await this.submitButton.click();
  }
}
