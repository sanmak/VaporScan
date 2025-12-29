/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Integration tests for complete crawler workflow
 * Tests the interaction between sitemap parsing, link extraction, and page detection
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '../helpers/msw-handlers';
import { fetchRobotsTxt, fetchSitemap, extractSitemapUrls } from '@/lib/crawler/sitemap-parser';
import { extractLinksFromHTML } from '@/lib/crawler/link-extractor';
import {
  detectOrphanedPages,
  detectBrokenLinks,
  detectEmptyPages,
  calculateLinkStats,
} from '@/lib/crawler/orphan-detector';
import { CrawlPage } from '@/types';
import { createMockCrawlResult } from '../fixtures/mock-crawl-data';

// Setup MSW server
const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('Crawler Workflow Integration', () => {
  describe('robots.txt → sitemap discovery flow', () => {
    it('should fetch robots.txt and extract sitemap URLs', async () => {
      // ACT
      const robotsData = await fetchRobotsTxt('https://example.com');

      // ASSERT
      expect(robotsData).not.toBeNull();
      expect(robotsData?.sitemaps).toContain('https://example.com/sitemap.xml');
      expect(robotsData?.disallow).toContain('/admin');
      expect(robotsData?.allow).toContain('/admin/login');
      expect(robotsData?.crawlDelay).toBe(1);
    });

    it('should fetch and parse sitemap from robots.txt', async () => {
      // ARRANGE
      const robotsData = await fetchRobotsTxt('https://example.com');
      const sitemapUrl = robotsData?.sitemaps?.[0];

      // ACT
      const sitemapData = await fetchSitemap(sitemapUrl!);

      // ASSERT
      expect(sitemapData.urls).toHaveLength(3);
      expect(sitemapData.urls).toContain('https://example.com/');
      expect(sitemapData.urls).toContain('https://example.com/page1');
      expect(sitemapData.urls).toContain('https://example.com/page2');
    });

    it('should complete full sitemap discovery workflow', async () => {
      // ACT
      const sitemapUrls = await extractSitemapUrls('https://example.com');

      // ASSERT
      expect(sitemapUrls.length).toBeGreaterThan(0);
      expect(sitemapUrls[0]).toBe('https://example.com/sitemap.xml');
    });
  });

  describe('page crawling → link extraction flow', () => {
    it('should fetch page and extract internal links', async () => {
      // ARRANGE
      const response = await fetch('https://example.com/');
      const html = await response.text();

      // ACT
      const links = extractLinksFromHTML(html, 'https://example.com/');

      // ASSERT
      expect(links.internal).toContain('https://example.com/page1');
      expect(links.internal).toContain('https://example.com/page2');
      expect(links.external).toContain('https://external.com/');
    });

    it('should handle multiple page crawls and aggregate links', async () => {
      // ARRANGE
      const urls = [
        'https://example.com/',
        'https://example.com/page1',
        'https://example.com/page2',
      ];

      const allInternalLinks: string[] = [];
      const allExternalLinks: string[] = [];

      // ACT
      for (const url of urls) {
        const response = await fetch(url);
        const html = await response.text();
        const links = extractLinksFromHTML(html, url);

        allInternalLinks.push(...links.internal);
        allExternalLinks.push(...links.external);
      }

      // ASSERT
      expect(allInternalLinks.length).toBeGreaterThan(0);
      expect(new Set(allInternalLinks).size).toBeGreaterThan(0);
    });
  });

  describe('crawl completion → analysis flow', () => {
    it('should detect orphaned pages after crawl', () => {
      // ARRANGE
      const crawlResult = createMockCrawlResult();

      const homePage: CrawlPage = {
        url: 'https://example.com/',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page1'],
        externalLinks: [],
        inSitemap: true,
      };

      const linkedPage: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
      };

      const orphanPage: CrawlPage = {
        url: 'https://example.com/orphan',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
      };

      crawlResult.pages.set('https://example.com/', homePage);
      crawlResult.pages.set('https://example.com/page1', linkedPage);
      crawlResult.pages.set('https://example.com/orphan', orphanPage);

      const sitemapUrls = new Set(['https://example.com/', 'https://example.com/page1']);

      // ACT
      const orphanedPages = detectOrphanedPages(crawlResult, sitemapUrls);

      // ASSERT
      expect(orphanedPages).toHaveLength(1);
      expect(orphanedPages[0].url).toBe('https://example.com/orphan');
    });

    it('should detect broken links after crawl', () => {
      // ARRANGE
      const crawlResult = createMockCrawlResult();

      const workingPage: CrawlPage = {
        url: 'https://example.com/',
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

      crawlResult.pages.set('https://example.com/', workingPage);
      crawlResult.pages.set('https://example.com/broken', brokenPage);

      // ACT
      const brokenLinks = detectBrokenLinks(crawlResult);

      // ASSERT
      expect(brokenLinks).toHaveLength(1);
      expect(brokenLinks[0].url).toBe('https://example.com/broken');
      expect(brokenLinks[0].status).toBe(404);
      expect(brokenLinks[0].referencedFrom).toContain('https://example.com/');
    });

    it('should calculate statistics after crawl', () => {
      // ARRANGE
      const crawlResult = createMockCrawlResult();

      const page1: CrawlPage = {
        url: 'https://example.com/page1',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page2', 'https://example.com/page3'],
        externalLinks: ['https://external.com'],
        inSitemap: true,
      };

      const page2: CrawlPage = {
        url: 'https://example.com/page2',
        status: 200,
        isEmpty: false,
        crawlTime: 100,
        internalLinks: ['https://example.com/page1'],
        externalLinks: [],
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

      crawlResult.pages.set('https://example.com/page1', page1);
      crawlResult.pages.set('https://example.com/page2', page2);
      crawlResult.pages.set('https://example.com/page3', page3);

      // ACT
      const stats = calculateLinkStats(crawlResult);

      // ASSERT
      expect(stats.totalPages).toBe(3);
      expect(stats.pagesWith200Status).toBe(2);
      expect(stats.pagesWith404Status).toBe(1);
      expect(stats.totalInternalLinks).toBe(3);
      expect(stats.totalExternalLinks).toBe(1);
      expect(stats.avgLinksPerPage).toBe(1);
    });
  });

  describe('end-to-end crawl simulation', () => {
    it('should complete full crawl workflow: robots.txt → sitemap → pages → analysis', async () => {
      // STEP 1: Fetch robots.txt
      const robotsData = await fetchRobotsTxt('https://example.com');
      expect(robotsData).not.toBeNull();

      // STEP 2: Get sitemap URLs from robots.txt
      const sitemapUrl = robotsData!.sitemaps![0];
      expect(sitemapUrl).toBe('https://example.com/sitemap.xml');

      // STEP 3: Fetch and parse sitemap
      const sitemapData = await fetchSitemap(sitemapUrl);
      expect(sitemapData.urls.length).toBeGreaterThan(0);

      // STEP 4: Crawl each page from sitemap
      const crawlResult = createMockCrawlResult({
        url: 'https://example.com',
        sitemapUrls: sitemapData.urls,
        robotsData: robotsData!,
      });

      for (const url of sitemapData.urls) {
        const response = await fetch(url);
        const html = await response.text();
        const links = extractLinksFromHTML(html, url);

        const page: CrawlPage = {
          url,
          status: response.status,
          isEmpty: html.length < 100,
          crawlTime: 100,
          internalLinks: links.internal,
          externalLinks: links.external,
          inSitemap: sitemapData.urls.includes(url),
        };

        crawlResult.pages.set(url, page);
      }

      crawlResult.totalPages = crawlResult.pages.size;
      crawlResult.crawledPages = crawlResult.pages.size;

      // STEP 5: Analyze results
      const orphanedPages = detectOrphanedPages(crawlResult, new Set(sitemapData.urls));
      detectBrokenLinks(crawlResult);
      detectEmptyPages(crawlResult);
      const stats = calculateLinkStats(crawlResult);

      // ASSERT final results
      expect(crawlResult.pages.size).toBe(3);
      expect(stats.totalPages).toBe(3);
      expect(stats.pagesWith200Status).toBe(3);
      expect(orphanedPages.length).toBe(0); // All pages are in sitemap
    });
  });

  describe('error handling in workflow', () => {
    it('should handle missing robots.txt gracefully', async () => {
      // ACT
      const robotsData = await fetchRobotsTxt('https://nonexistent.example.com');

      // ASSERT
      expect(robotsData).toBeNull();
    });

    it('should handle broken pages in workflow', async () => {
      // ARRANGE
      const crawlResult = createMockCrawlResult();

      // ACT - Try to fetch a broken page
      const response = await fetch('https://example.com/broken');

      const page: CrawlPage = {
        url: 'https://example.com/broken',
        status: response.status,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: false,
        errorMessage: '404 Not Found',
      };

      crawlResult.pages.set('https://example.com/broken', page);

      // ASSERT
      expect(response.status).toBe(404);
      expect(page.errorMessage).toBeDefined();

      const brokenLinks = detectBrokenLinks(crawlResult);
      expect(brokenLinks.length).toBe(0); // No incoming links, so not reported
    });

    it('should handle server errors in workflow', async () => {
      // ACT
      const response = await fetch('https://example.com/error');

      // ASSERT
      expect(response.status).toBe(500);
    });
  });

  describe('performance scenarios', () => {
    it('should handle multiple concurrent page fetches', async () => {
      // ARRANGE
      const urls = [
        'https://example.com/',
        'https://example.com/page1',
        'https://example.com/page2',
      ];

      // ACT
      const startTime = Date.now();
      const responses = await Promise.all(urls.map((url) => fetch(url)));
      const endTime = Date.now();

      // ASSERT
      expect(responses).toHaveLength(3);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Concurrent fetches should be faster than sequential
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // Should complete quickly
    });
  });
});
