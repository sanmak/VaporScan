/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Export utilities for different file formats
 */

import { ReportData } from '@/types';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import autoTable from 'jspdf-autotable';

/**
 * Download report as JSON
 */
export const downloadJSON = (report: ReportData, filename: string): void => {
  const dataStr = JSON.stringify(report, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  triggerDownload(dataBlob, filename);
};

/**
 * Download report as CSV
 */
export const downloadCSV = (report: ReportData, filename: string): void => {
  const data = [];

  // Summary section
  data.push({
    Section: 'Summary',
    Metric: '',
    Value: '',
  });
  data.push({
    Section: 'Target URL',
    Metric: report.targetUrl,
    Value: '',
  });
  data.push({
    Section: 'Generated At',
    Metric: new Date(report.generatedAt).toISOString(),
    Value: '',
  });

  // Summary metrics
  data.push({
    Section: 'Metrics',
    Metric: 'Total Pages',
    Value: report.summary.totalPages,
  });
  data.push({
    Section: 'Metrics',
    Metric: 'Crawled Pages',
    Value: report.summary.crawledPages,
  });
  data.push({
    Section: 'Metrics',
    Metric: 'Orphaned Pages',
    Value: report.summary.orphanedCount,
  });
  data.push({
    Section: 'Metrics',
    Metric: 'Broken Links',
    Value: report.summary.brokenLinkCount,
  });
  data.push({
    Section: 'Metrics',
    Metric: 'Empty Pages',
    Value: report.summary.emptyPageCount,
  });

  // Orphaned pages
  if (report.orphanedPages.length > 0) {
    data.push({
      Section: 'Orphaned Pages',
      Metric: '',
      Value: '',
    });
    report.orphanedPages.forEach((page) => {
      data.push({
        Section: 'Orphaned Pages',
        Metric: page.url,
        Value: `In Sitemap: ${page.inSitemap}, Referred By: ${page.referredBy.length}`,
      });
    });
  }

  // Broken links
  if (report.brokenLinks.length > 0) {
    data.push({
      Section: 'Broken Links',
      Metric: '',
      Value: '',
    });
    report.brokenLinks.forEach((link) => {
      data.push({
        Section: 'Broken Links',
        Metric: link.url,
        Value: `Status: ${link.status}, Referenced From: ${link.referencedFrom.length}`,
      });
    });
  }

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
};

/**
 * Download report as PDF
 */
export const downloadPDF = (report: ReportData, filename: string): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 10;

  // Title
  doc.setFontSize(20);
  doc.text('VaporScan SEO Audit Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Target URL
  doc.setFontSize(12);
  doc.text(`Target: ${report.targetUrl}`, 10, yPosition);
  yPosition += 8;

  // Generated Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 10, yPosition);
  yPosition += 12;

  // Summary Section
  doc.setFontSize(14);
  doc.text('Summary', 10, yPosition);
  yPosition += 8;

  const summaryData = [
    ['Metric', 'Value'],
    ['Total Pages', String(report.summary.totalPages)],
    ['Crawled Pages', String(report.summary.crawledPages)],
    ['Orphaned Pages', String(report.summary.orphanedCount)],
    ['Broken Links', String(report.summary.brokenLinkCount)],
    ['Empty Pages', String(report.summary.emptyPageCount)],
    ['Avg Response Time', `${report.summary.avgResponseTime.toFixed(2)}ms`],
  ];

  doc.setFontSize(10);
  autoTable(doc, {
    startY: yPosition,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    margin: 10,
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
    },
  });

  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Orphaned Pages Section
  if (report.orphanedPages.length > 0) {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 10;
    }

    doc.setFontSize(14);
    doc.text('Orphaned Pages', 10, yPosition);
    yPosition += 8;

    const orphanedData = report.orphanedPages.map((page) => [
      page.url.substring(0, 50),
      String(page.inSitemap),
      String(page.referredBy.length),
    ]);

    doc.setFontSize(9);
    autoTable(doc, {
      startY: yPosition,
      head: [['URL', 'In Sitemap', 'Referred By']],
      body: orphanedData,
      margin: 10,
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
      },
    });

    yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Broken Links Section
  if (report.brokenLinks.length > 0) {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 10;
    }

    doc.setFontSize(14);
    doc.text('Broken Links', 10, yPosition);
    yPosition += 8;

    const brokenData = report.brokenLinks
      .slice(0, 10)
      .map((link) => [
        link.url.substring(0, 50),
        String(link.status),
        String(link.referencedFrom.length),
      ]);

    doc.setFontSize(9);
    autoTable(doc, {
      startY: yPosition,
      head: [['URL', 'Status', 'Referenced From']],
      body: brokenData,
      margin: 10,
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
      },
    });
  }

  // Save
  doc.save(filename);
};

/**
 * Trigger browser download
 */
const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
