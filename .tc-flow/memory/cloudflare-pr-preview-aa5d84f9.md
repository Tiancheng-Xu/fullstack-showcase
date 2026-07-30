# Cloudflare PR Preview

## Decision

- Use one dedicated Cloudflare Pages project for a stable, minimal preview environment.
- Trigger preview deployment from same-repository pull requests and manual dispatch only.
- Keep the pull request in Draft state until the course work is ready for review.
- Keep production deployment, production resources, custom domains, and merging under separate human control.

## Security

- Store the Cloudflare token and account identifier only as GitHub Actions Secrets.
- Store the non-sensitive Pages project name as a GitHub Actions Variable.
- Reject fork pull requests before any secret-backed deployment step.
- Never capture or persist a browser page while a newly created token value is visible.

## Reusable lessons

- A green local build does not prove the CI deployment tool can install under the runner's package-manager policy.
- Validate the deployment action's package manager and Wrangler version as part of the workflow contract.
- Treat the stable preview URL as an end-to-end assertion: refresh it after CI succeeds and verify visible application identity and navigation.
- Preserve failed and successful run identifiers in the checkpoint so an interrupted flow can resume from evidence rather than memory.

## Recovery

- Resume from draft pull request #1 and the stable preview project.
- The latest verified source commit is `2fc2e7834646dbfc5b0277cf5a2e17f52900a2e5`.
- GitHub Actions run `30517588778` passed; production remains `manual-pending`.
