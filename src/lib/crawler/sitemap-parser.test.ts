/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Unit tests for sitemap-parser
 * Coverage: parseRobotsTxt, parseSitemapXml, isPathAllowed, matchesRobotsPattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseRobotsTxt,
  parseSitemapXml,
  isPathAllowed,
  fetchRobotsTxt,
  fetchSitemap,
  extractSitemapUrls,
} from './sitemap-parser';
import { RobotsData } from '@/types';

describe('sitemap-parser', () => {
  describe('parseRobotsTxt', () => {
    // ARRANGE-ACT-ASSERT PATTERN

    it('should parse standard robots.txt with disallow and allow', () => {
      // ARRANGE
      const input = `
        User-agent: *
        Disallow: /admin/
        Allow: /admin/login
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.userAgent).toBe('*');
      expect(result.disallow).toContain('/admin/');
      expect(result.allow).toContain('/admin/login');
    });

    it('should parse crawl-delay directive', () => {
      // ARRANGE
      const input = `
        User-agent: *
        Crawl-delay: 10
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.crawlDelay).toBe(10);
    });

    it('should parse decimal crawl-delay', () => {
      // ARRANGE
      const input = `
        User-agent: *
        Crawl-delay: 2.5
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.crawlDelay).toBe(2.5);
    });

    it('should parse sitemap directive', () => {
      // ARRANGE
      const input = `
        User-agent: *
        Disallow: /
        Sitemap: https://example.com/sitemap.xml
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.sitemaps).toContain('https://example.com/sitemap.xml');
    });

    it('should parse host directive', () => {
      // ARRANGE
      const input = `
        User-agent: *
        Host: example.com
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.host).toBe('example.com');
    });

    it('should handle VaporScan specific user agent', () => {
      // ARRANGE
      const input = `
        User-agent: Googlebot
        Disallow: /google-only/

        User-agent: VaporScan
        Disallow: /vaporscan-only/
        Allow: /public/

        User-agent: *
        Disallow: /everyone-else/
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.disallow).toContain('/vaporscan-only/');
      expect(result.allow).toContain('/public/');
    });

    it('should ignore comments starting with #', () => {
      // ARRANGE
      const input = `
        # This is a comment
        User-agent: *
        # Another comment
        Disallow: /private
        # Final comment
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.disallow).toContain('/private');
      expect(result.disallow).toHaveLength(1);
    });

    it('should handle multiple sitemaps', () => {
      // ARRANGE
      const input = `
        User-agent: *
        Sitemap: https://example.com/sitemap1.xml
        Sitemap: https://example.com/sitemap2.xml
        Sitemap: https://example.com/sitemap3.xml
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.sitemaps).toHaveLength(3);
      expect(result.sitemaps).toContain('https://example.com/sitemap1.xml');
      expect(result.sitemaps).toContain('https://example.com/sitemap2.xml');
      expect(result.sitemaps).toContain('https://example.com/sitemap3.xml');
    });

    it('should handle empty robots.txt', () => {
      // ARRANGE
      const input = '';

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.disallow).toEqual([]);
      expect(result.allow).toEqual([]);
      expect(result.userAgent).toBe('*');
    });

    it('should handle robots.txt with only comments', () => {
      // ARRANGE
      const input = `
        # Comment 1
        # Comment 2
        # Comment 3
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.disallow).toEqual([]);
      expect(result.allow).toEqual([]);
    });

    it('should ignore empty disallow/allow values', () => {
      // ARRANGE
      const input = `
        User-agent: *
        Disallow:
        Allow:
        Disallow: /blocked
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.disallow).toHaveLength(1);
      expect(result.disallow).toContain('/blocked');
      expect(result.allow).toHaveLength(0);
    });

    it('should handle malformed lines without colon', () => {
      // ARRANGE
      const input = `
        User-agent: *
        This line has no colon
        Disallow: /admin
        Invalid line
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.disallow).toContain('/admin');
    });

    it('should skip invalid sitemap URLs', () => {
      // ARRANGE
      const input = `
        User-agent: *
        Sitemap: not-a-valid-url
        Sitemap: https://example.com/valid.xml
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.sitemaps).toHaveLength(1);
      expect(result.sitemaps).toContain('https://example.com/valid.xml');
    });

    it('should be case-insensitive for directives', () => {
      // ARRANGE
      const input = `
        USER-AGENT: *
        DISALLOW: /admin
        ALLOW: /public
        CRAWL-DELAY: 5
      `;

      // ACT
      const result = parseRobotsTxt(input);

      // ASSERT
      expect(result.disallow).toContain('/admin');
      expect(result.allow).toContain('/public');
      expect(result.crawlDelay).toBe(5);
    });
  });

  describe('isPathAllowed', () => {
    it('should return true when robots data is null', () => {
      // ACT & ASSERT
      expect(isPathAllowed('/any-path', null)).toBe(true);
    });

    it('should allow paths not matching any rules', () => {
      // ARRANGE
      const robotsData: RobotsData = {
        disallow: ['/admin'],
        allow: [],
        userAgent: '*',
      };

      // ACT & ASSERT
      expect(isPathAllowed('/public', robotsData)).toBe(true);
    });

    it('should disallow paths matching disallow rules', () => {
      // ARRANGE
      const robotsData: RobotsData = {
        disallow: ['/admin', '/private'],
        allow: [],
        userAgent: '*',
      };

      // ACT & ASSERT
      expect(isPathAllowed('/admin', robotsData)).toBe(false);
      expect(isPathAllowed('/admin/users', robotsData)).toBe(false);
      expect(isPathAllowed('/private/data', robotsData)).toBe(false);
    });

    it('should allow takes precedence over disallow', () => {
      // ARRANGE
      const robotsData: RobotsData = {
        disallow: ['/admin'],
        allow: ['/admin/login'],
        userAgent: '*',
      };

      // ACT & ASSERT
      expect(isPathAllowed('/admin/login', robotsData)).toBe(true);
      expect(isPathAllowed('/admin/users', robotsData)).toBe(false);
    });

    it('should handle wildcard patterns', () => {
      // ARRANGE
      const robotsData: RobotsData = {
        disallow: ['/admin/*.php'],
        allow: [],
        userAgent: '*',
      };

      // ACT & ASSERT
      expect(isPathAllowed('/admin/index.php', robotsData)).toBe(false);
      expect(isPathAllowed('/admin/test.php', robotsData)).toBe(false);
      expect(isPathAllowed('/admin/index.html', robotsData)).toBe(true);
    });

    it('should handle $ end anchor', () => {
      // ARRANGE
      const robotsData: RobotsData = {
        disallow: ['/file.pdf$'],
        allow: [],
        userAgent: '*',
      };

      // ACT & ASSERT
      expect(isPathAllowed('/file.pdf', robotsData)).toBe(false);
      expect(isPathAllowed('/file.pdf?param=1', robotsData)).toBe(true);
    });

    it('should handle complex wildcard patterns', () => {
      // ARRANGE
      const robotsData: RobotsData = {
        disallow: ['/search?*q='],
        allow: [],
        userAgent: '*',
      };

      // ACT & ASSERT
      expect(isPathAllowed('/search?q=test', robotsData)).toBe(false);
      expect(isPathAllowed('/search?other=value', robotsData)).toBe(true);
    });

    it('should handle disallow all', () => {
      // ARRANGE
      const robotsData: RobotsData = {
        disallow: ['/'],
        allow: [],
        userAgent: '*',
      };

      // ACT & ASSERT
      expect(isPathAllowed('/', robotsData)).toBe(false);
      expect(isPathAllowed('/anything', robotsData)).toBe(false);
    });

    it('should handle allow all with specific disallows', () => {
      // ARRANGE
      const robotsData: RobotsData = {
        disallow: ['/admin'],
        allow: ['/'],
        userAgent: '*',
      };

      // ACT & ASSERT
      expect(isPathAllowed('/', robotsData)).toBe(true);
      expect(isPathAllowed('/public', robotsData)).toBe(true);
      expect(isPathAllowed('/admin', robotsData)).toBe(false);
    });
  });

  describe('parseSitemapXml', () => {
    it('should parse regular sitemap XML', () => {
      // ARRANGE
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/page1</loc>
            <lastmod>2024-01-01</lastmod>
          </url>
          <url>
            <loc>https://example.com/page2</loc>
          </url>
        </urlset>
      `;

      // ACT
      const result = parseSitemapXml(xml);

      // ASSERT
      expect(result.urls).toHaveLength(2);
      expect(result.urls).toContain('https://example.com/page1');
      expect(result.urls).toContain('https://example.com/page2');
      expect(result.lastmod).toBe('2024-01-01');
    });

    it('should parse sitemap index', () => {
      // ARRANGE
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap>
            <loc>https://example.com/sitemap1.xml</loc>
          </sitemap>
          <sitemap>
            <loc>https://example.com/sitemap2.xml</loc>
          </sitemap>
        </sitemapindex>
      `;

      // ACT
      const result = parseSitemapXml(xml);

      // ASSERT
      expect(result.urls).toHaveLength(2);
      expect(result.urls).toContain('https://example.com/sitemap1.xml');
      expect(result.urls).toContain('https://example.com/sitemap2.xml');
    });

    it('should handle malformed XML gracefully', () => {
      // ARRANGE
      const xml = '<invalid>xml</invalid';

      // ACT
      const result = parseSitemapXml(xml);

      // ASSERT
      expect(result.urls).toEqual([]);
    });

    it('should skip invalid URLs in sitemap', () => {
      // ARRANGE
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/valid</loc>
          </url>
          <url>
            <loc>not-a-valid-url</loc>
          </url>
          <url>
            <loc>https://example.com/also-valid</loc>
          </url>
        </urlset>
      `;

      // ACT
      const result = parseSitemapXml(xml);

      // ASSERT
      expect(result.urls).toHaveLength(2);
      expect(result.urls).toContain('https://example.com/valid');
      expect(result.urls).toContain('https://example.com/also-valid');
    });

    it('should normalize URLs in sitemap', () => {
      // ARRANGE
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://EXAMPLE.COM/Page/</loc>
          </url>
        </urlset>
      `;

      // ACT
      const result = parseSitemapXml(xml);

      // ASSERT
      expect(result.urls).toContain('https://example.com/page');
    });

    it('should handle empty sitemap', () => {
      // ARRANGE
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        </urlset>
      `;

      // ACT
      const result = parseSitemapXml(xml);

      // ASSERT
      expect(result.urls).toEqual([]);
    });

    it('should handle empty XML string', () => {
      // ARRANGE
      const xml = '';

      // ACT
      const result = parseSitemapXml(xml);

      // ASSERT
      expect(result.urls).toEqual([]);
    });
  });

  describe('fetchRobotsTxt', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and parse robots.txt successfully', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        text: async () => `
          User-agent: *
          Disallow: /admin
          Sitemap: https://example.com/sitemap.xml
        `,
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      // ACT
      const result = await fetchRobotsTxt('https://example.com');

      // ASSERT
      expect(result).not.toBeNull();
      expect(result?.disallow).toContain('/admin');
      expect(result?.sitemaps).toContain('https://example.com/sitemap.xml');
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/robots.txt',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'VaporScan/1.0',
          }),
        })
      );
    });

    it('should return null if robots.txt not found (404)', async () => {
      // ARRANGE
      const mockResponse = { ok: false, status: 404 };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      // ACT
      const result = await fetchRobotsTxt('https://example.com');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      // ARRANGE
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // ACT
      const result = await fetchRobotsTxt('https://example.com');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle invalid base URL', async () => {
      // ARRANGE
      global.fetch = vi.fn().mockRejectedValue(new Error('Invalid URL'));

      // ACT
      const result = await fetchRobotsTxt('not-a-valid-url');

      // ASSERT
      expect(result).toBeNull();
    });
  });

  describe('fetchSitemap', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and parse sitemap successfully', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        text: async () => `<?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url><loc>https://example.com/page1</loc></url>
          </urlset>
        `,
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      // ACT
      const result = await fetchSitemap('https://example.com/sitemap.xml');

      // ASSERT
      expect(result.urls).toHaveLength(1);
      expect(result.urls).toContain('https://example.com/page1');
    });

    it('should return empty result on fetch error', async () => {
      // ARRANGE
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // ACT
      const result = await fetchSitemap('https://example.com/sitemap.xml');

      // ASSERT
      expect(result.urls).toEqual([]);
    });

    it('should return empty result on 404', async () => {
      // ARRANGE
      const mockResponse = { ok: false, status: 404 };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      // ACT
      const result = await fetchSitemap('https://example.com/sitemap.xml');

      // ASSERT
      expect(result.urls).toEqual([]);
    });
  });

  describe('extractSitemapUrls', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should extract sitemap URLs from robots.txt', async () => {
      // ARRANGE
      const mockResponse = {
        ok: true,
        text: async () => `
          User-agent: *
          Sitemap: https://example.com/sitemap1.xml
          Sitemap: https://example.com/sitemap2.xml
        `,
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      // ACT
      const result = await extractSitemapUrls('https://example.com');

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result).toContain('https://example.com/sitemap1.xml');
      expect(result).toContain('https://example.com/sitemap2.xml');
    });

    it('should try common locations if no sitemaps in robots.txt', async () => {
      // ARRANGE
      const mockResponses = [
        { ok: true, text: async () => 'User-agent: *\nDisallow: /' },
        { ok: true }, // HEAD request for /sitemap.xml
      ];
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      // ACT
      const result = await extractSitemapUrls('https://example.com');

      // ASSERT
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('sitemap');
    });

    it('should handle robots.txt fetch error', async () => {
      // ARRANGE
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // ACT
      const result = await extractSitemapUrls('https://example.com');

      // ASSERT
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
