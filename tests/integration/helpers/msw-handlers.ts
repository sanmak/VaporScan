/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Mock Service Worker (MSW) handlers for integration testing
 * Mocks external API calls for consistent, reliable tests
 */

import { http, HttpResponse } from 'msw';

/**
 * Default MSW handlers for common API endpoints
 */
export const handlers = [
  // Mock robots.txt endpoint
  http.get('https://example.com/robots.txt', () => {
    return HttpResponse.text(`
      User-agent: *
      Disallow: /admin
      Allow: /admin/login
      Crawl-delay: 1
      Sitemap: https://example.com/sitemap.xml
    `);
  }),

  // Mock sitemap.xml endpoint
  http.get('https://example.com/sitemap.xml', () => {
    return HttpResponse.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>https://example.com/</loc>
          <lastmod>2024-01-01</lastmod>
          <priority>1.0</priority>
        </url>
        <url>
          <loc>https://example.com/page1</loc>
          <lastmod>2024-01-02</lastmod>
          <priority>0.8</priority>
        </url>
        <url>
          <loc>https://example.com/page2</loc>
          <lastmod>2024-01-03</lastmod>
          <priority>0.8</priority>
        </url>
      </urlset>
    `);
  }),

  // Mock page crawl endpoints
  http.get('https://example.com/', () => {
    return HttpResponse.html(`
      <!DOCTYPE html>
      <html>
        <head><title>Home Page</title></head>
        <body>
          <h1>Welcome</h1>
          <a href="/page1">Page 1</a>
          <a href="/page2">Page 2</a>
          <a href="https://external.com">External Link</a>
        </body>
      </html>
    `);
  }),

  http.get('https://example.com/page1', () => {
    return HttpResponse.html(`
      <!DOCTYPE html>
      <html>
        <head><title>Page 1</title></head>
        <body>
          <h1>Page 1</h1>
          <a href="/">Home</a>
          <a href="/page2">Page 2</a>
        </body>
      </html>
    `);
  }),

  http.get('https://example.com/page2', () => {
    return HttpResponse.html(`
      <!DOCTYPE html>
      <html>
        <head><title>Page 2</title></head>
        <body>
          <h1>Page 2</h1>
          <a href="/">Home</a>
          <a href="/page1">Page 1</a>
        </body>
      </html>
    `);
  }),

  // Mock 404 endpoint
  http.get('https://example.com/broken', () => {
    return new HttpResponse(null, {
      status: 404,
      statusText: 'Not Found',
    });
  }),

  // Mock 500 endpoint
  http.get('https://example.com/error', () => {
    return new HttpResponse(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }),

  // Mock slow endpoint (for testing timeouts)
  http.get('https://slow.example.com/*', async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return HttpResponse.html('<html><body>Slow response</body></html>');
  }),

  // Mock CORS-blocked endpoint
  http.get('https://cors-blocked.example.com/*', () => {
    return HttpResponse.error();
  }),
];

/**
 * Handlers for testing sitemap index (nested sitemaps)
 */
export const sitemapIndexHandlers = [
  http.get('https://example.com/sitemap_index.xml', () => {
    return HttpResponse.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap>
          <loc>https://example.com/sitemap1.xml</loc>
          <lastmod>2024-01-01</lastmod>
        </sitemap>
        <sitemap>
          <loc>https://example.com/sitemap2.xml</loc>
          <lastmod>2024-01-02</lastmod>
        </sitemap>
      </sitemapindex>
    `);
  }),

  http.get('https://example.com/sitemap1.xml', () => {
    return HttpResponse.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/category1/page1</loc></url>
        <url><loc>https://example.com/category1/page2</loc></url>
      </urlset>
    `);
  }),

  http.get('https://example.com/sitemap2.xml', () => {
    return HttpResponse.xml(`<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/category2/page1</loc></url>
        <url><loc>https://example.com/category2/page2</loc></url>
      </urlset>
    `);
  }),
];

/**
 * Handlers for testing error scenarios
 */
export const errorHandlers = [
  // Malformed robots.txt
  http.get('https://malformed.example.com/robots.txt', () => {
    return HttpResponse.text('This is not valid robots.txt content!!!');
  }),

  // Malformed sitemap
  http.get('https://malformed.example.com/sitemap.xml', () => {
    return HttpResponse.xml('<invalid>xml</invalid');
  }),

  // Network error
  http.get('https://network-error.example.com/*', () => {
    return HttpResponse.error();
  }),

  // Timeout
  http.get('https://timeout.example.com/*', async () => {
    await new Promise((resolve) => setTimeout(resolve, 30000));
    return HttpResponse.html('<html></html>');
  }),
];
