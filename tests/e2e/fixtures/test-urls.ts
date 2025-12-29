/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Test URL fixtures for E2E tests
 * Provides valid and invalid URLs for testing various scenarios
 */

export const testUrls = {
  valid: {
    simple: 'https://example.com',
    withSubdomain: 'https://www.example.com',
    withWww: 'https://www.google.com',
    withPath: 'https://example.com/path/to/page',
    withQuery: 'https://example.com?param=value&other=123',
    withFragment: 'https://example.com#section',
    withPort: 'https://example.com:8080',
    httpProtocol: 'http://example.com',
    httpsProtocol: 'https://example.com',
  },
  invalid: {
    noProtocol: 'example.com',
    wrongProtocol: 'ftp://example.com',
    malformed: 'htp://example..com',
    javascript: 'javascript:void(0)',
    empty: '',
    spaces: 'https://example .com',
    invalidChars: 'https://example.com/<script>',
    tooLong: 'https://' + 'a'.repeat(2000) + '.com',
  },
  edge: {
    ipAddress: 'https://192.168.1.1',
    localhost: 'http://localhost:3000',
    localhostWithPort: 'http://localhost:8080',
    veryLongUrl: 'https://example.com/' + 'a'.repeat(1000),
    internationalDomain: 'https://münchen.de',
    withSpecialChars: 'https://example.com/page?query=test&filter=value#anchor',
  },
};

export const mockSiteUrls = {
  smallSite: {
    baseUrl: 'https://small-test-site.com',
    expectedPages: 5,
    description: 'Small site with 5 pages',
  },
  mediumSite: {
    baseUrl: 'https://medium-test-site.com',
    expectedPages: 50,
    description: 'Medium site with 50 pages',
  },
  largeSite: {
    baseUrl: 'https://large-test-site.com',
    expectedPages: 500,
    description: 'Large site with 500 pages',
  },
  siteWithOrphans: {
    baseUrl: 'https://site-with-orphans.com',
    expectedPages: 20,
    expectedOrphans: 5,
    description: 'Site with orphaned pages',
  },
  siteWithBrokenLinks: {
    baseUrl: 'https://site-with-broken-links.com',
    expectedPages: 15,
    expectedBrokenLinks: 8,
    description: 'Site with broken links',
  },
};

export const testSitemaps = {
  simple: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/contact</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>0.6</priority>
  </url>
</urlset>`,
  withImages: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://example.com/</loc>
    <image:image>
      <image:loc>https://example.com/image.jpg</image:loc>
    </image:image>
  </url>
</urlset>`,
  sitemapIndex: `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-1.xml</loc>
    <lastmod>2024-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-2.xml</loc>
    <lastmod>2024-01-01</lastmod>
  </sitemap>
</sitemapindex>`,
};

export const testRobotsTxt = {
  allowAll: `User-agent: *
Disallow:
Sitemap: https://example.com/sitemap.xml`,

  blockAll: `User-agent: *
Disallow: /`,

  withRules: `User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /admin/login
Crawl-delay: 1
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-news.xml`,

  googlebot: `User-agent: Googlebot
Disallow: /nogooglebot/

User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml`,
};
