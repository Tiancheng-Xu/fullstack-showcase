# Stitch Parent UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Directly refresh the existing V1 parent-facing H5 so its routes, content, imagery, and interactions match the latest Stitch snapshot.

**Architecture:** Keep the existing React/TanStack Router/Tailwind application. Add route-aware app chrome, one shared typed Mock dataset, focused content components for each Stitch flow, and local public assets. Each task follows RED-GREEN-REFACTOR and leaves the application buildable.

**Tech Stack:** React 19, TypeScript, TanStack Router, Tailwind CSS 4, Vitest, Testing Library, Lucide.

## Global Constraints

- Only parent-facing product UI is implemented; `/labs/*` is untouched.
- Existing V1 files are updated in place; no V2 copy is created.
- Stitch project `1860491822987812698` at `2026-07-31T05:52:49.662094Z` is the visual source.
- Demo baby is “金金”, born `2026-01-16`.
- This Feature uses local Mock state and does not add backend or database code.
- Product code must not depend on Stitch or Googleusercontent remote URLs.
- Every behavior change starts with a failing test.

---

### Task 1: Shared Stitch Foundation

**Files:**
- Create: `apps/web/apps/web/src/features/nurture/stitch-assets.ts`
- Create: `apps/web/apps/web/src/components/layout/__tests__/app-shell.test.tsx`
- Modify: `apps/web/apps/web/src/features/nurture/data.ts`
- Modify: `apps/web/apps/web/src/features/nurture/types.ts`
- Modify: `apps/web/apps/web/src/components/layout/app-shell.tsx`
- Modify: `apps/web/apps/web/src/components/layout/top-bar.tsx`
- Modify: `apps/web/apps/web/src/components/layout/bottom-nav.tsx`
- Modify: `apps/web/packages/ui/src/styles/globals.css`
- Create: `apps/web/apps/web/public/assets/nurture-bloom/stitch/*.jpg`

**Interfaces:**
- Produces: `babyProfile`, `growthRecords`, `vaccines`, `moments`, `guideItems`, `STITCH_ASSETS`.
- Produces: `AppShell` with route-derived Auth/App chrome.

- [ ] Write an AppShell test asserting Auth mode hides “主要导航” and App mode shows it.
- [ ] Run `pnpm --dir apps/web/apps/web test src/components/layout/__tests__/app-shell.test.tsx` and verify the new Auth assertion fails.
- [ ] Copy the 14 named assets from `design/stitch/.../assets` and add `STITCH_ASSETS` constants.
- [ ] Replace per-page baby names with typed shared Mock data and update AppShell/TopBar/BottomNav.
- [ ] Run the focused test and existing component tests; verify they pass.
- [ ] Run `pnpm typecheck`.
- [ ] Commit `feat(ui): sync Stitch shell and parent mock data`.

### Task 2: Authentication and Onboarding

**Files:**
- Create: `apps/web/apps/web/src/features/nurture/auth-pages.tsx`
- Create: `apps/web/apps/web/src/features/nurture/__tests__/auth-pages.test.tsx`
- Create: `apps/web/apps/web/src/routes/login.tsx`
- Create: `apps/web/apps/web/src/routes/register.tsx`
- Create: `apps/web/apps/web/src/routes/onboarding.tsx`
- Modify: `apps/web/apps/web/src/routes/index.tsx`

**Interfaces:**
- Produces: `LoginContent`, `RegisterContent`, `OnboardingContent`.
- Consumes: `STITCH_ASSETS.registerSprout`, `STITCH_ASSETS.onboardingBaby`.

- [ ] Write tests that require labelled email/password fields, reject mismatched confirmation, and call the supplied success callback with valid input.
- [ ] Run the focused test and verify failure because the content components do not exist.
- [ ] Implement shared field/button styles and the three forms with inline errors and submitting state.
- [ ] Add TanStack routes: login → growth, register → onboarding, onboarding → growth.
- [ ] Run focused tests and verify pass.
- [ ] Run all tests and typecheck.
- [ ] Commit `feat(ui): add parent authentication and onboarding screens`.

### Task 3: Growth, Records, and Vaccines

**Files:**
- Create: `apps/web/apps/web/src/features/nurture/growth-records-content.tsx`
- Create: `apps/web/apps/web/src/features/nurture/vaccine-content.tsx`
- Create: `apps/web/apps/web/src/routes/growth.records.tsx`
- Create: `apps/web/apps/web/src/routes/vaccines.tsx`
- Modify: `apps/web/apps/web/src/features/nurture/growth-content.tsx`
- Modify: `apps/web/apps/web/src/features/nurture/__tests__/local-interactions.test.tsx`

**Interfaces:**
- Produces: `GrowthRecordsContent`, `VaccineContent`.
- Consumes: `babyProfile`, `growthRecords`, `vaccines`.

- [ ] Add failing tests for “金金”, record type selection, record filtering, delete confirmation, and persisted-in-component vaccine reminder state.
- [ ] Run the focused interaction test and verify expected failures.
- [ ] Refactor GrowthContent to match G-01/G-04 and link to records/vaccines.
- [ ] Implement G-08/G-11 record list and V-01 vaccine page.
- [ ] Run focused tests and verify pass.
- [ ] Run all tests and typecheck.
- [ ] Commit `feat(ui): refresh growth records and vaccine flows`.

### Task 4: Moments Gallery and Detail

**Files:**
- Create: `apps/web/apps/web/src/features/nurture/moment-detail-content.tsx`
- Create: `apps/web/apps/web/src/routes/moments.$momentId.tsx`
- Modify: `apps/web/apps/web/src/features/nurture/moments-content.tsx`
- Modify: `apps/web/apps/web/src/features/nurture/__tests__/local-interactions.test.tsx`

**Interfaces:**
- Produces: `MomentDetailContent({ momentId })`.
- Consumes: `moments` with local image paths.

- [ ] Add failing tests for local image rendering, favorite toggling, and detail lookup.
- [ ] Run the focused test and verify expected failure.
- [ ] Rebuild the gallery from M-01 and detail from M-06 using local assets.
- [ ] Add the detail route and accessible back/favorite controls.
- [ ] Run focused and full tests.
- [ ] Commit `feat(ui): match Stitch moments gallery and detail`.

### Task 5: Guide and Article Detail

**Files:**
- Create: `apps/web/apps/web/src/features/nurture/article-detail-content.tsx`
- Create: `apps/web/apps/web/src/routes/guide.$articleId.tsx`
- Modify: `apps/web/apps/web/src/features/nurture/guide-content.tsx`
- Modify: `apps/web/apps/web/src/features/nurture/__tests__/local-interactions.test.tsx`

**Interfaces:**
- Produces: `ArticleDetailContent({ articleId })`.
- Consumes: typed `guideItems` with source, reviewed date, disclaimer, and image.

- [ ] Add failing tests for combined search/category filtering and article source/disclaimer output.
- [ ] Run the focused test and verify expected failure.
- [ ] Match K-01 card hierarchy and add links to K-04.
- [ ] Implement article detail with local image, source, reviewed date, reading sections, and disclaimer.
- [ ] Run focused and full tests.
- [ ] Commit `feat(ui): match Stitch guide and article detail`.

### Task 6: Profile, Baby Editing, and Logout

**Files:**
- Create: `apps/web/apps/web/src/features/nurture/edit-baby-content.tsx`
- Create: `apps/web/apps/web/src/routes/me.baby.tsx`
- Modify: `apps/web/apps/web/src/features/nurture/profile-content.tsx`
- Modify: `apps/web/apps/web/src/features/nurture/__tests__/local-interactions.test.tsx`

**Interfaces:**
- Produces: `EditBabyContent({ initialProfile, onSave })`.
- Consumes: `babyProfile` and local profile assets.

- [ ] Add failing tests that prove cloud membership copy is absent, reminders toggle, logout confirmation opens, and baby edits invoke `onSave`.
- [ ] Run the focused test and verify expected failure.
- [ ] Rebuild P-01/P-02/P-06, removing paid cloud/member promises.
- [ ] Add edit route and accessible logout Modal.
- [ ] Run focused and full tests.
- [ ] Commit `feat(ui): refresh profile editing and logout flow`.

### Task 7: Responsive and Delivery QA

**Files:**
- Create: `docs/qa/stitch-parent-ui-refresh/README.md`
- Create: `docs/qa/stitch-parent-ui-refresh/screenshots/*.png`
- Modify only when a failing regression requires it: files already listed in Tasks 1–6.

**Interfaces:**
- Consumes: all routes and test commands from Tasks 1–6.
- Produces: screenshot and command evidence for TC Flow N6.

- [ ] Run `pnpm test`, `pnpm typecheck`, and `pnpm build`; capture exact exit codes.
- [ ] Start the local app and capture 390px screenshots for login, growth, records, moments, guide, and profile.
- [ ] Inspect 320px, 390px, 430px, 768px, and 1280px for horizontal overflow and navigation overlap.
- [ ] If a defect appears, add a failing regression test or reproducible CSS assertion before changing production code.
- [ ] Re-run all checks after fixes.
- [ ] Record Stitch Screen IDs, screenshot paths, known differences, and final results in the QA README.
- [ ] Commit `test(ui): add Stitch parent flow QA evidence`.

## Self-Review

- Spec coverage: all 17 mapped Stitch screens are either implemented directly or represented by a connected state in Tasks 2–6.
- Placeholder scan: no implementation step relies on an unspecified future decision.
- Type consistency: all pages consume the shared `babyProfile`, `growthRecords`, `vaccines`, `moments`, `guideItems`, and `STITCH_ASSETS` interfaces established in Task 1.
