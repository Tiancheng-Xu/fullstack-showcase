# GitHub Profile Full-Stack Design

## Goal

Complete the first mandatory AI full-stack chapter assignment with one local,
reproducible path from a React form through a Hono API into a Drizzle-managed
SQLite database. The application reads the authenticated owner's GitHub profile
with a fine-grained personal access token, lets the user review the allowed
fields, and persists the reviewed profile without exposing or storing the token.

This feature deliberately stops at the local full-stack boundary. AWS SAM, VPC,
IAM deployment, and the later Go migration remain separate course milestones.

## Working isolation

Implementation lives on the dedicated branch
`tc/github-profile-fullstack-20260731`, based on the flattened monorepo and its
verified Cloudflare preview workflow. Existing Cloudflare and Stitch worktrees
are not modified.

## Architecture

```text
React profile form
  -> Hono API
  -> server-only GITHUB_TOKEN
  -> GitHub GET /user
  -> validated profile DTO
  -> review form
  -> Hono persistence endpoint
  -> Drizzle repository
  -> SQLite database
```

The existing React application remains in `apps/web`. A new `apps/api` package
owns the Hono server, GitHub client, validation, database schema, migrations,
and repository. The web application communicates only with the local API and
never receives the token.

## User flow

1. Open the GitHub profile homework page.
2. Select **Read my GitHub profile**.
3. The server calls GitHub's authenticated-user endpoint with the server-only
   fine-grained token.
4. The page displays an editable review form containing only approved fields.
5. Select **Save profile**.
6. The API validates and upserts the record by immutable GitHub user ID.
7. Reloading the page reads the persisted profile from SQLite.

The page shows loading, empty, success, token-missing, GitHub-authentication,
GitHub-rate-limit, validation, and database-failure states. It never renders,
logs, caches, or persists the token.

## Teaching and operation surface

Use the in-app browser for every step that has a meaningful visible UI:

- creating and reviewing the fine-grained GitHub token configuration;
- opening the local homework page;
- reading, reviewing, editing, and saving the profile;
- refreshing to prove persistence;
- demonstrating empty, loading, success, and safe error states;
- inspecting sanitized GitHub and pull-request evidence pages.

Use the terminal only for operations that do not have a useful browser surface,
including dependency installation, starting local processes, applying database
migrations, running tests, and inspecting sanitized database assertions. Explain
the purpose and expected result before each browser or terminal operation.

## API contract

### `GET /api/github/me`

Calls `https://api.github.com/user` and returns a whitelisted profile:

```json
{
  "githubId": 123,
  "login": "example",
  "displayName": "Example User",
  "bio": "Profile introduction",
  "avatarUrl": "https://avatars.githubusercontent.com/...",
  "profileUrl": "https://github.com/example",
  "publicRepos": 10,
  "followers": 20,
  "githubCreatedAt": "2020-01-01T00:00:00Z"
}
```

Private email, organization membership, repository contents, two-factor status,
and plan details are excluded.

### `POST /api/github-profile`

Accepts only the reviewed `displayName` and `bio`. The server fetches the
authenticated GitHub profile again, combines those two reviewed fields with
the server-sourced immutable ID, login, URLs, counts, and GitHub creation time,
then upserts the result by `githubId`. The API never trusts the browser to
return GitHub-owned identity or metrics.

### `GET /api/github-profile`

Returns the most recently persisted profile, or `404` when no profile exists.

All responses use a small stable error envelope:

```json
{
  "error": {
    "code": "GITHUB_TOKEN_MISSING",
    "message": "GitHub profile synchronization is not configured."
  }
}
```

## Data model and migration evidence

The final `github_profiles` table contains:

- `github_id`: integer primary key from GitHub.
- `login`: required unique login.
- `display_name`: nullable reviewed name.
- `bio`: nullable reviewed biography.
- `avatar_url`: required HTTPS URL.
- `profile_url`: required GitHub URL.
- `public_repos`: non-negative integer.
- `followers`: non-negative integer.
- `github_created_at`: required timestamp.
- `synced_at`: required timestamp of the latest GitHub read.
- `created_at` and `updated_at`: local persistence timestamps.

Migration history demonstrates real schema evolution:

1. `0001_create_github_profiles` creates the initial table with a temporary
   `location` field.
2. `0002_add_profile_metrics` adds `bio`, `public_repos`, `followers`, and
   `synced_at`.
3. `0003_remove_location` removes the temporary `location` field while
   preserving an existing seeded row.

A migration test applies each migration in order, inserts a fixture after the
first migration, and verifies that the final constraints and retained data are
correct after the add/drop sequence.

## Credential boundary

- Use a newly created fine-grained personal access token.
- The GitHub `GET /user` endpoint requires no additional fine-grained
  permissions, so the token receives no repository, organization, or write
  permission.
- Keep the token in an ignored local API environment file during development.
- Provide only the variable name and setup instructions in `.env.example`.
- Redact `authorization`, `token`, and secret-like values from logs and errors.
- Never place the token in browser storage, frontend environment variables,
  database columns, fixtures, screenshots, commits, CI output, or review text.
- Document token expiry and revocation in the homework evidence.

The currently authenticated GitHub CLI OAuth token is not accepted as evidence
for this requirement because it is not a fine-grained personal access token.

## Error behavior

- Missing token: `503 GITHUB_TOKEN_MISSING`.
- Rejected or expired token: `401 GITHUB_AUTH_FAILED`.
- GitHub rate limit or forbidden response: `429 GITHUB_RATE_LIMITED` when rate
  limit evidence is present, otherwise `403 GITHUB_FORBIDDEN`.
- GitHub timeout or upstream failure: `502 GITHUB_UNAVAILABLE`.
- Invalid request body: `400 VALIDATION_FAILED` with field-safe details.
- Missing persisted profile: `404 PROFILE_NOT_FOUND`.
- Database failure: `500 PERSISTENCE_FAILED` without SQL or secret details.

GitHub calls use a finite timeout and do not retry authentication failures.
Database writes use an upsert so repeated saves are idempotent.

## Testing

### API and domain tests

- Whitelist and normalize the GitHub response.
- Map missing, invalid, forbidden, rate-limited, timed-out, and malformed
  upstream responses to the documented error codes.
- Reject invalid editable fields and any client attempt to submit immutable
  GitHub fields.
- Upsert the same GitHub ID without creating duplicates.

### Migration tests

- Apply migrations from an empty SQLite database.
- Seed after migration 0001, apply 0002 and 0003, and verify retained data.
- Verify final unique, required, and non-negative constraints.

### Web tests

- Render the initial empty state.
- Load a GitHub profile into the review form.
- Edit only the allowed fields and save.
- Render every documented failure state without leaking secret material.

### End-to-end verification

1. Run lint, typecheck, unit tests, migration tests, and production builds.
2. Start the API and web application locally.
3. In the in-app browser, create the least-privilege fine-grained token while
   the user observes the permission choices.
4. Add the token through a secret-safe local setup step outside browser storage.
5. Read, review, save, and reload the authenticated profile.
6. Inspect the database through a safe application/debug view that excludes
   secrets.
7. Capture sanitized screenshots and commands as homework evidence.

## Later Go migration seam

The future Go homework will reimplement the `POST /api/github-profile` upsert
and `GET /api/github-profile` read path against the same final schema. Contract
fixtures and error-code tests remain language-neutral so the Node and Go
implementations can be compared for equivalent constraints and behavior.

## Non-goals

- AWS SAM, VPC, Lambda, ECS, or production deployment.
- Authentication for multiple application users.
- Persisting GitHub tokens or private GitHub profile fields.
- Reading repositories, organizations, emails, or other GitHub resources.
- Completing the Go migration in the same feature.
- Merging existing Cloudflare or Stitch pull requests.
