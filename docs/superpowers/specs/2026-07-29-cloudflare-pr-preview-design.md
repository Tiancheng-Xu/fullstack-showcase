# Cloudflare PR Preview Design

## Goal

Use GitHub Actions to update one minimal, stable Cloudflare Pages preview environment for same-repository pull requests in `Tiancheng-Xu/course-homework`.

## Architecture

GitHub remains the source of truth and CI coordinator. A pull request installs
the root pnpm workspace, then runs the root tests, typecheck, and Vite production
build. After those gates pass, Wrangler uploads `apps/web/dist` to the dedicated
Pages test project `course-homework-preview`.

The preview uses one stable URL:

```text
https://course-homework-preview.pages.dev
```

This intentionally minimizes the first deployment. Multiple simultaneous PR-specific environments and automatic cleanup are deferred until the course needs them.

## Events and permissions

The workflow listens to:

- `pull_request` events `opened`, `reopened`, and `synchronize`.
- `workflow_dispatch` for an explicit manual test run.

Only pull requests whose head repository is the same repository may deploy. Fork pull requests may run validation but never receive Cloudflare secrets.

Minimal GitHub permissions:

- `contents: read`
- `deployments: write`

No production deployment, AWS access, package publishing, or repository write permission is included.

## Credentials

GitHub Actions stores:

- Secret `CLOUDFLARE_API_TOKEN`: custom Cloudflare token with Pages Edit permission for the selected account.
- Secret `CLOUDFLARE_ACCOUNT_ID`: the selected Cloudflare account identifier.
- Variable `CLOUDFLARE_PAGES_PROJECT`: `course-homework-preview`.

Credentials never enter source files, logs, review bundles, or pull request text.

## Workflow behavior

1. Checkout the pull request commit.
2. Install Node.js 22 and pnpm 11.17.0.
3. Run `pnpm install --frozen-lockfile` from the repository root.
4. Run tests, typecheck, and production build.
5. Upload `apps/web/dist` to `course-homework-preview`.
6. Publish the stable `pages.dev` URL as the GitHub deployment environment URL.

Only one preview deployment runs at a time. A newer run cancels an older run so stale code cannot overwrite the stable preview.

## Failure handling

- Quality-gate failure prevents deployment.
- Missing Cloudflare credentials fails before mutation with a clear message.
- The Pages project is bootstrapped once and then reused.
- Production is never used as a fallback.

## Verification

- Parse and statically validate the workflow.
- Run the existing tests, typecheck, and build locally.
- Push the feature branch and open a draft PR.
- Confirm the Action succeeds and the deployment URL responds.
- Open the stable preview and confirm the visible application identity.

## Non-goals

- Production Pages deployment.
- Custom domain configuration.
- Cloudflare Access protection.
- AWS deployment.
- Preview deployments for forked pull requests.
- Per-PR isolated Pages projects and automatic cleanup.
