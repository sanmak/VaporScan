/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Extracts internal and external links from HTML content
 */

export const extractLinksFromHTML = (
  html: string,
  baseUrl: string
): { internal: string[]; external: string[] } => {
  const internalLinks = new Set<string>();
  const externalLinks = new Set<string>();

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract all anchor tags
    const links = doc.querySelectorAll('a[href]');

    links.forEach((link) => {
      try {
        const href = link.getAttribute('href');
        if (!href) return;

        // Skip fragment-only links
        if (href.startsWith('#')) return;

        // Skip mailto, tel, etc
        if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

        // Resolve relative URLs
        const absoluteUrl = resolveUrl(href, baseUrl);
        if (!absoluteUrl) return;

        const linkDomain = new URL(absoluteUrl).hostname;
        const baseDomain = new URL(baseUrl).hostname;

        if (linkDomain === baseDomain) {
          internalLinks.add(normalizeUrl(absoluteUrl));
        } else {
          externalLinks.add(normalizeUrl(absoluteUrl));
        }
      } catch {
        // Skip invalid URLs
      }
    });
  } catch {
    // Return empty if parsing fails
  }

  return {
    internal: Array.from(internalLinks),
    external: Array.from(externalLinks),
  };
};

export const resolveUrl = (url: string, baseUrl: string): string | null => {
  try {
    // If absolute URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Relative URL - resolve against base
    const base = new URL(baseUrl);
    const resolved = new URL(url, base);
    return resolved.toString();
  } catch {
    return null;
  }
};

export const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);

    // Remove trailing slashes (except for root)
    let pathname = parsed.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Remove query parameters and fragments
    const normalized = `${parsed.protocol}//${parsed.hostname}${pathname}`;
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};

export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const getDomain = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

export const isSameDomain = (url1: string, url2: string): boolean => {
  const domain1 = getDomain(url1);
  const domain2 = getDomain(url2);
  return domain1 !== null && domain2 !== null && domain1 === domain2;
};
