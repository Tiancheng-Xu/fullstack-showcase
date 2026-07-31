# Stitch Parent UI Refresh

## Decisions

- Latest local Stitch snapshot is the visual source of truth; the product remains the existing V1 React app.
- Scope is parent-facing H5 only. Course lab screens, backend implementation, AWS, production auth, uploads, and deployment remain outside this Feature.
- One fictional profile (“金金”) supplies every page; product images are bundled under one stable local asset registry.
- China-first guide content shows provenance, access/review dates, age range, and a fixed non-diagnostic disclaimer.
- V1 guide prose is reviewed local Mock content. Future Go adapters may use NHC public documents, PHDA metadata, a Chinese children's science provider, and PubMed evidence; the browser never calls them directly.

## Reusable Patterns

- `AppShell` derives auth/app chrome from the router pathname so SPA navigation immediately updates fixed bars.
- Pure feature components accept callbacks for navigation-affecting actions; route files own `useNavigate`.
- Detail routes that have a sibling list route but should not inherit its component use TanStack Router's trailing-underscore escape filename, e.g. `moments_.$momentId.tsx`.
- Every externally sourced article carries `sourceName`, `sourceUrl`, `sourceProviderId`, and `sourceAccessedAt`.
- Local interactive controls use `role="switch"`/`aria-checked`, `aria-pressed`, labelled forms, and the shared accessible Modal.

## Pitfalls

- Dotted route filenames become nested children. Without an `<Outlet>`, the parent list silently masks the detail component even though typecheck and isolated component tests pass. Direct-route browser smoke and a root-route structure test are required.
- Screenshot capture immediately after navigation can precede compositor/image readiness. Wait for `load`, verify image `naturalWidth`, allow one compositor frame, and capture the viewport rather than a stitched full page when fixed bars are present.
- TC Flow's sensitive-string gate flags even reserved example emails. Review bundles must use redacted placeholders while local product tests may retain clearly fictional fixtures.
- Reduced-motion CSS intentionally uses `!important` to override animation styles; Biome reports four warnings but no errors.

## Cross-Feature Impact

- The backend Feature must implement provider adapters and caching in Go, keep PHDA/children's-provider credentials server-side, and never expose unreviewed upstream health text directly.
- API/OpenAPI article responses must preserve the provenance fields used by this UI.
- Real media work must replace local placeholders without changing the local Media-ID contract or exposing storage keys.

## Recovery

- Resume from `.tc-flow/checkpoints/SUI-007.json`, then read `.tc-flow/qa/feature-result.json`.
- Final verified gates: 24/24 tests, typecheck/build pass, 12 routes without 320px overflow, six 390x844 screenshots, and a clean ten-route browser smoke.
