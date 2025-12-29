/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Integration tests for ReportDashboard component
 * Tests complex data visualization, table interactions, and view switching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportDashboard } from '@/components/features/ReportDashboard';
import { ReportData, CrawlPage } from '@/types';

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock LinkGraph component
vi.mock('@/components/features/LinkGraph', () => ({
  LinkGraph: () => <div data-testid="link-graph">Link Graph Component</div>,
}));

// Mock ExportDropdown component
vi.mock('@/components/features/ExportDropdown', () => ({
  ExportDropdown: () => <button data-testid="export-dropdown">Export</button>,
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('ReportDashboard Component Integration Tests', () => {
  const createMockReport = (overrides?: Partial<ReportData>): ReportData => ({
    id: 'report-123',
    crawlId: 'crawl-123',
    generatedAt: Date.now(),
    targetUrl: 'https://example.com',
    summary: {
      totalPages: 100,
      crawledPages: 95,
      orphanedCount: 5,
      brokenLinkCount: 3,
      emptyPageCount: 2,
      avgResponseTime: 150,
    },
    orphanedPages: [
      { url: 'https://example.com/orphan1', inSitemap: false, referredBy: [] },
      { url: 'https://example.com/orphan2', inSitemap: true, referredBy: ['https://example.com/'] },
    ],
    brokenLinks: [
      { url: 'https://example.com/broken', status: 404, referencedFrom: ['https://example.com/'] },
    ],
    emptyPages: [
      {
        url: 'https://example.com/empty',
        status: 200,
        isEmpty: true,
        crawlTime: 100,
        internalLinks: [],
        externalLinks: [],
        inSitemap: true,
        contentLength: 0,
      },
    ],
    sitemapOnlyPages: ['https://example.com/sitemap-only'],
    sitemapUrls: ['https://example.com/sitemap.xml'],
    robotsData: {
      userAgent: '*',
      disallow: ['/admin'],
      allow: ['/admin/login'],
      crawlDelay: 1,
      sitemaps: ['https://example.com/sitemap.xml'],
    },
    ...overrides,
  });

  const createMockPages = (): Map<string, CrawlPage> => {
    return new Map([
      [
        'https://example.com/',
        {
          url: 'https://example.com/',
          status: 200,
          isEmpty: false,
          crawlTime: 100,
          internalLinks: ['https://example.com/page1'],
          externalLinks: [],
          inSitemap: true,
        },
      ],
      [
        'https://example.com/page1',
        {
          url: 'https://example.com/page1',
          status: 200,
          isEmpty: false,
          crawlTime: 120,
          internalLinks: ['https://example.com/'],
          externalLinks: [],
          inSitemap: true,
        },
      ],
    ]);
  };

  let mockSetActiveView: any;

  beforeEach(() => {
    mockSetActiveView = vi.fn();
  });

  describe('dashboard view rendering', () => {
    it('should render dashboard view by default', () => {
      // ARRANGE
      const report = createMockReport();
      const pages = createMockPages();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={pages}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText('SEO Audit Report')).toBeInTheDocument();
      expect(screen.getByText(report.targetUrl)).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should display summary statistics correctly', () => {
      // ARRANGE
      const report = createMockReport({
        summary: {
          totalPages: 100,
          crawledPages: 95,
          orphanedCount: 5,
          brokenLinkCount: 3,
          emptyPageCount: 2,
          avgResponseTime: 150,
        },
      });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getAllByText('100').length).toBeGreaterThan(0); // Total Pages
      expect(screen.getAllByText('95').length).toBeGreaterThan(0); // Crawled Pages
      expect(screen.getAllByText('5').length).toBeGreaterThan(0); // Orphaned
      expect(screen.getAllByText('3').length).toBeGreaterThan(0); // Broken Links
    });

    it('should show robots.txt link when robotsData exists', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      const robotsLink = screen.getByRole('link', { name: /robots\.txt/i });
      expect(robotsLink).toHaveAttribute('href', 'https://example.com/robots.txt');
      expect(robotsLink).toHaveAttribute('target', '_blank');
    });

    it('should show sitemap link when sitemaps exist', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      const sitemapLinks = screen.getAllByRole('link', { name: /sitemap\.xml/i });
      expect(sitemapLinks.length).toBeGreaterThan(0);
      expect(sitemapLinks[0]).toBeInTheDocument();
    });
  });

  describe('view switching', () => {
    it('should switch to graph view when button clicked', async () => {
      // ARRANGE
      const user = userEvent.setup();
      const report = createMockReport();

      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ACT
      const graphButton = screen.getByRole('button', { name: /link graph/i });
      await user.click(graphButton);

      // ASSERT
      expect(mockSetActiveView).toHaveBeenCalledWith('graph');
    });

    it('should display graph view when activeView is graph', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="graph"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByTestId('link-graph')).toBeInTheDocument();
      expect(screen.getByText(/interactive visualization/i)).toBeInTheDocument();
    });

    it('should highlight active view button', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      const { rerender } = render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT - Dashboard is active
      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      expect(dashboardButton).toHaveClass('bg-background', 'shadow-sm');

      // ACT - Switch to graph
      rerender(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="graph"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT - Graph is active
      const graphButton = screen.getByRole('button', { name: /link graph/i });
      expect(graphButton).toHaveClass('bg-background', 'shadow-sm');
    });
  });

  describe('orphaned pages section', () => {
    it('should display orphaned pages table when pages exist', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getAllByText(/orphaned pages/i).length).toBeGreaterThan(0);
      expect(screen.getByText('https://example.com/orphan1')).toBeInTheDocument();
      expect(screen.getByText('https://example.com/orphan2')).toBeInTheDocument();
    });

    it('should show success message when no orphaned pages', () => {
      // ARRANGE
      const report = createMockReport({
        orphanedPages: [],
        summary: { ...createMockReport().summary, orphanedCount: 0 },
      });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText(/no orphaned pages found/i)).toBeInTheDocument();
      expect(screen.getByText(/all pages have proper internal linking/i)).toBeInTheDocument();
    });

    it('should display orphaned page badges correctly', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      const badges = screen.getAllByText(/yes|no/i);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('broken links section', () => {
    it('should display broken links table', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText('https://example.com/broken')).toBeInTheDocument();
      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('should show success message when no broken links', () => {
      // ARRANGE
      const report = createMockReport({
        brokenLinks: [],
        summary: { ...createMockReport().summary, brokenLinkCount: 0 },
      });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText(/no broken links found/i)).toBeInTheDocument();
    });
  });

  describe('empty pages section', () => {
    it('should display empty pages table', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText('https://example.com/empty')).toBeInTheDocument();
    });

    it('should show success message when no empty pages', () => {
      // ARRANGE
      const report = createMockReport({
        emptyPages: [],
        summary: { ...createMockReport().summary, emptyPageCount: 0 },
      });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText(/no empty pages found/i)).toBeInTheDocument();
    });
  });

  describe('sitemap-only pages section', () => {
    it('should display sitemap-only pages when they exist', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText(/sitemap-only pages/i)).toBeInTheDocument();
      expect(screen.getByText('https://example.com/sitemap-only')).toBeInTheDocument();
    });

    it('should not show section when no sitemap-only pages', () => {
      // ARRANGE
      const report = createMockReport({ sitemapOnlyPages: [] });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.queryByText(/sitemap-only pages/i)).not.toBeInTheDocument();
    });
  });

  describe('performance metrics', () => {
    it('should display avg response time', () => {
      // ARRANGE
      const report = createMockReport({
        summary: { ...createMockReport().summary, avgResponseTime: 235 },
      });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText(/235ms/i)).toBeInTheDocument();
    });

    it('should calculate health score correctly', () => {
      // ARRANGE
      const report = createMockReport({
        summary: {
          totalPages: 100,
          crawledPages: 100,
          orphanedCount: 10,
          brokenLinkCount: 5,
          emptyPageCount: 0,
          avgResponseTime: 150,
        },
      });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      // Health Score = ((100 - 5 - 10) / 100) * 100 = 85%
      expect(screen.getByText(/85%/i)).toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    it('should render export dropdown button', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByTestId('export-dropdown')).toBeInTheDocument();
    });
  });

  describe('robots.txt and sitemap info', () => {
    it('should display sitemaps table', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getAllByText(/sitemaps/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/1 found/i)).toBeInTheDocument();
    });

    it('should display robots.txt rules table', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText(/robots\.txt rules/i)).toBeInTheDocument();
      expect(screen.getByText('/admin')).toBeInTheDocument();
      expect(screen.getByText('/admin/login')).toBeInTheDocument();
    });

    it('should show missing message when no robots.txt', () => {
      // ARRANGE
      const report = createMockReport({ robotsData: null });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText(/no robots\.txt file found/i)).toBeInTheDocument();
    });
  });

  describe('graph view integration', () => {
    it('should pass correct props to LinkGraph component', () => {
      // ARRANGE
      const report = createMockReport();
      const pages = createMockPages();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={pages}
          activeView="graph"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByTestId('link-graph')).toBeInTheDocument();
    });

    it('should show fallback when pages data is null', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={null}
          activeView="graph"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText(/page data not available/i)).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('should render "Update Crawl Option" link with correct URL', () => {
      // ARRANGE
      const report = createMockReport({ targetUrl: 'https://test.example.com' });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      const updateLink = screen.getByRole('link', { name: /update crawl option/i });
      expect(updateLink).toHaveAttribute('href', '/scan?url=https%3A%2F%2Ftest.example.com');
    });
  });

  describe('accessibility', () => {
    it('should have accessible headings', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByRole('heading', { name: /seo audit report/i })).toBeInTheDocument();
    });

    it('should have proper link targets for external links', () => {
      // ARRANGE
      const report = createMockReport();

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      const robotsLink = screen.getByRole('link', { name: /robots\.txt/i });
      expect(robotsLink).toHaveAttribute('target', '_blank');
      expect(robotsLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('edge cases', () => {
    it('should handle report with zero pages', () => {
      // ARRANGE
      const report = createMockReport({
        summary: {
          totalPages: 0,
          crawledPages: 0,
          orphanedCount: 0,
          brokenLinkCount: 0,
          emptyPageCount: 0,
          avgResponseTime: 0,
        },
        orphanedPages: [],
        brokenLinks: [],
        emptyPages: [],
        sitemapOnlyPages: [],
      });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={new Map()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });

    it('should handle very long URLs gracefully', () => {
      // ARRANGE
      const longUrl = 'https://example.com/' + 'a'.repeat(500);
      const report = createMockReport({
        orphanedPages: [{ url: longUrl, inSitemap: false, referredBy: [] }],
      });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.getByText(longUrl)).toBeInTheDocument();
    });

    it('should handle missing optional data fields', () => {
      // ARRANGE
      const report = createMockReport({
        robotsData: null,
        sitemapUrls: [],
        sitemapOnlyPages: [],
      });

      // ACT
      render(
        <ReportDashboard
          report={report}
          pages={createMockPages()}
          activeView="dashboard"
          setActiveView={mockSetActiveView}
        />
      );

      // ASSERT
      expect(screen.queryByRole('link', { name: /robots\.txt/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /sitemap\.xml/i })).not.toBeInTheDocument();
    });
  });
});
