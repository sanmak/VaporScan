/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Accessibility Testing Helpers
 * Utilities for testing keyboard navigation, ARIA, and screen reader compatibility
 */

import { Page, Locator } from '@playwright/test';

/**
 * Tab through all focusable elements and collect them
 */
export async function tabThroughFocusableElements(page: Page, maxTabs = 50): Promise<string[]> {
  const focusedElements: string[] = [];

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      const text = el.textContent?.trim().substring(0, 50) || '';

      return `${tag}${role ? `[role=${role}]` : ''}${ariaLabel ? ` "${ariaLabel}"` : ''} ${text}`;
    });

    if (focusedElement) {
      focusedElements.push(focusedElement);
    }
  }

  return focusedElements;
}

/**
 * Check if focus is trapped within a specific element (e.g., modal)
 */
export async function isFocusTrappedIn(page: Page, containerSelector: string): Promise<boolean> {
  const initialFocus = await page.evaluate((selector) => {
    const container = document.querySelector(selector);
    return container?.contains(document.activeElement) || false;
  }, containerSelector);

  // Tab forward multiple times
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);
  }

  const stillInContainer = await page.evaluate((selector) => {
    const container = document.querySelector(selector);
    return container?.contains(document.activeElement) || false;
  }, containerSelector);

  return initialFocus && stillInContainer;
}

/**
 * Test keyboard navigation for a specific interactive element
 */
export async function testKeyboardInteraction(
  element: Locator,
  key: 'Enter' | 'Space' | 'Escape' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
): Promise<void> {
  await element.focus();
  await element.press(key);
}

/**
 * Get all ARIA attributes of an element
 */
export async function getAriaAttributes(
  page: Page,
  selector: string
): Promise<Record<string, string>> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return {};

    const ariaAttrs: Record<string, string> = {};
    for (const attr of element.attributes) {
      if (attr.name.startsWith('aria-')) {
        ariaAttrs[attr.name] = attr.value;
      }
    }
    return ariaAttrs;
  }, selector);
}

/**
 * Check if element has proper accessible name
 */
export async function hasAccessibleName(element: Locator): Promise<boolean> {
  const ariaLabel = await element.getAttribute('aria-label');
  const ariaLabelledby = await element.getAttribute('aria-labelledby');
  const textContent = await element.textContent();

  return Boolean(ariaLabel || ariaLabelledby || (textContent && textContent.trim().length > 0));
}

/**
 * Verify heading hierarchy (no skipped levels)
 */
export async function checkHeadingHierarchy(
  page: Page
): Promise<{ valid: boolean; issues: string[] }> {
  return await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const levels = headings.map((h) => parseInt(h.tagName[1]));
    const issues: string[] = [];

    // Check for h1
    if (!levels.includes(1)) {
      issues.push('No h1 heading found on page');
    }

    // Check for multiple h1s
    const h1Count = levels.filter((l) => l === 1).length;
    if (h1Count > 1) {
      issues.push(`Multiple h1 headings found (${h1Count})`);
    }

    // Check for skipped levels
    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1];
      if (diff > 1) {
        issues.push(`Heading level skipped: h${levels[i - 1]} to h${levels[i]}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  });
}

/**
 * Check for proper label associations on form inputs
 */
export async function checkFormLabels(
  page: Page
): Promise<{ valid: boolean; unlabeledInputs: string[] }> {
  return await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select')).filter((el) => {
      // Exclude hidden inputs
      const input = el as HTMLInputElement;
      return input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button';
    });

    const unlabeledInputs: string[] = [];

    inputs.forEach((input) => {
      const hasLabel = Boolean(
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby') ||
        document.querySelector(`label[for="${input.id}"]`) ||
        input.closest('label')
      );

      if (!hasLabel) {
        unlabeledInputs.push(
          input.getAttribute('name') || input.getAttribute('id') || input.tagName
        );
      }
    });

    return {
      valid: unlabeledInputs.length === 0,
      unlabeledInputs,
    };
  });
}

/**
 * Check color contrast ratios (simplified check)
 */
export async function checkColorContrast(
  page: Page,
  selector: string
): Promise<{ foreground: string; background: string }> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return { foreground: '', background: '' };

    const styles = window.getComputedStyle(element);
    return {
      foreground: styles.color,
      background: styles.backgroundColor,
    };
  }, selector);
}

/**
 * Find all interactive elements without accessible names
 */
export async function findUnaccessibleInteractiveElements(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
    );

    const unaccessible: string[] = [];

    interactiveElements.forEach((el) => {
      const hasAccessibleName = Boolean(
        el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby') ||
        el.textContent?.trim() ||
        el.getAttribute('alt') ||
        el.getAttribute('title')
      );

      if (!hasAccessibleName) {
        const selector = el.id
          ? `#${el.id}`
          : el.className
            ? `.${el.className.split(' ')[0]}`
            : el.tagName.toLowerCase();
        unaccessible.push(selector);
      }
    });

    return unaccessible;
  });
}

/**
 * Check if page has skip link
 */
export async function hasSkipLink(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const skipLink = document.querySelector('a[href="#main"], a[href="#content"]');
    return skipLink !== null;
  });
}

/**
 * Test modal dialog accessibility
 */
export async function testModalAccessibility(
  page: Page,
  dialogSelector: string
): Promise<{
  hasRole: boolean;
  hasAriaLabel: boolean;
  trapsFocus: boolean;
  closesOnEscape: boolean;
}> {
  const dialog = page.locator(dialogSelector);

  const hasRole = (await dialog.getAttribute('role')) === 'dialog';
  const hasAriaLabel = Boolean(
    (await dialog.getAttribute('aria-label')) || (await dialog.getAttribute('aria-labelledby'))
  );

  // Test focus trap
  await dialog.focus();
  const trapsFocus = await isFocusTrappedIn(page, dialogSelector);

  // Test escape key
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const closesOnEscape = !(await dialog.isVisible().catch(() => false));

  return {
    hasRole,
    hasAriaLabel,
    trapsFocus,
    closesOnEscape,
  };
}

/**
 * Get landmark regions
 */
export async function getLandmarkRegions(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const landmarks = document.querySelectorAll(
      '[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer'
    );

    return Array.from(landmarks).map((el) => {
      const role = el.getAttribute('role') || el.tagName.toLowerCase();
      const label = el.getAttribute('aria-label') || '';
      return label ? `${role} (${label})` : role;
    });
  });
}

/**
 * Check if images have alt text
 */
export async function checkImageAltText(
  page: Page
): Promise<{ valid: boolean; imagesWithoutAlt: number }> {
  return await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const withoutAlt = images.filter((img) => !img.hasAttribute('alt'));

    return {
      valid: withoutAlt.length === 0,
      imagesWithoutAlt: withoutAlt.length,
    };
  });
}

/**
 * Navigate using only keyboard
 */
export async function navigateWithKeyboard(page: Page, targetText: string): Promise<boolean> {
  let found = false;
  const maxTabs = 100;

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);

    const currentText = await page.evaluate(() => {
      return document.activeElement?.textContent?.trim() || '';
    });

    if (currentText.includes(targetText)) {
      found = true;
      break;
    }
  }

  if (found) {
    await page.keyboard.press('Enter');
    return true;
  }

  return false;
}
