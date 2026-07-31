# GitHub Profile Full-Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the chapter's first mandatory full-stack homework path from a React review form through a Hono API into a Drizzle-migrated SQLite database, using a server-only fine-grained GitHub token.

**Architecture:** The flattened pnpm monorepo gains a Node 22 Hono app at `apps/api` and a GitHub profile route in the existing React app at `apps/web`. The API obtains a fine-grained token from macOS Keychain through a server-only credential provider, fetches GitHub identity, accepts only reviewed name and biography from the browser, re-fetches immutable GitHub fields before an idempotent Drizzle upsert, and stores the final profile in a local `node:sqlite` database.

**Tech Stack:** Node.js 22.23+, pnpm 11.17.0, TypeScript 6, Hono, Zod 4, Drizzle ORM/Kit, Node `node:sqlite`, React 19, TanStack Router, Vite 8, Vitest, Testing Library, Biome.

## Global Constraints

- Work only in `/Users/shier/Desktop/course-homework/.tc-worktrees/github-profile-fullstack-20260731` on branch `tc/github-profile-fullstack-20260731`.
- Save the real token only through the macOS Keychain Access graphical interface under service `course-homework.github-profile` and account `Tiancheng-Xu`; never expose it through an environment file, terminal input, `VITE_` variable, API response, browser storage, database column, fixture, screenshot, log, commit, or CI output.
- Use a new fine-grained personal access token with no repository, organization, or write permissions.
- Persist only the whitelisted GitHub profile fields defined in the design.
- Browser input may modify only `displayName` and `bio`; immutable identity and metrics are fetched again by the server during save.
- Keep AWS SAM, VPC, Lambda, ECS, production deployment, multi-user authentication, and the Go migration out of this feature.
- Use the in-app browser for visible GitHub and local UI operations; use the terminal only for installation, local processes, migrations, tests, and sanitized database assertions.
- Explain the purpose and expected result before every browser or terminal operation shown to the user.
- Complete every task with a red-green test cycle and a focused commit.

## File Map

### API application

- `apps/api/package.json`: API scripts and dependencies.
- `apps/api/tsconfig.json`: strict Node/TypeScript configuration.
- `apps/api/vitest.config.ts`: Node test configuration.
- `apps/api/tsup.config.ts`: Node ESM build entry.
- `apps/api/.env.example`: non-secret Keychain lookup names, database path, and port.
- `apps/api/drizzle.config.ts`: SQLite schema, migration output, and local database URL.
- `apps/api/src/contracts/github-profile.ts`: Zod request/response schemas and shared types.
- `apps/api/src/errors/app-error.ts`: stable safe API errors.
- `apps/api/src/auth/keychain-token-provider.ts`: server-only macOS Keychain adapter.
- `apps/api/src/github/github-client.ts`: authenticated GitHub `/user` adapter and upstream error mapping.
- `apps/api/src/db/schema.ts`: final `github_profiles` Drizzle schema.
- `apps/api/src/db/database.ts`: `node:sqlite` and Drizzle connection factory.
- `apps/api/src/db/profile-repository.ts`: find and idempotent upsert operations.
- `apps/api/src/app.ts`: dependency-injected Hono routes.
- `apps/api/src/env.ts`: server environment validation.
- `apps/api/src/server.ts`: production wiring and port 3000 listener.
- `apps/api/drizzle/create_github_profiles/`: generated initial migration and snapshot.
- `apps/api/drizzle/add_profile_metrics/`: generated add-column migration and snapshot.
- `apps/api/drizzle/remove_location/`: generated drop-column migration and snapshot.
- `apps/api/src/**/*.test.ts`: focused API, client, repository, and migration tests.

### Web application

- `apps/web/vite.config.ts`: local `/api` proxy to Hono on port 3000.
- `apps/web/package.json`: type-safe workspace dependency on the API's public contract export.
- `apps/web/src/features/github-profile/github-profile-api.ts`: browser API adapter.
- `apps/web/src/features/github-profile/github-profile-content.tsx`: review form and UI state machine.
- `apps/web/src/features/github-profile/github-profile-content.test.tsx`: user-flow tests.
- `apps/web/src/routes/homework.github-profile.tsx`: TanStack route at `/homework/github-profile`.
- `apps/web/src/features/nurture/profile-content.tsx`: visible link from the existing “我的” page.

### Repository and evidence

- `package.json`: combined local dev, test, typecheck, and build commands.
- `pnpm-lock.yaml`: locked API dependencies.
- `.gitignore`: local SQLite files and API environment files.
- `scripts/__tests__/github-profile-secret-boundary.test.mjs`: repository-level secret boundary checks.
- `apps/api/README.md`: API setup, migration, token expiry, and revocation instructions.
- `docs/qa/github-profile-fullstack.md`: sanitized homework evidence and browser verification checklist.

---

### Task 1: API package, contracts, and secret boundary

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/tsup.config.ts`
- Create: `apps/api/.env.example`
- Create: `apps/api/src/contracts/github-profile.ts`
- Create: `apps/api/src/errors/app-error.ts`
- Create: `apps/api/src/contracts/github-profile.test.ts`
- Create: `scripts/__tests__/github-profile-secret-boundary.test.mjs`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `GitHubProfile`, `SaveGitHubProfileInput`, `ApiErrorBody`, `githubProfileSchema`, `saveGitHubProfileInputSchema`, and `AppError` for every later API task.
- Consumes: existing pnpm workspace, Zod 4, root Biome configuration, and root structural test runner.

- [ ] **Step 1: Write failing contract and secret-boundary tests**

Create tests that require strict whitelisting and prevent secret-bearing files or frontend variables:

```ts
import { describe, expect, it } from "vitest";
import {
	githubProfileSchema,
	saveGitHubProfileInputSchema,
} from "./github-profile";

describe("GitHub profile contracts", () => {
	it("accepts the whitelisted GitHub profile", () => {
		expect(
			githubProfileSchema.parse({
				githubId: 42,
				login: "Tiancheng-Xu",
				displayName: "Tiancheng Xu",
				bio: null,
				avatarUrl: "https://avatars.githubusercontent.com/u/42?v=4",
				profileUrl: "https://github.com/Tiancheng-Xu",
				publicRepos: 3,
				followers: 2,
				githubCreatedAt: "2020-01-01T00:00:00Z",
				syncedAt: "2026-07-31T12:00:00Z",
			}),
		).toMatchObject({ githubId: 42, login: "Tiancheng-Xu" });
	});

	it("rejects immutable GitHub fields in the save body", () => {
		expect(() =>
			saveGitHubProfileInputSchema.parse({
				displayName: "Edited name",
				bio: "Edited bio",
				githubId: 999,
			}),
		).toThrow();
	});
});
```

The structural test must recursively inspect tracked source/config files and fail when it finds `github_pat_`, any `GITHUB_TOKEN=` assignment, or `VITE_GITHUB_TOKEN`.

- [ ] **Step 2: Run tests and verify the new requirements fail**

Run: `pnpm test:structure`

Expected: FAIL because `github-profile-secret-boundary.test.mjs` and the API package do not exist yet.

- [ ] **Step 3: Create the API package and install dependencies**

Use package name `@course-homework/api` and these scripts:

```json
{
  "scripts": {
    "build": "tsup",
    "db:check": "drizzle-kit check",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "dev": "tsx watch src/server.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

Expose only the browser-safe contract subpath:

```json
{
  "exports": {
    "./contracts": "./src/contracts/github-profile.ts"
  }
}
```

Install runtime packages with:

```bash
pnpm --filter @course-homework/api add @hono/node-server drizzle-orm@rc dotenv hono zod
```

Install development packages with:

```bash
pnpm --filter @course-homework/api add -D @types/node drizzle-kit@rc tsup tsx typescript vitest
```

The package exports no secret-bearing runtime module to the web application;
the only public subpath is `@course-homework/api/contracts`.

- [ ] **Step 4: Implement strict contracts and stable errors**

Implement exact schemas:

```ts
import { z } from "zod";

const nullableTrimmed = (max: number) =>
	z.string().trim().max(max).nullable();

export const githubProfileSchema = z
	.object({
		githubId: z.number().int().positive(),
		login: z.string().min(1).max(39),
		displayName: nullableTrimmed(100),
		bio: nullableTrimmed(500),
		avatarUrl: z.url().startsWith("https://avatars.githubusercontent.com/"),
		profileUrl: z.url().startsWith("https://github.com/"),
		publicRepos: z.number().int().nonnegative(),
		followers: z.number().int().nonnegative(),
		githubCreatedAt: z.iso.datetime(),
		syncedAt: z.iso.datetime(),
	})
	.strict();

export const saveGitHubProfileInputSchema = z
	.object({
		displayName: nullableTrimmed(100),
		bio: nullableTrimmed(500),
	})
	.strict();

export const apiErrorBodySchema = z.object({
	error: z.object({
		code: z.string().min(1),
		message: z.string().min(1),
	}),
});

export type GitHubProfile = z.infer<typeof githubProfileSchema>;
export type SaveGitHubProfileInput = z.infer<
	typeof saveGitHubProfileInputSchema
>;
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
```

`AppError` must contain `status`, `code`, `safeMessage`, and an optional non-enumerable `cause`; serialization returns only `{ error: { code, message } }`.

- [ ] **Step 5: Add ignored local files and safe examples**

Append these ignore rules:

```gitignore
apps/api/.env
apps/api/data/
*.sqlite
*.sqlite-shm
*.sqlite-wal
```

Create `apps/api/.env.example` containing only:

```dotenv
KEYCHAIN_SERVICE=course-homework.github-profile
KEYCHAIN_ACCOUNT=Tiancheng-Xu
DB_FILE_NAME=./data/github-profile.sqlite
PORT=3000
```

The structural test rejects every `github_pat_` value because no token example is needed.

- [ ] **Step 6: Run the focused tests**

Run: `pnpm --filter @course-homework/api test -- src/contracts/github-profile.test.ts`

Expected: PASS with two contract tests.

Run: `pnpm test:structure`

Expected: PASS without printing any token value.

- [ ] **Step 7: Commit the foundation**

```bash
git add .gitignore package.json pnpm-lock.yaml apps/api scripts/__tests__/github-profile-secret-boundary.test.mjs
git commit -m "feat: establish GitHub profile API contracts"
```

---

### Task 2: macOS Keychain provider and authenticated GitHub client

**Files:**
- Create: `apps/api/src/auth/keychain-token-provider.ts`
- Create: `apps/api/src/auth/keychain-token-provider.test.ts`
- Create: `apps/api/src/github/github-client.ts`
- Create: `apps/api/src/github/github-client.test.ts`

**Interfaces:**
- Consumes: `GitHubProfile` and `githubProfileSchema` from Task 1; `AppError` from Task 1.
- Produces: `GitHubTokenProvider`, `createMacOSKeychainTokenProvider({ service, account, execFileFn })`, `GitHubProfileSource`, and `createGitHubProfileClient({ tokenProvider, fetchFn, now, timeoutMs })` for the Hono app.

- [ ] **Step 1: Write failing Keychain provider tests**

Inject `execFileFn` and assert the provider calls `/usr/bin/security` with only:

```ts
[
	"find-generic-password",
	"-s",
	"course-homework.github-profile",
	"-a",
	"Tiancheng-Xu",
	"-w",
]
```

The success fixture returns `"test-token\n"` and expects `"test-token"`. A Keychain item-not-found exit maps to `undefined`; every other execution error becomes `503 GITHUB_CREDENTIAL_UNAVAILABLE` without stdout, stderr, command arguments, or cause text in the safe message.

- [ ] **Step 2: Run the Keychain tests and verify failure**

Run: `pnpm --filter @course-homework/api test -- src/auth/keychain-token-provider.test.ts`

Expected: FAIL because `createMacOSKeychainTokenProvider` is missing.

- [ ] **Step 3: Implement the Keychain credential boundary**

Expose:

```ts
export interface GitHubTokenProvider {
	getToken(): Promise<string | undefined>;
}

export interface KeychainTokenProviderOptions {
	service: string;
	account: string;
	execFileFn?: typeof execFile;
}
```

Invoke `/usr/bin/security` with `execFile`, the fixed argument array above, UTF-8 decoding, and a 4096-byte output limit. Return only trimmed stdout to the GitHub client. Never log stdout, stderr, the resolved token, or the error cause.

- [ ] **Step 4: Run the Keychain provider tests**

Run: `pnpm --filter @course-homework/api test -- src/auth/keychain-token-provider.test.ts`

Expected: PASS for found, missing, and unavailable Keychain cases.

- [ ] **Step 5: Write failing GitHub client tests**

Cover the successful mapping with an injected provider:

```ts
const client = createGitHubProfileClient({
	tokenProvider: { getToken: async () => "test-token" },
	fetchFn,
	now: () => new Date("2026-07-31T12:00:00Z"),
	timeoutMs: 5000,
});

const result = await client.fetchAuthenticatedProfile();
expect(result).not.toHaveProperty("email");
expect(result).toMatchObject({ githubId: 42, publicRepos: 3 });
```

The mocked GitHub response includes the documented whitelisted fields plus an `email` field that must not leak. Add separate assertions for provider-returned `undefined` becoming `503 GITHUB_TOKEN_MISSING`, `401 GITHUB_AUTH_FAILED`, rate-limited `403` becoming `429 GITHUB_RATE_LIMITED`, ordinary `403 GITHUB_FORBIDDEN`, upstream `500` becoming `502 GITHUB_UNAVAILABLE`, invalid JSON/shape becoming `502 GITHUB_UNAVAILABLE`, and an aborted request becoming `502 GITHUB_UNAVAILABLE`.

- [ ] **Step 6: Run the GitHub client tests and verify failure**

Run: `pnpm --filter @course-homework/api test -- src/github/github-client.test.ts`

Expected: FAIL because `createGitHubProfileClient` is missing.

- [ ] **Step 7: Implement the GitHub adapter**

Use this constructor contract:

```ts
export interface GitHubProfileSource {
	fetchAuthenticatedProfile(): Promise<GitHubProfile>;
}

export interface GitHubClientOptions {
	tokenProvider: GitHubTokenProvider;
	fetchFn?: typeof fetch;
	now?: () => Date;
	timeoutMs?: number;
}
```

Call `tokenProvider.getToken()` immediately before every GitHub request. If it returns `undefined`, throw `503 GITHUB_TOKEN_MISSING`. Call only `https://api.github.com/user` and send these headers:

```ts
{
	Accept: "application/vnd.github+json",
	Authorization: `Bearer ${token}`,
	"X-GitHub-Api-Version": "2026-03-10",
	"User-Agent": "course-homework-github-profile",
}
```

Map and validate the whitelisted camel-case DTO with `githubProfileSchema`. Never include response bodies, request headers, Keychain output, or token text in errors. Use `AbortSignal.timeout(timeoutMs)` and never retry authentication failures.

- [ ] **Step 8: Run client tests and the secret scan**

Run: `pnpm --filter @course-homework/api test -- src/auth src/github`

Expected: PASS for Keychain lookup, success, whitelist, status mapping, malformed response, and timeout cases.

Run: `pnpm test:structure`

Expected: PASS; fixture token text is generic and no fine-grained token prefix exists.

- [ ] **Step 9: Commit the credential and GitHub adapters**

```bash
git add apps/api/src/auth apps/api/src/github
git commit -m "feat: read GitHub credentials from macOS Keychain"
```

---

### Task 3: Drizzle migration history and profile repository

**Files:**
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/database.ts`
- Create: `apps/api/src/db/profile-repository.ts`
- Create: `apps/api/src/db/migrations.test.ts`
- Create: `apps/api/src/db/profile-repository.test.ts`
- Generate: `apps/api/drizzle/create_github_profiles/`
- Generate: `apps/api/drizzle/add_profile_metrics/`
- Generate: `apps/api/drizzle/remove_location/`

**Interfaces:**
- Consumes: `GitHubProfile` from Task 1.
- Produces: `createDatabase(path)`, `ProfileRepository`, and `createProfileRepository(db, now)` for Task 4.

- [ ] **Step 1: Write failing migration and repository tests**

The migration test must:

1. Discover the three named migration directories in lexical creation order from Drizzle metadata.
2. Read Drizzle's generated migration metadata and apply `create_github_profiles/migration.sql` first to an in-memory `DatabaseSync`.
3. Insert a row containing `location = 'New York'`.
4. Apply `add_profile_metrics/migration.sql` and `remove_location/migration.sql`.
5. Assert that `PRAGMA table_info(github_profiles)` contains the final columns and excludes `location`.
6. Assert that the seeded `github_id`, `login`, and `display_name` remain unchanged.
7. Assert database constraints reject negative `public_repos` and duplicate `login` values.

The repository test must prove:

```ts
await repository.upsert(profile);
await repository.upsert({ ...profile, bio: "Updated" });

expect(await repository.findLatest()).toMatchObject({
	githubId: 42,
	bio: "Updated",
});
expect(sqlite.prepare("select count(*) as count from github_profiles").get())
	.toEqual({ count: 1 });
```

- [ ] **Step 2: Run database tests and verify failure**

Run: `pnpm --filter @course-homework/api test -- src/db`

Expected: FAIL because the schema, migrations, connection, and repository are missing.

- [ ] **Step 3: Configure Drizzle and generate the initial migration**

Configure SQLite with:

```ts
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dbCredentials: { url: process.env.DB_FILE_NAME ?? "./data/github-profile.sqlite" },
	migrations: { prefix: "none" },
});
```

Create the initial schema with `githubId`, `login`, `displayName`, `location`, `avatarUrl`, `profileUrl`, `githubCreatedAt`, `createdAt`, and `updatedAt`. Add unique login and HTTPS/GitHub URL checks.

Run: `pnpm --filter @course-homework/api db:generate --name=create_github_profiles`

Expected: Drizzle creates `apps/api/drizzle/create_github_profiles/` containing `migration.sql` and its schema snapshot.

- [ ] **Step 4: Generate the add-field migration**

Modify the schema to retain `location` and add nullable `bio`, non-negative `publicRepos` and `followers` with database defaults of `0`, plus required `syncedAt` with a database default of the current timestamp. These defaults make the migration valid for the fixture inserted after migration 0001.

Run: `pnpm --filter @course-homework/api db:generate --name=add_profile_metrics`

Expected: Drizzle creates `apps/api/drizzle/add_profile_metrics/` with only the required additions and any table-copy SQL needed by SQLite.

- [ ] **Step 5: Generate the drop-field migration and finalize the schema**

Remove only `location` from `schema.ts`.

Run: `pnpm --filter @course-homework/api db:generate --name=remove_location`

Expected: Drizzle creates `apps/api/drizzle/remove_location/`; the final TypeScript schema exactly matches the design data model.

- [ ] **Step 6: Implement the connection and repository**

`createDatabase(path)` creates the parent directory for file databases, opens `DatabaseSync`, enables foreign keys, and returns both the raw client and `drizzle({ client: sqlite })` for deterministic shutdown and tests.

`ProfileRepository` exposes exactly:

```ts
export interface ProfileRepository {
	findLatest(): Promise<GitHubProfile | null>;
	upsert(profile: GitHubProfile): Promise<GitHubProfile>;
}
```

The upsert uses `githubId` as the conflict target, updates every GitHub-sourced field plus `displayName`, `bio`, `syncedAt`, and `updatedAt`, and preserves the original `createdAt`.

- [ ] **Step 7: Run migration consistency and database tests**

Run: `pnpm --filter @course-homework/api db:check`

Expected: PASS with a consistent three-migration history.

Run: `pnpm --filter @course-homework/api test -- src/db`

Expected: PASS for add/drop migration evidence, retained fixture data, constraints, lookup, and idempotent upsert.

- [ ] **Step 8: Commit the database chain**

```bash
git add apps/api/drizzle.config.ts apps/api/drizzle apps/api/src/db
git commit -m "feat: persist GitHub profiles with Drizzle migrations"
```

---

### Task 4: Hono API routes and stable error semantics

**Files:**
- Create: `apps/api/src/env.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/app.test.ts`
- Create: `apps/api/src/server.ts`

**Interfaces:**
- Consumes: `GitHubProfileSource` from Task 2, `ProfileRepository` from Task 3, and Task 1 contracts/errors.
- Produces: `createApp({ github, profiles })`, `AppType`, and local API endpoints for the web application.

- [ ] **Step 1: Write failing route tests with injected fakes**

Use `app.request()` without opening a network port and verify:

- `GET /health` returns `{ "status": "ok" }`.
- `GET /api/github/me` returns the whitelisted GitHub profile.
- `POST /api/github-profile` rejects an extra `githubId` field with `400 VALIDATION_FAILED`.
- `POST /api/github-profile` re-fetches GitHub, combines only `displayName` and `bio`, upserts once, and returns the saved profile.
- `GET /api/github-profile` returns `404 PROFILE_NOT_FOUND` when empty and returns the saved profile otherwise.
- Every `AppError` returns only `{ error: { code, message } }`.
- Unexpected errors return `500 INTERNAL_ERROR` without stack, SQL, token, or cause text.

- [ ] **Step 2: Run the route tests and verify failure**

Run: `pnpm --filter @course-homework/api test -- src/app.test.ts`

Expected: FAIL because `createApp` is missing.

- [ ] **Step 3: Implement the dependency-injected Hono app**

Use this dependency boundary:

```ts
export interface AppDependencies {
	github: GitHubProfileSource;
	profiles: ProfileRepository;
}

export function createApp({ github, profiles }: AppDependencies) {
	const app = new Hono();
	// health and profile routes
	return app;
}

export type AppType = ReturnType<typeof createApp>;
```

The save route parses a strict body, calls `github.fetchAuthenticatedProfile()` again, merges only `displayName` and `bio`, then calls `profiles.upsert()`.

- [ ] **Step 4: Wire validated environment and the Node server**

Validate exactly:

```ts
const serverEnvSchema = z.object({
	KEYCHAIN_SERVICE: z.string().min(1).default("course-homework.github-profile"),
	KEYCHAIN_ACCOUNT: z.string().min(1).default("Tiancheng-Xu"),
	DB_FILE_NAME: z.string().min(1).default("./data/github-profile.sqlite"),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});
```

`server.ts` loads non-secret settings from `apps/api/.env` when present, creates the macOS Keychain provider, GitHub client, and database repository, starts Hono with `@hono/node-server`, and closes `DatabaseSync` on `SIGINT` or `SIGTERM`. A missing Keychain item does not prevent startup; the GitHub client returns `503 GITHUB_TOKEN_MISSING` only when a GitHub read is requested. The server never prints Keychain output or environment values.

- [ ] **Step 5: Run API tests, typecheck, and build**

Run: `pnpm --filter @course-homework/api test`

Expected: PASS for contracts, GitHub client, migrations, repository, and routes.

Run: `pnpm --filter @course-homework/api typecheck`

Expected: PASS with no TypeScript diagnostics.

Run: `pnpm --filter @course-homework/api build`

Expected: PASS and create `apps/api/dist/server.js` without embedding a real token.

- [ ] **Step 6: Commit the Hono API**

```bash
git add apps/api/src/env.ts apps/api/src/app.ts apps/api/src/app.test.ts apps/api/src/server.ts apps/api/tsup.config.ts
git commit -m "feat: expose GitHub profile Hono API"
```

---

### Task 5: React GitHub profile review form

**Files:**
- Create: `apps/web/src/features/github-profile/github-profile-api.ts`
- Create: `apps/web/src/features/github-profile/github-profile-content.tsx`
- Create: `apps/web/src/features/github-profile/github-profile-content.test.tsx`
- Create: `apps/web/src/routes/homework.github-profile.tsx`
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/features/nurture/profile-content.tsx`
- Modify: `apps/web/vite.config.ts`

**Interfaces:**
- Consumes: `GET /api/github/me`, `POST /api/github-profile`, and `GET /api/github-profile` from Task 4.
- Consumes: `GitHubProfile`, `SaveGitHubProfileInput`, and their Zod schemas from `@course-homework/api/contracts`.
- Produces: accessible route `/homework/github-profile` and a link from the existing “我的” page.

- [ ] **Step 1: Write failing browser-facing component tests**

Test the complete visible state machine with an injected `GitHubProfileApi` fake:

```ts
export interface GitHubProfileApi {
	readFromGitHub(): Promise<GitHubProfile>;
	readSaved(): Promise<GitHubProfile | null>;
	save(input: SaveGitHubProfileInput): Promise<GitHubProfile>;
}
```

Required assertions:

- Initial load shows “尚未保存 GitHub 资料” when `readSaved()` returns `null`.
- “读取我的 GitHub 资料” fills the form and exposes `displayName` and `bio` as the only editable GitHub fields.
- The page does not contain “token”, “PAT”, `GITHUB_TOKEN`, or any password input.
- Saving sends only `{ displayName, bio }`.
- Success shows “资料已保存” and the GitHub login.
- `GITHUB_TOKEN_MISSING`, `GITHUB_AUTH_FAILED`, `GITHUB_RATE_LIMITED`, validation, and generic persistence errors render safe Chinese messages.
- Buttons disable during reads/saves and focus moves to the result/status region after completion.

- [ ] **Step 2: Run the component tests and verify failure**

Run: `pnpm --filter @course-homework/web test -- src/features/github-profile/github-profile-content.test.tsx`

Expected: FAIL because the GitHub profile feature does not exist.

- [ ] **Step 3: Implement the browser API adapter**

Add the contract workspace dependency:

```bash
pnpm --filter @course-homework/web add '@course-homework/api@workspace:*'
```

Use relative `/api` URLs and a single parser that reads `apiErrorBodySchema` from `@course-homework/api/contracts`. Parse successful payloads with `githubProfileSchema` from the same public contract export. The adapter maps `404 PROFILE_NOT_FOUND` from `readSaved()` to `null`; every other non-2xx response throws a typed `ProfileApiError` containing only `code` and safe `message`.

- [ ] **Step 4: Implement the accessible review form**

Use the existing Nurture Bloom card, spacing, status, and color conventions. The page contains:

- heading “GitHub 个人资料作业”;
- a short explanation that the token remains on the server;
- “读取我的 GitHub 资料” action;
- read-only avatar, login, profile link, repository count, follower count, and GitHub creation date;
- editable “显示名称” input and “个人简介” textarea;
- “保存到数据库” action;
- an `aria-live="polite"` status region;
- no token input and no browser persistence API.

Use local React state only; do not add a query/form framework for this one page.

- [ ] **Step 5: Add the route, profile-page link, and local proxy**

Create the file route:

```ts
export const Route = createFileRoute("/homework/github-profile")({
	component: GitHubProfileContent,
});
```

Add a “GitHub 个人资料作业” row to the “我的” page using a TanStack `Link`. Configure Vite:

```ts
server: {
	port: 3001,
	proxy: {
		"/api": "http://localhost:3000",
	},
},
```

- [ ] **Step 6: Run web tests, typecheck, and build**

Run: `pnpm --filter @course-homework/web test -- src/features/github-profile/github-profile-content.test.tsx`

Expected: PASS for empty, fetch, edit, save, safe error, disabled, and focus states.

Run: `pnpm --filter @course-homework/web check-types`

Expected: PASS and regenerate the TanStack route tree through Vite without diagnostics.

Run: `pnpm --filter @course-homework/web build`

Expected: PASS and include `/homework/github-profile` in the built router.

- [ ] **Step 7: Commit the web experience**

```bash
git add apps/web/src/features/github-profile apps/web/src/routes/homework.github-profile.tsx apps/web/src/features/nurture/profile-content.tsx apps/web/vite.config.ts
git commit -m "feat: add GitHub profile homework form"
```

---

### Task 6: Reproducible workspace commands and sanitized homework evidence

**Files:**
- Modify: `package.json`
- Modify: `HOMEWORKS.md`
- Replace: `apps/api/README.md`
- Create: `docs/qa/github-profile-fullstack.md`

**Interfaces:**
- Consumes: completed API and web applications from Tasks 1–5.
- Produces: one-command local startup, complete quality gates, and a reviewable homework record.

- [ ] **Step 1: Write failing root command expectations**

Extend the structural test to parse root `package.json` and require:

- `dev` migrates the database before starting both `@course-homework/api` and `@course-homework/web` in parallel;
- `test` runs structure, API, and web tests;
- `typecheck` checks both applications;
- `build` builds both applications;
- `check` covers API source and the GitHub profile web feature.

- [ ] **Step 2: Run the structure test and verify failure**

Run: `pnpm test:structure`

Expected: FAIL because root scripts still run only the web application.

- [ ] **Step 3: Implement root orchestration commands**

Use these behaviors:

```json
{
  "scripts": {
    "check": "biome check scripts package.json biome.json apps/api/src apps/api/drizzle.config.ts apps/api/vitest.config.ts apps/api/tsup.config.ts apps/api/package.json apps/web/src/features/github-profile apps/web/src/routes/homework.github-profile.tsx apps/web/src/features/nurture/profile-content.tsx apps/web/vite.config.ts",
    "dev": "pnpm --filter @course-homework/api db:migrate && pnpm --parallel --filter @course-homework/api --filter @course-homework/web dev",
    "test": "pnpm test:structure && pnpm --filter @course-homework/api test && pnpm --filter @course-homework/web test",
    "typecheck": "pnpm --filter @course-homework/api typecheck && pnpm --filter @course-homework/web check-types",
    "build": "pnpm --filter @course-homework/api build && pnpm --filter @course-homework/web build"
  }
}
```

Keep existing Cloudflare preview validation and Wrangler dependencies intact.

- [ ] **Step 4: Write API setup and revocation documentation**

`apps/api/README.md` must document:

1. Create a fine-grained token owned by `Tiancheng-Xu` with an explicit expiry and no repository/organization permissions.
2. Let the assistant open macOS Keychain Access and create a generic-password item whose service is `course-homework.github-profile`, account is `Tiancheng-Xu`, and password is pasted into the masked field without using a terminal or environment file.
3. Keep `.env.example` limited to non-secret Keychain lookup names, database path, and port.
4. Run `pnpm --filter @course-homework/api db:migrate`.
5. Start both apps with `pnpm dev`.
6. Revoke the token from GitHub Developer Settings and delete the Keychain item after evidence capture.
7. Delete `apps/api/data/github-profile.sqlite` to remove local persisted data.

- [ ] **Step 5: Run all automated quality gates**

Run: `pnpm check`

Expected: PASS with no Biome errors.

Run: `pnpm test`

Expected: PASS for structural, API, migration, repository, route, and web tests.

Run: `pnpm typecheck`

Expected: PASS for API and web TypeScript.

Run: `pnpm build`

Expected: PASS for API server bundle and web production assets.

- [ ] **Step 6: Save the token through graphical interfaces**

In the in-app browser, the assistant creates the fine-grained token with no repository or organization permissions. Without reading the clipboard or exposing the value in chat, the assistant opens macOS Keychain Access and creates a generic-password item with:

```text
Keychain Item Name: course-homework.github-profile
Account Name: Tiancheng-Xu
Password: one-time GitHub token in the masked field
```

If macOS requires Touch ID or the device login password, pause at that operating-system approval gate for the user. Do not reveal the password field, inspect the clipboard, or capture the GitHub token result page.

- [ ] **Step 7: Start the local environment**

Run: `pnpm dev`

Expected: Drizzle reports migrations applied, Hono listens on `http://localhost:3000`, and Vite serves `http://localhost:3001`.

- [ ] **Step 8: Verify the complete flow in the in-app browser**

Open `http://localhost:3001/homework/github-profile` and visibly verify:

1. No token input or secret value appears.
2. “读取我的 GitHub 资料” displays `Tiancheng-Xu` and whitelisted fields.
3. Editing the name/biography and saving shows “资料已保存”.
4. Reloading the page restores the persisted record.
5. A sanitized database assertion shows exactly one profile row after repeated saves.
6. Temporarily renaming the Keychain item produces the safe missing-token state without a secret or stack trace; restore the item name after the check.

Do not capture the GitHub token result page, browser clipboard, Keychain password field, request authorization header, or process memory.

- [ ] **Step 9: Record sanitized evidence and local/AWS status**

Write `docs/qa/github-profile-fullstack.md` with:

- the architecture chain;
- exact quality-gate commands and results;
- migration add/drop evidence;
- browser-visible read/save/reload observations;
- token permission statement, Keychain service/account labels, expiry date, and revocation/deletion paths without token value;
- local database deletion command;
- explicit deferred scope for AWS and Go.

Update `HOMEWORKS.md` only after every local quality gate and browser check passes. Add this status table under Milestone 1:

```markdown
| 作业 ID | 本地闭环 | AWS 迁移 | 验收证据 |
|---|---|---|---|
| `AI-FULLSTACK-GITHUB-PROFILE` | ✅ 已完成 | ⏳ 待后续专题 | [本地验收](docs/qa/github-profile-fullstack.md) |
```

The AWS column remains pending until SAM, VPC, IAM, and cloud verification are delivered in the later milestone. Automated homework checks use the stable `AI-FULLSTACK-GITHUB-PROFILE` ID and must not treat local completion as AWS completion.

- [ ] **Step 10: Commit the complete homework evidence**

```bash
git add package.json HOMEWORKS.md apps/api/README.md docs/qa/github-profile-fullstack.md scripts/__tests__/github-profile-secret-boundary.test.mjs
git commit -m "docs: record GitHub profile homework evidence"
```

- [ ] **Step 11: Final branch verification**

Run: `git status -sb`

Expected: clean `tc/github-profile-fullstack-20260731` worktree with no secret environment file, SQLite, log, token, Keychain export, or screenshot containing sensitive data tracked by Git.

Run: `git diff --check origin/tc/cloudflare-pr-preview-aa5d84f9...HEAD`

Expected: no whitespace errors.
