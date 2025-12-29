# Cloudflare Pages Deployment Guide

This guide covers deploying VaporScan to Cloudflare Pages using the OpenNext adapter.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment Methods](#deployment-methods)
- [Environment Variables](#environment-variables)
- [CI/CD Setup](#cicd-setup)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Prerequisites

Before deploying to Cloudflare Pages, ensure you have:

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Cloudflare API Token**: Create an API token with Pages edit permissions
3. **Node.js**: Version 24.x or later
4. **Wrangler CLI**: Installed automatically with `npm install`

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Application

```bash
# Build Next.js application
npm run build

# Build for Cloudflare Pages (using OpenNext adapter)
npm run pages:build
```

### 3. Deploy

```bash
# Deploy to Cloudflare Pages
npm run pages:deploy
```

## Configuration

### 1. Wrangler Configuration (`wrangler.toml`)

The project includes a `wrangler.toml` file with basic configuration:

```toml
name = "vaporscan"
compatibility_date = "2024-12-01"
pages_build_output_dir = ".open-next/worker"

[env.production]
# Production environment variables

[env.preview]
# Preview environment variables
```

**Key Settings:**

- `name`: Your Cloudflare Pages project name
- `compatibility_date`: Cloudflare Workers compatibility date
- `pages_build_output_dir`: Output directory for the built worker

### 2. OpenNext Configuration (`open-next.config.ts`)

OpenNext adapter configuration for Cloudflare compatibility:

```typescript
import type { OpenNextConfig } from '@opennextjs/cloudflare';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
  edgeExternals: ['node:crypto'],
  middleware: {
    external: true,
    override: {
      wrapper: 'cloudflare-edge',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
};

export default config;
```

**Configuration Explained:**

- `wrapper`: Runtime wrapper for Cloudflare environment
- `converter`: Edge runtime converter
- `proxyExternalRequest`: Use fetch API for external requests
- `incrementalCache`: Disabled for static site (dummy implementation)
- `edgeExternals`: Node.js modules available in edge runtime

### 3. Next.js Configuration (`next.config.js`)

Key Cloudflare-specific settings:

```javascript
const nextConfig = {
  // Disable image optimization (Cloudflare handles this)
  images: {
    unoptimized: true,
  },

  // Headers, redirects, rewrites are handled via _headers and _redirects files
};
```

### 4. Headers Configuration (`public/_headers`)

Security and caching headers for Cloudflare Pages:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; ...

/service-worker.js
  Cache-Control: no-cache, no-store, must-revalidate

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

Automatic deployment on every push to `main` branch.

**Setup Steps:**

1. **Add GitHub Secrets:**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token ([Create token](https://dash.cloudflare.com/profile/api-tokens))
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID ([Find it here](https://dash.cloudflare.com/))

2. **Workflow Configuration:**
   The workflow is already configured in `.github/workflows/cloudflare-pages.yml`

3. **Trigger Deployment:**
   ```bash
   git push origin main
   ```

**Features:**

- ✅ Automatic deployment on push to `main`
- ✅ Preview deployments for pull requests
- ✅ Type checking and linting before deployment
- ✅ Build verification
- ✅ Automated PR comments with deployment URLs

### Method 2: Manual Deployment via Wrangler CLI

Deploy manually using Wrangler CLI.

**Steps:**

1. **Login to Cloudflare:**

   ```bash
   npx wrangler login
   ```

2. **Build the application:**

   ```bash
   npm run build
   npm run pages:build
   ```

3. **Deploy:**
   ```bash
   npm run pages:deploy
   ```

### Method 3: Cloudflare Dashboard

Deploy via the Cloudflare Pages dashboard.

**Steps:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
2. Click "Create a project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command:** `npm run build && npm run pages:build`
   - **Build output directory:** `.open-next/worker`
   - **Root directory:** (leave empty)
5. Add environment variables (if needed)
6. Click "Save and Deploy"

## Environment Variables

### Required Variables

No environment variables are required for basic deployment since VaporScan is a client-side application.

### Optional Variables

Configure these in Cloudflare Pages dashboard or `.env.cloudflare.example`:

```env
# Application URL
NEXT_PUBLIC_APP_URL=https://vaporscan.pages.dev

# GitHub Repository
NEXT_PUBLIC_GITHUB_REPO=https://github.com/sanmak/VaporScan

# Analytics (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# SEO Advanced Features (optional)
NEXT_PUBLIC_SEO_ADVANCED=false
```

**Setting Variables in Cloudflare:**

1. Go to Pages project → Settings → Environment variables
2. Add variables for Production and/or Preview environments
3. Redeploy for changes to take effect

## CI/CD Setup

### Automatic Deployments

The GitHub Actions workflow (`.github/workflows/cloudflare-pages.yml`) handles:

1. **Quality Checks:**
   - TypeScript type checking
   - ESLint linting
   - Next.js build verification

2. **Build Process:**
   - Next.js production build
   - OpenNext Cloudflare adapter build

3. **Deployment:**
   - Deploy to Cloudflare Pages
   - Comment on PRs with preview URLs

### Branch Deployments

- **Production:** Deployments to `main` branch → `vaporscan.pages.dev`
- **Preview:** Pull requests → `<branch-name>.vaporscan.pages.dev`

## Local Testing

### Preview Locally with Wrangler

Test the Cloudflare Pages deployment locally before pushing:

```bash
# Build for Cloudflare
npm run pages:build

# Start local preview server
npm run preview
```

The preview server will start at `http://localhost:8788` (default port).

### Development Mode

For regular development, use the Next.js dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Troubleshooting

### Common Issues

#### 1. Build Fails with "missing open-next.config.ts"

**Solution:** Ensure `open-next.config.ts` exists in the root directory.

```bash
# File should exist at:
ls open-next.config.ts
```

#### 2. "Dynamic routes not working"

**Issue:** `/report/[id]` routes return 404.

**Solution:** This is expected with static export. The routes work client-side through the `_redirects` file in `public/` directory.

#### 3. "Headers not applied"

**Issue:** Security headers don't appear in responses.

**Solution:** Verify `public/_headers` file exists and is properly formatted.

```bash
# Check file exists
ls public/_headers
```

#### 4. "Service Worker not loading"

**Issue:** Service Worker fails to register.

**Solution:**

- Ensure `public/service-worker.js` exists
- Check browser console for errors
- Verify HTTPS is enabled (Service Workers require HTTPS)

#### 5. "Environment variables not available"

**Issue:** `process.env.NEXT_PUBLIC_*` variables are undefined.

**Solution:**

- Verify variables are prefixed with `NEXT_PUBLIC_`
- Set variables in Cloudflare Pages dashboard
- Rebuild and redeploy after adding variables

### Debug Mode

Enable debug logging in Wrangler:

```bash
WRANGLER_LOG=debug npm run preview
```

### Logs

View deployment logs in Cloudflare Dashboard:

1. Go to Pages project
2. Click on a deployment
3. View "Build log" and "Function log" tabs

## Best Practices

### 1. Security

- ✅ **Use environment variables** for sensitive data
- ✅ **Enable security headers** via `_headers` file
- ✅ **Keep dependencies updated** to patch vulnerabilities
- ✅ **Use HTTPS** for all deployments (automatic on Cloudflare Pages)

### 2. Performance

- ✅ **Enable caching** for static assets (`_headers` configuration)
- ✅ **Optimize images** before deploying (use WebP format)
- ✅ **Minimize bundle size** (already configured in `next.config.js`)
- ✅ **Use CDN** (automatic with Cloudflare Pages global network)

### 3. Deployment

- ✅ **Test locally** before deploying (`npm run preview`)
- ✅ **Use preview deployments** for testing changes (PR deployments)
- ✅ **Monitor deployments** in Cloudflare Dashboard
- ✅ **Set up alerts** for build failures (GitHub Actions notifications)

### 4. Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# ... edit code ...

# 3. Test locally
npm run dev
npm run build
npm run pages:build
npm run preview

# 4. Push and create PR
git push origin feature/my-feature
# Creates preview deployment automatically

# 5. Merge to main after review
# Deploys to production automatically
```

## Performance Optimization

### Caching Strategy

VaporScan uses the following caching strategy on Cloudflare Pages:

1. **Static Assets:** Cached for 1 year (immutable)
2. **Service Worker:** No cache (always fetch latest)
3. **HTML Pages:** Browser cache (no CDN cache)
4. **API Routes:** No cache (always dynamic)

### Bundle Size

Monitor bundle size with:

```bash
npm run analyze
```

### Monitoring

Use Cloudflare Analytics to monitor:

- **Page views** and traffic
- **Performance metrics** (TTFB, FCP, LCP)
- **Error rates** and status codes
- **Geographic distribution** of users

Access at: Cloudflare Dashboard → Pages → Your Project → Analytics

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [OpenNext Cloudflare Adapter](https://opennext.js.org/cloudflare)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [VaporScan Contributing Guide](../CONTRIBUTING.md)

## Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section above
2. Review [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
3. [Open an issue](https://github.com/sanmak/VaporScan/issues/new) on GitHub
4. Join our [Discussions](https://github.com/sanmak/VaporScan/discussions)

---

**Happy Deploying! 🚀**
