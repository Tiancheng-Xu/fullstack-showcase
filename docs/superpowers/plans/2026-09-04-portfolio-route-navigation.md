# Portfolio Route Navigation Implementation Plan

1. Add route/data contract tests for `/projects`, `/evidence`, shared navigation, static-first output, and architecture coverage.
2. Extract synchronized portfolio loading into one hook and route navigation into one component.
3. Add the project index and Evidence index routes without duplicating project facts.
4. Generate Archify HTML and JSON IR for every non-Skill project; keep Skill entries text-only.
5. Add the new static-first routes and Cloudflare rewrites.
6. Run focused tests, full Web tests, type checking, client/SSR build, responsive browser checks, and user visual review before publication.

Pretext remains conditional: adopt it only for manual Canvas/SVG text flow, virtualization, or measured dynamic-height layout. Ordinary DOM cards continue to use native CSS flow.
