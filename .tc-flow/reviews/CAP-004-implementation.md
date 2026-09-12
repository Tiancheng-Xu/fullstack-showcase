# CAP-004 Implementation

## Status

- N5 task completion: complete
- N6 feature review: pending
- Validation: not run, per user instruction
- Commit/push: not performed

## Change list

- Replaced the open-source backdrop's `CAPABILITY_DOMAINS` input with nodes derived from `openSourceRepositoryDetails`.
- Added repository names as opt-in particle labels; homepage capability nodes do not set labels and retain their original rendering contract.
- Added backward-compatible `iconSrc` and `fallbackIconSrc` support to the shared Babylon renderer while retaining `iconSlug`.
- Generated 21 deterministic repository/organization avatar SVGs under `public/assets/portfolio/repository-icons`.
- Replaced open-source card runtime GitHub avatar URLs with the same local asset resolver.
- Kept `/assets/portfolio/tech-icons/github.svg` as the local missing-asset fallback.
- Added focused tests for repository-derived nodes, absence of skill nodes, local icon paths and files, fallback behavior, direct `iconSrc` compatibility, and the unchanged 48-node homepage contract.

## Decisions and findings

- GitHub avatar downloads timed out in the implementation environment, so deterministic local organization avatars were generated instead of committing uncertain or partial downloads.
- Repository asset names are derived from normalized `owner--repository` GitHub paths, which keeps paths stable and reviewable.
- The existing open-source cards also depended on runtime GitHub avatar images. That dependency was in CAP-004 scope and was removed.
- No global evidence, release truth, links, contribution statuses, or homepage capability data were changed.
- No validation command was executed.

## Suggested validation

```bash
pnpm --dir apps/web/apps/web exec vitest run   src/features/portfolio/__tests__/cap-004-particle-data.test.ts   src/features/portfolio/__tests__/technology-particle-backdrop.test.tsx   src/features/portfolio/__tests__/technology-capability-map.test.tsx   src/features/portfolio/__tests__/capability-map-data.test.ts
pnpm --dir apps/web/apps/web exec tsc --noEmit
git diff --check
rg -n 'github\.com/.+\.png'   apps/web/apps/web/src/features/portfolio/technology-particle-backdrop.tsx   apps/web/apps/web/src/features/portfolio/open-source-index-content.tsx
```
