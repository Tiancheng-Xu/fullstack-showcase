# Performance TOTP Control Design

## Decision

Shared TOTP is the only interactive authorization factor. The same Base32 secret may be enrolled on multiple trusted devices for the same operator cohort. Public status and verified snapshot reads remain open; session, start, and stop require a current TOTP code plus same-origin, a five-minute single-use nonce, and an idempotency key.

This is intentionally not per-user identity. Every enrolled device acts as the same operator cohort, and D1 stores only a one-way cohort hash. Removing one person requires rotating the shared TOTP secret on every retained device.

## Request flow

1. The operator enters a current six-digit TOTP code on the Baby2B control page.
2. The Worker verifies the code in constant time with a one-step clock window and applies the shared failure throttle.
3. A successful check creates a five-minute, single-use nonce in D1.
4. Start or stop repeats TOTP verification and requires exact origin, nonce, and idempotency key.
5. One D1 batch consumes the nonce, compare-and-swaps generation/state, records the operation, and applies an atomic guard.
6. The Worker signs a short-lived GitHub App JWT, exchanges it for an installation token, and dispatches one fixed BabySteps lifecycle workflow.
7. HMAC-authenticated callbacks update D1 and store validated, immutable snapshots in R2.

## Failure behavior

- Missing or invalid TOTP: `401`; five failures in five minutes lock the cohort for ten minutes.
- D1 throttle read/write failure: `503`, never fail open.
- Invalid origin, nonce, idempotency key, state, or generation: `403` or `409`, no dispatch.
- GitHub dispatch failure: state becomes `cleanup_required`; it is never represented as running.
- Stop or cleanup failure: state remains `cleanup_required`; another start is blocked.
- Missing valid snapshot: public UI says unavailable and never generates mock values.

## Fixed bounds

- One shared operator cohort, enrollable on multiple trusted devices.
- One repository and one fixed workflow.
- One live stack.
- 45-minute TTL with five-minute safety reconciliation.
- USD 0.20 estimated incremental cost cap.
- No browser-accessible Cloudflare, GitHub, or AWS credentials.

## Status

The implementation and local gates are complete. Production remains disabled until the real GitHub App identifiers, zero-residual AWS bootstrap callback, and production semantic readback are verified.
