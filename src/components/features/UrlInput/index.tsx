/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const urlSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  concurrency: z.number().min(1).max(20).default(5),
  maxDepth: z.number().min(1).max(100).default(10),
  maxPages: z.number().min(1).max(10000).default(1000),
  respectRobotsTxt: z.boolean().default(true),
  timeout: z.number().min(1000).max(60000).default(10000),
});

type UrlInputForm = z.infer<typeof urlSchema>;

interface UrlInputProps {
  onSubmit: (data: UrlInputForm) => Promise<void>;
  isLoading?: boolean;
  showAdvanced?: boolean;
}

export const UrlInput = ({ onSubmit, isLoading = false, showAdvanced = false }: UrlInputProps) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UrlInputForm>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: '',
      concurrency: 5,
      maxDepth: 10,
      maxPages: 1000,
      respectRobotsTxt: true,
      timeout: 10000,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-2">
          Website URL
        </label>
        <Input
          id="url"
          type="text"
          placeholder="https://example.com"
          disabled={isLoading}
          {...register('url')}
          aria-describedby={errors.url ? 'url-error' : undefined}
        />
        {errors.url && (
          <p id="url-error" className="text-red-600 text-sm mt-1">
            {errors.url.message}
          </p>
        )}
      </div>

      {showAdvancedOptions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <label htmlFor="concurrency" className="block text-sm font-medium mb-2">
              Concurrency (requests/sec)
            </label>
            <Input
              id="concurrency"
              type="number"
              min="1"
              max="20"
              disabled={isLoading}
              {...register('concurrency', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">Default: 5</p>
          </div>

          <div>
            <label htmlFor="maxDepth" className="block text-sm font-medium mb-2">
              Max Depth
            </label>
            <Input
              id="maxDepth"
              type="number"
              min="1"
              disabled={isLoading}
              {...register('maxDepth', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">Default: 10</p>
          </div>

          <div>
            <label htmlFor="maxPages" className="block text-sm font-medium mb-2">
              Max Pages to Crawl
            </label>
            <Input
              id="maxPages"
              type="number"
              min="1"
              disabled={isLoading}
              {...register('maxPages', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">Default: 1000</p>
          </div>

          <div>
            <label htmlFor="timeout" className="block text-sm font-medium mb-2">
              Request Timeout (ms)
            </label>
            <Input
              id="timeout"
              type="number"
              min="1000"
              max="60000"
              disabled={isLoading}
              {...register('timeout', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">Default: 10000</p>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          disabled={isLoading}
        >
          {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
        </Button>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Scanning...' : 'Start Audit'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        All scanning happens in your browser. No data is sent to our servers.
      </p>
    </form>
  );
};
