# GitHub Profile Local Go Migration Design

## Goal

Add a local Go implementation of the existing GitHub profile API while keeping
the verified Hono implementation available for comparison. The Go service must
preserve the HTTP contract, macOS Keychain boundary, GitHub field whitelist,
Drizzle migration history, and SQLite data already used by the homework.

This milestone is local only. It does not deploy to AWS and does not change the
AWS homework status.

## Approved scope

The user approved the full contract-compatible option and authorized the
remaining implementation decisions. Hono remains on port 3000. Go listens on
port 3002. The React application continues to request relative `/api` URLs and
selects its local proxy target through non-secret server-side Vite configuration.

## Learning guidance

The design follows the locally available course notes under
`/Users/shier/Desktop/一灯学习笔记`: keep Go packages small, use standard library
interfaces and tests, preserve versioned SQL migrations, and make migration
failure observable and recoverable. Repository requirements and verified tests
take precedence. No private course-note content is copied into this repository.

## Architecture

```text
React profile form
  -> Vite /api proxy (Hono :3000 or Go :3002)
  -> Go net/http handlers
  -> macOS Keychain credential provider
  -> GitHub GET /user
  -> validated and whitelisted profile
  -> SQLite repository
  -> existing github_profiles table
```

The new Go module lives at `apps/api-go`:

- `cmd/server`: environment loading, dependency wiring, startup and shutdown.
- `internal/apperror`: stable safe errors and JSON envelopes.
- `internal/contracts`: request validation and response DTOs.
- `internal/keychain`: fixed-argument `/usr/bin/security` adapter.
- `internal/github`: authenticated GitHub client and upstream error mapping.
- `internal/profile`: SQLite read and idempotent upsert repository.
- `internal/migrations`: Drizzle-compatible migration reader and runner.
- `internal/httpapi`: routes, handlers, body limits, JSON and request logging.

The implementation uses Go's standard `net/http`, `encoding/json`, `context`,
`os/exec`, `database/sql`, and `crypto/sha256` packages. SQLite uses the
CGo-free `modernc.org/sqlite` driver, pinned by `go.mod` and `go.sum`.

## HTTP contract

Go implements the same routes and externally visible behavior as Hono:

- `GET /health`
- `GET /api/github/me`
- `GET /api/github-profile`
- `POST /api/github-profile`

Field names, nullability, numeric constraints, HTTP statuses, and error JSON
remain unchanged. POST accepts only `displayName` and `bio`, rejects unknown
fields and trailing JSON, trims strings, and enforces limits of 100 and 500
characters. On save, the server fetches immutable GitHub fields again before
persisting them.

## Database and migration compatibility

Both services default to `apps/api/data/github-profile.sqlite`, so switching
the frontend does not create a second source of truth.

`apps/api/drizzle` remains the only migration source. The Go runner reproduces
the relevant Drizzle behavior:

1. Discover child directories containing `migration.sql` and sort by name.
2. Split SQL on `--> statement-breakpoint`.
3. Derive `created_at` from the 14-digit UTC directory prefix.
4. Calculate SHA-256 from the original SQL bytes.
5. Use the same `__drizzle_migrations` columns and migration names.
6. Apply all pending statements and ledger rows in one transaction.

Consequently, either runtime recognizes migrations applied by the other. The
runner refuses an applied migration whose stored hash differs from the current
file, rolls back failed migrations, and validates the final `github_profiles`
columns before the server accepts traffic.

The Go database pool uses one open connection and a finite SQLite busy timeout.
This keeps local multi-process behavior predictable. The two servers may remain
open for comparison, but the frontend directs writes to only one target at a
time. Upsert by immutable GitHub ID preserves the existing one-row behavior.

## Credential and privacy boundary

The Go service calls `/usr/bin/security find-generic-password` with fixed
service and account arguments. The token is captured only in process memory,
trimmed, attached only to the outbound GitHub Authorization header, and never
included in application logs or errors.

No token is accepted from the browser, command line, database, fixture, source
file, `VITE_` variable, screenshot, or documentation. GitHub responses are
decoded into an internal upstream structure and copied into the existing public
whitelist. Response bodies from failed GitHub calls are not exposed.

## Errors and operational behavior

Go preserves the existing safe codes, including:

- `GITHUB_TOKEN_MISSING` and `GITHUB_CREDENTIAL_UNAVAILABLE`
- `GITHUB_AUTH_FAILED`, `GITHUB_RATE_LIMITED`, and `GITHUB_FORBIDDEN`
- `GITHUB_UNAVAILABLE`
- `VALIDATION_FAILED`, `PROFILE_NOT_FOUND`, and `PERSISTENCE_FAILED`

GitHub calls have a five-second timeout and inherit request cancellation. POST
bodies have a small explicit byte limit. Logs contain method, route, status and
duration only; they omit headers, request bodies, GitHub bodies, SQL and local
credential output. Shutdown is graceful and bounded.

## Local developer workflow

The existing `pnpm dev` path remains Hono plus React. New root scripts provide
an explicit Go path:

- `pnpm dev:go`: migrate/start Go on 3002 and start React with its proxy aimed
  at 3002.
- `pnpm test:go`: run Go tests.
- `pnpm typecheck:go`: run `go vet`.
- `pnpm build:go`: build the Go server without committing the binary.

An `apps/api-go/package.json` workspace adapter keeps root pnpm orchestration
consistent while the Go module remains independently runnable.

## Test-driven implementation and acceptance

Every component begins with a failing Go test, followed by the smallest
implementation and a focused regression run. Coverage includes:

- strict request decoding and exact response JSON;
- every GitHub upstream error mapping and malformed response;
- Keychain success, missing item, command failure and cancellation without
  logging the credential;
- migration ordering, hashes, cross-runtime ledger compatibility, rollback and
  schema validation;
- reading, inserting and repeated upsert against temporary SQLite databases;
- all four routes through an in-process HTTP server;
- structural secret-boundary and workspace-script checks.

Final automated verification runs the existing structure, API and web suites,
then `pnpm check`, `pnpm test`, `pnpm typecheck`, `pnpm build`, and the Go-specific
gates. The verified Hono path must remain green.

Final visible acceptance uses only the Codex in-app browser. Before each click,
the purpose, location and expected result are explained. With the frontend
proxied to Go, acceptance reads `Tiancheng-Xu`, edits name and biography, saves,
refreshes, confirms persistence, repeats save and verifies one database row,
then temporarily changes the non-secret Keychain service name to confirm a safe
error before restoring it. No credential value appears in UI evidence.

## Documentation and status

`docs/qa/github-profile-fullstack.md` receives a separate Go-local evidence
section with commands, observations, port and sanitized database assertions.
`HOMEWORKS.md` records local Go migration as complete only after all automated
and visible checks pass. Local full-stack and local visual acceptance remain
complete; AWS remains pending.

## Non-goals

- AWS, production hosting, SAM, Lambda, ECS, VPC or IAM changes.
- Removing or rewriting the Hono API.
- Multi-user application authentication.
- Repository, organization, email or other GitHub permissions.
- Token rotation, revocation or recreation.
- Pushing the branch or opening a pull request.
