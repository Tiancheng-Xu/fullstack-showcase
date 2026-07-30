# Task 4 verification report

## Status

BLOCKED

## Commands and evidence

| Step | Command | Exit code | Result / output summary |
| --- | --- | ---: | --- |
| Install | `pnpm install --frozen-lockfile` | 0 | `Scope: all 5 workspace projects`; `Already up to date`; `Done in 167ms using pnpm v11.17.0`. A fresh `git status --short` immediately afterward was empty, confirming no lockfile/worktree change from installation. |
| Tests | `pnpm test` | 0 | Structural Node test: 5 tests passed, 0 failed. Vitest: 3 test files passed; 8 tests passed. |
| Typecheck | `pnpm typecheck` | 0 | Ran `pnpm --filter @course-homework/web check-types`, which ran `vite build && tsc --noEmit`; Vite built 1,896 modules and completed in 253 ms; no TypeScript errors. |
| Production build | `pnpm build` | 0 | Ran `pnpm --filter @course-homework/web build`; Vite built 1,896 modules and completed in 147 ms. |
| Build artifact | `test -f apps/web/dist/index.html` | 0 | `apps/web/dist/index.html` exists (the build output listed it at 0.38 kB). |
| Preview validator | `pnpm validate:preview` | 0 | Output: `Cloudflare preview workflow validation passed.` |
| Nested-reference scan | `rg -n "apps/web/apps/web\|apps/web/packages\|apps/web/pnpm-lock.yaml\|pnpm --dir apps/web" .github apps packages scripts package.json pnpm-workspace.yaml --glob '!**/node_modules/**' --glob '!**/dist/**'` | 0 | **Expectation not met:** four matches were returned; see blockers below. |
| Worktree status | `git status --short` | 0 | **Expectation not met after fresh checks:** `?? apps/web/src/routeTree.gen.ts`. (The initial post-install status was clean.) |
| Whitespace check | `git diff --check tc/cloudflare-pr-preview-aa5d84f9...HEAD` | 0 | No output; no whitespace errors in the committed range. |
| Committed diff scope | `git diff --stat tc/cloudflare-pr-preview-aa5d84f9...HEAD` | 0 | 86 files changed, 5,746 insertions, 5,168 deletions. The stat covers the intended flattened-workspace migration: root workspace/config/lockfile, moved `apps/web` and `packages`, Cloudflare preview workflow and validator, structural tests, documentation/design/plan, plus `apps/api/README.md`. |

## Artifact evidence

- Fresh `pnpm build` produced `apps/web/dist/index.html` and the emitted asset bundle.
- `test -f apps/web/dist/index.html` exited 0.

## Blockers and concerns

1. The required no-stale-reference scan did not produce zero matches. Exact matches:

   ```text
   scripts/validate-cloudflare-preview.mjs:28:    "cache-dependency-path: apps/web/pnpm-lock.yaml",
   scripts/validate-cloudflare-preview.mjs:29:    "pnpm --dir apps/web install --frozen-lockfile",
   scripts/validate-cloudflare-preview.mjs:30:    "pages deploy apps/web/apps/web/dist",
   scripts/__tests__/monorepo-layout.test.mjs:71:  assert.equal(await exists("apps/web/packages"), false);
   ```

   Although three validator strings and the structural assertion may be deliberate negative checks, they violate Task 4's exact command expectation of no matches. The smallest next debugging step is to narrow the scan or revise the validator/test representation only if the task contract permits excluding intentional negative-check strings.

2. After the fresh verification commands, `git status --short` reported `?? apps/web/src/routeTree.gen.ts`; the final worktree therefore was not clean. This appears to be a build/typecheck-generated source artifact that is neither committed nor ignored. The smallest next debugging step is to determine whether it is an expected generated route tree and then commit it or add the correct generated-file ignore rule, as dictated by the migration contract.

No migration source files were changed during verification. This report is the only requested file written.

## Blocker resolution evidence (2026-07-30)

### Changes

- Corrected `apps/web/.gitignore` to use the app-relative generated-file rule
  `src/routeTree.gen.ts`.
- Extended the structural ignore test to verify the generated route tree, in
  addition to the existing Cloudflare local-file checks.
- Revised Task 4 Step 6 to scan only runtime configuration and learner-facing
  workspace documentation (`.github`, `apps`, `packages`, root package/workspace
  files), excluding test and validator negative-guard sources. The forbidden
  fragment guards remain intact.
- Removed the build-generated, untracked `apps/web/src/routeTree.gen.ts` after
  verification.

### Focused RED/GREEN

| Phase | Command | Exit code | Result / output summary |
| --- | --- | ---: | --- |
| RED | `pnpm test:structure` | 1 | The new generated-route-tree assertion failed as intended: `apps/web/src/routeTree.gen.ts must be ignored` (`false !== true`). |
| GREEN | `pnpm test:structure` | 0 | Structural Node test: 5 tests passed, 0 failed. `git check-ignore -v apps/web/src/routeTree.gen.ts` identified `apps/web/.gitignore:12:src/routeTree.gen.ts`. |

### Fresh Task 4 verification

| Step | Command | Exit code | Result / output summary |
| --- | --- | ---: | --- |
| Install | `pnpm install --frozen-lockfile` | 0 | `Scope: all 5 workspace projects`; `Already up to date`; completed in 160ms using pnpm v11.17.0. |
| Tests | `pnpm test` | 0 | Structural Node test: 5 tests passed, 0 failed. Vitest: 3 files and 8 tests passed. |
| Typecheck | `pnpm typecheck` | 0 | `vite build && tsc --noEmit` completed with no TypeScript errors; Vite transformed 1,896 modules. |
| Production build | `pnpm build` | 0 | Vite transformed 1,896 modules and completed successfully. |
| Build artifact | `test -f apps/web/dist/index.html` | 0 | The production frontend artifact exists. |
| Preview validator | `pnpm validate:preview` | 0 | `Cloudflare preview workflow validation passed.` |
| Nested-reference scan | Revised Task 4 Step 6 command | 0 | No matches in the runtime config/docs target set; intentional negative guards were excluded, not removed. |
| Generated artifact cleanup | `rm apps/web/src/routeTree.gen.ts && test ! -e apps/web/src/routeTree.gen.ts` | 0 | Build-generated local route tree was removed after verification. |
| Whitespace check | `git diff --check tc/cloudflare-pr-preview-aa5d84f9...HEAD` | 0 | No output; no whitespace errors in the committed migration range. |

## Status

RESOLVED — the scoped verification fix and evidence were committed.

## Review-fix round 2 evidence (2026-07-30)

### Changes

- Replaced the Step 6 plain `rg` command with explicit status handling: zero
  matches (`rg` exit 1) returns 0, while stale matches and `rg` errors remain
  nonzero failures.
- Restored `scripts` to the scan scope and excluded only
  `scripts/validate-cloudflare-preview.mjs` and
  `scripts/__tests__/monorepo-layout.test.mjs`, the two intentional
  forbidden-fragment guard files.
- Added a structural assertion using `git ls-files --error-unmatch` that
  `apps/web/src/routeTree.gen.ts` is not tracked, alongside its existing ignore
  assertion.

### Focused test

| Command | Exit code | Result / output summary |
| --- | ---: | --- |
| `pnpm test:structure` | 0 | 5 structural tests passed, including the generated route tree ignore and non-tracked assertions. The non-tracked assertion passed immediately because it protects the already-correct repository state; no RED result is claimed for it. |

### Fresh Task 4 verification

| Step | Command | Exit code | Result / output summary |
| --- | --- | ---: | --- |
| Install | `pnpm install --frozen-lockfile` | 0 | `Scope: all 5 workspace projects`; `Already up to date`; completed in 159ms using pnpm v11.17.0. |
| Tests | `pnpm test` | 0 | Structural Node test: 5 tests passed, 0 failed. Vitest: 3 files and 8 tests passed. |
| Typecheck | `pnpm typecheck` | 0 | `vite build && tsc --noEmit` completed with no TypeScript errors; Vite transformed 1,896 modules. |
| Production build | `pnpm build` | 0 | Vite transformed 1,896 modules and completed successfully. |
| Build artifact | `test -f apps/web/dist/index.html` | 0 | The production frontend artifact exists. |
| Preview validator | `pnpm validate:preview` | 0 | `Cloudflare preview workflow validation passed.` |
| Nested-reference scan | Revised Task 4 Step 6 wrapper | 0 | `rg` returned 1 with zero matches in `.github`, `apps`, `packages`, `scripts`, and root package/workspace files; the wrapper converted only that no-match status to success. |
| Generated artifact cleanup | `rm apps/web/src/routeTree.gen.ts && test ! -e apps/web/src/routeTree.gen.ts` | 0 | Build-generated local route tree was removed after verification. |
| Post-cleanup status | `git status --short` | 0 | Only the scoped round-2 edits were present: `M docs/superpowers/plans/2026-07-30-flatten-monorepo.md` and `M scripts/__tests__/monorepo-layout.test.mjs`. |
| Post-cleanup whitespace | `git diff --check tc/cloudflare-pr-preview-aa5d84f9...HEAD` | 0 | No output; no whitespace errors in the committed migration range. |
| Post-cleanup diff scope | `git diff --stat tc/cloudflare-pr-preview-aa5d84f9...HEAD` | 0 | 87 files changed, 5,837 insertions, 5,169 deletions; the stat covers the flattened-workspace migration and prior Task 4 evidence. |
