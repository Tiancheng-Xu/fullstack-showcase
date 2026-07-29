# Nurture & Bloom UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, interactive Nurture & Bloom frontend demo from the Stitch export inside `apps/web`, with reusable Tailwind components and local typed data.

**Architecture:** Better-T-Stack scaffolds an isolated React + TanStack Router application under `apps/web`. Route components compose reusable domain/UI components, while typed demo data lives behind a small local data boundary so later Hono/Drizzle work can replace it without rewriting the UI. CSS variables and Tailwind theme utilities provide the single source of truth for visual tokens.

**Tech Stack:** Better-T-Stack CLI, React, TypeScript, TanStack Router, Vite, Tailwind CSS, Vitest, Testing Library, pnpm.

## Global Constraints

- First phase is a frontend demo only: no authentication, database, remote API, upload, or production deployment.
- Use `/Users/shier/Downloads/stitch_.zip` as the visual and asset source.
- Preserve the four routes: growth, moments, guide, and me.
- All colors, typography, radii, spacing, shadows, motion, and safe-area rules must be centralized in global CSS/Tailwind tokens.
- Components consume typed props and must not import demo data directly.
- Use local, non-sensitive demonstration content only.
- Mobile-first at 390px; desktop content remains centered and readable.
- No GitHub push or production deployment in this phase.

---

### Task 1: Scaffold the Better-T-Stack Web Application

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `apps/web/**` from Better-T-Stack
- Modify: `.gitignore`
- Create: `apps/web/src/test/setup.ts`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Consumes: the existing repository root and the Better-T-Stack CLI schema.
- Produces: a pnpm workspace with `pnpm dev`, `pnpm test`, `pnpm typecheck`, and `pnpm build` commands; a TanStack Router web app at `apps/web`.

- [ ] **Step 1: Inspect the current Better-T-Stack input schema and validate the planned scaffold without writing files**

Run:

```bash
npx -y create-better-t-stack@latest schema --name createInput
npx -y create-better-t-stack@latest create-json --input '{"projectName":"web","frontend":["tanstack-router"],"backend":"none","runtime":"none","database":"none","orm":"none","api":"none","auth":"none","payments":"none","addons":["biome"],"examples":[],"dbSetup":"none","webDeploy":"none","serverDeploy":"none","git":false,"packageManager":"pnpm","install":false,"yes":true,"dryRun":true}'
```

Expected: the CLI reports a valid React/TanStack Router frontend-only plan and does not write `apps/web`.

- [ ] **Step 2: Scaffold the application inside `apps/` and install dependencies**

Run from `apps/` after removing only the obsolete placeholder `apps/README.md` from the worktree:

```bash
npx -y create-better-t-stack@latest create-json --input '{"projectName":"web","frontend":["tanstack-router"],"backend":"none","runtime":"none","database":"none","orm":"none","api":"none","auth":"none","payments":"none","addons":["biome"],"examples":[],"dbSetup":"none","webDeploy":"none","serverDeploy":"none","git":false,"packageManager":"pnpm","install":false,"yes":true}'
pnpm install
```

Expected: `apps/web` contains the generated project and `bts.jsonc`; installation succeeds without creating a nested Git repository.

- [ ] **Step 3: Add root workspace commands and the test harness**

Create root scripts with this contract:

```json
{
  "scripts": {
    "dev": "pnpm --filter web dev",
    "test": "pnpm --filter web test",
    "typecheck": "pnpm --filter web typecheck",
    "build": "pnpm --filter web build"
  }
}
```

Add Vitest, jsdom, Testing Library, and `@testing-library/jest-dom`; configure `vite.config.ts` with `test.environment = "jsdom"` and `setupFiles = ["./src/test/setup.ts"]`.

- [ ] **Step 4: Write and run the first route smoke test**

Create `apps/web/src/test/app-smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function Smoke() {
  return <main>育爱成长</main>;
}

describe("web scaffold", () => {
  it("renders Chinese application copy", () => {
    render(<Smoke />);
    expect(screen.getByText("育爱成长")).toBeInTheDocument();
  });
});
```

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: all three commands pass.

- [ ] **Step 5: Commit Task 1**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore apps/web
git commit -m "chore: scaffold nurture bloom web app"
```

---

### Task 2: Establish Global Tokens and Reusable UI Components

**Files:**
- Modify: `apps/web/src/styles.css`
- Create: `apps/web/src/lib/cn.ts`
- Create: `apps/web/src/components/layout/app-shell.tsx`
- Create: `apps/web/src/components/layout/top-bar.tsx`
- Create: `apps/web/src/components/layout/bottom-nav.tsx`
- Create: `apps/web/src/components/ui/section-header.tsx`
- Create: `apps/web/src/components/ui/status-chip.tsx`
- Create: `apps/web/src/components/ui/floating-action-button.tsx`
- Create: `apps/web/src/components/ui/modal.tsx`
- Create: `apps/web/src/components/ui/__tests__/components.test.tsx`
- Create binary assets: `apps/web/public/assets/nurture-bloom/*`

**Interfaces:**
- Consumes: TanStack Router `Link`, Stitch `DESIGN.md`, and local public assets.
- Produces: `AppShell({ children })`, `TopBar()`, `BottomNav()`, `SectionHeader({ title, actionLabel, onAction })`, `StatusChip({ tone, children })`, `FloatingActionButton({ label, onClick })`, and `Modal({ open, title, children, onClose })`.

- [ ] **Step 1: Write component behavior tests before implementation**

Create tests that verify:

```tsx
render(<SectionHeader title="里程碑" actionLabel="查看全部" onAction={onAction} />);
await user.click(screen.getByRole("button", { name: "查看全部" }));
expect(onAction).toHaveBeenCalledOnce();

render(<Modal open title="新增记录" onClose={onClose}>表单内容</Modal>);
expect(screen.getByRole("dialog", { name: "新增记录" })).toBeVisible();
await user.click(screen.getByRole("button", { name: "关闭" }));
expect(onClose).toHaveBeenCalledOnce();
```

Run `pnpm test` and expect failure because the components do not exist.

- [ ] **Step 2: Extract local assets from the Stitch archive**

Extract the Nurture & Bloom logo and warm mother/baby illustration into `apps/web/public/assets/nurture-bloom/` with stable names `logo.png` and `hero.png`. Do not retain external Googleusercontent URLs.

- [ ] **Step 3: Implement the global design tokens**

Define semantic CSS variables for `--surface`, `--surface-container`, `--primary`, `--secondary`, `--tertiary`, `--error`, foreground variants, radii, shadows, spacing, and safe-area padding. Import Quicksand with a system Chinese fallback and include accessible `:focus-visible`, reduced-motion, scrollbar, and body defaults.

- [ ] **Step 4: Implement reusable layout and UI primitives**

Keep each file focused on one component. All buttons must have visible hover/focus/disabled states, `Modal` must use `role="dialog"`, and bottom navigation labels must remain visible at 390px.

- [ ] **Step 5: Run tests and commit Task 2**

```bash
pnpm test
pnpm typecheck
git add apps/web/src/styles.css apps/web/src/lib apps/web/src/components apps/web/public/assets
git commit -m "feat: add nurture bloom design system"
```

Expected: component tests and typecheck pass.

---

### Task 3: Build Four Routes with Typed Demo Data and Interactions

**Files:**
- Create: `apps/web/src/data/demo.ts`
- Create: `apps/web/src/types/domain.ts`
- Create: `apps/web/src/features/growth/baby-profile-card.tsx`
- Create: `apps/web/src/features/growth/metric-card.tsx`
- Create: `apps/web/src/features/growth/milestone-card.tsx`
- Create: `apps/web/src/features/growth/next-action-card.tsx`
- Create: `apps/web/src/features/growth/record-item.tsx`
- Create: `apps/web/src/routes/index.tsx`
- Create or modify: `apps/web/src/routes/growth.tsx`
- Create: `apps/web/src/routes/moments.tsx`
- Create: `apps/web/src/routes/guide.tsx`
- Create: `apps/web/src/routes/me.tsx`
- Create: `apps/web/src/features/growth/__tests__/growth-page.test.tsx`
- Create: `apps/web/src/features/guide/__tests__/guide-filter.test.tsx`

**Interfaces:**
- Consumes: Task 2 components and `demoBaby`, `demoMetrics`, `demoMilestones`, `demoRecords`, `demoMoments`, `demoArticles`.
- Produces: four navigable route modules, `GrowthPage`, and a reusable typed domain model: `Baby`, `GrowthMetric`, `Milestone`, `CareRecord`, `Moment`, and `GuideArticle`.

- [ ] **Step 1: Define typed data contracts and write failing route tests**

The domain contract must include:

```ts
export type GrowthMetric = {
  id: string;
  label: string;
  value: number;
  unit: "cm" | "kg";
  status: "normal" | "attention";
};

export type GuideArticle = {
  id: string;
  title: string;
  category: "喂养" | "护理" | "疫苗" | "早教";
  summary: string;
};
```

Tests must assert that the growth page renders baby name `糯米`, metrics `68 cm` and `8.5 kg`, and that filtering articles by `疫苗` hides non-matching articles.

- [ ] **Step 2: Implement typed local demo data**

Store demo content only in `src/data/demo.ts`; components receive props and never import the data file. Add a medical disclaimer to guide content: `内容仅供育儿科普参考，不能替代医生诊断。`

- [ ] **Step 3: Implement the growth route and domain cards**

Recreate the Stitch composition: profile card, two-column metrics, horizontal milestone cards, vaccine reminder, today records, and a floating add-record action. The action opens the Task 2 modal and lets the user select a local record type; confirmation shows visible success feedback without persisting personal data.

- [ ] **Step 4: Implement moments, guide, and me routes**

Moments renders a local timeline and an empty-state-safe layout. Guide provides a text search and category filter. Me renders profile summary, settings rows, and the explicit label `后续课程：认证、API 与数据库` for deferred features.

- [ ] **Step 5: Generate the TanStack route tree and run route tests**

Run the scaffold's route-generation command if it is separate from `dev`, then:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: navigation modules compile, interaction tests pass, and production build succeeds.

- [ ] **Step 6: Commit Task 3**

```bash
git add apps/web/src/data apps/web/src/types apps/web/src/features apps/web/src/routes apps/web/src/routeTree.gen.ts
git commit -m "feat: build nurture bloom demo routes"
```

---

### Task 4: Visual QA, Accessibility, and Learning Handoff

**Files:**
- Create: `apps/web/e2e/mobile.spec.ts`
- Modify: `apps/web/package.json`
- Create: `docs/nurture-bloom-ui-milestone.md`
- Modify: `HOMEWORKS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the complete `apps/web` application.
- Produces: automated 390px navigation checks, verified screenshots, reproducible commands, and a course-ready handoff describing deferred backend milestones.

- [ ] **Step 1: Add a mobile-browser smoke test**

Use Playwright with viewport `{ width: 390, height: 844 }`. Verify:

```ts
await expect(page.getByRole("heading", { name: "早安，宝贝的小世界" })).toBeVisible();
await page.getByRole("link", { name: "时光" }).click();
await expect(page).toHaveURL(/moments/);
await page.getByRole("link", { name: "百科" }).click();
await expect(page.getByText("内容仅供育儿科普参考，不能替代医生诊断。")).toBeVisible();
```

- [ ] **Step 2: Run the app and compare key screens with Stitch references**

Capture growth, moments, guide, and me at 390×844. Check typography hierarchy, token consistency, bottom-navigation clearance, no horizontal overflow, focus states, and readable desktop centering. Fix only discrepancies inside the approved UI scope.

- [ ] **Step 3: Run full verification**

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm --filter web e2e
```

Expected: every command exits with code 0.

- [ ] **Step 4: Document the completed learning milestone**

Document the stack, folder map, run commands, reusable component boundaries, Stitch token mapping, test evidence, known limitations, and deferred sequence: Hono API → Drizzle → Better Auth → GitHub API → AWS SAM.

- [ ] **Step 5: Commit Task 4**

```bash
git add apps/web/e2e apps/web/package.json README.md HOMEWORKS.md docs/nurture-bloom-ui-milestone.md
git commit -m "test: verify nurture bloom ui milestone"
```

---

## Plan Self-Review

- Spec coverage: scaffold, four routes, tokens, components, local assets, typed data, interactions, empty/error-safe states, mobile QA, tests, build, and learning handoff are covered.
- Deferred work remains explicit: Hono, Drizzle, Better Auth, GitHub API, AWS SAM, cloud storage, and production deployment.
- Type consistency: route data uses the domain types defined in Task 3; UI primitives are produced in Task 2 before route consumption.
- Scope safety: no task sends secrets, uses real family/medical data, deploys production, or pushes GitHub.
