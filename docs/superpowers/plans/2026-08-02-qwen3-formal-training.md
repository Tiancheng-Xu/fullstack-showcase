# Qwen3 Formal Yideng Agent Training Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a privacy-safe formal Qwen3 Yideng Agent dataset with at least 300 training examples plus independent validation and frozen test sets, run evidence-backed 4-bit NF4 QLoRA on verified NVIDIA CUDA hardware, and validate the resulting Adapter and GGUF/Ollama model against the same frozen test set.

**Architecture:** The Mac reads `/Users/shier/Desktop/一灯学习笔记` without mutation, creates reviewed derivative examples in ignored `data/private`, and builds an allowlisted ZIP. The paid remote machine performs hardware preflight, smoke training, formal training, Adapter reload, and base/adapter evaluation; the Mac receives hashed artifacts and performs GGUF/Ollama acceptance. This plan ends at the model gate; RAG, memory, Mastra, LangGraph, frontend, and platform adapters use separate implementation plans after the model gate passes.

**Tech Stack:** pnpm 11, Node.js 22+, TypeScript 6, Vitest 4, Zod 4, Python 3.11, PyTorch CUDA, Transformers, PEFT, bitsandbytes, LLaMA-Factory, Qwen3 8B-class instruction model, llama.cpp/Ollama.

## Global Constraints

- `/Users/shier/Desktop/一灯学习笔记` is strictly read-only; no cache, manifest, draft, index, or generated file may be written there.
- Existing release `rag-sft-20260802-v1` remains immutable and is smoke-only: 50 train, 7 validation, 6 frozen test.
- Formal release must contain at least 300 deduplicated, cleaned, source-traceable train examples; validation and frozen test are independent and do not count toward 300.
- Around 1000 train examples is preferred when quality permits; 1K–10K growth must add real coverage or boundaries, never mechanical paraphrases.
- Full notes, transcripts, credentials, personal data, private paths, temporary files, generated caches, model weights, Adapter, and GGUF are not committed or published.
- The base must be an instruction-capable Qwen3 model of at least 8B. Exact model ID, revision, Tokenizer, and chat template are frozen only after verification.
- Training is 4-bit NF4 QLoRA on NVIDIA CUDA. The Mac never runs QLoRA.
- No paid machine is started or expanded without action-time user confirmation. Candidate device labels are not hardware evidence.
- Base and Adapter use the same frozen test set. Passing requires explainable improvement without material regression.
- M5 24 GB Mac acceptance prioritizes quantized 8B; 14B is evaluated only after 8B passes and actual hardware/time permit. 32B is out of scope for v1.

---

## File Structure

```text
homeworks/04-rag-agent-orchestration/
├── src/dataset/
│   ├── schema.ts              # multi-turn sample and metadata contract
│   ├── coverage.ts            # capability/topic coverage accounting
│   ├── quality.ts             # answer and provenance quality gates
│   ├── similarity.ts          # near-duplicate fingerprints
│   ├── split.ts               # source/cluster grouped split
│   ├── leakage.ts             # exact and near-duplicate split checks
│   └── release.ts             # immutable release contract and minimums
├── tests/
│   ├── dataset-contract.test.ts
│   ├── coverage.test.ts
│   ├── quality.test.ts
│   ├── similarity.test.ts
│   ├── leakage.test.ts
│   └── release.test.ts
├── data/private/              # ignored drafts, review decisions, releases
├── training/
│   ├── configs/qwen3-8b-formal.yaml
│   ├── preflight.py
│   ├── verify_dataset.py
│   ├── evaluate.py
│   ├── collect_artifacts.py
│   ├── merge_adapter.py
│   └── export_ollama.md
├── artifacts/private/         # ignored upload and recovered artifacts
└── docs/
    ├── uu-runbook.md
    └── training-evidence.md
```

### Task 1: Expand the formal SFT contract

**Files:**
- Modify: `homeworks/04-rag-agent-orchestration/src/dataset/schema.ts`
- Create: `homeworks/04-rag-agent-orchestration/tests/dataset-contract.test.ts`
- Modify: `homeworks/04-rag-agent-orchestration/src/dataset/review.ts`

**Interfaces:**
- Consumes: existing v1 three-message examples.
- Produces: `SftExample`, `Capability`, `KnowledgeTopic`, and `TrainingRecord` supporting both legacy single-turn and formal multi-turn examples.

- [ ] **Step 1: Write failing contract tests**

```ts
import { describe, expect, it } from "vitest";
import { SftExampleSchema } from "../src/dataset/schema.js";

describe("formal SFT contract", () => {
  it("accepts a grill-me conversation with provenance and a quality label", () => {
    const parsed = SftExampleSchema.parse({
      id: "formal-grill-001",
      sourceIds: [`sha256:${"a".repeat(64)}`],
      capability: "grill-me",
      topic: "agent-behavior",
      messages: [
        { role: "system", content: "你是一灯 Agent。" },
        { role: "user", content: "帮我做项目。" },
        { role: "assistant", content: "你希望交付什么可验收结果？" },
        { role: "user", content: "做一个离线课程助理。" },
        { role: "assistant", content: "我将以离线问答和来源引用作为第一版验收。" },
      ],
      provenance: { sourceKind: "course-derived", sourceGroup: "agent-design" },
      review: { status: "approved", reviewedAt: "2026-08-02T18:00:00.000Z", rubricVersion: 2 },
    });
    expect(parsed.messages).toHaveLength(5);
  });

  it("continues to accept a v1 legacy example", () => {
    const parsed = SftExampleSchema.parse({
      id: "legacy-learn-001",
      sourceIds: [`sha256:${"b".repeat(64)}`],
      topic: "learn",
      messages: [
        { role: "system", content: "你是一名学习助理。" },
        { role: "user", content: "什么是 RAG？" },
        { role: "assistant", content: "RAG 是先检索资料，再让模型依据资料回答。" },
      ],
      review: { status: "approved", reviewedAt: "2026-08-02T18:00:00.000Z" },
    });
    expect(parsed.capability).toBe("learn");
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- dataset-contract.test.ts`

Expected: FAIL because `capability`, `provenance`, multi-turn messages, and `rubricVersion` are unsupported.

- [ ] **Step 3: Implement the compatible schema**

Define exact enums:

```ts
export const CapabilitySchema = z.enum([
  "learn", "interview", "architecture", "execute", "grill-me",
  "verification", "memory", "safety",
]);

export const KnowledgeTopicSchema = z.enum([
  "ai-foundations", "rag", "agent-behavior", "mastra", "langchain",
  "langgraph", "frontend", "backend", "cloud", "web3", "training",
  "harness-engineering", "career", "cross-topic",
]);
```

Make `messages` a non-empty array with a system message first, alternating user/assistant messages thereafter, and an assistant message last. Add `provenance.sourceKind`, `provenance.sourceGroup`, optional `legacyTopic`, and `review.rubricVersion`. Transform v1 `topic` values into `capability` during validation without rewriting v1 files.

- [ ] **Step 4: Run contract, existing dataset, and type tests**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- dataset-contract.test.ts dataset.test.ts && pnpm rag:typecheck`

Expected: PASS; all 63 v1 examples remain readable.

- [ ] **Step 5: Commit the contract**

```bash
git add homeworks/04-rag-agent-orchestration/src/dataset/schema.ts homeworks/04-rag-agent-orchestration/src/dataset/review.ts homeworks/04-rag-agent-orchestration/tests/dataset-contract.test.ts
git commit -m "feat: define formal Yideng Agent SFT contract"
```

### Task 2: Add coverage and quality gates

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/src/dataset/coverage.ts`
- Create: `homeworks/04-rag-agent-orchestration/src/dataset/quality.ts`
- Create: `homeworks/04-rag-agent-orchestration/tests/coverage.test.ts`
- Create: `homeworks/04-rag-agent-orchestration/tests/quality.test.ts`

**Interfaces:**
- Consumes: `readonly SftExample[]`.
- Produces: `measureCoverage(examples): CoverageReport` and `assertFormalQuality(examples): void`.

- [ ] **Step 1: Write failing coverage tests**

```ts
expect(() => assertFormalQuality(makeExamples({ trainCount: 299 }))).toThrow(
  "Formal train requires at least 300 approved examples",
);
const report = measureCoverage(makeRepresentativeExamples());
expect(report.byCapability.learn).toBeGreaterThan(0);
expect(report.multiTurnRatio).toBeGreaterThanOrEqual(0.2);
```

- [ ] **Step 2: Verify the tests fail**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- coverage.test.ts quality.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement deterministic gates**

`CoverageReport` contains total, approved, by-capability, by-topic, by-source-group, multi-turn ratio, boundary ratio, and answer-length percentiles. `assertFormalQuality` rejects non-approved rows, fewer than 300 train rows, empty source groups, missing required capabilities, duplicate IDs, answers shorter than 40 characters, and samples with placeholder phrases such as `TODO`, `TBD`, or `待补充`.

- [ ] **Step 4: Run focused and full package tests**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- coverage.test.ts quality.test.ts && pnpm rag:test`

Expected: PASS.

- [ ] **Step 5: Commit quality gates**

```bash
git add homeworks/04-rag-agent-orchestration/src/dataset/coverage.ts homeworks/04-rag-agent-orchestration/src/dataset/quality.ts homeworks/04-rag-agent-orchestration/tests/coverage.test.ts homeworks/04-rag-agent-orchestration/tests/quality.test.ts
git commit -m "feat: enforce formal dataset coverage and quality"
```

### Task 3: Detect near duplicates and grouped leakage

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/src/dataset/similarity.ts`
- Modify: `homeworks/04-rag-agent-orchestration/src/dataset/leakage.ts`
- Modify: `homeworks/04-rag-agent-orchestration/src/dataset/split.ts`
- Create: `homeworks/04-rag-agent-orchestration/tests/similarity.test.ts`
- Modify: `homeworks/04-rag-agent-orchestration/tests/leakage.test.ts`

**Interfaces:**
- Produces: `fingerprintText(text): ReadonlySet<string>`, `jaccard(left, right): number`, `clusterNearDuplicates(examples, threshold): readonly DuplicateCluster[]`.
- `splitBySource` additionally consumes duplicate cluster IDs so a cluster cannot cross splits.

- [ ] **Step 1: Write failing near-duplicate tests**

```ts
expect(jaccard(fingerprintText("RAG 为什么需要重排"), fingerprintText("为什么 RAG 要做 Rerank 重排"))).toBeGreaterThan(0.55);
expect(() => assertNoLeakage(splitsWithParaphraseAcrossTrainAndTest())).toThrow("Near-duplicate leakage");
```

- [ ] **Step 2: Verify failure**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- similarity.test.ts leakage.test.ts`

Expected: FAIL because near-duplicate detection is absent.

- [ ] **Step 3: Implement normalized character 3-gram similarity**

Normalize NFKC, lowercase Latin text, remove punctuation, collapse whitespace, and compute character 3-gram Jaccard. Use threshold `0.72` for automatic rejection and `0.58` for manual-review warnings. Apply the same cluster ID to question/answer pairs before grouped splitting.

- [ ] **Step 4: Run leakage regressions**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- similarity.test.ts leakage.test.ts split.test.ts`

Expected: PASS; v1 exact leakage behavior remains intact.

- [ ] **Step 5: Commit similarity protection**

```bash
git add homeworks/04-rag-agent-orchestration/src/dataset/similarity.ts homeworks/04-rag-agent-orchestration/src/dataset/leakage.ts homeworks/04-rag-agent-orchestration/src/dataset/split.ts homeworks/04-rag-agent-orchestration/tests/similarity.test.ts homeworks/04-rag-agent-orchestration/tests/leakage.test.ts
git commit -m "feat: block near-duplicate dataset leakage"
```

### Task 4: Create and review the formal derivative corpus

**Files:**
- Modify: `homeworks/04-rag-agent-orchestration/src/dataset/draft.ts`
- Modify: `homeworks/04-rag-agent-orchestration/src/dataset/apply-review.ts`
- Create: `homeworks/04-rag-agent-orchestration/tests/formal-draft.test.ts`
- Create ignored: `homeworks/04-rag-agent-orchestration/data/private/formal-drafts.jsonl`
- Create ignored: `homeworks/04-rag-agent-orchestration/data/private/formal-review-decisions.json`
- Create ignored: `homeworks/04-rag-agent-orchestration/data/private/formal-reviewed.jsonl`
- Create ignored: `homeworks/04-rag-agent-orchestration/data/private/formal-coverage.json`

**Interfaces:**
- Consumes: read-only corpus manifest, selected source sections, v1 examples, capability/topic quota.
- Produces: at least 300 approved train candidates plus separate validation/test candidates after review.

- [ ] **Step 1: Write the failing coverage-agenda test**

```ts
import { describe, expect, it } from "vitest";
import { buildCoverageAgenda } from "../src/dataset/draft.js";

describe("formal draft agenda", () => {
  it("allocates real capability and topic deficits without source text", () => {
    const agenda = buildCoverageAgenda({
      approved: [],
      sourceGroups: ["rag", "agent", "frontend", "backend", "cloud", "web3"],
      targetTrain: 300,
    });
    expect(agenda.requested).toBeGreaterThanOrEqual(340);
    expect(agenda.cells.every((cell) => cell.sourceText === undefined)).toBe(true);
    expect(new Set(agenda.cells.map((cell) => cell.capability))).toEqual(
      expect.objectContaining({ size: expect.any(Number) }),
    );
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- formal-draft.test.ts`

Expected: FAIL because `buildCoverageAgenda` does not exist.

- [ ] **Step 3: Implement formal agenda and bounded draft batches**

`buildCoverageAgenda` returns capability/topic/source-group cells and requests at least 340 candidates so review can reject weak rows while preserving 300 eligible train rows plus reserved validation/test groups. Formal mode emits batches of at most 60 rows, stores only source SHA-256 IDs in examples, and writes all outputs under `data/private`.

- [ ] **Step 4: Generate a source coverage agenda without copying notes**

Run:

```bash
RAG_SOURCE_ROOT='/Users/shier/Desktop/一灯学习笔记' \
RAG_FORMAL_DRAFT_PATH='homeworks/04-rag-agent-orchestration/data/private/formal-drafts.jsonl' \
pnpm --filter @course-homework/rag-agent-orchestration exec tsx src/dataset/draft.ts --formal
```

Expected: drafts contain derivative questions/answers and SHA-256 source IDs; no absolute source path appears in message content.

- [ ] **Step 5: Run privacy, credential, length, provenance, and duplicate checks**

Run: `pnpm --filter @course-homework/rag-agent-orchestration dataset:verify -- --input data/private/formal-drafts.jsonl`

Expected: rejected rows are reported by ID and category without echoing secret-like values.

- [ ] **Step 6: Review in bounded batches**

Review batches of 40–60 rows. Approve only natural, correct, non-copying samples with a clear learning or behavior purpose. Record reject reasons from this closed set: `duplicate`, `unsupported-claim`, `source-copy`, `privacy`, `weak-answer`, `wrong-boundary`, `malformed`.

- [ ] **Step 7: Apply decisions and measure coverage after every batch**

Run: `pnpm --filter @course-homework/rag-agent-orchestration review:apply -- --drafts data/private/formal-drafts.jsonl --decisions data/private/formal-review-decisions.json --output data/private/formal-reviewed.jsonl`

Expected: coverage report shows the remaining deficit by capability, topic, source group, multi-turn, and boundary case; only real deficits trigger another draft batch.

- [ ] **Step 8: Freeze the review gate**

Run: `pnpm --filter @course-homework/rag-agent-orchestration dataset:verify -- --formal data/private/formal-reviewed.jsonl`

Expected: at least 300 examples remain eligible for train after validation/test groups are reserved; all checks PASS.

- [ ] **Step 9: Run generator regressions and commit only generator and review code**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- formal-draft.test.ts dataset.test.ts && pnpm rag:typecheck`

```bash
git add homeworks/04-rag-agent-orchestration/src/dataset/draft.ts homeworks/04-rag-agent-orchestration/src/dataset/apply-review.ts homeworks/04-rag-agent-orchestration/tests/formal-draft.test.ts
git commit -m "feat: prepare formal Yideng Agent review batches"
```

Private drafts, decisions, and reviewed JSONL remain ignored.

### Task 5: Publish an immutable formal release

**Files:**
- Modify: `homeworks/04-rag-agent-orchestration/src/dataset/release.ts`
- Modify: `homeworks/04-rag-agent-orchestration/src/dataset/split.ts`
- Modify: `homeworks/04-rag-agent-orchestration/tests/release.test.ts`
- Create ignored: `homeworks/04-rag-agent-orchestration/data/private/releases/<release-id>/`

**Interfaces:**
- Produces `DatasetReleaseV2` with `baseModel`, `baseRevision`, `tokenizerRevision`, `chatTemplateSha256`, parent release, composition, counts, split hashes, quality report hash, and leakage report hash.

- [ ] **Step 1: Write the failing formal-release test**

```ts
expect(() => DatasetReleaseV2Schema.parse(makeRelease({ trainRows: 299 }))).toThrow();
expect(DatasetReleaseV2Schema.parse(makeRelease({ trainRows: 300 })).splits.train.rows).toBe(300);
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- release.test.ts`

Expected: FAIL because v2 fields and the 300-row gate do not exist.

- [ ] **Step 3: Implement versioned release without weakening v1 parsing**

Use `schemaVersion: 2`. Require train rows `>= 300`, validation rows `>= 20`, frozen test rows `>= 20`, and distinct non-empty hashes. Parent references v1 dataset ID; parent Adapter hash remains nullable because v1 smoke may not have been trained.

- [ ] **Step 4: Split by source and similarity cluster, then freeze**

Run: `pnpm --filter @course-homework/rag-agent-orchestration exec tsx src/dataset/split.ts --formal --seed 20260802`

Expected: train has at least 300 rows; validation and test each have at least 20 rows; exact and near-duplicate leakage checks PASS; release files are immutable after hash generation.

- [ ] **Step 5: Run release regressions and commit code**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- release.test.ts leakage.test.ts && pnpm rag:typecheck`

```bash
git add homeworks/04-rag-agent-orchestration/src/dataset/release.ts homeworks/04-rag-agent-orchestration/src/dataset/split.ts homeworks/04-rag-agent-orchestration/tests/release.test.ts
git commit -m "feat: publish formal Qwen3 dataset releases"
```

### Task 6: Build the formal CUDA bundle and evidence contract

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/training/configs/qwen3-8b-formal.yaml`
- Modify: `homeworks/04-rag-agent-orchestration/training/preflight.py`
- Modify: `homeworks/04-rag-agent-orchestration/training/verify_dataset.py`
- Modify: `homeworks/04-rag-agent-orchestration/training/evaluate.py`
- Create: `homeworks/04-rag-agent-orchestration/training/merge_adapter.py`
- Modify: `homeworks/04-rag-agent-orchestration/src/evidence/schema.ts`
- Modify: `homeworks/04-rag-agent-orchestration/src/bundle/build.ts`
- Modify: `homeworks/04-rag-agent-orchestration/tests/training-config.test.ts`
- Modify: `homeworks/04-rag-agent-orchestration/tests/evaluation-contract.test.ts`
- Modify: `homeworks/04-rag-agent-orchestration/tests/bundle.test.ts`

**Interfaces:**
- Consumes: immutable formal release.
- Produces: allowlisted ZIP, external SHA-256 manifest, hardware preflight JSON, base/adapter evaluation JSON, and artifact manifest.

- [ ] **Step 1: Add failing tests for formal config and evidence**

Assert NF4, 4-bit, BF16-or-hardware-approved fallback, formal dataset name, no `max_samples: 100`, non-placeholder base revision, random seed, LoRA parameters, and required evidence fields for GPU, VRAM, driver, CUDA, disk, duration, peak VRAM, checkpoints, Adapter hashes, Tokenizer, and chat template.

- [ ] **Step 2: Verify focused failure**

Run: `pnpm --filter @course-homework/rag-agent-orchestration test -- training-config.test.ts evaluation-contract.test.ts bundle.test.ts`

Expected: FAIL because formal files and fields are absent.

- [ ] **Step 3: Implement formal config as a generated template**

Do not freeze batch size, context length, precision, or LoRA rank from the candidate label. Generate `qwen3-8b-formal.yaml` only after preflight JSON passes. Fixed fields are `stage: sft`, `finetuning_type: lora`, `quantization_bit: 4`, `quantization_type: nf4`, `do_train: true`, `do_eval: true`, and seed `20260802`.

- [ ] **Step 4: Extend bundle allowlist**

Permit only formal split JSONL, release/quality/leakage manifests, training scripts, evaluated config, and dataset metadata. Explicitly deny corpus manifests with absolute paths, drafts, review decisions, full notes, credentials, model caches, outputs, Adapter, and recovered weights.

- [ ] **Step 5: Verify and build locally**

Run: `pnpm rag:check && pnpm rag:test && pnpm rag:typecheck && pnpm --filter @course-homework/rag-agent-orchestration bundle:verify`

Expected: all checks PASS; ZIP entries exactly match its allowlist; external and embedded hashes agree.

- [ ] **Step 6: Commit reproducible training code**

```bash
git add homeworks/04-rag-agent-orchestration/training homeworks/04-rag-agent-orchestration/src/evidence/schema.ts homeworks/04-rag-agent-orchestration/src/bundle/build.ts homeworks/04-rag-agent-orchestration/tests
git commit -m "feat: package formal Qwen3 CUDA training"
```

### Task 7: Run paid CUDA smoke and formal training

**Files:**
- Modify after artifact recovery: `homeworks/04-rag-agent-orchestration/docs/training-evidence.md`
- Write ignored remote artifacts under: `homeworks/04-rag-agent-orchestration/artifacts/private/remote-run/`

**Interfaces:**
- Consumes: verified local ZIP and external SHA-256.
- Produces: verified preflight, smoke Adapter, formal Adapter, checkpoints, logs, metrics, base/adapter evaluations, and artifact hashes.

- [ ] **Step 1: Reconfirm the paid action immediately before start**

Show current UU device, rate, balance, maximum spend, stop deadline, and purpose. Do not click Start until the user explicitly confirms at that moment.

- [ ] **Step 2: Start and inspect before installation or training**

Collect GPU name, VRAM, driver, CUDA runtime, OS, RAM, free disk, Python, and existing model/cache paths. If the actual environment cannot safely run the 8B plan within budget, stop without expanding resources and report evidence.

- [ ] **Step 3: Transfer and verify the exact bundle**

Use UU file transfer. Compare remote SHA-256 with the Mac manifest before extraction. Abort on mismatch.

- [ ] **Step 4: Install the pinned environment and freeze versions**

Install only from `training/pyproject.toml` or its generated lock. Record resolved versions. Download the verified exact base revision and record snapshot hashes.

- [ ] **Step 5: Run smoke training first**

Use 50–100 train rows. Verify loss is finite, checkpoints are written, Adapter reload works, and the evaluation script can compare base/adapter. Smoke success does not update formal completion status.

- [ ] **Step 6: Generate the formal config from actual preflight**

Choose context length, micro-batch, gradient accumulation, LoRA rank/alpha, and precision from measured VRAM and smoke peak. Record the decision in the config and evidence JSON.

- [ ] **Step 7: Run formal 8B QLoRA and monitor hard limits**

Train all formal train rows with independent validation. Stop on non-finite loss, repeated OOM, disk threshold breach, or budget deadline. Preserve the latest valid checkpoint before stopping.

- [ ] **Step 8: Reload and evaluate base versus Adapter**

Run the identical frozen test set and generation settings for base and Adapter. The evaluator records per-case scores and aggregate deltas; failures and regressions remain visible.

- [ ] **Step 9: Package and download artifacts before shutdown**

Allowlist Adapter, configs, Tokenizer/chat-template metadata, checkpoints needed for recovery, logs, plots, evaluation JSON, preflight JSON, environment lock, artifact manifest, and hashes. Download and verify on Mac, then stop the UU machine and confirm its state is `未运行`.

- [ ] **Step 10: Record evidence without committing private weights**

Update `training-evidence.md` with non-secret facts, hashes, metrics, start/end time, actual cost, and pass/fail. Keep weights and private evaluations ignored.

### Task 8: Merge, export, and accept on M5 24 GB Mac

**Files:**
- Create: `homeworks/04-rag-agent-orchestration/training/export_ollama.md`
- Modify: `homeworks/04-rag-agent-orchestration/docs/training-evidence.md`
- Create ignored: `homeworks/04-rag-agent-orchestration/artifacts/private/mac-acceptance/`

**Interfaces:**
- Consumes: verified base revision and formal Adapter.
- Produces: merged model hash, GGUF hash, Ollama Modelfile metadata, Mac performance report, and frozen-test regression report.

- [ ] **Step 1: Verify Adapter provenance before merge**

Match base revision, Tokenizer revision, chat-template hash, Adapter config, and remote artifact manifest. Abort on any mismatch.

- [ ] **Step 2: Merge and convert reproducibly**

Merge without overwriting the original Adapter. Convert with a pinned llama.cpp revision. Start with an 8B quantization suitable for 24 GB unified memory; preserve conversion commands, tool revision, input/output hashes, and quantization type.

- [ ] **Step 3: Create the Ollama model locally**

Use a Modelfile that matches the frozen chat template and stop tokens. Do not embed private training examples in the Modelfile.

- [ ] **Step 4: Run real Mac acceptance**

Run the frozen test set plus offline course explanation, `grill-me`, architecture, and development-procedure probes. Record load success, memory use, tokens/second, first-token latency, answer scores, and any regression.

- [ ] **Step 5: Apply the model gate**

Pass only if Adapter reload, base/adapter improvement, GGUF/Ollama load, offline inference, safety behavior, and regression checks pass. Otherwise preserve artifacts, mark the gate failed, and return to data/config diagnosis instead of declaring training complete.

- [ ] **Step 6: Commit public evidence only**

```bash
git add homeworks/04-rag-agent-orchestration/training/export_ollama.md homeworks/04-rag-agent-orchestration/docs/training-evidence.md
git commit -m "docs: record verified Qwen3 training evidence"
```

## Post-Model Plans

After Task 8 passes, write and execute separate plans in this order:

1. `yideng-agent-knowledge-core`: incremental course index, Qdrant, BGE-M3, BM25/RRF, mandatory Rerank, verified-external, personal memory, and MCP contracts.
2. `yideng-agent-mastra-client`: Mastra ingestion/Agent, citations, failure states, and Mastra Client frontend.
3. `yideng-agent-langgraph`: equivalent LangGraph state graph, persistence, retries, human escalation, and comparison report.
4. `yideng-agent-platform-adapters`: Codex, Claude Code, Cherry Studio/Ollama, offline acceptance, controlled development tools, and original repair-corpus compatibility test.

Each plan must inherit the comprehensive design, use TDD, preserve the read-only source boundary, and update `HOMEWORKS.md` only after its own evidence gate passes.
