/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CrawlResult, ReportData, CrawlPage } from '@/types';

const DB_NAME = 'vaporscan';
const DB_VERSION = 1;

// Serialized version of CrawlResult for IndexedDB storage
interface SerializedCrawlResult {
  id: string;
  url: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'crawling' | 'completed' | 'failed' | 'paused';
  pages: Record<string, CrawlPage>;
  totalPages: number;
  crawledPages: number;
  errorCount: number;
  orphanedPages: string[];
  brokenLinks: Record<string, string[]>;
  sitemapUrls: string[];
  robotsData: CrawlResult['robotsData'];
  stats: CrawlResult['stats'];
}

interface VaporScanDB extends DBSchema {
  crawls: {
    key: string;
    value: SerializedCrawlResult;
    indexes: { 'by-date': number };
  };
  reports: {
    key: string;
    value: ReportData;
    indexes: { 'by-date': number };
  };
}

let db: IDBPDatabase<VaporScanDB> | null = null;

export const initializeDB = async (): Promise<IDBPDatabase<VaporScanDB>> => {
  if (db) return db;

  db = await openDB<VaporScanDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create crawls store
      if (!db.objectStoreNames.contains('crawls')) {
        const crawlStore = db.createObjectStore('crawls', { keyPath: 'id' });
        crawlStore.createIndex('by-date', 'startTime', { unique: false });
      }

      // Create reports store
      if (!db.objectStoreNames.contains('reports')) {
        const reportStore = db.createObjectStore('reports', { keyPath: 'id' });
        reportStore.createIndex('by-date', 'generatedAt', { unique: false });
      }
    },
  });

  return db;
};

export const getDB = async (): Promise<IDBPDatabase<VaporScanDB>> => {
  if (db) return db;
  return initializeDB();
};

export const saveCrawl = async (crawl: CrawlResult): Promise<void> => {
  const database = await getDB();
  // Convert Map to plain object for storage
  const crawlData = {
    ...crawl,
    pages: Object.fromEntries(crawl.pages),
    brokenLinks: Object.fromEntries(
      Array.from(crawl.brokenLinks.entries()).map(([k, v]) => [k, Array.from(v)])
    ),
  };
  await database.put('crawls', crawlData);
};

export const getCrawl = async (id: string): Promise<CrawlResult | undefined> => {
  const database = await getDB();
  const crawl = await database.get('crawls', id);

  if (!crawl) return undefined;

  // Reconstruct Maps
  return {
    ...crawl,
    pages: new Map(Object.entries(crawl.pages)),
    brokenLinks: new Map(Object.entries(crawl.brokenLinks).map(([k, v]) => [k, new Set(v)])),
  } as CrawlResult;
};

export const getAllCrawls = async (): Promise<CrawlResult[]> => {
  const database = await getDB();
  const crawls = await database.getAll('crawls');

  return crawls.map((crawl) => ({
    ...crawl,
    pages: new Map(Object.entries(crawl.pages)),
    brokenLinks: new Map(Object.entries(crawl.brokenLinks).map(([k, v]) => [k, new Set(v)])),
  }));
};

export const deleteCrawl = async (id: string): Promise<void> => {
  const database = await getDB();
  await database.delete('crawls', id);
};

export const saveReport = async (report: ReportData): Promise<void> => {
  const database = await getDB();
  await database.put('reports', report);
};

export const getReport = async (id: string): Promise<ReportData | undefined> => {
  const database = await getDB();
  return database.get('reports', id);
};

export const getAllReports = async (): Promise<ReportData[]> => {
  const database = await getDB();
  return database.getAll('reports');
};

export const deleteReport = async (id: string): Promise<void> => {
  const database = await getDB();
  await database.delete('reports', id);
};

export const clearAllData = async (): Promise<void> => {
  const database = await getDB();
  await database.clear('crawls');
  await database.clear('reports');
};
