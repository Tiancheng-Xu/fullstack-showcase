# Dashboard Voyage Hero and Capability Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-safe Babylon voyage hero and an accessible interactive technology capability map to `/dashboard` without weakening SSR, mobile, accessibility, or evidence boundaries.

**Architecture:** The dashboard renders all meaningful copy, capability nodes, project links, and Evidence links as React DOM during SSR. A lazy `PortfolioVoyageScene` enhancement owns one Babylon engine and canvas for the hero; the technology map uses SVG, CSS 3D, and the existing Motion dependency, so the page never runs a second WebGL scene.

**Tech Stack:** React, TypeScript, TanStack Router, Motion, Babylon.js, Vitest, Testing Library, Vite SSR, BackstopJS.

**Spec:** `docs/superpowers/specs/2026-09-09-dashboard-voyage-capability-map-design.md`

## Global Constraints

- Preserve the existing ink-wash, torn-paper glass, navy, and vermilion Dashboard theme.
- Keep the personal resume as the first content module after the voyage hero.
- Do not copy the reference sites' brand, text, source code, or visual assets.
- Keep all technology names, descriptions, project links, and Evidence links in SSR DOM.
- Run only one WebGL scene; the capability map must remain DOM/SVG based.
- Lazy-load Babylon and the GLB; neither may enter the initial synchronous Dashboard chunk.
- Pause the render loop offscreen and dispose every engine, scene, asset, observer, and listener on unmount.
- Cap DPR at `1.5` on desktop and `1.0` on mobile.
- Use a static fallback for WebGL failure, reduced motion, low-performance mobile, and model-load failure.
- Keep `verified-production`, `verified-local`, and `pending` status boundaries explicit.
- Do not execute Git push, Cloudflare publish, or AWS operations before the user approves the local visual preview.

---

### Task 1: Capability graph data contract

**Files:**
- Create: `apps/web/apps/web/src/features/portfolio/capability-map-data.ts`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/capability-map-data.test.ts`

**Interfaces:**
- Produces: `CAPABILITY_DOMAINS`, `CapabilityDomain`, `TechnologyNode`, and `getCapabilityNode(id)`.
- Consumes: project ids from `src/data/portfolio-projects.ts` without copying project URLs or verification claims.

- [ ] **Step 1: Write the failing data contract test**

```ts
import { describe, expect, it } from "vitest";
import { CAPABILITY_DOMAINS, getCapabilityNode } from "../capability-map-data";

describe("capability map data", () => {
  it("publishes four domains and twenty-four unique technology nodes", () => {
    const nodes = CAPABILITY_DOMAINS.flatMap((domain) => domain.technologies);
    expect(CAPABILITY_DOMAINS).toHaveLength(4);
    expect(nodes).toHaveLength(24);
    expect(new Set(nodes.map((node) => node.id)).size).toBe(24);
  });

  it("keeps each node connected to implemented projects and a verification boundary", () => {
    for (const node of CAPABILITY_DOMAINS.flatMap((domain) => domain.technologies)) {
      expect(node.projectIds.length).toBeGreaterThan(0);
      expect(["verified-production", "verified-local", "pending"]).toContain(node.verification);
    }
    expect(getCapabilityNode("qwen-qlora")?.label).toBe("Qwen3 / QLoRA");
  });
});
```

- [ ] **Step 2: Run the test and observe RED**

Run: `pnpm test src/features/portfolio/__tests__/capability-map-data.test.ts`

Expected: FAIL because `capability-map-data.ts` does not exist.

- [ ] **Step 3: Implement the typed data model**

Define four domains (`ai`, `fullstack`, `web3`, `engineering`) with six nodes each. Every node must include `id`, `label`, `icon`, `description`, `projectIds`, and `verification`; use project ids already present in the Dashboard index.

- [ ] **Step 4: Run the focused test and observe GREEN**

Run: `pnpm test src/features/portfolio/__tests__/capability-map-data.test.ts`

Expected: 2 tests pass.

### Task 2: Accessible technology capability map

**Files:**
- Create: `apps/web/apps/web/src/features/portfolio/technology-capability-map.tsx`
- Create: `apps/web/apps/web/src/features/portfolio/technology-capability-map.css`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/technology-capability-map.test.tsx`

**Interfaces:**
- Consumes: `CAPABILITY_DOMAINS`, `TechnologyNode`, and existing Portfolio project data.
- Produces: `<TechnologyCapabilityMap />` with SSR-safe buttons, links, SVG relationship lines, keyboard selection, and an inline/mobile detail panel.

- [ ] **Step 1: Write failing rendering and interaction tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechnologyCapabilityMap } from "../technology-capability-map";

describe("TechnologyCapabilityMap", () => {
  it("renders the identity, four domains, and twenty-four accessible technology buttons", () => {
    render(<TechnologyCapabilityMap />);
    expect(screen.getByRole("heading", { name: "徐天成" })).toBeInTheDocument();
    expect(screen.getAllByTestId("capability-domain")).toHaveLength(4);
    expect(screen.getAllByTestId("technology-node")).toHaveLength(24);
  });

  it("opens a technology detail with project and Evidence navigation", () => {
    render(<TechnologyCapabilityMap />);
    fireEvent.click(screen.getByRole("button", { name: /Qwen3 \/ QLoRA/ }));
    expect(screen.getByRole("heading", { name: "Qwen3 / QLoRA" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Personal AI Agent/ })).toHaveAttribute("href");
  });

  it("restores the complete map with Escape", () => {
    render(<TechnologyCapabilityMap />);
    fireEvent.click(screen.getByRole("button", { name: /TypeScript/ }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the component test and observe RED**

Run: `pnpm test src/features/portfolio/__tests__/technology-capability-map.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement minimal SSR-safe map behavior**

Render the center identity, four domain articles, twenty-four real buttons, SVG lines, status text, and a detail region. Use semantic headings and real anchors; do not hide source content behind Canvas.

- [ ] **Step 4: Add Motion progressive enhancement**

Use the existing `motion` dependency for one-time staggered reveal, pointer-drag offset, hover/focus emphasis, and reduced-motion handling. Keep transforms decorative; DOM order remains meaningful.

- [ ] **Step 5: Run the focused test and observe GREEN**

Run: `pnpm test src/features/portfolio/__tests__/technology-capability-map.test.tsx`

Expected: 3 tests pass.

### Task 3: Voyage hero shell and scene policy

**Files:**
- Create: `apps/web/apps/web/src/features/portfolio/portfolio-voyage-hero.tsx`
- Create: `apps/web/apps/web/src/features/portfolio/voyage-scene-policy.ts`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/portfolio-voyage-hero.test.tsx`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/voyage-scene-policy.test.ts`

**Interfaces:**
- Produces: `<PortfolioVoyageHero />`, `getVoyageDpr(viewportWidth, devicePixelRatio)`, and `shouldEnableVoyageScene(input)`.
- Consumes: lazy scene module via `import("./portfolio-voyage-scene")` only after visibility and idle gates pass.

- [ ] **Step 1: Write failing policy tests**

```ts
import { describe, expect, it } from "vitest";
import { getVoyageDpr, shouldEnableVoyageScene } from "../voyage-scene-policy";

describe("voyage scene policy", () => {
  it("caps desktop and mobile DPR", () => {
    expect(getVoyageDpr(1440, 2)).toBe(1.5);
    expect(getVoyageDpr(390, 3)).toBe(1);
  });

  it("disables WebGL motion for reduced motion or unavailable WebGL", () => {
    expect(shouldEnableVoyageScene({ reducedMotion: true, webglAvailable: true, viewportWidth: 1440 })).toBe(false);
    expect(shouldEnableVoyageScene({ reducedMotion: false, webglAvailable: false, viewportWidth: 1440 })).toBe(false);
  });
});
```

- [ ] **Step 2: Write the failing hero shell test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortfolioVoyageHero } from "../portfolio-voyage-hero";

it("keeps voyage copy and capability navigation available without WebGL", () => {
  render(<PortfolioVoyageHero forceStatic />);
  expect(screen.getByRole("heading", { name: /驶向下一代技术浪潮/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /查看技术图谱/ })).toHaveAttribute("href", "#technology-map");
  expect(screen.getByText(/动态场景/)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run both tests and observe RED**

Run: `pnpm test src/features/portfolio/__tests__/voyage-scene-policy.test.ts src/features/portfolio/__tests__/portfolio-voyage-hero.test.tsx`

Expected: FAIL because the policy and hero modules do not exist.

- [ ] **Step 4: Implement policy and static hero shell**

The shell reserves final Canvas dimensions, renders the fallback horizon, exposes pause state, and imports the scene only after an IntersectionObserver reports proximity to the viewport.

- [ ] **Step 5: Run both tests and observe GREEN**

Run the Step 3 command. Expected: all focused tests pass.

### Task 4: Production Babylon voyage scene

**Files:**
- Create: `apps/web/apps/web/src/features/portfolio/portfolio-voyage-scene.ts`
- Create: `apps/web/apps/web/src/features/portfolio/voyage-wave.ts`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/voyage-wave.test.ts`
- Modify: `apps/web/apps/web/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/web/apps/web/public/assets/portfolio/ss-minnow-iii.glb`
- Create: `apps/web/apps/web/public/assets/portfolio/THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Consumes: a canvas, scene status callback, motion state, and DPR from the hero shell.
- Produces: `createPortfolioVoyageScene(options): Promise<VoyageSceneController>` where the controller has `pause()`, `resume()`, `resize()`, and `dispose()`.

- [ ] **Step 1: Write the failing shared-wave test**

```ts
import { describe, expect, it } from "vitest";
import { sampleVoyagePose, waveHeight } from "../voyage-wave";

it("derives lift pitch roll and heading from one deterministic wave function", () => {
  expect(waveHeight(2, 3, 4)).toBeCloseTo(waveHeight(2, 3, 4), 8);
  const pose = sampleVoyagePose({ x: 2, z: 3, seconds: 4, headingSample: 0.05 });
  expect(Number.isFinite(pose.y)).toBe(true);
  expect(Number.isFinite(pose.pitch)).toBe(true);
  expect(Number.isFinite(pose.roll)).toBe(true);
  expect(Number.isFinite(pose.heading)).toBe(true);
});
```

- [ ] **Step 2: Run the wave test and observe RED**

Run: `pnpm test src/features/portfolio/__tests__/voyage-wave.test.ts`

Expected: FAIL because `voyage-wave.ts` does not exist.

- [ ] **Step 3: Implement the shared wave and pose sampler**

Move the four-wave formula into exported TypeScript functions. Generate the Babylon shader expression from the same named constants so CPU and GPU values cannot silently drift.

- [ ] **Step 4: Add Babylon dependencies and licensed asset**

Run: `pnpm add @babylonjs/core @babylonjs/loaders --filter web`

Copy `assets/ss_minnow_iii.glb` and `THIRD_PARTY_NOTICES.md` from the approved prototype into the local public asset directory. Preserve author, source URL, and CC BY 4.0 text.

- [ ] **Step 5: Implement the scene controller**

Use the prototype's proven sun direction, sky shader, ocean shader, camera bounds, GLB normalization, route pose, wake particle limit, resize handling, and teardown behavior. Replace globals with ESM imports from Babylon packages.

- [ ] **Step 6: Run the focused wave and hero tests**

Run: `pnpm test src/features/portfolio/__tests__/voyage-wave.test.ts src/features/portfolio/__tests__/portfolio-voyage-hero.test.tsx`

Expected: focused tests pass without creating a WebGL context in jsdom.

### Task 5: Dashboard integration and SSR contract

**Files:**
- Modify: `apps/web/apps/web/src/features/portfolio/dashboard-content.tsx`
- Modify: `apps/web/apps/web/src/index.css`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/dashboard-resume.test.tsx`
- Create: `apps/web/apps/web/src/features/portfolio/__tests__/dashboard-capability-map.test.tsx`

**Interfaces:**
- Consumes: `<PortfolioVoyageHero />` and `<TechnologyCapabilityMap />`.
- Produces: final Dashboard order `nav -> hero -> resume -> technology map -> project groups -> open source -> performance -> footer`.

- [ ] **Step 1: Extend the failing Dashboard order and SSR contract**

Assert that `驶向下一代技术浪潮` precedes `个人简历`, `个人简历` precedes `岗位 × 技能知识图谱`, and the knowledge map precedes `展示看板`. Assert all four domain headings and twenty-four node buttons exist in the rendered output.

- [ ] **Step 2: Run the Dashboard tests and observe RED**

Run: `pnpm test src/features/portfolio/__tests__/dashboard-resume.test.tsx src/features/portfolio/__tests__/dashboard-capability-map.test.tsx`

Expected: FAIL because the new Hero and map are not integrated.

- [ ] **Step 3: Integrate components and remove duplicate static skills**

Insert the Hero immediately after the main navigation. Keep the resume first among content sections. Replace the current `skillGroups` static list with `TechnologyCapabilityMap`; do not duplicate capability content.

- [ ] **Step 4: Apply route-level visual styling**

Connect the Hero's paper-mask transition and the map's glass layers to existing CSS variables. Keep the Header untouched except for already approved navigation icon work. Avoid global selectors that affect project, Evidence, or performance routes.

- [ ] **Step 5: Run the focused Dashboard tests and observe GREEN**

Run the Step 2 command. Expected: all focused tests pass.

### Task 6: Browser, responsive, visual, and performance gates

**Files:**
- Create: `apps/web/apps/web/scripts/dashboard-voyage.browser.mjs`
- Modify: `apps/web/apps/web/backstop.config.cjs`
- Modify: `apps/web/apps/web/package.json`

**Interfaces:**
- Consumes: local `/dashboard` preview.
- Produces: deterministic browser assertions and Backstop scenarios for static/mobile, animated/desktop, selected node, and detail-open states.

- [ ] **Step 1: Add browser assertions before polishing**

The script must check `375`, `390`, `430`, and `1440` widths; `pageerror=[]`; root overflow `<= 1`; twenty-four nodes; detail open/close; reduced-motion static mode; forced WebGL failure fallback; and render-loop pause after Hero leaves the viewport.

- [ ] **Step 2: Run the browser script and observe RED**

Run: `node scripts/dashboard-voyage.browser.mjs`

Expected: FAIL on at least one missing visual-state or lifecycle assertion before final styling.

- [ ] **Step 3: Add deterministic Backstop states**

Add four fixed-data scenarios: desktop Hero, mobile static Hero, capability node selected, and capability detail open. Disable caret and incidental transitions; do not approve new references without manual image review.

- [ ] **Step 4: Fix only failures attributable to this feature**

Adjust component-scoped CSS, responsive layout, focus order, fallback text, and scene lifecycle. Do not rewrite unrelated Dashboard modules.

- [ ] **Step 5: Run focused and repository gates**

Run:

```bash
pnpm test src/features/portfolio/__tests__/capability-map-data.test.ts \
  src/features/portfolio/__tests__/technology-capability-map.test.tsx \
  src/features/portfolio/__tests__/portfolio-voyage-hero.test.tsx \
  src/features/portfolio/__tests__/voyage-scene-policy.test.ts \
  src/features/portfolio/__tests__/voyage-wave.test.ts \
  src/features/portfolio/__tests__/dashboard-resume.test.tsx \
  src/features/portfolio/__tests__/dashboard-capability-map.test.tsx
pnpm check-types
pnpm build
node scripts/dashboard-voyage.browser.mjs
```

Expected: all commands pass with no browser page errors or root overflow.

- [ ] **Step 6: Generate candidate visual diffs for human review**

Run: `pnpm visual:test`

Expected: candidate images are generated. Any intended difference is manually reviewed before a reference update.

### Task 7: Local preview and user approval checkpoint

**Files:**
- No additional production files.

**Interfaces:**
- Produces: local Dashboard URL and screenshots for user review.

- [ ] **Step 1: Start the local preview**

Run: `pnpm dev --host 127.0.0.1 --port 4184`

- [ ] **Step 2: Present exact review states**

Provide the user with `/dashboard` and screenshots at `390` and `1440`, including Hero, full capability map, and one selected-node detail state.

- [ ] **Step 3: Stop before Git or deployment**

Do not commit functional code, push, open a PR, update Cloudflare, or execute AWS until the user explicitly approves the local visual result.
