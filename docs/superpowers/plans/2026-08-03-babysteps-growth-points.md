# BabySteps Growth Points Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Sunday Web3 homework as a Sepolia DApp that independently satisfies the onchain notebook requirements and adds three daily caregiving activities whose onchain growth points drive a four-stage virtual companion.

**Architecture:** Extend the existing `OnchainNotebook` contract with a second, isolated growth domain: notebook functions keep their current semantics, while `recordActivity(ActivityType)` stores only an activity marker and points. The CSR React application keeps `useNotebook` and `useGrowth` independent, derives an original inline-SVG “星宝” presentation from the contract stage, and waits for transaction receipts before refreshing exact wagmi queries.

**Tech Stack:** pnpm 11.17, Node.js 22, Solidity 0.8.28, Hardhat 3.12.0, Hardhat Toolbox Viem 5.0.7, Viem 2.55.10, Vite 8.2.0, React 19.2.8, wagmi 3.7.5, TanStack Query 5.101.4, Vitest 4.1.10, Testing Library 16.3.2, Biome 2.5.6.

## Global Constraints

- Work only in `/Users/shier/Desktop/course-homework/.tc-worktrees/web3-onchain-notebook-20260802` on branch `codex/web3-onchain-notebook`; do not mix model-training work into this feature.
- Treat `docs/superpowers/specs/2026-08-03-babysteps-growth-points-design.md` as the approved source of truth.
- Preserve the original `getNote(address)`, `setNote(string)`, `clearNote()`, `NoteTooLong`, `NoteUpdated`, and `NoteCleared` ABI and all nine existing contract tests.
- Keep the public notebook and BabySteps growth flow independent in Solidity, hooks, UI sections, tests, and QA evidence.
- `recordActivity` and `ActivityRecorded` must contain no free-text string and must never change notebook state.
- Fix activity ABI order to `0=Meal`, `1=Walk`, `2=Read`; rewards are exactly `3`, `5`, and `7` growth stars.
- Use `utc8DayId = (block.timestamp + 8 hours) / 1 days`; each wallet can claim each activity once per Beijing calendar day.
- Growth stages are `0–2 Egg`, `3–7 Sprout`, `8–14 Explorer`, `>=15 Star`; derive them from points rather than storing a second mutable stage value.
- Growth stars are non-transferable test points, not ERC-20, NFT, currency, proof of real activity, or an economic asset.
- Do not collect child names, photos, dates, school, location, health, vaccine, or other personal data. Use only a dedicated Sepolia test wallet.
- `clearNote` clears only the current contract value; UI and docs must say that historical transactions remain public.
- Keep the frontend CSR-only, injected MetaMask-only, and Sepolia-only. Do not add RainbowKit, ConnectKit, WalletConnect, SSR, a server, analytics, or a component framework.
- Keep `SEPOLIA_RPC_URL`, `SEPOLIA_PRIVATE_KEY`, and `ETHERSCAN_API_KEY` only in the interactive Hardhat keystore. Never put their values in Git, `.env`, commands, chat, screenshots, logs, browser storage, or frontend variables.
- `VITE_ONCHAIN_NOTEBOOK_ADDRESS` is public but must be a real non-zero deployed address for production builds; do not add a fallback.
- Before every faucet request, credential input, MetaMask signature, Sepolia deployment, or verification action, explain purpose, location, risk/cost, and expected result. Obtain explicit user confirmation before the final irreversible or externally persistent action.
- Use the external Chrome flow already requested by the user for visible MetaMask, local DApp, and Etherscan steps. Do not push or publish a production site unless separately requested.
- Use TDD for each behavior change and make a focused commit after every task.
- Existing untracked files under `web/src/config` and `web/src/features/notebook` are an interrupted Task 6 draft from this branch. Preserve and review them; do not discard or stage unrelated files.

## Current Baseline

- Completed and committed: isolated workspaces, nine notebook contract tests, Hardhat Sepolia/Ignition configuration, frontend address gate, ABI, UTF-8 utilities, and safe wallet error mapping.
- Uncommitted draft to reconcile first: wagmi providers plus `useNotebook` and nine hook tests.
- Not yet implemented: BabySteps contract state, growth frontend model/hook, page/components/styles, QA evidence, real Sepolia deployment, Etherscan verification, or browser acceptance.

## File Map

### Contract domain

- `homeworks/06-web3-dapp/contracts/contracts/OnchainNotebook.sol`: original notebook plus isolated activity points and UTC+8 claim markers.
- `homeworks/06-web3-dapp/contracts/test/OnchainNotebook.ts`: original nine tests plus reward, isolation, time-boundary, event, and cross-domain invariants.
- `homeworks/06-web3-dapp/contracts/ignition/modules/OnchainNotebook.ts`: unchanged single-contract deployment module.

### Frontend domain

- `homeworks/06-web3-dapp/web/src/config/wagmi.ts`: Sepolia injected MetaMask configuration.
- `homeworks/06-web3-dapp/web/src/config/providers.tsx`: wagmi and TanStack Query providers.
- `homeworks/06-web3-dapp/web/src/contracts/onchainNotebook.ts`: full notebook and growth ABI plus validated public address.
- `homeworks/06-web3-dapp/web/src/features/notebook/useNotebook.ts`: independent public-notebook read/write state machine.
- `homeworks/06-web3-dapp/web/src/features/growth/growthModel.ts`: activity metadata and pure stage/progress conversion.
- `homeworks/06-web3-dapp/web/src/features/growth/useGrowth.ts`: growth reads, activity write, receipt wait, and exact cache refresh.
- `homeworks/06-web3-dapp/web/src/features/wallet/walletState.ts`: shared MetaMask/Sepolia wallet-state derivation.
- `homeworks/06-web3-dapp/web/src/components/WalletPanel.tsx`: installation, connect, address, and switch-network actions.
- `homeworks/06-web3-dapp/web/src/components/StarBuddy.tsx`: original inline-SVG virtual companion with four visual stages.
- `homeworks/06-web3-dapp/web/src/features/growth/GrowthPanel.tsx`: points, progress, activity cards, and growth transaction state.
- `homeworks/06-web3-dapp/web/src/features/notebook/NotebookPanel.tsx`: visibly separate public notebook course experiment.
- `homeworks/06-web3-dapp/web/src/App.tsx`: page composition and fixed safety copy.
- `homeworks/06-web3-dapp/web/src/styles.css`: mobile-first warm learning-journal presentation and accessible states.
- `homeworks/06-web3-dapp/web/src/main.tsx`: CSR entry and providers.

### Evidence

- `homeworks/06-web3-dapp/README.md`: learning explanation, local commands, credential boundary, deployment, verification, and evidence map.
- `docs/qa/web3-onchain-notebook.md`: P0/P1 status, automated results, public Sepolia evidence, and visual checklist.
- `HOMEWORKS.md`: independently tracked local, Sepolia, Etherscan, and visual status.
- `scripts/__tests__/monorepo-layout.test.mjs`: repository structure, secret-boundary, and documentation assertions.

---

### Task 1: Reconcile and finish the notebook wagmi draft

**Files:**
- Create from existing untracked draft: `homeworks/06-web3-dapp/web/src/config/wagmi.ts`
- Create from existing untracked draft: `homeworks/06-web3-dapp/web/src/config/providers.tsx`
- Create from existing untracked draft: `homeworks/06-web3-dapp/web/src/features/notebook/useNotebook.ts`
- Create from existing untracked draft: `homeworks/06-web3-dapp/web/src/features/notebook/useNotebook.test.tsx`
- Create: `homeworks/06-web3-dapp/web/src/features/wallet/walletState.ts`
- Create: `homeworks/06-web3-dapp/web/src/features/wallet/walletState.test.ts`

**Interfaces:**
- Consumes: `notebookAddress`, `onchainNotebookAbi`, `isNoteWithinLimit`, `toWalletMessage`, Sepolia chain ID `11155111`.
- Produces: `WalletState = "missing" | "disconnected" | "wrong-network" | "ready"`, `deriveWalletState(input)`, and `useNotebook()` with `chainNote`, `draft`, `setDraft`, `save`, `clear`, `retryRead`, `switchToSepolia`, `transactionHash`, `phase`, `message`, `canSave`, and `canClear`.

- [ ] **Step 1: Snapshot the inherited draft and run its focused tests**

Run:

```bash
git status --short
pnpm --filter @course-homework/web3-web test -- useNotebook
```

Expected: the four draft paths are the only untracked source paths, and the focused test either passes or produces concrete failures to fix. Do not infer correctness from the interrupted agent's report.

- [ ] **Step 2: Add a failing shared wallet-state test**

Create `walletState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { deriveWalletState } from "./walletState";

describe("deriveWalletState", () => {
	it("keeps wallet absence, connection, and network mismatch distinct", () => {
		expect(deriveWalletState({ hasProvider: false, isConnected: false })).toBe("missing");
		expect(deriveWalletState({ hasProvider: true, isConnected: false })).toBe("disconnected");
		expect(
			deriveWalletState({
				hasProvider: true,
				isConnected: true,
				address: "0x1111111111111111111111111111111111111111",
				chainId: 1,
			}),
		).toBe("wrong-network");
	});
});
```

Run: `pnpm --filter @course-homework/web3-web test -- walletState`

Expected: FAIL because `walletState.ts` does not exist.

- [ ] **Step 3: Extract the shared wallet-state helper**

Implement:

```ts
import type { Address } from "viem";
import { sepolia } from "wagmi/chains";

export type WalletState = "missing" | "disconnected" | "wrong-network" | "ready";

type WalletStateInput = {
	hasProvider: boolean;
	isConnected: boolean;
	address?: Address;
	chainId?: number;
};

export function deriveWalletState(input: WalletStateInput): WalletState {
	if (!input.hasProvider) return "missing";
	if (!input.isConnected || !input.address) return "disconnected";
	return input.chainId === sepolia.id ? "ready" : "wrong-network";
}
```

Keep a browser-only `hasMetaMaskProvider()` helper in the same file and use both helpers from `useNotebook`.

- [ ] **Step 4: Audit the notebook state machine and correct public-chain copy**

Keep the draft's exact-query invalidation with `readContractQueryKey`. Change clear success copy to:

```ts
"当前便签显示已清空；历史交易仍然公开。"
```

Add an assertion to `useNotebook.test.tsx` that a successful `clearNote` receipt produces this message. Preserve the existing assertions for read-error versus empty, signature versus receipt, rejected signature draft preservation, duplicate-submit blocking, and real `clearNote` usage.

- [ ] **Step 5: Run focused and package verification**

Run:

```bash
pnpm --filter @course-homework/web3-web test -- walletState useNotebook
pnpm --filter @course-homework/web3-web typecheck
pnpm --filter @course-homework/web3-web check
```

Expected: all wallet and notebook hook tests pass; TypeScript and Biome exit 0.

- [ ] **Step 6: Commit only the reconciled draft**

```bash
git add homeworks/06-web3-dapp/web/src/config homeworks/06-web3-dapp/web/src/features/notebook/useNotebook.ts homeworks/06-web3-dapp/web/src/features/notebook/useNotebook.test.tsx homeworks/06-web3-dapp/web/src/features/wallet
git commit -m "feat: connect notebook with wagmi"
```

---

### Task 2: Extend OnchainNotebook with UTC+8 growth points

**Files:**
- Modify: `homeworks/06-web3-dapp/contracts/contracts/OnchainNotebook.sol`
- Modify: `homeworks/06-web3-dapp/contracts/test/OnchainNotebook.ts`

**Interfaces:**
- Consumes: the existing notebook storage and ABI without changing their behavior.
- Produces: `ActivityType`, `GrowthStage`, `ActivityAlreadyRecordedToday`, `ActivityRecorded`, `recordActivity`, `getGrowthPoints`, `hasRecordedToday`, `getGrowthStage`, and `currentUtc8DayId` exactly as approved in the PRD.

- [ ] **Step 1: Add failing reward and stage tests**

Use the existing Hardhat Node test runner connection and add:

```ts
it("awards Meal, Walk, and Read as 3, 5, and 7 points", async () => {
	const notebook = await viem.deployContract("OnchainNotebook");

	await notebook.write.recordActivity([0], { account: author.account });
	assert.equal(await notebook.read.getGrowthPoints([author.account.address]), 3n);
	assert.equal(await notebook.read.getGrowthStage([author.account.address]), 1);

	await notebook.write.recordActivity([1], { account: author.account });
	assert.equal(await notebook.read.getGrowthPoints([author.account.address]), 8n);
	assert.equal(await notebook.read.getGrowthStage([author.account.address]), 2);

	await notebook.write.recordActivity([2], { account: author.account });
	assert.equal(await notebook.read.getGrowthPoints([author.account.address]), 15n);
	assert.equal(await notebook.read.getGrowthStage([author.account.address]), 3);
});
```

Run: `pnpm --filter @course-homework/web3-contracts test`

Expected: FAIL because `recordActivity` and growth reads do not exist.

- [ ] **Step 2: Add failing daily-limit, wallet-isolation, and event tests**

Add explicit assertions that:

- repeating `Meal` for the same wallet/day reverts with `ActivityAlreadyRecordedToday(author, 0, dayId)`;
- `reader` can still record `Meal` on the same day;
- the same wallet can record all three different activities;
- `ActivityRecorded` contains account, activity, UTC+8 day ID, reward, total points, and stage;
- a reverted duplicate leaves points and marker unchanged.

Use `viem.assertions.revertWithCustomErrorWithArgs` and `emitWithArgs`; do not assert unstable gas values.

- [ ] **Step 3: Add failing Beijing-time boundary tests**

Change the test connection declaration to include `networkHelpers`:

```ts
const { viem, networkHelpers } = await network.create();
```

Derive the next Beijing midnight from the test chain's current timestamp so the test never tries to move time backwards:

```ts
const day = 24 * 60 * 60;
const offset = 8 * 60 * 60;
const latest = await networkHelpers.time.latest();
const atBeijingMidnight =
	(Math.floor((latest + offset) / day) + 1) * day - offset;
const beforeBeijingMidnight = atBeijingMidnight - 1;

await networkHelpers.time.setNextBlockTimestamp(beforeBeijingMidnight);
await notebook.write.recordActivity([0], { account: author.account });
await networkHelpers.time.setNextBlockTimestamp(atBeijingMidnight);
await notebook.write.recordActivity([0], { account: author.account });
```

Add a separate case that dynamically finds the next UTC midnight and proves UTC `23:59:59 → 00:00:00` without Beijing midnight does not reset the claim, and a case proving `hasRecordedToday` becomes false after Beijing midnight.

- [ ] **Step 4: Add failing cross-domain invariant tests**

Add tests that:

```ts
await notebook.write.setNote(["public test note"], { account: author.account });
await notebook.write.recordActivity([0], { account: author.account });
assert.equal(await notebook.read.getNote([author.account.address]), "public test note");

const points = await notebook.read.getGrowthPoints([author.account.address]);
await notebook.write.clearNote([], { account: author.account });
assert.equal(await notebook.read.getGrowthPoints([author.account.address]), points);
```

These tests must also prove `setNote` does not set a daily marker and `recordActivity` emits no note string.

Add a stage-boundary case that records `Read` on two Beijing days to reach exactly 14 points and expects `Explorer`; the existing `Meal → Walk → Read` case proves exactly 15 points returns `Star`.

- [ ] **Step 5: Implement the minimum isolated growth state**

Add to the contract:

```solidity
uint256 private constant UTC8_OFFSET = 8 hours;

enum ActivityType { Meal, Walk, Read }
enum GrowthStage { Egg, Sprout, Explorer, Star }

mapping(address account => uint256 points) private growthPoints;
mapping(address account => mapping(ActivityType activity => uint256 marker))
    private lastRecordedDayMarker;

error ActivityAlreadyRecordedToday(
    address account,
    ActivityType activity,
    uint256 utc8DayId
);

event ActivityRecorded(
    address indexed account,
    ActivityType indexed activity,
    uint256 indexed utc8DayId,
    uint256 reward,
    uint256 totalPoints,
    GrowthStage stage
);
```

Implement exact rules:

```solidity
function currentUtc8DayId() public view returns (uint256) {
    return (block.timestamp + UTC8_OFFSET) / 1 days;
}

function recordActivity(ActivityType activity) external {
    uint256 dayId = currentUtc8DayId();
    if (lastRecordedDayMarker[msg.sender][activity] == dayId + 1) {
        revert ActivityAlreadyRecordedToday(msg.sender, activity, dayId);
    }

    uint256 reward = activity == ActivityType.Meal
        ? 3
        : activity == ActivityType.Walk ? 5 : 7;
    uint256 totalPoints = growthPoints[msg.sender] + reward;

    lastRecordedDayMarker[msg.sender][activity] = dayId + 1;
    growthPoints[msg.sender] = totalPoints;

    emit ActivityRecorded(
        msg.sender,
        activity,
        dayId,
        reward,
        totalPoints,
        growthStageFor(totalPoints)
    );
}

function growthStageFor(uint256 points) private pure returns (GrowthStage) {
    if (points >= 15) return GrowthStage.Star;
    if (points >= 8) return GrowthStage.Explorer;
    if (points >= 3) return GrowthStage.Sprout;
    return GrowthStage.Egg;
}
```

`getGrowthPoints`, `hasRecordedToday`, and `getGrowthStage` are read-only wrappers. Do not add owner, reset, transfer, payable, or external-call logic.

- [ ] **Step 6: Compile before typechecking, then run all contract checks**

Run:

```bash
pnpm --filter @course-homework/web3-contracts compile
pnpm --filter @course-homework/web3-contracts test
pnpm --filter @course-homework/web3-contracts typecheck
pnpm --filter @course-homework/web3-contracts check
```

Expected: the original nine tests and every new growth test pass; compile, typecheck, and Biome exit 0.

- [ ] **Step 7: Commit the contract extension**

```bash
git add homeworks/06-web3-dapp/contracts/contracts/OnchainNotebook.sol homeworks/06-web3-dapp/contracts/test/OnchainNotebook.ts
git commit -m "feat: add BabySteps growth points"
```

---

### Task 3: Add the frontend growth contract and pure model

**Files:**
- Modify: `homeworks/06-web3-dapp/web/src/contracts/onchainNotebook.ts`
- Create: `homeworks/06-web3-dapp/web/src/features/growth/growthModel.ts`
- Create: `homeworks/06-web3-dapp/web/src/features/growth/growthModel.test.ts`
- Modify: `homeworks/06-web3-dapp/web/src/lib/walletError.ts`
- Modify: `homeworks/06-web3-dapp/web/src/lib/walletError.test.ts`

**Interfaces:**
- Produces: `GrowthActivityId`, `GrowthStageName`, `GROWTH_ACTIVITIES`, `growthStageFromCode(code)`, `firstJourneyProgress(points)`, `growthStageLabel(stage)`, and the complete Viem ABI.
- Consumes: Solidity enum order, reward values, stage thresholds, and public-chain copy from the approved PRD.

- [ ] **Step 1: Write failing pure-model tests**

Create:

```ts
import { describe, expect, it } from "vitest";
import {
	GROWTH_ACTIVITIES,
	firstJourneyProgress,
	growthStageFromCode,
} from "./growthModel";

describe("growth model", () => {
	it("keeps ABI order and rewards fixed", () => {
		expect(GROWTH_ACTIVITIES.map(({ id, contractValue, reward }) => ({ id, contractValue, reward }))).toEqual([
			{ id: "meal", contractValue: 0, reward: 3 },
			{ id: "walk", contractValue: 1, reward: 5 },
			{ id: "read", contractValue: 2, reward: 7 },
		]);
	});

	it("maps contract stages and caps first-journey progress", () => {
		expect([0, 1, 2, 3].map(growthStageFromCode)).toEqual([
			"egg",
			"sprout",
			"explorer",
			"star",
		]);
		expect(firstJourneyProgress(18n)).toEqual({ current: 15, percent: 100, complete: true });
	});
});
```

Run: `pnpm --filter @course-homework/web3-web test -- growthModel`

Expected: FAIL because the model does not exist.

- [ ] **Step 2: Implement the fixed activity and stage model**

Use readonly metadata:

```ts
export const GROWTH_ACTIVITIES = [
	{ id: "meal", contractValue: 0, reward: 3, title: "一起用餐", description: "记录一次轻松的用餐陪伴" },
	{ id: "walk", contractValue: 1, reward: 5, title: "户外陪伴", description: "记录一次散步或户外陪伴" },
	{ id: "read", contractValue: 2, reward: 7, title: "亲子共读", description: "记录一次故事或阅读时间" },
] as const;
```

`firstJourneyProgress(points)` returns `current = Math.min(Number(points), 15)`, `percent = current / 15 * 100`, and `complete = points >= 15n`. Throw for an unknown stage code rather than silently showing Egg.

- [ ] **Step 3: Extend the ABI without adding strings to activities**

Append these exact parse-ABI entries:

```ts
"error ActivityAlreadyRecordedToday(address account, uint8 activity, uint256 utc8DayId)",
"event ActivityRecorded(address indexed account, uint8 indexed activity, uint256 indexed utc8DayId, uint256 reward, uint256 totalPoints, uint8 stage)",
"function recordActivity(uint8 activity)",
"function getGrowthPoints(address account) view returns (uint256)",
"function hasRecordedToday(address account, uint8 activity) view returns (bool)",
"function getGrowthStage(address account) view returns (uint8)",
"function currentUtc8DayId() view returns (uint256)",
```

Keep every existing notebook ABI entry unchanged.

- [ ] **Step 4: Add safe activity-specific error mapping**

Teach `toWalletMessage` to recognize an error object whose `errorName` is `ActivityAlreadyRecordedToday` and return:

```text
今天已经记录这项陪伴，北京时间明天 00:00 后再来。
```

Add a test proving raw revert arguments and provider details do not appear in the user message. Keep the existing rejected-signature message for the notebook; the growth hook will supply its own neutral cancellation copy.

- [ ] **Step 5: Run focused frontend checks**

Run:

```bash
pnpm --filter @course-homework/web3-web test -- growthModel walletError noteBytes
pnpm --filter @course-homework/web3-web typecheck
pnpm --filter @course-homework/web3-web check
```

Expected: focused tests, typecheck, and Biome pass.

- [ ] **Step 6: Commit the public frontend contract**

```bash
git add homeworks/06-web3-dapp/web/src/contracts/onchainNotebook.ts homeworks/06-web3-dapp/web/src/features/growth homeworks/06-web3-dapp/web/src/lib/walletError.ts homeworks/06-web3-dapp/web/src/lib/walletError.test.ts
git commit -m "feat: define BabySteps frontend model"
```

---

### Task 4: Implement the independent useGrowth state machine

**Files:**
- Create: `homeworks/06-web3-dapp/web/src/features/growth/useGrowth.ts`
- Create: `homeworks/06-web3-dapp/web/src/features/growth/useGrowth.test.tsx`

**Interfaces:**
- Consumes: `wagmiConfig`, `notebookAddress`, `onchainNotebookAbi`, `deriveWalletState`, `GROWTH_ACTIVITIES`, `growthStageFromCode`, and `toWalletMessage`.
- Produces: `useGrowth()` with `walletState`, `points`, `stage`, `todayByActivity`, `phase`, `message`, `transactionHash`, `recordActivity(id)`, `retryRead()`, `switchToSepolia()`, and `isPending`.

- [ ] **Step 1: Write failing disconnected/read-state tests**

Mock `useAccount`, five `useReadContract` calls, `useWriteContract`, `useWaitForTransactionReceipt`, `useSwitchChain`, `simulateContract`, and TanStack Query. Assert:

- disconnected and wrong-network states do not enable growth reads;
- a failure in any required read yields `phase = "read-error"`, with `points` and `stage` undefined rather than zero/Egg;
- successful reads map `15n` plus stage code `3` to `points = 15n`, `stage = "star"`, and exact activity-completion flags.

Run: `pnpm --filter @course-homework/web3-web test -- useGrowth`

Expected: FAIL because `useGrowth` does not exist.

- [ ] **Step 2: Write failing transaction-state tests**

Assert the exact flow:

```text
idle → awaiting-signature → confirming → success
```

The tests must prove:

- `recordActivity("meal")` calls `simulateContract(wagmiConfig, ...)` with `args: [0]` before `writeContractAsync`;
- a hash changes the phase only to `confirming`;
- receipt success invalidates points, stage, and all three `hasRecordedToday` query keys before showing success;
- pending blocks a second submit;
- rejection code `4001` leaves all displayed chain values unchanged;
- duplicate custom error maps to the Beijing-midnight message;
- a receipt failure never adds points optimistically.

- [ ] **Step 3: Implement read queries and an aggregate read state**

Call `useReadContract` for:

```text
getGrowthPoints(account)
getGrowthStage(account)
hasRecordedToday(account, 0)
hasRecordedToday(account, 1)
hasRecordedToday(account, 2)
```

All queries use `chainId: sepolia.id` and enable only for `walletState === "ready"`. Treat the aggregate as successful only when all five reads succeed. Create exact `readContractQueryKey` values for receipt invalidation.

- [ ] **Step 4: Implement simulate, write, receipt, and refresh**

Use the imperative core action so a single activity-card click can simulate and submit the same activity:

```ts
const simulation = await simulateContract(wagmiConfig, {
	address: notebookAddress,
	abi: onchainNotebookAbi,
	functionName: "recordActivity",
	args: [activity.contractValue],
	account: address,
	chainId: sepolia.id,
});
const hash = await writeContractAsync(simulation.request);
```

After receipt success, run `Promise.all` over exact query invalidations. Only then set the success message `记录成功，获得 +N 枚成长星。`. Never mutate local points or completion flags optimistically.

- [ ] **Step 5: Run focused and package checks**

Run:

```bash
pnpm --filter @course-homework/web3-web test -- useGrowth
pnpm --filter @course-homework/web3-web typecheck
pnpm --filter @course-homework/web3-web check
```

Expected: every read, signature, receipt, invalidation, duplicate, and failure test passes.

- [ ] **Step 6: Commit the growth hook**

```bash
git add homeworks/06-web3-dapp/web/src/features/growth/useGrowth.ts homeworks/06-web3-dapp/web/src/features/growth/useGrowth.test.tsx
git commit -m "feat: connect BabySteps growth with wagmi"
```

---

### Task 5: Build the BabySteps page and original virtual companion

**Files:**
- Modify: `homeworks/06-web3-dapp/web/index.html`
- Create: `homeworks/06-web3-dapp/web/src/main.tsx`
- Create: `homeworks/06-web3-dapp/web/src/App.tsx`
- Create: `homeworks/06-web3-dapp/web/src/App.test.tsx`
- Create: `homeworks/06-web3-dapp/web/src/styles.css`
- Create: `homeworks/06-web3-dapp/web/src/components/WalletPanel.tsx`
- Create: `homeworks/06-web3-dapp/web/src/components/StarBuddy.tsx`
- Create: `homeworks/06-web3-dapp/web/src/components/StarBuddy.test.tsx`
- Create: `homeworks/06-web3-dapp/web/src/features/growth/GrowthPanel.tsx`
- Create: `homeworks/06-web3-dapp/web/src/features/notebook/NotebookPanel.tsx`

**Interfaces:**
- Consumes: `Providers`, `useGrowth`, `useNotebook`, wagmi `useConnect`, `useAccount`, `useDisconnect`, activity metadata, and stage/progress helpers.
- Produces: a mobile-first single-page DApp whose product flow and course experiment are visually separate but both independently operable.

- [ ] **Step 1: Write failing StarBuddy state tests**

Test all four stages:

```tsx
render(<StarBuddy stage="explorer" />);
expect(screen.getByRole("img", { name: "探索星宝" })).toHaveAttribute(
	"data-stage",
	"explorer",
);
```

Repeat for Egg, Sprout, and Star. Assert decorative SVG groups use `aria-hidden="true"` while the outer element carries the accessible name.

Run: `pnpm --filter @course-homework/web3-web test -- StarBuddy`

Expected: FAIL because the component does not exist.

- [ ] **Step 2: Implement an original inline-SVG companion**

Use one consistent rounded star-creature silhouette and four deterministic decorations:

- Egg: closed shell and small star glow.
- Sprout: visible face and one green sprout.
- Explorer: small satchel and open path motif.
- Star: story hat and reading-corner motif.

Do not import, trace, or imitate Ant Forest/Ant Manor assets. Use CSS custom properties for color and `prefers-reduced-motion` to disable the optional stage-transition animation.

- [ ] **Step 3: Write failing page-behavior tests**

Mock `useGrowth` and `useNotebook`, then assert:

- the top always shows `课程概念验证 · Sepolia 测试网` and `成长星无价格，不可转让或兑换`;
- public-chain, dedicated-test-wallet, self-report, and child-data warnings are visible;
- 18 total points show the real total, `首轮养成已完成`, and a 100% progress element rather than `18 / 15`;
- the three activity cards show `+3`, `+5`, `+7`, and completed cards say `今天已记录`;
- clicking an available card calls `recordActivity` with its exact ID;
- awaiting signature and confirming messages are distinct and disable all activity submissions;
- transaction links use `https://sepolia.etherscan.io/tx/`;
- the notebook section is titled `公开链上便签（课程实验）` and says historical transactions remain public;
- 281 UTF-8 bytes disable save, while 280 bytes remain allowed;
- `clearNote` requires an explicit confirmation interaction and uses `清空当前便签` copy.

Run: `pnpm --filter @course-homework/web3-web test -- App`

Expected: FAIL because the page components do not exist.

- [ ] **Step 4: Implement wallet and growth panels**

`WalletPanel` must use `useConnect` with the configured MetaMask connector, show a shortened account plus copyable full address, offer Sepolia switching, and never request a secret.

`GrowthPanel` renders:

```text
真实累计成长星
首轮 min(points, 15) / 15 进度
StarBuddy
Meal / Walk / Read activity cards
signature / confirmation / success / failure state
Sepolia Etherscan link
```

Use `aria-live="polite"` for transaction status and `role="alert"` for errors. Do not use color as the only completion signal.

- [ ] **Step 5: Implement the independent notebook panel**

The notebook panel calls only `useNotebook`. Place this warning immediately before the textarea:

```text
链上内容公开且无法真正从历史交易中删除。请只填写测试文字，勿填写儿童姓名、照片、生日、学校、位置、健康或疫苗信息。
```

Use the safe example placeholder `今天完成了一次 Sepolia 测试`. Keep current-chain value, editable draft, UTF-8 byte counter, save/overwrite, clear-current-value, retry, phase, and transaction link separate from growth activity controls.

- [ ] **Step 6: Compose the page and accessible responsive styles**

Use this single-page order: safety header, wallet, StarBuddy/progress, activities, growth transaction state, notebook course experiment, rules/course stack. Set body copy to at least 18px, helper copy to at least 16px, and interactive targets to at least 48px. Ensure the 320px layout has no horizontal overflow and visible focus rings.

Change the document title to `BabySteps · 成长星球` and mount `<App />` inside `<Providers>` from `main.tsx`.

- [ ] **Step 7: Run all frontend checks**

Run:

```bash
pnpm --filter @course-homework/web3-web test
pnpm --filter @course-homework/web3-web typecheck
pnpm --filter @course-homework/web3-web check
```

Expected: every model, hook, wallet, companion, and page test passes; typecheck and Biome exit 0.

- [ ] **Step 8: Commit the complete local interface**

```bash
git add homeworks/06-web3-dapp/web/index.html homeworks/06-web3-dapp/web/src
git commit -m "feat: add BabySteps growth interface"
```

---

### Task 6: Document and verify the complete local implementation

**Files:**
- Modify: `homeworks/06-web3-dapp/README.md`
- Create: `docs/qa/web3-onchain-notebook.md`
- Modify: `HOMEWORKS.md`
- Modify: `scripts/__tests__/monorepo-layout.test.mjs`

**Interfaces:**
- Consumes: the finished local P0/P1 implementation and test commands.
- Produces: reproducible instructions, status separation, secret-boundary assertions, and a browser/Sepolia acceptance checklist without claiming external completion.

- [ ] **Step 1: Write failing documentation and secret-boundary assertions**

Extend `monorepo-layout.test.mjs` to require:

```js
for (const required of [
	"homeworks/06-web3-dapp/web/src/features/growth/useGrowth.ts",
	"homeworks/06-web3-dapp/web/src/components/StarBuddy.tsx",
	"docs/qa/web3-onchain-notebook.md",
]) {
	assert.equal(await exists(required), true, `${required} must exist`);
}
```

Assert README contains `UTC+8`, `Meal`, `Walk`, `Read`, `SEPOLIA_RPC_URL`, `SEPOLIA_PRIVATE_KEY`, `ETHERSCAN_API_KEY`, `VITE_ONCHAIN_NOTEBOOK_ADDRESS`, the four root `web3:*` commands, and both deployment scripts. Add a repository scan that rejects private-key-like hex values, mnemonic labels with values, and any `VITE_` secret variable.

Run: `node --test scripts/__tests__/monorepo-layout.test.mjs`

Expected: FAIL because the new QA requirements are absent.

- [ ] **Step 2: Write the learning README**

Explain succinctly:

- the contract is the DApp backend;
- reads are calls and writes require a signed transaction plus test ETH gas;
- a transaction hash means broadcast, while receipt success means confirmed;
- ABI enum order is fixed;
- UTC+8 day marker and `dayId + 1` avoid the mapping-default collision;
- activity records contain no child text and cannot prove real-world activity;
- the notebook is deliberately public and clearing current state does not erase transaction history;
- credentials go only through interactive Hardhat keystore prompts;
- deploy, verify, frontend address, dev, test, typecheck, and build commands.

- [ ] **Step 3: Create honest local QA status**

Create separate status rows:

```text
P0 local notebook implementation
P1 local BabySteps implementation
Local automated verification
Local visual acceptance
Sepolia deployment
Etherscan verification
Sepolia P0 interaction
Sepolia P1 interaction
```

Mark only observed local items complete. Keep deployment, verification, and real browser interaction pending. Do not include private or child data.

- [ ] **Step 4: Run the complete local verification matrix**

Run:

```bash
pnpm web3:check
pnpm web3:test
pnpm web3:typecheck
pnpm check
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected: all contract, Web3 frontend, existing repository, and formatting checks exit 0. Do not claim `pnpm web3:build` yet: the approved production-address gate must reject a missing real Sepolia address before deployment.

- [ ] **Step 5: Update only truthful local status and commit**

If and only if Step 4 passes, mark `周日本地实现` complete in `HOMEWORKS.md`; leave Sepolia, Etherscan, and browser acceptance pending.

```bash
git add HOMEWORKS.md docs/qa/web3-onchain-notebook.md homeworks/06-web3-dapp/README.md scripts/__tests__/monorepo-layout.test.mjs
git commit -m "docs: record local BabySteps verification"
```

---

### Task 7: Deploy the approved contract to Sepolia and verify its source

**Files:**
- Create or modify locally ignored: `homeworks/06-web3-dapp/web/.env.local`
- Modify: `docs/qa/web3-onchain-notebook.md`
- Modify: `HOMEWORKS.md`

**Interfaces:**
- Consumes: dedicated MetaMask Sepolia test account, Sepolia ETH, interactive Hardhat keystore variables, and the exact tested commit.
- Produces: one public contract address, deploy transaction, block/time evidence, Verified Contract URL, and a production frontend build against that exact address.

- [ ] **Step 1: Freeze and identify the deploy candidate**

Run:

```bash
git status --short
git rev-parse HEAD
pnpm web3:check
pnpm web3:test
pnpm web3:typecheck
```

Expected: tracked worktree clean, exact candidate SHA recorded, and all pre-deploy checks pass. Untracked ignored credential/deployment files may exist but must not appear in Git status.

- [ ] **Step 2: Inspect the dedicated wallet and obtain faucet funds only if needed**

In external Chrome, explain each click before opening MetaMask or a faucet. Confirm the visible account is a dedicated test account and the selected network is Sepolia. Record only its public address and public balance. If balance is insufficient, explain the faucet's public-address disclosure and request user confirmation before submitting the faucet request.

- [ ] **Step 3: Enter Hardhat keystore values interactively**

Run the three interactive commands one at a time:

```bash
pnpm --filter @course-homework/web3-contracts exec hardhat keystore set SEPOLIA_RPC_URL
pnpm --filter @course-homework/web3-contracts exec hardhat keystore set SEPOLIA_PRIVATE_KEY
pnpm --filter @course-homework/web3-contracts exec hardhat keystore set ETHERSCAN_API_KEY
```

The user types secret values directly into the hidden prompt. Do not paste them into shell arguments, inspect clipboard contents, echo them, or capture screenshots.

- [ ] **Step 4: Present the final deployment confirmation**

Show the public sender address, Sepolia network, tested commit, current balance, and estimated maximum test-ETH cost. Explain that deployment creates a persistent public contract and consumes test ETH. Stop and obtain an explicit user confirmation immediately before the deploy command.

- [ ] **Step 5: Deploy once and verify the same address**

Run after confirmation:

```bash
pnpm --filter @course-homework/web3-contracts deploy:verify:sepolia
```

Expected: Ignition returns `OnchainNotebookModule#OnchainNotebook` with one public address, and source verification succeeds. If deployment succeeds but verification fails, do not redeploy; use Hardhat's verify task with the exact returned literal address.

- [ ] **Step 6: Configure the public address and run the production build**

Use `apply_patch` to create ignored `web/.env.local` with exactly one assignment: the key `VITE_ONCHAIN_NOTEBOOK_ADDRESS` equals the exact 42-character public address printed by Ignition. Do not type an example, fallback, zero address, or test-only address, and do not stage this file.

Then run:

```bash
pnpm web3:build
```

Expected: contract compilation and frontend production build pass. Inspect the built output for the public address and confirm it contains none of the three Hardhat credential values.

- [ ] **Step 7: Verify public Etherscan evidence and commit status**

In external Chrome, open the returned Sepolia Etherscan address. Confirm bytecode exists, deployment succeeded, Contract shows Verified, source includes `recordActivity(ActivityType)` with no string, and ABI includes both notebook and growth functions.

Record only public address, deployment hash, block number, UTC time, Verified URL, and candidate commit in QA. Mark Sepolia deployment and Etherscan verification complete only when directly observed.

```bash
git add HOMEWORKS.md docs/qa/web3-onchain-notebook.md
git commit -m "docs: record BabySteps Sepolia deployment"
```

---

### Task 8: Complete real P0/P1 browser acceptance and final evidence

**Files:**
- Modify: `docs/qa/web3-onchain-notebook.md`
- Modify: `HOMEWORKS.md`

**Interfaces:**
- Consumes: the verified Sepolia address and a dedicated test wallet with enough test ETH for notebook plus three activity writes.
- Produces: real notebook and BabySteps transaction links, refresh-recovery observations, final automated results, and independently truthful P0/P1 status.

- [ ] **Step 1: Start the local DApp and open it in external Chrome**

Run: `pnpm --filter @course-homework/web3-web dev`

Open the exact local URL printed by Vite. Before each browser click, explain its purpose, location, and expected visual result. Confirm the page shows the verified contract address context, Sepolia label, privacy copy, Egg stage, activities, and the separate notebook course experiment.

- [ ] **Step 2: Accept P0 notebook behavior with safe test text**

Use only generic public test strings:

```text
Sepolia notebook acceptance A
Sepolia notebook acceptance B
```

For every MetaMask signature, explain gas and request confirmation before the final wallet action. Verify:

```text
save A → receipt → Etherscan link → refresh shows A
overwrite B → receipt → refresh shows B
clear current note → receipt → refresh shows empty
```

Record the three public transaction hashes. Never enter child information.

- [ ] **Step 3: Accept P1 BabySteps behavior**

Complete the available activities in this exact order:

```text
Meal: 0 → 3, Egg → Sprout
Walk: 3 → 8, Sprout → Explorer
Read: 8 → 15, Explorer → Star
```

After every wallet confirmation, wait for receipt and open the generated Etherscan transaction link. Refresh at 15 points and confirm the total, all three today markers, 100% first-journey progress, and Star stage are restored from Sepolia.

If the same wallet already completed an activity today, do not add an admin reset or send a knowingly reverting transaction. Use another dedicated Sepolia test account or accept existing public transaction evidence plus the automated duplicate-claim test.

- [ ] **Step 4: Check error, privacy, and responsive states**

Observe wrong-network switching, RPC/read-error retry if safely reproducible, disabled duplicate activity cards, pending-submit blocking, public-history warning, and 320px responsive layout. Confirm no child data fields, uploads, location requests, token/asset claims, or “activity proof” language appear.

- [ ] **Step 5: Run the fresh final verification matrix**

Run:

```bash
pnpm web3:check
pnpm web3:test
pnpm web3:typecheck
pnpm web3:build
pnpm check
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected: every command exits 0 against the deployed public address. Read the full output and record exact test counts in QA; do not copy secrets or noisy raw logs.

- [ ] **Step 6: Commit final truthful evidence**

Only after Steps 2–5 are directly observed, mark frontend visual acceptance and both P0/P1 Sepolia interaction rows complete. Keep any unrelated AWS/model-training status unchanged.

```bash
git add HOMEWORKS.md docs/qa/web3-onchain-notebook.md
git commit -m "docs: complete BabySteps Web3 acceptance"
```

Do not push. Hand the branch, public address, Verified URL, representative transaction links, verification counts, and remaining limitations to the user for review.
