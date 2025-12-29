/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { Header } from './Header';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  headerActions?: React.ReactNode;
  hideFooter?: boolean;
  className?: string;
}

export function PageLayout({
  children,
  showBackButton,
  backHref,
  backLabel,
  headerActions,
  hideFooter = false,
  className = '',
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col bg-background ${className}`}>
      <Header
        showBackButton={showBackButton}
        backHref={backHref}
        backLabel={backLabel}
        actions={headerActions}
      />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
