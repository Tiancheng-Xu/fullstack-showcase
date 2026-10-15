# Dashboard visual regression gate incident

## Confirmed causes

- A decorative navigation mark occupied a fifth grid cell; unlayered navigation styles also overrode mobile widths, causing wrapping and off-screen targets.
- The surface's individual CSS `translate` created a containing block for fixed navigation. Checking `transform` alone did not detect it.
- Open-source particle stacking changed the mobile navigation's position to `relative`, moving it to the document footer.
- Checking the body for the word "分享" accepted a navigation-only page with no article directory.
- BackstopJS can log `onReady` exceptions and continue capturing. A passing pixel comparison alone does not establish that DOM gates passed.
- Conference Markdown emitted its own `h1` inside a page already containing an `h1`.
- The critical hero title could become transparent while waiting for an in-view animation after client layout preparation.

## Repairs

- Keep four mobile touch targets in one row with at least 44 pixels of target height.
- Remove surface translation only on mobile and retain fixed positioning above the particle backdrop.
- Require the Sharing directory marker and a nonempty summary entry.
- Execute the real Backstop hooks in a separate fail-closed preflight before image comparison. Disable cache in isolated preflight pages, without relaxing document status checks.
- Throw on runner failures so preview cleanup executes in `finally`.
- Nest original conference headings under the page title, retaining their text and relative hierarchy.
- Keep the primary title visible from its first render. Check painted glyphs through intermediate ancestors.
- Count only rendered, effectively visible text in the dedicated note body, excluding boilerplate boundaries.
- Validate both dimensions of navigation targets, actual hit-testing and viewport anchoring after verified instant scrolling.
- Use the loopback static-first artifact preview for real 200/404 checks, rather than Vite's SPA fallback. Freeze only the Backstop fixture clock to stabilize freshness labels.

## Required recurring checks

- Test 375, 390 and 430 pixel mobile widths and desktop widths.
- Check actual navigation rectangles against both the bar and the viewport; document overflow alone is insufficient.
- Click summary paragraphs for each topic, verify the detail body and return to the unified list. Preserve separate author links.
- Test missing directory/body, empty summary entries, clipped/wrapped/missing navigation and duplicate page titles as negative cases.
- Keep exact browser, platform, locale, timezone and scale checks. Never accept a failing DOM gate by changing the image baseline.
- Preserve the original Chrome 153 reference set. Chrome 155 references require independent image acceptance and a fresh passing comparison before release.

## Current verification boundary

The 24 native gates, 150 unit tests, typecheck, 111-route static-first build, 49 Playwright checks and 38 DOM preflight cases have passed. The isolated Sol source review and scoped image review passed after repair. Chrome 155 migration references still require a fresh full pixel comparison. Image inspection covered the recorded regions, not every omitted pixel or business behavior. No production release is established by this record.
