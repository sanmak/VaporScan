/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

export interface CrawlPage {
  url: string;
  status: number;
  title?: string;
  description?: string;
  contentLength?: number;
  isEmpty: boolean;
  crawlTime: number;
  internalLinks: string[];
  externalLinks: string[];
  inSitemap: boolean;
  errorMessage?: string;
  content?: Blob;
}

export interface CrawlResult {
  id: string;
  url: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'crawling' | 'completed' | 'failed' | 'paused';
  pages: Map<string, CrawlPage>;
  totalPages: number;
  crawledPages: number;
  errorCount: number;
  orphanedPages: string[];
  brokenLinks: Map<string, Set<string>>;
  sitemapUrls: string[];
  robotsData: RobotsData | null;
  stats: {
    avgResponseTime: number;
    totalInternalLinks: number;
    totalExternalLinks: number;
  };
}

export interface SitemapData {
  urls: string[];
  lastmod?: string;
}

export interface RobotsData {
  disallow: string[];
  allow: string[];
  userAgent: string;
  crawlDelay?: number;
  sitemaps?: string[];
  host?: string;
}

export interface LinkResult {
  url: string;
  status: number;
  referencedFrom: string[];
}

export interface OrphanedPage {
  url: string;
  inSitemap: boolean;
  referredBy: string[];
}

export interface ReportData {
  id: string;
  crawlId: string;
  generatedAt: number;
  targetUrl: string;
  summary: {
    totalPages: number;
    crawledPages: number;
    orphanedCount: number;
    brokenLinkCount: number;
    emptyPageCount: number;
    avgResponseTime: number;
  };
  orphanedPages: OrphanedPage[];
  brokenLinks: LinkResult[];
  emptyPages: CrawlPage[];
  sitemapOnlyPages: string[];
  sitemapUrls: string[];
  robotsData: RobotsData | null;
}

export interface CrawlConfig {
  url: string;
  maxDepth?: number;
  maxPages?: number;
  concurrency?: number;
  respectRobotsTxt: boolean;
  timeout?: number;
  userAgent?: string;
  manualPages?: string[];
}

export interface CrawlProgress {
  status: 'pending' | 'crawling' | 'completed' | 'failed' | 'paused';
  totalPages: number;
  crawledPages: number;
  errorCount: number;
  progress: number;
  currentPage?: string;
  estimatedTimeRemaining?: number;
}
