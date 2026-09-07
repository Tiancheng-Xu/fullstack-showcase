# Dashboard Best of JS and DESIGN.md Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formalize the approved Dashboard visual system and introduce one bounded Best of JS library for useful, accessible navigation feedback.

**Architecture:** Keep portfolio data, SSR fallback, Evidence contracts, and performance control unchanged. Add a route-local Motion component for scroll progress and centralize the existing torn-glass visual language through root design documentation and semantic CSS tokens.

**Tech Stack:** React 19, TypeScript, TanStack Router, Tailwind CSS 4, Motion, Vitest.

**Spec:** `DESIGN.md` and `docs/design/torn-glass-project-direction.md`

## Global Constraints

- Preserve SSR and hydrated project count, status, and links.
- Do not introduce TanStack Query, Fuse, or TanStack Table without a real feature contract.
- Keep root horizontal overflow at zero at 375, 390, 430, and 1440 pixels.
- Respect `prefers-reduced-motion` and preserve no-JavaScript readability.
- Do not publish before the user reviews the local visual result.

---

### Task 1: Record the design and dependency decision

**Files:**
- Create: `DESIGN.md`
- Create: `docs/superpowers/plans/2026-09-01-dashboard-bestofjs-designmd.md`
- Modify: `apps/web/apps/web/package.json`
- Modify: `apps/web/pnpm-lock.yaml`

**Interfaces:**
- Produces: semantic visual tokens and the `motion/react` dependency.

- [ ] Record the complete Dashboard visual contract.
- [ ] Add `motion` through pnpm so the lockfile remains canonical.
- [ ] Keep Query, Fuse, and Table explicitly rejected for the current scope.

### Task 2: Add route-local reading progress

**Files:**
- Create: `apps/web/apps/web/src/features/portfolio/dashboard-scroll-progress.tsx`
- Create: `apps/web/apps/web/src/features/portfolio/__tests__/dashboard-scroll-progress.test.tsx`
- Modify: `apps/web/apps/web/src/features/portfolio/dashboard-content.tsx`

**Interfaces:**
- Produces: `DashboardScrollProgress(): JSX.Element`.
- Consumes: Motion `useScroll`, `LazyMotion`, and `domAnimation`.

- [ ] Render a fixed, noninteractive progress line driven by document scroll.
- [ ] Hide it when reduced motion is requested.
- [ ] Mount it inside the Dashboard surface without changing SSR project content.
- [ ] Assert the component's semantic marker and reduced-motion CSS contract.

### Task 3: Centralize the full-site material hierarchy

**Files:**
- Modify: `apps/web/apps/web/src/index.css`

**Interfaces:**
- Produces: portfolio color, material, motion, focus, and responsive tokens.

- [ ] Add tokens scoped to `.portfolio-surface`.
- [ ] Apply the shared hierarchy to header, Hero, project cards, resume, performance, Evidence, footer, and mobile navigation.
- [ ] Preserve background continuity and fallback readability.
- [ ] Add reduced-motion and no-backdrop-filter behavior.

### Task 4: Verify locally before publication

**Files:**
- Test: existing portfolio and performance tests.
- Evidence: repository visual-regression output.

**Interfaces:**
- Consumes: the completed Dashboard route and deterministic fixture state.
- Produces: local screenshots and a before/after performance record.

- [ ] Run focused Vitest tests, type checking, and production build.
- [ ] Run SSR and unknown-route semantic checks.
- [ ] Run BackstopJS/equivalent scenarios at 375, 390, 430, and 1440.
- [ ] Record cold-load and representative-interaction performance under comparable conditions.
- [ ] Present the local URL and reviewed screenshots to the user before any push or production deployment.
