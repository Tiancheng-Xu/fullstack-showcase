# Flattened Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the nested Better-T-Stack workspace with one root pnpm workspace containing `apps/web`, a non-buildable `apps/api` placeholder, and shared packages under `packages`.

**Architecture:** Preserve the existing React application and shared packages while changing only their repository boundaries. Root scripts address the web package by its unique workspace name, and the Cloudflare preview workflow installs, tests, builds, and deploys from the flattened root layout.

**Tech Stack:** pnpm 11.17.0, Node.js 22, React 19, Vite 8, Vitest 4, TypeScript 6, GitHub Actions, Cloudflare Pages/Wrangler 4.115.0.

## Global Constraints

- Work only on `tc/flatten-monorepo`, based on `tc/cloudflare-pr-preview-aa5d84f9`.
- Do not alter application UI, application data, Cloudflare credentials, account settings, project ownership, or production configuration.
- Keep the stable preview URL `https://course-homework-preview.pages.dev`.
- `apps/api` remains documentation-only and must not contain a `package.json`.
- The repository must contain exactly one `pnpm-workspace.yaml` and one `pnpm-lock.yaml`, both at the root.
- The deploy artifact must be `apps/web/dist`.
- Architecture, workflow, and directory changes must consult relevant guidance
  under `/Users/shier/Desktop/一灯学习笔记`; explicit current user instructions
  and verified project constraints/tests take precedence over the notes.
- Do not merge a pull request or trigger a production deployment.

---

### Task 1: Define and satisfy the flattened workspace contract

**Files:**
- Create: `scripts/__tests__/monorepo-layout.test.mjs`
- Create: `apps/api/README.md`
- Create from move: `pnpm-workspace.yaml`
- Create from move: `biome.json`
- Create from move: `bts.jsonc`
- Create from move: `tsconfig.json`
- Modify: `package.json`
- Modify after move: `apps/web/package.json`
- Move: `apps/web/apps/web/**` to `apps/web/**`
- Move: `apps/web/packages/ui/**` to `packages/ui/**`
- Move: `apps/web/packages/env/**` to `packages/env/**`
- Move: `apps/web/packages/config/**` to `packages/config/**`
- Delete after promotion: `apps/web/pnpm-workspace.yaml`
- Delete after lockfile regeneration: `apps/web/pnpm-lock.yaml`
- Delete after promotion: `apps/web/package.json`
- Delete after promotion: `apps/web/biome.json`
- Delete after promotion: `apps/web/bts.jsonc`
- Delete after promotion: `apps/web/tsconfig.json`

**Interfaces:**
- Consumes: Existing workspace package names `@web/ui`, `@web/env`, and `@web/config`.
- Produces: Web workspace package `@course-homework/web`; root commands `dev`, `test`, `test:structure`, `typecheck`, `build`, and `validate:preview`.

- [ ] **Step 1: Write the failing filesystem contract test**

Create `scripts/__tests__/monorepo-layout.test.mjs`:

```js
import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function findNamed(directory, target) {
  const matches = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", ".tc-flow", ".tc-worktrees", "node_modules"].includes(entry.name)) {
      continue;
    }
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      matches.push(...(await findNamed(absolute, target)));
    } else if (entry.name === target) {
      matches.push(path.relative(root, absolute));
    }
  }
  return matches;
}

test("uses one root workspace and lockfile", async () => {
  assert.deepEqual(await findNamed(root, "pnpm-workspace.yaml"), [
    "pnpm-workspace.yaml",
  ]);
  assert.deepEqual(await findNamed(root, "pnpm-lock.yaml"), ["pnpm-lock.yaml"]);
});

test("places the application and shared packages at root boundaries", async () => {
  for (const required of [
    "apps/web/package.json",
    "apps/web/src/main.tsx",
    "packages/ui/package.json",
    "packages/env/package.json",
    "packages/config/package.json",
    "apps/api/README.md",
  ]) {
    assert.equal(await exists(required), true, `${required} must exist`);
  }

  assert.equal(await exists("apps/web/apps"), false);
  assert.equal(await exists("apps/web/packages"), false);
  assert.equal(await exists("apps/api/package.json"), false);
});
```

- [ ] **Step 2: Run the structural test and verify RED**

Run:

```bash
node --test scripts/__tests__/monorepo-layout.test.mjs
```

Expected: FAIL because the root workspace and target paths do not exist yet.

- [ ] **Step 3: Move the existing application and packages without changing source behavior**

Use filesystem moves so Git can retain rename history:

```bash
mv apps/web/apps/web/index.html apps/web/index.html
mv apps/web/apps/web/components.json apps/web/components.json
mv apps/web/apps/web/public apps/web/public
mv apps/web/apps/web/src apps/web/src
mv apps/web/apps/web/vite.config.ts apps/web/vite.config.ts
mv apps/web/apps/web/package.json /tmp/course-homework-web-package.json
mv apps/web/apps/web/tsconfig.json /tmp/course-homework-web-tsconfig.json
rmdir apps/web/apps/web
rmdir apps/web/apps

mv apps/web/packages/ui packages/ui
mv apps/web/packages/env packages/env
mv apps/web/packages/config packages/config
rmdir apps/web/packages

mv apps/web/pnpm-workspace.yaml pnpm-workspace.yaml
mv apps/web/biome.json biome.json
mv apps/web/bts.jsonc bts.jsonc
mv apps/web/tsconfig.json tsconfig.json
mv /tmp/course-homework-web-package.json apps/web/package.json
mv /tmp/course-homework-web-tsconfig.json apps/web/tsconfig.json
```

Do not use `/tmp` as persistent storage; both temporary files must be restored
within this step.

- [ ] **Step 4: Add the backend placeholder**

Create `apps/api/README.md`:

```markdown
# API placeholder

This directory reserves the backend application boundary for a later course
lesson. It intentionally has no `package.json`, so frontend-only work does not
install, test, build, or deploy a backend.
```

- [ ] **Step 5: Promote the root command and workspace configuration**

Change the web package name in `apps/web/package.json` from `"web"` to:

```json
"name": "@course-homework/web"
```

Replace the root scripts in `package.json` with:

```json
"scripts": {
  "dev": "pnpm --filter @course-homework/web dev",
  "test": "pnpm test:structure && pnpm --filter @course-homework/web test",
  "test:structure": "node --test scripts/__tests__/monorepo-layout.test.mjs",
  "typecheck": "pnpm --filter @course-homework/web check-types",
  "build": "pnpm --filter @course-homework/web build",
  "validate:preview": "node scripts/validate-cloudflare-preview.mjs"
}
```

Keep `"private": true` and `"packageManager": "pnpm@11.17.0"`. Keep the
promoted `pnpm-workspace.yaml` catalog values unchanged.

- [ ] **Step 6: Regenerate the single root lockfile**

Run:

```bash
rm apps/web/pnpm-lock.yaml
pnpm install --lockfile-only
```

Expected: root `pnpm-lock.yaml` is created and contains importers for
`apps/web`, `packages/config`, `packages/env`, and `packages/ui`.

- [ ] **Step 7: Run the structural test and verify GREEN**

Run:

```bash
pnpm test:structure
```

Expected: 2 tests pass, 0 fail.

- [ ] **Step 8: Verify workspace resolution**

Run:

```bash
pnpm --filter @course-homework/web list @web/ui --depth 0
```

Expected: the filtered web workspace lists `@web/ui` as a linked workspace
dependency.

- [ ] **Step 9: Commit the flattened workspace**

```bash
git add apps packages scripts/__tests__/monorepo-layout.test.mjs \
  package.json pnpm-workspace.yaml pnpm-lock.yaml biome.json bts.jsonc tsconfig.json
git commit -m "refactor: flatten course homework workspace"
```

### Task 2: Document the flattened preview flow

The Task 1 review fix already moved the active workflow and validator to the
root lockfile, root install command, and `apps/web/dist`. This task makes the
learner-facing documentation match that verified contract.

**Files:**
- Modify: `scripts/__tests__/monorepo-layout.test.mjs`
- Modify: `apps/web/README.md`

**Interfaces:**
- Consumes: Root commands from Task 1 and the corrected Cloudflare preview contract.
- Produces: Learner documentation that explains the flattened frontend, backend placeholder, shared UI, and root commands.

- [ ] **Step 1: Add a failing documentation contract test**

Add `readFile` to the existing `node:fs/promises` import and append:

```js
test("documents the flattened learner workflow", async () => {
  const readme = await readFile(path.join(root, "apps/web/README.md"), "utf8");

  for (const fragment of [
    "apps/web",
    "apps/api",
    "packages/ui",
    "pnpm dev",
    "pnpm test",
    "pnpm typecheck",
    "pnpm build",
  ]) {
    assert.match(readme, new RegExp(fragment.replace("/", "\\/")));
  }

  assert.doesNotMatch(readme, /apps\/web\/apps\/web|pnpm --dir apps\/web/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm test:structure
```

Expected: FAIL because the existing README does not document all flattened
paths and root commands.

- [ ] **Step 3: Update learner-facing structure and commands**

In `apps/web/README.md`, replace commands that enter `apps/web` or mention
`apps/web/apps/web` with:

```bash
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

Add a concise structure section:

```text
apps/web     React + Vite frontend
apps/api     future backend boundary; not built yet
packages/ui  reusable UI components and global styles
```

Explain that root scripts select the web workspace and Cloudflare deploys
`apps/web/dist`.

- [ ] **Step 4: Run focused GREEN checks**

Run:

```bash
pnpm test:structure
pnpm validate:preview
```

Expected: the structural tests pass and the validator prints
`Cloudflare preview workflow validation passed.`

- [ ] **Step 5: Commit the learner documentation**

```bash
git add apps/web/README.md scripts/__tests__/monorepo-layout.test.mjs
git commit -m "docs: explain flattened preview workflow"
```

### Task 3: Add the learning-notes working agreement

**Files:**
- Create: `AGENTS.md`
- Modify: `scripts/__tests__/monorepo-layout.test.mjs`

**Interfaces:**
- Consumes: Local learning notes at `/Users/shier/Desktop/一灯学习笔记`.
- Produces: A repository-level instruction for future architecture, workflow, and directory changes.

- [ ] **Step 1: Add a failing convention test**

Append this test to `scripts/__tests__/monorepo-layout.test.mjs`:

```js
test("records the learning-notes working agreement", async () => {
  const agreement = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agreement, /\\/Users\\/shier\\/Desktop\\/一灯学习笔记/);
  assert.match(agreement, /verified project constraints and tests take precedence/i);
  assert.match(agreement, /do not copy/i);
});
```

Add `readFile` to the existing `node:fs/promises` import.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm test:structure
```

Expected: FAIL because `AGENTS.md` does not exist.

- [ ] **Step 3: Create the project working agreement**

Create `AGENTS.md`:

```markdown
# Course Homework Working Agreement

## Learning source

Before planning architecture, workflow, or directory changes in this
repository, consult the relevant material under:

`/Users/shier/Desktop/一灯学习笔记`

Use the notes as design guidance. Do not copy the notes or their private
content wholesale into this repository.

## Precedence

1. Explicit instructions from the user for the current task.
2. Verified project constraints and tests.
3. Relevant guidance from the learning notes.

When the notes conflict with the project, record the conflict and resolution
in the design or implementation plan before changing code.

## Delivery discipline

- Use an isolated feature worktree for multi-file changes.
- Keep frontend and backend build scopes independent.
- Do not commit credentials, local Cloudflare state, or private photographs.
- Do not trigger production deployment without explicit authorization.
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
pnpm test:structure
```

Expected: 4 tests pass, 0 fail.

- [ ] **Step 5: Commit the convention**

```bash
git add AGENTS.md scripts/__tests__/monorepo-layout.test.mjs
git commit -m "docs: add learning notes working agreement"
```

### Task 4: Verify the migration end to end

**Files:**
- Modify only if a verification failure exposes a migration defect.

**Interfaces:**
- Consumes: Flattened workspace and preview contract from Tasks 1–2.
- Produces: Fresh evidence that the source behavior and preview artifact remain valid.

- [ ] **Step 1: Install exactly from the committed lockfile**

Run:

```bash
pnpm install --frozen-lockfile
```

Expected: exit 0 with no lockfile changes.

- [ ] **Step 2: Run all tests**

Run:

```bash
pnpm test
```

Expected: structural tests and all existing Vitest tests pass with 0 failures.

- [ ] **Step 3: Run TypeScript validation**

Run:

```bash
pnpm typecheck
```

Expected: exit 0 with no TypeScript errors.

- [ ] **Step 4: Build the production frontend artifact**

Run:

```bash
pnpm build
test -f apps/web/dist/index.html
```

Expected: both commands exit 0.

- [ ] **Step 5: Re-run the preview contract validator**

Run:

```bash
pnpm validate:preview
```

Expected: `Cloudflare preview workflow validation passed.`

- [ ] **Step 6: Confirm no nested workspace references remain**

Run:

```bash
rg -n "apps/web/apps/web|apps/web/packages|apps/web/pnpm-lock.yaml|pnpm --dir apps/web" \
  .github apps packages scripts package.json pnpm-workspace.yaml \
  --glob '!**/node_modules/**' --glob '!**/dist/**'
```

Expected: no matches.

- [ ] **Step 7: Inspect the final repository delta**

Run:

```bash
git status --short
git diff --check tc/cloudflare-pr-preview-aa5d84f9...HEAD
git diff --stat tc/cloudflare-pr-preview-aa5d84f9...HEAD
```

Expected: clean worktree, no whitespace errors, and changes limited to the
design, plan, directory migration, root configuration, preview workflow,
validator, tests, and documentation described above.
