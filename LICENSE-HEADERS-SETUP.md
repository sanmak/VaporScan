# License Headers Setup Guide

## Summary

VaporScan follows open-source best practices by including MIT license headers in all source code files. This document explains what has been set up and how to complete the process.

## ✅ Completed

### 1. License Headers Added

The following key files now have MIT license headers:

- ✅ [open-next.config.ts](open-next.config.ts) - OpenNext Cloudflare configuration
- ✅ [wrangler.toml](wrangler.toml) - Cloudflare Pages configuration
- ✅ [.github/workflows/cloudflare-pages.yml](.github/workflows/cloudflare-pages.yml) - CI/CD workflow

### 2. Automation Script Created

- ✅ [scripts/add-license-headers.sh](scripts/add-license-headers.sh) - Automated license header tool
  - Finds all TypeScript/JavaScript files in `src/` and `tests/`
  - Checks if files already have license headers
  - Adds headers to files that are missing them
  - Made executable with `chmod +x`

### 3. Documentation Created

- ✅ [docs/license-headers.md](docs/license-headers.md) - Comprehensive license header policy
  - Header formats for different file types
  - List of files that require headers
  - FAQ and best practices
  - Contributing guidelines

## 📋 Next Steps

### Step 1: Run the Automation Script

To add license headers to all existing source files:

```bash
# From project root
bash scripts/add-license-headers.sh
```

This will add MIT license headers to:

- All TypeScript files in `src/` (`.ts`, `.tsx`)
- All JavaScript files in `src/` (`.js`, `.jsx`)
- All test files in `tests/`

### Step 2: Verify the Changes

After running the script, verify that headers were added:

```bash
# Check a few source files
head -25 src/app/page.tsx
head -25 src/lib/crawler/sitemap-parser.ts
head -25 tests/setup.ts
```

You should see the MIT license header at the top of each file.

### Step 3: Add to Git

Stage and commit the changes:

```bash
git add src/ tests/ scripts/ docs/ open-next.config.ts wrangler.toml .github/workflows/cloudflare-pages.yml
git commit -m "docs: add MIT license headers to all source files"
```

## 📝 License Header Format

### For TypeScript/JavaScript Files

```typescript
/**
 * MIT License
 *
 * Copyright (c) 2025 VaporScan Contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
```

## 🔍 Files Covered

### Already Have License Headers ✅

- `open-next.config.ts`
- `wrangler.toml`
- `.github/workflows/cloudflare-pages.yml`
- `scripts/add-license-headers.sh`

### Will Be Updated by Script 📝

- All files in `src/` directory (~50+ files)
- All files in `tests/` directory (~30+ files)
- All GitHub Actions workflows (`.github/workflows/*.yml`)

### Excluded ❌

- `package.json`, `package-lock.json`
- `tsconfig.json`, `next.config.js` (configuration files)
- Generated files (`*.d.ts`)
- Markdown files (`*.md`)
- Build artifacts (`.next/`, `dist/`, etc.)

## 🚀 For Future Contributors

When creating new files:

1. **Always add the license header** at the top of new source files
2. Copy the header from any existing file
3. Ensure it's the first content in the file
4. Leave one blank line after the header

**Example:**

```typescript
/**
 * MIT License
 * ... (full header)
 */

import { something } from 'somewhere';

export function myNewFunction() {
  // Your code
}
```

## 🔗 Related Documentation

- [LICENSE](LICENSE) - Full MIT License text
- [docs/license-headers.md](docs/license-headers.md) - Complete policy documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contributing guidelines

## ✨ Why This Matters

Adding license headers to all files:

1. **Legal Clarity**: Makes it clear each file is MIT licensed
2. **Open Source Standard**: Follows industry best practices
3. **Code Independence**: Each file carries its own license info
4. **Attribution**: Proper credit to all contributors
5. **Corporate Compliance**: Required by many corporate legal teams

## 📞 Questions?

If you have questions about license headers:

1. Read the [License Headers Policy](docs/license-headers.md)
2. Check the [FAQ section](docs/license-headers.md#faq)
3. Open a [Discussion](https://github.com/sanmak/VaporScan/discussions)
4. Ask in a Pull Request

---

**Created:** 2025-12-29
**Author:** Claude Code Assistant
**Status:** Ready for execution
