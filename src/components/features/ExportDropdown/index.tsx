/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileJson, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { ReportData } from '@/types';
import { downloadJSON, downloadCSV, downloadPDF } from '@/lib/utils/export';

interface ExportDropdownProps {
  report: ReportData;
}

export const ExportDropdown = ({ report }: ExportDropdownProps) => {
  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    const filename = `vaporscan-report-${report.crawlId}`;
    switch (format) {
      case 'json':
        downloadJSON(report, `${filename}.json`);
        break;
      case 'csv':
        downloadCSV(report, `${filename}.csv`);
        break;
      case 'pdf':
        downloadPDF(report, `${filename}.pdf`);
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
