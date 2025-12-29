# GitHub Actions Workflow Summary

This document provides a quick reference for all GitHub Actions workflows in VaporScan.

## Active Workflows

### 1. CI Workflow

**File:** `.github/workflows/ci.yml`
**Trigger:** Push/PR to `main` or `develop`
**Purpose:** Comprehensive testing and validation

```
┌─────────────────────────────────────────────────────────┐
│                    CI WORKFLOW                          │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───▼───┐       ┌─────▼──────┐
    │ Test  │       │  Security  │
    │Matrix │       │   Scan     │
    │20.x   │       │  (Trivy)   │
    │24.x   │       └─────┬──────┘
    └───┬───┘             │
        │                 │
┌───────▼────────┐        │
│ Quality Checks │        │
│ - Lint         │        │
│ - Format       │        │
│ - TypeCheck    │        │
└───────┬────────┘        │
        │                 │
┌───────▼────────┐        │
│  Unit Tests    │        │
│  144 tests     │        │
└───────┬────────┘        │
        │                 │
┌───────▼────────┐        │
│Integration     │        │
│  117 tests     │        │
└───────┬────────┘        │
        │                 │
┌───────▼────────┐        │
│   Coverage     │        │
│   → Codecov    │        │
└───────┬────────┘        │
        │                 │
┌───────▼────────┐        │
│     Build      │        │
│  Production    │        │
└───────┬────────┘        │
        │                 │
        │       ┌─────────▼──────┐
        └───────►   E2E Tests    │
                │  Shard 1 & 2   │
                │  4 Browsers    │
                │  58 tests      │
                └─────────┬──────┘
                          │
                ┌─────────▼──────┐
                │ Final Build    │
                │   Artifacts    │
                └────────────────┘
```

**Jobs:**

- `test` (Node 20.x, 24.x matrix)
- `e2e` (2 shards, 4 browsers)
- `security` (Trivy scan)
- `build` (Final verification)

**Artifacts:**

- Test results (30 days)
- Coverage reports
- Playwright reports (30 days)
- Build output (5 days)

---

### 2. PR Quality Gate

**File:** `.github/workflows/pr-quality-gate.yml`
**Trigger:** PR opened/synchronized/reopened
**Purpose:** Automated PR validation with status comments

```
┌──────────────────────────────────────┐
│       PR QUALITY GATE                │
└────────────┬─────────────────────────┘
             │
    ┌────────┴──────────┐
    │                   │
┌───▼────────┐  ┌───────▼──────┐
│  Quality   │  │   Coverage   │
│  Checks    │  │   Analysis   │
│            │  │              │
│ • Lint     │  │ • Generate   │
│ • Format   │  │ • Codecov    │
│ • TypeChk  │  │ • PR Comment │
│ • Tests    │  └──────────────┘
│ • Build    │
│            │
│ Creates/   │
│ Updates    │
│ PR Comment │
└────────────┘
         │
    ┌────▼────┐
    │ Bundle  │
    │  Size   │
    │Analysis │
    └─────────┘
```

**Features:**

- Individual check status tracking
- Automated PR comments with results table
- Coverage diff reporting
- Bundle size analysis
- Fail if any check fails

---

### 3. CodeQL Analysis

**File:** `.github/workflows/codeql.yml`
**Trigger:** Push/PR + Weekly schedule
**Purpose:** Advanced security scanning

```
┌─────────────────────────────────┐
│       CODEQL ANALYSIS           │
└──────────┬──────────────────────┘
           │
    ┌──────▼──────┐
    │  Initialize │
    │   CodeQL    │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │    Build    │
    │ Application │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Analyze   │
    │  JS/TS Code │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Upload    │
    │   Results   │
    │  → Security │
    └─────────────┘
```

**Schedule:** Mondays at 3:00 AM UTC
**Language:** JavaScript/TypeScript
**Queries:** Security + Quality

---

### 4. Docker Release

**File:** `.github/workflows/docker-release.yml`
**Trigger:** GitHub Release published
**Purpose:** Automated Docker image publishing

```
┌─────────────────────────────────┐
│       DOCKER RELEASE            │
└──────────┬──────────────────────┘
           │
    ┌──────▼──────┐
    │   Login to  │
    │    GHCR     │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Extract   │
    │  Metadata   │
    │  (Tags)     │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │    Build    │
    │    Image    │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │    Push     │
    │  → ghcr.io  │
    └─────────────┘
```

**Tags Generated:**

- `v1.2.3` (exact)
- `1.2` (major.minor)
- `1` (major)
- `sha-abc123` (commit)
- `latest` (non-prerelease)

**Registry:** ghcr.io/sanmak/vaporscan

---

### 5. Test Report

**File:** `.github/workflows/test-report.yml`
**Trigger:** After CI workflow completes
**Purpose:** Unified test result reporting

```
┌─────────────────────────────────┐
│        TEST REPORT              │
└──────────┬──────────────────────┘
           │
    ┌──────▼──────┐
    │  Download   │
    │  Artifacts  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Publish   │
    │    Test     │
    │   Results   │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Comment   │
    │     on      │
    │     PR      │
    └─────────────┘
```

---

## Workflow Triggers

| Workflow        | Push (main/dev) | PR           | Release | Schedule  |
| --------------- | --------------- | ------------ | ------- | --------- |
| CI              | ✅              | ✅           | ❌      | ❌        |
| PR Quality Gate | ❌              | ✅           | ❌      | ❌        |
| CodeQL          | ✅              | ✅           | ❌      | ✅ Weekly |
| Docker Release  | ❌              | ❌           | ✅      | ❌        |
| Test Report     | Workflow Run    | Workflow Run | ❌      | ❌        |

---

## Test Execution Matrix

### CI Workflow Test Matrix

| Test Type   | Tests | Duration | Browsers                                 | Node Versions |
| ----------- | ----- | -------- | ---------------------------------------- | ------------- |
| Unit        | 144   | ~5s      | N/A                                      | 20.x, 24.x    |
| Integration | 117   | ~30s     | N/A                                      | 20.x, 24.x    |
| E2E         | 58    | ~5min    | Chromium, Firefox, WebKit, Mobile Chrome | 24.x          |

**Total Tests:** 319
**Total Coverage:** > 80%

---

## Required Secrets

| Secret          | Purpose            | Required For                  |
| --------------- | ------------------ | ----------------------------- |
| `CODECOV_TOKEN` | Coverage reporting | CI, PR Quality Gate           |
| `GITHUB_TOKEN`  | Actions API access | All workflows (auto-provided) |

---

## Branch Protection Recommended Settings

For `main` branch:

```yaml
Required Status Checks:
  - Test (20.x) / test
  - Test (24.x) / test
  - E2E / e2e (shard 1)
  - E2E / e2e (shard 2)
  - Security / security
  - PR Quality Gate / quality-checks
  - PR Quality Gate / test-coverage
  - CodeQL / analyze

Require branches to be up to date: true
Require pull request reviews: 1+
Dismiss stale reviews: true
Require review from code owners: true
Require signed commits: false (optional)
```

---

## Monitoring & Debugging

### View Workflow Runs

```
Repository → Actions → Select Workflow
```

### Download Artifacts

```
Workflow Run → Artifacts section → Download
```

### View Test Reports

```
Workflow Run → Summary → Test Results
```

### View Coverage

```
codecov.io/gh/sanmak/VaporScan
```

### Debug Failed Workflow

```bash
# For CI failures
gh run view <run-id> --log-failed

# Re-run failed jobs
gh run rerun <run-id> --failed
```

---

## Performance Metrics

### Typical Execution Times

| Job                       | Duration              | Parallelization     |
| ------------------------- | --------------------- | ------------------- |
| Lint + Format + TypeCheck | ~30s                  | Sequential          |
| Unit Tests                | ~10s per Node version | Matrix (2 parallel) |
| Integration Tests         | ~45s per Node version | Matrix (2 parallel) |
| E2E Tests                 | ~3-5min per shard     | Shards (2 parallel) |
| Security Scan             | ~1-2min               | Parallel with tests |
| Build                     | ~2min                 | After tests         |

**Total CI Time:** ~6-8 minutes (with parallelization)

---

## Optimization Tips

1. **Cache Dependencies**: Already enabled (`cache: 'npm'`)
2. **Parallel Jobs**: Test matrix + E2E shards
3. **Artifact Retention**: 5-30 days (configurable)
4. **Concurrency Groups**: Prevent duplicate runs
5. **Conditional Steps**: Skip unchanged code
6. **Fast Failures**: `fail-fast: false` for complete results

---

## Troubleshooting

### Flaky E2E Tests

- Check Playwright reports in artifacts
- Review screenshots/videos
- Run locally: `npm run test:e2e:debug`

### Coverage Upload Failures

- Verify `CODECOV_TOKEN` is set
- Check Codecov service status
- Review coverage generation logs

### Docker Build Failures

- Check Dockerfile syntax
- Verify all required files exist
- Review `.dockerignore`

### Workflow Not Triggering

- Check trigger conditions (branch, event type)
- Validate YAML syntax
- Review permissions

---

## Quick Commands

```bash
# Trigger workflow manually (if configured)
gh workflow run ci.yml

# List workflow runs
gh run list --workflow=ci.yml

# View run details
gh run view <run-id>

# Download all artifacts
gh run download <run-id>

# Cancel running workflow
gh run cancel <run-id>

# Re-run workflow
gh run rerun <run-id>

# Watch workflow progress
gh run watch <run-id>
```

---

**Last Updated:** 2025-12-29
**Maintained By:** VaporScan Team
