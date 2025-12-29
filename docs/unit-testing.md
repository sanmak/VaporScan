# Unit Testing Guidelines for VaporScan

## 🎯 Mission Statement

As a Unit Testing Agent, your mission is to ensure every atomic unit of VaporScan's codebase is thoroughly tested, reliable, and maintainable. You will follow industry gold standards, implement best practices, and achieve comprehensive coverage while maintaining test quality and performance.

---

## 📋 Table of Contents

1. [Testing Framework & Tools](#testing-framework--tools)
2. [Coverage Requirements](#coverage-requirements)
3. [Testing Strategy](#testing-strategy)
4. [File Organization](#file-organization)
5. [Naming Conventions](#naming-conventions)
6. [Unit Testing Scope](#unit-testing-scope)
7. [Testing Patterns & Best Practices](#testing-patterns--best-practices)
8. [Mock Strategy](#mock-strategy)
9. [Assertion Guidelines](#assertion-guidelines)
10. [Test Data Management](#test-data-management)
11. [Performance Considerations](#performance-considerations)
12. [Accessibility Testing](#accessibility-testing)
13. [Error Handling Tests](#error-handling-tests)
14. [Code Review Checklist](#code-review-checklist)

---

## 🛠️ Testing Framework & Tools

### Primary Stack

- **Test Runner**: Vitest 4.x
- **Testing Library**: @testing-library/react 16.x
- **Assertion Library**: Vitest (built-in expect)
- **Mocking**: Vitest (vi)
- **Coverage**: @vitest/coverage-v8
- **DOM Testing**: jsdom

### Configuration

Located at: [vitest.config.ts](../vitest.config.ts)

```typescript
// Key Configuration Points:
- Environment: jsdom (for browser-like environment)
- Setup File: tests/setup.ts
- Coverage Provider: v8
- Coverage Threshold: 80% (lines, functions, branches, statements)
```

### Setup File

Located at: [tests/setup.ts](../tests/setup.ts)

Provides:

- Global test utilities (@testing-library/jest-dom)
- Cleanup after each test
- Global mocks (fetch, localStorage)
- Custom matchers

---

## 📊 Coverage Requirements

### Minimum Thresholds

```typescript
{
  lines: 80%,
  functions: 80%,
  branches: 80%,
  statements: 80%
}
```

### Coverage Focus Areas

#### CRITICAL (95-100% Coverage Required)

- Core crawler logic ([src/lib/crawler/](../src/lib/crawler/))
  - `crawl-orchestrator.ts`
  - `sitemap-parser.ts`
  - `link-extractor.ts`
  - `orphan-detector.ts`
  - `report-generator.ts`
- Utility functions ([src/lib/utils/](../src/lib/utils/))
- Data storage layer ([src/lib/storage/indexed-db.ts](../src/lib/storage/indexed-db.ts))
- State management ([src/lib/hooks/useCrawlStore.ts](../src/lib/hooks/useCrawlStore.ts))

#### HIGH (85-95% Coverage)

- React hooks ([src/lib/hooks/](../src/lib/hooks/))
- Export utilities ([src/lib/utils/export.ts](../src/lib/utils/export.ts))
- CORS detection ([src/lib/utils/cors-detection.ts](../src/lib/utils/cors-detection.ts))
- Logger ([src/lib/logger.ts](../src/lib/logger.ts))

#### MODERATE (80-85% Coverage)

- UI Components ([src/components/ui/](../src/components/ui/))
- Feature components ([src/components/features/](../src/components/features/))
- Layout components ([src/components/layout/](../src/components/layout/))

### Exclusions

- Type definitions (`*.d.ts`)
- Storybook stories (`*.stories.tsx`)
- Test files themselves (`*.test.ts`, `*.spec.ts`)
- Configuration files

---

## 🎯 Testing Strategy

### Test Pyramid Approach

```
        E2E (10%)
      /          \
  Integration (30%)
 /                  \
   Unit Tests (60%)
```

Unit tests form the foundation and should be:

- Fast (< 100ms per test)
- Isolated (no external dependencies)
- Deterministic (same input = same output)
- Focused (test one thing at a time)

### F.I.R.S.T Principles

- **F**ast: Tests should run quickly
- **I**solated: Tests should not depend on each other
- **R**epeatable: Tests should produce consistent results
- **S**elf-validating: Tests should have clear pass/fail outcomes
- **T**imely: Tests should be written alongside or before the code

---

## 📁 File Organization

### Directory Structure

```
VaporScan/
├── src/
│   ├── lib/
│   │   ├── crawler/
│   │   │   ├── crawl-orchestrator.ts
│   │   │   ├── crawl-orchestrator.test.ts       ← Unit test
│   │   │   ├── sitemap-parser.ts
│   │   │   └── sitemap-parser.test.ts           ← Unit test
│   │   ├── utils/
│   │   │   ├── index.ts
│   │   │   └── index.test.ts                    ← Unit test
│   │   └── hooks/
│   │       ├── useCrawlStore.ts
│   │       └── useCrawlStore.test.ts            ← Unit test
│   └── components/
│       ├── ui/
│       │   ├── button.tsx
│       │   └── button.test.tsx                  ← Component test
│       └── features/
│           ├── UrlInput/
│           │   ├── index.tsx
│           │   └── index.test.tsx               ← Component test
└── tests/
    ├── setup.ts                                  ← Global setup
    ├── helpers/                                  ← Test helpers
    └── fixtures/                                 ← Test data
```

### Co-location Strategy

- Place unit test files **next to the source file** they test
- Use `.test.ts` or `.test.tsx` extension
- Mirror the source file name exactly

**Example:**

```
src/lib/crawler/sitemap-parser.ts
src/lib/crawler/sitemap-parser.test.ts  ✅
```

---

## 🏷️ Naming Conventions

### Test File Naming

```typescript
// Source: button.tsx
// Test: button.test.tsx ✅

// Source: crawl-orchestrator.ts
// Test: crawl-orchestrator.test.ts ✅
```

### Test Suite Naming

```typescript
describe('ComponentName', () => {
  // For React components
});

describe('functionName', () => {
  // For functions
});

describe('ClassName', () => {
  // For classes
});

describe('lib/utils', () => {
  // For utility modules
});
```

### Test Case Naming

Use descriptive, behavior-driven names:

```typescript
// ✅ GOOD: Describes behavior and expected outcome
it('should parse sitemap XML and extract all URLs', () => {});
it('should throw error when sitemap is malformed', () => {});
it('should respect robots.txt crawl delay directive', () => {});

// ❌ BAD: Too vague
it('works', () => {});
it('test sitemap', () => {});
it('should parse', () => {});
```

### Pattern: Given-When-Then

```typescript
describe('sitemapParser', () => {
  describe('parseSitemap', () => {
    it('should extract URLs when given valid sitemap XML', () => {
      // Given: valid sitemap XML
      // When: parseSitemap is called
      // Then: returns array of URLs
    });

    it('should throw SitemapError when given malformed XML', () => {
      // Given: malformed XML
      // When: parseSitemap is called
      // Then: throws SitemapError
    });
  });
});
```

---

## 🔬 Unit Testing Scope

### What to Unit Test

#### 1. Pure Functions

```typescript
// src/lib/utils/url-normalizer.ts
export function normalizeUrl(url: string): string {
  // Pure logic - MUST test
}

// Test file: url-normalizer.test.ts
describe('normalizeUrl', () => {
  it('should remove trailing slashes', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
  });

  it('should handle query parameters', () => {
    expect(normalizeUrl('https://example.com?a=1&b=2')).toBe('https://example.com?a=1&b=2');
  });

  it('should convert to lowercase', () => {
    expect(normalizeUrl('https://EXAMPLE.COM')).toBe('https://example.com');
  });
});
```

#### 2. Business Logic

```typescript
// src/lib/crawler/orphan-detector.ts
export function detectOrphanPages(
  crawledPages: CrawlResult[],
  sitemapUrls: string[]
): OrphanPage[] {
  // Complex business logic - MUST test thoroughly
}

// Test scenarios:
// - Pages with no incoming links
// - Pages not in sitemap
// - Pages with incoming links but not in sitemap
// - Edge cases: empty arrays, null values
```

#### 3. Data Transformations

```typescript
// src/lib/utils/export.ts
export function convertToCSV(data: CrawlResult[]): string {
  // Data transformation - MUST test
}

// Test:
// - Valid data
// - Empty array
// - Special characters (commas, quotes)
// - Unicode characters
// - Large datasets
```

#### 4. React Components (Isolated)

```typescript
// src/components/ui/button.tsx
export function Button({ children, onClick, variant }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

// Test:
// - Renders correctly
// - Handles click events
// - Applies correct variant styles
// - Accessibility attributes
```

#### 5. Custom Hooks

```typescript
// src/lib/hooks/useCrawlStore.ts
export function useCrawlStore() {
  // State management logic - MUST test
}

// Test:
// - Initial state
// - State updates
// - Derived state
// - Side effects (mocked)
```

### What NOT to Unit Test

❌ **Third-party libraries** (trust they're tested)
❌ **Framework internals** (Next.js, React)
❌ **Complex integration flows** (save for integration tests)
❌ **Network calls** (mock them)
❌ **Browser APIs** (mock them)
❌ **UI rendering details** (save for E2E)

---

## 🎨 Testing Patterns & Best Practices

### 1. AAA Pattern (Arrange-Act-Assert)

```typescript
describe('linkExtractor', () => {
  it('should extract all internal links from HTML', () => {
    // ARRANGE: Set up test data and dependencies
    const html = `
      <html>
        <body>
          <a href="/page1">Page 1</a>
          <a href="https://example.com/page2">Page 2</a>
          <a href="https://external.com">External</a>
        </body>
      </html>
    `;
    const baseUrl = 'https://example.com';

    // ACT: Execute the function under test
    const links = extractInternalLinks(html, baseUrl);

    // ASSERT: Verify the expected outcome
    expect(links).toHaveLength(2);
    expect(links).toContain('/page1');
    expect(links).toContain('https://example.com/page2');
  });
});
```

### 2. Test Isolation

```typescript
// ✅ GOOD: Each test is independent
describe('CrawlStore', () => {
  beforeEach(() => {
    // Reset state before each test
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const store = createCrawlStore();
    expect(store.getState().pages).toEqual([]);
  });

  it('should add page to state', () => {
    const store = createCrawlStore();
    store.getState().addPage({ url: '/test', status: 200 });
    expect(store.getState().pages).toHaveLength(1);
  });
});

// ❌ BAD: Tests depend on execution order
describe('CrawlStore', () => {
  const store = createCrawlStore(); // Shared across tests

  it('should initialize with empty state', () => {
    expect(store.getState().pages).toEqual([]); // Passes first
  });

  it('should add page to state', () => {
    store.getState().addPage({ url: '/test', status: 200 });
    expect(store.getState().pages).toHaveLength(1); // Works
  });

  it('should initialize with empty state again', () => {
    expect(store.getState().pages).toEqual([]); // FAILS! State polluted
  });
});
```

### 3. Test Data Builders

```typescript
// tests/fixtures/crawl-result.builder.ts
export class CrawlResultBuilder {
  private result: Partial<CrawlResult> = {
    url: 'https://example.com',
    status: 200,
    links: [],
    timestamp: Date.now(),
  };

  withUrl(url: string): this {
    this.result.url = url;
    return this;
  }

  withStatus(status: number): this {
    this.result.status = status;
    return this;
  }

  withLinks(links: string[]): this {
    this.result.links = links;
    return this;
  }

  build(): CrawlResult {
    return this.result as CrawlResult;
  }
}

// Usage in tests:
const crawlResult = new CrawlResultBuilder().withUrl('https://test.com').withStatus(404).build();
```

### 4. Parameterized Tests

```typescript
describe('urlValidator', () => {
  it.each([
    ['https://example.com', true],
    ['http://example.com', true],
    ['ftp://example.com', false],
    ['invalid-url', false],
    ['', false],
    [null, false],
  ])('should validate %s as %s', (url, expected) => {
    expect(isValidUrl(url)).toBe(expected);
  });
});
```

### 5. Testing Async Code

```typescript
describe('fetchSitemap', () => {
  it('should fetch and parse sitemap successfully', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<urlset>...</urlset>',
    });

    // Test async function
    const result = await fetchSitemap('https://example.com/sitemap.xml');

    expect(result).toHaveLength(3);
    expect(fetch).toHaveBeenCalledWith('https://example.com/sitemap.xml');
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchSitemap('https://example.com/sitemap.xml')).rejects.toThrow('Network error');
  });
});
```

### 6. Testing React Components

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply correct variant class', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('button-destructive');
  });
});
```

---

## 🎭 Mock Strategy

### When to Mock

1. **External Dependencies**: APIs, databases, file system
2. **Browser APIs**: localStorage, fetch, IndexedDB
3. **Time-dependent code**: Date.now(), setTimeout
4. **Random functions**: Math.random()
5. **Complex dependencies**: Heavy computations, third-party services

### Mocking with Vitest

#### 1. Mocking Functions

```typescript
import { vi } from 'vitest';

describe('userService', () => {
  it('should call API with correct parameters', async () => {
    // Create mock
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: 'Test' }),
    });

    // Replace global fetch
    global.fetch = mockFetch;

    // Test
    const user = await fetchUser(1);

    // Verify
    expect(mockFetch).toHaveBeenCalledWith('/api/users/1');
    expect(user.name).toBe('Test');
  });
});
```

#### 2. Mocking Modules

```typescript
// Mock entire module
vi.mock('../lib/storage/indexed-db', () => ({
  saveToDb: vi.fn(),
  loadFromDb: vi.fn(),
}));

// Use in test
import { saveToDb } from '../lib/storage/indexed-db';

it('should save data to IndexedDB', async () => {
  (saveToDb as any).mockResolvedValue(true);

  await saveCrawlResult(data);

  expect(saveToDb).toHaveBeenCalledWith('crawls', data);
});
```

#### 3. Mocking Timers

```typescript
describe('delayedFunction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute callback after delay', () => {
    const callback = vi.fn();

    delayedFunction(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

#### 4. Spying on Methods

```typescript
describe('Logger', () => {
  it('should log error messages', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('Test error');

    expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'Test error');

    consoleSpy.mockRestore();
  });
});
```

### Mock Best Practices

✅ **Clear mocks between tests**

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

✅ **Restore mocks after tests**

```typescript
afterEach(() => {
  vi.restoreAllMocks();
});
```

✅ **Use realistic mock data**

```typescript
// ✅ GOOD
const mockResponse = {
  ok: true,
  status: 200,
  headers: new Headers(),
  json: async () => ({ users: [...] }),
};

// ❌ BAD
const mockResponse = { users: [] };
```

---

## ✅ Assertion Guidelines

### Use Appropriate Matchers

```typescript
// Equality
expect(value).toBe(5); // Strict equality (===)
expect(object).toEqual({ a: 1 }); // Deep equality
expect(value).toBeDefined(); // Not undefined
expect(value).toBeNull(); // Exactly null
expect(value).toBeTruthy(); // Truthy value
expect(value).toBeFalsy(); // Falsy value

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(0.3); // Floating point

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');
expect(str).toHaveLength(10);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toContainEqual({ id: 1 }); // Deep equality

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', 'value');
expect(obj).toMatchObject({ a: 1 }); // Partial match

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(Error);

// DOM (with @testing-library/jest-dom)
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toHaveTextContent('text');
expect(element).toHaveAttribute('href', '/path');
expect(element).toBeDisabled();
```

### Assertion Best Practices

✅ **Be specific**

```typescript
// ✅ GOOD
expect(users).toHaveLength(3);
expect(users[0]).toMatchObject({ id: 1, name: 'Alice' });

// ❌ BAD
expect(users.length > 0).toBe(true);
```

✅ **Test behavior, not implementation**

```typescript
// ✅ GOOD
expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();

// ❌ BAD
expect(component.find('.btn-submit').exists()).toBe(true);
```

✅ **Use meaningful error messages**

```typescript
expect(result, 'Result should contain 5 items').toHaveLength(5);
```

---

## 📦 Test Data Management

### 1. Fixture Files

```typescript
// tests/fixtures/sitemap.xml.ts
export const validSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;

export const malformedSitemap = `<?xml version="1.0"?>
<urlset>
  <url>
    <loc>https://example.com/page1
  </url>`;

// Usage:
import { validSitemap, malformedSitemap } from '@/tests/fixtures/sitemap.xml';
```

### 2. Factory Functions

```typescript
// tests/factories/crawl-result.factory.ts
export function createCrawlResult(overrides?: Partial<CrawlResult>): CrawlResult {
  return {
    url: 'https://example.com',
    status: 200,
    title: 'Test Page',
    links: [],
    crawledAt: Date.now(),
    ...overrides,
  };
}

// Usage:
const result = createCrawlResult({ status: 404, url: '/broken' });
```

### 3. Test Helpers

```typescript
// tests/helpers/render.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// Usage:
renderWithProviders(<MyComponent />);
```

---

## ⚡ Performance Considerations

### Fast Tests

✅ **Keep tests under 100ms each**

```typescript
// Use fake timers instead of real delays
vi.useFakeTimers();
vi.advanceTimersByTime(1000); // Instant

// Not:
await new Promise((resolve) => setTimeout(resolve, 1000)); // Slow
```

✅ **Minimize setup/teardown**

```typescript
// ✅ GOOD: Shared setup
beforeAll(() => {
  // Heavy one-time setup
});

// ❌ BAD: Repeated heavy setup
beforeEach(() => {
  // Complex initialization repeated for each test
});
```

✅ **Mock expensive operations**

```typescript
// Mock complex calculations
vi.mock('../lib/utils/heavy-computation', () => ({
  complexCalculation: vi.fn(() => 42),
}));
```

### Parallel Execution

Vitest runs tests in parallel by default. Ensure:

- Tests don't share global state
- Tests don't modify the same files
- Mocks are scoped to each test

---

## ♿ Accessibility Testing

### Testing Semantic HTML

```typescript
import { render, screen } from '@testing-library/react';

describe('Navigation', () => {
  it('should use semantic nav element', () => {
    render(<Navigation />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should have accessible labels', () => {
    render(<Button aria-label="Close dialog" />);
    expect(screen.getByLabelText(/close dialog/i)).toBeInTheDocument();
  });
});
```

### Keyboard Navigation

```typescript
import userEvent from '@testing-library/user-event';

describe('Modal', () => {
  it('should close on Escape key', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<Modal onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('should trap focus within modal', async () => {
    render(<Modal><button>First</button><button>Last</button></Modal>);

    const firstButton = screen.getByRole('button', { name: /first/i });
    const lastButton = screen.getByRole('button', { name: /last/i });

    firstButton.focus();
    await userEvent.tab();
    expect(lastButton).toHaveFocus();

    await userEvent.tab();
    expect(firstButton).toHaveFocus(); // Focus loops back
  });
});
```

---

## 🚨 Error Handling Tests

### Testing Error Boundaries

```typescript
describe('ErrorBoundary', () => {
  it('should catch and display errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(container).toHaveTextContent('Something went wrong');
  });
});
```

### Testing Error States

```typescript
describe('fetchData', () => {
  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchData()).rejects.toThrow('Network error');
  });

  it('should handle invalid responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchData()).rejects.toThrow('Internal Server Error');
  });
});
```

---

## ✓ Code Review Checklist

Before submitting tests for review, ensure:

### Coverage

- [ ] All public functions have tests
- [ ] All branches are covered
- [ ] Edge cases are tested
- [ ] Error paths are tested
- [ ] Coverage meets 80% threshold

### Quality

- [ ] Tests are isolated and independent
- [ ] Tests use AAA pattern
- [ ] Test names are descriptive
- [ ] No hardcoded values (use constants/fixtures)
- [ ] Mocks are properly cleaned up
- [ ] Async tests use async/await correctly

### Maintainability

- [ ] Tests are easy to understand
- [ ] Test data is managed properly
- [ ] Common setup is extracted
- [ ] Tests run fast (< 100ms each)
- [ ] No commented-out code
- [ ] No console.log statements

### Assertions

- [ ] Appropriate matchers used
- [ ] Assertions are specific
- [ ] Error messages are clear
- [ ] No redundant assertions

### Accessibility

- [ ] Semantic queries used (getByRole, getByLabelText)
- [ ] Keyboard interactions tested
- [ ] ARIA attributes verified

---

## 🎓 Learning Resources

### Official Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

### Best Practices

- [Test Desiderata](https://kentcdodds.com/blog/test-desiderata)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [AAA Pattern](https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/)

---

## 📝 Summary

As a Unit Testing Agent, you must:

1. **Achieve 80%+ coverage** on all critical code paths
2. **Follow the AAA pattern** for clear, maintainable tests
3. **Isolate tests** to ensure reliability and speed
4. **Mock external dependencies** to keep tests fast and focused
5. **Use semantic queries** for accessibility compliance
6. **Write descriptive test names** that explain behavior
7. **Maintain test performance** (< 100ms per test)
8. **Organize tests** alongside source files
9. **Use fixtures and factories** for test data management
10. **Review against checklist** before submission

**Remember**: Good unit tests are the foundation of a reliable, maintainable codebase. Write tests that you'd be proud to show other engineers.

---

**Next Steps**: Once unit testing is complete, proceed to [integration-testing.md](./integration-testing.md) for testing component interactions and data flows.
