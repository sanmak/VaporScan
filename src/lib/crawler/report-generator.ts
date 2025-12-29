/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Generates comprehensive crawl reports from crawl results
 */

import { CrawlResult, ReportData } from '@/types';
import {
  detectOrphanedPages,
  detectBrokenLinks,
  detectSitemapOnlyPages,
  detectEmptyPages,
  calculateLinkStats,
} from './orphan-detector';

export const generateReport = (crawlResult: CrawlResult): ReportData => {
  const sitemapUrlsSeq = new Set(crawlResult.sitemapUrls || []);
  const orphanedPages = detectOrphanedPages(crawlResult, sitemapUrlsSeq);
  const brokenLinks = detectBrokenLinks(crawlResult);
  const sitemapOnlyPages = detectSitemapOnlyPages(crawlResult, sitemapUrlsSeq);
  const emptyPages = detectEmptyPages(crawlResult);
  const linkStats = calculateLinkStats(crawlResult);

  const crawledPages = Array.from(crawlResult.pages.values()).filter(
    (p) => p.status === 200
  ).length;

  return {
    id: `report-${crawlResult.id}-${Date.now()}`,
    crawlId: crawlResult.id,
    generatedAt: Date.now(),
    targetUrl: crawlResult.url,
    summary: {
      totalPages: linkStats.totalPages,
      crawledPages,
      orphanedCount: orphanedPages.length,
      brokenLinkCount: brokenLinks.length,
      emptyPageCount: emptyPages.length,
      avgResponseTime: crawlResult.stats.avgResponseTime,
    },
    orphanedPages,
    brokenLinks,
    emptyPages,
    sitemapOnlyPages,
    sitemapUrls: crawlResult.sitemapUrls || [],
    robotsData: crawlResult.robotsData || null,
  };
};

export const formatReportForJSON = (report: ReportData) => {
  return {
    ...report,
    generatedAt: new Date(report.generatedAt).toISOString(),
  };
};

export const formatReportForCSV = (report: ReportData): string => {
  const lines: string[] = [];

  // Summary section
  lines.push('VaporScan Report');
  lines.push(`Target URL,${report.targetUrl}`);
  lines.push(`Generated At,${new Date(report.generatedAt).toISOString()}`);
  lines.push('');

  // Summary metrics
  lines.push('Summary Metrics');
  lines.push('Metric,Value');
  lines.push(`Total Pages,${report.summary.totalPages}`);
  lines.push(`Crawled Pages,${report.summary.crawledPages}`);
  lines.push(`Orphaned Pages,${report.summary.orphanedCount}`);
  lines.push(`Broken Links,${report.summary.brokenLinkCount}`);
  lines.push(`Empty Pages,${report.summary.emptyPageCount}`);
  lines.push(`Avg Response Time,${report.summary.avgResponseTime.toFixed(2)}ms`);
  lines.push('');

  // Orphaned pages
  if (report.orphanedPages.length > 0) {
    lines.push('Orphaned Pages');
    lines.push('URL,In Sitemap,Referred By Count');
    report.orphanedPages.forEach((page) => {
      lines.push(`"${page.url}",${page.inSitemap},${page.referredBy.length}`);
    });
    lines.push('');
  }

  // Broken links
  if (report.brokenLinks.length > 0) {
    lines.push('Broken Links');
    lines.push('URL,Status,Referenced From Count');
    report.brokenLinks.forEach((link) => {
      lines.push(`"${link.url}",${link.status},${link.referencedFrom.length}`);
    });
    lines.push('');
  }

  // Empty pages
  if (report.emptyPages.length > 0) {
    lines.push('Empty Pages');
    lines.push('URL,Status,Content Length');
    report.emptyPages.forEach((page) => {
      lines.push(`"${page.url}",${page.status},${page.contentLength || 0}`);
    });
    lines.push('');
  }

  // Sitemap-only pages
  if (report.sitemapOnlyPages.length > 0) {
    lines.push('Sitemap-Only Pages');
    lines.push('URL');
    report.sitemapOnlyPages.forEach((url) => {
      lines.push(`"${url}"`);
    });
  }

  return lines.join('\n');
};

export const getReportSummaryText = (report: ReportData): string => {
  const { summary, targetUrl, orphanedPages, brokenLinks } = report;

  return `
VaporScan SEO Audit Report
==========================

Target: ${targetUrl}
Generated: ${new Date(report.generatedAt).toLocaleString()}

SUMMARY
-------
Total Pages Crawled: ${summary.crawledPages}
Total Pages Discovered: ${summary.totalPages}
Orphaned Pages: ${summary.orphanedCount}
Broken Links Found: ${summary.brokenLinkCount}
Empty Pages: ${summary.emptyPageCount}
Average Response Time: ${summary.avgResponseTime.toFixed(2)}ms

CRITICAL ISSUES
---------------
${brokenLinks.length > 0 ? `Found ${brokenLinks.length} broken links that need attention.` : 'No broken links found.'}
${orphanedPages.length > 0 ? `Found ${orphanedPages.length} orphaned pages without internal navigation.` : 'No orphaned pages found.'}

RECOMMENDATIONS
---------------
1. Review and fix broken links to improve user experience
2. Audit orphaned pages - consider adding navigation links or removing them
3. Ensure all important pages are linked from at least one other page
4. Update sitemap with accurate content structure
  `.trim();
};
