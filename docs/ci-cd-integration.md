# CI/CD Integration Guide

This document describes the Continuous Integration and Continuous Deployment (CI/CD) setup for VaporScan.

## Table of Contents

- [Overview](#overview)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Testing Pipeline](#testing-pipeline)
- [Quality Gates](#quality-gates)
- [Security Scanning](#security-scanning)
- [Deployment](#deployment)
- [Badges and Status](#badges-and-status)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

VaporScan uses GitHub Actions for automated testing, quality checks, security scanning, and deployment. The CI/CD pipeline ensures code quality and catches issues early in the development process.

### Key Features

- ✅ **Automated Testing** - Unit, integration, and E2E tests on every push and PR
- ✅ **Multi-Node Testing** - Tests run on Node.js 20.x and 24.x
- ✅ **Cross-Browser E2E** - Playwright tests across Chromium, Firefox, WebKit, and Mobile Chrome
- ✅ **Code Quality** - Linting, formatting, and type checking
- ✅ **Security Scanning** - CodeQL analysis and Trivy vulnerability scanning
- ✅ **Coverage Tracking** - Codecov integration for test coverage reporting
- ✅ **PR Quality Gates** - Automated PR checks with status comments
- ✅ **Docker Publishing** - Automated Docker image builds on releases

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

**Jobs:**

#### Test Job

Runs on Node.js 20.x and 24.x in a matrix:

1. **Code Quality Checks**

   ```bash
   npm run lint              # ESLint
   npm run format:check      # Prettier
   npm run type-check        # TypeScript
   ```

2. **Testing**

   ```bash
   npm run test:unit         # Unit tests (144 tests)
   npm run test:integration  # Integration tests (117 tests)
   npm run test:coverage:all # Combined coverage report
   ```

3. **Build Verification**

   ```bash
   npm run build            # Next.js production build
   ```

4. **Security Audit**

   ```bash
   npm audit --production   # Check for vulnerabilities
   ```

5. **Artifacts**
   - Test results (JSON format)
   - Coverage reports (uploaded to Codecov)
   - Test summaries in GitHub Actions UI

#### E2E Job

Runs after the test job completes successfully:

1. **Parallel Execution**
   - Tests split into 2 shards for faster execution
   - Each shard runs independently

2. **Browser Testing**

   ```bash
   npx playwright test --shard=1/2  # Shard 1
   npx playwright test --shard=2/2  # Shard 2
   ```

3. **Artifacts**
   - Playwright HTML reports
   - Screenshots on failures
   - Videos of failed tests
   - Trace files for debugging

#### Security Job

Runs in parallel with tests:

1. **Trivy Scanning**
   - Scans filesystem for vulnerabilities
   - Generates SARIF report
   - Uploads to GitHub Security tab

#### Build Job

Final verification after all tests pass:

1. **Production Build**
   - Creates optimized production bundle
   - Uploads build artifacts
   - Retains for 5 days

### 2. PR Quality Gate Workflow (`.github/workflows/pr-quality-gate.yml`)

**Triggers:**

- Pull request opened, synchronized, or reopened

**Features:**

1. **Comprehensive Checks**
   - All quality checks run independently
   - Continues even if some checks fail
   - Provides complete overview of issues

2. **Automated PR Comments**
   - Creates/updates comment with check results
   - Shows status of each check with emoji indicators
   - Updates on each push to PR

3. **Coverage Analysis**
   - Generates coverage report
   - Uploads to Codecov
   - Comments coverage diff on PR

4. **Bundle Size Tracking**
   - Analyzes build output size
   - Reports largest files
   - Helps prevent bundle bloat

**Example PR Comment:**

```markdown
## 🔍 PR Quality Gate Results

| Check             | Status     |
| ----------------- | ---------- |
| Linting           | ✅ success |
| Formatting        | ✅ success |
| Type Checking     | ✅ success |
| Unit Tests        | ✅ success |
| Integration Tests | ✅ success |
| Build             | ✅ success |

### ✅ All checks passed! This PR is ready for review.
```

### 3. Test Report Workflow (`.github/workflows/test-report.yml`)

**Triggers:**

- After CI workflow completes

**Features:**

1. **Test Result Publishing**
   - Downloads test artifacts
   - Publishes unified test results
   - Comments summary on PRs

2. **Playwright Report Access**
   - Makes E2E reports accessible
   - Provides links to detailed reports
   - Includes failure screenshots/videos

### 4. CodeQL Workflow (`.github/workflows/codeql.yml`)

**Triggers:**

- Push to `main` or `develop`
- Pull requests
- Scheduled weekly scans (Mondays at 3 AM UTC)

**Analysis:**

- JavaScript/TypeScript code scanning
- Security and quality queries
- Results in GitHub Security tab

### 5. Docker Release Workflow (`.github/workflows/docker-release.yml`)

**Triggers:**

- GitHub release published

**Actions:**

1. Builds Docker image
2. Tags with version, semver patterns, and `latest`
3. Pushes to GitHub Container Registry (ghcr.io)

**Tags Generated:**

- `v1.2.3` (exact version)
- `1.2` (major.minor)
- `1` (major)
- `sha-<commit>` (commit SHA)
- `latest` (for non-prerelease versions)

## Testing Pipeline

### Test Pyramid Structure

```
        E2E Tests (10%)
       /              \
      /   58 tests     \
     /    5 browsers    \
    /____________________\
   Integration Tests (30%)
  /                      \
 /      117 tests         \
/________________________  \
    Unit Tests (60%)
   144 tests across
   all components
```

### Test Execution Flow

```
┌─────────────────────────────────────────┐
│           Code Push / PR                │
└────────────────┬────────────────────────┘
                 │
      ┌──────────▼──────────┐
      │  Quality Checks     │
      │  - Lint             │
      │  - Format           │
      │  - TypeCheck        │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │  Unit Tests         │
      │  Node 20.x, 24.x    │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │  Integration Tests  │
      │  Node 20.x, 24.x    │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │  Coverage Report    │
      │  Upload to Codecov  │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │  Build Check        │
      │  Production Build   │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │  E2E Tests          │
      │  Playwright (4 browsers) │
      │  Parallel Shards    │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │  Security Scan      │
      │  Trivy + CodeQL     │
      └──────────┬──────────┘
                 │
      ┌──────────▼──────────┐
      │  ✅ All Passed      │
      └─────────────────────┘
```

## Quality Gates

### PR Merge Requirements

Before a PR can be merged to `main` or `develop`, it must pass:

1. ✅ **All Tests Pass**
   - Unit tests: 144 tests
   - Integration tests: 117 tests
   - E2E tests: 58 tests (all browsers)

2. ✅ **Code Quality**
   - No ESLint errors
   - Code formatted with Prettier
   - No TypeScript errors

3. ✅ **Build Success**
   - Production build completes
   - No build warnings/errors

4. ✅ **Security**
   - No critical vulnerabilities in npm audit
   - CodeQL analysis passes
   - Trivy scan passes

5. ✅ **Coverage** (recommended)
   - Maintain or improve coverage
   - No significant coverage drops

### Branch Protection Rules

Recommended GitHub branch protection settings for `main`:

```yaml
Required status checks:
  - Test (Node 20.x)
  - Test (Node 24.x)
  - E2E (Shard 1)
  - E2E (Shard 2)
  - Security
  - PR Quality Gate / quality-checks

Require branches to be up to date: true
Require pull request reviews: 1
Dismiss stale reviews: true
Require review from code owners: true
```

## Security Scanning

### CodeQL Analysis

**What it does:**

- Static analysis of JavaScript/TypeScript code
- Detects security vulnerabilities
- Identifies code quality issues

**Queries:**

- Security queries (SQL injection, XSS, etc.)
- Code quality queries (unused code, complexity, etc.)

**Results:**

- Viewable in GitHub Security tab
- Alerts created for findings
- Can be dismissed with justification

### Trivy Vulnerability Scanning

**What it scans:**

- npm dependencies
- File system vulnerabilities
- Configuration issues

**Output:**

- SARIF format report
- Uploaded to GitHub Security
- Integrated with Dependabot

### npm Audit

**Runs on:**

- Every CI build
- Production dependencies only

**Action:**

- Reports vulnerabilities
- Does not fail CI by default
- Should be reviewed regularly

## Deployment

### Automated Docker Release

When a GitHub release is published:

1. **Docker Image Build**
   - Builds from `docker/Dockerfile`
   - Multi-stage build for optimization
   - Layer caching for faster builds

2. **Image Tagging**

   ```bash
   ghcr.io/sanmak/vaporscan:v1.2.3
   ghcr.io/sanmak/vaporscan:1.2
   ghcr.io/sanmak/vaporscan:1
   ghcr.io/sanmak/vaporscan:latest
   ghcr.io/sanmak/vaporscan:sha-abc1234
   ```

3. **Registry Push**
   - Pushed to GitHub Container Registry
   - Public or private based on repo settings
   - Accessible via `docker pull ghcr.io/sanmak/vaporscan`

### Manual Deployment

For manual deployments:

```bash
# Build locally
npm run build

# Run production server
npm start

# Or use Docker
docker build -f docker/Dockerfile -t vaporscan .
docker run -p 3000:3000 vaporscan
```

## Badges and Status

### GitHub Actions Badges

Add to README.md:

```markdown
[![CI](https://github.com/sanmak/VaporScan/workflows/CI/badge.svg)](https://github.com/sanmak/VaporScan/actions/workflows/ci.yml)
[![CodeQL](https://github.com/sanmak/VaporScan/workflows/CodeQL/badge.svg)](https://github.com/sanmak/VaporScan/actions/workflows/codeql.yml)
```

### Codecov Badge

```markdown
[![codecov](https://codecov.io/gh/sanmak/VaporScan/branch/main/graph/badge.svg)](https://codecov.io/gh/sanmak/VaporScan)
```

### Custom Test Status Badges

Using shields.io:

```markdown
![Unit Tests](https://img.shields.io/badge/unit%20tests-144%20passing-brightgreen)
![Integration Tests](https://img.shields.io/badge/integration%20tests-117%20passing-brightgreen)
![E2E Tests](https://img.shields.io/badge/e2e%20tests-58%20passing-brightgreen)
```

## Best Practices

### 1. Keep Tests Fast

- **Unit Tests**: < 5 seconds total
- **Integration Tests**: < 30 seconds total
- **E2E Tests**: < 5 minutes total
- Use test sharding for parallelization
- Mock external dependencies

### 2. Maintain Test Quality

- Write deterministic tests (no flaky tests)
- Use meaningful test descriptions
- Keep test coverage above 80%
- Test edge cases and error scenarios

### 3. Optimize CI Performance

- Use caching for dependencies (`npm ci` with cache)
- Run jobs in parallel when possible
- Use matrix builds for multi-version testing
- Only run E2E on specific file changes (optional)

### 4. Security

- Regularly update dependencies
- Review security alerts promptly
- Keep secrets in GitHub Secrets
- Use Dependabot for automated updates

### 5. Documentation

- Document CI/CD changes in this file
- Update workflow comments
- Keep README badges current
- Document any manual steps

## Troubleshooting

### Failed Tests in CI but Pass Locally

**Possible causes:**

1. Environment differences (Node version, OS)
2. Timezone issues
3. Flaky tests
4. Missing environment variables

**Solutions:**

```bash
# Match CI Node version
nvm use 24

# Run tests in CI mode
CI=true npm run test

# Check for flaky tests
npm run test -- --repeat-each=10
```

### E2E Tests Timeout

**Solutions:**

1. Increase timeout in `playwright.config.ts`
2. Check if dev server starts correctly
3. Review network conditions
4. Check for resource-intensive operations

```bash
# Debug E2E locally
npm run test:e2e:debug
```

### Coverage Upload Fails

**Solutions:**

1. Verify `CODECOV_TOKEN` secret is set
2. Check Codecov service status
3. Review coverage file generation

```bash
# Generate coverage locally
npm run test:coverage:all
ls -la coverage/
```

### Docker Build Fails

**Solutions:**

1. Check Dockerfile syntax
2. Verify all files are available
3. Review build context
4. Check for .dockerignore issues

```bash
# Build locally to debug
docker build -f docker/Dockerfile -t test .
```

### Workflow Not Triggering

**Causes:**

1. Incorrect branch name
2. Workflow syntax error
3. Permissions issue

**Solutions:**

1. Validate workflow YAML syntax
2. Check branch protection settings
3. Review workflow run history

### Artifacts Not Found

**Solutions:**

1. Check artifact names match between jobs
2. Verify artifact upload succeeded
3. Review retention days setting
4. Ensure job dependencies are correct

## Advanced Configuration

### Custom Test Reporters

Add custom reporters to `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    reporters: ['default', 'json', 'junit', 'html'],
  },
});
```

### Conditional E2E Tests

Run E2E only on specific changes:

```yaml
- name: Check for E2E changes
  id: filter
  uses: dorny/paths-filter@v2
  with:
    filters: |
      e2e:
        - 'src/**'
        - 'tests/e2e/**'

- name: Run E2E tests
  if: steps.filter.outputs.e2e == 'true'
  run: npm run test:e2e
```

### Slack/Discord Notifications

Add notifications for CI status:

```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright CI Guide](https://playwright.dev/docs/ci)
- [Codecov Documentation](https://docs.codecov.com/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [CodeQL Queries](https://codeql.github.com/docs/)

## Maintenance

### Weekly Tasks

- [ ] Review failed workflow runs
- [ ] Check security alerts
- [ ] Update dependencies if needed
- [ ] Review test coverage trends

### Monthly Tasks

- [ ] Update GitHub Actions versions
- [ ] Review and optimize workflow performance
- [ ] Clean up old artifacts
- [ ] Update CI/CD documentation

### Quarterly Tasks

- [ ] Audit security scanning tools
- [ ] Review branch protection rules
- [ ] Optimize test execution time
- [ ] Update Node.js versions in matrix
