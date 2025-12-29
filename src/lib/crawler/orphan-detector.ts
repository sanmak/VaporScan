/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Detects orphaned pages and broken links from crawl data
 */

import { CrawlResult, CrawlPage, OrphanedPage, LinkResult } from '@/types';

export const detectOrphanedPages = (
  crawlResult: CrawlResult,
  sitemapUrls: Set<string>
): OrphanedPage[] => {
  const orphaned: OrphanedPage[] = [];
  const incomingLinks = buildIncomingLinkMap(crawlResult);

  crawlResult.pages.forEach((_, url) => {
    // A page is orphaned if:
    // 1. It has no incoming internal links AND
    // 2. It's not in the sitemap
    const hasIncomingLinks = (incomingLinks.get(url) ?? []).length > 0;
    const inSitemap = sitemapUrls.has(url);

    if (!hasIncomingLinks && !inSitemap) {
      orphaned.push({
        url,
        inSitemap: false,
        referredBy: [],
      });
    }
  });

  return orphaned;
};

export const detectSitemapOnlyPages = (
  crawlResult: CrawlResult,
  sitemapUrls: Set<string>
): string[] => {
  const incomingLinks = buildIncomingLinkMap(crawlResult);
  const sitemapOnly: string[] = [];

  sitemapUrls.forEach((url) => {
    const hasIncomingLinks = (incomingLinks.get(url) ?? []).length > 0;
    const isCrawled = crawlResult.pages.has(url);

    // Sitemap-only if: in sitemap AND has no incoming internal links AND was crawled
    if (!hasIncomingLinks && isCrawled) {
      sitemapOnly.push(url);
    }
  });

  return sitemapOnly;
};

export const detectBrokenLinks = (crawlResult: CrawlResult): LinkResult[] => {
  const broken: LinkResult[] = [];
  const incomingLinks = buildIncomingLinkMap(crawlResult);

  crawlResult.pages.forEach((page) => {
    // Check for 4xx and 5xx status codes
    if (page.status >= 400) {
      const referredBy = incomingLinks.get(page.url) ?? [];
      if (referredBy.length > 0) {
        broken.push({
          url: page.url,
          status: page.status,
          referencedFrom: referredBy,
        });
      }
    }
  });

  return broken;
};

export const detectEmptyPages = (crawlResult: CrawlResult): CrawlPage[] => {
  const empty: CrawlPage[] = [];

  crawlResult.pages.forEach((page) => {
    if (page.isEmpty) {
      empty.push(page);
    }
  });

  return empty;
};

export const buildIncomingLinkMap = (crawlResult: CrawlResult): Map<string, string[]> => {
  const incomingLinks = new Map<string, string[]>();

  crawlResult.pages.forEach((page) => {
    page.internalLinks.forEach((link) => {
      if (!incomingLinks.has(link)) {
        incomingLinks.set(link, []);
      }
      incomingLinks.get(link)!.push(page.url);
    });
  });

  return incomingLinks;
};

export const calculateLinkStats = (crawlResult: CrawlResult) => {
  let totalInternalLinks = 0;
  let totalExternalLinks = 0;
  const totalPages = crawlResult.pages.size;
  let pagesWith200Status = 0;
  let pagesWith404Status = 0;

  crawlResult.pages.forEach((page) => {
    totalInternalLinks += page.internalLinks.length;
    totalExternalLinks += page.externalLinks.length;

    if (page.status === 200) {
      pagesWith200Status += 1;
    }
    if (page.status === 404) {
      pagesWith404Status += 1;
    }
  });

  return {
    totalPages,
    pagesWith200Status,
    pagesWith404Status,
    totalInternalLinks,
    totalExternalLinks,
    avgLinksPerPage: totalInternalLinks / (totalPages || 1),
  };
};
