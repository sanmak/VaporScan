/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Page Object Model for Report Dashboard Page
 * Provides methods for interacting with the detailed SEO audit report
 */

import { Page, Locator } from '@playwright/test';

export class ReportPage {
  readonly page: Page;
  readonly reportTitle: Locator;
  readonly overviewSection: Locator;
  readonly orphanPagesSection: Locator;
  readonly brokenLinksSection: Locator;
  readonly performanceMetrics: Locator;
  readonly exportButton: Locator;
  readonly downloadCsvButton: Locator;
  readonly downloadJsonButton: Locator;
  readonly downloadPdfButton: Locator;
  readonly backButton: Locator;
  readonly shareButton: Locator;
  readonly printButton: Locator;

  // View tabs/sections
  readonly overviewTab: Locator;
  readonly issuesTab: Locator;
  readonly pagesTab: Locator;
  readonly linksTab: Locator;

  // Filters and search
  readonly filterByType: Locator;
  readonly searchBox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.reportTitle = page.getByRole('heading', { name: /report|audit/i, level: 1 });
    this.overviewSection = page.getByTestId('overview-section');
    this.orphanPagesSection = page.getByTestId('orphan-pages-section');
    this.brokenLinksSection = page.getByTestId('broken-links-section');
    this.performanceMetrics = page.getByTestId('performance-metrics');
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.downloadCsvButton = page.getByRole('button', { name: /csv/i });
    this.downloadJsonButton = page.getByRole('button', { name: /json/i });
    this.downloadPdfButton = page.getByRole('button', { name: /pdf/i });
    this.backButton = page.getByRole('button', { name: /back/i });
    this.shareButton = page.getByRole('button', { name: /share/i });
    this.printButton = page.getByRole('button', { name: /print/i });

    // Tabs
    this.overviewTab = page.getByRole('tab', { name: /overview/i });
    this.issuesTab = page.getByRole('tab', { name: /issues/i });
    this.pagesTab = page.getByRole('tab', { name: /pages/i });
    this.linksTab = page.getByRole('tab', { name: /links/i });

    // Filters
    this.filterByType = page.getByLabel(/filter by type/i);
    this.searchBox = page.getByPlaceholder(/search/i);
  }

  async goto(reportId?: string) {
    if (reportId) {
      await this.page.goto(`/report/${reportId}`);
    } else {
      // Navigate to latest report (assuming a default route exists)
      await this.page.goto('/report');
    }
  }

  async waitForReportLoad() {
    await this.reportTitle.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  async exportAs(format: 'csv' | 'json' | 'pdf') {
    await this.exportButton.click();

    switch (format) {
      case 'csv':
        await this.downloadCsvButton.click();
        break;
      case 'json':
        await this.downloadJsonButton.click();
        break;
      case 'pdf':
        await this.downloadPdfButton.click();
        break;
    }
  }

  async switchToTab(tabName: 'overview' | 'issues' | 'pages' | 'links') {
    switch (tabName) {
      case 'overview':
        await this.overviewTab.click();
        break;
      case 'issues':
        await this.issuesTab.click();
        break;
      case 'pages':
        await this.pagesTab.click();
        break;
      case 'links':
        await this.linksTab.click();
        break;
    }
  }

  async getOrphanedPagesCount(): Promise<number> {
    const section = this.orphanPagesSection;
    const countText = await section.getByTestId('count').textContent();
    const match = countText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getBrokenLinksCount(): Promise<number> {
    const section = this.brokenLinksSection;
    const countText = await section.getByTestId('count').textContent();
    const match = countText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getTotalPagesScanned(): Promise<number> {
    const overviewText = await this.overviewSection.textContent();
    const match = overviewText?.match(/(\d+)\s+pages?\s+scanned/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getAverageLoadTime(): Promise<number> {
    const metricsText = await this.performanceMetrics.textContent();
    const match = metricsText?.match(/average.*?(\d+(?:\.\d+)?)\s*ms/i);
    return match ? parseFloat(match[1]) : 0;
  }

  async searchReportData(query: string) {
    await this.searchBox.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async filterByIssueType(type: string) {
    await this.filterByType.selectOption(type);
  }

  async goBack() {
    await this.backButton.click();
  }

  async shareReport() {
    await this.shareButton.click();
  }

  async printReport() {
    await this.printButton.click();
  }

  async expandOrphanPagesSection() {
    const expandButton = this.orphanPagesSection.getByRole('button', { name: /expand|show/i });
    const isVisible = await expandButton.isVisible().catch(() => false);
    if (isVisible) {
      await expandButton.click();
    }
  }

  async expandBrokenLinksSection() {
    const expandButton = this.brokenLinksSection.getByRole('button', { name: /expand|show/i });
    const isVisible = await expandButton.isVisible().catch(() => false);
    if (isVisible) {
      await expandButton.click();
    }
  }

  async getOrphanPagesList(): Promise<string[]> {
    await this.expandOrphanPagesSection();
    const listItems = this.orphanPagesSection.getByRole('listitem');
    const count = await listItems.count();
    const pages: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await listItems.nth(i).textContent();
      if (text) pages.push(text.trim());
    }

    return pages;
  }

  async getBrokenLinksList(): Promise<string[]> {
    await this.expandBrokenLinksSection();
    const listItems = this.brokenLinksSection.getByRole('listitem');
    const count = await listItems.count();
    const links: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await listItems.nth(i).textContent();
      if (text) links.push(text.trim());
    }

    return links;
  }

  async isReportEmpty(): Promise<boolean> {
    const emptyState = this.page.getByText(/no data|no results|empty/i);
    return await emptyState.isVisible().catch(() => false);
  }
}
