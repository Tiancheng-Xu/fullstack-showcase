# TC Flow Run Memory

- Run: `tc_cloudflare_pr_preview_20260729`
- Feature: `cloudflare-pr-preview`
- Contract: `aa5d84f908a529b4f846c23b04373a695caeff9c88ed05d44db77582be32d522`
- Nodes: N1 fresh initialization; N2 goal-hook routing; T-001 through T-003 N3-N5; N6 pass.
- Reviews: three Kimi task reviews passed; reviewer degradation false; P0 issues none.
- QA: 5/5 acceptance criteria passed; frontend and preview contract passed; backend not applicable.
- Retries: one CI repair in T-003.
- Tool requests: Cloudflare and GitHub browser sessions, local verification, GitHub Actions logs.
- Human interventions: user stayed online and observed Cloudflare and GitHub web operations.
- Security: superseded token exposure was remediated by revocation and replacement; no active secret appears in artifacts.
- Notable fix: select npm and pin Wrangler 4.115.0 for the deployment action to avoid pnpm blocking temporary dependency build scripts.
- Pull request: draft PR #1.
- Test deployment: GitHub Actions run `30517588778` passed and refreshed the stable Pages preview.
- Production: manual-pending; no production resource or workflow was triggered.
