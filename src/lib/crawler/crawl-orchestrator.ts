/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Orchestrates the crawling process
 */

import { CrawlConfig, CrawlPage, CrawlResult } from '@/types';
import { normalizeUrl, isValidUrl } from './link-extractor';

export const initiateCrawl = (config: CrawlConfig): CrawlResult => {
  const crawlId = `crawl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id: crawlId,
    url: config.url,
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
};

export const fetchPage = async (
  url: string,
  timeout: number = 10000
): Promise<{ status: number; html?: string; error?: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VaporScan/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok && response.status !== 404) {
      const html = await response.text();
      return { status: response.status, html };
    }

    const html = await response.text();
    return { status: response.status, html };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { status: 408, error: 'Request timeout' };
      }
      return { status: 0, error: error.message };
    }
    return { status: 0, error: 'Unknown error' };
  }
};

export const createPageFromFetch = async (
  url: string,
  crawlResult: CrawlResult
): Promise<CrawlPage> => {
  const normalizedUrl = normalizeUrl(url);
  const startTime = performance.now();

  const { status, html, error } = await fetchPage(url);
  const crawlTime = performance.now() - startTime;

  let title: string | undefined;
  let description: string | undefined;
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  let isEmpty = false;

  if (html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract metadata
      const titleTag = doc.querySelector('title');
      title = titleTag?.textContent || undefined;

      const metaDescription = doc.querySelector('meta[name="description"]');
      description = metaDescription?.getAttribute('content') || undefined;

      // Check if page is empty (minimal content)
      const bodyText = doc.body?.textContent || '';
      isEmpty = bodyText.trim().length < 100;

      // Extract links
      const linkElements = doc.querySelectorAll('a[href]');
      linkElements.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
          try {
            const absoluteUrl = new URL(href, url).toString();
            const normalizedLink = normalizeUrl(absoluteUrl);

            if (normalizeUrl(url).split('/')[2] === normalizedLink.split('/')[2]) {
              if (!internalLinks.includes(normalizedLink)) {
                internalLinks.push(normalizedLink);
              }
            } else {
              if (!externalLinks.includes(normalizedLink)) {
                externalLinks.push(normalizedLink);
              }
            }
          } catch {
            // Skip invalid URLs
          }
        }
      });
    } catch {
      // Continue with empty links
    }
  }

  // Update crawl stats
  crawlResult.stats.totalInternalLinks += internalLinks.length;
  crawlResult.stats.totalExternalLinks += externalLinks.length;

  const avgResponseTime =
    (crawlResult.stats.avgResponseTime * crawlResult.crawledPages + crawlTime) /
    (crawlResult.crawledPages + 1);
  crawlResult.stats.avgResponseTime = avgResponseTime;

  return {
    url: normalizedUrl,
    status,
    title,
    description,
    contentLength: html?.length || 0,
    isEmpty,
    crawlTime,
    internalLinks,
    externalLinks,
    inSitemap: false,
    errorMessage: error,
  };
};

export const updateCrawlProgress = (crawlResult: CrawlResult, page: CrawlPage): void => {
  crawlResult.pages.set(page.url, page);
  crawlResult.crawledPages += 1;

  if (page.status >= 400) {
    crawlResult.errorCount += 1;

    // Track broken links
    page.internalLinks.forEach((link) => {
      if (!crawlResult.brokenLinks.has(link)) {
        crawlResult.brokenLinks.set(link, new Set());
      }
      crawlResult.brokenLinks.get(link)!.add(page.url);
    });
  }
};

export const shouldCrawlPage = (
  url: string,
  crawlResult: CrawlResult,
  config: CrawlConfig
): boolean => {
  // Already crawled
  if (crawlResult.pages.has(normalizeUrl(url))) {
    return false;
  }

  // Not a valid URL
  if (!isValidUrl(url)) {
    return false;
  }

  // Max pages reached
  if (config.maxPages && crawlResult.pages.size >= config.maxPages) {
    return false;
  }

  // Check depth (simple check - count slashes)
  if (config.maxDepth) {
    const baseDepth = new URL(crawlResult.url).pathname.split('/').length;
    const pageDepth = new URL(url).pathname.split('/').length;
    if (pageDepth - baseDepth > config.maxDepth) {
      return false;
    }
  }

  return true;
};

export const enqueuePagesToCrawl = (
  crawlResult: CrawlResult,
  config: CrawlConfig,
  queue: Set<string>
): void => {
  // Collect all discovered pages
  const toAdd = new Set<string>();

  crawlResult.pages.forEach((page) => {
    page.internalLinks.forEach((link) => {
      if (shouldCrawlPage(link, crawlResult, config)) {
        toAdd.add(link);
      }
    });
  });

  // Add to queue, respecting concurrency
  toAdd.forEach((url) => {
    if (queue.size < (config.concurrency || 5)) {
      queue.add(url);
    }
  });
};
