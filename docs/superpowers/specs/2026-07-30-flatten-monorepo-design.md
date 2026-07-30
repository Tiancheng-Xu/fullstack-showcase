# Flattened Monorepo Design

## Goal

Remove the nested Better-T-Stack workspace so the repository has one obvious
application layer, one shared-package layer, one dependency lockfile, and one
set of root commands.

## Current Problem

The repository currently contains a workspace inside another workspace:

```text
course-homework/
├── apps/
│   └── web/
│       ├── apps/
│       │   └── web/       # actual React application
│       ├── packages/      # Better-T-Stack shared packages
│       ├── package.json
│       ├── pnpm-lock.yaml
│       └── pnpm-workspace.yaml
└── package.json
```

As a result, root scripts must target `apps/web/apps/web`, dependency
installation happens below the repository root, and Cloudflare deploys an
output path that does not match the conceptual application boundary.

## Target Structure

```text
course-homework/
├── apps/
│   ├── web/               # React + Vite application
│   └── api/
│       └── README.md      # non-buildable backend placeholder
├── packages/
│   ├── ui/                # reusable UI components and global styles
│   ├── env/               # environment validation
│   └── config/            # shared TypeScript configuration
├── package.json           # repository commands
├── pnpm-workspace.yaml    # the only workspace definition
└── pnpm-lock.yaml         # the only dependency lockfile
```

## Migration Mapping

| Current path | Target path |
| --- | --- |
| `apps/web/apps/web/**` | `apps/web/**` |
| `apps/web/packages/ui/**` | `packages/ui/**` |
| `apps/web/packages/env/**` | `packages/env/**` |
| `apps/web/packages/config/**` | `packages/config/**` |
| `apps/web/pnpm-workspace.yaml` | `pnpm-workspace.yaml` |
| `apps/web/pnpm-lock.yaml` | `pnpm-lock.yaml` |

The intermediate `apps/web/package.json`, `apps/web/tsconfig.json`,
`apps/web/biome.json`, and `apps/web/bts.jsonc` are removed after their useful
settings are either promoted to the repository root or proven unnecessary.

## Command and Dependency Model

The root package is the only command entry point:

- `pnpm dev` starts `@course-homework/web`.
- `pnpm test` runs the web test suite.
- `pnpm typecheck` runs the web TypeScript check.
- `pnpm build` builds the web application.
- `pnpm validate:preview` checks the Cloudflare workflow contract.

The root workspace includes `apps/*` and `packages/*`. Internal dependencies
continue to use `workspace:*`, so the web application can import shared UI,
environment, and configuration packages without published packages.

## Cloudflare Preview Flow

GitHub Actions installs dependencies from the repository root and caches the
root `pnpm-lock.yaml`. It then runs the root test, type-check, and build
commands. Wrangler deploys `apps/web/dist` to the existing
`course-homework-preview` Pages project and continues using the `preview`
branch.

This change does not alter Cloudflare credentials, account settings, project
ownership, the production branch, or the production environment.

## Backend Placeholder

`apps/api/README.md` documents the future backend boundary but does not contain
a `package.json`. Therefore it is visible to learners without being included
in install, test, build, or deployment commands. A later backend lesson can
replace the placeholder with a real workspace package and independent CI job.

## Safety and Compatibility

- Work occurs on `tc/flatten-monorepo`, based on the existing Cloudflare
  preview branch.
- The local `main` worktree and its private-photo planning file are untouched.
- Git history records moves where Git can detect them; source behavior is not
  intentionally changed.
- No production deployment is triggered.
- The existing stable preview URL remains unchanged.

## Verification

The migration is accepted only if all of the following pass from the
repository root:

1. A structural test proves that no nested workspace or nested lockfile
   remains and that all expected target paths exist.
2. `pnpm install --frozen-lockfile`
3. `pnpm test`
4. `pnpm typecheck`
5. `pnpm build`
6. `pnpm validate:preview`

The built output must exist at `apps/web/dist/index.html`, and the workflow
must reference the root lockfile, root install command, and
`apps/web/dist`.

## Out of Scope

- Adding a backend runtime or API.
- Changing application UI or data.
- Uploading private photographs.
- Merging the draft PR.
- Deploying to production.
