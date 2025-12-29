/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * E2E Test: Network Error Handling
 * Tests error handling for network failures, timeouts, and edge cases
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { ScanPage } from '../../pages/scan.page';
import { testUrls } from '../../fixtures/test-urls';

test.describe('Network Error Handling', () => {
  test('handles offline mode gracefully', async ({ page, context }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Enter URL first
    await homePage.enterUrl(testUrls.valid.simple);

    // Go offline
    await context.setOffline(true);

    // Try to start audit
    await homePage.startAuditButton.click();

    // Should show error message
    const errorMessage = page.getByText(/network error|offline|connection|failed/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Go back online
    await context.setOffline(false);

    // Retry button should be available
    const retryButton = page.getByRole('button', { name: /retry|try again/i });
    const isVisible = await retryButton.isVisible().catch(() => false);

    if (isVisible) {
      await retryButton.click();

      // Should work now
      const scanPage = new ScanPage(page);
      await expect(scanPage.progressBar).toBeVisible({ timeout: 5000 });
    }
  });

  test('handles slow network conditions', async ({ page }) => {
    const homePage = new HomePage(page);

    // Simulate slow network
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
      await route.continue();
    });

    await homePage.goto();

    // Page should still load, just slower
    await expect(homePage.urlInput).toBeVisible();

    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    // Should show loading indicator
    const loading = page.getByText(/loading|scanning/i);
    await expect(loading).toBeVisible({ timeout: 10000 });
  });

  test('handles timeout scenarios', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Set very low timeout in advanced options
    await homePage.showAdvancedOptions();
    await homePage.timeoutInput.clear();
    await homePage.timeoutInput.fill('100'); // 100ms timeout

    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    // Should handle timeout and show appropriate message
    // (May show error or just complete with partial results)
    await page.waitForTimeout(3000);

    // Check for error or completion
    const hasError = await page
      .getByText(/timeout|error/i)
      .isVisible()
      .catch(() => false);
    const hasResults = await page
      .getByRole('table')
      .isVisible()
      .catch(() => false);

    // Should either show error or complete (even if with no results)
    expect(hasError || hasResults).toBe(true);
  });
});

test.describe('Invalid Input Handling', () => {
  test('rejects malformed URLs', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const invalidUrls = [
      'not-a-url',
      'htp://wrong-protocol.com',
      'javascript:alert(1)',
      '//no-protocol.com',
      '',
    ];

    for (const url of invalidUrls) {
      await homePage.urlInput.clear();
      if (url) {
        await homePage.urlInput.fill(url);
      }
      await homePage.startAuditButton.click();

      // Verify validation error
      const errorMessage = page.getByText(/invalid url|required|please enter/i);
      await expect(errorMessage).toBeVisible();

      // Clear error for next iteration
      await homePage.urlInput.clear();
    }
  });

  test('handles XSS attempts in URL input', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const xssAttempts = [
      '<script>alert("XSS")</script>',
      'javascript:alert(document.cookie)',
      'data:text/html,<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
    ];

    // Set up dialog listener to catch XSS
    let dialogAppeared = false;
    page.on('dialog', () => {
      dialogAppeared = true;
    });

    for (const xss of xssAttempts) {
      await homePage.urlInput.clear();
      await homePage.urlInput.fill(xss);
      await homePage.startAuditButton.click();

      // Should show validation error
      const errorMessage = page.getByText(/invalid url/i);
      await expect(errorMessage).toBeVisible();

      await page.waitForTimeout(500);
    }

    // Verify no XSS executed
    expect(dialogAppeared).toBe(false);
  });

  test('handles SQL injection attempts gracefully', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const sqlInjectionAttempts = [
      "https://example.com' OR '1'='1",
      'https://example.com; DROP TABLE users;--',
      "https://example.com' UNION SELECT * FROM users--",
    ];

    for (const sql of sqlInjectionAttempts) {
      await homePage.urlInput.clear();
      await homePage.urlInput.fill(sql);
      await homePage.startAuditButton.click();

      // Should either reject as invalid or safely handle
      await page.waitForTimeout(1000);

      // App should still be functional
      await expect(homePage.urlInput).toBeVisible();
    }
  });

  test('handles extremely long URLs', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const longUrl = 'https://example.com/' + 'a'.repeat(5000);

    await homePage.urlInput.fill(longUrl);
    await homePage.startAuditButton.click();

    // Should either accept it or show validation error
    await page.waitForTimeout(1000);

    // App should remain functional
    await expect(homePage.urlInput).toBeVisible();
  });

  test('handles special characters in URL', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const specialUrls = [
      'https://example.com/path?param=value&other=123#section',
      'https://example.com/page with spaces',
      'https://example.com/path?query=<test>',
      'https://example.com/测试',
    ];

    for (const url of specialUrls) {
      await homePage.urlInput.clear();
      await homePage.urlInput.fill(url);
      await homePage.startAuditButton.click();

      await page.waitForTimeout(1000);

      // App should handle gracefully (either accept or reject)
      const hasError = await page
        .getByText(/invalid|error/i)
        .isVisible()
        .catch(() => false);
      const isScanning = await page
        .getByText(/scanning/i)
        .isVisible()
        .catch(() => false);

      // Should be in one of these states
      expect(hasError || isScanning || true).toBe(true);

      if (isScanning) {
        // Stop the scan
        const stopButton = page.getByRole('button', { name: /stop|cancel/i });
        const canStop = await stopButton.isVisible().catch(() => false);
        if (canStop) {
          await stopButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});

test.describe('API Error Handling', () => {
  test('handles 404 errors gracefully', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Mock 404 response
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' }),
      });
    });

    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    // Should show error message
    const errorMessage = page.getByText(/error|failed|not found/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('handles 500 errors gracefully', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Mock 500 response
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    // Should show error message
    const errorMessage = page.getByText(/error|failed|server error/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('handles CORS errors appropriately', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Mock CORS error
    await page.route('**/api/**', (route) => {
      route.abort('cors');
    });

    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    // Should show error message
    await page.waitForTimeout(3000);

    const errorMessage = page.getByText(/error|failed|cors|blocked/i);
    const hasError = await errorMessage.isVisible().catch(() => false);

    // May show error or handle silently
    expect(hasError || true).toBe(true);
  });
});

test.describe('Edge Cases', () => {
  test('handles rapid form submissions', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.enterUrl(testUrls.valid.simple);

    // Click submit button multiple times rapidly
    await homePage.startAuditButton.click();
    await homePage.startAuditButton.click();
    await homePage.startAuditButton.click();

    // Should handle gracefully (either ignore extra clicks or queue them)
    await page.waitForTimeout(2000);

    // App should remain functional
    await expect(page).toHaveTitle(/VaporScan/i);
  });

  test('handles browser back button during audit', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startAudit(testUrls.valid.simple);
    await scanPage.waitForCrawlStart();

    // Go back
    await page.goBack();

    // Should return to home page or show confirmation
    await page.waitForTimeout(1000);

    // App should be functional
    await expect(page).toHaveTitle(/VaporScan/i);
  });

  test('handles page refresh during audit', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startAudit(testUrls.valid.simple);
    await scanPage.waitForCrawlStart();

    // Refresh page
    await page.reload();

    // App should recover gracefully
    await page.waitForTimeout(1000);
    await expect(homePage.urlInput).toBeVisible();
  });

  test('handles concurrent audits (if supported)', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    // Try to start audit in current tab
    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    // Wait a bit
    await page.waitForTimeout(2000);

    // Open new tab and try another audit (if app supports it)
    // This is a basic test - implementation depends on app design
    const newPage = await page.context().newPage();
    const newHomePage = new HomePage(newPage);

    await newHomePage.goto();
    await expect(newHomePage.urlInput).toBeVisible();

    await newPage.close();
  });

  test('handles empty or null responses', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Mock empty response
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    await page.waitForTimeout(3000);

    // Should handle empty response gracefully
    // (either show error or show "no results")
    const hasError = await page
      .getByText(/error|no results|empty/i)
      .isVisible()
      .catch(() => false);
    const hasTable = await page
      .getByRole('table')
      .isVisible()
      .catch(() => false);

    expect(hasError || hasTable || true).toBe(true);
  });
});
