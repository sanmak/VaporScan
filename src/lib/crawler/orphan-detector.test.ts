/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Unit tests for orphan-detector
 * Coverage: detectOrphanedPages, detectSitemapOnlyPages, detectBrokenLinks,
 *           detectEmptyPages, buildIncomingLinkMap, calculateLinkStats
 */

import { describe, it, expect } from 'vitest';
import {
  detectOrphanedPages,
  detectSitemapOnlyPages,
  detectBrokenLinks,
  detectEmptyPages,
  buildIncomingLinkMap,
  calculateLinkStats,
} from './orphan-detector';
import { CrawlResult, CrawlPage } from '@/types';

describe('orphan-detector', () => {
  describe('buildIncomingLinkMap', () => {
    it('should build map of incoming links', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page2', 'https://example.com/page3'],
        externalLinks: [],
        inSitemap: true,
      };

      const page2: CrawlPage = {
        url: 'https://example.com/page2',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page3'],
        externalLinks: [],
        inSitemap: true,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/page2', page2],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 3,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = buildIncomingLinkMap(crawlResult);

      // ASSERT
      expect(result.get('https://example.com/page2')).toEqual(['https://example.com/page1']);
      expect(result.get('https://example.com/page3')).toContain('https://example.com/page1');
      expect(result.get('https://example.com/page3')).toContain('https://example.com/page2');
    });

    it('should handle pages with no outgoing links', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([['https://example.com/page1', page1]]),
        totalPages: 1,
        crawledPages: 1,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = buildIncomingLinkMap(crawlResult);

      // ASSERT
      expect(result.size).toBe(0);
    });

    it('should handle empty crawl result', () => {
      // ARRANGE
      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
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
          avgResponseTime: 0,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = buildIncomingLinkMap(crawlResult);

      // ASSERT
      expect(result.size).toBe(0);
    });
  });

  describe('detectOrphanedPages', () => {
    it('should detect pages with no incoming links and not in sitemap', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const page2: CrawlPage = {
        url: 'https://example.com/orphan',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/orphan', page2],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      const sitemapUrls = new Set(['https://example.com/page1']);

      // ACT
      const result = detectOrphanedPages(crawlResult, sitemapUrls);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://example.com/orphan');
      expect(result[0].inSitemap).toBe(false);
      expect(result[0].referredBy).toEqual([]);
    });

    it('should not detect pages with incoming links as orphaned', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page2'],
        externalLinks: [],
        inSitemap: false,
      };

      const page2: CrawlPage = {
        url: 'https://example.com/page2',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/page2', page2],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 1,
          totalExternalLinks: 0,
        },
      };

      const sitemapUrls = new Set<string>();

      // ACT
      const result = detectOrphanedPages(crawlResult, sitemapUrls);

      // ASSERT
      // page2 has incoming link from page1, so not orphaned
      // page1 has no incoming links BUT could be considered entry point
      expect(result.some((p) => p.url === 'https://example.com/page2')).toBe(false);
    });

    it('should not detect pages in sitemap as orphaned even without incoming links', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([['https://example.com/page1', page1]]),
        totalPages: 1,
        crawledPages: 1,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      const sitemapUrls = new Set(['https://example.com/page1']);

      // ACT
      const result = detectOrphanedPages(crawlResult, sitemapUrls);

      // ASSERT
      expect(result).toHaveLength(0);
    });

    it('should handle empty crawl result', () => {
      // ARRANGE
      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
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
          avgResponseTime: 0,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      const sitemapUrls = new Set<string>();

      // ACT
      const result = detectOrphanedPages(crawlResult, sitemapUrls);

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('detectSitemapOnlyPages', () => {
    it('should detect pages in sitemap with no incoming links', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page2'],
        externalLinks: [],
        inSitemap: true,
      };

      const page2: CrawlPage = {
        url: 'https://example.com/sitemap-only',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/sitemap-only', page2],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 1,
          totalExternalLinks: 0,
        },
      };

      const sitemapUrls = new Set([
        'https://example.com/page1',
        'https://example.com/sitemap-only',
      ]);

      // ACT
      const result = detectSitemapOnlyPages(crawlResult, sitemapUrls);

      // ASSERT
      expect(result).toContain('https://example.com/sitemap-only');
    });

    it('should not include pages with incoming links', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page2'],
        externalLinks: [],
        inSitemap: true,
      };

      const page2: CrawlPage = {
        url: 'https://example.com/page2',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/page2', page2],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 1,
          totalExternalLinks: 0,
        },
      };

      const sitemapUrls = new Set(['https://example.com/page1', 'https://example.com/page2']);

      // ACT
      const result = detectSitemapOnlyPages(crawlResult, sitemapUrls);

      // ASSERT
      expect(result).not.toContain('https://example.com/page2');
    });

    it('should not include pages not crawled', () => {
      // ARRANGE
      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
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
          avgResponseTime: 0,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      const sitemapUrls = new Set(['https://example.com/uncrawled']);

      // ACT
      const result = detectSitemapOnlyPages(crawlResult, sitemapUrls);

      // ASSERT
      expect(result).toEqual([]);
    });

    it('should handle empty sitemap URLs', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([['https://example.com/page1', page1]]),
        totalPages: 1,
        crawledPages: 1,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      const sitemapUrls = new Set<string>();

      // ACT
      const result = detectSitemapOnlyPages(crawlResult, sitemapUrls);

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('detectBrokenLinks', () => {
    it('should detect pages with 4xx status codes', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/broken'],
        externalLinks: [],
        inSitemap: true,
      };

      const brokenPage: CrawlPage = {
        url: 'https://example.com/broken',
        status: 404,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/broken', brokenPage],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 1,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 1,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectBrokenLinks(crawlResult);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://example.com/broken');
      expect(result[0].status).toBe(404);
      expect(result[0].referencedFrom).toContain('https://example.com/page1');
    });

    it('should detect pages with 5xx status codes', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/error'],
        externalLinks: [],
        inSitemap: true,
      };

      const errorPage: CrawlPage = {
        url: 'https://example.com/error',
        status: 500,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/error', errorPage],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 1,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 1,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectBrokenLinks(crawlResult);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://example.com/error');
      expect(result[0].status).toBe(500);
    });

    it('should not include broken pages with no incoming links', () => {
      // ARRANGE
      const brokenPage: CrawlPage = {
        url: 'https://example.com/broken',
        status: 404,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([['https://example.com/broken', brokenPage]]),
        totalPages: 1,
        crawledPages: 1,
        errorCount: 1,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectBrokenLinks(crawlResult);

      // ASSERT
      expect(result).toEqual([]);
    });

    it('should not include pages with 2xx or 3xx status codes', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page2'],
        externalLinks: [],
        inSitemap: true,
      };

      const page2: CrawlPage = {
        url: 'https://example.com/page2',
        status: 301,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/page2', page2],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 1,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectBrokenLinks(crawlResult);

      // ASSERT
      expect(result).toEqual([]);
    });

    it('should track multiple pages referencing the same broken link', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/broken'],
        externalLinks: [],
        inSitemap: true,
      };

      const page2: CrawlPage = {
        url: 'https://example.com/page2',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/broken'],
        externalLinks: [],
        inSitemap: true,
      };

      const brokenPage: CrawlPage = {
        url: 'https://example.com/broken',
        status: 404,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/page2', page2],
          ['https://example.com/broken', brokenPage],
        ]),
        totalPages: 3,
        crawledPages: 3,
        errorCount: 1,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 2,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectBrokenLinks(crawlResult);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].referencedFrom).toHaveLength(2);
      expect(result[0].referencedFrom).toContain('https://example.com/page1');
      expect(result[0].referencedFrom).toContain('https://example.com/page2');
    });

    it('should handle empty crawl result', () => {
      // ARRANGE
      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
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
          avgResponseTime: 0,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectBrokenLinks(crawlResult);

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('detectEmptyPages', () => {
    it('should detect pages marked as empty', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const emptyPage: CrawlPage = {
        url: 'https://example.com/empty',
        status: 200,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/empty', emptyPage],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectEmptyPages(crawlResult);

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://example.com/empty');
      expect(result[0].isEmpty).toBe(true);
    });

    it('should not include non-empty pages', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([['https://example.com/page1', page1]]),
        totalPages: 1,
        crawledPages: 1,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectEmptyPages(crawlResult);

      // ASSERT
      expect(result).toEqual([]);
    });

    it('should handle multiple empty pages', () => {
      // ARRANGE
      const empty1: CrawlPage = {
        url: 'https://example.com/empty1',
        status: 200,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const empty2: CrawlPage = {
        url: 'https://example.com/empty2',
        status: 200,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/empty1', empty1],
          ['https://example.com/empty2', empty2],
        ]),
        totalPages: 2,
        crawledPages: 2,
        errorCount: 0,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectEmptyPages(crawlResult);

      // ASSERT
      expect(result).toHaveLength(2);
    });

    it('should handle empty crawl result', () => {
      // ARRANGE
      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
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
          avgResponseTime: 0,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = detectEmptyPages(crawlResult);

      // ASSERT
      expect(result).toEqual([]);
    });
  });

  describe('calculateLinkStats', () => {
    it('should calculate statistics correctly', () => {
      // ARRANGE
      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page2', 'https://example.com/page3'],
        externalLinks: ['https://external.com/link1'],
        inSitemap: true,
      };

      const page2: CrawlPage = {
        url: 'https://example.com/page2',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page3'],
        externalLinks: ['https://external.com/link2', 'https://external.com/link3'],
        inSitemap: true,
      };

      const page3: CrawlPage = {
        url: 'https://example.com/page3',
        status: 404,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      };

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/page2', page2],
          ['https://example.com/page3', page3],
        ]),
        totalPages: 3,
        crawledPages: 3,
        errorCount: 1,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 3,
          totalExternalLinks: 3,
        },
      };

      // ACT
      const result = calculateLinkStats(crawlResult);

      // ASSERT
      expect(result.totalPages).toBe(3);
      expect(result.pagesWith200Status).toBe(2);
      expect(result.pagesWith404Status).toBe(1);
      expect(result.totalInternalLinks).toBe(3);
      expect(result.totalExternalLinks).toBe(3);
      expect(result.avgLinksPerPage).toBe(1);
    });

    it('should handle empty crawl result', () => {
      // ARRANGE
      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
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
          avgResponseTime: 0,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = calculateLinkStats(crawlResult);

      // ASSERT
      expect(result.totalPages).toBe(0);
      expect(result.pagesWith200Status).toBe(0);
      expect(result.pagesWith404Status).toBe(0);
      expect(result.avgLinksPerPage).toBe(0);
    });

    it('should not divide by zero when calculating average', () => {
      // ARRANGE
      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
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
          avgResponseTime: 0,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = calculateLinkStats(crawlResult);

      // ASSERT
      expect(result.avgLinksPerPage).toBe(0);
      expect(Number.isNaN(result.avgLinksPerPage)).toBe(false);
    });

    it('should count different status codes correctly', () => {
      // ARRANGE
      const pages: [string, CrawlPage][] = [
        [
          'https://example.com/page1',
          {
            url: 'https://example.com/page1',
            status: 200,
            isEmpty: false,
            crawlTime: 100,
            internalLinks: [],
            externalLinks: [],
            inSitemap: true,
          },
        ],
        [
          'https://example.com/page2',
          {
            url: 'https://example.com/page2',
            status: 200,
            isEmpty: false,
            crawlTime: 100,
            internalLinks: [],
            externalLinks: [],
            inSitemap: true,
          },
        ],
        [
          'https://example.com/page3',
          {
            url: 'https://example.com/page3',
            status: 404,
            isEmpty: true,
            crawlTime: 100,
            internalLinks: [],
            externalLinks: [],
            inSitemap: false,
          },
        ],
        [
          'https://example.com/page4',
          {
            url: 'https://example.com/page4',
            status: 404,
            isEmpty: true,
            crawlTime: 100,
            internalLinks: [],
            externalLinks: [],
            inSitemap: false,
          },
        ],
        [
          'https://example.com/page5',
          {
            url: 'https://example.com/page5',
            status: 500,
            isEmpty: true,
            crawlTime: 100,
            internalLinks: [],
            externalLinks: [],
            inSitemap: false,
          },
        ],
      ];

      const crawlResult: CrawlResult = {
        id: '1',
        url: 'https://example.com',
        startTime: Date.now(),
        status: 'completed',
        pages: new Map(pages),
        totalPages: 5,
        crawledPages: 5,
        errorCount: 3,
        orphanedPages: [],
        brokenLinks: new Map(),
        sitemapUrls: [],
        robotsData: null,
        stats: {
          avgResponseTime: 100,
          totalInternalLinks: 0,
          totalExternalLinks: 0,
        },
      };

      // ACT
      const result = calculateLinkStats(crawlResult);

      // ASSERT
      expect(result.totalPages).toBe(5);
      expect(result.pagesWith200Status).toBe(2);
      expect(result.pagesWith404Status).toBe(2);
    });
  });
});
