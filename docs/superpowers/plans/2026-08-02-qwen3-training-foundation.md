# Qwen3 Training Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the isolated `RAG 与 Agent 编排` homework node, create a privacy-safe and reproducible SFT dataset from the read-only learning notes, run a Qwen3-8B QLoRA smoke training on the NVIDIA UU cloud machine, and recover a verified Adapter plus base/adapter evaluation evidence.

**Architecture:** All writable code and derived data live under `course-homework/homeworks/04-rag-agent-orchestration`; `/Users/shier/Desktop/一灯学习笔记` is read-only. TypeScript prepares manifests, deduplicates sources, drafts and validates SFT JSONL, splits by source group, and builds a allowlisted remote bundle. Python and LlamaFactory run only on the NVIDIA CUDA machine; the Mac receives Adapter, logs, hashes, and evaluation results but never hosts the training stack.

**Tech Stack:** pnpm 11.17.0, Node.js 22+, TypeScript 6, Vitest, Zod 4, Python 3.11, PyTorch 2.11.0 CUDA 12.8, LlamaFactory 0.9.5, Transformers/PEFT/bitsandbytes through LlamaFactory, `Qwen/Qwen3-8B`, PowerShell on the UU Windows cloud machine.

## Global Constraints

- The original homework name remains `RAG 与 Agent 编排`; `Qwen3 + 学习笔记` is recorded as the actual implementation.
- `/Users/shier/Desktop/一灯学习笔记` is strictly read-only: no create, modify, move, delete, format, or cache operations.
- The complete notes repository must never be uploaded to UU; only reviewed JSONL splits, training code, configs, and frozen tests may leave the Mac.
- No model weights, Hugging Face cache, vector database files, private datasets, credentials, phone numbers, or personal memory may be committed.
- Training runs only on NVIDIA CUDA. The Mac performs preparation, Git work, artifact inspection, and later inference.
- The UU candidate costs 450 U coins per hour and the account currently has 1900 U coins. The approved hard ceiling is four hours (1800 U coins), with a ten-minute shutdown/download reserve. Starting the machine still requires an action-time confirmation after the local bundle is frozen.
- Initial smoke training uses at most 100 training examples, cutoff length 1024, micro-batch 1, one epoch, and no FlashAttention build.
- Every artifact is identified by SHA-256; every split is grouped by source before partitioning to prevent leakage.
- The plan stops after QLoRA artifact recovery. Qdrant/Mastra/Mastra Client and LangGraph are implemented in separate plans after this deliverable passes.

---

## File Structure

```text
homeworks/04-rag-agent-orchestration/
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── corpus/
│   │   ├── types.ts
│   │   ├── discover.ts
│   │   ├── manifest.ts
│   │   ├── deduplicate.ts
│   │   └── safety.ts
│   ├── dataset/
│   │   ├── schema.ts
│   │   ├── draft.ts
│   │   ├── review.ts
│   │   ├── split.ts
│   │   └── leakage.ts
│   ├── bundle/
│   │   ├── build.ts
│   │   └── verify.ts
│   └── evidence/
│       └── schema.ts
├── tests/
│   ├── corpus.test.ts
│   ├── safety.test.ts
│   ├── dataset.test.ts
│   ├── leakage.test.ts
│   ├── bundle.test.ts
│   ├── training-config.test.ts
│   └── evaluation-contract.test.ts
├── data/
│   ├── README.md
│   └── private/                 # ignored
├── training/
│   ├── pyproject.toml
│   ├── preflight.py
│   ├── verify_dataset.py
│   ├── evaluate.py
│   ├── collect_artifacts.py
│   ├── dataset_info.json
│   └── configs/
│       └── qwen3-8b-smoke.yaml
├── artifacts/
│   ├── README.md
│   └── private/                 # ignored
└── docs/
    ├── uu-runbook.md
    └── training-evidence.md
```

---

### Task 1: Establish the isolated homework node and repository contract

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/README.md`
- Create: `homeworks/04-rag-agent-orchestration/package.json`
- Create: `homeworks/04-rag-agent-orchestration/tsconfig.json`
- Create: `homeworks/04-rag-agent-orchestration/vitest.config.ts`
- Create: `homeworks/04-rag-agent-orchestration/data/README.md`
- Create: `homeworks/04-rag-agent-orchestration/artifacts/README.md`
- Modify: `pnpm-workspace.yaml`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `HOMEWORKS.md`
- Test: `scripts/__tests__/rag-agent-homework-layout.test.mjs`

**Interfaces:**
- Consumes: the existing pnpm monorepo and `HOMEWORKS.md` ledger.
- Produces: workspace package `@course-homework/rag-agent-orchestration` with scripts `check`, `test`, `typecheck`, `manifest`, `dataset:verify`, and `bundle:verify`.

- [ ] **Step 1: Write the failing structure test**

```js
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const homework = new URL("homeworks/04-rag-agent-orchestration/", root);

test("RAG homework has an isolated package and records the actual implementation", async () => {
  await stat(new URL("package.json", homework));
  const readme = await readFile(new URL("README.md", homework), "utf8");
  assert.match(readme, /^# RAG 与 Agent 编排/m);
  assert.match(readme, /实际实现：.*Qwen\/Qwen3-8B.*NVIDIA CUDA.*一灯学习笔记/s);
});

test("the learning notes source is documented as read-only", async () => {
  const readme = await readFile(new URL("README.md", homework), "utf8");
  assert.match(readme, /\/Users\/shier\/Desktop\/一灯学习笔记/);
  assert.match(readme, /严格只读/);
});
```

- [ ] **Step 2: Run the structure test and verify it fails**

Run: `node --test scripts/__tests__/rag-agent-homework-layout.test.mjs`

Expected: FAIL with `ENOENT` for `homeworks/04-rag-agent-orchestration/package.json`.

- [ ] **Step 3: Create the package boundary**

Use this package manifest:

```json
{
  "name": "@course-homework/rag-agent-orchestration",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "biome check src tests package.json tsconfig.json vitest.config.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "manifest": "tsx src/corpus/manifest.ts",
    "dataset:verify": "tsx src/dataset/review.ts",
    "bundle:verify": "tsx src/bundle/verify.ts"
  },
  "dependencies": {
    "zod": "catalog:"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "tsx": "^4.20.6",
    "typescript": "catalog:",
    "vitest": "^4.1.10",
    "yaml": "^2.9.0"
  }
}
```

Add `homeworks/*` to `pnpm-workspace.yaml`. Add root scripts named `rag:check`, `rag:test`, and `rag:typecheck` that filter `@course-homework/rag-agent-orchestration`.

Add these ignore rules:

```gitignore
homeworks/04-rag-agent-orchestration/data/private/
homeworks/04-rag-agent-orchestration/artifacts/private/
homeworks/04-rag-agent-orchestration/.cache/
homeworks/04-rag-agent-orchestration/**/outputs/
homeworks/04-rag-agent-orchestration/**/*.safetensors
homeworks/04-rag-agent-orchestration/**/*.gguf
```

In `HOMEWORKS.md`, keep the heading `里程碑 4：RAG 与 Agent 编排` and append an `实际实现` paragraph describing Qwen3-8B CUDA QLoRA and the read-only learning notes knowledge base. Do not rename the homework.

- [ ] **Step 4: Install the workspace metadata and run the structure test**

Run: `pnpm install --lockfile-only && node --test scripts/__tests__/rag-agent-homework-layout.test.mjs`

Expected: the new structure tests PASS and the lockfile contains `homeworks/04-rag-agent-orchestration`.

- [ ] **Step 5: Run the existing structural regression suite**

Run: `pnpm test:structure`

Expected: all existing tests plus the new layout tests PASS.

- [ ] **Step 6: Commit the homework boundary**

```bash
git add .gitignore HOMEWORKS.md package.json pnpm-workspace.yaml pnpm-lock.yaml scripts/__tests__/rag-agent-homework-layout.test.mjs homeworks/04-rag-agent-orchestration
git commit -m "chore: establish RAG Agent homework node"
```

---

### Task 2: Build a read-only corpus discovery and manifest pipeline

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/src/corpus/types.ts`
- Create: `homeworks/04-rag-agent-orchestration/src/corpus/discover.ts`
- Create: `homeworks/04-rag-agent-orchestration/src/corpus/manifest.ts`
- Test: `homeworks/04-rag-agent-orchestration/tests/corpus.test.ts`

**Interfaces:**
- Consumes: `CorpusOptions { root: string; excludedDirectoryNames: ReadonlySet<string> }`.
- Produces: `discoverMarkdown(options): Promise<readonly SourceDocument[]>` and `writeManifest(documents, destination): Promise<void>`.

- [ ] **Step 1: Write failing discovery tests**

```ts
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverMarkdown } from "../src/corpus/discover.js";

describe("discoverMarkdown", () => {
  it("returns Markdown metadata without writing to the source", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "rag-source-"));
    await writeFile(path.join(root, "lesson.md"), "# Lesson\nBody", "utf8");
    await mkdir(path.join(root, ".git"));
    await writeFile(path.join(root, ".git", "ignored.md"), "ignore", "utf8");
    const before = await readFile(path.join(root, "lesson.md"), "utf8");

    const result = await discoverMarkdown({
      root,
      excludedDirectoryNames: new Set([".git", "node_modules", ".archive", "tmp"]),
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ relativePath: "lesson.md", byteLength: 13 });
    expect(await readFile(path.join(root, "lesson.md"), "utf8")).toBe(before);
  });
});
```

- [ ] **Step 2: Verify the discovery test fails**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- corpus.test.ts`

Expected: FAIL because `discoverMarkdown` does not exist.

- [ ] **Step 3: Implement focused corpus types and discovery**

Define:

```ts
export type SourceDocument = Readonly<{
  absolutePath: string;
  relativePath: string;
  byteLength: number;
  modifiedAt: string;
  contentSha256: string;
}>;

export type CorpusOptions = Readonly<{
  root: string;
  excludedDirectoryNames: ReadonlySet<string>;
}>;
```

`discoverMarkdown` must use `readdir`, `readFile`, and `stat`; it must never call a write API. Sort results by `relativePath` before returning. Compute SHA-256 from the exact UTF-8 bytes.

`manifest.ts` must refuse a destination inside the source root using `path.relative`; write JSON only under the homework node.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- corpus.test.ts && pnpm rag:typecheck`

Expected: PASS.

- [ ] **Step 5: Generate the first private manifest**

Run:

```bash
RAG_SOURCE_ROOT='/Users/shier/Desktop/一灯学习笔记' \
RAG_MANIFEST_PATH='homeworks/04-rag-agent-orchestration/data/private/corpus-manifest.json' \
pnpm --filter @course-homework/rag-agent-orchestration manifest
```

Expected: the manifest is created under `data/private`, contains only Markdown metadata and hashes, and `git status --short` does not list it.

- [ ] **Step 6: Commit corpus discovery**

```bash
git add homeworks/04-rag-agent-orchestration/src/corpus homeworks/04-rag-agent-orchestration/tests/corpus.test.ts
git commit -m "feat: discover learning notes without mutation"
```

---

### Task 3: Deduplicate content and enforce the outbound safety boundary

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/src/corpus/deduplicate.ts`
- Create: `homeworks/04-rag-agent-orchestration/src/corpus/safety.ts`
- Test: `homeworks/04-rag-agent-orchestration/tests/safety.test.ts`

**Interfaces:**
- Consumes: `readonly HashDocument[]` and bounded text excerpts.
- Produces: `DeduplicationResult` and `scanOutboundText(text): readonly SafetyFinding[]` without returning matched secret values.

- [ ] **Step 1: Write failing deduplication and redaction tests**

```ts
import { describe, expect, it } from "vitest";
import { deduplicateByHash } from "../src/corpus/deduplicate.js";
import { scanOutboundText } from "../src/corpus/safety.js";

describe("outbound safety", () => {
  it("keeps one canonical path per exact content hash", () => {
    const result = deduplicateByHash([
      { relativePath: "b.md", contentSha256: "same" },
      { relativePath: "a.md", contentSha256: "same" },
      { relativePath: "c.md", contentSha256: "other" },
    ]);
    expect(result.canonicalPaths).toEqual(["a.md", "c.md"]);
    expect(result.duplicates).toEqual([{ canonicalPath: "a.md", duplicatePath: "b.md" }]);
  });

  it("reports categories without echoing credentials", () => {
    const input = "api_key=sk-example-secret-value";
    const findings = scanOutboundText(input);
    expect(findings).toEqual([{ category: "api-key", start: 0, end: input.length }]);
    expect(JSON.stringify(findings)).not.toContain("sk-example-secret-value");
  });
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- safety.test.ts`

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement deterministic deduplication and safety findings**

Use these public types:

```ts
export type SafetyFinding = Readonly<{
  category: "api-key" | "private-key" | "password" | "phone" | "email";
  start: number;
  end: number;
}>;

export type DeduplicationResult = Readonly<{
  canonicalPaths: readonly string[];
  duplicates: readonly Readonly<{ canonicalPath: string; duplicatePath: string }>[];
}>;

export type HashDocument = Readonly<{
  relativePath: string;
  contentSha256: string;
}>;
```

Patterns must detect key assignments, PEM private-key headers, explicit password assignments, mainland China phone numbers, and email addresses. Findings contain offsets and categories only. All outbound dataset builders must reject non-empty findings.

- [ ] **Step 4: Run tests and check**

Run: `pnpm rag:test && pnpm rag:check && pnpm rag:typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the safety boundary**

```bash
git add homeworks/04-rag-agent-orchestration/src/corpus homeworks/04-rag-agent-orchestration/tests/safety.test.ts
git commit -m "feat: guard the outbound training corpus"
```

---

### Task 4: Define and locally draft reviewable Qwen3 SFT examples

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/src/dataset/schema.ts`
- Create: `homeworks/04-rag-agent-orchestration/src/dataset/draft.ts`
- Create: `homeworks/04-rag-agent-orchestration/src/dataset/review.ts`
- Test: `homeworks/04-rag-agent-orchestration/tests/dataset.test.ts`

**Interfaces:**
- Consumes: bounded source excerpts and local Ollama OpenAI-compatible endpoint `http://localhost:11434/v1`.
- Produces: private JSONL records matching `SftExample`, each with provenance and review state.

- [ ] **Step 1: Write the failing schema and review tests**

```ts
import { describe, expect, it } from "vitest";
import { SftExampleSchema } from "../src/dataset/schema.js";
import { validateForExport } from "../src/dataset/review.js";

const example = {
  id: "architecture-001",
  sourceIds: [`sha256:${"a".repeat(64)}`],
  topic: "architecture",
  messages: [
    { role: "system", content: "区分课程事实、官方事实和推导。" },
    { role: "user", content: "RAG 和微调怎么分工？" },
    { role: "assistant", content: "微调稳定回答方式，RAG 提供可更新且可引用的事实。" },
  ],
  review: { status: "approved", reviewedAt: "2026-08-02T00:00:00.000Z" },
};

describe("SFT dataset", () => {
  it("accepts a reviewed three-message example", () => {
    expect(SftExampleSchema.parse(example)).toEqual(example);
  });

  it("rejects drafts and safety findings from export", () => {
    expect(() => validateForExport({ ...example, review: { status: "draft" } })).toThrow(/approved/);
  });
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- dataset.test.ts`

Expected: FAIL because the schema and validator are missing.

- [ ] **Step 3: Implement the schema and local drafting client**

The public schema is:

```ts
const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(8000),
});

export const SftExampleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  sourceIds: z.array(z.string().regex(/^sha256:[a-f0-9]{64}$/)).min(1),
  topic: z.enum(["learn", "interview", "architecture", "execute", "refusal"]),
  messages: z.tuple([
    MessageSchema.extend({ role: z.literal("system") }),
    MessageSchema.extend({ role: z.literal("user") }),
    MessageSchema.extend({ role: z.literal("assistant") }),
  ]),
  review: z.discriminatedUnion("status", [
    z.object({ status: z.literal("draft") }),
    z.object({ status: z.literal("approved"), reviewedAt: z.iso.datetime() }),
    z.object({ status: z.literal("rejected"), reason: z.string().min(1) }),
  ]),
});
```

`draft.ts` sends only one bounded excerpt at a time to the local Ollama endpoint and requests strict JSON. It must set `review.status` to `draft`; no generated answer becomes exportable without review.

- [ ] **Step 4: Run tests and generate 10 local draft examples**

Run: `pnpm rag:test && pnpm --filter @course-homework/rag-agent-orchestration exec tsx src/dataset/draft.ts --limit 10`

Expected: tests PASS and drafts appear only in `data/private/drafts.jsonl`.

- [ ] **Step 5: Review the 10 examples before scaling**

For each record verify: direct support from cited source hashes, no copied long passage, no personal data, correct distinction between course/official/inference, and useful behavior target. Mark accepted examples `approved`; rejected records retain a short reason.

Run: `pnpm --filter @course-homework/rag-agent-orchestration dataset:verify`

Expected: exit 0 only when every exported record is approved and safety-clean.

- [ ] **Step 6: Commit dataset tooling, not private data**

```bash
git add homeworks/04-rag-agent-orchestration/src/dataset homeworks/04-rag-agent-orchestration/tests/dataset.test.ts
git commit -m "feat: draft reviewable Qwen3 SFT examples"
```

---

### Task 5: Split by source group and prove there is no dataset leakage

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/src/dataset/split.ts`
- Create: `homeworks/04-rag-agent-orchestration/src/dataset/leakage.ts`
- Test: `homeworks/04-rag-agent-orchestration/tests/leakage.test.ts`

**Interfaces:**
- Consumes: approved `readonly SftExample[]`.
- Produces: `DatasetSplits { train; validation; test }` with deterministic seed `20260802` and a leakage report.

- [ ] **Step 1: Write the failing leakage test**

```ts
import { describe, expect, it } from "vitest";
import { splitBySource } from "../src/dataset/split.js";
import { assertNoLeakage } from "../src/dataset/leakage.js";

describe("dataset splitting", () => {
  it("keeps examples sharing a source in the same split", () => {
    const examples = [
      { id: "a", sourceIds: [`sha256:${"1".repeat(64)}`] },
      { id: "b", sourceIds: [`sha256:${"1".repeat(64)}`] },
      { id: "c", sourceIds: [`sha256:${"2".repeat(64)}`] },
      { id: "d", sourceIds: [`sha256:${"3".repeat(64)}`] },
    ];
    const splits = splitBySource(examples, { seed: 20260802, ratios: [0.8, 0.1, 0.1] });
    expect(() => assertNoLeakage(splits)).not.toThrow();
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- leakage.test.ts`

Expected: FAIL because split functions are absent.

- [ ] **Step 3: Implement connected-source grouping and deterministic partitioning**

Treat examples as a graph: examples are connected when any `sourceIds` overlap; connected components are indivisible split groups. Sort components by seeded hash, allocate 80% train, 10% validation, and 10% frozen test by example count, and require at least one group in every split.

`assertNoLeakage` must fail on shared `id`, shared `sourceId`, duplicate normalized user question, or duplicate normalized assistant answer across splits.

- [ ] **Step 4: Run the leakage suite and export private splits**

Run: `pnpm rag:test && pnpm --filter @course-homework/rag-agent-orchestration exec tsx src/dataset/split.ts`

Expected: `data/private/train.jsonl`, `validation.jsonl`, `test.jsonl`, and `split-report.json` are created and ignored by Git.

- [ ] **Step 5: Commit split and leakage logic**

```bash
git add homeworks/04-rag-agent-orchestration/src/dataset homeworks/04-rag-agent-orchestration/tests/leakage.test.ts
git commit -m "feat: prevent Qwen3 dataset leakage"
```

---

### Task 6: Create the reproducible CUDA training package

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/training/pyproject.toml`
- Create: `homeworks/04-rag-agent-orchestration/training/preflight.py`
- Create: `homeworks/04-rag-agent-orchestration/training/verify_dataset.py`
- Create: `homeworks/04-rag-agent-orchestration/training/dataset_info.json`
- Create: `homeworks/04-rag-agent-orchestration/training/configs/qwen3-8b-smoke.yaml`
- Test: `homeworks/04-rag-agent-orchestration/tests/training-config.test.ts`

**Interfaces:**
- Consumes: private train/validation/test JSONL and an NVIDIA GPU.
- Produces: a LlamaFactory dataset registration, preflight report, and immutable smoke-training config.

- [ ] **Step 1: Write the failing config contract test**

```ts
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

describe("QLoRA smoke config", () => {
  it("uses the approved Qwen3 low-memory settings", async () => {
    const raw = await readFile(new URL("../training/configs/qwen3-8b-smoke.yaml", import.meta.url), "utf8");
    const config = parse(raw);
    expect(config).toMatchObject({
      model_name_or_path: "Qwen/Qwen3-8B",
      stage: "sft",
      finetuning_type: "lora",
      quantization_bit: 4,
      quantization_method: "bitsandbytes",
      template: "qwen3",
      cutoff_len: 1024,
      per_device_train_batch_size: 1,
      num_train_epochs: 1,
      bf16: true,
    });
  });
});
```

- [ ] **Step 2: Verify the config test fails**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- training-config.test.ts`

Expected: FAIL because the YAML file is missing.

- [ ] **Step 3: Add the Python environment and preflight**

Use this project metadata:

```toml
[project]
name = "course-homework-qwen3-training"
version = "0.1.0"
requires-python = ">=3.11,<3.14"
dependencies = ["llamafactory==0.9.5"]
```

`preflight.py` must print JSON containing Python, PyTorch, CUDA runtime, GPU name, total/free VRAM, driver version, LlamaFactory version, and disk free space. It must exit non-zero when CUDA is unavailable, VRAM is below 11 GiB, free disk is below 35 GiB, BF16 is unsupported, or PyTorch is not `2.11.0+cu128`.

- [ ] **Step 4: Add dataset verification and exact smoke config**

Use this training configuration:

```yaml
model_name_or_path: Qwen/Qwen3-8B
trust_remote_code: false
stage: sft
do_train: true
do_eval: true
finetuning_type: lora
lora_target: all
lora_rank: 16
lora_alpha: 32
lora_dropout: 0.05
quantization_bit: 4
quantization_method: bitsandbytes
double_quantization: true
quantization_type: nf4
dataset: yideng_train
eval_dataset: yideng_validation
dataset_dir: data
template: qwen3
enable_thinking: false
cutoff_len: 1024
max_samples: 100
overwrite_cache: true
preprocessing_num_workers: 4
output_dir: outputs/qwen3-8b-yideng-smoke
logging_steps: 1
save_steps: 20
eval_strategy: steps
eval_steps: 20
plot_loss: true
overwrite_output_dir: true
per_device_train_batch_size: 1
per_device_eval_batch_size: 1
gradient_accumulation_steps: 16
learning_rate: 0.0002
num_train_epochs: 1
lr_scheduler_type: cosine
warmup_ratio: 0.1
bf16: true
gradient_checkpointing: true
seed: 20260802
report_to: none
```

`dataset_info.json` must register `yideng_train` and `yideng_validation` as ShareGPT datasets, map the `messages` column, and define `role`/`content` plus `system`/`user`/`assistant` tags. The bundle builder copies it to `data/dataset_info.json`, matching LlamaFactory's `dataset_dir`.

`verify_dataset.py` must parse every JSONL line, require payloads shaped exactly as `{ "messages": [...] }`, require exactly system/user/assistant messages, reject provenance/review fields in the training payload, require 10–100 train rows and at least 5 validation/test rows, and emit counts plus SHA-256.

- [ ] **Step 5: Run config tests locally without installing training packages**

Run: `pnpm rag:test && pnpm rag:check && pnpm rag:typecheck`

Expected: TypeScript checks PASS. Do not run `uv sync` on the Mac.

- [ ] **Step 6: Commit the training package**

```bash
git add homeworks/04-rag-agent-orchestration/training homeworks/04-rag-agent-orchestration/tests/training-config.test.ts
git commit -m "feat: define Qwen3 CUDA smoke training"
```

---

### Task 7: Build and verify an allowlisted remote bundle

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/src/bundle/build.ts`
- Create: `homeworks/04-rag-agent-orchestration/src/bundle/verify.ts`
- Test: `homeworks/04-rag-agent-orchestration/tests/bundle.test.ts`

**Interfaces:**
- Consumes: approved private splits and committed `training/` files.
- Produces: `artifacts/private/qwen3-smoke-upload.zip` and `qwen3-smoke-upload.manifest.json`.

- [ ] **Step 1: Write the failing allowlist test**

```ts
import { describe, expect, it } from "vitest";
import { assertBundleEntries } from "../src/bundle/verify.js";

describe("remote bundle", () => {
  it("rejects notes, git data, credentials, and unlisted files", () => {
    expect(() => assertBundleEntries(["training/preflight.py", "data/train.jsonl"])).not.toThrow();
    expect(() => assertBundleEntries(["一灯学习笔记/课程总结.md"])).toThrow(/allowlist/);
    expect(() => assertBundleEntries([".git/config"])).toThrow(/allowlist/);
    expect(() => assertBundleEntries([".env"])).toThrow(/allowlist/);
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- bundle.test.ts`

Expected: FAIL because bundle verification is missing.

- [ ] **Step 3: Implement exact bundle allowlists**

Allow only:

```text
training/pyproject.toml
training/preflight.py
training/verify_dataset.py
training/configs/qwen3-8b-smoke.yaml
data/dataset_info.json
data/train.jsonl
data/validation.jsonl
data/test.jsonl
MANIFEST.json
```

Before zipping, run outbound safety scanning on every JSONL message, strip provenance and review fields from the training copy, write per-file byte length and SHA-256 to `MANIFEST.json`, and reject symlinks or paths containing `..`.

- [ ] **Step 4: Build and verify the private bundle**

Run:

```bash
pnpm --filter @course-homework/rag-agent-orchestration exec tsx src/bundle/build.ts
pnpm --filter @course-homework/rag-agent-orchestration bundle:verify
```

Expected: both commands exit 0; the manifest lists exactly eight payload entries plus `MANIFEST.json`; Git ignores the ZIP and private manifest.

- [ ] **Step 5: Run all local preflight checks**

Run: `pnpm rag:check && pnpm rag:test && pnpm rag:typecheck && pnpm test:structure`

Expected: PASS.

- [ ] **Step 6: Commit bundle tooling**

```bash
git add homeworks/04-rag-agent-orchestration/src/bundle homeworks/04-rag-agent-orchestration/tests/bundle.test.ts
git commit -m "feat: package privacy-safe CUDA training bundle"
```

---

### Task 8: Run the paid UU CUDA smoke-training checkpoint

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/docs/uu-runbook.md`
- Create: `homeworks/04-rag-agent-orchestration/docs/training-evidence.md`
- Modify after run: `homeworks/04-rag-agent-orchestration/artifacts/README.md`

**Interfaces:**
- Consumes: verified upload ZIP, 1900 U coins, and the UU 4070Ti/5070 cloud machine.
- Produces: real preflight output, training output directory, cost timestamps, and a stop/retry decision.

- [ ] **Step 1: Record the exact action-time confirmation checkpoint**

The runbook must state:

```text
Do not click the UU play button until the user confirms:
- Device: 4070Ti/5070 云真机
- Rate: 450 U币/小时
- Available balance: 1900 U币
- Maximum planned spend: 1800 U币 / four hours
- Mandatory reserve: start artifact download and shutdown no later than 3h50m
- Purpose: Qwen3-8B QLoRA smoke training and artifact validation
```

- [ ] **Step 2: After confirmation, start the device, upload the frozen bundle, and capture hardware facts**

Upload only `qwen3-smoke-upload.zip` and its local SHA-256. In PowerShell, verify the hash before extraction:

```powershell
Get-FileHash .\qwen3-smoke-upload.zip -Algorithm SHA256
Expand-Archive .\qwen3-smoke-upload.zip -DestinationPath .\qwen3-smoke -Force
Set-Location .\qwen3-smoke
New-Item -ItemType Directory -Force artifacts | Out-Null
```

The remote hash must match the local upload manifest before continuing.

In PowerShell run:

```powershell
nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv,noheader
Get-PSDrive -PSProvider FileSystem | Select-Object Name,Free,Used
py --version
```

Expected: an NVIDIA 4070Ti or 5070, at least 11 GiB total VRAM, at least 35 GiB free disk, and Python 3.11–3.13 or a clear signal to install 3.11.

- [ ] **Step 3: Stop early when hardware or disk fails the contract**

If any preflight limit fails, save the text output, stop the UU machine before installing anything, record elapsed minutes and U coins, and return to machine selection. Do not lower the model size without updating the approved design.

- [ ] **Step 4: Install the pinned environment without FlashAttention**

```powershell
winget install --exact --id astral-sh.uv
uv venv --python 3.11 .venv
.\.venv\Scripts\Activate.ps1
uv pip install torch==2.11.0 torchvision==0.26.0 torchaudio==2.11.0 --index-url https://download.pytorch.org/whl/cu128
uv pip install llamafactory==0.9.5
python training\preflight.py | Tee-Object artifacts\preflight.json
python training\verify_dataset.py data | Tee-Object artifacts\dataset-verification.json
```

Expected: both Python commands exit 0. Do not install `flash-attn`, DeepSpeed, vLLM, Jupyter, or GUI training tools during the smoke run.

- [ ] **Step 5: Launch the one-epoch QLoRA smoke run**

```powershell
llamafactory-cli train training\configs\qwen3-8b-smoke.yaml 2>&1 | Tee-Object artifacts\training-console.log
```

Expected: training reaches the configured epoch, writes Adapter files and trainer state under `outputs/qwen3-8b-yideng-smoke`, records finite train/eval loss, and does not hit CUDA OOM.

- [ ] **Step 6: Handle a single CUDA OOM safely**

If the first run OOMs, stop the process, preserve the log, change only `cutoff_len` from `1024` to `768` and `gradient_accumulation_steps` from `16` to `21`, record the deviation in `training-evidence.md`, and retry once. A second OOM ends the paid run; do not keep guessing parameters while the timer runs.

- [ ] **Step 7: Record the cost and obey the four-hour hard ceiling**

At 50 minutes and every hour thereafter, record progress and remaining download time. Begin packaging no later than 3h35m and begin downloading no later than 3h40m. Stop the machine by 3h50m even if optional evaluation work remains; do not consume the final 100 U-coin reserve.

---

### Task 9: Evaluate, package, download, and verify the Adapter

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/src/evidence/schema.ts`
- Create: `homeworks/04-rag-agent-orchestration/training/evaluate.py`
- Create: `homeworks/04-rag-agent-orchestration/training/collect_artifacts.py`
- Test: `homeworks/04-rag-agent-orchestration/tests/evaluation-contract.test.ts`
- Modify: `homeworks/04-rag-agent-orchestration/docs/training-evidence.md`
- Modify: `homeworks/04-rag-agent-orchestration/artifacts/README.md`

**Interfaces:**
- Consumes: exact base model, trained Adapter, and frozen test JSONL.
- Produces: `evaluation.jsonl`, `evaluation-summary.json`, and a small artifact archive excluding base weights and private training text.

- [ ] **Step 1: Write the failing evaluation contract test**

```ts
import { describe, expect, it } from "vitest";
import { EvaluationRowSchema } from "../src/evidence/schema.js";

describe("evaluation evidence", () => {
  it("contains paired base and adapter results without private prompts", () => {
    expect(() => EvaluationRowSchema.parse({ id: "x" })).toThrow();
  });
});
```

- [ ] **Step 2: Implement paired evaluation**

Implement `EvaluationRowSchema` as the shared TypeScript evidence contract. `evaluate.py` must load the base in 4-bit twice sequentially: first without Adapter, then with `PeftModel.from_pretrained`. Use deterministic generation (`do_sample=False`, `max_new_tokens=256`) and the exact Qwen3 chat template with thinking disabled. Store full private responses only in the ignored remote working directory; the downloadable evidence stores response hashes, latency, structure score, refusal score, and aggregate deltas.

- [ ] **Step 3: Run frozen evaluation on the remote machine**

```powershell
python training\evaluate.py `
  --model Qwen/Qwen3-8B `
  --adapter outputs\qwen3-8b-yideng-smoke `
  --test data\test.jsonl `
  --private-output artifacts\private-evaluation.jsonl `
  --summary-output artifacts\evaluation-summary.json
```

Expected: each frozen test ID has paired base/adapter results; the summary includes counts and average deltas; no training example appears in test.

- [ ] **Step 4: Package only required artifacts**

`collect_artifacts.py` must include:

```text
adapter/adapter_config.json
adapter/adapter_model.safetensors
adapter/README.md
evidence/preflight.json
evidence/dataset-verification.json
evidence/training-console.log
evidence/trainer_state.json
evidence/train_results.json
evidence/eval_results.json
evidence/evaluation-summary.json
evidence/MANIFEST.json
```

It must exclude Hugging Face cache, base weights, optimizer state, raw JSONL, full prompts/responses, `.env`, browser data, and credentials. `MANIFEST.json` records byte length and SHA-256 for every entry.

- [ ] **Step 5: Download and verify before stopping the machine**

Download the artifact archive to `homeworks/04-rag-agent-orchestration/artifacts/private/`. Verify every SHA-256 against `MANIFEST.json`, open `adapter_config.json`, and confirm `base_model_name_or_path` is `Qwen/Qwen3-8B`.

Expected: local verification passes before the UU machine is stopped. If download or hashes fail, keep the machine only long enough for one retry and report the added cost risk.

- [ ] **Step 6: Stop UU and record the final evidence**

Stop the cloud machine, confirm its state is `未运行`, record start/stop timestamps and U coins consumed, and update `training-evidence.md` with factual results. Do not mark full training complete if only the smoke dataset was used.

- [ ] **Step 7: Run the full local regression suite**

Run:

```bash
pnpm rag:check
pnpm rag:test
pnpm rag:typecheck
pnpm check
pnpm test
pnpm typecheck
pnpm build
```

Expected: all commands PASS and Git does not list private data or model artifacts.

- [ ] **Step 8: Commit evidence manifests and documentation**

```bash
git add homeworks/04-rag-agent-orchestration/training/evaluate.py homeworks/04-rag-agent-orchestration/training/collect_artifacts.py homeworks/04-rag-agent-orchestration/tests/evaluation-contract.test.ts homeworks/04-rag-agent-orchestration/docs/training-evidence.md homeworks/04-rag-agent-orchestration/artifacts/README.md
git commit -m "docs: record Qwen3 CUDA smoke training evidence"
```

---

## Completion Boundary

This plan is complete only when Tasks 1–7 pass locally and Tasks 8–9 produce a real, hash-verified Adapter plus paired evaluation evidence from the UU NVIDIA machine. Completion means **QLoRA smoke-training foundation complete**, not full 300–1000 example training and not the later RAG/Mastra/LangGraph application.

After this plan passes, create separate implementation plans for:

1. learning-notes ingestion, Qdrant, BGE-M3, BM25/RRF, and mandatory Mastra Rerank;
2. Mastra Agent, Mastra Client frontend, and evaluation UI;
3. LangGraph stateful orchestration and framework comparison.
