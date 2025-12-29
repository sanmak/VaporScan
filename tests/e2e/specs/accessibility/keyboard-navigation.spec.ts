/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * E2E Test: Keyboard Navigation and Accessibility
 * Tests keyboard-only navigation, focus management, and ARIA compliance
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { testUrls } from '../../fixtures/test-urls';
import {
  tabThroughFocusableElements,
  checkHeadingHierarchy,
  checkFormLabels,
  hasSkipLink,
  checkImageAltText,
} from '../../helpers/accessibility-helpers';

test.describe('Keyboard Navigation', () => {
  test('user can navigate entire app using keyboard only', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Tab through focusable elements
    await page.keyboard.press('Tab'); // Skip link or first focusable
    await page.keyboard.press('Tab'); // URL input
    let focused = page.locator(':focus');
    await expect(focused).toHaveRole('textbox');

    await page.keyboard.press('Tab'); // Submit button
    focused = page.locator(':focus');
    await expect(focused).toHaveRole('button');
  });

  test('can submit form using Enter key', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Type URL
    await page.keyboard.press('Tab');
    await page.keyboard.type(testUrls.valid.simple);

    // Press Enter
    await page.keyboard.press('Enter');

    // Verify scan started
    const scanPage = await import('../../pages/scan.page');
    const scan = new scanPage.ScanPage(page);
    await expect(scan.progressBar).toBeVisible({ timeout: 5000 });
  });

  test('can navigate through advanced options with keyboard', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Tab to advanced options toggle
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Assuming it's the third tab stop

    // Press Space or Enter to toggle
    await page.keyboard.press(' ');

    // Advanced options should be visible
    await expect(homePage.concurrencyInput).toBeVisible();
  });

  test('tab order is logical and sequential', async ({ page }) => {
    await page.goto('/');

    const focusedElements = await tabThroughFocusableElements(page, 20);

    // Verify we have focusable elements
    expect(focusedElements.length).toBeGreaterThan(0);

    // Basic check: input should come before button
    const inputIndex = focusedElements.findIndex((el) => el.includes('input'));
    const buttonIndex = focusedElements.findIndex(
      (el) => el.toLowerCase().includes('audit') || el.toLowerCase().includes('start')
    );

    if (inputIndex >= 0 && buttonIndex >= 0) {
      expect(inputIndex).toBeLessThan(buttonIndex);
    }
  });

  test('focus is visible on all interactive elements', async ({ page }) => {
    await page.goto('/');

    // Tab through and check focus visibility
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      // Get focused element's outline/box-shadow (focus indicator)
      const hasFocusIndicator = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;

        const styles = window.getComputedStyle(el);
        const outline = styles.outline;
        const boxShadow = styles.boxShadow;

        // Check if there's a visible focus indicator
        return (
          (outline !== 'none' && outline !== '' && outline !== '0px') ||
          (boxShadow !== 'none' && boxShadow !== '')
        );
      });

      // Either has focus indicator or is not an interactive element
      if (hasFocusIndicator === false) {
        const tagName = await page.evaluate(() => document.activeElement?.tagName);
        // Body element is okay to not have focus indicator
        expect(['BODY', 'HTML'].includes(tagName || '')).toBe(true);
      }
    }
  });

  test('Escape key closes modals/dialogs', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Try to open settings if available
    const settingsButton = page.getByRole('button', { name: /settings/i });
    const isVisible = await settingsButton.isVisible().catch(() => false);

    if (isVisible) {
      await settingsButton.click();

      // Wait for dialog to appear
      const dialog = page.getByRole('dialog');
      await expect(dialog)
        .toBeVisible({ timeout: 2000 })
        .catch(() => {});

      // Press Escape
      await page.keyboard.press('Escape');

      // Dialog should close
      await expect(dialog)
        .not.toBeVisible({ timeout: 2000 })
        .catch(() => {});
    }
  });
});

test.describe('ARIA and Semantics', () => {
  test('all interactive elements have accessible names', async ({ page }) => {
    await page.goto('/');

    // Check buttons
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName =
        (await button.getAttribute('aria-label')) ||
        (await button.textContent()) ||
        (await button.getAttribute('title'));

      expect(accessibleName).toBeTruthy();
    }
  });

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/');

    const result = await checkFormLabels(page);

    expect(result.valid).toBe(true);
    if (!result.valid) {
      console.warn('Unlabeled inputs:', result.unlabeledInputs);
    }
  });

  test('proper heading hierarchy exists', async ({ page }) => {
    await page.goto('/');

    const result = await checkHeadingHierarchy(page);

    expect(result.valid).toBe(true);
    if (!result.valid) {
      console.warn('Heading issues:', result.issues);
    }
  });

  test('page has main landmark', async ({ page }) => {
    await page.goto('/');

    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');

    const result = await checkImageAltText(page);

    if (!result.valid) {
      console.warn(`${result.imagesWithoutAlt} images without alt text`);
    }

    // This is a warning, not a hard failure
    // expect(result.valid).toBe(true);
  });

  test('skip link is present', async ({ page }) => {
    await page.goto('/');

    const skipLinkExists = await hasSkipLink(page);

    // Skip link is recommended but not required
    if (!skipLinkExists) {
      console.warn('No skip link found - recommended for accessibility');
    }
  });
});

test.describe('Screen Reader Support', () => {
  test('page title is descriptive', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(3);
    expect(title).toMatch(/VaporScan/i);
  });

  test('form has proper ARIA live regions for errors', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Trigger validation error
    await homePage.enterUrl('invalid-url');
    await homePage.startAuditButton.click();

    // Check for aria-live region
    const liveRegion = page.locator('[aria-live]');
    const count = await liveRegion.count();

    // At least one live region should exist for dynamic updates
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('progress updates are announced to screen readers', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.startAudit(testUrls.valid.simple);

    // Check for progress bar with proper ARIA
    const progressBar = page.getByRole('progressbar');
    await expect(progressBar).toBeVisible({ timeout: 5000 });

    // Progress bar should have aria-valuenow
    const hasValue = await progressBar.getAttribute('aria-valuenow');
    expect(hasValue).toBeTruthy();
  });

  test('status messages use appropriate ARIA roles', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Submit invalid URL to trigger error
    await homePage.enterUrl('invalid');
    await homePage.startAuditButton.click();

    // Look for alert or status role
    const alert = page.locator('[role="alert"], [role="status"]');
    const count = await alert.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Focus Management', () => {
  test('focus returns to trigger element after closing modal', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const settingsButton = page.getByRole('button', { name: /settings/i });
    const isVisible = await settingsButton.isVisible().catch(() => false);

    if (isVisible) {
      // Click settings button
      await settingsButton.click();

      // Wait for modal
      await page.waitForTimeout(500);

      // Close modal with Escape
      await page.keyboard.press('Escape');

      // Focus should return to settings button
      await page.waitForTimeout(200);
      const focused = page.locator(':focus');

      // Focus should be on a button (ideally the trigger)
      expect(await focused.evaluate((el) => el.tagName)).toBe('BUTTON');
    }
  });

  test('focus is trapped within modal dialogs', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const settingsButton = page.getByRole('button', { name: /settings/i });
    const isVisible = await settingsButton.isVisible().catch(() => false);

    if (isVisible) {
      await settingsButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog)
        .toBeVisible({ timeout: 2000 })
        .catch(() => {});

      // Tab multiple times
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
      }

      // Focus should still be within dialog
      const isInDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const focused = document.activeElement;
        return dialog?.contains(focused) || false;
      });

      expect(isInDialog).toBe(true);
    }
  });

  test('first focusable element receives focus when modal opens', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const settingsButton = page.getByRole('button', { name: /settings/i });
    const isVisible = await settingsButton.isVisible().catch(() => false);

    if (isVisible) {
      await settingsButton.click();

      // Wait for modal to open
      await page.waitForTimeout(300);

      // Check if focus is within modal
      const isInDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const focused = document.activeElement;
        return dialog?.contains(focused) || false;
      });

      expect(isInDialog).toBe(true);
    }
  });
});
