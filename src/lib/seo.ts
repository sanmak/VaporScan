/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Metadata } from 'next';
import { config } from '@/config';

const isAdvancedSEO = config.app.isAdvancedSEO;
const siteUrl = config.app.url;

export const siteConfig = {
  name: config.app.name,
  shortDescription: 'Open-Source Client-Side SEO Auditing Tool',
  description: config.app.description,
  url: siteUrl,
  ogImage: `${siteUrl}/og-image.png`,
  links: {
    github: config.app.githubRepo,
  },
  keywords: [
    'SEO Audit',
    'Technical SEO',
    'Open Source SEO Tool',
    'Broken Link Checker',
    'Sitemap Validator',
    'Privacy-first Crawler',
    'Web Performance',
    'Client-side SEO',
  ],
};

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  const baseMetadata: Metadata = {
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords: siteConfig.keywords,
    authors: [{ name: 'VaporScan Team' }],
    creator: 'VaporScan',
  };

  if (!isAdvancedSEO) {
    return baseMetadata;
  }

  // Advanced SEO implementation
  return {
    ...baseMetadata,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@VaporScan',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
  };
}

export const organizationJSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
  sameAs: [siteConfig.links.github],
};

export const websiteJSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteConfig.url}/?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};
