# BabySteps Transferable Points Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add direct Sepolia wallet-to-wallet transfers of BabySteps growth points while keeping lifetime growth and transferable balances as separate onchain ledgers.

**Architecture:** `OnchainNotebook` keeps the existing lifetime `growthPoints` for StarBuddy stages and adds `transferableBalances` for gifting. A focused `usePointTransfer` hook owns balance reads and transfer transaction state, while `useGrowth` only gains the one cache invalidation needed when an activity earns new transferable balance. A separate transfer panel prevents the notebook, activity, and transfer forms from sharing state.

**Tech Stack:** Solidity 0.8.28, Hardhat 3, viem, React 19, wagmi 3, TanStack Query, Vitest, Testing Library, TypeScript, Biome.

## Global Constraints

- Deploy only to Sepolia with a dedicated test wallet; never use a real-asset wallet.
- Do not implement ERC-20/ERC-721/ERC-1155, allowances, delegated transfers, markets, prices, redemption, or withdrawals.
- Lifetime growth points only increase from `Meal = 0`, `Walk = 1`, and `Read = 2`; transfers never change either wallet's lifetime points or stage.
- Each activity reward increases both lifetime points and transferable balance by exactly 3, 5, or 7.
- A received transferable balance may be gifted again.
- Reject the zero address, self-transfer, zero amount, and insufficient balance in the contract even when the frontend already rejects them.
- Treat one integer unit as one growth point; do not support decimals.
- A transaction hash means broadcast only; report success only after a successful receipt and cache refresh.
- Never put private keys, mnemonics, RPC credentials, API keys, child data, or real-wallet details in Git, chat, screenshots, commands, or logs.
- Keep the public notebook, growth activity, and point-transfer flows independent in contract tests, hooks, UI state, and QA evidence.

---

### Task 1: Add the contract's transferable-balance ledger

**Files:**
- Modify: `homeworks/06-web3-dapp/contracts/contracts/OnchainNotebook.sol`
- Modify: `homeworks/06-web3-dapp/contracts/test/OnchainNotebook.ts`

**Interfaces:**
- Consumes: existing `recordActivity(ActivityType)`, `getGrowthPoints(address)`, and `getGrowthStage(address)`.
- Produces: `getTransferableBalance(address) returns (uint256)`, `transferGrowthPoints(address,uint256)`, four custom errors, and `GrowthPointsTransferred`.

- [ ] **Step 1: Write failing contract tests for earning both ledgers**

Add an assertion to the activity reward test and a focused independence test:

```ts
assert.equal(
  await notebook.read.getTransferableBalance([author.account.address]),
  15n,
);

it("keeps lifetime growth unchanged when points are transferred", async () => {
  const notebook = await viem.deployContract("OnchainNotebook");
  await notebook.write.recordActivity([2], { account: author.account });
  await notebook.write.transferGrowthPoints([reader.account.address, 5n], {
    account: author.account,
  });

  assert.equal(await notebook.read.getGrowthPoints([author.account.address]), 7n);
  assert.equal(await notebook.read.getGrowthStage([author.account.address]), 1);
  assert.equal(await notebook.read.getGrowthPoints([reader.account.address]), 0n);
  assert.equal(await notebook.read.getGrowthStage([reader.account.address]), 0);
  assert.equal(await notebook.read.getTransferableBalance([author.account.address]), 2n);
  assert.equal(await notebook.read.getTransferableBalance([reader.account.address]), 5n);
});
```

- [ ] **Step 2: Write failing transfer event and validation tests**

Cover a successful event with final balances, re-gifting received balance, and four exact reverts:

```ts
await viem.assertions.emitWithArgs(
  notebook.write.transferGrowthPoints([reader.account.address, 2n], {
    account: author.account,
  }),
  notebook,
  "GrowthPointsTransferred",
  [author.account.address, reader.account.address, 2n, 1n, 2n],
);

await viem.assertions.revertWithCustomErrorWithArgs(
  notebook.write.transferGrowthPoints([zeroAddress, 1n], { account: author.account }),
  notebook,
  "InvalidTransferRecipient",
  [zeroAddress],
);
```

Also assert `CannotTransferToSelf`, `InvalidTransferAmount`, and
`InsufficientTransferableBalance(available, requested)` leave both balances unchanged.

- [ ] **Step 3: Run the focused contract tests and verify red**

Run:

```sh
pnpm --filter @course-homework/web3-contracts test
```

Expected: FAIL because the getter, transfer function, errors, event, and transferable ledger do not exist.

- [ ] **Step 4: Implement the minimal Solidity ledger and transfer**

Add:

```solidity
mapping(address account => uint256 balance) private transferableBalances;

error InvalidTransferRecipient(address recipient);
error CannotTransferToSelf();
error InvalidTransferAmount();
error InsufficientTransferableBalance(uint256 available, uint256 requested);

event GrowthPointsTransferred(
    address indexed sender,
    address indexed recipient,
    uint256 amount,
    uint256 senderBalance,
    uint256 recipientBalance
);
```

In `recordActivity`, add the reward to `transferableBalances[msg.sender]` only after the duplicate-day check. Implement:

```solidity
function getTransferableBalance(address account) external view returns (uint256) {
    return transferableBalances[account];
}

function transferGrowthPoints(address recipient, uint256 amount) external {
    if (recipient == address(0)) revert InvalidTransferRecipient(recipient);
    if (recipient == msg.sender) revert CannotTransferToSelf();
    if (amount == 0) revert InvalidTransferAmount();

    uint256 senderBalance = transferableBalances[msg.sender];
    if (senderBalance < amount) {
        revert InsufficientTransferableBalance(senderBalance, amount);
    }

    senderBalance -= amount;
    uint256 recipientBalance = transferableBalances[recipient] + amount;
    transferableBalances[msg.sender] = senderBalance;
    transferableBalances[recipient] = recipientBalance;
    emit GrowthPointsTransferred(
        msg.sender,
        recipient,
        amount,
        senderBalance,
        recipientBalance
    );
}
```

- [ ] **Step 5: Run all contract checks**

Run:

```sh
pnpm --filter @course-homework/web3-contracts test
pnpm --filter @course-homework/web3-contracts typecheck
pnpm --filter @course-homework/web3-contracts check
```

Expected: all old notebook/activity tests and all new transfer tests pass.

- [ ] **Step 6: Commit the contract deliverable**

```sh
git add homeworks/06-web3-dapp/contracts/contracts/OnchainNotebook.sol homeworks/06-web3-dapp/contracts/test/OnchainNotebook.ts
git commit -m "feat: add transferable BabySteps balances"
```

---

### Task 2: Extend the frontend contract and transfer validation model

**Files:**
- Modify: `homeworks/06-web3-dapp/web/src/contracts/onchainNotebook.ts`
- Modify: `homeworks/06-web3-dapp/web/src/contracts/onchainNotebook.test.ts`
- Create: `homeworks/06-web3-dapp/web/src/features/growth/pointTransferModel.ts`
- Create: `homeworks/06-web3-dapp/web/src/features/growth/pointTransferModel.test.ts`
- Modify: `homeworks/06-web3-dapp/web/src/lib/walletError.ts`
- Modify: `homeworks/06-web3-dapp/web/src/lib/walletError.test.ts`

**Interfaces:**
- Consumes: the exact Solidity interface from Task 1 and viem `Address`/`getAddress`.
- Produces: ABI entries plus `validatePointTransfer(input): PointTransferValidation`.

- [ ] **Step 1: Write failing ABI assertions**

Assert the parsed ABI contains:

```ts
"function getTransferableBalance(address account) view returns (uint256)"
"function transferGrowthPoints(address recipient, uint256 amount)"
"event GrowthPointsTransferred(address indexed sender, address indexed recipient, uint256 amount, uint256 senderBalance, uint256 recipientBalance)"
```

Also assert all four custom errors exist and the transfer function has exactly an address and uint256 input—no strings or child-data field.

- [ ] **Step 2: Write failing pure-model tests**

Define the intended result:

```ts
type PointTransferValidation =
  | { ok: true; recipient: Address; amount: bigint }
  | { ok: false; message: string };
```

Tests must accept a checksummed or lowercase valid recipient and integer amount within balance. Tests must reject empty/invalid address, sender address case-insensitively, empty/zero/negative/decimal amount, and amount above balance.

- [ ] **Step 3: Write failing wallet-error mapping tests**

Assert exact messages for `InvalidTransferRecipient`, `CannotTransferToSelf`,
`InvalidTransferAmount`, and `InsufficientTransferableBalance`, without including raw RPC or private error text.

- [ ] **Step 4: Run focused tests and verify red**

Run:

```sh
pnpm --filter @course-homework/web3-web test -- onchainNotebook pointTransferModel walletError
```

Expected: FAIL because transfer ABI/model/error mappings are absent.

- [ ] **Step 5: Implement ABI, validation, and safe messages**

Use `getAddress` only after `isAddress` succeeds. Parse amount only when it matches `/^[0-9]+$/`; require `amount > 0n` and `amount <= balance`. Return these user-facing messages:

```text
请输入有效的 Sepolia 收款钱包地址。
不能把成长星赠送给当前钱包。
赠送数量必须是大于 0 的整数。
可赠送成长星不足。
```

Add the exact ABI strings from Task 1. Never interpolate raw provider error details.

- [ ] **Step 6: Run frontend model checks**

Run:

```sh
pnpm --filter @course-homework/web3-web test -- onchainNotebook pointTransferModel walletError
pnpm --filter @course-homework/web3-web typecheck
pnpm --filter @course-homework/web3-web check
```

Expected: all focused tests, TypeScript, and Biome pass.

- [ ] **Step 7: Commit the frontend contract boundary**

```sh
git add homeworks/06-web3-dapp/web/src/contracts homeworks/06-web3-dapp/web/src/features/growth/pointTransferModel.ts homeworks/06-web3-dapp/web/src/features/growth/pointTransferModel.test.ts homeworks/06-web3-dapp/web/src/lib/walletError.ts homeworks/06-web3-dapp/web/src/lib/walletError.test.ts
git commit -m "feat: define BabySteps point transfers"
```

---

### Task 3: Connect point transfers through wagmi

**Files:**
- Create: `homeworks/06-web3-dapp/web/src/features/growth/usePointTransfer.ts`
- Create: `homeworks/06-web3-dapp/web/src/features/growth/usePointTransfer.test.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/features/growth/useGrowth.ts`
- Modify: `homeworks/06-web3-dapp/web/src/features/growth/useGrowth.test.tsx`

**Interfaces:**
- Consumes: `validatePointTransfer`, `getTransferableBalance`, `transferGrowthPoints`, existing wallet-state helpers, and `toWalletMessage`.
- Produces: `usePointTransfer()` with controlled form state, validated submit state, balance read, transaction phases, retry, and chain switching.

- [ ] **Step 1: Write failing hook tests for reads and validation**

Assert disconnected reads are disabled, successful reads expose a `bigint` balance, read failures do not become zero, and the hook exposes:

```ts
{
  walletState,
  balance,
  recipient,
  setRecipient,
  amount,
  setAmount,
  validationMessage,
  canTransfer,
  phase,
  message,
  transactionHash,
  transfer,
  retryRead,
  switchToSepolia,
  isPending,
}
```

- [ ] **Step 2: Write failing transaction lifecycle tests**

Assert `transfer()`:

1. calls `simulateContract` with `transferGrowthPoints`, normalized recipient, parsed `bigint`, current account, and Sepolia chain ID;
2. displays awaiting-signature before `writeContractAsync` resolves;
3. displays confirming after broadcast but does not change balance;
4. invalidates sender and recipient `getTransferableBalance` query keys after successful receipt;
5. clears amount only after successful refresh;
6. blocks duplicate submission and maps wallet rejection/reverted receipt safely.

- [ ] **Step 3: Update the growth-hook cache expectation first**

Change the activity receipt test to expect six invalidations: five lifetime/daily reads plus the sender's `getTransferableBalance` query. Run it and confirm it fails at five.

- [ ] **Step 4: Implement `usePointTransfer` and the growth cache bridge**

Follow the existing `useGrowth` transaction-state pattern, but keep transfer state in its own hook. Store submitted recipient/amount in refs so later form edits cannot change the receipt success message. Do not mutate balance optimistically.

In `useGrowth.readQueryKeys`, append:

```ts
readContractQueryKey({
  address: notebookAddress,
  functionName: "getTransferableBalance",
  args: [address],
  chainId: sepolia.id,
})
```

Update the success guard from five to six keys.

- [ ] **Step 5: Run hook tests and static checks**

Run:

```sh
pnpm --filter @course-homework/web3-web test -- usePointTransfer useGrowth
pnpm --filter @course-homework/web3-web typecheck
pnpm --filter @course-homework/web3-web check
```

Expected: lifecycle, cache, validation, cancellation, and error tests pass without optimistic state.

- [ ] **Step 6: Commit the wagmi transfer flow**

```sh
git add homeworks/06-web3-dapp/web/src/features/growth/usePointTransfer.ts homeworks/06-web3-dapp/web/src/features/growth/usePointTransfer.test.tsx homeworks/06-web3-dapp/web/src/features/growth/useGrowth.ts homeworks/06-web3-dapp/web/src/features/growth/useGrowth.test.tsx
git commit -m "feat: connect BabySteps point transfers"
```

---

### Task 4: Add the accessible point-gifting interface

**Files:**
- Create: `homeworks/06-web3-dapp/web/src/features/growth/PointTransferPanel.tsx`
- Create: `homeworks/06-web3-dapp/web/src/features/growth/PointTransferPanel.test.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/features/growth/GrowthPanel.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/App.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/App.test.tsx`
- Modify: `homeworks/06-web3-dapp/web/src/styles.css`

**Interfaces:**
- Consumes: `usePointTransfer()` from Task 3 and existing responsive card/button styles.
- Produces: an independent transfer panel with public-data warning, balance, controlled form, transaction state, and Etherscan link.

- [ ] **Step 1: Write failing component tests**

Mock `usePointTransfer` and assert the panel:

- labels `累计养成值` separately from `可赠送成长星`;
- shows the exact public, irreversible-transfer warning;
- accepts only a wallet address and integer quantity;
- disables submit when `canTransfer` is false or `isPending` is true;
- calls `transfer()` once for valid input;
- distinguishes signature and confirmation messages;
- renders a Sepolia Etherscan link only when a hash exists;
- renders safe retry/switch-network actions for their states.

- [ ] **Step 2: Update the page-level safety test first**

Change the hero expectation from “不可转让” to:

```text
成长星无价格，只用于 Sepolia 课程演示；可在测试钱包间赠送，不可兑换。
```

Add an assertion that received balance is not described as growth-stage progress. Run `App` tests and confirm the old page fails.

- [ ] **Step 3: Implement and compose `PointTransferPanel`**

Place it after the activity panel and before the independent public notebook. Use text inputs with `inputMode="numeric"` for amount, explicit labels, `aria-describedby` for validation/warnings, a minimum 48px target, and no child-related free-text field.

Use `role="alert"` for validation/transaction failures and `aria-live="polite"` for signature, confirmation, and success. Link successful transfers to:

```text
https://sepolia.etherscan.io/tx/{transactionHash}
```

- [ ] **Step 4: Adjust growth copy and responsive styles**

Rename the current total label to `累计养成值：N` and explain that it only comes from the wallet's recorded activities. Style the transfer form to stack at 320px with visible focus rings and no horizontal overflow.

- [ ] **Step 5: Run full frontend verification**

Run:

```sh
pnpm --filter @course-homework/web3-web test
pnpm --filter @course-homework/web3-web typecheck
pnpm --filter @course-homework/web3-web check
```

Expected: all old P0/P1 tests and all transfer model/hook/component tests pass.

- [ ] **Step 6: Commit the user interface**

```sh
git add homeworks/06-web3-dapp/web/src
git commit -m "feat: add BabySteps point gifting interface"
```

---

### Task 5: Update learning documentation and verify the repository

**Files:**
- Modify: `homeworks/06-web3-dapp/README.md`
- Modify: `docs/qa/web3-onchain-notebook.md`
- Modify: `HOMEWORKS.md`
- Modify: `scripts/__tests__/monorepo-layout.test.mjs`

**Interfaces:**
- Consumes: the completed local dual-ledger contract and transfer UI.
- Produces: reproducible learning instructions, truthful transfer status, and repository rules preventing accidental token/secret claims.

- [ ] **Step 1: Write failing structure/documentation assertions**

Require `usePointTransfer.ts` and `PointTransferPanel.tsx`. Assert the README contains `累计成长值`, `可转余额`, `transferGrowthPoints`, `不可兑换`, and explains that receipt success—not hash broadcast—marks completion. Assert it does not claim ERC-20 or mainnet deployment.

- [ ] **Step 2: Run the structure test and verify red**

```sh
node --test scripts/__tests__/monorepo-layout.test.mjs
```

Expected: FAIL because the learning README and QA status do not yet describe transfers.

- [ ] **Step 3: Update README and QA status**

Explain the dual-ledger analogy: lifetime growth is a non-decreasing “成长相册总页数”, while transferable balance is the “手里可送出的星星”. Add separate QA rows for local transfer implementation and real Sepolia transfer interaction. Keep deployment, Etherscan, browser, and real transfer rows pending.

Update the page-status wording in `HOMEWORKS.md` without marking any unobserved Sepolia work complete.

- [ ] **Step 4: Run the full local verification matrix**

```sh
pnpm web3:check
pnpm web3:test
pnpm web3:typecheck
pnpm check
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected: every command exits 0. Do not claim `pnpm web3:build` until a real deployed address is configured.

- [ ] **Step 5: Request independent code review and resolve findings**

Review from the base design commit through the current work, including uncommitted docs. Fix every Critical and Important finding, rerun affected tests, and record only evidence actually observed.

- [ ] **Step 6: Commit verified local transfer documentation**

```sh
git add HOMEWORKS.md docs/qa/web3-onchain-notebook.md homeworks/06-web3-dapp/README.md scripts/__tests__/monorepo-layout.test.mjs
git commit -m "docs: verify local BabySteps point transfers"
```

---

### Task 6: Deploy and visibly verify the exact candidate on Sepolia

**Files:**
- Create or modify locally ignored: `homeworks/06-web3-dapp/web/.env.local`
- Modify: `docs/qa/web3-onchain-notebook.md`
- Modify: `HOMEWORKS.md`

**Interfaces:**
- Consumes: a clean, fully verified candidate commit; dedicated Sepolia MetaMask accounts; interactive Hardhat keystore values; test ETH.
- Produces: public deployment/verification evidence and one directly observed wallet-to-wallet transfer.

- [ ] **Step 1: Freeze the candidate and request the external-action confirmation**

Record `git rev-parse HEAD`, confirm tracked status is clean, and rerun `pnpm web3:check`, `pnpm web3:test`, and `pnpm web3:typecheck`. Before any faucet request, keystore entry, deployment, or wallet signature, explain the exact public data/cost and request the user's final confirmation.

- [ ] **Step 2: Configure secrets only through interactive Hardhat keystore**

Set `SEPOLIA_RPC_URL`, `SEPOLIA_PRIVATE_KEY`, and `ETHERSCAN_API_KEY` one at a time without echoing or logging their values. Stop for the user if Touch ID, a device password, or wallet approval appears.

- [ ] **Step 3: Deploy and verify source**

Run the existing `deploy:verify:sepolia` command. Record only the public contract address, transaction hash, block, UTC time, verified Etherscan URL, and candidate SHA. Put the public address in ignored `.env.local`, then run `pnpm web3:build`.

- [ ] **Step 4: Use external Chrome for visible P0/P1/transfer acceptance**

Explain every click before using MetaMask. Verify P0 note save/refresh/replace/clear-current, P1 activity reward/refresh/duplicate-day error, and a transfer between two dedicated test addresses. Confirm sender and recipient balances, both unchanged lifetime stages, receipt success, refresh persistence, and the Etherscan event.

- [ ] **Step 5: Record only observed public evidence and commit**

Update QA/HOMEWORKS status independently. Do not push unless the user separately requests it.

