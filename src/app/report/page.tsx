/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReportData, CrawlPage } from '@/types';
import { getReport, getCrawl } from '@/lib/storage/indexed-db';
import { ReportDashboard } from '@/components/features/ReportDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [pages, setPages] = useState<Map<string, CrawlPage> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'graph'>('dashboard');

  useEffect(() => {
    const loadReport = async () => {
      try {
        const id = searchParams.get('id');
        if (!id) {
          setError('Report ID is required');
          setIsLoading(false);
          return;
        }
        const reportData = await getReport(id);

        if (!reportData) {
          setError('Report not found');
          setIsLoading(false);
          return;
        }

        setReport(reportData);

        // Load crawl data for the graph
        const crawlData = await getCrawl(reportData.crawlId);
        if (crawlData) {
          setPages(crawlData.pages);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load report:', err);
        setError('Failed to load report');
        setIsLoading(false);
      }
    };

    loadReport();
  }, [searchParams]);

  if (isLoading) {
    return (
      <PageLayout showBackButton>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !report) {
    return (
      <PageLayout showBackButton>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
            <p className="text-muted-foreground mb-6">{error || 'Report not found'}</p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showBackButton hideFooter>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 min-h-[calc(100vh-65px)]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ReportDashboard
            report={report}
            pages={pages}
            activeView={activeView}
            setActiveView={setActiveView}
          />
        </main>
      </div>
    </PageLayout>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <PageLayout showBackButton>
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading report...</p>
            </div>
          </div>
        </PageLayout>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
