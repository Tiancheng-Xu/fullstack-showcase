# Cloudflare PR Preview Design

## Goal

Use GitHub Actions to create a real, isolated Cloudflare Pages preview environment for every same-repository pull request in `Tiancheng-Xu/course-homework`, update it on every PR commit, and remove it when the PR closes.

## Architecture

GitHub remains the source of truth and CI coordinator. A pull request runs the existing tests, typecheck, and Vite production build. After those gates pass, Wrangler creates or reuses a Pages Direct Upload project named `course-homework-pr-<number>` and uploads `apps/web/apps/web/dist`.

Each PR receives a stable URL:

```text
https://course-homework-pr-<number>.pages.dev
```

Closing the PR runs a cleanup job that deletes the whole PR-specific Pages project. This avoids the Cloudflare limitation that the latest deployment of a shared branch alias cannot be deleted.

## Events and permissions

The workflow listens to `pull_request` events:

- `opened`, `reopened`, `synchronize`: validate, build, create/update preview.
- `closed`: delete the PR-specific Pages project.

Only pull requests whose head repository is the same repository may deploy. Fork pull requests may run validation but never receive Cloudflare secrets.

Minimal GitHub permissions:

- `contents: read`
- `deployments: write`

No production deployment, AWS access, package publishing, or repository write permission is included.

## Credentials

GitHub Actions stores:

- Secret `CLOUDFLARE_API_TOKEN`: custom Cloudflare token with Pages Edit permission for the selected account.
- Secret `CLOUDFLARE_ACCOUNT_ID`: the selected Cloudflare account identifier.
- Variable `CLOUDFLARE_PAGES_PREFIX`: `course-homework-pr`.

Credentials never enter source files, logs, review bundles, or pull request text.

## Workflow behavior

1. Checkout the pull request commit.
2. Install Node.js 22 and pnpm 11.17.0.
3. Install the nested Better-T-Stack workspace with the frozen lockfile.
4. Run tests, typecheck, and production build.
5. Check whether the PR-specific Pages project exists.
6. Create the project when missing, with `preview` as its internal production branch.
7. Upload `apps/web/apps/web/dist`.
8. Publish the stable `pages.dev` URL as the GitHub deployment environment URL.
9. On PR close, delete the entire PR-specific Pages project non-interactively.

Concurrent runs for the same PR are cancelled so an older commit cannot overwrite a newer preview.

## Failure handling

- Quality-gate failure prevents deployment.
- Missing Cloudflare credentials fails before mutation with a clear message.
- Project creation is idempotent: an existing project is reused.
- Cleanup treats an already-absent project as success.
- Production is never used as a fallback.

## Verification

- Parse and statically validate the workflow.
- Run the existing tests, typecheck, and build locally.
- Push the feature branch and open a draft PR.
- Confirm the Action succeeds and the deployment URL responds.
- Close only a dedicated verification PR when cleanup behavior is being tested.

## Non-goals

- Production Pages deployment.
- Custom domain configuration.
- Cloudflare Access protection.
- AWS deployment.
- Preview deployments for forked pull requests.
