# Dashboard mobile reading regression

## Reproduction and cause

At a physical 400 x 745 viewport with normal motion, scroll from the voyage
hero to the resume. The resume section is approximately 8897 px tall. Its
IntersectionObserver required an intersection ratio of 0.08, which exceeds
the visible fraction available in that viewport. The reveal stylesheet kept
the whole section at opacity 0 indefinitely.

The mobile heading also used a desktop-derived 40 px minimum, producing an
eight-character first line and a one-character final line. The hero credit
could overlap the action when content grew.

## Repair

- Trigger at the first intersection, rather than a percentage of section area.
- Keep reading content visible before any observer callback; animate only a
  subtle visible-to-visible entrance, with reduced-motion support.
- Use mobile-specific heading sizing and reserve space for the model credit.

## Required regression coverage

The existing Playwright gate now includes normal-motion, physical-viewports
320 x 568, 375 x 667, 390 x 844, 400 x 745, 430 x 932 and 1440 x 900. It
scrolls to each Dashboard section, checks ancestor opacity and heading
visibility, rejects orphan heading lines and overlapping hero credits, and
checks readable content with a stalled observer.

Reduced-motion and full-document Backstop captures remain complementary
checks, not substitutes for this physical scrolling gate. Previous green
results do not cover this repair until the updated gate has been run.
