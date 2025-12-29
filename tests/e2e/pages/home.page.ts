/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Page Object Model for Home Page
 * Provides reusable methods for interacting with the landing page
 */

import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly urlInput: Locator;
  readonly startAuditButton: Locator;
  readonly advancedOptionsToggle: Locator;
  readonly concurrencyInput: Locator;
  readonly maxDepthInput: Locator;
  readonly maxPagesInput: Locator;
  readonly timeoutInput: Locator;
  readonly respectRobotsTxtCheckbox: Locator;
  readonly settingsButton: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.urlInput = page.getByLabel(/website url/i);
    this.startAuditButton = page.getByRole('button', { name: /start audit/i });
    this.advancedOptionsToggle = page.getByRole('button', {
      name: /(show|hide) advanced options/i,
    });
    this.concurrencyInput = page.getByLabel(/concurrency/i);
    this.maxDepthInput = page.getByLabel(/max depth/i);
    this.maxPagesInput = page.getByLabel(/max pages/i);
    this.timeoutInput = page.getByLabel(/timeout/i);
    this.respectRobotsTxtCheckbox = page.getByLabel(/respect robots\.txt/i);
    this.settingsButton = page.getByRole('button', { name: /settings/i });
    this.themeToggle = page.getByRole('button', { name: /toggle theme/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async enterUrl(url: string) {
    await this.urlInput.fill(url);
  }

  async startAudit(
    url: string,
    options?: {
      concurrency?: number;
      maxDepth?: number;
      maxPages?: number;
      timeout?: number;
      respectRobotsTxt?: boolean;
    }
  ) {
    await this.enterUrl(url);

    if (options) {
      // Show advanced options if any are specified
      await this.showAdvancedOptions();

      if (options.concurrency !== undefined) {
        await this.concurrencyInput.clear();
        await this.concurrencyInput.fill(options.concurrency.toString());
      }

      if (options.maxDepth !== undefined) {
        await this.maxDepthInput.clear();
        await this.maxDepthInput.fill(options.maxDepth.toString());
      }

      if (options.maxPages !== undefined) {
        await this.maxPagesInput.clear();
        await this.maxPagesInput.fill(options.maxPages.toString());
      }

      if (options.timeout !== undefined) {
        await this.timeoutInput.clear();
        await this.timeoutInput.fill(options.timeout.toString());
      }

      if (options.respectRobotsTxt !== undefined) {
        const isChecked = await this.respectRobotsTxtCheckbox.isChecked();
        if (isChecked !== options.respectRobotsTxt) {
          await this.respectRobotsTxtCheckbox.click();
        }
      }
    }

    await this.startAuditButton.click();
  }

  async showAdvancedOptions() {
    const text = await this.advancedOptionsToggle.textContent();
    if (text?.toLowerCase().includes('show')) {
      await this.advancedOptionsToggle.click();
    }
  }

  async hideAdvancedOptions() {
    const text = await this.advancedOptionsToggle.textContent();
    if (text?.toLowerCase().includes('hide')) {
      await this.advancedOptionsToggle.click();
    }
  }

  async openSettings() {
    await this.settingsButton.click();
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async isAuditButtonDisabled(): Promise<boolean> {
    return await this.startAuditButton.isDisabled();
  }

  async getValidationError(): Promise<string | null> {
    const errorElement = this.page.getByText(/please enter a valid url/i);
    const isVisible = await errorElement.isVisible().catch(() => false);
    return isVisible ? await errorElement.textContent() : null;
  }
}
