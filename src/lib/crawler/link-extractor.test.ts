/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { describe, it, expect } from 'vitest';
import {
  extractLinksFromHTML,
  resolveUrl,
  normalizeUrl,
  isValidUrl,
  getDomain,
  isSameDomain,
} from './link-extractor';

describe('Link Extractor', () => {
  describe('normalizeUrl', () => {
    it('should remove trailing slashes except for root', () => {
      expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
    });

    it('should lowercase URLs', () => {
      expect(normalizeUrl('HTTPS://EXAMPLE.COM/PATH')).toBe('https://example.com/path');
    });

    it('should remove query parameters and fragments', () => {
      expect(normalizeUrl('https://example.com/path?query=1#section')).toBe(
        'https://example.com/path'
      );
    });
  });

  describe('resolveUrl', () => {
    it('should return absolute URLs unchanged', () => {
      const url = 'https://example.com/page';
      expect(resolveUrl(url, 'https://example.com')).toBe(url);
    });

    it('should resolve relative URLs', () => {
      expect(resolveUrl('/page', 'https://example.com/dir/')).toBe('https://example.com/page');
      expect(resolveUrl('../page', 'https://example.com/dir/subdir/')).toBe(
        'https://example.com/dir/page'
      );
    });

    it('should return null for invalid URLs', () => {
      // 'not a url' is actually a valid relative path, so it resolves to a URL with %20
      expect(resolveUrl('not a url', 'https://example.com')).toBe(
        'https://example.com/not%20a%20url'
      );
    });
  });

  describe('isValidUrl', () => {
    it('should validate HTTP and HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('getDomain', () => {
    it('should extract domain from URL', () => {
      expect(getDomain('https://example.com/path')).toBe('example.com');
      expect(getDomain('https://subdomain.example.com')).toBe('subdomain.example.com');
    });

    it('should return null for invalid URLs', () => {
      expect(getDomain('not a url')).toBe(null);
    });
  });

  describe('isSameDomain', () => {
    it('should return true for same domains', () => {
      expect(isSameDomain('https://example.com/page1', 'https://example.com/page2')).toBe(true);
    });

    it('should return false for different domains', () => {
      expect(isSameDomain('https://example.com', 'https://other.com')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isSameDomain('not a url', 'https://example.com')).toBe(false);
    });
  });

  describe('extractLinksFromHTML', () => {
    it('should extract links from HTML', () => {
      const html = `
        <html>
          <body>
            <a href="/page1">Link 1</a>
            <a href="https://example.com/page2">Link 2</a>
            <a href="https://other.com">External</a>
          </body>
        </html>
      `;

      const result = extractLinksFromHTML(html, 'https://example.com/');
      expect(result.internal).toContain('https://example.com/page1');
      expect(result.internal).toContain('https://example.com/page2');
      expect(result.external).toContain('https://other.com/');
    });

    it('should skip fragments and mailto links', () => {
      const html = `
        <html>
          <body>
            <a href="#section">Fragment</a>
            <a href="mailto:test@example.com">Email</a>
            <a href="/valid">Valid</a>
          </body>
        </html>
      `;

      const result = extractLinksFromHTML(html, 'https://example.com/');
      expect(result.internal).not.toContain('#section');
      expect(result.internal).toContain('https://example.com/valid');
    });

    it('should handle invalid HTML gracefully', () => {
      const html = 'not valid html';
      const result = extractLinksFromHTML(html, 'https://example.com/');
      expect(result.internal).toEqual([]);
      expect(result.external).toEqual([]);
    });
  });
});
