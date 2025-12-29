/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * Integration test helper: Render components with all necessary providers
 * Following integration-testing.md guidelines
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ProvidersOptions {
  queryClient?: QueryClient;
}

/**
 * Renders a component with all required providers for integration testing
 * @param ui - The React component to render
 * @param options - Optional configuration for providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: ProvidersOptions & Omit<RenderOptions, 'wrapper'>
) {
  const { queryClient, ...renderOptions } = options || {};

  // Create a fresh QueryClient for each test to avoid shared state
  const testQueryClient =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries in tests for faster failures
          gcTime: 0, // Disable caching between tests
        },
        mutations: {
          retry: false,
        },
      },
    });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: testQueryClient,
  };
}

/**
 * Creates a test QueryClient with sensible defaults for integration testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
