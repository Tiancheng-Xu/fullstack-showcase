# Sharing detail layout regression

## Symptom and cause

Article detail titles inherited presentation-scale typography: 63.36px at
1440px and up to 72px on wider desktops. The hero remained left-aligned to the
outer portfolio frame while the article used a centered reading column.
The sharing container and intro independently added up to 72px and 64px of
vertical space. Overflow-only checks did not detect these valid-but-unsuitable
dimensions. Backstop's reviewed scenarios omitted sharing and detail pages.

## Fix and recurrence gate

- Keep the existing paper palette, navigation, content and author buttons.
- Share a centered reading column between article heroes and their paper cards.
- Limit titles to 48px on desktop and 32px on mobile, with relaxed line height.
- Reduce each intro gap to at most 32px and conference body headings to 32px.
- Inspect seven sharing/list/detail routes at 375, 390, 430 and 1440px.
- Test paragraph hit targets and return-to-directory links, not only overflow.
- Run computed browser layout checks against this commit's successful Cloudflare
  preview after the existing verification job. Upload screenshots even on failure.
  This job uses GitHub read permissions only and never requests a rebuild.

## Backstop boundaries

`backstop.sharing.config.cjs` adds the missing page families in a separate image
namespace, with an onReady hook enforcing the same layout contract. Run it with
`BACKSTOP_TARGET_ORIGIN=https://<deployment>.fullstack-showcase.pages.dev`.
Do not approve or replace historical baseline images to conceal differences.

The preceding production audit captured 97 routes / 206 screenshots: five pixel
comparisons passed, 184 had no reference, and 17 differed from existing images.
Chrome 154 differed from the reviewed Chrome 153 environment; six apparent
clipped-text findings were intentional screen-reader-only text. None of this
constitutes a complete, passing pixel-regression suite. New sharing baselines
still require review in a matching environment. The CI layout gate is explicitly
not a substitute for that pending baseline review.

## Recheck commands

```sh
pnpm test
pnpm typecheck
pnpm build
cd apps/web/apps/web
node scripts/check-sharing-layout.mjs --origin https://<deployment>.fullstack-showcase.pages.dev
BACKSTOP_TARGET_ORIGIN=https://<deployment>.fullstack-showcase.pages.dev pnpm exec backstop test --config=backstop.sharing.config.cjs
```

Before release, review the new article screenshots and require the preview
layout job, existing verification and Cloudflare checks to pass. After merging,
repeat layout checks on the production domain and confirm the deployed SHA.
