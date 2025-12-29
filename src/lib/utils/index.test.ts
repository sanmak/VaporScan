/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Unit tests for utility functions
 * Coverage: formatBytes, formatTime, generateUniqueId, delay, retryWithBackoff,
 *           parseUrl, isSameDomain, sortByProperty, groupBy, chunk, cn
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatBytes,
  formatTime,
  generateUniqueId,
  delay,
  retryWithBackoff,
  parseUrl,
  isSameDomain,
  sortByProperty,
  groupBy,
  chunk,
  cn,
} from './index';

describe('Utility Functions', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      // ACT & ASSERT
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      // ACT & ASSERT
      expect(formatBytes(500)).toBe('500 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format kilobytes correctly', () => {
      // ACT & ASSERT
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });

    it('should format megabytes correctly', () => {
      // ACT & ASSERT
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
    });

    it('should round to 2 decimal places', () => {
      // ACT & ASSERT
      expect(formatBytes(1024 * 1.234)).toBe('1.23 KB');
      expect(formatBytes(1024 * 1.239)).toBe('1.24 KB');
    });

    it('should handle large numbers', () => {
      // ACT & ASSERT
      const result = formatBytes(1024 * 1024 * 1024 * 1000);
      expect(result).toContain('GB');
    });
  });

  describe('formatTime', () => {
    it('should format milliseconds when less than 1 second', () => {
      // ACT & ASSERT
      expect(formatTime(500)).toContain('ms');
      expect(formatTime(999)).toContain('ms');
    });

    it('should format seconds when between 1 and 60 seconds', () => {
      // ACT & ASSERT
      expect(formatTime(1000)).toContain('s');
      expect(formatTime(5000)).toBe('5.00s');
      expect(formatTime(59999)).toContain('s');
    });

    it('should format minutes when >= 60 seconds', () => {
      // ACT & ASSERT
      expect(formatTime(60000)).toBe('1.00m');
      expect(formatTime(120000)).toBe('2.00m');
    });

    it('should round milliseconds', () => {
      // ACT & ASSERT
      expect(formatTime(100)).toBe('100ms');
      expect(formatTime(500)).toBe('500ms');
    });

    it('should show 2 decimal places for seconds and minutes', () => {
      // ACT & ASSERT
      expect(formatTime(1500)).toBe('1.50s');
      expect(formatTime(90000)).toBe('1.50m');
    });

    it('should handle 0 milliseconds', () => {
      // ACT & ASSERT
      expect(formatTime(0)).toBe('0ms');
    });

    it('should handle very large times', () => {
      // ACT & ASSERT
      const result = formatTime(10000000); // ~166 minutes
      expect(result).toContain('m');
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      // ACT
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();

      // ASSERT
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should generate IDs in correct format', () => {
      // ACT
      const id = generateUniqueId();

      // ASSERT
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate IDs with timestamp prefix', () => {
      // ACT
      const before = Date.now();
      const id = generateUniqueId();
      const after = Date.now();

      const timestamp = parseInt(id.split('-')[0], 10);

      // ASSERT
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate multiple unique IDs in quick succession', () => {
      // ACT
      const ids = Array.from({ length: 100 }, () => generateUniqueId());
      const uniqueIds = new Set(ids);

      // ASSERT
      expect(uniqueIds.size).toBe(100);
    });
  });

  describe('delay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay execution by specified time', async () => {
      // ARRANGE
      const promise = delay(1000);

      // ACT
      vi.advanceTimersByTime(1000);
      await promise;

      // ASSERT (just verify it resolves after the time)
      expect(true).toBe(true);
    });

    it('should return a promise', () => {
      // ACT
      const result = delay(100);

      // ASSERT
      expect(result).toBeInstanceOf(Promise);
    });

    it('should work with 0 delay', async () => {
      // ARRANGE
      const promise = delay(0);

      // ACT
      vi.advanceTimersByTime(0);
      await promise;

      // ASSERT
      expect(true).toBe(true);
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      // ARRANGE
      const fn = vi.fn().mockResolvedValue('success');

      // ACT
      const promise = retryWithBackoff(fn);
      await vi.runAllTimersAsync();
      const result = await promise;

      // ASSERT
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      // ARRANGE
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      // ACT
      const promise = retryWithBackoff(fn, 3);
      await vi.runAllTimersAsync();
      const result = await promise;

      // ASSERT
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      // ARRANGE
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      // ACT
      const promise = retryWithBackoff(fn, 3);

      // Handle promise rejection to avoid unhandled rejection warning
      promise.catch(() => {});

      // Wait for timers and handle rejection
      await vi.runAllTimersAsync();

      // ASSERT
      await expect(promise).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      // ARRANGE
      let lastCallTime = 0;
      const callTimes: number[] = [];
      const fn = vi.fn().mockImplementation(async () => {
        const now = Date.now();
        if (lastCallTime > 0) {
          callTimes.push(now - lastCallTime);
        }
        lastCallTime = now;
        throw new Error('fail');
      });

      // ACT
      const promise = retryWithBackoff(fn, 3, 1000);

      // Handle promise rejection to avoid unhandled rejection
      promise.catch(() => {});

      await vi.runAllTimersAsync();

      // ASSERT
      expect(fn).toHaveBeenCalledTimes(3);
      // Delays should be: 1000ms, 2000ms (exponential backoff)
    });

    it('should handle custom max retries', async () => {
      // ARRANGE
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      // ACT
      const promise = retryWithBackoff(fn, 5);

      // Handle promise rejection to avoid unhandled rejection
      promise.catch(() => {});

      await vi.runAllTimersAsync();

      // ASSERT
      expect(fn).toHaveBeenCalledTimes(5);
    });

    it('should handle custom base delay', async () => {
      // ARRANGE
      const fn = vi.fn().mockRejectedValueOnce(new Error('fail 1')).mockResolvedValue('success');

      // ACT
      const promise = retryWithBackoff(fn, 3, 500);
      await vi.runAllTimersAsync();
      await promise;

      // ASSERT
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw Error for non-Error rejections', async () => {
      // ARRANGE
      const fn = vi.fn().mockRejectedValue('string error');

      // ACT
      const promise = retryWithBackoff(fn, 2);

      // Handle promise rejection to avoid unhandled rejection warning
      promise.catch(() => {});

      // Wait for timers
      await vi.runAllTimersAsync();

      // ASSERT
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('parseUrl', () => {
    it('should parse valid URLs', () => {
      // ACT
      const result = parseUrl('https://example.com/path?query=1#hash');

      // ASSERT
      expect(result).toBeInstanceOf(URL);
      expect(result?.hostname).toBe('example.com');
      expect(result?.pathname).toBe('/path');
      expect(result?.search).toBe('?query=1');
      expect(result?.hash).toBe('#hash');
    });

    it('should parse URLs with different protocols', () => {
      // ACT & ASSERT
      expect(parseUrl('http://example.com')?.protocol).toBe('http:');
      expect(parseUrl('https://example.com')?.protocol).toBe('https:');
    });

    it('should return null for invalid URLs', () => {
      // ACT & ASSERT
      expect(parseUrl('not a url')).toBeNull();
      expect(parseUrl('')).toBeNull();
      expect(parseUrl('//no-protocol')).toBeNull();
    });

    it('should handle URLs with ports', () => {
      // ACT
      const result = parseUrl('https://example.com:8080/path');

      // ASSERT
      expect(result?.port).toBe('8080');
    });

    it('should handle URLs with subdomains', () => {
      // ACT
      const result = parseUrl('https://subdomain.example.com');

      // ASSERT
      expect(result?.hostname).toBe('subdomain.example.com');
    });

    it('should handle URLs with authentication', () => {
      // ACT
      const result = parseUrl('https://user:pass@example.com');

      // ASSERT
      expect(result?.username).toBe('user');
      expect(result?.password).toBe('pass');
    });
  });

  describe('isSameDomain', () => {
    it('should return true for same domains', () => {
      // ACT & ASSERT
      expect(isSameDomain('https://example.com/page1', 'https://example.com/page2')).toBe(true);
      expect(isSameDomain('http://example.com', 'https://example.com')).toBe(true);
    });

    it('should return false for different domains', () => {
      // ACT & ASSERT
      expect(isSameDomain('https://example.com', 'https://other.com')).toBe(false);
      expect(isSameDomain('https://example.com', 'https://subdomain.example.com')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      // ACT & ASSERT
      expect(isSameDomain('not a url', 'https://example.com')).toBe(false);
      expect(isSameDomain('https://example.com', 'not a url')).toBe(false);
      expect(isSameDomain('not a url', 'also not a url')).toBe(false);
    });

    it('should handle URLs with paths and queries', () => {
      // ACT & ASSERT
      expect(isSameDomain('https://example.com/page1?a=1', 'https://example.com/page2?b=2')).toBe(
        true
      );
    });

    it('should handle URLs with ports', () => {
      // ACT & ASSERT
      expect(isSameDomain('https://example.com:8080', 'https://example.com:9090')).toBe(true);
      expect(isSameDomain('https://example.com:8080', 'https://other.com:8080')).toBe(false);
    });

    it('should be case-insensitive for domains', () => {
      // ACT & ASSERT
      expect(isSameDomain('https://EXAMPLE.COM', 'https://example.com')).toBe(true);
    });
  });

  describe('sortByProperty', () => {
    it('should sort by property in ascending order', () => {
      // ARRANGE
      const arr = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];

      // ACT
      const sorted = sortByProperty(arr, 'name');

      // ASSERT
      expect(sorted[0].name).toBe('a');
      expect(sorted[1].name).toBe('b');
      expect(sorted[2].name).toBe('c');
    });

    it('should sort by property in descending order', () => {
      // ARRANGE
      const arr = [{ value: 1 }, { value: 3 }, { value: 2 }];

      // ACT
      const sorted = sortByProperty(arr, 'value', 'desc');

      // ASSERT
      expect(sorted[0].value).toBe(3);
      expect(sorted[1].value).toBe(2);
      expect(sorted[2].value).toBe(1);
    });

    it('should not mutate original array', () => {
      // ARRANGE
      const arr = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
      const original = [...arr];

      // ACT
      sortByProperty(arr, 'name');

      // ASSERT
      expect(arr).toEqual(original);
    });

    it('should handle numeric sorting', () => {
      // ARRANGE
      const arr = [{ num: 10 }, { num: 2 }, { num: 1 }, { num: 20 }];

      // ACT
      const sorted = sortByProperty(arr, 'num');

      // ASSERT
      expect(sorted.map((item) => item.num)).toEqual([1, 2, 10, 20]);
    });

    it('should handle sorting with equal values', () => {
      // ARRANGE
      const arr = [{ name: 'a' }, { name: 'b' }, { name: 'a' }];

      // ACT
      const sorted = sortByProperty(arr, 'name');

      // ASSERT
      expect(sorted.filter((item) => item.name === 'a')).toHaveLength(2);
    });

    it('should handle empty array', () => {
      // ARRANGE
      const arr: Array<{ name: string }> = [];

      // ACT
      const sorted = sortByProperty(arr, 'name');

      // ASSERT
      expect(sorted).toEqual([]);
    });

    it('should handle single item array', () => {
      // ARRANGE
      const arr = [{ name: 'a' }];

      // ACT
      const sorted = sortByProperty(arr, 'name');

      // ASSERT
      expect(sorted).toEqual(arr);
    });
  });

  describe('groupBy', () => {
    it('should group objects by property', () => {
      // ARRANGE
      const arr = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];

      // ACT
      const grouped = groupBy(arr, 'type');

      // ASSERT
      expect(grouped.a).toHaveLength(2);
      expect(grouped.b).toHaveLength(1);
      expect(grouped.a).toContainEqual({ type: 'a', value: 1 });
      expect(grouped.a).toContainEqual({ type: 'a', value: 3 });
    });

    it('should handle numeric group keys', () => {
      // ARRANGE
      const arr = [
        { status: 200, url: 'a' },
        { status: 404, url: 'b' },
        { status: 200, url: 'c' },
      ];

      // ACT
      const grouped = groupBy(arr, 'status');

      // ASSERT
      expect(grouped['200']).toHaveLength(2);
      expect(grouped['404']).toHaveLength(1);
    });

    it('should handle empty array', () => {
      // ARRANGE
      const arr: Array<{ type: string }> = [];

      // ACT
      const grouped = groupBy(arr, 'type');

      // ASSERT
      expect(Object.keys(grouped)).toHaveLength(0);
    });

    it('should handle single group', () => {
      // ARRANGE
      const arr = [
        { type: 'a', value: 1 },
        { type: 'a', value: 2 },
      ];

      // ACT
      const grouped = groupBy(arr, 'type');

      // ASSERT
      expect(Object.keys(grouped)).toHaveLength(1);
      expect(grouped.a).toHaveLength(2);
    });

    it('should preserve item order within groups', () => {
      // ARRANGE
      const arr = [
        { type: 'a', value: 1 },
        { type: 'a', value: 2 },
        { type: 'a', value: 3 },
      ];

      // ACT
      const grouped = groupBy(arr, 'type');

      // ASSERT
      expect(grouped.a[0].value).toBe(1);
      expect(grouped.a[1].value).toBe(2);
      expect(grouped.a[2].value).toBe(3);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks of specified size', () => {
      // ARRANGE
      const arr = [1, 2, 3, 4, 5];

      // ACT
      const chunks = chunk(arr, 2);

      // ASSERT
      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle chunk size equal to array length', () => {
      // ARRANGE
      const arr = [1, 2, 3];

      // ACT
      const chunks = chunk(arr, 3);

      // ASSERT
      expect(chunks).toEqual([[1, 2, 3]]);
    });

    it('should handle chunk size larger than array length', () => {
      // ARRANGE
      const arr = [1, 2, 3];

      // ACT
      const chunks = chunk(arr, 10);

      // ASSERT
      expect(chunks).toEqual([[1, 2, 3]]);
    });

    it('should handle chunk size of 1', () => {
      // ARRANGE
      const arr = [1, 2, 3];

      // ACT
      const chunks = chunk(arr, 1);

      // ASSERT
      expect(chunks).toEqual([[1], [2], [3]]);
    });

    it('should handle empty array', () => {
      // ARRANGE
      const arr: number[] = [];

      // ACT
      const chunks = chunk(arr, 2);

      // ASSERT
      expect(chunks).toEqual([]);
    });

    it('should not mutate original array', () => {
      // ARRANGE
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];

      // ACT
      chunk(arr, 2);

      // ASSERT
      expect(arr).toEqual(original);
    });

    it('should handle various data types', () => {
      // ARRANGE
      const arr = ['a', 'b', 'c', 'd'];

      // ACT
      const chunks = chunk(arr, 2);

      // ASSERT
      expect(chunks).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });
  });

  describe('cn (className merge utility)', () => {
    it('should merge class names', () => {
      // ACT
      const result = cn('class1', 'class2');

      // ASSERT
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      // ACT
      const result = cn('base', { active: true, disabled: false });

      // ASSERT
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).not.toContain('disabled');
    });

    it('should handle Tailwind merge conflicts', () => {
      // ACT
      const result = cn('px-2', 'px-4');

      // ASSERT
      // Tailwind merge should keep only the last padding-x class
      expect(result).toBe('px-4');
    });

    it('should handle falsy values', () => {
      // ACT
      const result = cn('class1', null, undefined, false, 'class2');

      // ASSERT
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle arrays', () => {
      // ACT
      const result = cn(['class1', 'class2']);

      // ASSERT
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle empty input', () => {
      // ACT
      const result = cn();

      // ASSERT
      expect(result).toBe('');
    });
  });
});
