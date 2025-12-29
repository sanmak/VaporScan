/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { CrawlConfig, CrawlPage, RobotsData } from '@/types';

export interface CrawlProgress {
  crawledPages: number;
  totalPages: number;
  errorCount: number;
  avgResponseTime: number;
  progress: number;
  estimatedTimeRemaining: number | null;
  currentPage?: string;
  queueSize: number;
}

export interface CrawlLog {
  type: 'success' | 'error';
  url: string;
  status: number;
  time?: string;
  error?: string;
  timestamp: number;
}

export interface CrawlResults {
  stats: CrawlProgress;
  skippedCount: number;
  results: Record<string, CrawlPage>;
  sitemapUrls: string[];
  robotsData: RobotsData | null;
}

export type ServiceWorkerStatus = 'idle' | 'crawling' | 'paused' | 'completed' | 'error';

export interface ServiceWorkerError {
  code: 'NOT_SUPPORTED' | 'REGISTRATION_FAILED' | 'CONTROLLER_TIMEOUT' | 'CRAWL_ERROR';
  message: string;
  details?: string;
}

interface UseServiceWorkerOptions {
  onProgress?: (progress: CrawlProgress) => void;
  onLog?: (log: CrawlLog) => void;
  onCompleted?: (results: CrawlResults) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: ServiceWorkerStatus) => void;
}

const CONTROLLER_READY_TIMEOUT = 10000; // 10 seconds to wait for controller

export const useServiceWorker = (options: UseServiceWorkerOptions = {}) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [registrationError, setRegistrationError] = useState<ServiceWorkerError | null>(null);
  const [status, setStatus] = useState<ServiceWorkerStatus>('idle');
  const [progress, setProgress] = useState<CrawlProgress | null>(null);
  const [logs, setLogs] = useState<CrawlLog[]>([]);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Handle messages from Service Worker
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case 'CRAWL_STARTED':
          setStatus('crawling');
          options.onStatusChange?.('crawling');
          break;

        case 'CRAWL_PROGRESS':
          setProgress(payload);
          options.onProgress?.(payload);
          break;

        case 'CRAWL_LOG':
          const logEntry: CrawlLog = {
            ...payload,
            timestamp: Date.now(),
          };
          setLogs((prev) => [...prev.slice(-99), logEntry]);
          options.onLog?.(logEntry);
          break;

        case 'CRAWL_COMPLETED':
          setStatus('completed');
          options.onStatusChange?.('completed');
          options.onCompleted?.(payload);
          break;

        case 'CRAWL_PAUSED':
          setStatus('paused');
          options.onStatusChange?.('paused');
          break;

        case 'CRAWL_RESUMED':
          setStatus('crawling');
          options.onStatusChange?.('crawling');
          break;

        case 'CRAWL_CANCELLED':
          setStatus('idle');
          options.onStatusChange?.('idle');
          break;

        case 'CRAWL_ERROR':
          setStatus('error');
          options.onStatusChange?.('error');
          options.onError?.(payload.error);
          break;

        case 'CRAWL_STATUS':
          if (payload.isRunning) {
            setStatus(payload.isPaused ? 'paused' : 'crawling');
          } else {
            setStatus('idle');
          }
          break;
      }
    },
    [options]
  );

  // Register Service Worker
  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return;
    }

    // Check if Service Workers are supported
    if (!('serviceWorker' in navigator)) {
      setRegistrationError({
        code: 'NOT_SUPPORTED',
        message: 'Service Workers are not supported',
        details:
          'Your browser does not support Service Workers. Please use a modern browser like Chrome, Firefox, Safari, or Edge.',
      });
      return;
    }

    let isMounted = true;

    // Helper to wait for a service worker to reach a specific state
    const waitForState = (
      worker: ServiceWorker,
      targetState: ServiceWorkerState
    ): Promise<void> => {
      return new Promise((resolve) => {
        if (worker.state === targetState) {
          resolve();
          return;
        }
        const handleStateChange = () => {
          if (worker.state === targetState) {
            worker.removeEventListener('statechange', handleStateChange);
            resolve();
          }
        };
        worker.addEventListener('statechange', handleStateChange);
      });
    };

    // Helper to wait for controller with timeout
    const waitForController = (timeoutMs: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        // If we already have a controller, resolve immediately
        if (navigator.serviceWorker.controller) {
          resolve();
          return;
        }

        const timeoutId = setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          reject(new Error('Controller timeout'));
        }, timeoutMs);

        const handleControllerChange = () => {
          if (navigator.serviceWorker.controller) {
            clearTimeout(timeoutId);
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            resolve();
          }
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      });
    };

    const registerServiceWorker = async () => {
      try {
        // Register the service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        registrationRef.current = registration;

        if (!isMounted) return;
        setIsRegistered(true);

        // Determine which worker to wait for
        const worker = registration.active || registration.waiting || registration.installing;

        if (!worker) {
          throw new Error('No service worker found after registration');
        }

        // If the worker is not yet activated, wait for it
        if (worker.state !== 'activated') {
          await waitForState(worker, 'activated');
        }

        if (!isMounted) return;

        // Now wait for the worker to become the controller
        // The service worker calls clients.claim() so this should happen quickly
        try {
          await waitForController(CONTROLLER_READY_TIMEOUT);
        } catch {
          // If we still don't have a controller, the page might need a refresh
          // This can happen on first load - try triggering skipWaiting if there's a waiting worker
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            await waitForController(CONTROLLER_READY_TIMEOUT);
          } else {
            // On first visit without a previous controller, we may need to reload
            // But first, let's check if the active worker exists
            if (registration.active) {
              // The worker is active but not controlling - this is expected on first visit
              // We need to reload the page for the SW to take control
              // Instead of throwing an error, inform the user
              if (isMounted) {
                setRegistrationError({
                  code: 'CONTROLLER_TIMEOUT',
                  message: 'Service Worker initialized',
                  details:
                    'The Service Worker is ready but needs a page refresh to take control. This only happens on first visit.',
                });
              }
              return;
            }
            throw new Error('Service Worker failed to take control');
          }
        }

        if (isMounted) {
          setIsReady(true);
        }

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.warn('New service worker available. Refresh to update.');
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        if (isMounted) {
          setRegistrationError({
            code: 'REGISTRATION_FAILED',
            message: 'Failed to register Service Worker',
            details: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        }
      }
    };

    registerServiceWorker();

    // Listen for messages
    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  // Send message to Service Worker
  const sendMessage = useCallback((type: string, payload?: unknown): boolean => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type, payload });
      return true;
    }
    console.error('Cannot send message: Service Worker controller not available');
    return false;
  }, []);

  // Start crawl
  const startCrawl = useCallback(
    (config: CrawlConfig) => {
      setLogs([]);
      setProgress(null);
      sendMessage('START_CRAWL', config);
    },
    [sendMessage]
  );

  // Pause crawl
  const pauseCrawl = useCallback(() => {
    sendMessage('PAUSE_CRAWL');
  }, [sendMessage]);

  // Resume crawl
  const resumeCrawl = useCallback(() => {
    sendMessage('RESUME_CRAWL');
  }, [sendMessage]);

  // Cancel crawl
  const cancelCrawl = useCallback(() => {
    sendMessage('CANCEL_CRAWL');
  }, [sendMessage]);

  // Get current status
  const getStatus = useCallback(() => {
    sendMessage('GET_STATUS');
  }, [sendMessage]);

  // Format time remaining
  const formatTimeRemaining = useCallback((ms: number | null): string => {
    if (ms === null) return 'Calculating...';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s remaining`;
    }
    return `${seconds}s remaining`;
  }, []);

  return {
    isRegistered,
    isReady,
    registrationError,
    status,
    progress,
    logs,
    startCrawl,
    pauseCrawl,
    resumeCrawl,
    cancelCrawl,
    getStatus,
    formatTimeRemaining,
  };
};

export default useServiceWorker;
