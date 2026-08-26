# Performance MFA Control Design

## Decision

Cloudflare Access Independent MFA is the only interactive authorization authority. Public status and snapshot reads remain open. The control session, start, and stop routes are protected by Access and independently verify the Access JWT at the Worker. A GitHub App installation token can dispatch only one fixed BabySteps lifecycle workflow.

## Request flow

1. The operator opens the public control page and requests a protected control session.
2. Cloudflare Access verifies the allowlisted identity and independent MFA.
3. The Worker verifies issuer, audience, expiry, signature, and allowlisted identity; it returns a short-lived single-use nonce.
4. Start or stop requires same-origin, nonce, idempotency key, and a valid Access assertion.
5. D1 performs a generation-aware transition before the Worker obtains a short-lived GitHub App installation token and dispatches the fixed workflow.
6. Authenticated workflow callbacks update D1 and store validated immutable snapshots in R2.

## Failure behavior

- Missing or invalid Access assertion: `401` or `403`, no state change.
- Invalid origin, nonce, or idempotency key: `403` or `409`, no dispatch.
- GitHub dispatch failure: operation becomes retryable failure; it is never represented as running.
- Stop or cleanup failure: state becomes `cleanup_required`; another start is blocked.
- Missing valid snapshot: public UI says unavailable and never generates mock values.

## Fixed bounds

- One operator allowlist.
- One repository and one workflow.
- One live stack.
- 45-minute TTL.
- USD 0.20 estimated incremental cost cap.
- No browser-accessible cloud credentials.

## Status

This document is the frozen implementation contract. Cloudflare Access enrollment, production URLs, and measured run evidence are added only after verification.
