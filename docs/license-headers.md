# License Headers Policy

This document describes the MIT license header policy for VaporScan source code files.

## Overview

All source code files in the VaporScan project must include the MIT license header to ensure proper attribution and legal clarity. This is a standard practice in open-source projects.

## License Header Format

### TypeScript/JavaScript Files (.ts, .tsx, .js, .jsx)

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

### YAML/TOML Files (.yml, .yaml, .toml)

```yaml
# MIT License
#
# Copyright (c) 2025 VaporScan Contributors
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
```

### Bash Scripts (.sh)

```bash
#!/bin/bash

# MIT License
#
# Copyright (c) 2025 VaporScan Contributors
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
```

## Files That Require License Headers

### Must Include License Header

All source code files should include the license header:

- ✅ TypeScript files (`*.ts`, `*.tsx`)
- ✅ JavaScript files (`*.js`, `*.jsx`)
- ✅ Configuration files (`*.mjs`, `*.cjs`)
- ✅ GitHub Actions workflows (`*.yml`, `*.yaml`)
- ✅ Configuration files (`*.toml`)
- ✅ Shell scripts (`*.sh`)
- ✅ Test files (all `*.test.ts`, `*.spec.ts`, etc.)

### Exempt from License Header

The following files do **not** need license headers:

- ❌ Generated files (`*.d.ts`)
- ❌ Build artifacts (files in `.next/`, `dist/`, `build/`)
- ❌ Package files (`package.json`, `package-lock.json`)
- ❌ Configuration files (`tsconfig.json`, `.eslintrc.json`)
- ❌ Markdown files (`*.md`)
- ❌ Data files (`*.json`, `*.csv`)
- ❌ Dependencies (`node_modules/`)

## Adding License Headers

### Automated Script

Use the provided script to automatically add license headers to all source files:

```bash
# From project root
./scripts/add-license-headers.sh
```

This script will:

- Find all TypeScript/JavaScript files in `src/` and `tests/`
- Check if they already have a license header
- Add the MIT license header if missing
- Skip files that already have the header

### Manual Addition

When creating new files, add the appropriate license header at the top:

1. For new TypeScript/JavaScript files, copy the header from any existing file
2. Ensure the header is the **very first content** in the file (after shebang if applicable)
3. Leave one blank line after the header before your code

**Example:**

```typescript
/**
 * MIT License
 * ... (full license header)
 */

import { something } from 'somewhere';

export function myFunction() {
  // Your code here
}
```

## Why License Headers Matter

### Legal Protection

- **Clear Ownership**: Establishes that code is owned by VaporScan Contributors
- **License Terms**: Makes MIT license terms explicit in every file
- **Redistribution**: Ensures proper attribution when code is copied or forked

### Open Source Best Practices

- **Industry Standard**: Following practices from Apache, Linux, Kubernetes, etc.
- **Attribution**: Proper credit to all contributors
- **Legal Compliance**: Required for some corporate users

### Practical Benefits

- **File Independence**: Each file is self-contained with license info
- **Code Snippets**: License preserved when sharing code snippets
- **Third-party Use**: Clear terms for using individual files

## Continuous Integration

### Pre-commit Hook

The project uses a pre-commit hook to check for license headers (optional):

```bash
# .husky/pre-commit
npm run lint
# Future: Add license header check
```

### CI/CD Validation

Future enhancement: GitHub Actions will validate license headers on all PRs.

## Contributing

When contributing to VaporScan:

1. **New Files**: Always add the license header to new source files
2. **Existing Files**: Don't remove or modify existing license headers
3. **Use the Script**: Run `./scripts/add-license-headers.sh` before committing
4. **PR Review**: Reviewers will check for proper license headers

## FAQ

### Q: Do I need to add my name to the copyright?

**A:** No. We use "VaporScan Contributors" to represent all contributors collectively. Individual contributors are recognized in Git history and the [Contributors](https://github.com/sanmak/VaporScan/graphs/contributors) page.

### Q: What if I copied code from another open-source project?

**A:** If copying substantial code from another project:

1. Preserve the original license header
2. Add a comment noting the source
3. Ensure the original license is compatible with MIT
4. Document this in the file comments

### Q: Can I use a shorter SPDX identifier instead?

**A:** While SPDX identifiers are valid, we use the full license header for maximum clarity and legal protection. This is the recommended practice for MIT-licensed projects.

**Example SPDX (NOT used):**

```typescript
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 VaporScan Contributors
```

We prefer the full header for better visibility and compliance.

### Q: What about files generated by tools?

**A:** Generated files (like `.d.ts` files) are automatically excluded. For build outputs and generated code, license headers are not required.

## Resources

- [MIT License Full Text](../LICENSE)
- [SPDX License List](https://spdx.org/licenses/)
- [GitHub Licensing Guide](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
- [Open Source Best Practices](https://opensource.guide/best-practices/)

## Updates

This policy may be updated as the project evolves. Changes will be communicated through:

- Pull request updates
- README updates
- Contributor documentation

---

**Last Updated:** 2025-12-29
**Policy Version:** 1.0.0
