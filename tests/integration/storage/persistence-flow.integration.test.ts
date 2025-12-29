/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Integration tests for IndexedDB persistence layer
 * Tests data persistence, Map/Set serialization, and cross-session data recovery
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  initializeDB,
  saveCrawl,
  getCrawl,
  getAllCrawls,
  deleteCrawl,
  saveReport,
  getReport,
  getAllReports,
  deleteReport,
  clearAllData,
} from '@/lib/storage/indexed-db';
import { CrawlPage, ReportData } from '@/types';
import { createMockCrawlResult, createMockPage } from '../fixtures/mock-crawl-data';

// Mock indexedDB with fake-indexeddb
global.indexedDB = new IDBFactory();

describe('IndexedDB Persistence Integration Tests', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await clearAllData();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearAllData();
  });

  describe('database initialization', () => {
    it('should initialize database with correct stores', async () => {
      // ACT
      const db = await initializeDB();

      // ASSERT
      expect(db.objectStoreNames.contains('crawls')).toBe(true);
      expect(db.objectStoreNames.contains('reports')).toBe(true);
    });

    it('should create indexes on stores', async () => {
      // ACT
      const db = await initializeDB();
      const transaction = db.transaction('crawls', 'readonly');
      const store = transaction.objectStore('crawls');

      // ASSERT
      expect(store.indexNames.contains('by-date')).toBe(true);
    });

    it('should return same instance on multiple calls', async () => {
      // ACT
      const db1 = await initializeDB();
      const db2 = await initializeDB();

      // ASSERT
      expect(db1).toBe(db2);
    });
  });

  describe('crawl data persistence', () => {
    it('should save and retrieve simple crawl data', async () => {
      // ARRANGE
      const crawl = createMockCrawlResult({
        id: 'test-crawl-1',
        url: 'https://example.com',
        status: 'completed',
      });

      // ACT
      await saveCrawl(crawl);
      const retrieved = await getCrawl('test-crawl-1');

      // ASSERT
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-crawl-1');
      expect(retrieved?.url).toBe('https://example.com');
      expect(retrieved?.status).toBe('completed');
    });

    it('should handle Map serialization and deserialization', async () => {
      // ARRANGE
      const page1: CrawlPage = createMockPage({
        url: 'https://example.com/page1',
        status: 200,
      });

      const page2: CrawlPage = createMockPage({
        url: 'https://example.com/page2',
        status: 404,
      });

      const crawl = createMockCrawlResult({
        id: 'map-test',
        pages: new Map([
          ['https://example.com/page1', page1],
          ['https://example.com/page2', page2],
        ]),
      });

      // ACT
      await saveCrawl(crawl);
      const retrieved = await getCrawl('map-test');

      // ASSERT
      expect(retrieved?.pages).toBeInstanceOf(Map);
      expect(retrieved?.pages.size).toBe(2);
      expect(retrieved?.pages.get('https://example.com/page1')).toEqual(page1);
      expect(retrieved?.pages.get('https://example.com/page2')).toEqual(page2);
    });

    it('should handle nested Map and Set serialization', async () => {
      // ARRANGE
      const crawl = createMockCrawlResult({
        id: 'nested-test',
        brokenLinks: new Map([
          ['https://example.com/broken1', new Set(['https://example.com/page1'])],
          [
            'https://example.com/broken2',
            new Set(['https://example.com/page1', 'https://example.com/page2']),
          ],
        ]),
      });

      // ACT
      await saveCrawl(crawl);
      const retrieved = await getCrawl('nested-test');

      // ASSERT
      expect(retrieved?.brokenLinks).toBeInstanceOf(Map);
      expect(retrieved?.brokenLinks.size).toBe(2);

      const broken1Links = retrieved?.brokenLinks.get('https://example.com/broken1');
      expect(broken1Links).toBeInstanceOf(Set);
      expect(broken1Links?.has('https://example.com/page1')).toBe(true);

      const broken2Links = retrieved?.brokenLinks.get('https://example.com/broken2');
      expect(broken2Links?.size).toBe(2);
    });

    it('should update existing crawl data', async () => {
      // ARRANGE
      const crawl = createMockCrawlResult({
        id: 'update-test',
        crawledPages: 5,
        status: 'crawling',
      });

      await saveCrawl(crawl);

      // ACT - Update the crawl
      const updatedCrawl = {
        ...crawl,
        crawledPages: 10,
        status: 'completed' as const,
        endTime: Date.now(),
      };

      await saveCrawl(updatedCrawl);
      const retrieved = await getCrawl('update-test');

      // ASSERT
      expect(retrieved?.crawledPages).toBe(10);
      expect(retrieved?.status).toBe('completed');
      expect(retrieved?.endTime).toBeDefined();
    });

    it('should return undefined for non-existent crawl', async () => {
      // ACT
      const retrieved = await getCrawl('non-existent-id');

      // ASSERT
      expect(retrieved).toBeUndefined();
    });
  });

  describe('multiple crawls management', () => {
    it('should retrieve all saved crawls', async () => {
      // ARRANGE
      const crawl1 = createMockCrawlResult({ id: 'crawl-1' });
      const crawl2 = createMockCrawlResult({ id: 'crawl-2' });
      const crawl3 = createMockCrawlResult({ id: 'crawl-3' });

      await saveCrawl(crawl1);
      await saveCrawl(crawl2);
      await saveCrawl(crawl3);

      // ACT
      const allCrawls = await getAllCrawls();

      // ASSERT
      expect(allCrawls).toHaveLength(3);
      expect(allCrawls.map((c) => c.id)).toContain('crawl-1');
      expect(allCrawls.map((c) => c.id)).toContain('crawl-2');
      expect(allCrawls.map((c) => c.id)).toContain('crawl-3');
    });

    it('should preserve Map/Set structure in getAllCrawls', async () => {
      // ARRANGE
      const crawl = createMockCrawlResult({
        id: 'bulk-test',
        pages: new Map([['https://example.com/', createMockPage()]]),
        brokenLinks: new Map([['https://example.com/broken', new Set(['ref'])]]),
      });

      await saveCrawl(crawl);

      // ACT
      const allCrawls = await getAllCrawls();

      // ASSERT
      expect(allCrawls[0].pages).toBeInstanceOf(Map);
      expect(allCrawls[0].brokenLinks).toBeInstanceOf(Map);
    });

    it('should return empty array when no crawls exist', async () => {
      // ACT
      const allCrawls = await getAllCrawls();

      // ASSERT
      expect(allCrawls).toEqual([]);
    });

    it('should delete specific crawl', async () => {
      // ARRANGE
      const crawl1 = createMockCrawlResult({ id: 'keep-1' });
      const crawl2 = createMockCrawlResult({ id: 'delete-me' });
      const crawl3 = createMockCrawlResult({ id: 'keep-2' });

      await saveCrawl(crawl1);
      await saveCrawl(crawl2);
      await saveCrawl(crawl3);

      // ACT
      await deleteCrawl('delete-me');
      const remaining = await getAllCrawls();

      // ASSERT
      expect(remaining).toHaveLength(2);
      expect(remaining.map((c) => c.id)).not.toContain('delete-me');
      expect(remaining.map((c) => c.id)).toContain('keep-1');
      expect(remaining.map((c) => c.id)).toContain('keep-2');
    });
  });

  describe('report data persistence', () => {
    it('should save and retrieve report data', async () => {
      // ARRANGE
      const report: ReportData = {
        id: 'report-1',
        crawlId: 'crawl-1',
        generatedAt: Date.now(),
        targetUrl: 'https://example.com',
        summary: {
          totalPages: 10,
          crawledPages: 10,
          orphanedCount: 2,
          brokenLinkCount: 1,
          emptyPageCount: 0,
          avgResponseTime: 150,
        },
        orphanedPages: [],
        brokenLinks: [],
        emptyPages: [],
        sitemapOnlyPages: [],
        sitemapUrls: [],
        robotsData: null,
      };

      // ACT
      await saveReport(report);
      const retrieved = await getReport('report-1');

      // ASSERT
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('report-1');
      expect(retrieved?.crawlId).toBe('crawl-1');
      expect(retrieved?.summary.totalPages).toBe(10);
    });

    it('should retrieve all reports', async () => {
      // ARRANGE
      const report1: ReportData = {
        id: 'report-1',
        crawlId: 'crawl-1',
        generatedAt: Date.now(),
        targetUrl: 'https://example.com',
        summary: {
          totalPages: 10,
          crawledPages: 10,
          orphanedCount: 0,
          brokenLinkCount: 0,
          emptyPageCount: 0,
          avgResponseTime: 100,
        },
        orphanedPages: [],
        brokenLinks: [],
        emptyPages: [],
        sitemapOnlyPages: [],
        sitemapUrls: [],
        robotsData: null,
      };

      const report2: ReportData = {
        ...report1,
        id: 'report-2',
        crawlId: 'crawl-2',
      };

      await saveReport(report1);
      await saveReport(report2);

      // ACT
      const allReports = await getAllReports();

      // ASSERT
      expect(allReports).toHaveLength(2);
    });

    it('should delete report', async () => {
      // ARRANGE
      const report: ReportData = {
        id: 'delete-report',
        crawlId: 'crawl-1',
        generatedAt: Date.now(),
        targetUrl: 'https://example.com',
        summary: {
          totalPages: 0,
          crawledPages: 0,
          orphanedCount: 0,
          brokenLinkCount: 0,
          emptyPageCount: 0,
          avgResponseTime: 0,
        },
        orphanedPages: [],
        brokenLinks: [],
        emptyPages: [],
        sitemapOnlyPages: [],
        sitemapUrls: [],
        robotsData: null,
      };

      await saveReport(report);

      // ACT
      await deleteReport('delete-report');
      const retrieved = await getReport('delete-report');

      // ASSERT
      expect(retrieved).toBeUndefined();
    });
  });

  describe('data clearing', () => {
    it('should clear all data from database', async () => {
      // ARRANGE
      await saveCrawl(createMockCrawlResult({ id: 'crawl-1' }));
      await saveCrawl(createMockCrawlResult({ id: 'crawl-2' }));

      const report: ReportData = {
        id: 'report-1',
        crawlId: 'crawl-1',
        generatedAt: Date.now(),
        targetUrl: 'https://example.com',
        summary: {
          totalPages: 0,
          crawledPages: 0,
          orphanedCount: 0,
          brokenLinkCount: 0,
          emptyPageCount: 0,
          avgResponseTime: 0,
        },
        orphanedPages: [],
        brokenLinks: [],
        emptyPages: [],
        sitemapOnlyPages: [],
        sitemapUrls: [],
        robotsData: null,
      };

      await saveReport(report);

      // ACT
      await clearAllData();

      // ASSERT
      const allCrawls = await getAllCrawls();
      const allReports = await getAllReports();

      expect(allCrawls).toHaveLength(0);
      expect(allReports).toHaveLength(0);
    });
  });

  describe('large dataset handling', () => {
    it('should handle crawl with many pages', async () => {
      // ARRANGE
      const pages = new Map<string, CrawlPage>();

      for (let i = 0; i < 100; i++) {
        pages.set(
          `https://example.com/page${i}`,
          createMockPage({ url: `https://example.com/page${i}` })
        );
      }

      const crawl = createMockCrawlResult({
        id: 'large-crawl',
        pages,
      });

      // ACT
      await saveCrawl(crawl);
      const retrieved = await getCrawl('large-crawl');

      // ASSERT
      expect(retrieved?.pages.size).toBe(100);
    });

    it('should handle complex broken links map', async () => {
      // ARRANGE
      const brokenLinks = new Map<string, Set<string>>();

      for (let i = 0; i < 20; i++) {
        const references = new Set<string>();
        for (let j = 0; j < 5; j++) {
          references.add(`https://example.com/ref${j}`);
        }
        brokenLinks.set(`https://example.com/broken${i}`, references);
      }

      const crawl = createMockCrawlResult({
        id: 'complex-links',
        brokenLinks,
      });

      // ACT
      await saveCrawl(crawl);
      const retrieved = await getCrawl('complex-links');

      // ASSERT
      expect(retrieved?.brokenLinks.size).toBe(20);
      const firstBrokenLink = retrieved?.brokenLinks.get('https://example.com/broken0');
      expect(firstBrokenLink?.size).toBe(5);
    });
  });

  describe('cross-session data recovery', () => {
    it('should recover in-progress crawl after simulated crash', async () => {
      // ARRANGE - Simulate starting a crawl
      const crawl = createMockCrawlResult({
        id: 'recovery-test',
        status: 'crawling',
        crawledPages: 50,
        totalPages: 100,
        endTime: undefined,
      });

      await saveCrawl(crawl);

      // ACT - Simulate app restart by retrieving the crawl
      const recovered = await getCrawl('recovery-test');

      // ASSERT
      expect(recovered).toBeDefined();
      expect(recovered?.status).toBe('crawling');
      expect(recovered?.crawledPages).toBe(50);
      expect(recovered?.totalPages).toBe(100);
      expect(recovered?.endTime).toBeUndefined();
    });

    it('should maintain crawl history across sessions', async () => {
      // ARRANGE - Save multiple completed crawls
      const crawl1 = createMockCrawlResult({
        id: 'history-1',
        status: 'completed',
        startTime: Date.now() - 3000,
      });

      const crawl2 = createMockCrawlResult({
        id: 'history-2',
        status: 'completed',
        startTime: Date.now() - 2000,
      });

      await saveCrawl(crawl1);
      await saveCrawl(crawl2);

      // ACT - Simulate app restart
      const history = await getAllCrawls();

      // ASSERT
      expect(history).toHaveLength(2);
      expect(history.map((c) => c.id)).toContain('history-1');
      expect(history.map((c) => c.id)).toContain('history-2');
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent saves', async () => {
      // ARRANGE
      const crawls = [
        createMockCrawlResult({ id: 'concurrent-1' }),
        createMockCrawlResult({ id: 'concurrent-2' }),
        createMockCrawlResult({ id: 'concurrent-3' }),
      ];

      // ACT - Save all crawls concurrently
      await Promise.all(crawls.map((crawl) => saveCrawl(crawl)));

      // ASSERT
      const allCrawls = await getAllCrawls();
      expect(allCrawls).toHaveLength(3);
    });

    it('should handle concurrent read/write operations', async () => {
      // ARRANGE
      const crawl = createMockCrawlResult({ id: 'rw-test' });
      await saveCrawl(crawl);

      // ACT - Read and write concurrently
      const operations = [
        getCrawl('rw-test'),
        saveCrawl({ ...crawl, crawledPages: 10 }),
        getCrawl('rw-test'),
      ];

      const results = await Promise.all(operations);

      // ASSERT
      expect(results[0]).toBeDefined(); // First read
      expect(results[2]).toBeDefined(); // Second read
    });
  });

  describe('data integrity', () => {
    it('should maintain data types after round-trip', async () => {
      // ARRANGE
      const now = Date.now();
      const crawl = createMockCrawlResult({
        id: 'type-test',
        startTime: now,
        endTime: now + 1000,
        totalPages: 100,
        crawledPages: 75,
        errorCount: 5,
      });

      // ACT
      await saveCrawl(crawl);
      const retrieved = await getCrawl('type-test');

      // ASSERT
      expect(typeof retrieved?.startTime).toBe('number');
      expect(typeof retrieved?.endTime).toBe('number');
      expect(typeof retrieved?.totalPages).toBe('number');
      expect(typeof retrieved?.crawledPages).toBe('number');
      expect(typeof retrieved?.errorCount).toBe('number');
    });

    it('should preserve array data', async () => {
      // ARRANGE
      const crawl = createMockCrawlResult({
        id: 'array-test',
        sitemapUrls: ['https://example.com/', 'https://example.com/page1'],
        orphanedPages: ['https://example.com/orphan1', 'https://example.com/orphan2'],
      });

      // ACT
      await saveCrawl(crawl);
      const retrieved = await getCrawl('array-test');

      // ASSERT
      expect(Array.isArray(retrieved?.sitemapUrls)).toBe(true);
      expect(retrieved?.sitemapUrls).toHaveLength(2);
      expect(Array.isArray(retrieved?.orphanedPages)).toBe(true);
      expect(retrieved?.orphanedPages).toHaveLength(2);
    });

    it('should preserve nested object structure', async () => {
      // ARRANGE
      const crawl = createMockCrawlResult({
        id: 'nested-object-test',
        robotsData: {
          userAgent: '*',
          disallow: ['/admin'],
          allow: ['/admin/login'],
          crawlDelay: 1,
          sitemaps: ['https://example.com/sitemap.xml'],
        },
      });

      // ACT
      await saveCrawl(crawl);
      const retrieved = await getCrawl('nested-object-test');

      // ASSERT
      expect(retrieved?.robotsData).toBeDefined();
      expect(retrieved?.robotsData?.userAgent).toBe('*');
      expect(retrieved?.robotsData?.disallow).toEqual(['/admin']);
      expect(retrieved?.robotsData?.crawlDelay).toBe(1);
    });
  });
});
