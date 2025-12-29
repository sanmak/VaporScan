/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

export interface CORSCheckResult {
  isSameOrigin: boolean;
  corsSupported: boolean;
  canCrawl: boolean;
  status: 'success' | 'cors_blocked' | 'network_error' | 'timeout' | 'unknown';
  message: string;
  details?: string;
  responseStatus?: number;
  corsHeaders?: {
    allowOrigin: string | null;
    allowMethods: string | null;
    allowHeaders: string | null;
  };
}

/**
 * Check if a URL is same-origin as the current page
 */
export function isSameOrigin(targetUrl: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const pageOrigin = new URL(window.location.href).origin;
    const targetOrigin = new URL(targetUrl).origin;
    return pageOrigin === targetOrigin;
  } catch {
    return false;
  }
}

/**
 * Perform a CORS preflight check to determine if a website can be crawled
 * Uses HEAD request as it's a "simple" request that doesn't require preflight
 */
export async function checkCrawlability(url: string, timeout = 10000): Promise<CORSCheckResult> {
  // Validate URL format first
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        isSameOrigin: false,
        corsSupported: false,
        canCrawl: false,
        status: 'unknown',
        message: 'Invalid URL protocol',
        details: 'Only HTTP and HTTPS URLs are supported',
      };
    }
  } catch {
    return {
      isSameOrigin: false,
      corsSupported: false,
      canCrawl: false,
      status: 'unknown',
      message: 'Invalid URL format',
      details: 'Please enter a valid URL',
    };
  }

  // Check same-origin first
  const sameOrigin = isSameOrigin(url);
  if (sameOrigin) {
    return {
      isSameOrigin: true,
      corsSupported: true,
      canCrawl: true,
      status: 'success',
      message: 'Same-origin request',
      details: 'This website can be crawled without restrictions',
    };
  }

  // For cross-origin, perform a HEAD request to check CORS
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Try HEAD request first (faster, no body)
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    // Extract CORS headers
    const corsHeaders = {
      allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
      allowMethods: response.headers.get('Access-Control-Allow-Methods'),
      allowHeaders: response.headers.get('Access-Control-Allow-Headers'),
    };

    // If we got a response, CORS is working
    return {
      isSameOrigin: false,
      corsSupported: true,
      canCrawl: true,
      status: 'success',
      message: 'CORS enabled',
      details: 'This website allows cross-origin requests and can be crawled',
      responseStatus: response.status,
      corsHeaders,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle different error types
    if (error instanceof Error) {
      // AbortError = timeout
      if (error.name === 'AbortError') {
        return {
          isSameOrigin: false,
          corsSupported: false,
          canCrawl: false,
          status: 'timeout',
          message: 'Request timed out',
          details: 'The website took too long to respond. It may be slow or unreachable.',
        };
      }

      // TypeError with "Failed to fetch" usually indicates CORS block
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return {
          isSameOrigin: false,
          corsSupported: false,
          canCrawl: false,
          status: 'cors_blocked',
          message: 'CORS blocked',
          details:
            'This website does not allow cross-origin requests from browsers. VaporScan cannot crawl this site directly.',
        };
      }

      // Network errors
      if (error.message.includes('NetworkError') || error.message.includes('network')) {
        return {
          isSameOrigin: false,
          corsSupported: false,
          canCrawl: false,
          status: 'network_error',
          message: 'Network error',
          details:
            'Unable to reach the website. Please check your internet connection and the URL.',
        };
      }
    }

    // Unknown error
    return {
      isSameOrigin: false,
      corsSupported: false,
      canCrawl: false,
      status: 'unknown',
      message: 'Check failed',
      details: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Get a user-friendly status badge based on crawlability check result
 */
export function getCrawlabilityBadge(result: CORSCheckResult): {
  variant: 'success' | 'warning' | 'destructive' | 'secondary';
  label: string;
  icon: 'check' | 'alert' | 'x' | 'loader';
} {
  if (result.canCrawl) {
    if (result.isSameOrigin) {
      return { variant: 'success', label: 'Same Origin', icon: 'check' };
    }
    return { variant: 'success', label: 'CORS Enabled', icon: 'check' };
  }

  switch (result.status) {
    case 'cors_blocked':
      return { variant: 'destructive', label: 'CORS Blocked', icon: 'x' };
    case 'timeout':
      return { variant: 'warning', label: 'Timeout', icon: 'alert' };
    case 'network_error':
      return { variant: 'warning', label: 'Network Error', icon: 'alert' };
    default:
      return { variant: 'secondary', label: 'Unknown', icon: 'alert' };
  }
}

/**
 * Get suggestions for when crawling is not possible
 */
export function getCrawlabilitySuggestions(result: CORSCheckResult): string[] {
  if (result.canCrawl) return [];

  const suggestions: string[] = [];

  switch (result.status) {
    case 'cors_blocked':
      suggestions.push('Try crawling your own website (same origin works perfectly)');
      suggestions.push(
        'The website owner would need to enable CORS headers for cross-origin access'
      );
      suggestions.push('Consider using a browser extension that allows CORS (for testing only)');
      suggestions.push('Use the "Specific Pages" mode to manually add pages you have access to');
      break;
    case 'timeout':
      suggestions.push('The website may be slow or under heavy load');
      suggestions.push('Try again later or check if the website is accessible in your browser');
      break;
    case 'network_error':
      suggestions.push('Check your internet connection');
      suggestions.push('Verify the URL is correct and accessible');
      suggestions.push('The website may be blocking automated requests');
      break;
    default:
      suggestions.push('Verify the URL is correct and try again');
      break;
  }

  return suggestions;
}
