# Public Pages Product Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove learning-assignment identity language from every user-visible online page while preserving internal learning records and existing application behavior.

**Architecture:** Treat this as a repository-wide presentation-boundary change. The inventory found two online frontend builds: `apps/web` and `homeworks/06-web3-dapp/web`. Their components receive product-language copy updates; GitHub Profile moves to a product route with a compatibility redirect; tests assert rendered DOM and public links rather than renaming internal packages, folders, or documentation.

**Tech Stack:** React 19, TypeScript, TanStack Router, Vitest, Testing Library, Vite, Biome

## Global Constraints

- All browser-visible page elements and public navigation links in every `course-homework` frontend build are productized.
- `HOMEWORKS.md`, `docs/qa`, `docs/superpowers`, `homeworks/`, package names, imports, component names, and CSS class names retain their learning-oriented internal identity.
- Rendered project identity must not use `作业`, `课程`, `老师`, `验收`, `原始作业能力`, or `课程实验`.
- Sepolia, testnet, prototype, public-chain, privacy, test-wallet, non-financial, and non-redeemable disclosures remain visible and accurate.
- `/projects/github-profile` becomes the canonical route; `/homework/github-profile` redirects to it with replace semantics.
- No API, database, Solidity, wallet, or transaction behavior changes.

---

### Task 1: Productize the GitHub Profile page and public entry

**Files:**
- Modify: `apps/web/src/features/github-profile/github-profile-content.test.tsx`
- Modify: `apps/web/src/features/github-profile/github-profile-content.tsx`
- Modify: `apps/web/src/features/nurture/__tests__/local-interactions.test.tsx`
- Modify: `apps/web/src/features/nurture/moments-content.tsx`
- Create: `apps/web/src/features/nurture/profile-content.test.tsx`
- Modify: `apps/web/src/features/nurture/profile-content.tsx`

**Interfaces:**
- Consumes: existing `GitHubProfileContent`, `ProfileContent`, `MomentsContent`, and TanStack `Link` behavior.
- Produces: rendered product copy and a canonical `/projects/github-profile` entry link for Task 2.

- [ ] **Step 1: Add failing GitHub Profile product-language assertions**

Add this case inside `github-profile-content.test.tsx`:

```tsx
it("presents the profile as a product page", async () => {
	render(<GitHubProfileContent api={fakeApi()} />);

	expect(await screen.findByText("GitHub 个人资料")).toBeVisible();
	expect(screen.getByText("AI 全栈个人资料")).toBeVisible();
	expect(document.body).not.toHaveTextContent(/作业|课程|老师|验收/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```sh
pnpm --filter @course-homework/web test -- github-profile-content.test.tsx
```

Expected: FAIL because the current headings contain `AI 全栈课程作业` and `GitHub 个人资料作业`.

- [ ] **Step 3: Update the GitHub Profile headings**

In `github-profile-content.tsx`, render:

```tsx
<p className="font-semibold text-primary text-xs">AI 全栈个人资料</p>
<h1 className="mt-1 font-bold text-2xl">GitHub 个人资料</h1>
```

Do not change the API contract import, keychain disclosure, read/save controls, or safe error messages.

- [ ] **Step 4: Add failing main-site entry and Moments assertions**

Create `profile-content.test.tsx` with a link mock so the component can be tested without constructing a router:

```tsx
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, ...props }: ComponentProps<"a"> & { to: string }) => (
		<a href={to} {...props}>{children}</a>
	),
}));

import { ProfileContent } from "./profile-content";

describe("ProfileContent product links", () => {
	it("links to the GitHub Profile product route", () => {
		render(<ProfileContent />);
		const link = screen.getByRole("link", { name: /GitHub 个人资料/ });
		expect(link).toHaveAttribute("href", "/projects/github-profile");
		expect(document.body).not.toHaveTextContent(/作业|课程|老师|验收/);
	});
});
```

Extend `local-interactions.test.tsx`:

```tsx
it("describes future Moments capability as a product version", async () => {
	const user = userEvent.setup();
	render(<MomentsContent />);
	await user.click(screen.getByRole("button", { name: "添加时光" }));
	expect(screen.getByText("后续版本将接入真实图片上传")).toBeVisible();
	expect(document.body).not.toHaveTextContent(/作业|课程|老师|验收/);
});
```

- [ ] **Step 5: Run the focused tests and verify RED**

Run:

```sh
pnpm --filter @course-homework/web test -- profile-content.test.tsx local-interactions.test.tsx
```

Expected: FAIL because the entry uses `/homework/github-profile`, its label includes `作业`, and the Moments modal includes `课程后续`.

- [ ] **Step 6: Implement the public entry and Moments copy**

In `profile-content.tsx` use:

```tsx
<Link
	className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50"
	to="/projects/github-profile"
>
	<Cloud aria-hidden="true" className="text-primary" size={20} />
	<span className="flex-1 font-semibold">GitHub 个人资料</span>
	<ChevronRight aria-hidden="true" className="text-muted-foreground" size={18} />
</Link>
```

In `moments-content.tsx`, change only the visible sentence to:

```tsx
<p className="mt-3 font-semibold">后续版本将接入真实图片上传</p>
```

- [ ] **Step 7: Run Task 1 tests and verify GREEN**

Run:

```sh
pnpm --filter @course-homework/web test -- github-profile-content.test.tsx profile-content.test.tsx local-interactions.test.tsx
```

Expected: all selected tests PASS.

- [ ] **Step 8: Commit Task 1**

```sh
git add apps/web/src/features/github-profile apps/web/src/features/nurture
git commit -m "feat(web): present public pages as products"
```

---

### Task 2: Migrate the GitHub Profile route without breaking old links

**Files:**
- Create: `apps/web/src/routes/projects.github-profile.tsx`
- Modify: `apps/web/src/routes/homework.github-profile.tsx`
- Create: `scripts/__tests__/public-product-language.test.mjs`

**Interfaces:**
- Consumes: the `/projects/github-profile` link produced by Task 1 and the existing `GitHubProfileContent` component.
- Produces: one canonical rendering route, a legacy redirect used by existing bookmarks, and a repository-wide guard for public frontend literals.

- [ ] **Step 1: Add the failing route structure test**

Create `scripts/__tests__/public-product-language.test.mjs`:

```js
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const repositoryRoot = new URL("../../", import.meta.url);
const publicSourceRoots = [
	new URL("apps/web/src/", repositoryRoot),
	new URL("homeworks/06-web3-dapp/web/src/", repositoryRoot),
];

async function sourceFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(entries.map(async (entry) => {
		const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
		if (entry.isDirectory()) return sourceFiles(url);
		if (!entry.name.endsWith(".tsx") || entry.name.includes(".test.")) return [];
		return [url];
	}));
	return nested.flat();
}

const canonicalPath = new URL(
	"../../apps/web/src/routes/projects.github-profile.tsx",
	import.meta.url,
);
const legacyPath = new URL(
	"../../apps/web/src/routes/homework.github-profile.tsx",
	import.meta.url,
);

test("GitHub Profile has a product route and a legacy redirect", async () => {
	const canonical = await readFile(canonicalPath, "utf8");
	const legacy = await readFile(legacyPath, "utf8");

	assert.match(canonical, /createFileRoute\("\/projects\/github-profile"\)/);
	assert.match(canonical, /component:\s*GitHubProfileContent/);
	assert.match(legacy, /redirect\(\{/);
	assert.match(legacy, /to:\s*"\/projects\/github-profile"/);
	assert.match(legacy, /replace:\s*true/);
	assert.doesNotMatch(legacy, /component:\s*GitHubProfileContent/);
});

test("public frontend literals do not present projects as coursework", async () => {
	const files = (await Promise.all(publicSourceRoots.map(sourceFiles))).flat();
	for (const file of files) {
		const source = await readFile(file, "utf8");
		assert.doesNotMatch(source, /作业|课程|老师|验收/, file.pathname);
	}
});
```

- [ ] **Step 2: Run the structure test and verify RED**

Run:

```sh
node --test scripts/__tests__/public-product-language.test.mjs
```

Expected: FAIL because `projects.github-profile.tsx` does not exist.

- [ ] **Step 3: Create the canonical product route**

Create `projects.github-profile.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { GitHubProfileContent } from "@/features/github-profile/github-profile-content";

export const Route = createFileRoute("/projects/github-profile")({
	component: GitHubProfileContent,
});
```

- [ ] **Step 4: Convert the legacy route to a redirect**

Replace `homework.github-profile.tsx` with:

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/homework/github-profile")({
	beforeLoad: () => {
		throw redirect({
			to: "/projects/github-profile",
			replace: true,
		});
	},
});
```

- [ ] **Step 5: Run route test, type generation, and build**

Run:

```sh
node --test scripts/__tests__/public-product-language.test.mjs
pnpm --filter @course-homework/web check-types
```

Expected: structure test PASS; Vite/TanStack Router generates the route tree; TypeScript and build PASS.

- [ ] **Step 6: Commit Task 2**

```sh
git add apps/web/src/routes scripts/__tests__/public-product-language.test.mjs
git commit -m "feat(web): add public GitHub Profile route"
```

---

### Task 3: Productize BabySteps rendered language

**Files:**
- Modify: `homeworks/06-web3-dapp/web/src/App.test.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/components/Hero.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/components/WalletPanel.test.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/components/WalletPanel.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/components/CourseEvidenceFooter.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/features/notebook/NotebookPanel.test.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/features/notebook/NotebookPanel.tsx`

**Interfaces:**
- Consumes: existing BabySteps page composition and all wallet/growth/notebook hooks unchanged.
- Produces: product-language DOM with the same component APIs, CSS hooks, and transaction behavior.

- [ ] **Step 1: Replace old copy expectations with the approved product language**

Update `App.test.tsx` to expect:

```tsx
expect(screen.getByText("Sepolia 产品原型 · 测试网")).toBeTruthy();
expect(
	screen.getByText(
		"成长星无价格，只用于 Sepolia 测试网体验；可在测试钱包间赠送，不可兑换。",
	),
).toBeTruthy();
expect(
	screen.getByRole("heading", { name: "步骤 4 · 链上家庭便签" }),
).toBeTruthy();
expect(
	screen.getByRole("heading", { name: "核心技术能力" }),
).toBeTruthy();
expect(
	screen.getByRole("heading", { name: "公开链上便签" }),
).toBeTruthy();
expect(document.body.textContent).not.toMatch(/作业|课程|老师|验收/);
```

Update the matching focused expectations in `NotebookPanel.test.tsx` and add the same rendered-text exclusion to the ready-state case in `WalletPanel.test.tsx`.

- [ ] **Step 2: Run focused BabySteps tests and verify RED**

Run:

```sh
pnpm --filter @course-homework/web3-web test -- App.test.tsx WalletPanel.test.tsx NotebookPanel.test.tsx
```

Expected: FAIL on the current course/assignment language.

- [ ] **Step 3: Update Hero and wallet guidance**

Use these visible strings:

```tsx
<p className="hero-panel__eyebrow">Sepolia 产品原型 · 测试网</p>
```

```tsx
成长星无价格，只用于 Sepolia 测试网体验；可在测试钱包间赠送，不可兑换。
```

```tsx
<ul className="hero-panel__chips" aria-label="测试网体验边界">
```

Wallet replacements:

- `只用于课程演示的测试账户` → `只用于测试网体验的专用账户`
- `课程所需的公开链上状态` → `本产品所需的公开链上状态`
- `课程要求的 Sepolia 测试网` → `本产品使用的 Sepolia 测试网`

- [ ] **Step 4: Update notebook and technical footer language**

In `NotebookPanel.tsx` use:

```tsx
<h2 id="notebook-heading">步骤 4 · 链上家庭便签</h2>
<h3 className="story-card__title">公开链上便签</h3>
```

In `CourseEvidenceFooter.tsx` use:

```tsx
<h2>核心技术能力</h2>
```

```tsx
<p className="course-evidence__card-title">链上交互说明</p>
<p>
	页面覆盖公开链上便签、双账本成长、测试链赠送、钱包网络识别和
	transaction receipt 成功后再刷新的完整链上交互闭环。
</p>
```

Keep the internal component name and `.course-evidence` CSS selectors unchanged.

- [ ] **Step 5: Run focused BabySteps tests and verify GREEN**

Run:

```sh
pnpm --filter @course-homework/web3-web test -- App.test.tsx WalletPanel.test.tsx NotebookPanel.test.tsx
```

Expected: all selected tests PASS and rendered DOM contains none of the prohibited identity terms.

- [ ] **Step 6: Commit Task 3**

```sh
git add homeworks/06-web3-dapp/web/src
git commit -m "feat(web3): productize public BabySteps language"
```

---

### Task 4: Verify online presentation and preserve internal records

**Files:**
- Verify only: `HOMEWORKS.md`
- Verify only: `docs/qa`
- Verify only: `docs/superpowers`
- Verify only: main-site and BabySteps production builds

**Interfaces:**
- Consumes: public page changes from Tasks 1–3.
- Produces: fresh automated and browser evidence that public presentation changed without altering internal records or runtime behavior.

- [ ] **Step 1: Confirm public source literals are productized**

Run:

```sh
rg -n -S "作业|课程|老师|验收|原始作业能力|课程实验" \
  apps/web/src homeworks/06-web3-dapp/web/src packages/ui/src \
  -g '!**/*.test.*' -g '!**/__tests__/**'
```

Expected: only non-rendered internal identifiers/imports such as `@course-homework`, `CourseEvidenceFooter`, or CSS class names may remain; no JSX text, aria-label, or public link contains a prohibited identity term.

- [ ] **Step 2: Confirm internal learning records remain present**

Run:

```sh
rg -n "作业|课程|验收" HOMEWORKS.md docs/qa docs/superpowers | head -20
```

Expected: matches remain, proving internal learning records were not rewritten.

- [ ] **Step 3: Run all main-site and Web3 gates sequentially where Hardhat shares cache**

Run:

```sh
pnpm check
pnpm test
pnpm typecheck
pnpm build
pnpm web3:check
pnpm web3:test
pnpm web3:typecheck
pnpm web3:build
git diff --check
```

Expected: every command exits 0. Do not run `web3:test` and `web3:build` concurrently because both may invoke Hardhat compile against the same cache.

- [ ] **Step 4: Verify the main-site routes in a browser**

Start the main site and check:

1. `/projects/github-profile` renders “AI 全栈个人资料” and “GitHub 个人资料”.
2. `/homework/github-profile` redirects to `/projects/github-profile`.
3. The Profile entry points to the canonical route.
4. The Moments modal says “后续版本将接入真实图片上传”.
5. No displayed element on the checked pages contains `作业`, `课程`, `老师`, or `验收`.

- [ ] **Step 5: Verify BabySteps in external Chrome**

Open the existing local BabySteps page and check:

1. Hero displays “Sepolia 产品原型 · 测试网”.
2. Step 4 displays “链上家庭便签” and “公开链上便签”.
3. Footer displays “核心技术能力” and “链上交互说明”.
4. Existing wallet, 15-point Star state, transferable balance, cooldown copy, and public note still read from Sepolia.
5. No displayed element contains `作业`, `课程`, `老师`, or `验收`.

- [ ] **Step 6: Review and commit the verified integration**

Run:

```sh
git status --short
git diff --stat
git diff --check
```

Stage only files owned by this plan, then commit:

```sh
git add apps/web/src homeworks/06-web3-dapp/web/src scripts/__tests__/public-product-language.test.mjs
git commit -m "feat: align public pages for product showcase"
```

Do not include unrelated deployment evidence, private environment files, keystore files, or secrets.
