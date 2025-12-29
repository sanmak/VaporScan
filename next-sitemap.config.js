/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://sanmak.github.io/VaporScan',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/report/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
};
