# Dashboard Capability Interview Narrative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Dashboard capability map and two AI project narratives for interview presentation, and reuse its Babylon particle scene behind the open-source index.

**Architecture:** Extend the existing capability-domain data with featured and secondary skills plus tooltip metadata, while preserving the four-domain SSR-safe DOM. Extract the existing lazy Babylon lifecycle into a decorative shared component so the map and open-source page use one implementation. Keep project names and links stable while synchronizing enhanced descriptions across Dashboard data and the GitHub Profile README.

**Tech Stack:** React, TypeScript, TanStack Router, Babylon.js, CSS, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-09-12-dashboard-capability-interview-narrative-design.md`

## Global Constraints

- The Evidence-gate exception applies only to the current Dashboard presentation layer.
- Keep the domains AI / Agent, Full Stack / Data, Cloud / Reliability, and Trust / Auth.
- Do not add C++, C#, Qt, OpenCV, Kubernetes, Java, Spring AI, LangChain4j, Android, or QNX.
- Keep official project names Agent Market and Personal AI Agent.
- Render no more than six featured skills per domain before the More Skills control.
- Keep all work local; do not commit, push, or publish.
- Do not run AWS-backed validation.

---

### Task 1: Capability data and compact progressive disclosure

**Files:**
- Modify: `apps/web/apps/web/src/features/portfolio/capability-map-data.ts`
- Modify: `apps/web/apps/web/src/features/portfolio/technology-capability-map.tsx`
- Modify: `apps/web/apps/web/src/features/portfolio/technology-capability-map.css`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/technology-capability-map.test.tsx`

**Interfaces:**
- Extend `CapabilityNode` with `aliases: string[]`, `plainLanguage: string`, `interviewAngle: string`, and `featured?: boolean`.
- Keep `CAPABILITY_DOMAINS: CapabilityDomain[]` and `getCapabilityNode(id)` as the public data API.
- Produce six featured nodes per domain and secondary nodes revealed by a domain-level button.

- [ ] **Step 1: Update the component test for four renamed domains and progressive disclosure**

```tsx
expect(screen.getByRole("heading", { name: "AI / Agent" })).toBeVisible();
expect(screen.getByRole("heading", { name: "Full Stack / Data" })).toBeVisible();
expect(screen.getByRole("heading", { name: "Cloud / Reliability" })).toBeVisible();
expect(screen.getByRole("heading", { name: "Trust / Auth" })).toBeVisible();
expect(screen.getAllByRole("button", { name: /更多技能/ })).toHaveLength(4);
expect(screen.queryByText("Java / Spring AI")).not.toBeInTheDocument();
```

- [ ] **Step 2: Add interview-oriented skill metadata**

Add the following capability groups without a standalone Web3 domain:

```ts
const domainLabels = [
  "AI / Agent",
  "Full Stack / Data",
  "Cloud / Reliability",
  "Trust / Auth",
];
```

AI / Agent includes Qwen3/QLoRA, RAG/Rerank, LangGraph DAG, ReAct/Planning, Tool Calling, Agent Runtime, Multi-Agent, MCP/Memory, Evaluation, Structured Output, intent recognition, embeddings, knowledge graphs, human handoff, and model fallback.

Full Stack / Data includes React/TanStack, TypeScript, Node/Hono/Go/Python, REST/GraphQL, PostgreSQL/SQLite, Redis, API contracts, Edge SSR/Hydration, CSR fallback, Cocos Creator, SSE, and async tasks.

Cloud / Reliability includes Pages/Workers, Docker/Containers, CI/CD/Preview, state machine/checkpoint, retry/idempotency/compensation, queues/DLQ, logs/metrics/traces, performance/token cost, LocalStack, and TC Flow/Quality Gate.

Trust / Auth includes authentication versus authorization, session/cookie, JWT, OAuth 2.0/OIDC, GitHub App tokens, GitHub OIDC, HMAC, API tokens, allowlists, least privilege, secret isolation, wallet signatures, nonce/replay protection, role permissions, audit logs, and evidence integrity.

- [ ] **Step 3: Render six featured nodes and a More Skills control for each domain**

Use domain-local expansion state:

```ts
const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
const visibleNodes = expandedDomains.has(domain.id)
  ? domain.nodes
  : domain.nodes.filter((node) => node.featured).slice(0, 6);
```

The More Skills control toggles the domain without resizing other domains unnecessarily and exposes `aria-expanded`.

- [ ] **Step 4: Add hover/focus tooltip and richer click details**

The tooltip displays `aliases.join(" / ")`, `plainLanguage`, and the first project ID. The existing click detail displays `summary`, `interviewAngle`, project IDs, and the existing optional project link.

- [ ] **Step 5: Add responsive CSS**

Keep six compact cards visible per domain on desktop, preserve the existing single-column mobile fallback, and position tooltips above nodes without blocking pointer events. Expanded skills use the same node material rather than a separate visual system.

- [ ] **Step 6: Run the focused capability test**

Run:

```bash
pnpm exec vitest run src/features/portfolio/__tests__/technology-capability-map.test.tsx
```

Expected: the four domains, featured nodes, More Skills controls, tooltip metadata, detail dialog, and excluded technologies pass.

---

### Task 2: Shared Babylon particle backdrop

**Files:**
- Create: `apps/web/apps/web/src/features/portfolio/technology-particle-backdrop.tsx`
- Modify: `apps/web/apps/web/src/features/portfolio/technology-capability-map.tsx`
- Modify: `apps/web/apps/web/src/features/portfolio/open-source-index-content.tsx`
- Modify: `apps/web/apps/web/src/features/portfolio/technology-capability-map.css`
- Modify: `apps/web/apps/web/src/index.css`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/technology-capability-map.test.tsx`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/dashboard-navigation-contract.test.ts`

**Interfaces:**
- Produce `TechnologyParticleBackdrop({ className, onStateChange })`.
- Consume the existing `mountTechnologyCapabilityParticleScene(canvas, CAPABILITY_DOMAINS, onReady)` function.
- Keep the Babylon bundle dynamically imported after intersection and idle scheduling.

- [ ] **Step 1: Add tests for shared decorative canvases**

```tsx
expect(container.querySelector("canvas.technology-map__particle-canvas")).toBeInTheDocument();
expect(openSourceSource).toContain("TechnologyParticleBackdrop");
```

- [ ] **Step 2: Extract the current scene lifecycle into `TechnologyParticleBackdrop`**

The component owns its canvas ref, eligibility policy, `IntersectionObserver`, idle callback, dynamic scene import, state notifications, and disposal. It renders only:

```tsx
<canvas ref={canvasRef} className={className} aria-hidden="true" data-active={state === "active"} />
```

- [ ] **Step 3: Replace the capability map canvas lifecycle with the shared component**

Keep `data-scene-state` on the map section through `onStateChange={setSceneState}`. Remove duplicate controller and scheduling code from the map.

- [ ] **Step 4: Add the shared backdrop to the open-source index**

Render `TechnologyParticleBackdrop` inside the open-source section before repository cards. Use `pointer-events: none`, low opacity, absolute positioning, and a mask gradient so particles recede behind readable glass cards.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm exec vitest run src/features/portfolio/__tests__/technology-capability-map.test.tsx src/features/portfolio/__tests__/dashboard-navigation-contract.test.ts
```

Expected: both files pass without eagerly importing Babylon during SSR tests.

---

### Task 3: Synchronize interview project narratives

**Files:**
- Modify: `apps/web/apps/web/src/features/portfolio/dashboard-content.tsx`
- Modify: `apps/web/apps/web/src/data/portfolio-projects.ts`
- Modify: `/Users/shier/Desktop/repos/Tiancheng-Xu/README.md`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/dashboard-resume.test.tsx`
- Test: `apps/web/apps/web/src/features/portfolio/__tests__/dashboard-project-links.test.tsx`

**Interfaces:**
- Keep `Agent Market` and `Personal AI Agent` as stable official titles.
- Add interview subtitles and synchronized descriptions without changing routes or production links.

- [ ] **Step 1: Extend the resume test with the interview subtitles**

```tsx
expect(resume.getByText(/Aladdin · AI Agent 交易与任务分发平台/)).toBeVisible();
expect(resume.getByText(/AI 智能客服与私有化模型交付/)).toBeVisible();
```

- [ ] **Step 2: Update Agent Market copy**

Use this concise Dashboard description:

```text
面向 AI Agent 众包交易场景，构建任务自动拆解、候选 Agent 过滤与评分、人工或自动选定、多阶段生产分发及可审计交付闭环；以 LangGraph DAG、多运行时服务、PostgreSQL Checkpoint、异步队列、信誉评分与 LLM 质量评测处理暂停恢复、冷启动和复杂任务分发。
```

Use the same narrative in `PORTFOLIO_PROJECTS`, with architecture and skills expanded to include Node/Hono, Python/Go, PostgreSQL Checkpoint, queues/DLQ, Bayesian reputation scoring, LLM evaluation, ranking, and LocalStack.

- [ ] **Step 3: Update Personal AI Agent copy**

Use this concise Dashboard description:

```text
面向智能客服场景，构建意图识别、领域模型微调、知识图谱/RAG、Tool Calling、多轮问答和人工分流链路；基于 Qwen3-8B、QLoRA/NF4、Qwen Embedding、LlamaFactory、GGUF 与 Ollama，覆盖咨询分类、语义检索、低置信度转人工和离线私有化交付。
```

Use the same narrative in `PORTFOLIO_PROJECTS`, expanding skills with intent classification, knowledge graph, RAG, embedding retrieval, tools, human handoff, and private deployment.

- [ ] **Step 4: Synchronize the GitHub Profile tables**

Keep production, repository, and Evidence links unchanged. Add the same subtitles and condensed descriptions so GitHub and Dashboard tell the same two project stories.

- [ ] **Step 5: Run focused resume and link tests**

Run:

```bash
pnpm exec vitest run src/features/portfolio/__tests__/dashboard-resume.test.tsx src/features/portfolio/__tests__/dashboard-project-links.test.tsx
```

Expected: titles, subtitles, descriptions, production links, and Evidence links pass.

---

### Task 4: Local validation and preview handoff

**Files:**
- Verify only; do not create deployment files.

**Interfaces:**
- Consume all components and data from Tasks 1-3.
- Produce a locally reviewable `/dashboard` and `/open-source` without pushing.

- [ ] **Step 1: Run the focused test set**

```bash
pnpm exec vitest run src/features/portfolio/__tests__/technology-capability-map.test.tsx src/features/portfolio/__tests__/dashboard-resume.test.tsx src/features/portfolio/__tests__/dashboard-project-links.test.tsx src/features/portfolio/__tests__/dashboard-navigation-contract.test.ts
```

- [ ] **Step 2: Run TypeScript validation**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Present local preview routes**

Review:

```text
http://127.0.0.1:3001/dashboard#technology-map
http://127.0.0.1:3001/open-source
```

Do not push or publish after validation.
