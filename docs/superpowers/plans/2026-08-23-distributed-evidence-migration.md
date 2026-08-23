# Distributed Evidence Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every Evidence Hub case into its owning project, preserve reciprocal navigation and legacy URLs, then delete the standalone Evidence repository and Cloudflare Pages project.

**Architecture:** Deployed applications own `/evidence/`; non-deployed skills and internal capabilities remain under `baby2b.online/evidence/:projectId`. `evidence.baby2b.online` becomes a redirect-only custom domain on `fullstack-showcase`. Asset hashes and source commit provenance travel with every migrated case.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Router/React Router, Cloudflare Pages, GitHub Actions, TC Flow.

**Spec:** `docs/superpowers/specs/2026-08-23-distributed-evidence-migration-design.md`

## Global Constraints

- Do not delete the source repository or Pages project until all migration and redirect Gates pass.
- Preserve `verified`, `implemented`, `pending`, and `unverified` meanings.
- Never publish credentials, private paths, internal endpoints, model weights, or personal data.
- Every Evidence page links to `https://baby2b.online/dashboard/`, its project home, and itself.
- Rendering labels must match actual SSG, Edge SSR, hydration, and CSR behavior.
- Validate 375, 390, 430, 1440, and 1920 widths and semantic page content.

---

### Task 1: Freeze Source Inventory

**Files:**
- Create in each target repository: `docs/evidence/migrations/2026-08-23-evidence-source.json`
- Source: `baby2b-online-deployment-evidence/public/cases/*/evidence.json`

**Interfaces:**
- Produces: source commit SHA, case slug, destination URL, asset file, byte count, SHA-256.

- [ ] Record `origin/main` SHA for the source repository.
- [ ] Export the six case manifests and every asset hash into target-specific inventories.
- [ ] Assert every source case and asset has exactly one destination.
- [ ] Commit inventories before changing rendered pages.

### Task 2: BabySteps Owns BabySteps and Static-First Evidence

**Files:**
- Modify: `web/src/pages/EvidencePage.tsx`
- Modify: `web/src/pages/EvidencePage.test.tsx`
- Modify: `web/src/components/CourseEvidenceFooter.tsx`
- Modify: `web/src/App.test.tsx`
- Copy: source case assets into `web/public/evidence/migrated/`

**Interfaces:**
- Produces: `https://babysteps.baby2b.online/evidence/` with both product and Static-First chapters.

- [ ] Add a failing test requiring Dashboard, project, and current-page navigation.
- [ ] Add failing assertions for migrated architecture/proof content and source provenance.
- [ ] Copy only hash-verified unique assets from `babysteps` and `static-first-delivery`.
- [ ] Render the migrated chapters in the existing BabySteps visual language.
- [ ] Run `pnpm --filter @babysteps/web test`, `typecheck`, and `build`.
- [ ] Commit the independently reviewable BabySteps migration.

### Task 3: Personal AI Agent Adds Project-Owned Evidence

**Files:**
- Create: `apps/portfolio/src/evidence-page.tsx`
- Create: `apps/portfolio/src/evidence-page.test.tsx`
- Modify: `apps/portfolio/src/app.tsx`
- Modify: `apps/portfolio/src/components/site-navigation.tsx`
- Modify: `apps/portfolio/src/components/navigation.test.tsx`
- Modify: `apps/portfolio/src/styles.css`
- Copy: source case assets into `apps/portfolio/public/evidence/migrated/`

**Interfaces:**
- Produces: static-first deep link `/evidence/` using the existing portfolio component tree.

- [ ] Add a failing route test for `/evidence/` and reciprocal navigation.
- [ ] Add failing assertions for training, frozen evaluation, GGUF delivery, limitations, architecture, and asset provenance.
- [ ] Implement pathname-based static routing without adding a second application shell.
- [ ] Render the 14 migrated assets with full-screen preview support.
- [ ] Run portfolio tests, typecheck, build, deep-link, and public-content checks.
- [ ] Commit the independently reviewable Personal AI migration.

### Task 4: Agent Market Navigation Contract

**Files:**
- Modify: `apps/web/src/components/Shell.tsx`
- Modify: `apps/web/src/components/Shell.test.tsx`
- Modify only if missing content: `apps/web/src/pages/EvidencePage.tsx`

**Interfaces:**
- Produces: `/evidence/` with canonical Dashboard return URL and project-local current-page link.

- [ ] Add a failing test requiring `https://baby2b.online/dashboard/`.
- [ ] Preserve the richer existing Agent Market Evidence; do not import duplicate central content.
- [ ] Run web tests, typecheck, build, built Worker route matrix, and public-content checks.
- [ ] Commit on a clean worktree based on `origin/main`; never modify the old dirty worktree.

### Task 5: Dashboard Owns Non-Deployed Evidence

**Files:**
- Modify: `apps/web/apps/web/src/data/portfolio-projects.ts`
- Modify: `apps/web/apps/web/src/features/portfolio/evidence-content.tsx`
- Modify: `apps/web/apps/web/src/features/portfolio/dashboard-content.tsx`
- Modify: `apps/web/apps/web/src/features/portfolio/__tests__/dashboard-project-links.test.tsx`
- Create: `apps/web/apps/web/src/data/migrated-evidence.ts`
- Copy: GitHub Profile Studio, Portfolio Sync, and TC Flow assets into `apps/web/apps/web/public/evidence/`
- Create: `apps/web/apps/web/public/_redirects`

**Interfaces:**
- Produces: Dashboard-owned internal Evidence pages and redirect rules for the legacy domain.

- [ ] Add failing tests proving the standalone Evidence Hub card is absent.
- [ ] Add failing tests proving every card links to a project-owned or Dashboard-owned Evidence URL.
- [ ] Add failing tests for internal migrated sections, asset hashes, full-screen preview, and reciprocal navigation.
- [ ] Import the three non-deployed cases into typed local data and render them through `EvidenceContent`.
- [ ] Add permanent legacy redirect mappings without redirect loops.
- [ ] Run full Dashboard tests, typecheck, client/SSR build, prerender, NUL scan, deep-link and 404 checks.
- [ ] Commit the Dashboard migration.

### Task 6: Preview and Production Rollout

**Files:**
- Update per repository: `.github/baby2b-publish.yml` Evidence URL.
- Record per repository: `docs/evidence/migrations/2026-08-23-production-readback.json`.

**Interfaces:**
- Consumes: Tasks 2-5 passing commits.
- Produces: merged production sites and verified reciprocal link matrix.

- [ ] Push one PR per changed repository and require repository policy, tests, build, and Cloudflare Preview.
- [ ] Validate each Preview by HTTP status, final URL, title, canonical content, links, asset loads, and responsive layout.
- [ ] Merge in order: project sites, Dashboard, then custom-domain redirect migration.
- [ ] Verify production sites and save sanitized readback evidence.

### Task 7: Transfer Legacy Domain and Delete Source Project

**Files/Resources:**
- Cloudflare custom domain: `evidence.baby2b.online`
- Cloudflare Pages project: `baby2b-evidence`
- GitHub repository: `Tiancheng-Xu/baby2b-online-deployment-evidence`
- Local repository and worktrees under the Evidence repository root.

**Interfaces:**
- Consumes: complete production and redirect Gate from Task 6.
- Produces: no standalone Evidence project, while legacy URLs remain valid redirects.

- [ ] Detach the custom domain from `baby2b-evidence` and attach it to `fullstack-showcase`.
- [ ] Verify all legacy paths return 301/308 to semantically correct destination pages.
- [ ] Confirm the six-case and asset migration inventory has no missing destination.
- [ ] Delete the Cloudflare `baby2b-evidence` Pages project.
- [ ] Delete the GitHub `baby2b-online-deployment-evidence` repository.
- [ ] Remove all local Evidence worktrees and the local repository directory.
- [ ] Run final Dashboard/project/legacy-domain public readback and write TC Flow RunResult.
