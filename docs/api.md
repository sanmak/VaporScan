# VaporScan API Documentation

## Overview

VaporScan provides a programmatic interface through its library functions. Since it's a client-side application, there are no HTTP APIs - instead, you interact with the crawler and storage through JavaScript/TypeScript functions.

## Core Types

### CrawlConfig

Configuration for a crawl session.

```typescript
interface CrawlConfig {
  url: string; // Target URL to crawl
  maxDepth?: number; // Maximum link depth (default: 10)
  maxPages?: number; // Maximum pages to crawl (default: 1000)
  concurrency?: number; // Concurrent requests (default: 5)
  respectRobotsTxt: boolean; // Honor robots.txt rules
  timeout?: number; // Request timeout in ms (default: 10000)
  userAgent?: string; // Custom user agent
  manualPages?: string[]; // Specific pages to crawl manually
}
```

### CrawlPage

Represents a single crawled page.

```typescript
interface CrawlPage {
  url: string; // Page URL
  status: number; // HTTP status code
  title?: string; // Page title
  description?: string; // Meta description
  contentLength?: number; // Content size in bytes
  isEmpty: boolean; // True if minimal content
  crawlTime: number; // Time to fetch in ms
  internalLinks: string[]; // Same-domain links
  externalLinks: string[]; // External links
  inSitemap: boolean; // Found in sitemap
  errorMessage?: string; // Error if failed
  content?: Blob; // Compressed HTML content
}
```

### CrawlResult

Complete crawl session result.

```typescript
interface CrawlResult {
  id: string;
  url: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'crawling' | 'completed' | 'failed' | 'paused';
  pages: Map<string, CrawlPage>;
  totalPages: number;
  crawledPages: number;
  errorCount: number;
  orphanedPages: string[];
  brokenLinks: Map<string, Set<string>>;
  sitemapUrls: string[];
  robotsData: RobotsData | null;
  stats: {
    avgResponseTime: number;
    totalInternalLinks: number;
    totalExternalLinks: number;
  };
}
```

### ReportData

Generated report data.

```typescript
interface ReportData {
  id: string;
  crawlId: string;
  generatedAt: number;
  targetUrl: string;
  summary: {
    totalPages: number;
    crawledPages: number;
    orphanedCount: number;
    brokenLinkCount: number;
    emptyPageCount: number;
    avgResponseTime: number;
  };
  orphanedPages: OrphanedPage[];
  brokenLinks: LinkResult[];
  emptyPages: CrawlPage[];
  sitemapOnlyPages: string[];
  sitemapUrls: string[];
  robotsData: RobotsData | null;
}
```

### RobotsData

Robots.txt parsing result.

```typescript
interface RobotsData {
  disallow: string[];
  allow: string[];
  userAgent: string;
  crawlDelay?: number;
  sitemaps?: string[];
  host?: string;
}
```

## Crawler Functions

### Link Extractor (`src/lib/crawler/link-extractor.ts`)

#### `extractLinksFromHTML(html: string, baseUrl: string)`

Extracts and categorizes links from HTML content.

```typescript
import { extractLinksFromHTML } from '@/lib/crawler/link-extractor';

const { internalLinks, externalLinks } = extractLinksFromHTML(
  '<a href="/about">About</a><a href="https://external.com">External</a>',
  'https://example.com'
);
// internalLinks: ['https://example.com/about']
// externalLinks: ['https://external.com']
```

#### `normalizeUrl(url: string)`

Normalizes a URL for consistent comparison.

```typescript
import { normalizeUrl } from '@/lib/crawler/link-extractor';

normalizeUrl('https://example.com/page/');
// Returns: 'https://example.com/page'
```

#### `isValidUrl(url: string)`

Validates if a string is a valid HTTP/HTTPS URL.

```typescript
import { isValidUrl } from '@/lib/crawler/link-extractor';

isValidUrl('https://example.com'); // true
isValidUrl('not-a-url'); // false
```

### Sitemap Parser (`src/lib/crawler/sitemap-parser.ts`)

#### `fetchRobotsTxt(baseUrl: string)`

Fetches and parses robots.txt from a domain.

```typescript
import { fetchRobotsTxt } from '@/lib/crawler/sitemap-parser';

const robotsData = await fetchRobotsTxt('https://example.com');
// Returns: { disallow: ['/admin'], allow: ['/'], userAgent: '*' }
```

#### `fetchAllSitemapUrls(baseUrl: string)`

Discovers and fetches all URLs from sitemaps.

```typescript
import { fetchAllSitemapUrls } from '@/lib/crawler/sitemap-parser';

const urls = await fetchAllSitemapUrls('https://example.com');
// Returns: Set of all URLs found in sitemaps
```

### Orphan Detector (`src/lib/crawler/orphan-detector.ts`)

#### `detectOrphanedPages(pages, sitemapUrls)`

Finds pages with no incoming internal links.

```typescript
import { detectOrphanedPages } from '@/lib/crawler/orphan-detector';

const orphans = detectOrphanedPages(pagesMap, sitemapUrlSet);
// Returns: Array of OrphanedPage objects
```

#### `detectBrokenLinks(pages)`

Finds pages returning 4xx/5xx status codes.

```typescript
import { detectBrokenLinks } from '@/lib/crawler/orphan-detector';

const broken = detectBrokenLinks(pagesMap);
// Returns: Array of LinkResult objects
```

## Storage Functions (`src/lib/storage/indexed-db.ts`)

### Crawl Storage

```typescript
import { saveCrawl, getCrawl, getAllCrawls, deleteCrawl } from '@/lib/storage/indexed-db';

// Save a crawl
await saveCrawl(crawlResult);

// Get a specific crawl
const crawl = await getCrawl('crawl-id');

// Get all crawls
const allCrawls = await getAllCrawls();

// Delete a crawl
await deleteCrawl('crawl-id');
```

### Report Storage

```typescript
import { saveReport, getReport, getAllReports, deleteReport } from '@/lib/storage/indexed-db';

// Save a report
await saveReport(reportData);

// Get a specific report
const report = await getReport('report-id');

// Get all reports
const allReports = await getAllReports();

// Delete a report
await deleteReport('report-id');
```

### Clear All Data

```typescript
import { clearAllData } from '@/lib/storage/indexed-db';

// Clear all crawls and reports
await clearAllData();
```

## Service Worker Communication

### useServiceWorker Hook

```typescript
import { useServiceWorker } from '@/lib/hooks/useServiceWorker';

const {
  isRegistered, // Service Worker registered
  isReady, // Controller available
  status, // 'idle' | 'crawling' | 'paused' | 'completed' | 'error'
  progress, // Current progress stats
  logs, // Crawl log entries
  startCrawl, // Start a new crawl
  pauseCrawl, // Pause current crawl
  resumeCrawl, // Resume paused crawl
  cancelCrawl, // Cancel current crawl
  getStatus, // Force status update from SW
  formatTimeRemaining, // Format ETA
} = useServiceWorker({
  onProgress: (progress) => console.log(progress),
  onLog: (log) => console.log(log),
  onCompleted: (results) => console.log(results),
  onError: (error) => console.error(error),
});

// Start crawling
startCrawl({
  url: 'https://example.com',
  concurrency: 5,
  maxDepth: 10,
  respectRobotsTxt: true,
});
```

## Export Functions (`src/lib/utils/export.ts`)

### Export Report

```typescript
import { downloadJSON, downloadCSV, downloadPDF } from '@/lib/utils/export';

// Export as JSON
downloadJSON(reportData, 'report.json');

// Export as CSV
downloadCSV(reportData, 'report.csv');

// Export as PDF
downloadPDF(reportData, 'report.pdf');
```

## React Components

### ReportDashboard

```tsx
import { ReportDashboard } from '@/components/features/ReportDashboard';

<ReportDashboard report={reportData} />;
```

### LinkGraph

```tsx
import { LinkGraph } from '@/components/features/LinkGraph';

<LinkGraph
  pages={pagesMap} // Map<string, CrawlPage>
  targetUrl="https://..." // Base URL
  maxNodes={100} // Max nodes to display
/>;
```

### CrawlProgress

```tsx
import { CrawlProgress } from '@/components/features/CrawlProgress';

<CrawlProgress initialUrl="https://example.com" />;
```
