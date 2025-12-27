# CI/CD and Automation for AI Agent Friendliness

**Date:** 2025-12-27  
**Category:** CI/CD  
**Priority:** MEDIUM  
**Effort:** Low-Medium  

---

## Executive Summary

Robust CI/CD pipelines enable AI coding agents to make changes with confidence. This document outlines best practices for GitHub Actions, automated testing, and deployment automation.

---

## Current State Assessment

### ✅ Good CI/CD Setup

1. **GitHub Actions** - CI workflow exists
2. **Automated Testing** - Tests run on every PR
3. **Lint Checking** - ESLint runs in CI
4. **Build Verification** - TypeScript + Vite build
5. **GitHub Pages Deployment** - Automatic deploy

### ⚠️ Enhancement Opportunities

1. **Coverage Reporting** - Not in CI
2. **Performance Testing** - Not automated
3. **Visual Regression** - Not implemented
4. **Security Scanning** - Not enabled
5. **Dependabot** - Configured but could be enhanced

---

## Recommendations for AI Coding Agents

### 1. Enhanced CI Workflow

**Recommendation:** Expand CI with coverage and caching.

**Current: .github/workflows/ci.yml**
```yaml
name: CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**Enhanced Version:**
```yaml
name: CI

on:
  push:
    branches: ["main"]
    paths-ignore:
      - "**/*.md"
      - "docs/**"
  pull_request:
    branches: ["main"]
    paths-ignore:
      - "**/*.md"
      - "docs/**"

permissions:
  contents: read
  pull-requests: write

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests with coverage
        run: npm run test -- --coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  # Coverage comment on PR
  coverage-report:
    needs: lint-and-test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Download coverage
        uses: actions/download-artifact@v4
        with:
          name: coverage-report
          path: coverage/

      - name: Coverage Summary
        uses: davelosert/vitest-coverage-report-action@v2
        with:
          json-summary-path: coverage/coverage-summary.json
```

**Why Agent-Friendly:**
- Coverage visible in PRs
- Artifacts preserved for debugging
- Clear job organization

**Action Items:**
- [ ] Add coverage reporting
- [ ] Upload build artifacts
- [ ] Add coverage PR comments

---

### 2. Pre-commit Hooks

**Recommendation:** Add local pre-commit checks.

**Setup with Husky:**
```bash
npm install -D husky lint-staged
npx husky init
```

**.husky/pre-commit:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**package.json additions:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

**Why Agent-Friendly:**
- Catches issues before commit
- Consistent formatting
- Faster feedback loop

**Action Items:**
- [ ] Install husky and lint-staged
- [ ] Configure pre-commit hook
- [ ] Add to package.json

---

### 3. Automated Dependency Updates

**Recommendation:** Enhance Dependabot configuration.

**Current: .github/dependabot.yml** (already good)
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    groups:
      minor-and-patch:
        patterns:
          - "*"
        update-types:
          - "minor"
          - "patch"
```

**Enhancement - Auto-merge safe updates:**
```yaml
# .github/workflows/dependabot-auto-merge.yml
name: Dependabot Auto-merge

on:
  pull_request:
    types: [labeled, unlabeled, synchronize, opened, edited, reopened]

permissions:
  contents: write
  pull-requests: write

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Auto-merge patch updates
        if: steps.metadata.outputs.update-type == 'version-update:semver-patch'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Why Agent-Friendly:**
- Keeps dependencies current
- Reduces manual work
- Safe updates auto-merged

**Action Items:**
- [ ] Add auto-merge workflow
- [ ] Test with patch updates
- [ ] Document update process

---

### 4. Security Scanning

**Recommendation:** Add security scanning to CI.

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

permissions:
  security-events: write

jobs:
  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "20"
      - run: npm ci
      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

  codeql:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: typescript
      
      - name: Build
        run: |
          npm ci
          npm run build
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

**Why Agent-Friendly:**
- Catches security issues early
- Automated weekly scans
- Results in Security tab

**Action Items:**
- [ ] Add security workflow
- [ ] Enable Dependabot security updates
- [ ] Review and fix alerts

---

### 5. Performance Testing in CI

**Recommendation:** Add basic performance benchmarks.

```yaml
# .github/workflows/performance.yml
name: Performance Check

on:
  pull_request:
    branches: ["main"]
    paths:
      - "src/systems/**"
      - "src/ecs/**"
      - "src/rendering/**"

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - name: Run performance benchmarks
        run: npm run test:performance

      - name: Upload benchmark results
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-results
          path: benchmark-results.json

      - name: Compare with baseline
        run: |
          # Compare current results with baseline
          node scripts/compare-benchmarks.js
```

**Benchmark test example:**
```typescript
// src/__tests__/performance/entityCreation.perf.ts
import { describe, it, expect } from 'vitest';
import { createGameWorld, createEnemy } from '../../ecs';

describe('Performance: Entity Creation', () => {
    it('should create 1000 entities in under 100ms', () => {
        const world = createGameWorld();
        
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            createEnemy(world, 1, Math.random() * 1920, Math.random() * 1080);
        }
        const elapsed = performance.now() - start;
        
        expect(elapsed).toBeLessThan(100);
    });
});
```

**Why Agent-Friendly:**
- Catches performance regressions
- Benchmarks are repeatable
- Results tracked over time

**Action Items:**
- [ ] Create performance test suite
- [ ] Add performance workflow
- [ ] Establish baselines

---

### 6. Deployment Workflow Enhancement

**Recommendation:** Improve deployment workflow.

**Current deploy-pages.yml is good, enhance with:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
    paths-ignore:
      - "docs/**"
      - "**/*.md"
      - ".github/**"
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

      - name: Deployment notification
        run: echo "Deployed to ${{ steps.deployment.outputs.page_url }}"
```

**Why Agent-Friendly:**
- Clear deployment pipeline
- Tests must pass before deploy
- Production build flags

**Action Items:**
- [ ] Ensure tests run before deploy
- [ ] Add production environment
- [ ] Add deployment notifications

---

### 7. Branch Protection Rules

**Recommendation:** Configure branch protection for main.

**GitHub Settings → Branches → Branch protection rules:**
```
Branch name pattern: main

☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed
  
☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Status checks: lint-and-test
  
☑ Require conversation resolution before merging

☑ Do not allow bypassing the above settings
```

**Why Agent-Friendly:**
- Prevents accidental main pushes
- CI must pass before merge
- Code review required

**Action Items:**
- [ ] Enable branch protection
- [ ] Configure required checks
- [ ] Document merge requirements

---

### 8. Workflow Documentation

**Recommendation:** Document all workflows.

**Create: .github/WORKFLOWS.md**
```markdown
# GitHub Workflows

## CI (ci.yml)

**Trigger:** Push or PR to main
**Purpose:** Validate code quality and tests

Steps:
1. Checkout code
2. Install dependencies
3. Run ESLint
4. Run Vitest tests
5. Build TypeScript + Vite

**Required to pass:** Yes (branch protection)

## Deploy Pages (deploy-pages.yml)

**Trigger:** Push to main
**Purpose:** Deploy game to GitHub Pages

Steps:
1. Build production bundle
2. Deploy to pages

**URL:** https://chayuto.github.io/kobayashi-maru/

## Dependabot

**Trigger:** Weekly (Monday)
**Purpose:** Keep dependencies updated

Configuration:
- Groups minor/patch updates
- Opens max 10 PRs
- Labels: dependencies

## Adding New Workflows

1. Create `.github/workflows/name.yml`
2. Define triggers (on)
3. Add jobs and steps
4. Update this documentation
```

**Why Agent-Friendly:**
- Workflows are documented
- Purpose is clear
- Adding new workflows is guided

**Action Items:**
- [ ] Create WORKFLOWS.md
- [ ] Document all workflows
- [ ] Keep updated

---

## Implementation Checklist

### Phase 1: CI Enhancement (1-2 hours)
- [ ] Add coverage reporting
- [ ] Upload artifacts
- [ ] Add PR coverage comments

### Phase 2: Pre-commit (1 hour)
- [ ] Install husky
- [ ] Configure lint-staged
- [ ] Test locally

### Phase 3: Security (1 hour)
- [ ] Add CodeQL workflow
- [ ] Configure npm audit
- [ ] Review initial alerts

### Phase 4: Documentation (1 hour)
- [ ] Create WORKFLOWS.md
- [ ] Configure branch protection
- [ ] Document merge process

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| CI run time | ~2 min | <3 min |
| Coverage in CI | No | Yes |
| Security scanning | No | Weekly |
| Pre-commit hooks | No | Yes |
| Branch protection | Partial | Full |

---

## References

- `.github/workflows/ci.yml` - Current CI
- `.github/workflows/deploy-pages.yml` - Deployment
- `.github/dependabot.yml` - Dependency updates

---

*This document is part of the Kobayashi Maru maintainability initiative.*
