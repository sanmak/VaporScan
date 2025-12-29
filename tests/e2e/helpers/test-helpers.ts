/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * E2E Test Helper Utilities
 * Common utilities for E2E tests
 */

import { Page, BrowserContext } from '@playwright/test';

/**
 * Clear all browser storage (localStorage, sessionStorage, cookies, IndexedDB)
 */
export async function clearBrowserStorage(context: BrowserContext) {
  await context.clearCookies();
  await context.clearPermissions();

  const pages = context.pages();
  for (const page of pages) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear IndexedDB
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        if (!window.indexedDB) {
          resolve();
          return;
        }

        const dbs = window.indexedDB.databases?.() || Promise.resolve([]);
        dbs.then((databases) => {
          databases.forEach((db) => {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
            }
          });
          resolve();
        });
      });
    });
  }
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for a specific text to appear on the page
 */
export async function waitForText(page: Page, text: string | RegExp, timeout = 10000) {
  await page.waitForSelector(`text=${text}`, { timeout });
}

/**
 * Simulate slow network conditions (3G)
 */
export async function simulateSlow3G(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (750 * 1024) / 8, // 750 kb/s
    uploadThroughput: (250 * 1024) / 8, // 250 kb/s
    latency: 100, // 100ms
  });
}

/**
 * Simulate offline mode
 */
export async function goOffline(context: BrowserContext) {
  await context.setOffline(true);
}

/**
 * Go back online
 */
export async function goOnline(context: BrowserContext) {
  await context.setOffline(false);
}

/**
 * Wait for download to complete and return filename
 */
export async function waitForDownload(page: Page, triggerAction: () => Promise<void>) {
  const downloadPromise = page.waitForEvent('download');
  await triggerAction();
  const download = await downloadPromise;
  return {
    filename: download.suggestedFilename(),
    path: await download.path(),
  };
}

/**
 * Take a full page screenshot
 */
export async function takeFullPageScreenshot(page: Page, filename: string) {
  await page.screenshot({
    path: filename,
    fullPage: true,
  });
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Scroll element into view if needed
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, selector);
}

/**
 * Get computed style of an element
 */
export async function getComputedStyle(
  page: Page,
  selector: string,
  property: string
): Promise<string> {
  return await page.evaluate(
    ({ sel, prop }) => {
      const element = document.querySelector(sel);
      if (!element) return '';
      return window.getComputedStyle(element).getPropertyValue(prop);
    },
    { sel: selector, prop: property }
  );
}

/**
 * Wait for animation to complete
 */
export async function waitForAnimation(page: Page, timeout = 1000) {
  await page.waitForTimeout(timeout);
}

/**
 * Check if service worker is registered
 */
export async function isServiceWorkerRegistered(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
  });
}

/**
 * Get IndexedDB data
 */
export async function getIndexedDBData(
  page: Page,
  dbName: string,
  storeName: string
): Promise<unknown[]> {
  return await page.evaluate(
    ({ db, store }) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(db);

        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(store, 'readonly');
          const objectStore = transaction.objectStore(store);
          const getAllRequest = objectStore.getAll();

          getAllRequest.onsuccess = () => {
            resolve(getAllRequest.result);
          };

          getAllRequest.onerror = () => {
            reject(getAllRequest.error);
          };
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    },
    { db: dbName, store: storeName }
  );
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  url: string | RegExp,
  response: unknown,
  status = 200
) {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Intercept and fail API requests
 */
export async function failApiRequest(
  page: Page,
  url: string | RegExp,
  errorCode:
    | 'failed'
    | 'aborted'
    | 'timedout'
    | 'accessdenied'
    | 'connectionclosed'
    | 'connectionreset'
    | 'connectionrefused'
    | 'connectionaborted'
    | 'connectionfailed'
    | 'namenotresolved'
    | 'internetdisconnected'
    | 'addressunreachable'
    | 'blockedbyclient'
    | 'blockedbyresponse'
) {
  await page.route(url, (route) => {
    route.abort(errorCode);
  });
}

/**
 * Get page performance metrics
 */
export async function getPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      domContentLoaded:
        navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      firstPaint: paint.find((entry) => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint:
        paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,
    };
  });
}

/**
 * Wait for Web Vitals to be available
 */
export async function getWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals: Record<string, number> = {};
      let metricsCollected = 0;
      const totalMetrics = 3; // FCP, LCP, CLS

      if ('PerformanceObserver' in window) {
        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
              metricsCollected++;
            }
          });
          if (metricsCollected === totalMetrics) resolve(vitals);
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            vitals.LCP = entries[entries.length - 1].startTime;
            metricsCollected++;
          }
          if (metricsCollected === totalMetrics) resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let cls = 0;
          list.getEntries().forEach((entry) => {
            if ('hadRecentInput' in entry && 'value' in entry && !entry.hadRecentInput) {
              cls += entry.value as number;
            }
          });
          vitals.CLS = cls;
          metricsCollected++;
          if (metricsCollected === totalMetrics) resolve(vitals);
        }).observe({ entryTypes: ['layout-shift'] });

        // Timeout after 10 seconds
        setTimeout(() => resolve(vitals), 10000);
      } else {
        resolve({});
      }
    });
  });
}

/**
 * Simulate user typing with realistic delays
 */
export async function typeRealistic(page: Page, selector: string, text: string) {
  const element = page.locator(selector);
  await element.click();

  for (const char of text) {
    await element.type(char);
    await page.waitForTimeout(Math.random() * 100 + 50); // 50-150ms per character
  }
}

/**
 * Check console errors
 */
export function setupConsoleErrorListener(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return errors;
}
