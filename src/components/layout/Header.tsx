/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import Link from 'next/link';
import { Github, Antenna, Moon, Sun, Monitor, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from './ThemeProvider';
import { config } from '@/config';

interface HeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function Header({ actions }: HeaderProps) {
  const { theme, setTheme, resolvedTheme, mounted } = useTheme();

  return (
    <header className="border-b border-border bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Antenna className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">{config.app.name}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {actions}

          {/* Theme Toggle - only render when mounted to avoid hydration mismatch */}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9">
                  {resolvedTheme === 'dark' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                  {theme === 'light' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                  {theme === 'dark' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="w-4 h-4 mr-2" />
                  System
                  {theme === 'system' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Placeholder for theme toggle before hydration */}
          {!mounted && (
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Sun className="w-4 h-4" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* Settings Link */}
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Settings className="w-4 h-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>

          {/* GitHub Link */}
          <a
            href={config.app.githubRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Github className="w-4 h-4" />
              <span className="sr-only">GitHub</span>
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
