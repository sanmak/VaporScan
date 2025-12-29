/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ShieldCheck,
  Zap,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  HelpCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Github,
  Link2,
  FileSearch,
  BarChart3,
} from 'lucide-react';
import { PageLayout } from '@/components/layout';
import {
  checkCrawlability,
  getCrawlabilitySuggestions,
  CORSCheckResult,
} from '@/lib/utils/cors-detection';

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [manualPages, setManualPages] = useState<string[]>([]);
  const [manualPageInput, setManualPageInput] = useState('');
  const [bulkPagesInput, setBulkPagesInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'manual'>('url');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // CORS/Crawlability check state
  const [corsCheck, setCorsCheck] = useState<{
    isChecking: boolean;
    result: CORSCheckResult | null;
    checkedUrl: string | null;
  }>({ isChecking: false, result: null, checkedUrl: null });

  // Reset check if URL changed
  useEffect(() => {
    if (corsCheck.checkedUrl && corsCheck.checkedUrl !== url) {
      setCorsCheck({ isChecking: false, result: null, checkedUrl: null });
    }
  }, [url, corsCheck.checkedUrl]);

  // Check crawlability of URL
  const performCrawlabilityCheck = useCallback(async () => {
    if (!url) return;

    try {
      new URL(url);
    } catch {
      return; // Invalid URL
    }

    setCorsCheck({ isChecking: true, result: null, checkedUrl: null });

    try {
      const result = await checkCrawlability(url);
      setCorsCheck({ isChecking: false, result, checkedUrl: url });
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
        checkedUrl: url,
      });
    }
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const params = new URLSearchParams();

      if (activeTab === 'url' && url) {
        params.set('url', url);
      }

      if (manualPages.length > 0) {
        params.set('pages', manualPages.join(','));
      }

      router.push(`/scan?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addManualPage = () => {
    const trimmedUrl = manualPageInput.trim();
    if (trimmedUrl && !manualPages.includes(trimmedUrl)) {
      try {
        new URL(trimmedUrl);
        setManualPages([...manualPages, trimmedUrl]);
        setManualPageInput('');
      } catch {
        // Invalid URL
      }
    }
  };

  const addBulkPages = () => {
    const urls = bulkPagesInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => {
        if (!u) return false;
        try {
          new URL(u);
          return true;
        } catch {
          return false;
        }
      });

    const newPages = [...new Set([...manualPages, ...urls])];
    setManualPages(newPages);
    setBulkPagesInput('');
  };

  const removeManualPage = (pageToRemove: string) => {
    setManualPages(manualPages.filter((p) => p !== pageToRemove));
  };

  // Determine if check has been performed for current URL
  const hasCheckedCurrentUrl = corsCheck.checkedUrl === url && corsCheck.result !== null;
  const crawlCheckPassed = hasCheckedCurrentUrl && corsCheck.result?.canCrawl === true;

  // Form validity:
  // - For URL mode: must have URL AND check must pass (or be in manual mode with pages)
  // - For manual mode: must have at least one manual page
  const isUrlModeValid = activeTab === 'url' && url && crawlCheckPassed;
  const isManualModeValid = activeTab === 'manual' && manualPages.length > 0;
  const isFormValid = isUrlModeValid || isManualModeValid;

  // Check button should always be enabled when URL is present
  const isCheckButtonEnabled = Boolean(url) && !corsCheck.isChecking;

  return (
    <TooltipProvider>
      <PageLayout className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section - Two Column Layout */}
          <div className="py-12 md:py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left Column - Hero Text */}
              <div className="text-center lg:text-left">
                <Badge variant="secondary" className="mb-4">
                  Open Source SEO Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                  VaporScan
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8">
                  An open-source, client-side SEO auditing tool that detects orphaned pages, broken
                  links, and generates comprehensive site health reports.
                </p>

                {/* Quick Features List */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <FileSearch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Find Orphaned Pages</p>
                      <p className="text-sm text-muted-foreground">
                        Discover pages not linked from your site structure
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium">Detect Broken Links</p>
                      <p className="text-sm text-muted-foreground">
                        Find 404s and broken external references
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Health Reports</p>
                      <p className="text-sm text-muted-foreground">
                        Generate detailed SEO audit reports
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Form Card */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Start Your SEO Audit</CardTitle>
                  <CardDescription>
                    Enter a website URL for a full crawl, or add specific pages to scan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) => setActiveTab(v as 'url' | 'manual')}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="url" className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Full Site Crawl
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Specific Pages
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="url" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="url">Website URL</Label>
                          <div className="flex gap-2">
                            <Input
                              id="url"
                              type="url"
                              placeholder="https://example.com"
                              value={url}
                              onChange={(e) => setUrl(e.target.value)}
                              className="h-12 flex-1"
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="lg"
                                  className="h-12 px-4"
                                  onClick={performCrawlabilityCheck}
                                  disabled={!isCheckButtonEnabled}
                                >
                                  {corsCheck.isChecking ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Search className="w-4 h-4" />
                                  )}
                                  <span className="ml-2 hidden sm:inline">Check</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Check if this website can be crawled</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Click &quot;Check&quot; to verify the website is crawlable before
                            starting.
                          </p>
                        </div>

                        {/* Crawlability Check Result */}
                        {corsCheck.result && corsCheck.checkedUrl === url && (
                          <CrawlabilityResult result={corsCheck.result} />
                        )}

                        {/* Optional: Add manual pages alongside full crawl */}
                        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 text-muted-foreground"
                            >
                              {showAdvanced ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              Add specific pages to include
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-3 h-3" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Add URLs that might not be in your sitemap or linked from your
                                    site
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-4">
                            <ManualPagesInput
                              manualPages={manualPages}
                              manualPageInput={manualPageInput}
                              setManualPageInput={setManualPageInput}
                              bulkPagesInput={bulkPagesInput}
                              setBulkPagesInput={setBulkPagesInput}
                              addManualPage={addManualPage}
                              addBulkPages={addBulkPages}
                              removeManualPage={removeManualPage}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      </TabsContent>

                      <TabsContent value="manual" className="space-y-4 mt-4">
                        <ManualPagesInput
                          manualPages={manualPages}
                          manualPageInput={manualPageInput}
                          setManualPageInput={setManualPageInput}
                          bulkPagesInput={bulkPagesInput}
                          setBulkPagesInput={setBulkPagesInput}
                          addManualPage={addManualPage}
                          addBulkPages={addBulkPages}
                          removeManualPage={removeManualPage}
                        />
                      </TabsContent>
                    </Tabs>

                    <Separator />

                    <Button
                      type="submit"
                      disabled={isLoading || !isFormValid}
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting Audit...
                        </>
                      ) : (
                        'Start Audit'
                      )}
                    </Button>

                    {activeTab === 'url' && url && !hasCheckedCurrentUrl && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                        Please click &quot;Check&quot; to verify crawlability before starting
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      All scanning happens in your browser. No data is sent to our servers.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Section */}
          <div className="pb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Choose VaporScan?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A powerful, privacy-focused SEO auditing tool built for developers and SEO
                professionals.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-left">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                    <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">Privacy First</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    100% client-side processing. Your data never leaves your browser.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-left">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
                    <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-lg">Lightning Fast</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Concurrent crawling with configurable options for optimal performance.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-left">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                    <Github className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <CardTitle className="text-lg">Open Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Fully transparent and community-driven development.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    </TooltipProvider>
  );
}

interface ManualPagesInputProps {
  manualPages: string[];
  manualPageInput: string;
  setManualPageInput: (value: string) => void;
  bulkPagesInput: string;
  setBulkPagesInput: (value: string) => void;
  addManualPage: () => void;
  addBulkPages: () => void;
  removeManualPage: (page: string) => void;
}

function ManualPagesInput({
  manualPages,
  manualPageInput,
  setManualPageInput,
  bulkPagesInput,
  setBulkPagesInput,
  addManualPage,
  addBulkPages,
  removeManualPage,
}: ManualPagesInputProps) {
  return (
    <div className="space-y-4">
      {/* Single page input */}
      <div className="space-y-2">
        <Label htmlFor="manualPage">Add Page URL</Label>
        <div className="flex gap-2">
          <Input
            id="manualPage"
            type="url"
            placeholder="https://example.com/page"
            value={manualPageInput}
            onChange={(e) => setManualPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addManualPage();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addManualPage}
            disabled={!manualPageInput.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bulk input */}
      <div className="space-y-2">
        <Label htmlFor="bulkPages">Or paste multiple URLs (one per line)</Label>
        <Textarea
          id="bulkPages"
          placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
          value={bulkPagesInput}
          onChange={(e) => setBulkPagesInput(e.target.value)}
          rows={3}
          className="font-mono text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBulkPages}
          disabled={!bulkPagesInput.trim()}
          className="w-full"
        >
          Add All URLs
        </Button>
      </div>

      {/* Added pages list */}
      {manualPages.length > 0 && (
        <div className="space-y-2">
          <Label>Pages to scan ({manualPages.length})</Label>
          <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-muted/50 rounded-md">
            {manualPages.map((page) => (
              <div
                key={page}
                className="flex items-center justify-between gap-2 text-sm bg-background rounded px-2 py-1"
              >
                <span className="truncate font-mono text-xs">{page}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeManualPage(page)}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Crawlability check result display component
interface CrawlabilityResultProps {
  result: CORSCheckResult;
}

function CrawlabilityResult({ result }: CrawlabilityResultProps) {
  const suggestions = getCrawlabilitySuggestions(result);

  if (result.canCrawl) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              {result.isSameOrigin ? 'Same-Origin Request' : 'CORS Enabled'} - Ready to crawl
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">{result.details}</p>
            {result.responseStatus && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Response status: {result.responseStatus}
              </p>
            )}
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
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
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
                Suggestions:
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
              Switch to &quot;Specific Pages&quot; tab to manually add pages you have access to.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
