/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * E2E Test: URL Input Validation and Form Interaction
 * Tests URL input validation, advanced options, and form behavior
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { testUrls } from '../../fixtures/test-urls';

test.describe('URL Input Validation', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
  });

  test('accepts valid HTTP URL', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.enterUrl(testUrls.valid.httpProtocol);
    await expect(homePage.urlInput).toHaveValue(testUrls.valid.httpProtocol);

    // Should not show validation error
    const error = await homePage.getValidationError();
    expect(error).toBeNull();
  });

  test('accepts valid HTTPS URL', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.enterUrl(testUrls.valid.httpsProtocol);
    await expect(homePage.urlInput).toHaveValue(testUrls.valid.httpsProtocol);

    // Should not show validation error
    const error = await homePage.getValidationError();
    expect(error).toBeNull();
  });

  test('rejects URL without protocol', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.enterUrl(testUrls.invalid.noProtocol);
    await homePage.startAuditButton.click();

    // Should show validation error
    const errorMessage = page.getByText(/please enter a valid url/i);
    await expect(errorMessage).toBeVisible();
  });

  test('rejects malformed URLs', async ({ page }) => {
    const homePage = new HomePage(page);

    const invalidUrls = [
      testUrls.invalid.malformed,
      testUrls.invalid.javascript,
      testUrls.invalid.wrongProtocol,
    ];

    for (const url of invalidUrls) {
      await homePage.urlInput.clear();
      await homePage.enterUrl(url);
      await homePage.startAuditButton.click();

      const errorMessage = page.getByText(/please enter a valid url/i);
      await expect(errorMessage).toBeVisible();
    }
  });

  test('rejects empty URL', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.startAuditButton.click();

    // Should show required field error
    const errorMessage = page.getByText(/url is required|please enter|required/i);
    await expect(errorMessage).toBeVisible();
  });

  test('handles very long URLs', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.enterUrl(testUrls.edge.veryLongUrl);
    await expect(homePage.urlInput).toHaveValue(testUrls.edge.veryLongUrl);
  });

  test('handles URLs with special characters', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.enterUrl(testUrls.edge.withSpecialChars);
    await expect(homePage.urlInput).toHaveValue(testUrls.edge.withSpecialChars);
  });
});

test.describe('Advanced Options', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
  });

  test('can toggle advanced options visibility', async ({ page }) => {
    const homePage = new HomePage(page);

    // Initially hidden (default state)
    await expect(homePage.concurrencyInput).not.toBeVisible();

    // Show advanced options
    await homePage.showAdvancedOptions();
    await expect(homePage.concurrencyInput).toBeVisible();
    await expect(homePage.maxDepthInput).toBeVisible();
    await expect(homePage.maxPagesInput).toBeVisible();

    // Hide advanced options
    await homePage.hideAdvancedOptions();
    await expect(homePage.concurrencyInput).not.toBeVisible();
  });

  test('can configure concurrency setting', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.showAdvancedOptions();

    await homePage.concurrencyInput.clear();
    await homePage.concurrencyInput.fill('10');
    await expect(homePage.concurrencyInput).toHaveValue('10');
  });

  test('can configure max depth setting', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.showAdvancedOptions();

    await homePage.maxDepthInput.clear();
    await homePage.maxDepthInput.fill('5');
    await expect(homePage.maxDepthInput).toHaveValue('5');
  });

  test('can configure max pages setting', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.showAdvancedOptions();

    await homePage.maxPagesInput.clear();
    await homePage.maxPagesInput.fill('100');
    await expect(homePage.maxPagesInput).toHaveValue('100');
  });

  test('can toggle respect robots.txt checkbox', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.showAdvancedOptions();

    const initialState = await homePage.respectRobotsTxtCheckbox.isChecked();

    // Toggle
    await homePage.respectRobotsTxtCheckbox.click();
    const newState = await homePage.respectRobotsTxtCheckbox.isChecked();

    expect(newState).toBe(!initialState);
  });

  test('advanced options persist when toggling visibility', async ({ page }) => {
    const homePage = new HomePage(page);

    // Show and configure
    await homePage.showAdvancedOptions();
    await homePage.concurrencyInput.clear();
    await homePage.concurrencyInput.fill('15');

    // Hide
    await homePage.hideAdvancedOptions();

    // Show again
    await homePage.showAdvancedOptions();

    // Verify value persisted
    await expect(homePage.concurrencyInput).toHaveValue('15');
  });
});

test.describe('Form Submission', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
  });

  test('submit button is disabled while loading', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    // Button should be disabled during scan
    const isDisabled = await homePage.isAuditButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  test('form fields are disabled while loading', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    // URL input should be disabled during scan
    await expect(homePage.urlInput).toBeDisabled();
  });

  test('shows loading state during audit', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.enterUrl(testUrls.valid.simple);
    await homePage.startAuditButton.click();

    // Should show "Scanning..." text
    const scanningButton = page.getByRole('button', { name: /scanning/i });
    await expect(scanningButton).toBeVisible();
  });
});

test.describe('User Experience', () => {
  test('autofocus on URL input when page loads', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // URL input should be focused
    const focused = await page.evaluate(() => {
      const urlInput = document.querySelector('input[type="url"]');
      return document.activeElement === urlInput;
    });

    expect(focused).toBe(true);
  });

  test('can submit form with Enter key', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.urlInput.fill(testUrls.valid.simple);
    await homePage.urlInput.press('Enter');

    // Should start crawl
    const scanPage = await import('../../pages/scan.page');
    const scan = new scanPage.ScanPage(page);
    await expect(scan.progressBar).toBeVisible({ timeout: 5000 });
  });

  test('placeholder text is helpful', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const placeholder = await homePage.urlInput.getAttribute('placeholder');
    expect(placeholder).toMatch(/url|website|enter/i);
  });

  test('form is accessible with keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab to URL input
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('INPUT');

    // Tab to submit button
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('BUTTON');
  });
});
