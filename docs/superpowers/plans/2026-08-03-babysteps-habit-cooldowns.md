# BabySteps Habit Cooldowns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace one-claim-per-day activity flags with PRD-defined random cooldowns, UTC+8 daily caps, silent availability reads, and complete activity visual-state mapping without changing the accepted Stitch layout.

**Architecture:** `OnchainNotebook` remains the only source of eligibility. It stores per-wallet, per-activity progress and exposes a time-free availability tuple. `useGrowth` polls that tuple every 60 seconds and maps it to explicit frontend state. `GrowthPanel` renders the accepted Stitch cards from those states and never calculates eligibility from browser time.

**Tech Stack:** Solidity 0.8.28, Hardhat 3, TypeScript, React 19, wagmi 3, viem 2, Vitest, Testing Library

## Global Constraints

- The PRD at `docs/product/2026-08-03-babysteps-stitch-ui-prd.md` is the only product requirement source.
- Meal rewards 3 points, cooldown 3–4 hours, and has a UTC+8 cap of 6 claims per day.
- Walk rewards 5 points, cooldown 8–12 hours, and has a UTC+8 cap of 2 claims per day.
- Read rewards 7 points, cooldown 4–6 hours, and has a UTC+8 cap of 3 claims per day.
- The UI never renders a next-claim time, countdown, remaining hours, or remaining minutes, including assistive text.
- Cooldown and daily-limit states render no claim button. Only an available activity renders an enabled claim button.
- The contract is not deployed yet, so replace the pre-deployment ABI directly. Do not add upgrade or migration machinery.
- Keep notebook, lifetime growth, transferable balances, and point transfers independent.
- Randomness is gameplay-only and must never be described as secure, financial, medical, or suitable for fair allocation.
- Do not alter the accepted Stitch information architecture, colors, card layout, or typography except for state-driven activity content.

---

### Task 1: Enforce random cooldowns and daily caps onchain

**Files:**

- Modify: `homeworks/06-web3-dapp/contracts/test/OnchainNotebook.ts`
- Modify: `homeworks/06-web3-dapp/contracts/contracts/OnchainNotebook.sol`

**Interfaces:**

- Produces: `getActivityAvailability(address,uint8) returns (bool available,bool dailyLimitReached)`
- Produces: `ActivityCoolingDown(address,uint8)`
- Produces: `DailyActivityLimitReached(address,uint8,uint256)`
- Preserves: `recordActivity(uint8)`, reward values, `ActivityRecorded`, growth getters, transfers, and notebook functions

- [ ] **Step 1: Write failing boundary tests**

Add focused Hardhat tests that prove:

```typescript
const [available, dailyLimitReached] =
  await notebook.read.getActivityAvailability([author.account.address, 0]);
assert.equal(available, true);
assert.equal(dailyLimitReached, false);
```

For every activity, record once, assert unavailable one second before its minimum cooldown, then assert available at its maximum cooldown. These tests must fail because the getter does not exist.

- [ ] **Step 2: Run the contract test and confirm RED**

Run: `pnpm --dir homeworks/06-web3-dapp/contracts test`

Expected: TypeScript or ABI failure for missing `getActivityAvailability`.

- [ ] **Step 3: Add progress storage and the availability getter**

Implement:

```solidity
struct ActivityProgress {
    uint64 nextClaimAt;
    uint64 totalClaims;
    uint32 utc8DayMarker;
    uint16 claimsToday;
}

mapping(address account => mapping(ActivityType activity => ActivityProgress progress))
    private activityProgress;
```

`getActivityAvailability` returns the daily-limit state first, then cooldown state, and never returns a timestamp.

- [ ] **Step 4: Make the boundary tests GREEN**

Run: `pnpm --dir homeworks/06-web3-dapp/contracts test`

Expected: the new boundary tests pass while existing tests that expect daily booleans still fail.

- [ ] **Step 5: Write failing cap, UTC+8, and state-independence tests**

Add tests that:

- reach caps 6, 2, and 3 inside one UTC+8 day;
- assert the next call reverts with `DailyActivityLimitReached` before cooldown evaluation;
- cross Beijing midnight and prove the daily counter resets but an unfinished cooldown still blocks;
- cross UTC midnight while Beijing remains on the same day and prove the counter does not reset;
- repeat claims and prove growth and transferable balances add rewards correctly;
- transfer points and edit/clear a note without changing activity progress;
- inspect `ActivityRecorded` and both custom errors to prove they contain no next-claim timestamp or string.

- [ ] **Step 6: Run tests and confirm RED for old daily-marker behavior**

Run: `pnpm --dir homeworks/06-web3-dapp/contracts test`

Expected: old one-per-day behavior cannot satisfy repeated claims and new custom errors.

- [ ] **Step 7: Implement record validation and gameplay randomness**

Use daily-limit-before-cooldown ordering. On success, update counts, set `nextClaimAt`, add both ledgers, and emit the unchanged activity event. Compute gameplay cooldown from `block.prevrandao`, `block.timestamp`, `msg.sender`, activity, and the incremented claim count. Keep the result inside the PRD closed interval.

- [ ] **Step 8: Run contract verification**

Run:

```bash
pnpm --dir homeworks/06-web3-dapp/contracts check
pnpm --dir homeworks/06-web3-dapp/contracts test
pnpm --dir homeworks/06-web3-dapp/contracts typecheck
pnpm --dir homeworks/06-web3-dapp/contracts build
```

Expected: every command passes.

- [ ] **Step 9: Commit the contract behavior**

```bash
git add homeworks/06-web3-dapp/contracts/contracts/OnchainNotebook.sol homeworks/06-web3-dapp/contracts/test/OnchainNotebook.ts
git commit -m "feat(web3): add BabySteps habit cooldowns"
```

### Task 2: Align the frontend ABI and safe error copy

**Files:**

- Modify: `homeworks/06-web3-dapp/web/src/contracts/onchainNotebook.ts`
- Modify: `homeworks/06-web3-dapp/web/src/lib/walletError.ts`
- Modify: `homeworks/06-web3-dapp/web/src/lib/walletError.test.ts`

**Interfaces:**

- Consumes: Task 1 ABI
- Produces: safe messages for `ActivityCoolingDown` and `DailyActivityLimitReached`

- [ ] **Step 1: Write failing nested-error tests**

Add tests for real viem-style nested causes:

```typescript
expect(toWalletMessage({ cause: { data: { errorName: "ActivityCoolingDown" } } }))
  .toBe("星宝的这个活动还没有准备好。");
expect(toWalletMessage({ cause: { data: { errorName: "DailyActivityLimitReached" } } }))
  .toBe("星宝今天已经很充实了。");
```

Also assert the old Beijing-midnight message is absent from activity errors.

- [ ] **Step 2: Run the wallet-error test and confirm RED**

Run: `pnpm --dir homeworks/06-web3-dapp/web test -- src/lib/walletError.test.ts`

Expected: generic failure messages instead of the PRD copy.

- [ ] **Step 3: Replace the ABI and error mappings**

Remove `ActivityAlreadyRecordedToday` and `hasRecordedToday`; add both new custom errors and `getActivityAvailability`. Preserve all notebook, ledger, and transfer entries exactly.

- [ ] **Step 4: Run the focused tests and typecheck**

Run:

```bash
pnpm --dir homeworks/06-web3-dapp/web test -- src/lib/walletError.test.ts
pnpm --dir homeworks/06-web3-dapp/web typecheck
```

Expected: both pass.

- [ ] **Step 5: Commit the ABI boundary**

```bash
git add homeworks/06-web3-dapp/web/src/contracts/onchainNotebook.ts homeworks/06-web3-dapp/web/src/lib/walletError.ts homeworks/06-web3-dapp/web/src/lib/walletError.test.ts
git commit -m "feat(web): define BabySteps activity availability"
```

### Task 3: Poll exact activity availability through wagmi

**Files:**

- Modify: `homeworks/06-web3-dapp/web/src/features/growth/useGrowth.ts`
- Modify: `homeworks/06-web3-dapp/web/src/features/growth/useGrowth.test.tsx`

**Interfaces:**

- Produces: `availabilityByActivity: Record<GrowthActivityId, { available: boolean; dailyLimitReached: boolean }> | undefined`
- Produces: `GrowthPhase` including `rejected`
- Preserves: receipt-gated success, exact cache invalidation, wallet switching, points, and stage reads

- [ ] **Step 1: Write failing read and polling tests**

Update mocks to return `[available, dailyLimitReached]`. Assert exactly five reads remain, each activity read uses `getActivityAvailability`, and its query includes `refetchInterval: 60_000` only when enabled.

- [ ] **Step 2: Run the hook tests and confirm RED**

Run: `pnpm --dir homeworks/06-web3-dapp/web test -- src/features/growth/useGrowth.test.tsx`

Expected: failures for old function names and boolean shape.

- [ ] **Step 3: Implement availability mapping**

Replace daily booleans with explicit tuple mapping. Keep state `undefined` until every required read succeeds. Build invalidation keys with `getActivityAvailability`.

- [ ] **Step 4: Write failing transaction-state tests**

Assert:

- unavailable cooldown and cap states do not simulate a write;
- rejection returns `phase === "rejected"` and keeps chain state;
- receipt success invalidates six unique keys before success;
- account or network changes cannot reuse stale availability;
- retry refetches all five hook-owned reads.

- [ ] **Step 5: Run tests and confirm RED for missing rejected state**

Run the focused hook test and verify the new rejection assertion fails for the old `write-error` phase.

- [ ] **Step 6: Implement transaction guards and rejection state**

Use the exact availability tuple as a defensive pre-submit guard. Never calculate time in the hook. Set `rejected` only for wallet cancellation and keep other failures as `write-error`.

- [ ] **Step 7: Run focused verification**

Run:

```bash
pnpm --dir homeworks/06-web3-dapp/web test -- src/features/growth/useGrowth.test.tsx
pnpm --dir homeworks/06-web3-dapp/web typecheck
```

Expected: both pass.

- [ ] **Step 8: Commit the wagmi integration**

```bash
git add homeworks/06-web3-dapp/web/src/features/growth/useGrowth.ts homeworks/06-web3-dapp/web/src/features/growth/useGrowth.test.tsx
git commit -m "feat(web): poll BabySteps habit availability"
```

### Task 4: Drive every accepted Stitch activity state from real data

**Files:**

- Create: `homeworks/06-web3-dapp/web/src/features/growth/activityVisualState.ts`
- Create: `homeworks/06-web3-dapp/web/src/features/growth/activityVisualState.test.ts`
- Modify: `homeworks/06-web3-dapp/web/src/features/growth/GrowthPanel.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/features/growth/GrowthPanel.test.tsx`
- Modify: `docs/qa/web3-onchain-notebook.md`
- Modify: `HOMEWORKS.md` only if the verified local status wording needs correction

**Interfaces:**

- Consumes: Task 3 `availabilityByActivity`, `phase`, active activity, and transaction message
- Produces: PRD visual states `available`, `cooldown`, `daily-limit`, `loading`, `read-error`, `awaiting-signature`, `confirming`, `success`, `rejected`, and `write-error`

- [ ] **Step 1: Write failing pure-state tests**

Cover every visual state and its priority. Daily limit must outrank cooldown; active transaction state must apply only to its card; unknown/read error must hide all action buttons.

- [ ] **Step 2: Run the state test and confirm RED**

Run: `pnpm --dir homeworks/06-web3-dapp/web test -- src/features/growth/activityVisualState.test.ts`

Expected: module-not-found failure.

- [ ] **Step 3: Implement the smallest pure mapper**

Return state plus safe status copy. Do not return or accept timestamps.

- [ ] **Step 4: Write failing component tests**

Assert:

- cooldown and daily limit render no button;
- cooldown uses all three PRD roleplay messages;
- daily limit says `星宝今天已经很充实了`;
- available renders exactly one button for that card;
- active awaiting/confirming renders a disabled button;
- rejected/write-error restores a retry button only if onchain availability is still true;
- rendered activity region contains no clock time, countdown, remaining hour, or remaining minute copy.

- [ ] **Step 5: Run the component test and confirm RED**

Run: `pnpm --dir homeworks/06-web3-dapp/web test -- src/features/growth/GrowthPanel.test.tsx`

Expected: failures because the component still reads `todayByActivity`.

- [ ] **Step 6: Connect the accepted Stitch cards to the mapper**

Preserve HTML structure and class names where possible. Only replace state selection and copy. Keep the persistent random-game disclaimer.

- [ ] **Step 7: Run full local verification**

Run:

```bash
pnpm --dir homeworks/06-web3-dapp/contracts check
pnpm --dir homeworks/06-web3-dapp/contracts test
pnpm --dir homeworks/06-web3-dapp/contracts typecheck
pnpm --dir homeworks/06-web3-dapp/contracts build
pnpm --dir homeworks/06-web3-dapp/web check
pnpm --dir homeworks/06-web3-dapp/web test
pnpm --dir homeworks/06-web3-dapp/web typecheck
VITE_ONCHAIN_NOTEBOOK_ADDRESS=0x1111111111111111111111111111111111111111 pnpm --dir homeworks/06-web3-dapp/web build
```

Expected: every command passes; the temporary address is used only as a local bundling gate and is not recorded as a deployment.

- [ ] **Step 8: Perform browser acceptance**

Render at 1440, 390, and 320 px. Verify no horizontal overflow, no console warnings/errors, no cooldown time text, and no action button on cooldown/cap cards. Record real-state limitations honestly; do not mark Sepolia deployment complete.

- [ ] **Step 9: Update QA and commit**

Document automated results, UI-state observations, and pending Sepolia/Etherscan work.

```bash
git add homeworks/06-web3-dapp/web/src/features/growth docs/qa/web3-onchain-notebook.md HOMEWORKS.md
git commit -m "feat(web): connect BabySteps habit states"
```

### Task 5: Independent review and final branch verification

**Files:**

- Review only: every file changed in Tasks 1–4
- Modify only if review finds a concrete defect

**Interfaces:**

- Produces: evidence that PRD functionality is covered and Stitch-only extras remain excluded

- [ ] **Step 1: Review contract safety and boundary coverage**

Check daily-limit ordering, integer widths, random range, state-before-event behavior, absence of external calls, and independence of notebook/transfers.

- [ ] **Step 2: Review frontend state completeness**

Map every PRD activity state to one test and one UI result. Search source and rendered output for forbidden cooldown-time copy and excluded Stitch concepts.

- [ ] **Step 3: Re-run the complete repository Web3 gates**

Run the root Web3 check, test, typecheck, and build commands from the repository documentation in addition to the focused commands.

- [ ] **Step 4: Commit review fixes, if any**

Create a focused fix commit only when review identifies an actual defect. Do not amend earlier commits.

- [ ] **Step 5: Report truthful completion status**

Report local implementation and validation separately from Sepolia deployment, Etherscan verification, and real cooldown reappearance observation. Do not push or deploy without a new explicit user request.
