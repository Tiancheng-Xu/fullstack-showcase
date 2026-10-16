# Cloudflare PR Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify isolated, auto-cleaned Cloudflare Pages preview environments for same-repository pull requests.

**Architecture:** A GitHub Actions pull-request workflow runs the existing frontend gates, manages one Direct Upload Pages project per PR with Wrangler, and exposes the stable Pages URL through a GitHub deployment environment. A close event deletes the PR-specific project.

**Tech Stack:** GitHub Actions, Node.js 22, pnpm 11.17.0, Wrangler 4, Cloudflare Pages Direct Upload, Vite.

## Global Constraints

- Never deploy the `main` branch or a production Pages project.
- Never expose Cloudflare credentials to fork pull requests.
- Store credentials only as GitHub Actions Secrets.
- Use `apps/web/pnpm-lock.yaml` with `--frozen-lockfile`.
- Preview project names are `course-homework-pr-<PR number>`.

---

### Task 1: Preview workflow

**Files:**
- Create: `.github/workflows/cloudflare-pr-preview.yml`
- Create: `scripts/validate-preview-workflow.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: pull request number, head repository identity, Cloudflare Secrets, `apps/web/apps/web/dist`.
- Produces: a GitHub deployment environment with URL `https://course-homework-pr-<number>.pages.dev`.

- [ ] **Step 1: Write the failing validator**

Create a validator that reads the workflow and asserts the required PR events, same-repository guard, quality commands, per-PR project naming, deploy command, and close cleanup command.

- [ ] **Step 2: Run the validator to verify it fails**

Run: `node scripts/validate-preview-workflow.mjs`

Expected: non-zero exit because `.github/workflows/cloudflare-pr-preview.yml` does not exist.

- [ ] **Step 3: Implement the workflow**

Add `quality`, `preview`, and `cleanup` jobs. Use concurrency keyed by PR number, Node 22, pnpm 11.17.0, frozen installation, and local Wrangler CLI commands. Guard all Cloudflare jobs with:

```yaml
if: github.event.pull_request.head.repo.full_name == github.repository
```

- [ ] **Step 4: Add the validation command**

Add root script:

```json
"validate:preview": "node scripts/validate-preview-workflow.mjs"
```

- [ ] **Step 5: Run local gates**

Run:

```bash
pnpm validate:preview
pnpm test
pnpm typecheck
pnpm build
```

Expected: all commands exit zero.

### Task 2: Cloudflare and GitHub configuration

**Files:**
- Modify: `README.md`
- Modify: `apps/web/README.md`

**Interfaces:**
- Consumes: a Cloudflare account with Pages Edit permission.
- Produces: GitHub Secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and variable `CLOUDFLARE_PAGES_PREFIX`.

- [ ] **Step 1: Create a least-privilege Cloudflare API token**

Use the Cloudflare dashboard custom-token flow with Account / Cloudflare Pages / Edit for the selected account only.

- [ ] **Step 2: Save repository configuration**

Write the token and account identifier using `gh secret set`; write the public prefix using `gh variable set`. Verify only the names and timestamps, never read secret values back.

- [ ] **Step 3: Document behavior**

Document the PR URL format, lifecycle, same-repository restriction, required secret names, and the fact that production is not deployed.

### Task 3: End-to-end preview verification

**Files:**
- Create: `.tc-flow/` run evidence through the TC Flow workflow.

**Interfaces:**
- Consumes: pushed feature branch and repository Secrets.
- Produces: draft pull request, successful Actions run, reachable Pages preview URL, and cleanup evidence when the verification PR closes.

- [ ] **Step 1: Push the feature branch**

Push `tc/cloudflare-pr-preview-<contractHash>` with tracking.

- [ ] **Step 2: Open a draft PR**

Create a draft PR against `main` describing the workflow, credential boundary, validation commands, and cleanup semantics.

- [ ] **Step 3: Verify Actions**

Wait for the PR workflow. Confirm quality and preview jobs pass and retrieve the deployment environment URL.

- [ ] **Step 4: Verify preview**

Request the preview URL and confirm HTTP success plus the visible `育爱成长` application identity.

- [ ] **Step 5: Preserve cleanup for normal PR lifecycle**

Keep the implementation PR open for review. The `closed` event is the production cleanup mechanism and is not triggered early merely to demonstrate deletion.
