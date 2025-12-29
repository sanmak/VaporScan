/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Integration tests for Zustand store with IndexedDB persistence
 * Tests state management, persistence, and cross-component state synchronization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCrawlStore } from '@/lib/hooks/useCrawlStore';
import * as storage from '@/lib/storage/indexed-db';
import { CrawlConfig } from '@/types';
import { createMockCrawlResult } from '../fixtures/mock-crawl-data';

// Mock IndexedDB storage functions
vi.mock('@/lib/storage/indexed-db', () => ({
  saveCrawl: vi.fn(),
  getCrawl: vi.fn(),
  getAllCrawls: vi.fn(),
  deleteCrawl: vi.fn(),
}));

describe('CrawlStore Integration Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useCrawlStore.setState({
        currentCrawl: null,
        crawlHistory: [],
        isLoading: false,
        error: null,
      });
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeCrawl with storage persistence', () => {
    it('should initialize crawl and save to IndexedDB', async () => {
      // ARRANGE
      const config: CrawlConfig = {
        url: 'https://example.com',
        maxDepth: 3,
        maxPages: 100,
        concurrency: 5,
        respectRobotsTxt: true,
      };

      (storage.saveCrawl as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      await act(async () => {
        await result.current.initializeCrawl(config);
      });

      // ASSERT
      expect(result.current.currentCrawl).not.toBeNull();
      expect(result.current.currentCrawl?.url).toBe('https://example.com');
      expect(result.current.currentCrawl?.status).toBe('pending');
      expect(storage.saveCrawl).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during initialization', async () => {
      // ARRANGE
      const config: CrawlConfig = {
        url: 'https://example.com',
        respectRobotsTxt: true,
      };

      let resolveSave: any;
      (storage.saveCrawl as any).mockReturnValue(
        new Promise((resolve) => {
          resolveSave = resolve;
        })
      );

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      const initPromise = act(async () => {
        await result.current.initializeCrawl(config);
      });

      // ASSERT - loading state should be true during initialization
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      resolveSave();
      await initPromise;

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle storage errors gracefully', async () => {
      // ARRANGE
      const config: CrawlConfig = {
        url: 'https://example.com',
        respectRobotsTxt: true,
      };

      (storage.saveCrawl as any).mockRejectedValue(new Error('Storage quota exceeded'));

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      await act(async () => {
        await result.current.initializeCrawl(config);
      });

      // ASSERT
      expect(result.current.error).toBe('Storage quota exceeded');
      expect(result.current.currentCrawl).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should generate unique crawl IDs', async () => {
      // ARRANGE
      const config: CrawlConfig = {
        url: 'https://example.com',
        respectRobotsTxt: true,
      };

      (storage.saveCrawl as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      await act(async () => {
        await result.current.initializeCrawl(config);
      });

      const firstId = result.current.currentCrawl?.id;

      await act(async () => {
        await result.current.initializeCrawl(config);
      });

      const secondId = result.current.currentCrawl?.id;

      // ASSERT
      expect(firstId).toBeDefined();
      expect(secondId).toBeDefined();
      expect(firstId).not.toBe(secondId);
    });
  });

  describe('updateProgress with auto-save', () => {
    it('should update crawl progress and save to storage', async () => {
      // ARRANGE
      const mockCrawl = createMockCrawlResult({
        id: 'test-123',
        url: 'https://example.com',
        status: 'crawling',
      });

      (storage.saveCrawl as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCrawlStore());

      // Set initial crawl
      act(() => {
        result.current.currentCrawl = mockCrawl;
      });

      // ACT
      act(() => {
        result.current.updateProgress({
          crawledPages: 10,
          totalPages: 50,
        });
      });

      // ASSERT
      expect(result.current.currentCrawl?.crawledPages).toBe(10);
      expect(result.current.currentCrawl?.totalPages).toBe(50);
      expect(storage.saveCrawl).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-123',
          crawledPages: 10,
          totalPages: 50,
        })
      );
    });

    it('should handle multiple rapid updates', () => {
      // ARRANGE
      const mockCrawl = createMockCrawlResult();
      (storage.saveCrawl as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCrawlStore());

      act(() => {
        result.current.currentCrawl = mockCrawl;
      });

      // ACT - Simulate rapid progress updates
      act(() => {
        result.current.updateProgress({ crawledPages: 1 });
        result.current.updateProgress({ crawledPages: 2 });
        result.current.updateProgress({ crawledPages: 3 });
      });

      // ASSERT
      expect(result.current.currentCrawl?.crawledPages).toBe(3);
      expect(storage.saveCrawl).toHaveBeenCalledTimes(3);
    });

    it('should not update when currentCrawl is null', () => {
      // ARRANGE
      const { result } = renderHook(() => useCrawlStore());

      // ACT
      act(() => {
        result.current.updateProgress({ crawledPages: 10 });
      });

      // ASSERT
      expect(result.current.currentCrawl).toBeNull();
      expect(storage.saveCrawl).not.toHaveBeenCalled();
    });
  });

  describe('crawl lifecycle management', () => {
    it('should pause crawl and update status', () => {
      // ARRANGE
      const mockCrawl = createMockCrawlResult({ status: 'crawling' });
      const { result } = renderHook(() => useCrawlStore());

      act(() => {
        result.current.currentCrawl = mockCrawl;
      });

      // ACT
      act(() => {
        result.current.pauseCrawl();
      });

      // ASSERT
      expect(result.current.currentCrawl?.status).toBe('paused');
    });

    it('should resume paused crawl', () => {
      // ARRANGE
      const mockCrawl = createMockCrawlResult({ status: 'paused' });
      const { result } = renderHook(() => useCrawlStore());

      act(() => {
        result.current.currentCrawl = mockCrawl;
      });

      // ACT
      act(() => {
        result.current.resumeCrawl();
      });

      // ASSERT
      expect(result.current.currentCrawl?.status).toBe('crawling');
    });

    it('should cancel crawl and set end time', () => {
      // ARRANGE
      const mockCrawl = createMockCrawlResult({
        status: 'crawling',
        endTime: undefined,
      });
      const { result } = renderHook(() => useCrawlStore());

      act(() => {
        result.current.currentCrawl = mockCrawl;
      });

      // ACT
      act(() => {
        result.current.cancelCrawl();
      });

      // ASSERT
      expect(result.current.currentCrawl?.status).toBe('failed');
      expect(result.current.currentCrawl?.endTime).toBeDefined();
    });

    it('should handle pause when no crawl is active', () => {
      // ARRANGE
      const { result } = renderHook(() => useCrawlStore());

      // ACT
      act(() => {
        result.current.pauseCrawl();
      });

      // ASSERT
      expect(result.current.currentCrawl).toBeNull();
    });
  });

  describe('loadCrawl from storage', () => {
    it('should load crawl from IndexedDB', async () => {
      // ARRANGE
      const mockCrawl = createMockCrawlResult({
        id: 'saved-crawl-123',
        url: 'https://saved.com',
      });

      (storage.getCrawl as any).mockResolvedValue(mockCrawl);

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      await act(async () => {
        await result.current.loadCrawl('saved-crawl-123');
      });

      // ASSERT
      expect(result.current.currentCrawl).toEqual(mockCrawl);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(storage.getCrawl).toHaveBeenCalledWith('saved-crawl-123');
    });

    it('should handle crawl not found', async () => {
      // ARRANGE
      (storage.getCrawl as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      await act(async () => {
        await result.current.loadCrawl('nonexistent-id');
      });

      // ASSERT
      expect(result.current.error).toBe('Crawl not found');
      expect(result.current.currentCrawl).toBeNull();
    });

    it('should handle storage read errors', async () => {
      // ARRANGE
      (storage.getCrawl as any).mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      await act(async () => {
        await result.current.loadCrawl('error-id');
      });

      // ASSERT
      expect(result.current.error).toBe('Database error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('loadHistory from storage', () => {
    it('should load all crawls from IndexedDB', async () => {
      // ARRANGE
      const mockHistory = [
        createMockCrawlResult({ id: 'crawl-1' }),
        createMockCrawlResult({ id: 'crawl-2' }),
        createMockCrawlResult({ id: 'crawl-3' }),
      ];

      (storage.getAllCrawls as any).mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      await act(async () => {
        await result.current.loadHistory();
      });

      // ASSERT
      expect(result.current.crawlHistory).toHaveLength(3);
      expect(result.current.crawlHistory).toEqual(mockHistory);
      expect(result.current.isLoading).toBe(false);
      expect(storage.getAllCrawls).toHaveBeenCalledTimes(1);
    });

    it('should handle empty history', async () => {
      // ARRANGE
      (storage.getAllCrawls as any).mockResolvedValue([]);

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      await act(async () => {
        await result.current.loadHistory();
      });

      // ASSERT
      expect(result.current.crawlHistory).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle storage errors when loading history', async () => {
      // ARRANGE
      (storage.getAllCrawls as any).mockRejectedValue(new Error('Failed to load history'));

      const { result } = renderHook(() => useCrawlStore());

      // ACT
      await act(async () => {
        await result.current.loadHistory();
      });

      // ASSERT
      expect(result.current.error).toBe('Failed to load history');
      expect(result.current.crawlHistory).toEqual([]);
    });
  });

  describe('deleteCrawl', () => {
    it('should remove crawl from history', async () => {
      // ARRANGE
      const mockHistory = [
        createMockCrawlResult({ id: 'crawl-1' }),
        createMockCrawlResult({ id: 'crawl-2' }),
        createMockCrawlResult({ id: 'crawl-3' }),
      ];

      const { result } = renderHook(() => useCrawlStore());

      act(() => {
        result.current.crawlHistory = mockHistory;
      });

      // ACT
      await act(async () => {
        await result.current.deleteCrawl('crawl-2');
      });

      // ASSERT
      expect(result.current.crawlHistory).toHaveLength(2);
      expect(result.current.crawlHistory.map((c) => c.id)).not.toContain('crawl-2');
    });

    it('should clear currentCrawl if deleted', async () => {
      // ARRANGE
      const mockCrawl = createMockCrawlResult({ id: 'active-crawl' });

      const { result } = renderHook(() => useCrawlStore());

      act(() => {
        result.current.currentCrawl = mockCrawl;
        result.current.crawlHistory = [mockCrawl];
      });

      // ACT
      await act(async () => {
        await result.current.deleteCrawl('active-crawl');
      });

      // ASSERT
      expect(result.current.currentCrawl).toBeNull();
      expect(result.current.crawlHistory).toHaveLength(0);
    });

    it('should not clear currentCrawl if different crawl deleted', async () => {
      // ARRANGE
      const currentCrawl = createMockCrawlResult({ id: 'current' });
      const otherCrawl = createMockCrawlResult({ id: 'other' });

      const { result } = renderHook(() => useCrawlStore());

      act(() => {
        result.current.currentCrawl = currentCrawl;
        result.current.crawlHistory = [currentCrawl, otherCrawl];
      });

      // ACT
      await act(async () => {
        await result.current.deleteCrawl('other');
      });

      // ASSERT
      expect(result.current.currentCrawl?.id).toBe('current');
      expect(result.current.crawlHistory).toHaveLength(1);
    });
  });

  describe('error management', () => {
    it('should clear error state', () => {
      // ARRANGE
      const { result } = renderHook(() => useCrawlStore());

      act(() => {
        result.current.error = 'Some error occurred';
      });

      // ACT
      act(() => {
        result.current.clearError();
      });

      // ASSERT
      expect(result.current.error).toBeNull();
    });
  });

  describe('cross-hook state synchronization', () => {
    it('should synchronize state across multiple hook instances', async () => {
      // ARRANGE
      (storage.saveCrawl as any).mockResolvedValue(undefined);

      const { result: result1 } = renderHook(() => useCrawlStore());
      const { result: result2 } = renderHook(() => useCrawlStore());

      const config: CrawlConfig = {
        url: 'https://example.com',
        respectRobotsTxt: true,
      };

      // ACT - Initialize from first hook
      await act(async () => {
        await result1.current.initializeCrawl(config);
      });

      // ASSERT - Both hooks should see the same state
      expect(result1.current.currentCrawl?.url).toBe('https://example.com');
      expect(result2.current.currentCrawl?.url).toBe('https://example.com');
      expect(result1.current.currentCrawl?.id).toBe(result2.current.currentCrawl?.id);
    });

    it('should sync progress updates across hooks', () => {
      // ARRANGE
      const mockCrawl = createMockCrawlResult();
      (storage.saveCrawl as any).mockResolvedValue(undefined);

      const { result: result1 } = renderHook(() => useCrawlStore());
      const { result: result2 } = renderHook(() => useCrawlStore());

      act(() => {
        result1.current.currentCrawl = mockCrawl;
      });

      // ACT - Update from first hook
      act(() => {
        result1.current.updateProgress({ crawledPages: 42 });
      });

      // ASSERT - Second hook should see the update
      expect(result2.current.currentCrawl?.crawledPages).toBe(42);
    });

    it('should sync status changes across hooks', () => {
      // ARRANGE
      const mockCrawl = createMockCrawlResult({ status: 'crawling' });
      const { result: result1 } = renderHook(() => useCrawlStore());
      const { result: result2 } = renderHook(() => useCrawlStore());

      act(() => {
        result1.current.currentCrawl = mockCrawl;
      });

      // ACT
      act(() => {
        result1.current.pauseCrawl();
      });

      // ASSERT
      expect(result2.current.currentCrawl?.status).toBe('paused');
    });
  });

  describe('complex workflow scenarios', () => {
    it('should handle full crawl lifecycle with persistence', async () => {
      // ARRANGE
      (storage.saveCrawl as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCrawlStore());

      const config: CrawlConfig = {
        url: 'https://example.com',
        maxPages: 10,
        respectRobotsTxt: true,
      };

      // STEP 1: Initialize
      await act(async () => {
        await result.current.initializeCrawl(config);
      });

      expect(result.current.currentCrawl?.status).toBe('pending');

      // STEP 2: Start crawling
      act(() => {
        result.current.updateProgress({ status: 'crawling' });
      });

      expect(result.current.currentCrawl?.status).toBe('crawling');

      // STEP 3: Update progress
      act(() => {
        result.current.updateProgress({ crawledPages: 5, totalPages: 10 });
      });

      expect(result.current.currentCrawl?.crawledPages).toBe(5);

      // STEP 4: Pause
      act(() => {
        result.current.pauseCrawl();
      });

      expect(result.current.currentCrawl?.status).toBe('paused');

      // STEP 5: Resume
      act(() => {
        result.current.resumeCrawl();
      });

      expect(result.current.currentCrawl?.status).toBe('crawling');

      // STEP 6: Complete
      act(() => {
        result.current.updateProgress({
          status: 'completed',
          crawledPages: 10,
          endTime: Date.now(),
        });
      });

      expect(result.current.currentCrawl?.status).toBe('completed');

      // Verify storage was called at each step
      expect(storage.saveCrawl).toHaveBeenCalled();
    });

    it('should recover from errors and continue', async () => {
      // ARRANGE
      (storage.saveCrawl as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      const { result } = renderHook(() => useCrawlStore());

      const config: CrawlConfig = {
        url: 'https://example.com',
        respectRobotsTxt: true,
      };

      // ACT - First attempt fails
      await act(async () => {
        await result.current.initializeCrawl(config);
      });

      expect(result.current.error).toBe('Network error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      // Second attempt succeeds
      await act(async () => {
        await result.current.initializeCrawl(config);
      });

      // ASSERT
      expect(result.current.error).toBeNull();
      expect(result.current.currentCrawl).not.toBeNull();
    });
  });
});
