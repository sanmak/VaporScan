# VaporScan Architecture

## Overview

VaporScan is a client-side SEO auditing tool built with Next.js 15+ and React 19+. The application runs entirely in the browser, ensuring user privacy by never sending crawl data to external servers.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │   Next.js App    │◄──►│  Service Worker  │                  │
│  │   (React 19)     │    │  (Background     │                  │
│  │                  │    │   Crawling)      │                  │
│  └────────┬─────────┘    └────────┬─────────┘                  │
│           │                       │                             │
│           ▼                       ▼                             │
│  ┌──────────────────────────────────────────┐                  │
│  │              IndexedDB                    │                  │
│  │  (Crawl Results, Reports, Settings)       │                  │
│  └──────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Target Website  │
                    │   (External)      │
                    └──────────────────┘
```

## Key Components

### 1. Next.js Application Layer

The main application is built with Next.js App Router and consists of:

- **Pages** (`src/app/`): Route handlers and page components
  - `/` - Landing page with URL input
  - `/scan` - Crawl progress dashboard
  - `/report/[id]` - Report viewer with visualizations
  - `/settings` - User preferences

- **Components** (`src/components/`):
  - `ui/` - Reusable UI components powered by shadcn/ui
  - `features/` - Feature-specific components:
    - `UrlInput/` - URL validation and form handling
    - `CrawlProgress/` - Real-time crawl monitoring
    - `ReportDashboard/` - Report visualization with charts
    - `LinkGraph/` - React Flow-based link visualization

### 2. Service Worker (`public/service-worker.js`)

The Service Worker is the engine of VaporScan. It handles:

- **Background Crawling**: Uses the `fetch` API to retrieve pages. It manages its own crawl state, allowing it to continue even if the UI tab is closed or in the background.
- **Concurrency & Rate Limiting**: Processes the crawl queue with configurable concurrency. Supports `crawl-delay` directive from `robots.txt`.
- **Deduplication**: Uses a `visited` Set to ensure each URL is only crawled once. Normalizes URLs to prevent duplicates due to trailing slashes or case differences.
- **Robots.txt & Sitemaps**: Automatically discovers and respects crawling rules.
- **Data Compression**: Uses `CompressionStream` (if available) to store page content efficiently.

### 3. Crawler Library (`src/lib/crawler/`)

- **`crawl-orchestrator.ts`**: Frontend-side orchestrator for starting and managing crawls via SW messages.
- **`link-extractor.ts`**: Extracts and categorizes links from HTML.
- **`sitemap-parser.ts`**: Logic for fetching and parsing sitemaps and robots.txt.
- **`orphan-detector.ts`**: Algorithms to find orphaned pages and broken links.
- **`report-generator.ts`**: Aggregates crawl results into a structured report.

### 4. Storage Layer (`src/lib/storage/indexed-db.ts`)

Uses the `idb` library to interact with IndexedDB:

- `crawls` store: Full crawl session history.
- `reports` store: Finalized SEO audit reports.

## Data Flow

### Crawl Process

1. User enters URL & hits Start.
2. `useServiceWorker` sends `START_CRAWL` to Service Worker.
3. SW fetches `robots.txt` and discovers sitemaps.
4. SW initializes queue and starts concurrent fetches.
5. For each page:
   - Fetch HTML.
   - Parse and extract links.
   - Update `visited` Set and push new internal links to queue.
   - Post `CRAWL_LOG` and `CRAWL_PROGRESS` back to main thread.
6. When queue is empty or limit reached, SW posts `CRAWL_COMPLETED`.
7. App generates report and saves to IndexedDB.

### Communication Protocol

| Message Type      | Direction | Payload           | Description                      |
| ----------------- | --------- | ----------------- | -------------------------------- |
| `START_CRAWL`     | UI -> SW  | `CrawlConfig`     | Initializes and starts a crawl   |
| `PAUSE_CRAWL`     | UI -> SW  | -                 | Pauses the active crawl          |
| `RESUME_CRAWL`    | UI -> SW  | -                 | Resumes a paused crawl           |
| `CANCEL_CRAWL`    | UI -> SW  | -                 | Cancels and resets crawl state   |
| `GET_STATUS`      | UI -> SW  | -                 | Requests current crawl status    |
| `CRAWL_STARTED`   | SW -> UI  | `config`          | Confirms crawl start             |
| `CRAWL_PROGRESS`  | SW -> UI  | `CrawlProgress`   | Real-time stats update           |
| `CRAWL_LOG`       | SW -> UI  | `LogEntry`        | Status update for a specific URL |
| `CRAWL_COMPLETED` | SW -> UI  | `CrawlResults`    | Final signals and results        |
| `CRAWL_ERROR`     | SW -> UI  | `{error: string}` | Reports fatal crawl errors       |

## Technology Stack

| Layer      | Technology            |
| ---------- | --------------------- |
| Framework  | Next.js 15+           |
| UI Library | React 19+             |
| Styling    | Tailwind CSS 3.4+     |
| Components | shadcn/ui + Radix UI  |
| State      | Zustand               |
| Forms      | React Hook Form + Zod |
| Charts     | Recharts              |
| Graphs     | React Flow            |
| Storage    | IndexedDB (idb)       |
| Testing    | Vitest + Playwright   |

## Security Considerations

1. **Client-Side Isolated**: No data is sent to external servers. All processing happens in the user's browser.
2. **CORS Limitations**: The crawler is subject to browser CORS policies. Some websites may block direct client-side fetching.
3. **CSP**: Strict Content Security Policy to prevent XSS.
4. **Local Data**: All audit data is stored locally in IndexedDB and can be cleared by the user at any time.

## Performance Optimizations

1. **Background Execution**: Service Worker avoids main thread blocking and allows background tasks.
2. **Parallelism**: Multiple concurrent requests (default: 5) speed up the crawl.
3. **Lazy Loading**: Visualizations (charts/graphs) are loaded on demand.
4. **Binary Storage**: Reports and page content are stored as Blobs/Compressed data to save space.
