/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { config } from '@/config';

export function Footer() {
  return (
    <footer className="border-t border-border bg-white/50 dark:bg-slate-950/50 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} {config.app.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
