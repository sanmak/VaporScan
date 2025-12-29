# Contributing to VaporScan

First off, thank you for considering contributing to VaporScan! 🎉

This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project is governed by the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18+ and npm 10+
- Git
- A GitHub account
- Basic knowledge of React, Next.js, and TypeScript

### Setting Up Your Development Environment

1. **Fork the Repository**

   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone Your Fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/vaporscan.git
   cd vaporscan
   ```

3. **Add Upstream Remote**

   ```bash
   git remote add upstream https://github.com/sanmak/VaporScan.git
   ```

4. **Install Dependencies**

   ```bash
   npm install
   ```

5. **Create a Feature Branch**

   ```bash
   git checkout -b feature/my-feature
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Style

We use Prettier for formatting and ESLint for linting. These are enforced via git hooks.

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Check formatting without changes
npm run format:check
```

**License Headers:**

All source code files must include the MIT license header at the top. This is required for legal clarity and follows open-source best practices.

```bash
# Automatically add license headers to all source files
bash scripts/add-license-headers.sh
```

When creating new files, always add the MIT license header at the top. See [docs/license-headers.md](docs/license-headers.md) for the complete policy and header format.

### Testing

All new features and bug fixes must include tests:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Generate coverage report
npm run test:coverage
```

**Coverage Requirements:**

- Overall: ≥80%
- Critical paths: 100%
- UI components: ≥70%
- Utilities: ≥90%

### Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history:

**Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Test additions or changes
- `chore`: Build, dependencies, or tooling changes
- `ci`: CI/CD changes

**Examples:**

```
feat(crawler): add support for robots.txt parsing
fix(ui): correct button alignment on mobile
docs: update README with new features
test(orphan-detector): add edge case tests
```

### Pull Request Process

1. **Update your branch**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Make your changes**
   - Write code following the style guide
   - Add/update tests
   - Update documentation as needed

3. **Verify everything works**

   ```bash
   npm run lint
   npm run format:check
   npm run type-check
   npm run test
   npm run build
   ```

4. **Push to your fork**

   ```bash
   git push origin feature/my-feature
   ```

5. **Create a Pull Request**
   - Use the PR template
   - Reference related issues
   - Provide clear description of changes
   - Include screenshots if UI changes

6. **Address Review Feedback**
   - Make requested changes
   - Push new commits (don't force push)
   - Mark conversations as resolved

## Architecture Guidelines

### Component Structure

```typescript
// src/components/features/MyComponent/index.tsx
'use client';

import { FC } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="space-y-4">
      <h2>{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
};
```

### Utility Functions

```typescript
// src/lib/utils/my-utility.ts
/**
 * Validates if a URL is properly formatted
 * @param url - The URL to validate
 * @returns true if valid, false otherwise
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// src/lib/utils/my-utility.test.ts
import { describe, it, expect } from 'vitest';
import { validateUrl } from './my-utility';

describe('validateUrl', () => {
  it('should validate HTTP URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(validateUrl('not a url')).toBe(false);
  });
});
```

## Performance Guidelines

- Keep bundle size minimal
- Use code splitting for large features
- Optimize images and assets
- Implement lazy loading where appropriate
- Profile with Lighthouse regularly

## Documentation

### When to Update Docs

- New features should have documentation
- Breaking changes must update migration guides
- Complex logic should include comments
- API changes need docs updates

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide context and rationale
- Update table of contents
- Link to related docs

## Security

See [SECURITY.md](./SECURITY.md) for full details.

## Common Tasks

### Adding a New Page

1. Create in `src/app/my-page/page.tsx`
2. Export component as default
3. Add TypeScript types in `src/types/`
4. Include tests in `src/app/my-page/page.test.tsx`
5. Update navigation if needed

### Adding a New Feature Component

1. Create directory in `src/components/features/MyFeature/`
2. Create `index.tsx` as main component
3. Create `MyFeature.test.tsx` for tests
4. Create `types.ts` if needed for component-specific types
5. Export from `src/components/features/index.ts`

### Adding a New Hook

1. Create in `src/lib/hooks/useMyHook.ts`
2. Mark with `'use client'` if using client features
3. Include JSDoc comments
4. Create comprehensive tests
5. Export from `src/lib/hooks/index.ts`

### Adding Tests

```typescript
// src/lib/utils/my-util.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { myFunction } from './my-util';

describe('myFunction', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    expect(myFunction()).toBe(true);
  });

  it('should handle edge cases', () => {
    expect(myFunction(null)).toThrow();
  });
});
```

## Questions & Support

- **General Questions**: [GitHub Discussions](https://github.com/sanmak/VaporScan/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/sanmak/VaporScan/issues)
- **Chat**: [Discord Server](https://discord.gg/vaporscan)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [Testing Library Docs](https://testing-library.com/)
- [Vitest Guide](https://vitest.dev/)

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to VaporScan! Your efforts help make web development better for everyone. 🙏
