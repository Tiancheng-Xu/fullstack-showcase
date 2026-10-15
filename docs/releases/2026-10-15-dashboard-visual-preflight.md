# Dashboard and Profile visual release preflight

This is a pre-publication verification snapshot, not evidence that production
has already changed. Production completion requires the final merged commit,
successful Git-integrated deployment and public-page readback.

## Verified locally

- Repository tests: 177 passed (4 OSS checks, 156 web tests and 17 Worker tests).
- CI-equivalent visual and DOM contract checks: 27 passed.
- Type checking and production build passed; 111 static-first routes were emitted.
- Built-route semantics passed: known pages return 200, unknown pages return 404;
  all 19 PRD Evidence routes passed, including the unknown-Evidence 404 check.
- Physical-viewport Playwright regression: 439 of 439 checks passed.
- Browser-isolated native GPU initialization/cancellation regression: 5 of 5
  cases passed, including pending image/model cancellation and failure cleanup.
  This is controlled browser evidence, not a claim of production GPU coverage.
- Full Backstop regression: 38 of 38 passed, equal dimensions and displayed
  mismatch of 0.00%, with the original 0.1% threshold unchanged.
- Profile narrative checks: 7 passed, including negative controls for inflated
  experience, duplicated employment, enhancement status and evaluation claims.

## Visual reference adoption

The user explicitly approved a separate content revision after candidate
generation and independent per-image review. The active reference set contains
10 reviewed candidates and 28 unchanged carried-forward images. All 60 original
reference PNGs remain byte-for-byte preserved. No failed image was automatically
accepted and no comparison threshold was relaxed.

The candidates reproduced successfully in 10 of 10 checks. Independent mobile
and desktop reviewers inspected 44 native-scale boards covering all 10 candidate
images and found no actionable visual defect in that static-image scope.
Reviewers were configured as GPT-6.1 Sol / high; the serving API model identity
was not independently available and is not represented as attested.

The historical capture lacks a complete build-input manifest. Consequently,
the precise cause of every old one-pixel residual is not strictly established.
That limitation was disclosed and accepted with the content-revision adoption;
it is not rewritten as a historical visual pass.

## Scope and limits

- Phones use the attributed static voyage poster and must not initialize Babylon
  or probe WebGL. Desktop initialization remains cancellable and releases late
  resources rather than continuing after resize or unmount.
- Share paragraphs remain real detail links; substantive body visibility,
  heading, return-navigation and hit-target checks remain enforced.
- Portfolio Sync HTTP/OpenAPI enhancements are included as source and tests only.
  This batch does not deploy the Worker, change project state/evidence merge
  semantics, or claim its new HTTP interface is already live.
- Incoming Agent-friendly runtime changes and pending conference summaries are
  separate intake batches, not silently included in these verification counts.
- The normal PR, CI, Cloudflare preview and production readback gates still apply.
  No DNS changes, purchases or customer-data writes are authorized by this record.

Related delivery PRs: [Dashboard #77](https://github.com/Tiancheng-Xu/fullstack-showcase/pull/77)
and [Profile #14](https://github.com/Tiancheng-Xu/Tiancheng-Xu/pull/14).
