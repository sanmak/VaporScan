/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { create } from 'zustand';
import { CrawlConfig, CrawlResult } from '@/types';
import { saveCrawl, getCrawl, getAllCrawls } from '@/lib/storage/indexed-db';

interface CrawlState {
  currentCrawl: CrawlResult | null;
  crawlHistory: CrawlResult[];
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeCrawl: (config: CrawlConfig) => Promise<void>;
  updateProgress: (progress: Partial<CrawlResult>) => void;
  pauseCrawl: () => void;
  resumeCrawl: () => void;
  cancelCrawl: () => void;
  loadCrawl: (id: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  deleteCrawl: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCrawlStore = create<CrawlState>((set) => ({
  currentCrawl: null,
  crawlHistory: [],
  isLoading: false,
  error: null,

  initializeCrawl: async (config: CrawlConfig) => {
    set({ isLoading: true, error: null });

    try {
      const crawlId = `crawl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newCrawl: CrawlResult = {
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

      await saveCrawl(newCrawl);
      set({ currentCrawl: newCrawl, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize crawl';
      set({ error: message, isLoading: false });
    }
  },

  updateProgress: (progress: Partial<CrawlResult>) => {
    set((state) => {
      if (!state.currentCrawl) return state;

      const updated = {
        ...state.currentCrawl,
        ...progress,
      };

      // Save to storage
      saveCrawl(updated);

      return { currentCrawl: updated };
    });
  },

  pauseCrawl: () => {
    set((state) => {
      if (!state.currentCrawl) return state;
      return {
        currentCrawl: {
          ...state.currentCrawl,
          status: 'paused',
        },
      };
    });
  },

  resumeCrawl: () => {
    set((state) => {
      if (!state.currentCrawl) return state;
      return {
        currentCrawl: {
          ...state.currentCrawl,
          status: 'crawling',
        },
      };
    });
  },

  cancelCrawl: () => {
    set((state) => {
      if (!state.currentCrawl) return state;
      return {
        currentCrawl: {
          ...state.currentCrawl,
          status: 'failed',
          endTime: Date.now(),
        },
      };
    });
  },

  loadCrawl: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const crawl = await getCrawl(id);
      if (crawl) {
        set({ currentCrawl: crawl, isLoading: false });
      } else {
        set({ error: 'Crawl not found', isLoading: false });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load crawl';
      set({ error: message, isLoading: false });
    }
  },

  loadHistory: async () => {
    set({ isLoading: true, error: null });

    try {
      const history = await getAllCrawls();
      set({ crawlHistory: history, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load history';
      set({ error: message, isLoading: false });
    }
  },

  deleteCrawl: async (id: string) => {
    try {
      // Note: In a real app, we'd use the storage function
      set((state) => ({
        crawlHistory: state.crawlHistory.filter((c) => c.id !== id),
        currentCrawl: state.currentCrawl?.id === id ? null : state.currentCrawl,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete crawl';
      set({ error: message });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
