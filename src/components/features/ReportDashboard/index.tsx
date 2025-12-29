/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { ReportData, CrawlPage } from '@/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { ExportDropdown } from '@/components/features/ExportDropdown';
import { LinkGraph } from '@/components/features/LinkGraph';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Link2,
  ExternalLink,
  FileCode,
  Network,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';

interface ReportDashboardProps {
  report: ReportData;
  pages: Map<string, CrawlPage> | null;
  activeView: 'dashboard' | 'graph';
  setActiveView: (view: 'dashboard' | 'graph') => void;
}

export const ReportDashboard = ({
  report,
  pages,
  activeView,
  setActiveView,
}: ReportDashboardProps) => {
  const chartData = [
    { name: 'Crawled', value: report.summary.crawledPages, fill: '#3b82f6' },
    { name: 'Orphaned', value: report.summary.orphanedCount, fill: '#f97316' },
    { name: 'Broken', value: report.summary.brokenLinkCount, fill: '#ef4444' },
    { name: 'Empty', value: report.summary.emptyPageCount, fill: '#8b5cf6' },
  ];

  const statusData = [
    {
      name: 'Success',
      value: report.summary.crawledPages - report.summary.brokenLinkCount,
      fill: '#22c55e',
    },
    { name: 'Errors', value: report.summary.brokenLinkCount, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-4 mb-2">
            <h1 className="text-3xl font-bold">SEO Audit Report</h1>
            {/* Actions Group */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1 gap-1">
              <Link href={`/scan?url=${encodeURIComponent(report.targetUrl)}`}>
                <button className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Update Crawl Option</span>
                </button>
              </Link>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeView === 'dashboard'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveView('graph')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  String(activeView) === 'graph'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Network className="w-4 h-4" />
                <span className="hidden sm:inline">Link Graph</span>
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <ExportDropdown report={report} />
            </div>
          </div>
          <p className="text-muted-foreground mt-2 font-mono text-sm">{report.targetUrl}</p>
          {/* Robots.txt and Sitemap Links */}
          <div className="flex items-center flex-wrap gap-x-6 gap-y-1">
            {report.robotsData && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <FileCode className="w-4 h-4 text-muted-foreground" />
                <a
                  href={`${new URL(report.targetUrl).origin}/robots.txt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  robots.txt
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {report.sitemapUrls.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <FileCode className="w-4 h-4 text-muted-foreground" />
                <a
                  href={
                    report.sitemapUrls[0].startsWith('http')
                      ? report.sitemapUrls[0]
                      : `${new URL(report.targetUrl).origin}${report.sitemapUrls[0]}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  sitemap.xml
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Generated {new Date(report.generatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {activeView === 'graph' ? (
        <div className="space-y-4">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-4">Link Graph Visualization</h2>
            <p className="text-muted-foreground mb-6">
              Interactive visualization of your site&apos;s internal link structure. Nodes represent
              pages, and edges represent links between them.
            </p>
            {pages ? (
              <LinkGraph pages={pages} targetUrl={report.targetUrl} maxNodes={150} />
            ) : (
              <div className="h-[600px] flex items-center justify-center border border-border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Page data not available for visualization</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <CardHeader className="pb-2">
                <CardDescription className="text-blue-600 dark:text-blue-400">
                  Total Pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {report.summary.totalPages}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
              <CardHeader className="pb-2">
                <CardDescription className="text-green-600 dark:text-green-400">
                  Crawled Pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {report.summary.crawledPages}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900">
              <CardHeader className="pb-2">
                <CardDescription className="text-orange-600 dark:text-orange-400">
                  Orphaned Pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {report.summary.orphanedCount}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardDescription className="text-red-600 dark:text-red-400">
                  Broken Links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {report.summary.brokenLinkCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Page Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                      }
                      outerRadius={100}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Vertical Sections */}
          <SummarySection report={report} />
          <OrphanedSection pages={report.orphanedPages} />
          <BrokenLinksSection links={report.brokenLinks} />
          <EmptyPagesSection pages={report.emptyPages} />
        </div>
      )}
    </div>
  );
};

function SummarySection({ report }: { report: ReportData }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-xl font-semibold">
                  {report.summary.avgResponseTime.toFixed(0)}ms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Link2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Pages Analyzed</p>
                <p className="text-xl font-semibold">{report.summary.crawledPages}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-xl font-semibold">
                  {Math.round(
                    ((report.summary.crawledPages -
                      report.summary.brokenLinkCount -
                      report.summary.orphanedCount) /
                      report.summary.crawledPages) *
                      100
                  ) || 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {report.sitemapOnlyPages.length > 0 && (
        <SitemapOnlyPagesSection pages={report.sitemapOnlyPages} targetUrl={report.targetUrl} />
      )}

      <SitemapRobotsInfo report={report} />
    </div>
  );
}

function SitemapRobotsInfo({ report }: { report: ReportData }) {
  const sitemapCount = report.sitemapUrls?.length || 0;
  const hasRobots = !!report.robotsData;

  // Sitemaps table columns
  const sitemapColumns: ColumnDef<{ url: string; index: number }>[] = [
    {
      header: '#',
      cell: (row) => <span className="text-muted-foreground">{row.index}</span>,
      className: 'w-12',
    },
    {
      header: 'Sitemap URL',
      cell: (row) => (
        <a
          href={
            row.url.startsWith('http') ? row.url : `${new URL(report.targetUrl).origin}${row.url}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:underline font-mono text-sm"
        >
          <span className="truncate max-w-2xl">{row.url}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ),
    },
  ];

  const sitemapData = report.sitemapUrls.map((url, index) => ({ url, index: index + 1 }));

  // Robots.txt rules table columns
  const robotsColumns: ColumnDef<{ type: string; pattern: string; index: number }>[] = [
    {
      header: '#',
      cell: (row) => <span className="text-muted-foreground">{row.index}</span>,
      className: 'w-12',
    },
    {
      header: 'Rule Type',
      cell: (row) => <Badge variant="outline">{row.type}</Badge>,
      className: 'w-32',
    },
    {
      header: 'Pattern',
      cell: (row) => <span className="font-mono text-sm">{row.pattern}</span>,
    },
  ];

  const robotsData = hasRobots
    ? [
        ...report.robotsData!.allow.map((pattern, index) => ({
          type: 'Allow',
          pattern,
          index: index + 1,
        })),
        ...report.robotsData!.disallow.map((pattern, index) => ({
          type: 'Disallow',
          pattern,
          index: report.robotsData!.allow.length + index + 1,
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Sitemaps Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-muted-foreground" />
            Sitemaps
            <Badge variant={sitemapCount > 0 ? 'default' : 'secondary'} className="ml-2">
              {sitemapCount} Found
            </Badge>
          </CardTitle>
          <CardDescription>XML Sitemaps discovered during crawl</CardDescription>
        </CardHeader>
        <CardContent>
          {sitemapCount > 0 ? (
            <DataTable
              columns={sitemapColumns}
              data={sitemapData}
              searchPlaceholder="Search sitemaps..."
              emptyMessage="No sitemaps found"
            />
          ) : (
            <div className="py-8 text-center text-muted-foreground">No sitemaps found</div>
          )}
        </CardContent>
      </Card>

      {/* Robots.txt Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-muted-foreground" />
            Robots.txt Rules
            <Badge variant={hasRobots ? 'default' : 'secondary'} className="ml-2">
              {hasRobots ? 'Present' : 'Missing'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {hasRobots
              ? `User-agent: ${report.robotsData?.userAgent || '*'}`
              : 'No robots.txt file found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasRobots && robotsData.length > 0 ? (
            <DataTable
              columns={robotsColumns}
              data={robotsData}
              searchPlaceholder="Search robots.txt rules..."
              emptyMessage="No rules found"
            />
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {hasRobots ? 'No rules defined' : 'robots.txt not found'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrphanedSection({ pages }: { pages: ReportData['orphanedPages'] }) {
  if (pages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Orphaned Pages
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">No orphaned pages found!</p>
          <p className="text-muted-foreground">All pages have proper internal linking.</p>
        </CardContent>
      </Card>
    );
  }

  const columns: ColumnDef<ReportData['orphanedPages'][0]>[] = [
    {
      header: '#',
      cell: (_, index) => <span className="text-muted-foreground">{index + 1}</span>,
      className: 'w-12',
    },
    {
      header: 'URL',
      cell: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:underline font-mono text-sm"
        >
          <span className="truncate max-w-md">{row.url}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ),
    },
    {
      header: 'In Sitemap',
      cell: (row) =>
        row.inSitemap ? (
          <Badge variant="secondary">Yes</Badge>
        ) : (
          <Badge variant="outline">No</Badge>
        ),
      className: 'text-center w-28',
    },
    {
      header: 'Referred By',
      cell: (row) => <Badge variant="outline">{row.referredBy.length}</Badge>,
      className: 'text-center w-28',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Orphaned Pages
          {pages.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pages.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Pages that have no incoming internal links (excluding sitemap references)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={pages}
          searchPlaceholder="Search orphaned pages..."
          emptyMessage="No orphaned pages found"
        />
      </CardContent>
    </Card>
  );
}

function BrokenLinksSection({ links }: { links: ReportData['brokenLinks'] }) {
  if (links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Broken Links
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">No broken links found!</p>
          <p className="text-muted-foreground">All links are returning valid responses.</p>
        </CardContent>
      </Card>
    );
  }

  const columns: ColumnDef<ReportData['brokenLinks'][0]>[] = [
    {
      header: '#',
      cell: (_, index) => <span className="text-muted-foreground">{index + 1}</span>,
      className: 'w-12',
    },
    {
      header: 'URL',
      cell: (row) => (
        <span className="font-mono text-sm text-red-600 truncate block max-w-md">{row.url}</span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant="destructive">{row.status}</Badge>,
      className: 'text-center w-24',
    },
    {
      header: 'Referenced From',
      cell: (row) => <Badge variant="outline">{row.referencedFrom.length}</Badge>,
      className: 'text-center w-32',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          Broken Links
          {links.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {links.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Links that returned error responses (4xx, 5xx status codes)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={links}
          searchPlaceholder="Search broken links..."
          emptyMessage="No broken links found"
        />
      </CardContent>
    </Card>
  );
}

function EmptyPagesSection({ pages }: { pages: ReportData['emptyPages'] }) {
  if (pages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Empty Pages
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">No empty pages found!</p>
          <p className="text-muted-foreground">All pages have sufficient content.</p>
        </CardContent>
      </Card>
    );
  }

  const columns: ColumnDef<ReportData['emptyPages'][0]>[] = [
    {
      header: '#',
      cell: (_, index) => <span className="text-muted-foreground">{index + 1}</span>,
      className: 'w-12',
    },
    {
      header: 'URL',
      cell: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-orange-600 hover:underline font-mono text-sm"
        >
          <span className="truncate max-w-md">{row.url}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
      className: 'text-center w-24',
    },
    {
      header: 'Content Length',
      cell: (row) => <Badge variant="outline">{row.contentLength || 0} bytes</Badge>,
      className: 'text-center w-32',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Empty Pages
          {pages.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pages.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Pages with minimal or no content (low content length)</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={pages}
          searchPlaceholder="Search empty pages..."
          emptyMessage="No empty pages found"
        />
      </CardContent>
    </Card>
  );
}

function SitemapOnlyPagesSection({ pages, targetUrl }: { pages: string[]; targetUrl: string }) {
  const columns: ColumnDef<{ url: string; index: number }>[] = [
    {
      header: '#',
      cell: (row) => <span className="text-muted-foreground">{row.index}</span>,
      className: 'w-12',
    },
    {
      header: 'URL',
      cell: (row) => (
        <a
          href={row.url.startsWith('http') ? row.url : `${new URL(targetUrl).origin}${row.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:underline font-mono text-sm"
        >
          <span className="truncate max-w-2xl">{row.url}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      ),
    },
  ];

  const tableData = pages.map((url, index) => ({ url, index: index + 1 }));

  return (
    <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          Sitemap-Only Pages
          <Badge variant="secondary" className="ml-2">
            {pages.length}
          </Badge>
        </CardTitle>
        <CardDescription className="text-yellow-700 dark:text-yellow-300">
          Pages in your sitemap but with no incoming internal links
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={tableData}
          searchPlaceholder="Search sitemap-only pages..."
          emptyMessage="No sitemap-only pages found"
        />
      </CardContent>
    </Card>
  );
}

export default ReportDashboard;
