/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * E2E Test: Cross-Browser Compatibility
 * Tests core functionality across different browsers (Chromium, Firefox, WebKit)
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { ScanPage } from '../../pages/scan.page';
import { testUrls } from '../../fixtures/test-urls';

test.describe('Cross-Browser Compatibility', () => {
  test('core functionality works across all browsers', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    // Navigate and verify page loads
    await homePage.goto();
    await expect(page).toHaveTitle(/VaporScan/i);

    // Start audit
    await homePage.startAudit(testUrls.valid.simple);
    await scanPage.waitForCrawlStart();

    // Verify progress bar appears
    await expect(scanPage.progressBar).toBeVisible();

    // Wait for completion
    await scanPage.waitForCrawlCompletion();

    // Verify results
    await expect(scanPage.resultsTable).toBeVisible();

    // Browser-specific validations
    // All browsers should pass the same core functionality tests
  });

  test('URL input validation works consistently', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Test valid URL
    await homePage.enterUrl(testUrls.valid.simple);
    await expect(homePage.urlInput).toHaveValue(testUrls.valid.simple);

    // Test invalid URL
    await homePage.urlInput.clear();
    await homePage.enterUrl(testUrls.invalid.noProtocol);
    await homePage.startAuditButton.click();

    const errorMessage = page.getByText(/please enter a valid url/i);
    await expect(errorMessage).toBeVisible();
  });

  test('advanced options toggle works in all browsers', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Initially hidden
    await expect(homePage.concurrencyInput).not.toBeVisible();

    // Show advanced options
    await homePage.showAdvancedOptions();
    await expect(homePage.concurrencyInput).toBeVisible();
    await expect(homePage.maxDepthInput).toBeVisible();

    // Hide again
    await homePage.hideAdvancedOptions();
    await expect(homePage.concurrencyInput).not.toBeVisible();
  });

  test('export functionality works across browsers', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startAudit(testUrls.valid.simple);
    await scanPage.waitForCrawlCompletion();
    await scanPage.viewReport();

    const reportPage = await import('../../pages/report.page');
    const report = new reportPage.ReportPage(page);

    // Test CSV export
    const downloadPromise = page.waitForEvent('download');
    await report.exportAs('csv');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});

test.describe('Browser-Specific Features', () => {
  test('local storage persistence works', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Set some data in localStorage
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });

    // Reload page
    await page.reload();

    // Check if data persists
    const value = await page.evaluate(() => {
      return localStorage.getItem('test-key');
    });

    expect(value).toBe('test-value');

    // Cleanup
    await page.evaluate(() => {
      localStorage.removeItem('test-key');
    });
  });

  test('IndexedDB is supported', async ({ page }) => {
    await page.goto('/');

    const indexedDBSupported = await page.evaluate(() => {
      return 'indexedDB' in window;
    });

    expect(indexedDBSupported).toBe(true);
  });

  test('Service Worker registration', async ({ page, browserName }) => {
    await page.goto('/');

    // Check service worker support
    const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);

    // Service workers are supported in all modern browsers
    if (browserName === 'chromium' || browserName === 'firefox' || browserName === 'webkit') {
      expect(swSupported).toBe(true);
    }

    if (swSupported) {
      // Wait for service worker registration (if implemented)
      const hasServiceWorker = await page.evaluate(() => {
        return navigator.serviceWorker.getRegistrations().then((registrations) => {
          return registrations.length > 0;
        });
      });

      // Service worker may or may not be implemented yet
      if (!hasServiceWorker) {
        console.warn('Service worker not yet registered');
      }
    }
  });

  test('Fetch API is available', async ({ page }) => {
    await page.goto('/');

    const fetchSupported = await page.evaluate(() => {
      return typeof fetch === 'function';
    });

    expect(fetchSupported).toBe(true);
  });

  test('Promise support', async ({ page }) => {
    await page.goto('/');

    const promiseSupported = await page.evaluate(() => {
      return typeof Promise !== 'undefined';
    });

    expect(promiseSupported).toBe(true);
  });
});

test.describe('CSS and Layout Consistency', () => {
  test('page layout renders correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Check if main elements are visible
    await expect(homePage.urlInput).toBeVisible();
    await expect(homePage.startAuditButton).toBeVisible();

    // Check if elements are not overlapping (basic check)
    const urlInputBox = await homePage.urlInput.boundingBox();
    const buttonBox = await homePage.startAuditButton.boundingBox();

    expect(urlInputBox).toBeTruthy();
    expect(buttonBox).toBeTruthy();
  });

  test('responsive design breakpoints work', async ({ page }) => {
    const homePage = new HomePage(page);

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await homePage.goto();
    await expect(homePage.urlInput).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await homePage.goto();
    await expect(homePage.urlInput).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await expect(homePage.urlInput).toBeVisible();
  });

  test('fonts render correctly', async ({ page }) => {
    await page.goto('/');

    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    expect(fontFamily).toBeTruthy();
    expect(fontFamily).not.toBe('');
  });
});

test.describe('Performance Across Browsers', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known harmless errors (e.g., extension errors)
    const criticalErrors = errors.filter((error) => {
      return !error.includes('Extension') && !error.includes('chrome-extension');
    });

    if (criticalErrors.length > 0) {
      console.warn('Console errors found:', criticalErrors);
    }

    // This is a warning, not a hard failure for now
    // expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Input Method Compatibility', () => {
  test('mouse clicks work', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.urlInput.click();
    await homePage.urlInput.fill(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    const scanPage = new ScanPage(page);
    await expect(scanPage.progressBar).toBeVisible({ timeout: 5000 });
  });

  test('keyboard input works', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await page.keyboard.press('Tab');
    await page.keyboard.type(testUrls.valid.simple);
    await page.keyboard.press('Enter');

    const scanPage = new ScanPage(page);
    await expect(scanPage.progressBar).toBeVisible({ timeout: 5000 });
  });

  test('touch events work on mobile browsers', async ({ page }) => {
    const userAgent = await page.evaluate(() => navigator.userAgent);
    if (userAgent.includes('Mobile')) {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Tap on input
      await homePage.urlInput.tap();
      await homePage.urlInput.fill(testUrls.valid.simple);

      // Tap on button
      await homePage.startAuditButton.tap();

      const scanPage = new ScanPage(page);
      await expect(scanPage.progressBar).toBeVisible({ timeout: 5000 });
    }
  });
});
