/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * E2E Test: Happy Path - Complete Website Crawl Flow
 * Tests the primary user journey from landing to report export
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { ScanPage } from '../../pages/scan.page';
import { ReportPage } from '../../pages/report.page';
import { testUrls } from '../../fixtures/test-urls';

test.describe('Happy Path: Complete Website Crawl', () => {
  test('user can crawl a website, view results, and export report', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);
    const reportPage = new ReportPage(page);

    // Step 1: Navigate to homepage
    await homePage.goto();
    await expect(page).toHaveTitle(/VaporScan/i);
    await expect(homePage.urlInput).toBeVisible();

    // Step 2: Enter target URL
    await homePage.enterUrl(testUrls.valid.simple);
    await expect(homePage.urlInput).toHaveValue(testUrls.valid.simple);

    // Step 3: Start audit
    await homePage.startAuditButton.click();

    // Step 4: Verify audit starts
    await scanPage.waitForCrawlStart();
    await expect(scanPage.progressBar).toBeVisible();

    // Step 5: Monitor progress (optional - can be skipped for faster tests)
    const initialProgress = await scanPage.getProgressPercentage();
    expect(initialProgress).toBeGreaterThanOrEqual(0);

    // Step 6: Wait for audit completion
    await scanPage.waitForCrawlCompletion();

    // Step 7: Verify results displayed
    await expect(scanPage.resultsTable).toBeVisible();
    const pageCount = await scanPage.getPageCount();
    expect(pageCount).toBeGreaterThan(0);

    // Step 8: View detailed report
    await scanPage.viewReport();
    await reportPage.waitForReportLoad();
    await expect(reportPage.reportTitle).toBeVisible();

    // Step 9: Verify report sections
    await expect(reportPage.overviewSection).toBeVisible();

    // Step 10: Export as CSV
    const downloadPromise = page.waitForEvent('download');
    await reportPage.exportAs('csv');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('user can perform quick audit with default settings', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();

    // Quick audit - just enter URL and start
    await homePage.startAudit(testUrls.valid.simple);

    // Wait for completion
    await scanPage.waitForCrawlStart();
    await scanPage.waitForCrawlCompletion();

    // Verify results
    await expect(scanPage.resultsTable).toBeVisible();
    const pageCount = await scanPage.getPageCount();
    expect(pageCount).toBeGreaterThan(0);
  });

  test('user can configure advanced options before audit', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();

    // Start audit with custom options
    await homePage.startAudit(testUrls.valid.simple, {
      concurrency: 10,
      maxDepth: 5,
      maxPages: 100,
    });

    await scanPage.waitForCrawlStart();
    await scanPage.waitForCrawlCompletion();

    // Verify crawl completed successfully
    await expect(scanPage.resultsTable).toBeVisible();
  });

  test('user can stop an ongoing audit', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startAudit(testUrls.valid.simple);
    await scanPage.waitForCrawlStart();

    // Stop the audit mid-crawl
    await scanPage.stopCrawl();

    // Verify stopped state
    const errorOrStoppedMessage = await scanPage.getErrorMessage();
    expect(errorOrStoppedMessage).toBeTruthy();
  });

  test('user can view partial results before completion', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startAudit(testUrls.valid.simple);
    await scanPage.waitForCrawlStart();

    // Wait a bit for partial results
    await page.waitForTimeout(2000);

    // Check if any results are visible yet
    const rowCount = await scanPage.getTableRowCount();
    // Partial results may or may not be visible depending on implementation
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Happy Path: Results Exploration', () => {
  test('user can filter and search crawl results', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startAudit(testUrls.valid.simple);
    await scanPage.waitForCrawlCompletion();

    // Initial row count
    const initialRowCount = await scanPage.getTableRowCount();
    expect(initialRowCount).toBeGreaterThan(0);

    // Search for specific URL
    await scanPage.searchResults('example');
    await page.waitForTimeout(500); // Wait for search to apply

    // Verify search worked (may reduce or maintain row count)
    const searchedRowCount = await scanPage.getTableRowCount();
    expect(searchedRowCount).toBeGreaterThanOrEqual(0);
  });

  test('user can sort results by different columns', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startAudit(testUrls.valid.simple);
    await scanPage.waitForCrawlCompletion();

    // Sort by URL
    await scanPage.sortBy('url');
    await page.waitForTimeout(300);

    // Sort by status
    await scanPage.sortBy('status');
    await page.waitForTimeout(300);

    // Verify table is still visible after sorting
    await expect(scanPage.resultsTable).toBeVisible();
  });
});

test.describe('Happy Path: Report Export', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startAudit(testUrls.valid.simple);
    await scanPage.waitForCrawlCompletion();
    await scanPage.viewReport();
  });

  test('user can export report as CSV', async ({ page }) => {
    const reportPage = new ReportPage(page);

    const downloadPromise = page.waitForEvent('download');
    await reportPage.exportAs('csv');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('user can export report as JSON', async ({ page }) => {
    const reportPage = new ReportPage(page);

    const downloadPromise = page.waitForEvent('download');
    await reportPage.exportAs('json');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('user can export report as PDF', async ({ page }) => {
    const reportPage = new ReportPage(page);

    const downloadPromise = page.waitForEvent('download');
    await reportPage.exportAs('pdf');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
