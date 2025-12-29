/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Mock data fixtures for integration testing
 * Provides realistic test data for various scenarios
 */

import { CrawlResult, CrawlPage, CrawlConfig } from '@/types';

/**
 * Creates a mock CrawlPage with sensible defaults
 */
export function createMockPage(overrides?: Partial<CrawlPage>): CrawlPage {
  return {
    url: 'https://example.com/test',
    status: 200,
    title: 'Test Page',
    description: 'A test page description',
    isEmpty: false,
    crawlTime: 150,
    internalLinks: [],
    externalLinks: [],
    inSitemap: true,
    ...overrides,
  };
}

/**
 * Creates a mock CrawlResult with sensible defaults
 */
export function createMockCrawlResult(overrides?: Partial<CrawlResult>): CrawlResult {
  return {
    id: 'test-crawl-123',
    url: 'https://example.com',
    startTime: Date.now(),
    endTime: Date.now() + 10000,
    status: 'completed',
    pages: new Map(),
    totalPages: 0,
    crawledPages: 0,
    errorCount: 0,
    orphanedPages: [],
    brokenLinks: new Map(),
    sitemapUrls: [],
    robotsData: null,
    stats: {
      avgResponseTime: 150,
      totalInternalLinks: 0,
      totalExternalLinks: 0,
    },
    ...overrides,
  };
}

/**
 * Creates a mock CrawlConfig with sensible defaults
 */
export function createMockCrawlConfig(overrides?: Partial<CrawlConfig>): CrawlConfig {
  return {
    url: 'https://example.com',
    maxDepth: 3,
    maxPages: 100,
    concurrency: 5,
    respectRobotsTxt: true,
    timeout: 5000,
    ...overrides,
  };
}

/**
 * Sample crawl result with 3 pages for testing
 */
export const sampleCrawlResult: CrawlResult = {
  id: 'sample-crawl-456',
  url: 'https://example.com',
  startTime: 1704067200000,
  endTime: 1704067500000,
  status: 'completed',
  pages: new Map([
    [
      'https://example.com/',
      {
        url: 'https://example.com/',
        status: 200,
        title: 'Home Page',
        description: 'Welcome to our site',
        isEmpty: false,
        crawlTime: 120,
        internalLinks: ['https://example.com/page1', 'https://example.com/page2'],
        externalLinks: ['https://external.com'],
        inSitemap: true,
      },
    ],
    [
      'https://example.com/page1',
      {
        url: 'https://example.com/page1',
        status: 200,
        title: 'Page 1',
        isEmpty: false,
        crawlTime: 150,
        internalLinks: ['https://example.com/', 'https://example.com/page2'],
        externalLinks: [],
        inSitemap: true,
      },
    ],
    [
      'https://example.com/page2',
      {
        url: 'https://example.com/page2',
        status: 404,
        title: '404 Not Found',
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      },
    ],
  ]),
  totalPages: 3,
  crawledPages: 3,
  errorCount: 1,
  orphanedPages: ['https://example.com/page2'],
  brokenLinks: new Map([['https://example.com/page2', new Set(['https://example.com/'])]]),
  sitemapUrls: ['https://example.com/', 'https://example.com/page1'],
  robotsData: {
    userAgent: '*',
    disallow: ['/admin'],
    allow: ['/admin/login'],
    crawlDelay: 1,
    sitemaps: ['https://example.com/sitemap.xml'],
  },
  stats: {
    avgResponseTime: 123,
    totalInternalLinks: 4,
    totalExternalLinks: 1,
  },
};

/**
 * Large crawl result for performance testing
 */
export function createLargeCrawlResult(pageCount: number = 1000): CrawlResult {
  const pages = new Map<string, CrawlPage>();

  for (let i = 0; i < pageCount; i++) {
    const url = `https://example.com/page${i}`;
    pages.set(url, {
      url,
      status: i % 10 === 0 ? 404 : 200, // Every 10th page is broken
      title: `Page ${i}`,
      isEmpty: i % 20 === 0, // Every 20th page is empty
      crawlTime: 100 + Math.random() * 200,
      internalLinks: [
        `https://example.com/page${(i + 1) % pageCount}`,
        `https://example.com/page${(i + 2) % pageCount}`,
      ],
      externalLinks: i % 5 === 0 ? ['https://external.com'] : [],
      inSitemap: i % 3 !== 0, // Every 3rd page not in sitemap
    });
  }

  return {
    id: `large-crawl-${pageCount}`,
    url: 'https://example.com',
    startTime: Date.now() - 600000,
    endTime: Date.now(),
    status: 'completed',
    pages,
    totalPages: pageCount,
    crawledPages: pageCount,
    errorCount: Math.floor(pageCount / 10),
    orphanedPages: [],
    brokenLinks: new Map(),
    sitemapUrls: [],
    robotsData: null,
    stats: {
      avgResponseTime: 150,
      totalInternalLinks: pageCount * 2,
      totalExternalLinks: Math.floor(pageCount / 5),
    },
  };
}

/**
 * Empty crawl result for edge case testing
 */
export const emptyCrawlResult: CrawlResult = {
  id: 'empty-crawl',
  url: 'https://empty.example.com',
  startTime: Date.now(),
  status: 'pending',
  pages: new Map(),
  totalPages: 0,
  crawledPages: 0,
  errorCount: 0,
  orphanedPages: [],
  brokenLinks: new Map(),
  sitemapUrls: [],
  robotsData: null,
  stats: {
    avgResponseTime: 0,
    totalInternalLinks: 0,
    totalExternalLinks: 0,
  },
};

/**
 * Failed crawl result for error testing
 */
export const failedCrawlResult: CrawlResult = {
  id: 'failed-crawl',
  url: 'https://failed.example.com',
  startTime: Date.now() - 5000,
  endTime: Date.now(),
  status: 'failed',
  pages: new Map(),
  totalPages: 0,
  crawledPages: 0,
  errorCount: 1,
  orphanedPages: [],
  brokenLinks: new Map(),
  sitemapUrls: [],
  robotsData: null,
  stats: {
    avgResponseTime: 0,
    totalInternalLinks: 0,
    totalExternalLinks: 0,
  },
};
