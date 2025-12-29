/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Page Object Model for Scan/Crawl Progress Page
 * Provides methods for monitoring crawl progress and results
 */

import { Page, Locator } from '@playwright/test';

export class ScanPage {
  readonly page: Page;
  readonly progressBar: Locator;
  readonly progressText: Locator;
  readonly statusMessage: Locator;
  readonly resultsTable: Locator;
  readonly crawlSummary: Locator;
  readonly viewReportButton: Locator;
  readonly stopCrawlButton: Locator;
  readonly exportButton: Locator;
  readonly pageCountDisplay: Locator;
  readonly orphanedPagesCount: Locator;
  readonly brokenLinksCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.progressBar = page.getByRole('progressbar');
    this.progressText = page.getByTestId('progress-text');
    this.statusMessage = page.getByTestId('status-message');
    this.resultsTable = page.getByRole('table');
    this.crawlSummary = page.getByTestId('crawl-summary');
    this.viewReportButton = page.getByRole('button', { name: /view report/i });
    this.stopCrawlButton = page.getByRole('button', { name: /stop|cancel/i });
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.pageCountDisplay = page.getByTestId('page-count');
    this.orphanedPagesCount = page.getByTestId('orphaned-pages-count');
    this.brokenLinksCount = page.getByTestId('broken-links-count');
  }

  async waitForCrawlStart(timeout = 10000) {
    // Wait for either progress bar or scanning status
    await Promise.race([
      this.progressBar.waitFor({ state: 'visible', timeout }),
      this.page.getByText(/scanning/i).waitFor({ state: 'visible', timeout }),
    ]);
  }

  async waitForCrawlCompletion(timeout = 60000) {
    // Wait for completion indicators
    await this.page.waitForFunction(
      () => {
        const statusText = document.body.textContent;
        return (
          statusText?.includes('Complete') ||
          statusText?.includes('Finished') ||
          statusText?.includes('100%') ||
          document.querySelector('[data-testid="view-report"]') !== null
        );
      },
      { timeout }
    );
  }

  async stopCrawl() {
    await this.stopCrawlButton.click();
  }

  async viewReport() {
    await this.viewReportButton.click();
  }

  async exportAs(format: 'csv' | 'json' | 'pdf') {
    await this.exportButton.click();

    // Wait for export menu to appear
    const menuItem = this.page.getByRole('menuitem', { name: new RegExp(format, 'i') });
    await menuItem.waitFor({ state: 'visible' });
    await menuItem.click();
  }

  async getPageCount(): Promise<number> {
    try {
      const countText = await this.pageCountDisplay.textContent();
      const match = countText?.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    } catch {
      // Fallback: search in summary text
      const summaryText = await this.crawlSummary.textContent();
      const match = summaryText?.match(/(\d+)\s+pages?/i);
      return match ? parseInt(match[1], 10) : 0;
    }
  }

  async getOrphanedPagesCount(): Promise<number> {
    const countText = await this.orphanedPagesCount.textContent();
    const match = countText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getBrokenLinksCount(): Promise<number> {
    const countText = await this.brokenLinksCount.textContent();
    const match = countText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getProgressPercentage(): Promise<number> {
    const progressText = await this.progressText.textContent();
    const match = progressText?.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async filterResultsByStatus(status: string) {
    const filterSelect = this.page.getByLabel(/filter|status/i);
    await filterSelect.selectOption(status);
  }

  async searchResults(query: string) {
    const searchInput = this.page.getByPlaceholder(/search/i);
    await searchInput.fill(query);
  }

  async sortBy(column: 'url' | 'status' | 'title' | 'links') {
    const columnHeader = this.page.getByRole('columnheader', { name: new RegExp(column, 'i') });
    await columnHeader.click();
  }

  async getTableRowCount(): Promise<number> {
    const rows = this.page.getByRole('row');
    const count = await rows.count();
    // Subtract 1 for header row
    return Math.max(0, count - 1);
  }

  async isErrorDisplayed(): Promise<boolean> {
    const errorMessage = this.page.getByText(/error|failed|problem/i);
    return await errorMessage.isVisible().catch(() => false);
  }

  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.getByRole('alert').or(this.page.getByText(/error/i)).first();
    const isVisible = await errorElement.isVisible().catch(() => false);
    return isVisible ? await errorElement.textContent() : null;
  }
}
