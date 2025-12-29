# Integration Testing Guidelines for VaporScan

## 🎯 Mission Statement

As an Integration Testing Agent, your mission is to ensure that VaporScan's components, modules, and systems work together seamlessly. You will verify data flows, component interactions, state management, API integrations, and cross-module communication following industry gold standards and best practices.

---

## 📋 Table of Contents

1. [Integration Testing Overview](#integration-testing-overview)
2. [Testing Framework & Tools](#testing-framework--tools)
3. [Integration Testing Strategy](#integration-testing-strategy)
4. [Scope & Boundaries](#scope--boundaries)
5. [File Organization](#file-organization)
6. [Testing Patterns](#testing-patterns)
7. [Component Integration](#component-integration)
8. [State Management Integration](#state-management-integration)
9. [Data Flow Testing](#data-flow-testing)
10. [Service Worker Integration](#service-worker-integration)
11. [IndexedDB Integration](#indexeddb-integration)
12. [API Integration Testing](#api-integration-testing)
13. [Router Integration](#router-integration)
14. [Form Integration Testing](#form-integration-testing)
15. [Multi-Component Workflows](#multi-component-workflows)
16. [Mock Service Worker (MSW)](#mock-service-worker-msw)
17. [Performance Integration Tests](#performance-integration-tests)
18. [Error Boundary Integration](#error-boundary-integration)
19. [Code Review Checklist](#code-review-checklist)

---

## 🌐 Integration Testing Overview

### Definition

Integration tests verify that multiple units work together correctly. They test the **interactions** between components, modules, and systems rather than isolated units.

### Key Differences from Unit Tests

| Aspect           | Unit Tests                | Integration Tests              |
| ---------------- | ------------------------- | ------------------------------ |
| **Scope**        | Single function/component | Multiple components/modules    |
| **Dependencies** | Heavily mocked            | Partially mocked/real          |
| **Speed**        | Very fast (< 100ms)       | Moderate (100ms - 2s)          |
| **Complexity**   | Low                       | Medium to High                 |
| **Purpose**      | Verify logic correctness  | Verify interaction correctness |
| **Coverage**     | 60% of test suite         | 30% of test suite              |

### What Integration Tests Verify

✅ **Component Communication**: Parent-child data flow, prop drilling, context sharing
✅ **State Management**: Zustand store updates affecting multiple components
✅ **Data Persistence**: IndexedDB operations with UI updates
✅ **Service Worker**: Background crawling with UI synchronization
✅ **Form Submission**: Input → validation → submission → success/error states
✅ **Navigation**: Route changes with state preservation
✅ **API Contracts**: Fetch → parse → display → error handling
✅ **Event Chains**: User action → multiple component updates

---

## 🛠️ Testing Framework & Tools

### Core Stack

- **Test Runner**: Vitest 4.x
- **Component Testing**: @testing-library/react 16.x
- **User Interactions**: @testing-library/user-event 14.x
- **API Mocking**: MSW (Mock Service Worker) 2.x
- **State Testing**: Zustand test utilities
- **Router Testing**: Next.js navigation mocks

### Additional Tools

```json
{
  "testing-library/jest-dom": "^6.1.5", // DOM assertions
  "testing-library/react": "^16.3.1", // React testing utilities
  "testing-library/user-event": "^14.5.1", // User interaction simulation
  "msw": "^2.0.11", // API mocking
  "vitest": "^4.0.16" // Test runner
}
```

### Test Environment Configuration

```typescript
// vitest.config.ts (already configured)
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
});
```

---

## 🎯 Integration Testing Strategy

### Test Pyramid Balance

```
        E2E (10%)
      /          \
  Integration (30%)  ← YOU ARE HERE
 /                  \
   Unit Tests (60%)
```

### Integration Test Characteristics

1. **Realistic Context**: Use actual providers (React Query, Zustand, Theme)
2. **Partial Mocking**: Mock external APIs, use real internal modules
3. **User-Centric**: Test from user's perspective using Testing Library
4. **Moderate Speed**: Aim for < 2 seconds per test
5. **Clear Scenarios**: Test complete user journeys (mini E2E)

### Layered Approach

```
┌─────────────────────────────────────┐
│   L4: Multi-Page Flows              │  ← E2E Territory
├─────────────────────────────────────┤
│   L3: Feature Workflows             │  ← Complex Integration
├─────────────────────────────────────┤
│   L2: Component Groups              │  ← Standard Integration
├─────────────────────────────────────┤
│   L1: Component + Hook              │  ← Simple Integration
└─────────────────────────────────────┘
```

---

## 🎪 Scope & Boundaries

### What to Integration Test

#### 1. Component Trees

```typescript
// Test: UrlInput → Form → Validation → Submit → Loading → Success
// File: src/components/features/UrlInput/__integration__/url-input-workflow.test.tsx
```

#### 2. State Management Flows

```typescript
// Test: User action → Zustand store update → Multiple components re-render
// File: src/lib/hooks/__integration__/crawl-store-integration.test.ts
```

#### 3. Data Persistence

```typescript
// Test: Crawl → Save to IndexedDB → Page refresh → Load from IndexedDB → Display
// File: src/lib/storage/__integration__/persistence-flow.test.ts
```

#### 4. Service Worker Integration

```typescript
// Test: Start crawl → Service worker picks up → Progress updates → Complete
// File: src/lib/crawler/__integration__/service-worker-crawl.test.ts
```

#### 5. API Workflows

```typescript
// Test: Fetch sitemap → Parse → Display URLs → Error handling
// File: src/lib/crawler/__integration__/sitemap-workflow.test.ts
```

### What NOT to Integration Test

❌ **Simple UI rendering** (unit test territory)
❌ **Pure logic functions** (unit test territory)
❌ **Full user journeys** (E2E test territory)
❌ **Cross-browser behavior** (E2E test territory)
❌ **Performance benchmarks** (dedicated performance tests)

---

## 📁 File Organization

### Recommended Structure

```
VaporScan/
├── src/
│   ├── components/
│   │   └── features/
│   │       └── UrlInput/
│   │           ├── index.tsx
│   │           ├── index.test.tsx                    ← Unit tests
│   │           └── __integration__/
│   │               └── url-input-workflow.test.tsx   ← Integration tests
│   ├── lib/
│   │   ├── crawler/
│   │   │   ├── crawl-orchestrator.ts
│   │   │   ├── crawl-orchestrator.test.ts            ← Unit tests
│   │   │   └── __integration__/
│   │   │       ├── crawler-flow.test.ts              ← Integration tests
│   │   │       └── service-worker-sync.test.ts
│   │   └── hooks/
│   │       ├── useCrawlStore.ts
│   │       ├── useCrawlStore.test.ts                 ← Unit tests
│   │       └── __integration__/
│   │           └── store-component-sync.test.ts      ← Integration tests
└── tests/
    ├── integration/
    │   ├── workflows/                                 ← Complex workflows
    │   │   ├── complete-crawl-workflow.test.ts
    │   │   └── export-report-workflow.test.ts
    │   └── helpers/
    │       ├── render-with-providers.tsx
    │       ├── msw-handlers.ts
    │       └── test-store.ts
    └── fixtures/
        ├── mock-api-responses.ts
        └── sample-crawl-data.ts
```

### Naming Conventions

```typescript
// Pattern: [feature]-[aspect].integration.test.tsx
crawl - workflow.integration.test.ts;
store - persistence.integration.test.ts;
form - submission.integration.test.tsx;

// Or use __integration__ folders
__integration__ / crawler - flow.test.ts;
sitemap - parsing.test.ts;
```

---

## 🎨 Testing Patterns

### 1. Render with Providers Pattern

```typescript
// tests/integration/helpers/render-with-providers.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    queryClient?: QueryClient;
    initialTheme?: 'light' | 'dark';
  }
) {
  const queryClient = options?.queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme={options?.initialTheme || 'light'}>
        {ui}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Usage:
renderWithProviders(<App />);
```

### 2. Test Store Pattern

```typescript
// tests/integration/helpers/test-store.ts
import { createStore } from 'zustand';
import { CrawlStore } from '@/lib/hooks/useCrawlStore';

export function createTestCrawlStore(initialState?: Partial<CrawlStore>) {
  return createStore<CrawlStore>((set) => ({
    pages: [],
    isActive: false,
    progress: 0,
    startCrawl: () => set({ isActive: true }),
    stopCrawl: () => set({ isActive: false }),
    addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),
    ...initialState,
  }));
}

// Usage:
const store = createTestCrawlStore({ pages: mockPages });
```

### 3. MSW Setup Pattern

```typescript
// tests/integration/helpers/msw-handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock sitemap endpoint
  http.get('https://example.com/sitemap.xml', () => {
    return HttpResponse.xml(`
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/page1</loc></url>
        <url><loc>https://example.com/page2</loc></url>
      </urlset>
    `);
  }),

  // Mock robots.txt
  http.get('https://example.com/robots.txt', () => {
    return HttpResponse.text(`
      User-agent: *
      Disallow: /admin
      Sitemap: https://example.com/sitemap.xml
    `);
  }),

  // Mock page crawl
  http.get('https://example.com/:path*', ({ params }) => {
    return HttpResponse.html(`
      <html>
        <head><title>Test Page</title></head>
        <body>
          <a href="/page1">Page 1</a>
          <a href="/page2">Page 2</a>
        </body>
      </html>
    `);
  }),
];

// tests/integration/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './helpers/msw-handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 🧩 Component Integration

### Parent-Child Communication

```typescript
// src/components/features/CrawlProgress/__integration__/progress-update.test.tsx
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { screen, waitFor } from '@testing-library/react';
import { CrawlProgress } from '../index';
import { useCrawlStore } from '@/lib/hooks/useCrawlStore';

describe('CrawlProgress Integration', () => {
  it('should update progress when store changes', async () => {
    const { rerender } = renderWithProviders(<CrawlProgress />);

    // Initial state
    expect(screen.getByText(/0%/i)).toBeInTheDocument();

    // Simulate store update
    act(() => {
      useCrawlStore.getState().setProgress(50);
    });

    // Verify UI updates
    await waitFor(() => {
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
  });

  it('should show completed state when crawl finishes', async () => {
    renderWithProviders(<CrawlProgress />);

    act(() => {
      useCrawlStore.getState().setProgress(100);
      useCrawlStore.getState().stopCrawl();
    });

    await waitFor(() => {
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download report/i })).toBeEnabled();
    });
  });
});
```

### Multi-Component Interaction

```typescript
// src/components/features/__integration__/crawl-dashboard.test.tsx
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrawlDashboard } from '../CrawlDashboard';

describe('Crawl Dashboard Integration', () => {
  it('should coordinate between UrlInput, Progress, and Results', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CrawlDashboard />);

    // Step 1: Enter URL
    const input = screen.getByLabelText(/enter url/i);
    await user.type(input, 'https://example.com');

    // Step 2: Start crawl
    const startButton = screen.getByRole('button', { name: /start crawl/i });
    await user.click(startButton);

    // Step 3: Verify progress component appears
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Step 4: Wait for completion (mocked)
    await waitFor(() => {
      expect(screen.getByText(/crawl complete/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Step 5: Verify results are displayed
    expect(screen.getByText(/pages found/i)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
```

---

## 🏪 State Management Integration

### Zustand Store Integration

```typescript
// src/lib/hooks/__integration__/crawl-store-components.test.tsx
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { screen, waitFor } from '@testing-library/react';
import { useCrawlStore } from '../useCrawlStore';
import { CrawlButton } from '@/components/features/CrawlButton';
import { CrawlStatus } from '@/components/features/CrawlStatus';

describe('Crawl Store Integration', () => {
  it('should sync state between multiple components', async () => {
    const user = userEvent.setup();

    const TestApp = () => (
      <>
        <CrawlButton />
        <CrawlStatus />
      </>
    );

    renderWithProviders(<TestApp />);

    // Initial state: not crawling
    expect(screen.getByText(/idle/i)).toBeInTheDocument();

    // Click start button
    const startButton = screen.getByRole('button', { name: /start/i });
    await user.click(startButton);

    // Verify both components reflect new state
    await waitFor(() => {
      expect(screen.getByText(/crawling/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });
  });

  it('should persist state across component unmount/remount', async () => {
    const { unmount, rerender } = renderWithProviders(<CrawlStatus />);

    // Set state
    act(() => {
      useCrawlStore.getState().addPage({
        url: '/test',
        status: 200,
        links: [],
      });
    });

    // Unmount component
    unmount();

    // Remount component
    rerender(<CrawlStatus />);

    // Verify state persisted
    await waitFor(() => {
      expect(screen.getByText(/1 page/i)).toBeInTheDocument();
    });
  });
});
```

### TanStack Query Integration

```typescript
// src/lib/hooks/__integration__/use-sitemap-query.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSitemapQuery } from '../useSitemapQuery';
import { server } from '@/tests/integration/setup';
import { http, HttpResponse } from 'msw';

describe('useSitemapQuery Integration', () => {
  it('should fetch and cache sitemap data', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useSitemapQuery('https://example.com/sitemap.xml'),
      { wrapper }
    );

    // Initial loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify data
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0]).toBe('https://example.com/page1');

    // Verify cache
    const cachedData = queryClient.getQueryData(['sitemap', 'https://example.com/sitemap.xml']);
    expect(cachedData).toEqual(result.current.data);
  });

  it('should handle fetch errors gracefully', async () => {
    // Override handler to return error
    server.use(
      http.get('https://example.com/sitemap.xml', () => {
        return HttpResponse.error();
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useSitemapQuery('https://example.com/sitemap.xml'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

---

## 🌊 Data Flow Testing

### Form → Validation → Submission Flow

```typescript
// src/components/features/UrlInput/__integration__/form-submission.test.tsx
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UrlInputForm } from '../UrlInputForm';

describe('URL Input Form Integration', () => {
  it('should validate and submit URL', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(<UrlInputForm onSubmit={onSubmit} />);

    // Invalid URL
    const input = screen.getByLabelText(/url/i);
    await user.type(input, 'invalid-url');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Verify validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();

    // Valid URL
    await user.clear(input);
    await user.type(input, 'https://example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Verify submission
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        url: 'https://example.com',
      });
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<UrlInputForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText(/url/i);
    await user.type(input, 'https://example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Verify loading state
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
    });
  });
});
```

---

## 👷 Service Worker Integration

### Background Crawling Integration

```typescript
// src/lib/crawler/__integration__/service-worker-crawl.test.ts
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { screen, waitFor } from '@testing-library/react';
import { CrawlOrchestrator } from '../CrawlOrchestrator';

// Mock Service Worker
const mockServiceWorker = {
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
};

describe('Service Worker Crawl Integration', () => {
  beforeEach(() => {
    // Mock service worker registration
    global.navigator.serviceWorker = {
      ready: Promise.resolve({
        active: mockServiceWorker,
      }),
    } as any;
  });

  it('should communicate with service worker during crawl', async () => {
    const orchestrator = new CrawlOrchestrator();

    await orchestrator.startCrawl('https://example.com');

    // Verify message sent to service worker
    expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({
      type: 'START_CRAWL',
      payload: { url: 'https://example.com' },
    });
  });

  it('should update UI when service worker reports progress', async () => {
    renderWithProviders(<CrawlDashboard />);

    // Start crawl
    const startButton = screen.getByRole('button', { name: /start/i });
    await userEvent.click(startButton);

    // Simulate service worker progress message
    const progressEvent = new MessageEvent('message', {
      data: {
        type: 'CRAWL_PROGRESS',
        payload: { completed: 5, total: 10 },
      },
    });

    act(() => {
      window.dispatchEvent(progressEvent);
    });

    // Verify UI update
    await waitFor(() => {
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
  });
});
```

---

## 💾 IndexedDB Integration

### Data Persistence Flow

```typescript
// src/lib/storage/__integration__/indexeddb-persistence.test.ts
import { openDB } from 'idb';
import { saveCrawlResult, loadCrawlResults } from '../indexed-db';
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { ReportDashboard } from '@/components/features/ReportDashboard';

describe('IndexedDB Persistence Integration', () => {
  beforeEach(async () => {
    // Clear IndexedDB before each test
    const db = await openDB('vaporscan-test', 1);
    await db.clear('crawls');
  });

  it('should save crawl results and retrieve them', async () => {
    const crawlData = {
      id: '123',
      url: 'https://example.com',
      pages: [
        { url: '/page1', status: 200 },
        { url: '/page2', status: 404 },
      ],
      timestamp: Date.now(),
    };

    // Save to IndexedDB
    await saveCrawlResult(crawlData);

    // Retrieve from IndexedDB
    const results = await loadCrawlResults();

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject(crawlData);
  });

  it('should load persisted data on component mount', async () => {
    // Pre-populate IndexedDB
    await saveCrawlResult({
      id: '456',
      url: 'https://test.com',
      pages: [{ url: '/home', status: 200 }],
      timestamp: Date.now(),
    });

    // Render component
    renderWithProviders(<ReportDashboard />);

    // Verify data loaded and displayed
    await waitFor(() => {
      expect(screen.getByText('https://test.com')).toBeInTheDocument();
      expect(screen.getByText('1 page')).toBeInTheDocument();
    });
  });
});
```

---

## 🌐 API Integration Testing

### Using MSW for API Mocking

```typescript
// tests/integration/api/sitemap-fetching.test.ts
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import { fetchAndParseSitemap } from '@/lib/crawler/sitemap-parser';

describe('Sitemap API Integration', () => {
  it('should fetch and parse sitemap successfully', async () => {
    server.use(
      http.get('https://example.com/sitemap.xml', () => {
        return HttpResponse.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/page1</loc></url>
            <url><loc>https://example.com/page2</loc></url>
            <url><loc>https://example.com/page3</loc></url>
          </urlset>
        `);
      })
    );

    const urls = await fetchAndParseSitemap('https://example.com/sitemap.xml');

    expect(urls).toHaveLength(3);
    expect(urls).toContain('https://example.com/page1');
  });

  it('should handle sitemap index (nested sitemaps)', async () => {
    server.use(
      http.get('https://example.com/sitemap_index.xml', () => {
        return HttpResponse.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <sitemap><loc>https://example.com/sitemap1.xml</loc></sitemap>
            <sitemap><loc>https://example.com/sitemap2.xml</loc></sitemap>
          </sitemapindex>
        `);
      }),
      http.get('https://example.com/sitemap1.xml', () => {
        return HttpResponse.xml(`
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/page1</loc></url>
          </urlset>
        `);
      }),
      http.get('https://example.com/sitemap2.xml', () => {
        return HttpResponse.xml(`
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/page2</loc></url>
          </urlset>
        `);
      })
    );

    const urls = await fetchAndParseSitemap('https://example.com/sitemap_index.xml');

    expect(urls).toHaveLength(2);
    expect(urls).toContain('https://example.com/page1');
    expect(urls).toContain('https://example.com/page2');
  });

  it('should retry on network failure', async () => {
    let attempts = 0;

    server.use(
      http.get('https://example.com/sitemap.xml', () => {
        attempts++;
        if (attempts < 3) {
          return HttpResponse.error();
        }
        return HttpResponse.xml('<urlset><url><loc>https://example.com/</loc></url></urlset>');
      })
    );

    const urls = await fetchAndParseSitemap('https://example.com/sitemap.xml', {
      retries: 3,
    });

    expect(attempts).toBe(3);
    expect(urls).toHaveLength(1);
  });
});
```

---

## 🧭 Router Integration

### Next.js Navigation Testing

```typescript
// src/app/report/__integration__/report-navigation.test.tsx
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

describe('Report Navigation Integration', () => {
  it('should navigate to report page after crawl completion', async () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({ push: mockPush });

    const user = userEvent.setup();
    renderWithProviders(<CrawlDashboard />);

    // Complete crawl
    act(() => {
      useCrawlStore.getState().setProgress(100);
      useCrawlStore.getState().stopCrawl();
      useCrawlStore.getState().setReportId('abc123');
    });

    // Click view report button
    const viewButton = screen.getByRole('button', { name: /view report/i });
    await user.click(viewButton);

    // Verify navigation
    expect(mockPush).toHaveBeenCalledWith('/report/abc123');
  });

  it('should preserve crawl state during navigation', async () => {
    const { rerender } = renderWithProviders(<ScanPage />);

    // Set crawl state
    act(() => {
      useCrawlStore.getState().addPage({ url: '/test', status: 200 });
    });

    // Simulate navigation to report page
    rerender(<ReportPage />);

    // Verify state preserved
    await waitFor(() => {
      expect(screen.getByText('/test')).toBeInTheDocument();
    });
  });
});
```

---

## 📝 Form Integration Testing

### Complex Form with Validation

```typescript
// src/components/features/SettingsForm/__integration__/settings-form.test.tsx
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsForm } from '../SettingsForm';

describe('Settings Form Integration', () => {
  it('should validate, submit, and persist settings', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsForm />);

    // Fill form
    const concurrencyInput = screen.getByLabelText(/concurrency/i);
    await user.clear(concurrencyInput);
    await user.type(concurrencyInput, '10');

    const crawlDelayInput = screen.getByLabelText(/crawl delay/i);
    await user.clear(crawlDelayInput);
    await user.type(crawlDelayInput, '500');

    const respectRobotsCheckbox = screen.getByLabelText(/respect robots\.txt/i);
    await user.click(respectRobotsCheckbox);

    // Submit
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/settings saved/i)).toBeInTheDocument();
    });

    // Verify localStorage
    const settings = JSON.parse(localStorage.getItem('crawl-settings') || '{}');
    expect(settings).toMatchObject({
      concurrency: 10,
      crawlDelay: 500,
      respectRobots: true,
    });

    // Reload component and verify persistence
    const { rerender } = renderWithProviders(<SettingsForm />);
    rerender(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/concurrency/i)).toHaveValue('10');
    });
  });
});
```

---

## 🔄 Multi-Component Workflows

### Complete Crawl Workflow

```typescript
// tests/integration/workflows/complete-crawl.test.tsx
import { renderWithProviders } from '../helpers/render-with-providers';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/app/page';

describe('Complete Crawl Workflow Integration', () => {
  it('should complete full crawl workflow: input → crawl → results → export', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    // STEP 1: Enter URL
    const urlInput = screen.getByPlaceholderText(/enter website url/i);
    await user.type(urlInput, 'https://example.com');

    // STEP 2: Configure settings
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    const concurrencySlider = screen.getByLabelText(/concurrency/i);
    await user.clear(concurrencySlider);
    await user.type(concurrencySlider, '5');

    const closeSettings = screen.getByRole('button', { name: /close/i });
    await user.click(closeSettings);

    // STEP 3: Start crawl
    const startButton = screen.getByRole('button', { name: /start crawl/i });
    await user.click(startButton);

    // STEP 4: Verify progress updates
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Wait for crawl completion (mocked to be fast)
    await waitFor(() => {
      expect(screen.getByText(/crawl complete/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // STEP 5: Verify results displayed
    const resultsTable = screen.getByRole('table');
    const rows = within(resultsTable).getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // Header + data rows

    // STEP 6: Export results
    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    const csvOption = screen.getByRole('menuitem', { name: /csv/i });
    await user.click(csvOption);

    // Verify download initiated (mocked)
    await waitFor(() => {
      expect(screen.getByText(/download started/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🎭 Mock Service Worker (MSW)

### Setup

```typescript
// tests/integration/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './helpers/msw-handlers';

export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

### Dynamic Response Handling

```typescript
// tests/integration/helpers/msw-handlers.ts
import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  // Simulate slow network
  http.get('https://slow.example.com/*', async () => {
    await delay(2000);
    return HttpResponse.html('<html><body>Slow response</body></html>');
  }),

  // Simulate intermittent failures
  http.get('https://flaky.example.com/*', () => {
    const shouldFail = Math.random() > 0.5;
    if (shouldFail) {
      return HttpResponse.error();
    }
    return HttpResponse.html('<html><body>Success</body></html>');
  }),

  // Dynamic response based on request
  http.get('https://example.com/:page', ({ params }) => {
    const { page } = params;
    return HttpResponse.html(`
      <html>
        <head><title>${page}</title></head>
        <body><h1>${page}</h1></body>
      </html>
    `);
  }),
];
```

---

## ⚡ Performance Integration Tests

### Measuring Component Performance

```typescript
// src/components/features/ReportDashboard/__integration__/performance.test.tsx
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { screen, waitFor } from '@testing-library/react';
import { ReportDashboard } from '../ReportDashboard';

describe('Report Dashboard Performance Integration', () => {
  it('should render large dataset within acceptable time', async () => {
    const startTime = performance.now();

    // Generate large dataset
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      url: `https://example.com/page${i}`,
      status: 200,
      links: [`/page${i + 1}`],
    }));

    // Pre-load data into store
    act(() => {
      useCrawlStore.getState().setPages(largeDataset);
    });

    renderWithProviders(<ReportDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in under 1 second
    expect(renderTime).toBeLessThan(1000);
  });

  it('should handle rapid state updates without lag', async () => {
    renderWithProviders(<CrawlProgress />);

    // Simulate rapid progress updates
    const updates = Array.from({ length: 100 }, (_, i) => i);

    const startTime = performance.now();

    for (const progress of updates) {
      act(() => {
        useCrawlStore.getState().setProgress(progress);
      });
    }

    await waitFor(() => {
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
    });

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // Should complete all updates in under 500ms
    expect(updateTime).toBeLessThan(500);
  });
});
```

---

## 🛡️ Error Boundary Integration

### Testing Error Recovery

```typescript
// src/components/layout/__integration__/error-boundary.test.tsx
import { renderWithProviders } from '@/tests/integration/helpers/render-with-providers';
import { screen, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('Error Boundary Integration', () => {
  it('should catch errors and display fallback UI', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should allow retry after error', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = renderWithProviders(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error displayed
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Fix the error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Click retry
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // Verify recovery
    await waitFor(() => {
      expect(screen.getByText(/no error/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
```

---

## ✓ Code Review Checklist

Before submitting integration tests for review:

### Test Quality

- [ ] Tests cover realistic user workflows
- [ ] Tests use actual providers (not mocked)
- [ ] External APIs are mocked with MSW
- [ ] Tests are deterministic and repeatable
- [ ] Tests clean up after themselves

### Test Coverage

- [ ] Component interaction flows tested
- [ ] State management integration verified
- [ ] Data persistence flows covered
- [ ] API integration scenarios tested
- [ ] Error handling and recovery tested

### Performance

- [ ] Each test completes in < 2 seconds
- [ ] Large dataset scenarios tested
- [ ] No unnecessary waits or delays
- [ ] Timers and animations mocked when needed

### Best Practices

- [ ] Tests use semantic queries (getByRole, getByLabelText)
- [ ] User events use @testing-library/user-event
- [ ] Async operations use waitFor
- [ ] Tests are well-organized and documented
- [ ] Test names clearly describe workflows

### Reliability

- [ ] No flaky tests (run 10+ times successfully)
- [ ] Proper cleanup in afterEach/afterAll
- [ ] MSW handlers reset between tests
- [ ] No race conditions or timing issues

---

## 📚 Learning Resources

- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [MSW Documentation](https://mswjs.io/docs/)
- [Integration Testing Patterns](https://martinfowler.com/bliki/IntegrationTest.html)
- [React Testing Guide](https://react.dev/learn/testing)

---

## 📝 Summary

As an Integration Testing Agent, you must:

1. **Test realistic workflows** that span multiple components/modules
2. **Use actual providers** (React Query, Zustand, Theme) in tests
3. **Mock external APIs** using MSW for consistency
4. **Verify state synchronization** across components
5. **Test data persistence** with IndexedDB
6. **Ensure error recovery** with Error Boundaries
7. **Maintain test speed** (< 2 seconds per test)
8. **Use semantic queries** for accessibility
9. **Organize tests** by workflow/feature
10. **Review against checklist** before submission

**Next Steps**: Once integration testing is complete, proceed to [e2e-testing.md](./e2e-testing.md) for end-to-end user journey testing.
