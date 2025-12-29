/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { MetadataRoute } from 'next';
import { config } from '@/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = config.app.url;

  const routes = ['', '/scan', '/report', '/settings'].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
