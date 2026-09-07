# Showcase Dashboard Design System

## 1. Visual Theme and Atmosphere

Showcase Dashboard is a contemporary engineering portfolio rendered through a restrained Chinese printmaking language. The approved composition combines warm xuan-paper, ukiyo-e water and mountain scenery, vermilion seals, deep indigo typography, torn-paper edges, and background-aware glass.

The interface should feel authored, calm, trustworthy, and technically precise. It must not drift into generic SaaS cards, neon Web3 decoration, or ornamental historical pastiche.

## 2. Color Palette and Roles

| Token | Value | Role |
| --- | --- | --- |
| `--portfolio-paper` | `#f3eee4` | Continuous page canvas and fallback background |
| `--portfolio-paper-light` | `#fbf8f0` | Local text-protection mist |
| `--portfolio-ink` | `#071d34` | Primary headings and high-emphasis text |
| `--portfolio-ink-muted` | `#344252` | Body copy and secondary labels |
| `--portfolio-vermilion` | `#b52235` | Seals, numbering, active navigation, progress |
| `--portfolio-success` | `#187044` | Verified and completed state |
| `--portfolio-warning` | `#a96a1f` | Pending and partial state |
| `--portfolio-glass-l1` | `rgba(251,248,242,.48)` | Primary torn-glass surface |
| `--portfolio-glass-l2` | `rgba(248,245,237,.31)` | Section and nested-module surface |
| `--portfolio-glass-l3` | `rgba(255,255,255,.18)` | Rows, tags, and tertiary controls |

Status colors are semantic. Decorative gradients must never replace a readable status label.

## 3. Typography Rules

- Display and project titles: `Noto Serif SC`, `Songti SC`, Georgia, serif.
- Body and controls: the existing high-legibility sans-serif stack.
- Technical metadata may use compact uppercase Latin labels with restrained tracking.
- Chinese body copy must keep normal tracking and at least `1.6` line-height.
- Minimum body size is `14px`; compact metadata may use `11px` only with high contrast.

Hierarchy:

1. Page title: `clamp(2.5rem, 6vw, 4rem)`, deep ink.
2. Section title: `1.25-1.5rem`, serif, ink.
3. Project title: `1.1-1.25rem`, serif, ink.
4. Body: `0.875-1rem`, muted ink.
5. Metadata: `0.6875-0.75rem`, uppercase only for short Latin labels.

## 4. Component Styling and States

### Navigation

- Left: the Xu Tiancheng name seal and bilingual identity.
- Center/right: pavilion marker and equal-width text navigation.
- GitHub is a clearly labeled external glass control, never disguised as a seal.
- Active state uses a thin vermilion underline, not a filled button.

### Project cards

- One visual layer combines torn edge and translucent glass.
- Content order is fixed: number/status, icon/title/summary, architecture, stack, progress/Evidence.
- Card height is content-driven with shared grid-row stretching; content is never deleted to force alignment.
- Icon plates are translucent glass and retain each icon's semantic color.

### Primary modules

- Resume, performance, Evidence, and architecture use level-1 torn glass.
- Nested sections use level-2 flat glass.
- Rows, tags, and controls use level-3 glass or transparent separators.
- A fourth nested level must use spacing and dividers rather than more blur or shadow.

### Interaction states

- Hover: at most `2px` translation or a small edge-clarity change.
- Focus: visible `2px` vermilion/ink outline independent of color fill.
- Loading: retain layout, show explicit activity text, and disable conflicting actions.
- Error: explain the failed source and preserve the last verified fallback where allowed.
- Empty: state why data is unavailable; never invent metrics or project status.
- Reduced motion: remove scroll-linked and nonessential transform effects.

## 5. Layout Principles

- Shared content frame: fluid width with readable gutters and an ultrawide maximum.
- Desktop project matrix: three columns when content width permits.
- Tablet: two columns.
- Mobile: one column, no horizontal page overflow.
- Hero is followed immediately by the project matrix; resume and performance remain fully available below it.
- Background is one continuous non-repeating image. It keeps its aspect ratio on desktop and may crop horizontally on mobile.

Spacing follows a restrained `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64` scale.

## 6. Depth and Elevation

| Level | Blur | Use |
| --- | --- | --- |
| L1 | `12-16px` | Primary torn modules and project cards |
| L2 | `7-10px` | Nested sections and verified snapshots |
| L3 | `0-6px` | Tags, rows, icon plates, controls |

Every deeper layer has less shadow and more transparency. The background color at that exact page position must remain visible through the material.

## 7. Do and Don't

Do:

- Preserve project facts, links, Evidence provenance, and performance contracts.
- Use vermilion sparingly for authorship, state, and navigation.
- Keep SSR content readable without JavaScript or backdrop-filter support.
- Separate verified production, verified local, historical snapshot, and pending states.

Don't:

- Add a glass rectangle around a second torn-paper card.
- Use full-ring neon gradients, purple SaaS defaults, or continuous decorative motion.
- Repeat or vertically tile the background image.
- compress, clamp, or hide essential project content to imitate a screenshot.
- Present local-lab or mock data as production evidence.

## 8. Responsive Behavior

- Validate one component tree at `375`, `390`, `430`, and `1440` pixels.
- Touch targets are at least `44px`.
- Mobile torn edges use fewer and shallower points to avoid clipping controls.
- Navigation collapses into the existing bottom glass navigation without duplicating destinations.
- Root horizontal overflow and uncaught page errors are release blockers.

## 9. Motion and Performance

- `motion` is allowed only for meaningful navigation or state feedback.
- The Dashboard uses a thin scroll-progress indicator; it is hidden for `prefers-reduced-motion`.
- No initial opacity-zero content, parallax background, infinite animation, or layout-affecting transform.
- Route bundle growth must remain bounded and Core Web Vitals must be compared under equivalent conditions.

## 10. Agent Prompt Guide

When editing this UI:

1. Preserve the existing data and route semantics.
2. Reuse the semantic portfolio tokens before adding colors.
3. Choose the correct material depth instead of adding another card.
4. Keep the background visible but protect long-form text locally.
5. Check SSR, hydration, keyboard focus, reduced motion, and all four required viewports.
6. Never approve visual references blindly; inspect candidate differences.
