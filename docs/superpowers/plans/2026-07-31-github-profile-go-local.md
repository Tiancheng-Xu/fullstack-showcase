# GitHub Profile Local Go Migration Implementation Plan

> **Execution rule:** Implement each task with a red-green-refactor cycle. Do
> not remove the verified Hono path, expose credentials, deploy to AWS, push the
> branch, or mark AWS complete.

**Goal:** Add a local Go API on port 3002 that is contract-, migration-, data-,
and security-compatible with the existing Hono GitHub profile API on port 3000.

**Architecture:** A new `apps/api-go` module uses `net/http`, `database/sql`,
`modernc.org/sqlite`, macOS Keychain and the GitHub `/user` endpoint. It reads
the existing Drizzle SQL directory and migration ledger, shares the existing
SQLite file, and serves the four established routes. Vite selects Hono or Go
through the server-only `API_PROXY_TARGET` variable.

**Tech stack:** Go 1.26, Go standard library, `modernc.org/sqlite` 1.55,
SQLite, pnpm workspace scripts, React/Vite, existing TypeScript contracts and
Vitest suites.

## Global constraints

- Work in the existing isolated worktree on branch
  `codex/github-profile-go-local`.
- Use `apps/api/drizzle` as the only SQL migration source.
- Default Go paths are relative to `apps/api-go`: database
  `../api/data/github-profile.sqlite`, migrations `../api/drizzle`, port 3002.
- Token lookup defaults remain service `course-homework.github-profile` and
  account `Tiancheng-Xu`.
- Never print Keychain stdout, Authorization headers, request bodies, GitHub
  failure bodies, SQL, token-like strings or credentials.
- Keep Hono's default port 3000 and existing root `pnpm dev` behavior.
- Use only the Codex in-app browser for visible acceptance; explain every click
  before performing it.

---

### Task 1: Go workspace adapter, configuration, contracts and errors

**Files:**

- Create `apps/api-go/go.mod`
- Create `apps/api-go/package.json`
- Create `apps/api-go/internal/config/config.go`
- Create `apps/api-go/internal/config/config_test.go`
- Create `apps/api-go/internal/contracts/profile.go`
- Create `apps/api-go/internal/contracts/profile_test.go`
- Create `apps/api-go/internal/apperror/error.go`
- Create `apps/api-go/internal/apperror/error_test.go`

1. Write failing tests for defaults, port/path overrides, strict editable-field
   validation, whitespace trimming, null handling, maximum lengths and stable
   error envelopes.
2. Run `go test ./internal/config ./internal/contracts ./internal/apperror` from
   `apps/api-go` and confirm the missing implementation fails.
3. Add the module and minimal implementations. Model nullable strings with
   pointers so JSON null remains distinguishable and exact.
4. Re-run the focused tests until green, then run `gofmt`.

### Task 2: Drizzle-compatible Go migration runner

**Files:**

- Create `apps/api-go/internal/migrations/migrations.go`
- Create `apps/api-go/internal/migrations/migrations_test.go`
- Create `apps/api-go/internal/testdb/testdb.go`
- Create `apps/api-go/cmd/migrate/main.go`

1. Write tests that load the real `apps/api/drizzle` directory and assert
   lexical order, UTC timestamps, exact SHA-256 and statement splitting.
2. Add integration tests for empty-database migration, the exact current
   `__drizzle_migrations` schema, idempotent second execution, recognition of a
   Node/Drizzle-style ledger row, stored-hash mismatch rejection, failed-SQL
   rollback and final `github_profiles` column validation.
3. Run the focused package test and verify it fails before implementation.
4. Implement discovery and one-transaction application with parameterized
   ledger inserts. Do not interpret arbitrary paths or interpolate data into
   SQL statements.
5. Add the CGo-free SQLite driver, restrict the pool to one open connection,
   configure a finite busy timeout and expose a migration CLI.
6. Re-run focused tests, `go test -race ./internal/migrations`, and format.

### Task 3: SQLite profile repository

**Files:**

- Create `apps/api-go/internal/profile/repository.go`
- Create `apps/api-go/internal/profile/repository_test.go`

1. Write failing tests for no saved row, inserting a complete profile, reading
   the latest profile, nullable fields, updating the same GitHub ID without a
   duplicate, updating a renamed login, and safe persistence errors.
2. Migrate a temporary database through the Go runner in every integration
   fixture so repository tests exercise the shared real schema.
3. Implement parameterized queries and an `ON CONFLICT(github_id) DO UPDATE`
   upsert. Convert timestamps without changing the existing JSON strings.
4. Verify the focused tests and race test pass.

### Task 4: Keychain and GitHub adapters

**Files:**

- Create `apps/api-go/internal/keychain/provider.go`
- Create `apps/api-go/internal/keychain/provider_test.go`
- Create `apps/api-go/internal/github/client.go`
- Create `apps/api-go/internal/github/client_test.go`

1. Define small injectable command and HTTP interfaces. Write failing tests for
   fixed `/usr/bin/security` arguments, trimmed output, missing item, generic
   command failure and cancellation. Assertions must prove returned errors do
   not contain mocked token text.
2. Write failing HTTP tests for the required GitHub headers, whitelisted field
   mapping, synchronized timestamp and these mappings: 401, rate-limited 403,
   ordinary 403, timeout/network error, non-2xx, malformed JSON and invalid
   required fields.
3. Implement the smallest adapters with five-second request timeout. Limit the
   GitHub response body and never include its contents in returned errors.
4. Run both focused test packages with the race detector and format.

### Task 5: HTTP application and production wiring

**Files:**

- Create `apps/api-go/internal/httpapi/api.go`
- Create `apps/api-go/internal/httpapi/api_test.go`
- Create `apps/api-go/cmd/server/main.go`

1. Write failing in-process HTTP tests for all four routes, methods, exact JSON
   content type, strict POST decoding, body-size limit, trailing JSON rejection,
   GitHub re-fetch on save and every safe error envelope.
2. Test request logs with injected buffers and assert that headers, bodies and
   credential-like fixture strings are absent.
3. Implement `http.ServeMux` handlers and status-recording middleware. Preserve
   the Hono contract; unsupported methods return a safe JSON error.
4. Wire config, migration validation, database, Keychain, GitHub and repository
   dependencies. Add bounded graceful shutdown for interrupt/termination.
5. Run `go test -race ./...`, `go vet ./...`, format and build the server.

### Task 6: Workspace commands, frontend proxy and structural safety

**Files:**

- Modify `package.json`
- Modify `apps/web/vite.config.ts`
- Modify `.gitignore`
- Modify `scripts/__tests__/github-profile-secret-boundary.test.mjs`
- Modify or create a focused Vite configuration test if required
- Generate `apps/api-go/go.sum`

1. Extend structural tests first so they require the Go module, port 3002,
   shared migration/database configuration, root Go gates and absence of token
   literals or `VITE_` credential variables in Go/workspace files.
2. Run `pnpm test:structure` and confirm the new assertions fail.
3. Make Vite use `process.env.API_PROXY_TARGET ?? "http://localhost:3000"`.
   Because the name lacks `VITE_`, it is consumed by Vite's local server config
   and is not exposed to browser code.
4. Add root `dev:go`, `test:go`, `typecheck:go`, `build:go` and Go format-check
   integration while keeping the existing commands green.
5. Ignore only generated Go binaries/build directories and local SQLite sidecar
   files; do not ignore source, modules or migrations.
6. Run structural, API, web and Go tests plus typechecks and builds.

### Task 7: Automated verification and local visible acceptance

**Files:**

- Modify `docs/qa/github-profile-fullstack.md`
- Modify `HOMEWORKS.md`
- Modify `apps/api/README.md` or create `apps/api-go/README.md`

1. From a clean process state, run Go migration against the existing local
   database and verify `/health` returns 200 on port 3002.
2. Run fresh final gates:
   - `pnpm check`
   - `pnpm test`
   - `pnpm typecheck`
   - `pnpm build`
   - `pnpm test:go`
   - `pnpm typecheck:go`
   - `pnpm build:go`
   - `go test -race ./...` in `apps/api-go`
3. Start Go on 3002 and React on 3001 with `API_PROXY_TARGET` aimed at Go.
4. In the in-app browser only, explain then perform: open the homework page,
   read `Tiancheng-Xu`, edit name/biography, save, refresh, repeat save and
   observe the safe missing-credential state during a temporary non-secret
   Keychain service-name override; restore the default afterward.
5. Query only the sanitized row count and public profile columns to prove the
   duplicate save still leaves one row. Never query or display Keychain data.
6. Record commands, observed statuses, port, migration compatibility and
   sanitized UI results. Mark local Go migration complete only now. Keep AWS
   pending.
7. Run `git diff --check`, inspect the full diff for credentials/generated
   binaries, and create the final local commit. Do not push.

## Definition of done

- Hono and Go both satisfy the same API contract and access the same migrated
  SQLite data.
- Either migration runner recognizes the other's ledger without replay.
- Existing TypeScript checks remain green and all Go checks are green.
- The in-app browser proves the React page works through Go without showing or
  accepting a token.
- Documentation distinguishes local Go completion from pending AWS work.
- The branch contains no secret, database, generated binary, push or deployment.
