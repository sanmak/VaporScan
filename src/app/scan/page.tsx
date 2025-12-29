/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CrawlProgress } from '@/components/features/CrawlProgress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageLayout } from '@/components/layout';

function LoadingSkeleton() {
  return (
    <PageLayout showBackButton backLabel="Back">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

function ScanContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || '';
  const pagesParam = searchParams.get('pages');
  const manualPages = pagesParam ? pagesParam.split(',').filter(Boolean) : [];

  return (
    <PageLayout showBackButton backLabel="Back" hideFooter>
      <CrawlProgress initialUrl={url} manualPages={manualPages} />
    </PageLayout>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ScanContent />
    </Suspense>
  );
}
