/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Parses robots.txt and XML sitemaps to discover URLs
 */

import { RobotsData, SitemapData } from '@/types';
import { normalizeUrl, isValidUrl } from './link-extractor';

/**
 * Fetches and parses robots.txt from a given base URL
 */
export const fetchRobotsTxt = async (baseUrl: string): Promise<RobotsData | null> => {
  try {
    const url = new URL('/robots.txt', baseUrl);
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'VaporScan/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    return parseRobotsTxt(text);
  } catch (error) {
    console.error('Error fetching robots.txt:', error);
    return null;
  }
};

/**
 * Parses robots.txt content
 */
export const parseRobotsTxt = (content: string): RobotsData => {
  const lines = content.split('\n');
  const result: RobotsData = {
    disallow: [],
    allow: [],
    userAgent: '*',
    sitemaps: [],
  };

  let currentUserAgent = '*';
  let isRelevantSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) continue;

    const directive = trimmedLine.slice(0, colonIndex).toLowerCase().trim();
    const value = trimmedLine.slice(colonIndex + 1).trim();

    if (directive === 'sitemap') {
      if (value && isValidUrl(value)) {
        if (!result.sitemaps) result.sitemaps = [];
        result.sitemaps.push(value);
      }
    } else if (directive === 'host') {
      result.host = value;
    } else if (directive === 'user-agent') {
      currentUserAgent = value;
      // Check if this section applies to us (VaporScan or *)
      isRelevantSection = value === '*' || value.toLowerCase().includes('vaporscan');
    } else if (isRelevantSection || currentUserAgent === '*') {
      if (directive === 'disallow' && value) {
        result.disallow.push(value);
      } else if (directive === 'allow' && value) {
        result.allow.push(value);
      } else if (directive === 'crawl-delay') {
        const delay = parseFloat(value);
        if (!isNaN(delay)) {
          result.crawlDelay = delay;
        }
      }
    }
  }

  return result;
};

/**
 * Checks if a URL path is allowed by robots.txt rules
 */
export const isPathAllowed = (path: string, robotsData: RobotsData | null): boolean => {
  if (!robotsData) return true;

  // Find the most specific matching rule (longest pattern wins)
  let longestMatch: { type: 'allow' | 'disallow'; pattern: string } | null = null;

  // Check all allow rules
  for (const allowPattern of robotsData.allow) {
    if (matchesRobotsPattern(path, allowPattern)) {
      if (!longestMatch || allowPattern.length > longestMatch.pattern.length) {
        longestMatch = { type: 'allow', pattern: allowPattern };
      }
    }
  }

  // Check all disallow rules
  for (const disallowPattern of robotsData.disallow) {
    if (matchesRobotsPattern(path, disallowPattern)) {
      if (!longestMatch || disallowPattern.length > longestMatch.pattern.length) {
        longestMatch = { type: 'disallow', pattern: disallowPattern };
      }
    }
  }

  // If we found a matching rule, use it; otherwise allow by default
  if (longestMatch) {
    return longestMatch.type === 'allow';
  }

  return true;
};

/**
 * Matches a path against a robots.txt pattern
 */
const matchesRobotsPattern = (path: string, pattern: string): boolean => {
  // Handle wildcard patterns
  if (pattern.includes('*')) {
    const regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}`);
    return regex.test(path);
  }

  // Handle $ end anchor
  if (pattern.endsWith('$')) {
    return path === pattern.slice(0, -1);
  }

  // Simple prefix matching
  return path.startsWith(pattern);
};

/**
 * Extracts sitemap URLs from robots.txt
 */
export const extractSitemapUrls = async (baseUrl: string): Promise<string[]> => {
  const sitemapUrls: string[] = [];

  try {
    const robotsUrl = new URL('/robots.txt', baseUrl);
    const response = await fetch(robotsUrl.toString(), {
      headers: {
        'User-Agent': 'VaporScan/1.0',
      },
    });

    if (response.ok) {
      const text = await response.text();
      const lines = text.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim().toLowerCase();
        if (trimmedLine.startsWith('sitemap:')) {
          const sitemapUrl = line.slice(line.indexOf(':') + 1).trim();
          if (isValidUrl(sitemapUrl)) {
            sitemapUrls.push(sitemapUrl);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting sitemap URLs:', error);
  }

  // If no sitemaps found in robots.txt, try common locations
  if (sitemapUrls.length === 0) {
    const commonLocations = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml'];

    for (const location of commonLocations) {
      try {
        const url = new URL(location, baseUrl);
        const response = await fetch(url.toString(), {
          method: 'HEAD',
          headers: {
            'User-Agent': 'VaporScan/1.0',
          },
        });

        if (response.ok) {
          sitemapUrls.push(url.toString());
          break;
        }
      } catch {
        continue;
      }
    }
  }

  return sitemapUrls;
};

/**
 * Fetches and parses an XML sitemap
 */
export const fetchSitemap = async (sitemapUrl: string): Promise<SitemapData> => {
  const result: SitemapData = {
    urls: [],
  };

  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'VaporScan/1.0',
      },
    });

    if (!response.ok) {
      return result;
    }

    const text = await response.text();
    return parseSitemapXml(text);
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return result;
  }
};

/**
 * Parses sitemap XML content
 */
export const parseSitemapXml = (xmlContent: string): SitemapData => {
  const result: SitemapData = {
    urls: [],
  };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    // Check for sitemap index (contains other sitemaps)
    const sitemapIndexElements = doc.querySelectorAll('sitemapindex sitemap loc');
    if (sitemapIndexElements.length > 0) {
      // Return the nested sitemap URLs for further processing
      sitemapIndexElements.forEach((element) => {
        const loc = element.textContent?.trim();
        if (loc && isValidUrl(loc)) {
          result.urls.push(loc);
        }
      });
      return result;
    }

    // Parse regular sitemap URLs
    const urlElements = doc.querySelectorAll('urlset url loc');
    urlElements.forEach((element) => {
      const loc = element.textContent?.trim();
      if (loc && isValidUrl(loc)) {
        result.urls.push(normalizeUrl(loc));
      }
    });

    // Get lastmod if available
    const lastmodElement = doc.querySelector('urlset url lastmod');
    if (lastmodElement?.textContent) {
      result.lastmod = lastmodElement.textContent.trim();
    }
  } catch (error) {
    console.error('Error parsing sitemap XML:', error);
  }

  return result;
};

/**
 * Recursively fetches all URLs from sitemaps (including sitemap indexes)
 */
export const fetchAllSitemapUrls = async (
  baseUrl: string,
  maxDepth: number = 3
): Promise<Set<string>> => {
  const allUrls = new Set<string>();
  const processedSitemaps = new Set<string>();

  const processSitemap = async (sitemapUrl: string, depth: number): Promise<void> => {
    if (depth > maxDepth || processedSitemaps.has(sitemapUrl)) {
      return;
    }

    processedSitemaps.add(sitemapUrl);

    const sitemapData = await fetchSitemap(sitemapUrl);

    for (const url of sitemapData.urls) {
      // Check if this is a nested sitemap
      if (url.endsWith('.xml') || url.includes('sitemap')) {
        await processSitemap(url, depth + 1);
      } else {
        allUrls.add(url);
      }
    }
  };

  // Get sitemap URLs from robots.txt
  const sitemapUrls = await extractSitemapUrls(baseUrl);

  // Process each sitemap
  for (const sitemapUrl of sitemapUrls) {
    await processSitemap(sitemapUrl, 0);
  }

  return allUrls;
};

/**
 * Discovers all URLs from a website using robots.txt and sitemaps
 */
export const discoverUrls = async (
  baseUrl: string,
  respectRobotsTxt: boolean = true
): Promise<{
  sitemapUrls: Set<string>;
  robotsData: RobotsData | null;
}> => {
  let robotsData: RobotsData | null = null;

  if (respectRobotsTxt) {
    robotsData = await fetchRobotsTxt(baseUrl);
  }

  const sitemapUrls = await fetchAllSitemapUrls(baseUrl);

  // Filter URLs based on robots.txt if applicable
  if (respectRobotsTxt && robotsData) {
    const filteredUrls = new Set<string>();

    for (const url of sitemapUrls) {
      try {
        const path = new URL(url).pathname;
        if (isPathAllowed(path, robotsData)) {
          filteredUrls.add(url);
        }
      } catch {
        // Skip invalid URLs
      }
    }

    return { sitemapUrls: filteredUrls, robotsData };
  }

  return { sitemapUrls, robotsData };
};
