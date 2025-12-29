/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CrawlConfig, CrawlPage, CrawlResult, ReportData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useServiceWorker, CrawlLog, CrawlResults } from '@/lib/hooks/useServiceWorker';
import { saveReport, saveCrawl } from '@/lib/storage/indexed-db';
import {
  detectOrphanedPages,
  detectBrokenLinks,
  detectEmptyPages,
  detectSitemapOnlyPages,
} from '@/lib/crawler/orphan-detector';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  Play,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  Loader2,
  FileText,
  Zap,
} from 'lucide-react';
import {
  checkCrawlability,
  getCrawlabilitySuggestions,
  CORSCheckResult,
} from '@/lib/utils/cors-detection';

interface CrawlProgressProps {
  initialUrl: string;
  manualPages?: string[];
}

export const CrawlProgress = ({ initialUrl, manualPages = [] }: CrawlProgressProps) => {
  const router = useRouter();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [showLogs, setShowLogs] = useState(true);

  // CORS pre-check state
  const [corsCheck, setCorsCheck] = useState<{
    isChecking: boolean;
    result: CORSCheckResult | null;
  }>({ isChecking: false, result: null });

  const [config, setConfig] = useState<CrawlConfig>({
    url: initialUrl,
    concurrency: 5,
    maxDepth: 10,
    maxPages: 1000,
    respectRobotsTxt: true,
    timeout: 10000,
    manualPages: manualPages,
  });

  const handleCompleted = useCallback(
    async (results: CrawlResults) => {
      try {
        const pages = new Map<string, CrawlPage>(
          Object.entries(results.results) as [string, CrawlPage][]
        );
        const sitemapUrls = new Set<string>(results.sitemapUrls || []);

        const crawlId = `crawl-${Date.now()}`;
        const crawlResult: CrawlResult = {
          id: crawlId,
          url: config.url || 'manual-scan',
          startTime: Date.now() - results.stats.crawledPages * results.stats.avgResponseTime,
          endTime: Date.now(),
          status: 'completed',
          pages,
          totalPages: results.stats.totalPages,
          crawledPages: results.stats.crawledPages,
          errorCount: results.stats.errorCount,
          orphanedPages: [],
          brokenLinks: new Map(),
          sitemapUrls: results.sitemapUrls || [],
          robotsData: results.robotsData || null,
          stats: {
            avgResponseTime: results.stats.avgResponseTime,
            totalInternalLinks: 0,
            totalExternalLinks: 0,
          },
        };

        const orphanedPages = detectOrphanedPages(crawlResult, sitemapUrls);
        const brokenLinks = detectBrokenLinks(crawlResult);
        const emptyPages = detectEmptyPages(crawlResult);
        const sitemapOnlyPages = detectSitemapOnlyPages(crawlResult, sitemapUrls);

        const report: ReportData = {
          id: `report-${Date.now()}`,
          crawlId,
          generatedAt: Date.now(),
          targetUrl: config.url || 'Manual Page Scan',
          summary: {
            totalPages: results.stats.totalPages,
            crawledPages: results.stats.crawledPages,
            orphanedCount: orphanedPages.length,
            brokenLinkCount: brokenLinks.length,
            emptyPageCount: emptyPages.length,
            avgResponseTime: results.stats.avgResponseTime,
          },
          orphanedPages,
          brokenLinks,
          emptyPages,
          sitemapOnlyPages,
          sitemapUrls: results.sitemapUrls || [],
          robotsData: results.robotsData || null,
        };

        crawlResult.orphanedPages = orphanedPages.map((p) => p.url);
        await saveCrawl(crawlResult);
        await saveReport(report);

        router.push(`/report?id=${report.id}`);
      } catch (error) {
        console.error('Error generating report:', error);
      }
    },
    [config.url, router]
  );

  const {
    isReady,
    registrationError,
    status,
    progress,
    logs,
    startCrawl,
    pauseCrawl,
    resumeCrawl,
    cancelCrawl,
    formatTimeRemaining,
  } = useServiceWorker({
    onCompleted: handleCompleted,
    onError: (error) => {
      console.error('Crawl error:', error);
    },
  });

  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  // Auto-run CORS check when component mounts with a URL
  useEffect(() => {
    const performCheck = async () => {
      if (!config.url) return;

      setCorsCheck({ isChecking: true, result: null });
      try {
        const result = await checkCrawlability(config.url);
        setCorsCheck({ isChecking: false, result });
      } catch {
        setCorsCheck({
          isChecking: false,
          result: {
            isSameOrigin: false,
            corsSupported: false,
            canCrawl: false,
            status: 'unknown',
            message: 'Check failed',
            details: 'Unable to verify crawlability',
          },
        });
      }
    };

    performCheck();
  }, [config.url]);

  const handleStartCrawl = async () => {
    if (!isReady) {
      console.error('Service Worker not ready');
      return;
    }
    setIsStarted(true);
    startCrawl(config);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleCancel = useCallback(() => {
    cancelCrawl();
    router.push('/');
  }, [cancelCrawl, router]);

  const progressPercent = progress?.progress || 0;
  const hasUrl = Boolean(config.url);
  const hasManualPages = config.manualPages && config.manualPages.length > 0;
  const canStart = (hasUrl || hasManualPages) && isReady && !registrationError;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="mb-8 font-serif">
          <h1 className="text-3xl font-bold">Crawl Progress</h1>
          <p className="text-muted-foreground mt-1">
            {hasUrl && hasManualPages
              ? 'Full site crawl with additional pages'
              : hasManualPages
                ? `Scanning ${config.manualPages?.length} manual page(s)`
                : 'Full site crawl'}
          </p>
        </div>

        {!isStarted ? (
          <Card>
            <CardHeader>
              <CardTitle>Configure Crawl</CardTitle>
              <CardDescription>Adjust settings before starting the crawl</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Target URL */}
              {hasUrl && (
                <div className="space-y-2">
                  <Label htmlFor="targetUrl">Target URL</Label>
                  <Input
                    id="targetUrl"
                    type="url"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {/* Manual Pages Info */}
              {hasManualPages && (
                <div className="space-y-2">
                  <Label>Manual Pages</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <FileText className="w-3 h-3 mr-1" />
                      {config.manualPages?.length} page(s)
                    </Badge>
                    <span className="text-sm text-muted-foreground">will be scanned</span>
                  </div>
                  <ScrollArea className="h-24 rounded-md border p-2">
                    <div className="space-y-1">
                      {config.manualPages?.map((page) => (
                        <p key={page} className="text-xs font-mono truncate">
                          {page}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Separator />

              {/* Crawl Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="concurrency">Concurrency</Label>
                  <Input
                    id="concurrency"
                    type="number"
                    value={config.concurrency}
                    onChange={(e) =>
                      setConfig({ ...config, concurrency: parseInt(e.target.value) || 5 })
                    }
                    min="1"
                    max="20"
                  />
                  <p className="text-xs text-muted-foreground">Parallel requests (1-20)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDepth">Max Depth</Label>
                  <Input
                    id="maxDepth"
                    type="number"
                    value={config.maxDepth}
                    onChange={(e) =>
                      setConfig({ ...config, maxDepth: parseInt(e.target.value) || 10 })
                    }
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">Link depth limit</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPages">Max Pages</Label>
                  <Input
                    id="maxPages"
                    type="number"
                    value={config.maxPages}
                    onChange={(e) =>
                      setConfig({ ...config, maxPages: parseInt(e.target.value) || 1000 })
                    }
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">Page limit</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={config.timeout}
                    onChange={(e) =>
                      setConfig({ ...config, timeout: parseInt(e.target.value) || 10000 })
                    }
                    min="1000"
                    step="1000"
                  />
                  <p className="text-xs text-muted-foreground">Request timeout</p>
                </div>
              </div>

              {/* Robots.txt Switch */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="respectRobots">Respect robots.txt</Label>
                  <p className="text-sm text-muted-foreground">
                    Follow crawl directives from robots.txt
                  </p>
                </div>
                <Switch
                  id="respectRobots"
                  checked={config.respectRobotsTxt}
                  onCheckedChange={(checked) => setConfig({ ...config, respectRobotsTxt: checked })}
                />
              </div>

              {/* CORS Check Result - Pre-crawl warning */}
              {hasUrl && corsCheck.isChecking && (
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <div>
                      <p className="font-medium">Checking crawlability...</p>
                      <p className="text-sm text-muted-foreground">
                        Verifying if the website allows cross-origin requests
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hasUrl && corsCheck.result && <CORSCheckDisplay result={corsCheck.result} />}

              {/* Service Worker Error - Re-positioned for visibility */}
              {registrationError && (
                <Card className="border-destructive bg-destructive/5">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <CardTitle className="text-sm font-semibold text-destructive">
                        {registrationError.message}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <CardDescription className="text-xs mb-3 text-destructive/80">
                      {registrationError.details}
                    </CardDescription>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[10px] text-muted-foreground flex-1">
                        {registrationError.code === 'NOT_SUPPORTED' &&
                          'Please use a modern browser that supports Service Workers.'}
                        {registrationError.code === 'REGISTRATION_FAILED' &&
                          'Check privacy settings or security restrictions.'}
                        {registrationError.code === 'CONTROLLER_TIMEOUT' &&
                          'Click retry to complete initialization.'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="h-8 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Retry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Start Button */}
              <Button onClick={handleStartCrawl} className="w-full" size="lg" disabled={!canStart}>
                {!isReady && !registrationError ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Start Crawl
                  </>
                )}
              </Button>

              {!isReady && !registrationError && (
                <p className="text-sm text-center text-muted-foreground">
                  Service Worker is initializing... This may take a few seconds on first visit.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        status === 'completed'
                          ? 'default'
                          : status === 'error'
                            ? 'destructive'
                            : status === 'paused'
                              ? 'secondary'
                              : 'outline'
                      }
                    >
                      {status === 'crawling' && 'Crawling'}
                      {status === 'paused' && 'Paused'}
                      {status === 'completed' && 'Completed'}
                      {status === 'error' && 'Error'}
                      {status === 'idle' && 'Ready'}
                    </Badge>
                  </div>
                  <span className="text-lg font-semibold tabular-nums">
                    {progress?.crawledPages || 0} / {progress?.totalPages || 0}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <Progress value={Math.min(progressPercent, 100)} className="h-3" />

                {/* ETA */}
                {status === 'crawling' && progress?.estimatedTimeRemaining && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeRemaining(progress.estimatedTimeRemaining)}</span>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {progress?.crawledPages || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Pages Crawled</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                        {progress?.queueSize || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">In Queue</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                        {progress?.errorCount || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        {progress?.avgResponseTime
                          ? `${progress.avgResponseTime.toFixed(0)}ms`
                          : '-'}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Response</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Current URL */}
                {progress?.currentPage && status === 'crawling' && (
                  <div className="text-sm text-muted-foreground truncate p-2 bg-muted rounded-md">
                    <span className="font-medium">Currently crawling:</span>{' '}
                    <span className="font-mono">{progress.currentPage}</span>
                  </div>
                )}

                {/* CORS Warning */}
                {progress?.errorCount &&
                  progress.errorCount > 0 &&
                  logs.some((log) => log.error?.includes('CORS')) && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            Cross-Origin Request Blocked
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            The website you&apos;re trying to crawl doesn&apos;t allow cross-origin
                            requests from browsers. This is a security feature of web browsers.
                            VaporScan works best when:
                          </p>
                          <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 list-disc list-inside space-y-1">
                            <li>Crawling your own website (same origin)</li>
                            <li>The target website has CORS headers enabled</li>
                            <li>
                              Using a server-side proxy (not available in this client-only version)
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex gap-4">
              {status === 'crawling' && (
                <>
                  <Button onClick={pauseCrawl} variant="outline" className="flex-1">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={handleCancel} variant="destructive" className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              {status === 'paused' && (
                <>
                  <Button onClick={resumeCrawl} className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                  <Button onClick={handleCancel} variant="destructive" className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {/* Logs Section */}
            <Collapsible open={showLogs} onOpenChange={setShowLogs}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Crawl Logs
                        <Badge variant="secondary" className="ml-2">
                          {logs.length}
                        </Badge>
                      </CardTitle>
                      {showLogs ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-64 rounded-md border bg-slate-950 p-4">
                      <div className="font-mono text-xs text-gray-100 space-y-1">
                        {logs.length === 0 ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>
                              {status === 'idle' && 'Initializing crawl...'}
                              {status === 'crawling' &&
                                'Starting crawl, waiting for first response...'}
                              {status === 'error' && 'Crawl encountered an error'}
                              {status === 'completed' && 'Crawl completed'}
                              {status === 'paused' && 'Crawl is paused'}
                            </span>
                          </div>
                        ) : (
                          logs.map((log, index) => <LogEntry key={index} log={log} />)
                        )}
                        <div ref={logsEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        )}
      </div>
    </div>
  );
};

function LogEntry({ log }: { log: CrawlLog }) {
  const time = new Date(log.timestamp).toLocaleTimeString();

  return (
    <div className="flex items-start gap-2 py-1 hover:bg-gray-800 px-2 -mx-2 rounded">
      {log.type === 'success' ? (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      )}
      <span className="text-gray-500">[{time}]</span>
      <span className={log.type === 'success' ? 'text-green-400' : 'text-red-400'}>
        {log.status || 'ERR'}
      </span>
      <span className="text-gray-300 truncate flex-1">{log.url}</span>
      {log.time && <span className="text-gray-500">{log.time}ms</span>}
      {log.error && <span className="text-red-400">{log.error}</span>}
    </div>
  );
}

// CORS Check Display Component
function CORSCheckDisplay({ result }: { result: CORSCheckResult }) {
  const suggestions = getCrawlabilitySuggestions(result);

  if (result.canCrawl) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              {result.isSameOrigin ? 'Same-Origin Request' : 'CORS Enabled'} - Ready to crawl
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">{result.details}</p>
          </div>
        </div>
      </div>
    );
  }

  // CORS blocked or other error
  const isBlocked = result.status === 'cors_blocked';

  return (
    <div
      className={`p-4 rounded-lg border ${
        isBlocked
          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
          : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
      }`}
    >
      <div className="flex items-start gap-3">
        {isBlocked ? (
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p
            className={`font-medium ${
              isBlocked ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
            }`}
          >
            {result.message}
          </p>
          <p
            className={`text-sm mt-1 ${
              isBlocked ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
            }`}
          >
            {result.details}
          </p>

          {suggestions.length > 0 && (
            <div className="mt-3">
              <p
                className={`text-sm font-medium ${
                  isBlocked
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}
              >
                What you can do:
              </p>
              <ul
                className={`text-sm mt-1 list-disc list-inside space-y-1 ${
                  isBlocked
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}
              >
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {isBlocked && (
            <p className="text-xs mt-3 text-red-600 dark:text-red-400">
              You can still try to crawl, but requests will fail due to browser security
              restrictions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CrawlProgress;
