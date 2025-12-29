/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  clearAllData,
  getAllCrawls,
  getAllReports,
  deleteReport,
  deleteCrawl,
} from '@/lib/storage/indexed-db';
import {
  Trash2,
  Database,
  AlertTriangle,
  FileText,
  ExternalLink,
  Calendar,
  Globe,
} from 'lucide-react';
import { config } from '@/config';
import { PageLayout } from '@/components/layout';
import { ReportData } from '@/types/crawler';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const router = useRouter();
  const [storageStats, setStorageStats] = useState({ crawls: 0, reports: 0 });
  const [reports, setReports] = useState<ReportData[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [deleteCrawlConfirm, setDeleteCrawlConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const crawls = await getAllCrawls();
      const allReports = await getAllReports();

      // Sort reports by date (newest first)
      const sortedReports = allReports.sort((a, b) => b.generatedAt - a.generatedAt);

      setReports(sortedReports);
      setStorageStats({
        crawls: crawls.length,
        reports: allReports.length,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleClearStorage = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      setReports([]);
      setStorageStats({ crawls: 0, reports: 0 });
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      await loadData(); // Reload data
      setDeleteReportId(null);
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const handleClearReports = async () => {
    try {
      const allReports = await getAllReports();
      await Promise.all(allReports.map((report) => deleteReport(report.id)));
      await loadData();
    } catch (error) {
      console.error('Failed to clear reports:', error);
    }
  };

  const handleClearCrawls = async () => {
    try {
      const allCrawls = await getAllCrawls();
      await Promise.all(allCrawls.map((crawl) => deleteCrawl(crawl.id)));
      await loadData();
      setDeleteCrawlConfirm(false);
    } catch (error) {
      console.error('Failed to clear crawls:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <PageLayout showBackButton>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 min-h-[calc(100vh-130px)]">
        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <div className="space-y-6">
            {/* Reports History Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Reports History
                </h2>
                {reports.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleClearReports}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Reports
                  </Button>
                )}
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No reports generated yet</p>
                  <p className="text-sm mt-1">
                    Reports will appear here after you complete a crawl
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Target URL</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead className="text-right">Pages</TableHead>
                        <TableHead className="text-right">Issues</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow
                          key={report.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/report/${report.id}`)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate" title={report.targetUrl}>
                                {truncateUrl(report.targetUrl, 40)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(report.generatedAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{report.summary.totalPages}</TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                report.summary.orphanedCount + report.summary.brokenLinkCount > 0
                                  ? 'text-orange-600 font-medium'
                                  : 'text-green-600'
                              }
                            >
                              {report.summary.orphanedCount + report.summary.brokenLinkCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/report/${report.id}`);
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteReportId(report.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Data Management Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </h2>

              <div className="space-y-6">
                <p className="text-muted-foreground">
                  VaporScan stores crawl data and reports locally in your browser using IndexedDB.
                  All data remains private and never leaves your device.
                </p>

                {/* Storage Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-2xl font-bold">{storageStats.crawls}</p>
                    <p className="text-sm text-muted-foreground">Saved Crawls</p>
                    {storageStats.crawls > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteCrawlConfirm(true)}
                        className="mt-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear Crawls
                      </Button>
                    )}
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-2xl font-bold">{storageStats.reports}</p>
                    <p className="text-sm text-muted-foreground">Saved Reports</p>
                    {storageStats.reports > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearReports}
                        className="mt-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear Reports
                      </Button>
                    )}
                  </div>
                </div>

                {/* Clear All Data */}
                <div className="pt-4 border-t border-border">
                  {!showClearConfirm ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowClearConfirm(true)}
                      className="w-full"
                      disabled={storageStats.crawls === 0 && storageStats.reports === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Data
                    </Button>
                  ) : (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-destructive">Are you sure?</p>
                          <p className="text-sm text-destructive/80">
                            This will permanently delete all {storageStats.crawls} crawls and{' '}
                            {storageStats.reports} reports. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowClearConfirm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleClearStorage}
                          disabled={isClearing}
                          className="flex-1"
                        >
                          {isClearing ? 'Clearing...' : 'Yes, Clear All'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">About VaporScan</h2>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  VaporScan is an open-source, client-side SEO auditing tool that helps you identify
                  orphaned pages, broken links, and generate comprehensive site health reports.
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Version</p>
                    <p className="font-medium">0.1.0</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">License</p>
                    <p className="font-medium">MIT</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <a
                    href={config.app.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    GitHub Repository
                  </a>
                  <a
                    href={`${config.app.githubRepo}/issues`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Report an Issue
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Report Confirmation Dialog */}
      <AlertDialog open={deleteReportId !== null} onOpenChange={() => setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReportId && handleDeleteReport(deleteReportId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Crawls Confirmation Dialog */}
      <AlertDialog open={deleteCrawlConfirm} onOpenChange={setDeleteCrawlConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Crawls</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {storageStats.crawls} saved crawls? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCrawls}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear All Crawls
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
