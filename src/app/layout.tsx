/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout';
import { constructMetadata, organizationJSONLD, websiteJSONLD } from '@/lib/seo';
import { config } from '@/config';

const inter = Inter({ subsets: ['latin'] });

export const metadata = constructMetadata();

const isAdvancedSEO = config.app.isAdvancedSEO;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {isAdvancedSEO && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJSONLD) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJSONLD) }}
            />
          </>
        )}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
