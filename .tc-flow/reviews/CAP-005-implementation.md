# CAP-005 Implementation

## Scope

- Reused the eight checked-in Archify architecture JSON specifications and existing static PNG previews.
- Generated eight self-contained interactive HTML artifacts with the official Archify CLI.
- Added one shared React preview component to Dashboard project cards and the project index.
- Kept static PNG images lazy-loaded; the interactive iframe is not created until the user requests it.
- Added modal close, Escape, backdrop close, full-screen link, responsive layout, and accessible names.

## Archify validation

- Archify doctor: pass.
- Eight architecture artifacts: 9/9 checks passed each under the `showcase` quality profile.
- Local component tests: pass.
- TypeScript and diff check: pass.

## Performance boundary

Each interactive document is self-contained and approximately 800 KB. None is requested during SSR, hydration, or initial card rendering. The page initially downloads only the existing lazy PNG preview; opening a diagram creates the iframe for that project only.
