# End-to-End Testing Guidelines for VaporScan

## 🎯 Mission Statement

As an End-to-End Testing Agent, your mission is to ensure VaporScan works flawlessly from the user's perspective across all supported browsers and devices. You will validate complete user journeys, critical business flows, cross-browser compatibility, and real-world scenarios following industry gold standards.

---

## 📋 Table of Contents

1. [E2E Testing Overview](#e2e-testing-overview)
2. [Testing Framework & Tools](#testing-framework--tools)
3. [E2E Testing Strategy](#e2e-testing-strategy)
4. [Test Environment Setup](#test-environment-setup)
5. [File Organization](#file-organization)
6. [Page Object Model (POM)](#page-object-model-pom)
7. [Test Scenarios & User Journeys](#test-scenarios--user-journeys)
8. [Critical Business Flows](#critical-business-flows)
9. [Cross-Browser Testing](#cross-browser-testing)
10. [Mobile & Responsive Testing](#mobile--responsive-testing)
11. [Accessibility Testing](#accessibility-testing)
12. [Performance Testing](#performance-testing)
13. [Visual Regression Testing](#visual-regression-testing)
14. [Error Scenarios & Edge Cases](#error-scenarios--edge-cases)
15. [Test Data Management](#test-data-management)
16. [Assertions & Verifications](#assertions--verifications)
17. [Debugging & Troubleshooting](#debugging--troubleshooting)
18. [CI/CD Integration](#cicd-integration)
19. [Best Practices](#best-practices)
20. [Code Review Checklist](#code-review-checklist)

---

## 🌐 E2E Testing Overview

### Definition

End-to-End tests validate the entire application flow from the user's perspective, testing the complete stack including UI, API, database (IndexedDB), and external services.

### Key Characteristics

| Aspect           | E2E Tests                                |
| ---------------- | ---------------------------------------- |
| **Scope**        | Complete user journeys                   |
| **Environment**  | Real browser, real DOM                   |
| **Dependencies** | Minimal mocking (only external services) |
| **Speed**        | Slow (2-30+ seconds per test)            |
| **Complexity**   | High                                     |
| **Coverage**     | 10% of test suite                        |
| **Purpose**      | Validate critical business flows         |

### What E2E Tests Validate

✅ **Complete User Journeys**: Landing → Input → Crawl → Results → Export
✅ **Cross-Browser Compatibility**: Chrome, Firefox, Safari, Edge
✅ **Responsive Design**: Desktop, tablet, mobile viewports
✅ **Accessibility**: Keyboard navigation, screen readers, ARIA
✅ **Performance**: Page load times, Web Vitals, responsiveness
✅ **Visual Regression**: UI consistency across changes
✅ **Real Network Conditions**: Slow 3G, offline mode
✅ **IndexedDB Persistence**: Data survives page refresh
✅ **Service Worker**: Background sync, offline capabilities

---

## 🛠️ Testing Framework & Tools

### Primary Stack

**Test Framework**: Playwright 1.40+

- Multi-browser support (Chromium, Firefox, WebKit)
- Auto-waiting and retry logic
- Network interception
- Screenshots and videos
- Trace viewer for debugging

### Configuration

Located at: [playwright.config.ts](../playwright.config.ts)

```typescript
// Key Configuration:
{
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
}
```

### Development Tools

```bash
# Run tests
npm run test:e2e

# Run in UI mode (recommended for development)
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Show test report
npx playwright show-report
```

---

## 🎯 E2E Testing Strategy

### Test Pyramid Position

```
        E2E (10%)     ← YOU ARE HERE
      /          \      (Critical paths only)
  Integration (30%)
 /                  \
   Unit Tests (60%)
```

### Testing Philosophy

1. **User-Centric**: Test what users do, not implementation details
2. **Critical Paths First**: Focus on revenue/value-generating flows
3. **Real Conditions**: Test in realistic network/device conditions
4. **Fast Feedback**: Parallelize tests, fail fast
5. **Minimal Flakiness**: Robust selectors, proper waits, retry logic

### Test Selection Criteria

Only write E2E tests for:

- ✅ Critical business flows (happy paths)
- ✅ High-risk user journeys
- ✅ Cross-browser compatibility requirements
- ✅ Features that failed in production
- ✅ Complex multi-step workflows

Do NOT write E2E tests for:

- ❌ Simple UI components (unit test)
- ❌ Input validation (unit/integration test)
- ❌ Edge cases that can be unit tested
- ❌ Every possible user path (combinatorial explosion)

---

## 🏗️ Test Environment Setup

### Local Development

```bash
# Install Playwright browsers
npx playwright install

# Start development server
npm run dev

# Run E2E tests (in another terminal)
npm run test:e2e
```

### Test Server Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Environment Variables

```bash
# .env.test
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_TEST_MODE=true
```

---

## 📁 File Organization

### Directory Structure

```
VaporScan/
└── tests/
    └── e2e/
        ├── specs/                              # Test specifications
        │   ├── critical-paths/
        │   │   ├── happy-path.spec.ts
        │   │   ├── crawl-workflow.spec.ts
        │   │   └── export-report.spec.ts
        │   ├── features/
        │   │   ├── url-input.spec.ts
        │   │   ├── settings.spec.ts
        │   │   └── results-filtering.spec.ts
        │   ├── accessibility/
        │   │   ├── keyboard-navigation.spec.ts
        │   │   └── screen-reader.spec.ts
        │   └── cross-browser/
        │       └── compatibility.spec.ts
        ├── pages/                              # Page Object Models
        │   ├── home.page.ts
        │   ├── scan.page.ts
        │   ├── report.page.ts
        │   └── settings.page.ts
        ├── fixtures/                           # Test data
        │   ├── test-urls.ts
        │   ├── mock-crawl-data.ts
        │   └── sample-sitemaps.ts
        ├── helpers/                            # Utilities
        │   ├── test-helpers.ts
        │   ├── network-conditions.ts
        │   └── accessibility-helpers.ts
        └── setup/
            ├── global-setup.ts
            └── global-teardown.ts
```

### Naming Conventions

```typescript
// Test files: [feature].spec.ts
crawl-workflow.spec.ts
export-report.spec.ts
settings-management.spec.ts

// Page objects: [page-name].page.ts
home.page.ts
scan.page.ts
report.page.ts
```

---

## 📄 Page Object Model (POM)

### Why Use POM?

- **Maintainability**: UI changes update in one place
- **Reusability**: Share page logic across tests
- **Readability**: Tests read like user stories
- **Type Safety**: TypeScript autocomplete and validation

### POM Structure

```typescript
// tests/e2e/pages/home.page.ts
import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly urlInput: Locator;
  readonly startCrawlButton: Locator;
  readonly settingsButton: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.urlInput = page.getByPlaceholder(/enter website url/i);
    this.startCrawlButton = page.getByRole('button', { name: /start crawl/i });
    this.settingsButton = page.getByRole('button', { name: /settings/i });
    this.themeToggle = page.getByRole('button', { name: /toggle theme/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async enterUrl(url: string) {
    await this.urlInput.fill(url);
  }

  async startCrawl(url: string) {
    await this.enterUrl(url);
    await this.startCrawlButton.click();
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
}
```

### Using Page Objects in Tests

```typescript
// tests/e2e/specs/critical-paths/crawl-workflow.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { ScanPage } from '../../pages/scan.page';
import { ReportPage } from '../../pages/report.page';

test.describe('Complete Crawl Workflow', () => {
  test('should successfully crawl a website and display results', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);
    const reportPage = new ReportPage(page);

    // Navigate to home
    await homePage.goto();

    // Start crawl
    await homePage.startCrawl('https://example.com');

    // Wait for crawl to complete
    await scanPage.waitForCrawlCompletion();

    // Verify results
    await expect(scanPage.resultsTable).toBeVisible();
    await expect(scanPage.crawlSummary).toContainText(/pages found/i);

    // Navigate to report
    await scanPage.viewReport();

    // Verify report page
    await expect(reportPage.reportTitle).toBeVisible();
    await expect(reportPage.orphanPagesSection).toBeVisible();
  });
});
```

### Advanced Page Object Patterns

```typescript
// tests/e2e/pages/scan.page.ts
import { Page, Locator } from '@playwright/test';

export class ScanPage {
  readonly page: Page;
  readonly progressBar: Locator;
  readonly progressText: Locator;
  readonly resultsTable: Locator;
  readonly crawlSummary: Locator;
  readonly viewReportButton: Locator;
  readonly stopCrawlButton: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.progressBar = page.getByRole('progressbar');
    this.progressText = page.getByTestId('progress-text');
    this.resultsTable = page.getByRole('table');
    this.crawlSummary = page.getByTestId('crawl-summary');
    this.viewReportButton = page.getByRole('button', { name: /view report/i });
    this.stopCrawlButton = page.getByRole('button', { name: /stop/i });
    this.exportButton = page.getByRole('button', { name: /export/i });
  }

  async waitForCrawlCompletion(timeout = 30000) {
    await this.progressText.waitFor({ state: 'visible' });
    await this.page.waitForFunction(
      () => {
        const text = document.querySelector('[data-testid="progress-text"]')?.textContent;
        return text?.includes('100%') || text?.includes('Complete');
      },
      { timeout }
    );
  }

  async waitForCrawlStart() {
    await this.progressBar.waitFor({ state: 'visible' });
  }

  async stopCrawl() {
    await this.stopCrawlButton.click();
  }

  async viewReport() {
    await this.viewReportButton.click();
  }

  async exportAs(format: 'csv' | 'json' | 'pdf') {
    await this.exportButton.click();
    await this.page.getByRole('menuitem', { name: new RegExp(format, 'i') }).click();
  }

  async getPageCount(): Promise<number> {
    const summaryText = await this.crawlSummary.textContent();
    const match = summaryText?.match(/(\d+)\s+pages/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  async filterResultsByStatus(status: '200' | '404' | '500') {
    await this.page.getByLabel(/filter by status/i).selectOption(status);
  }
}
```

---

## 🗺️ Test Scenarios & User Journeys

### Critical Path Tests

#### 1. Happy Path: Complete Crawl Flow

```typescript
// tests/e2e/specs/critical-paths/happy-path.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { ScanPage } from '../../pages/scan.page';
import { ReportPage } from '../../pages/report.page';

test.describe('Happy Path: Complete Website Crawl', () => {
  test('user can crawl a website, view results, and export report', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);
    const reportPage = new ReportPage(page);

    // Step 1: Land on homepage
    await homePage.goto();
    await expect(page).toHaveTitle(/VaporScan/i);

    // Step 2: Enter target URL
    await homePage.enterUrl('https://example.com');

    // Step 3: Start crawl
    await homePage.startCrawlButton.click();

    // Step 4: Verify crawl starts
    await scanPage.waitForCrawlStart();
    await expect(scanPage.progressBar).toBeVisible();

    // Step 5: Wait for crawl completion
    await scanPage.waitForCrawlCompletion();

    // Step 6: Verify results displayed
    await expect(scanPage.resultsTable).toBeVisible();
    const pageCount = await scanPage.getPageCount();
    expect(pageCount).toBeGreaterThan(0);

    // Step 7: View detailed report
    await scanPage.viewReport();
    await expect(reportPage.reportTitle).toBeVisible();

    // Step 8: Export as CSV
    const downloadPromise = page.waitForEvent('download');
    await reportPage.exportAs('csv');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
```

#### 2. Settings Configuration Flow

```typescript
// tests/e2e/specs/features/settings.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { SettingsPage } from '../../pages/settings.page';

test.describe('Settings Configuration', () => {
  test('user can configure crawl settings and persist them', async ({ page }) => {
    const homePage = new HomePage(page);
    const settingsPage = new SettingsPage(page);

    await homePage.goto();
    await homePage.openSettings();

    // Configure settings
    await settingsPage.setConcurrency(10);
    await settingsPage.setCrawlDelay(500);
    await settingsPage.toggleRespectRobots(true);
    await settingsPage.save();

    // Verify success message
    await expect(settingsPage.successMessage).toBeVisible();
    await settingsPage.close();

    // Refresh page
    await page.reload();

    // Verify settings persisted
    await homePage.openSettings();
    await expect(settingsPage.concurrencyInput).toHaveValue('10');
    await expect(settingsPage.crawlDelayInput).toHaveValue('500');
    await expect(settingsPage.respectRobotsCheckbox).toBeChecked();
  });
});
```

---

## 🎯 Critical Business Flows

### Flow 1: First-Time User Onboarding

```typescript
// tests/e2e/specs/critical-paths/first-time-user.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';

test.describe('First-Time User Experience', () => {
  test('new user sees onboarding and can complete first crawl', async ({ page, context }) => {
    // Clear storage to simulate first-time user
    await context.clearCookies();
    await context.clearPermissions();

    const homePage = new HomePage(page);
    await homePage.goto();

    // Verify onboarding tour appears
    const onboardingModal = page.getByTestId('onboarding-modal');
    await expect(onboardingModal).toBeVisible();

    // Go through onboarding steps
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /get started/i }).click();

    // Verify onboarding dismissed
    await expect(onboardingModal).not.toBeVisible();

    // Perform first crawl
    await homePage.startCrawl('https://example.com');

    // Verify success
    const scanPage = new ScanPage(page);
    await scanPage.waitForCrawlCompletion();
    await expect(scanPage.resultsTable).toBeVisible();
  });
});
```

### Flow 2: Data Persistence Across Sessions

```typescript
// tests/e2e/specs/critical-paths/data-persistence.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { ScanPage } from '../../pages/scan.page';
import { ReportPage } from '../../pages/report.page';

test.describe('Data Persistence', () => {
  test('crawl results persist across page refreshes', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);
    const reportPage = new ReportPage(page);

    // Perform crawl
    await homePage.goto();
    await homePage.startCrawl('https://example.com');
    await scanPage.waitForCrawlCompletion();

    // Get initial page count
    const initialPageCount = await scanPage.getPageCount();

    // Refresh page
    await page.reload();

    // Verify data persisted
    await expect(scanPage.resultsTable).toBeVisible();
    const persistedPageCount = await scanPage.getPageCount();
    expect(persistedPageCount).toBe(initialPageCount);

    // Navigate to report and back
    await scanPage.viewReport();
    await expect(reportPage.reportTitle).toBeVisible();

    await page.goBack();
    await expect(scanPage.resultsTable).toBeVisible();
  });
});
```

---

## 🌐 Cross-Browser Testing

### Browser-Specific Tests

```typescript
// tests/e2e/specs/cross-browser/compatibility.spec.ts
import { test, expect, devices } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  // Run on all configured browsers
  test('core functionality works across all browsers', async ({ page, browserName }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startCrawl('https://example.com');
    await scanPage.waitForCrawlCompletion();

    await expect(scanPage.resultsTable).toBeVisible();

    // Browser-specific assertions
    if (browserName === 'webkit') {
      // Safari-specific checks
      await expect(page).toHaveScreenshot('safari-results.png');
    }
  });

  test('service worker registration works across browsers', async ({ page, browserName }) => {
    await page.goto('/');

    // Check service worker support
    const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);

    if (browserName === 'chromium' || browserName === 'firefox') {
      expect(swSupported).toBe(true);
    }

    if (swSupported) {
      // Wait for service worker registration
      await page.waitForFunction(() => navigator.serviceWorker.ready);

      const swRegistered = await page.evaluate(() => navigator.serviceWorker.controller !== null);
      expect(swRegistered).toBe(true);
    }
  });
});
```

---

## 📱 Mobile & Responsive Testing

### Mobile Viewport Tests

````typescript
// tests/e2e/specs/responsive/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.use({ ...devices['iPhone 12'] });

  test('mobile user can perform crawl', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();

    // Verify mobile layout
    const hamburgerMenu = page.getByRole('button', { name: /menu/i });
    await expect(hamburgerMenu).toBeVisible();

    // Enter URL (mobile keyboard)
    await homePage.urlInput.tap();
    await homePage.urlInput.fill('https://example.com');

    // Start crawl
    await homePage.startCrawlButton.tap();

    // Verify progress on mobile
    await expect(scanPage.progressBar).toBeVisible();
    await scanPage.waitForCrawlCompletion();

    // Verify results in mobile view
    await expect(scanPage.resultsTable).toBeVisible();

    // Test horizontal scroll if needed
    const table = scanPage.resultsTable;
    await table.scrollIntoViewIfNeeded();
  });

  test('mobile navigation menu works correctly', async ({ page }) => {
    await page.goto('/');

    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();

    // Verify menu items
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /settings/i })).toBeVisible();

    // Close menu
    await page.getByRole('button', { name: /close/i }).click();
    await expect(nav).not.toBeVisible();
  });
});

### Responsive Design Tests

```typescript
// tests/e2e/specs/responsive/breakpoints.spec.ts
import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

viewports.forEach(({ name, width, height }) => {
  test.describe(`${name} viewport (${width}x${height})`, () => {
    test.use({ viewport: { width, height } });

    test('layout adapts correctly', async ({ page }) => {
      await page.goto('/');

      // Take screenshot for visual regression
      await expect(page).toHaveScreenshot(`${name}-homepage.png`);

      // Verify responsive elements
      if (name === 'mobile') {
        await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
      } else {
        await expect(page.getByRole('navigation')).toBeVisible();
      }
    });
  });
});
````

---

## ♿ Accessibility Testing

### Keyboard Navigation

```typescript
// tests/e2e/specs/accessibility/keyboard-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('user can navigate entire app using keyboard only', async ({ page }) => {
    await page.goto('/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAccessibleName(/skip to content/i);

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveRole('textbox');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveRole('button');

    // Fill form with keyboard
    await page.keyboard.type('https://example.com');
    await page.keyboard.press('Enter');

    // Verify crawl started
    const scanPage = new ScanPage(page);
    await expect(scanPage.progressBar).toBeVisible();
  });

  test('modal dialog traps focus', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Open settings modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Open settings

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Tab through modal elements
    await page.keyboard.press('Tab');
    const firstInput = page.locator(':focus');
    const firstInputId = await firstInput.getAttribute('id');

    // Tab until we loop back
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    const currentFocus = page.locator(':focus');
    const currentId = await currentFocus.getAttribute('id');

    // Verify focus is still within modal
    expect(await currentFocus.isVisible()).toBe(true);
    expect(await dialog.locator(':focus').count()).toBe(1);

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
```

### ARIA and Semantic HTML

```typescript
// tests/e2e/specs/accessibility/aria.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ARIA and Semantics', () => {
  test('all interactive elements have accessible names', async ({ page }) => {
    await page.goto('/');

    // Verify buttons have accessible names
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName =
        (await button.getAttribute('aria-label')) || (await button.textContent());
      expect(accessibleName).toBeTruthy();
    }
  });

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/');

    const urlInput = page.getByRole('textbox', { name: /url/i });
    await expect(urlInput).toBeVisible();

    // Verify label association
    const labelId = await urlInput.getAttribute('aria-labelledby');
    if (labelId) {
      const label = page.locator(`#${labelId}`);
      await expect(label).toBeVisible();
    }
  });

  test('proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check heading levels
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/VaporScan/i);

    // Verify no skipped heading levels
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const levels = await Promise.all(
      headings.map((h) => h.evaluate((el) => parseInt(el.tagName[1])))
    );

    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });
});
```

---

## ⚡ Performance Testing

### Web Vitals Monitoring

```typescript
// tests/e2e/specs/performance/web-vitals.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Metrics', () => {
  test('page meets Web Vitals thresholds', async ({ page }) => {
    await page.goto('/');

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};

          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            }
          });

          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

        // Timeout after 10s
        setTimeout(() => resolve({}), 10000);
      });
    });

    // Assert Web Vitals thresholds
    if (metrics.FCP) {
      expect(metrics.FCP).toBeLessThan(1800); // FCP < 1.8s
    }
    if (metrics.LCP) {
      expect(metrics.LCP).toBeLessThan(2500); // LCP < 2.5s
    }
  });

  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Page load < 3s
  });

  test('crawl progress updates smoothly', async ({ page }) => {
    const homePage = new HomePage(page);
    const scanPage = new ScanPage(page);

    await homePage.goto();
    await homePage.startCrawl('https://example.com');

    // Monitor progress updates
    const progressUpdates: number[] = [];

    const progressText = scanPage.progressText;

    for (let i = 0; i < 10; i++) {
      const text = await progressText.textContent();
      const match = text?.match(/(\d+)%/);
      if (match) {
        progressUpdates.push(parseInt(match[1]));
      }
      await page.waitForTimeout(500);
    }

    // Verify progress is increasing
    expect(progressUpdates.length).toBeGreaterThan(0);

    for (let i = 1; i < progressUpdates.length; i++) {
      expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1]);
    }
  });
});
```

---

## 👁️ Visual Regression Testing

### Screenshot Comparison

```typescript
// tests/e2e/specs/visual/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('homepage appears correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Full page screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow minor differences
    });
  });

  test('report dashboard matches baseline', async ({ page }) => {
    // Pre-populate with test data
    await page.goto('/report/test-report-123');
    await page.waitForLoadState('networkidle');

    // Screenshot specific section
    const dashboard = page.getByTestId('report-dashboard');
    await expect(dashboard).toHaveScreenshot('report-dashboard.png');
  });

  test('dark mode styling is correct', async ({ page }) => {
    await page.goto('/');

    // Switch to dark mode
    await page.getByRole('button', { name: /toggle theme/i }).click();
    await page.waitForTimeout(300); // Wait for animation

    await expect(page).toHaveScreenshot('homepage-dark.png');
  });

  test('mobile layout matches design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page).toHaveScreenshot('mobile-homepage.png');
  });
});
```

---

## 🚨 Error Scenarios & Edge Cases

### Network Error Handling

```typescript
// tests/e2e/specs/error-scenarios/network-errors.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Network Error Handling', () => {
  test('handles offline mode gracefully', async ({ page, context }) => {
    await page.goto('/');

    // Go offline
    await context.setOffline(true);

    const homePage = new HomePage(page);
    await homePage.startCrawl('https://example.com');

    // Verify error message
    const errorMessage = page.getByText(/network error|offline/i);
    await expect(errorMessage).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Retry
    await page.getByRole('button', { name: /retry/i }).click();

    // Verify success
    const scanPage = new ScanPage(page);
    await expect(scanPage.progressBar).toBeVisible();
  });

  test('handles slow network conditions', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay
      await route.continue();
    });

    await page.goto('/', { timeout: 60000 });

    const homePage = new HomePage(page);
    await homePage.startCrawl('https://example.com');

    // Verify loading indicator
    await expect(page.getByText(/loading/i)).toBeVisible();
  });

  test('handles CORS errors appropriately', async ({ page }) => {
    await page.goto('/');

    const homePage = new HomePage(page);

    // Mock CORS error
    await page.route('**/api/**', (route) => {
      route.abort('cors');
    });

    await homePage.startCrawl('https://cors-blocked-site.com');

    // Verify CORS error message
    const errorMessage = page.getByText(/cors|cross-origin/i);
    await expect(errorMessage).toBeVisible();

    // Verify helpful suggestion
    await expect(page.getByText(/add.*access-control-allow-origin/i)).toBeVisible();
  });
});
```

### Invalid Input Handling

```typescript
// tests/e2e/specs/error-scenarios/invalid-input.spec.ts
import { test, expect } from '@playwright/test';

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
      await homePage.urlInput.fill(url);
      await homePage.startCrawlButton.click();

      // Verify validation error
      const errorMessage = page.getByText(/invalid url/i);
      await expect(errorMessage).toBeVisible();

      // Clear for next iteration
      await homePage.urlInput.clear();
    }
  });

  test('prevents XSS attempts in URL input', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const xssAttempt = '<script>alert("XSS")</script>';
    await homePage.urlInput.fill(xssAttempt);
    await homePage.startCrawlButton.click();

    // Verify XSS blocked
    const errorMessage = page.getByText(/invalid url/i);
    await expect(errorMessage).toBeVisible();

    // Verify no script execution
    page.on('dialog', () => {
      throw new Error('XSS vulnerability: alert dialog appeared');
    });
  });
});
```

---

## 📊 Test Data Management

### Test Fixtures

```typescript
// tests/e2e/fixtures/test-urls.ts
export const testUrls = {
  valid: {
    simple: 'https://example.com',
    withSubdomain: 'https://www.example.com',
    withPath: 'https://example.com/path/to/page',
    withQuery: 'https://example.com?param=value',
    withFragment: 'https://example.com#section',
  },
  invalid: {
    noProtocol: 'example.com',
    wrongProtocol: 'ftp://example.com',
    malformed: 'htp://example..com',
    javascript: 'javascript:void(0)',
    empty: '',
  },
};

// tests/e2e/fixtures/mock-crawl-data.ts
export const mockCrawlData = {
  smallSite: {
    url: 'https://small-site.com',
    pages: [
      { url: '/', status: 200, title: 'Home' },
      { url: '/about', status: 200, title: 'About' },
      { url: '/contact', status: 200, title: 'Contact' },
    ],
  },
  largeSite: {
    url: 'https://large-site.com',
    pages: Array.from({ length: 1000 }, (_, i) => ({
      url: `/page-${i}`,
      status: 200,
      title: `Page ${i}`,
    })),
  },
};
```

### Setup and Teardown

```typescript
// tests/e2e/setup/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Seed test data
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('test-data-seeded', 'true');
  });

  await browser.close();
}

export default globalSetup;

// tests/e2e/setup/global-teardown.ts
async function globalTeardown() {
  // Clean up test data
  console.log('Cleaning up test data...');
}

export default globalTeardown;
```

---

## ✅ Assertions & Verifications

### Best Practices

```typescript
// ✅ GOOD: Auto-waiting assertions
await expect(page.getByRole('button')).toBeVisible();
await expect(page.getByText('Success')).toBeVisible({ timeout: 5000 });

// ❌ BAD: Manual waits before assertions
await page.waitForTimeout(1000);
expect(await page.locator('button').isVisible()).toBe(true);

// ✅ GOOD: Semantic queries
await expect(page.getByRole('button', { name: /submit/i })).toBeEnabled();

// ❌ BAD: CSS selectors
await expect(page.locator('.btn-primary')).toBeEnabled();

// ✅ GOOD: Flexible text matching
await expect(page.getByText(/pages? found/i)).toBeVisible();

// ❌ BAD: Exact text matching
await expect(page.getByText('5 pages found')).toBeVisible();
```

---

## 🐛 Debugging & Troubleshooting

### Debug Tools

```bash
# Run in headed mode
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run specific test
npx playwright test happy-path.spec.ts

# Show trace viewer
npx playwright show-trace trace.zip
```

### Debugging in Tests

```typescript
test('debug example', async ({ page }) => {
  await page.goto('/');

  // Pause execution
  await page.pause();

  // Add console logs
  console.log(await page.title());

  // Take screenshot
  await page.screenshot({ path: 'debug.png' });

  // Start tracing
  await page.context().tracing.start({ screenshots: true, snapshots: true });

  // ... test steps ...

  await page.context().tracing.stop({ path: 'trace.zip' });
});
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📋 Best Practices

### Do's

✅ Test user flows, not implementation
✅ Use Page Object Model for maintainability
✅ Write deterministic tests (no race conditions)
✅ Use semantic queries (getByRole, getByLabel)
✅ Add retries for flaky network conditions
✅ Take screenshots/videos on failure
✅ Test across browsers and devices
✅ Verify accessibility compliance
✅ Monitor performance metrics
✅ Keep tests independent

### Don'ts

❌ Don't use fixed waits (page.waitForTimeout)
❌ Don't rely on CSS selectors
❌ Don't test every edge case (use unit tests)
❌ Don't make tests interdependent
❌ Don't ignore flaky tests
❌ Don't skip cross-browser testing
❌ Don't forget mobile testing
❌ Don't hard-code test data
❌ Don't over-test (follow 10% rule)

---

## ✓ Code Review Checklist

Before submitting E2E tests:

### Test Quality

- [ ] Tests validate complete user journeys
- [ ] Page Object Model used consistently
- [ ] Semantic queries used (getByRole, etc.)
- [ ] Auto-waiting assertions used
- [ ] No fixed timeouts (waitForTimeout)

### Coverage

- [ ] Critical business flows tested
- [ ] Happy path covered
- [ ] Error scenarios handled
- [ ] Cross-browser tests included
- [ ] Mobile/responsive tests included
- [ ] Accessibility tested

### Reliability

- [ ] Tests are deterministic
- [ ] No flaky tests
- [ ] Proper cleanup in hooks
- [ ] Network mocking where appropriate
- [ ] Tests run in parallel safely

### Performance

- [ ] Tests complete in reasonable time
- [ ] Only critical paths tested
- [ ] No unnecessary waits
- [ ] Efficient selectors used

### Documentation

- [ ] Test names are descriptive
- [ ] Complex flows have comments
- [ ] README updated if needed

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

---

## 📝 Summary

As an End-to-End Testing Agent, you must:

1. **Test critical user journeys** end-to-end
2. **Use Page Object Model** for maintainable tests
3. **Validate cross-browser** compatibility
4. **Test responsive design** on mobile and desktop
5. **Ensure accessibility** with keyboard and screen readers
6. **Monitor performance** with Web Vitals
7. **Handle errors gracefully** with proper messaging
8. **Use semantic queries** for robust selectors
9. **Automate visual regression** with screenshots
10. **Integrate with CI/CD** for continuous validation

**Gold Standard**: Your E2E tests should provide confidence that VaporScan works flawlessly in production for all users, across all browsers and devices.
