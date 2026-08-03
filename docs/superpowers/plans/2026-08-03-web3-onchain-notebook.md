# Web3 链上记事本实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 独立归档并验收周六的私人银行与 ETH 红包合约，再完成一个可由 MetaMask 在 Sepolia 上读写、清空并刷新恢复的链上记事本 DApp。

**Architecture:** 周六 Remix 作业放在 `homeworks/05-web3-remix`，只保存合约源码、学习说明和本地 VM 验收证据。周日作业放在 `homeworks/06-web3-dapp`，由 Hardhat 3 合约包和 Vite + React + wagmi 纯客户端前端组成；智能合约是唯一数据后端，前端不保存私钥或笔记副本。

**Tech Stack:** pnpm 11.17、Node.js 22、Solidity 0.8.28、Hardhat 3.12.0、Hardhat Toolbox Viem 5.0.7、Viem 2.55.10、Vite 8.2.0、React 19.2.8、wagmi 3.7.5、TanStack Query 5.101.4、Vitest 4.1.10、Testing Library 16.3.2、Biome 2.5.6。

## Global Constraints

- 只在隔离工作树 `codex/web3-onchain-notebook` 中实现；不得修改或混入模型训练任务。
- 周六和周日作业必须使用独立目录；不得把 Web3 页面塞入现有 `apps/web`。
- 周日合约名固定为 `OnchainNotebook`，Solidity 固定为 `0.8.28`，优化器固定启用且 `runs = 200`。
- 每个钱包最多一条公开笔记；最大长度按 UTF-8 编码后的字节数计算，固定为 280 字节。
- ABI 必须包含 `NoteTooLong`、`NoteUpdated`、`NoteCleared`、`getNote`、`setNote` 和 `clearNote`。
- 前端只支持 Sepolia（chain ID `11155111`）和 injected MetaMask；RainbowKit/ConnectKit 不在首版范围。
- 前端采用 CSR。CSR 不提供保密性；权限必须由合约中的 `msg.sender` 保证。
- `SEPOLIA_RPC_URL`、`SEPOLIA_PRIVATE_KEY`、`ETHERSCAN_API_KEY` 只存入 Hardhat 本机加密 keystore；不得进入 `.env`、命令参数、聊天、截图、日志或 Git。
- `VITE_ONCHAIN_NOTEBOOK_ADDRESS` 是公开地址，可以出现在本机 `.env.local`、构建产物和 QA 文档；缺失或非法地址必须使生产构建失败。
- 任何水龙头、MetaMask 签名、Sepolia 部署或外部凭据创建动作，都必须在最终动作前向用户解释目的、位置、费用/风险和预期结果，并取得明确确认。
- 用户已要求使用外置 Chrome 带做网页步骤；后续可视验收使用外置 Chrome，不使用设计文档早期写下的“内置浏览器”。
- 教学注释只放在安全边界、UTF-8 字节限制、交易确认和缓存刷新等不直观位置；不写逐行翻译式注释。
- 不推送 GitHub，不部署生产环境，除非用户另行要求。

## 课程笔记与已确认设计的取舍

- 课程示例使用 Solidity `0.8.20`；本项目使用已确认设计和 Hardhat 3/Etherscan 当前官方示例采用的 `0.8.28`。项目约束优先，编译、部署和验证必须始终使用完全相同的版本与优化器设置。
- 课程参考合约使用 `mapping(address => Note[])` 保存多条笔记；已确认设计选择 `mapping(address => string)` 保存每钱包一条笔记，以突出 `msg.sender` 身份隔离并控制第一次 DApp 的范围。课程要求的链上读写、事件和持久化仍完整覆盖。
- 课程把 RainbowKit/ConnectKit 列为推荐工具而非硬性要求；首版使用 wagmi 原生 injected connector，避免引入 WalletConnect 项目 ID。

---

### Task 1: 归档周六 Remix 合约与验收证据

**Files:**
- Create: `homeworks/05-web3-remix/contracts/SimpleBank.sol`
- Create: `homeworks/05-web3-remix/contracts/RedPacket.sol`
- Create: `homeworks/05-web3-remix/README.md`
- Create: `docs/qa/web3-saturday-contracts.md`
- Modify: `scripts/__tests__/monorepo-layout.test.mjs`
- Modify: `HOMEWORKS.md`
- Modify: `docs/superpowers/specs/2026-08-02-web3-onchain-notebook-design.md`

**Interfaces:**
- Consumes: 2026-08-02/03 外置 Chrome 中 Remix VM 的已观察结果。
- Produces: 周六作业的可追踪源码、教学说明、真实本地 VM 证据和独立状态表。

- [ ] **Step 1: 先写失败的结构测试**

在 `scripts/__tests__/monorepo-layout.test.mjs` 新增：

```js
test("keeps Saturday and Sunday Web3 homework isolated", async () => {
	for (const required of [
		"homeworks/05-web3-remix/contracts/SimpleBank.sol",
		"homeworks/05-web3-remix/contracts/RedPacket.sol",
		"homeworks/05-web3-remix/README.md",
		"docs/qa/web3-saturday-contracts.md",
	]) {
		assert.equal(await exists(required), true, `${required} must exist`);
	}
	assert.equal(await exists("apps/web/src/features/web3"), false);
});
```

- [ ] **Step 2: 运行测试并确认红灯**

Run: `node --test scripts/__tests__/monorepo-layout.test.mjs`

Expected: FAIL，指出 `homeworks/05-web3-remix/contracts/SimpleBank.sol must exist`。

- [ ] **Step 3: 保存 Remix 已验证源码并添加必要教学注释**

`SimpleBank.sol` 保持已验证接口：`deposit()`、`getBalance()`、`withdraw(uint256)`；提款顺序必须先扣内部余额再外部转账，并解释这是 Checks-Effects-Interactions。

`RedPacket.sol` 保持已验证接口和构造参数：`constructor(uint256 c, bool _isEqual) payable`、`getBalance()`、`grabRedPacket()`、`refund()`；注释必须解释：

```solidity
// 先写入领取标记并扣减份数，再发送 ETH，避免外部调用重入后重复领取。
isGrabbed[msg.sender] = true;
count--;
totalAmount -= amount;
```

不得宣称 `block.timestamp` 加地址哈希是安全随机数；README 明确它只适合课程演示，不适合有真实价值的红包。

- [ ] **Step 4: 写入真实验收记录**

`docs/qa/web3-saturday-contracts.md` 必须记录：

- Remix 2.5.3，Remix VM，Osaka，浏览器为外置 Chrome。
- `SimpleBank`：部署后存入 1 ETH，读取 `1000000000000000000` wei，取出 0.4 ETH，最终内部余额与合约余额均为 0.6 ETH。
- `RedPacket`：构造参数 `c=2`、`_isEqual=true`、部署价值 2 ETH；Account 2 和 Account 3 各领取 1 ETH；最终 `count=0`、合约余额 0 ETH。
- 成功交易后 Remix 录得 3 次重复领取尝试，均以 `count must > 0` 回滚且没有改变最终状态；如实记录自动化交互异常，不隐藏它。
- 页面可见的短地址：SimpleBank `0xD4F...2cbee`，RedPacket `0x332...D4B6D`；这些是临时 Remix VM 地址，不是 Sepolia 证据。
- `refund()` 的 24 小时到期分支未等待实时时间验证，标记为未覆盖，不伪造完成。

- [ ] **Step 5: 更新作业状态和设计状态**

在 `HOMEWORKS.md` 新增 Web3 里程碑表：周六源码/编译 ✅、周六 Remix VM 部署/交互 ✅、周日本地实现 ⏳、Sepolia 部署 ⏳、Etherscan 验证 ⏳、前端可视验收 ⏳。

把设计文档状态改为“用户已确认，进入实现”，并把第 10 节过时的“Deployed Contracts = 0”替换为本次真实 Remix VM 观察结果。

- [ ] **Step 6: 运行测试并确认绿灯**

Run: `node --test scripts/__tests__/monorepo-layout.test.mjs`

Expected: PASS；随后运行 `git diff --check`，Expected: 无输出。

- [ ] **Step 7: 提交**

```bash
git add HOMEWORKS.md docs/qa/web3-saturday-contracts.md docs/superpowers/specs/2026-08-02-web3-onchain-notebook-design.md homeworks/05-web3-remix scripts/__tests__/monorepo-layout.test.mjs
git commit -m "docs: archive Saturday Web3 contract acceptance"
```

---

### Task 2: 建立独立 Web3 工作区与密钥边界

**Files:**
- Create: `homeworks/06-web3-dapp/package.json`
- Create: `homeworks/06-web3-dapp/contracts/package.json`
- Create: `homeworks/06-web3-dapp/contracts/tsconfig.json`
- Create: `homeworks/06-web3-dapp/web/package.json`
- Create: `homeworks/06-web3-dapp/web/tsconfig.json`
- Create: `homeworks/06-web3-dapp/web/tsconfig.app.json`
- Create: `homeworks/06-web3-dapp/web/tsconfig.node.json`
- Create: `homeworks/06-web3-dapp/web/.env.example`
- Modify: `pnpm-workspace.yaml`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `scripts/__tests__/monorepo-layout.test.mjs`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: 根 pnpm 工作区和 Biome 约定。
- Produces: `@course-homework/web3-contracts`、`@course-homework/web3-web` 两个独立包和根 `web3:*` 命令。

- [ ] **Step 1: 写失败的工作区结构测试**

测试读取根 `package.json` 与 `pnpm-workspace.yaml`，断言：

```js
assert.match(workspace, /homeworks\/\*\/\*/);
for (const script of [
	"web3:check",
	"web3:test",
	"web3:typecheck",
	"web3:build",
]) {
	assert.equal(typeof rootPackage.scripts[script], "string");
}
for (const localPath of [
	"homeworks/06-web3-dapp/contracts/.hardhat-keystore.json",
	"homeworks/06-web3-dapp/contracts/cache",
	"homeworks/06-web3-dapp/contracts/ignition/deployments",
	"homeworks/06-web3-dapp/web/.env.local",
]) {
	assert.equal(await isIgnored(localPath), true, `${localPath} must be ignored`);
}
```

- [ ] **Step 2: 运行测试并确认红灯**

Run: `node --test scripts/__tests__/monorepo-layout.test.mjs`

Expected: FAIL，缺少 `homeworks/*/*` 或 `web3:check`。

- [ ] **Step 3: 创建包清单与聚合命令**

`contracts/package.json` 固定主要开发依赖：

```json
{
	"name": "@course-homework/web3-contracts",
	"private": true,
	"type": "module",
	"scripts": {
		"check": "biome check hardhat.config.ts ignition test",
		"compile": "hardhat compile",
		"test": "hardhat test",
		"typecheck": "tsc --noEmit",
		"build": "hardhat compile",
		"deploy:sepolia": "hardhat ignition deploy ignition/modules/OnchainNotebook.ts --network sepolia",
		"deploy:verify:sepolia": "hardhat ignition deploy ignition/modules/OnchainNotebook.ts --network sepolia --verify"
	},
	"devDependencies": {
		"@biomejs/biome": "^2.5.6",
		"@nomicfoundation/hardhat-toolbox-viem": "5.0.7",
		"@types/node": "catalog:",
		"hardhat": "3.12.0",
		"typescript": "catalog:",
		"viem": "2.55.10"
	}
}
```

`web/package.json` 固定 `react`/`react-dom` 为 `catalog:`，并使用 `wagmi 3.7.5`、`viem 2.55.10`、`@tanstack/react-query 5.101.4`、Vite 8.2.0、Vitest 4.1.10、Testing Library 16.3.2 和 jsdom 30.0.1。

根 `package.json` 的四条命令分别按 contracts → web 顺序执行，不并行隐藏失败：

```json
"web3:check": "pnpm --filter @course-homework/web3-contracts check && pnpm --filter @course-homework/web3-web check",
"web3:test": "pnpm --filter @course-homework/web3-contracts test && pnpm --filter @course-homework/web3-web test",
"web3:typecheck": "pnpm --filter @course-homework/web3-contracts typecheck && pnpm --filter @course-homework/web3-web typecheck",
"web3:build": "pnpm --filter @course-homework/web3-contracts build && pnpm --filter @course-homework/web3-web build"
```

- [ ] **Step 4: 强化忽略规则**

忽略 Hardhat keystore、`cache/`、`ignition/deployments/`、前端 `.env.local`，但保留 `.env.example`。不得忽略合约源码、Ignition module 或 QA 文档。

- [ ] **Step 5: 安装并验证结构**

Run: `pnpm install`

Expected: lockfile 只在仓库根更新，无嵌套 lockfile。

Run: `node --test scripts/__tests__/monorepo-layout.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add .gitignore package.json pnpm-workspace.yaml pnpm-lock.yaml scripts/__tests__/monorepo-layout.test.mjs homeworks/06-web3-dapp
git commit -m "chore: scaffold isolated Web3 homework"
```

---

### Task 3: 用测试驱动实现 OnchainNotebook 合约

**Files:**
- Create: `homeworks/06-web3-dapp/contracts/contracts/OnchainNotebook.sol`
- Create: `homeworks/06-web3-dapp/contracts/test/OnchainNotebook.ts`
- Create: `homeworks/06-web3-dapp/contracts/hardhat.config.ts`

**Interfaces:**
- Consumes: Hardhat 3 + Viem 测试运行时。
- Produces: `getNote(address) -> string`、`setNote(string)`、`clearNote()` 和三种 ABI 事件/错误定义。

- [ ] **Step 1: 写失败的合约行为测试**

测试使用 Node test runner 与 Hardhat 3：

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("OnchainNotebook", async () => {
	const { viem } = await network.connect();
	const [author, reader] = await viem.getWalletClients();

	it("starts empty and isolates notes by wallet", async () => {
		const notebook = await viem.deployContract("OnchainNotebook");
		assert.equal(await notebook.read.getNote([author.account.address]), "");
		await notebook.write.setNote(["author note"], { account: author.account });
		assert.equal(
			await notebook.read.getNote([reader.account.address]),
			"",
		);
	});
});
```

在同一文件补齐精确用例：写入、覆盖、清空、`NoteUpdated` 参数、`NoteCleared` 参数、280 个 ASCII 字节成功、281 个 ASCII 字节以 `NoteTooLong(281, 280)` 回滚、70 个四字节 emoji 成功、71 个四字节 emoji 回滚。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `pnpm --filter @course-homework/web3-contracts test`

Expected: FAIL，找不到 `OnchainNotebook` artifact。

- [ ] **Step 3: 实现最小合约**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract OnchainNotebook {
    uint256 private constant MAX_NOTE_BYTES = 280;
    mapping(address author => string note) private notes;

    error NoteTooLong(uint256 actualLength, uint256 maximumLength);

    event NoteUpdated(address indexed author, string note);
    event NoteCleared(address indexed author);

    function getNote(address author) external view returns (string memory) {
        return notes[author];
    }

    function setNote(string calldata note) external {
        uint256 noteLength = bytes(note).length;
        // Solidity 的 bytes 长度对应 UTF-8 字节数，与前端 TextEncoder 保持一致。
        if (noteLength > MAX_NOTE_BYTES) {
            revert NoteTooLong(noteLength, MAX_NOTE_BYTES);
        }
        notes[msg.sender] = note;
        emit NoteUpdated(msg.sender, note);
    }

    function clearNote() external {
        delete notes[msg.sender];
        emit NoteCleared(msg.sender);
    }
}
```

- [ ] **Step 4: 固定编译设置**

`hardhat.config.ts` 使用 `toolboxViem` 插件，Solidity 0.8.28，optimizer enabled，runs 200。此任务只配置本地编译；Sepolia 与 verify 在 Task 4 加入。

- [ ] **Step 5: 运行合约测试和类型检查**

Run: `pnpm --filter @course-homework/web3-contracts test`

Expected: 所有边界、隔离和事件测试 PASS。

Run: `pnpm --filter @course-homework/web3-contracts typecheck`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add homeworks/06-web3-dapp/contracts
git commit -m "feat: add onchain notebook contract"
```

---

### Task 4: 配置 Ignition、Sepolia 和开源验证

**Files:**
- Create: `homeworks/06-web3-dapp/contracts/ignition/modules/OnchainNotebook.ts`
- Create: `homeworks/06-web3-dapp/contracts/test/ignition-module.test.ts`
- Modify: `homeworks/06-web3-dapp/contracts/hardhat.config.ts`
- Create: `homeworks/06-web3-dapp/README.md`

**Interfaces:**
- Consumes: `OnchainNotebook` 无构造参数。
- Produces: `OnchainNotebookModule`，Sepolia 部署与 `--verify` 命令，三个 keystore 变量名。

- [ ] **Step 1: 写失败的部署模块结构测试**

结构测试必须断言 module 导出 `OnchainNotebookModule` 且只部署 `OnchainNotebook`，README 必须出现三个变量名和两条部署命令，不得出现真实 URL、私钥或 API key。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `pnpm --filter @course-homework/web3-contracts test`

Expected: FAIL，部署 module 或 README 不存在。

- [ ] **Step 3: 创建 Ignition module**

```ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OnchainNotebookModule", (module) => {
	const notebook = module.contract("OnchainNotebook");
	return { notebook };
});
```

- [ ] **Step 4: 加入 Sepolia 与 Etherscan V2 配置**

`hardhat.config.ts` 使用：

```ts
sepolia: {
	type: "http",
	chainType: "l1",
	url: configVariable("SEPOLIA_RPC_URL"),
	accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
},
verify: {
	etherscan: { apiKey: configVariable("ETHERSCAN_API_KEY") },
},
```

三个值必须通过 `pnpm --filter @course-homework/web3-contracts exec hardhat keystore set <NAME>` 交互输入。README 只写变量名，不写值；说明 Etherscan 已使用统一 V2 API。

- [ ] **Step 5: 验证本地配置不读取秘密**

Run: `pnpm --filter @course-homework/web3-contracts compile`

Expected: 无需 Sepolia 凭据即可本地编译 PASS。

Run: `git grep -nE "(private.?key|api.?key|rpc.?url).*=.{12,}" -- ':!pnpm-lock.yaml'`

Expected: 只允许文档中的变量名或空示例，不得出现秘密值。

- [ ] **Step 6: 提交**

```bash
git add homeworks/06-web3-dapp
git commit -m "feat: configure Sepolia notebook deployment"
```

---

### Task 5: 实现前端合约配置、UTF-8 边界和错误归类

**Files:**
- Create: `homeworks/06-web3-dapp/web/index.html`
- Create: `homeworks/06-web3-dapp/web/vite.config.ts`
- Create: `homeworks/06-web3-dapp/web/src/vite-env.d.ts`
- Create: `homeworks/06-web3-dapp/web/src/contracts/onchainNotebook.ts`
- Create: `homeworks/06-web3-dapp/web/src/lib/noteBytes.ts`
- Create: `homeworks/06-web3-dapp/web/src/lib/noteBytes.test.ts`
- Create: `homeworks/06-web3-dapp/web/src/lib/walletError.ts`
- Create: `homeworks/06-web3-dapp/web/src/lib/walletError.test.ts`
- Create: `homeworks/06-web3-dapp/web/src/test/setup.ts`

**Interfaces:**
- Produces: `NOTE_BYTE_LIMIT = 280`、`getNoteByteLength(note): number`、`isNoteWithinLimit(note): boolean`、`toWalletMessage(error): string`、类型推断 ABI 和 `notebookAddress`。

- [ ] **Step 1: 写纯函数失败测试**

```ts
expect(getNoteByteLength("a".repeat(280))).toBe(280);
expect(getNoteByteLength("😀".repeat(70))).toBe(280);
expect(isNoteWithinLimit("😀".repeat(71))).toBe(false);
expect(toWalletMessage({ code: 4001 })).toBe("你取消了钱包操作，草稿仍然保留。");
```

错误测试还必须覆盖未安装钱包、用户拒绝、链切换失败、RPC 失败、合约回滚和未知错误；输出不得包含原始堆栈。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `pnpm --filter @course-homework/web3-web test -- noteBytes walletError`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 UTF-8 边界与错误归类**

```ts
export const NOTE_BYTE_LIMIT = 280;
const encoder = new TextEncoder();

export function getNoteByteLength(note: string) {
	return encoder.encode(note).byteLength;
}

export function isNoteWithinLimit(note: string) {
	return getNoteByteLength(note) <= NOTE_BYTE_LIMIT;
}
```

`walletError.ts` 使用守卫读取 `code`/`shortMessage`，只映射为用户可理解中文，不暴露 provider 原始对象。

- [ ] **Step 4: 导出最小 ABI 并验证公开地址**

`onchainNotebook.ts` 使用 `parseAbi` 定义设计中的全部错误、事件和函数。生产构建读取 `VITE_ONCHAIN_NOTEBOOK_ADDRESS` 并用 Viem `isAddress` 验证；缺失或非法时抛出明确构建错误，不回退零地址。

`src/test/setup.ts` 在测试模块加载前用 `vi.stubEnv` 注入仅用于测试的合法地址 `0x0000000000000000000000000000000000000001`；它不得用于开发、生产构建或 QA 证据。`vite.config.ts` 在 `command === "build"` 时校验真实环境值，因此测试地址不会绕过生产构建安全门。

- [ ] **Step 5: 运行单元测试和类型检查**

Run: `pnpm --filter @course-homework/web3-web test -- noteBytes walletError`

Expected: PASS。

Run: `pnpm --filter @course-homework/web3-web typecheck`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add homeworks/06-web3-dapp/web
git commit -m "feat: add notebook frontend contracts"
```

---

### Task 6: 用 wagmi 组合钱包与笔记交易状态

**Files:**
- Create: `homeworks/06-web3-dapp/web/src/config/wagmi.ts`
- Create: `homeworks/06-web3-dapp/web/src/config/providers.tsx`
- Create: `homeworks/06-web3-dapp/web/src/features/notebook/useNotebook.ts`
- Create: `homeworks/06-web3-dapp/web/src/features/notebook/useNotebook.test.tsx`

**Interfaces:**
- Consumes: `notebookAddress`、`onchainNotebookAbi`、Sepolia、当前 wagmi account。
- Produces: `useNotebook()`，返回 `walletState`、`chainNote`、`draft` 控制、`save()`、`clear()`、`retryRead()`、`transactionHash`、`phase` 和 `message`。

- [ ] **Step 1: 写失败的 hook 状态测试**

使用 Vitest mock wagmi hooks，覆盖：

- 未安装 connector → `walletState = "missing"`。
- 未连接 → 不启用 `getNote` 查询。
- chainId 非 11155111 → `walletState = "wrong-network"`，`save`/`clear` 不可用。
- 读取失败 → `phase = "read-error"`，不能伪装为空字符串。
- `writeContractAsync` 返回 hash 后 → `phase = "confirming"`。
- receipt success 后 → invalidate `getNote` query，再显示 success。
- 用户拒绝签名 → 草稿保持不变并显示归类后的消息。
- pending 期间再次保存 → 不再发第二笔交易。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `pnpm --filter @course-homework/web3-web test -- useNotebook`

Expected: FAIL，hook 不存在。

- [ ] **Step 3: 配置 wagmi Provider**

`wagmi.ts` 只使用 `sepolia`、`http()` 和 `injected({ target: "metaMask" })`；`providers.tsx` 只组合 `WagmiProvider` 与 `QueryClientProvider`，不加入服务端渲染或 WalletConnect。

- [ ] **Step 4: 实现读写状态机**

`useNotebook` 使用 `useAccount`、`useReadContract`、`useSimulateContract`、`useWriteContract`、`useWaitForTransactionReceipt`、`useSwitchChain` 与 `useQueryClient`。必须等 receipt 成功后再 invalidate 读取：

```ts
// 钱包返回 hash 只代表交易已广播；收到 receipt 后才能说“已保存”。
if (receipt.isSuccess) {
	await queryClient.invalidateQueries({ queryKey: readQueryKey });
}
```

清空必须调用 `clearNote`，不得把空字符串交给 `setNote` 冒充清空事件。

- [ ] **Step 5: 运行 hook 测试与类型检查**

Run: `pnpm --filter @course-homework/web3-web test -- useNotebook`

Expected: PASS。

Run: `pnpm --filter @course-homework/web3-web typecheck`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add homeworks/06-web3-dapp/web/src
git commit -m "feat: connect notebook with wagmi"
```

---

### Task 7: 构建学习型 DApp 页面与组件测试

**Files:**
- Create: `homeworks/06-web3-dapp/web/src/main.tsx`
- Create: `homeworks/06-web3-dapp/web/src/App.tsx`
- Create: `homeworks/06-web3-dapp/web/src/styles.css`
- Create: `homeworks/06-web3-dapp/web/src/components/WalletPanel.tsx`
- Create: `homeworks/06-web3-dapp/web/src/features/notebook/NotebookPage.tsx`
- Create: `homeworks/06-web3-dapp/web/src/features/notebook/NotebookPage.test.tsx`

**Interfaces:**
- Consumes: `useNotebook()`。
- Produces: 单栏 Sepolia 学习页面，支持连接、切网、读取、保存、清空、错误恢复与 Etherscan 交易链接。

- [ ] **Step 1: 写失败的页面状态测试**

组件测试 mock `useNotebook`，断言：

- 顶部始终显示“Sepolia 测试网”和“测试币没有真实价值”。
- 未安装钱包显示 MetaMask 安装说明。
- 未连接显示“连接 MetaMask”，不显示伪链上内容。
- 错误网络显示“切换到 Sepolia”，保存与清空禁用。
- 读取成功显示链上当前值和编辑框。
- 计数器以“280 / 280 字节”显示边界，281 字节禁用保存。
- 等待签名与确认中分别显示不同文案，且禁用重复提交。
- 成功后显示 `https://sepolia.etherscan.io/tx/<hash>`。
- 失败保留草稿并显示重试按钮。
- 点击清空先出现确认语义，再调用 `clear()`。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `pnpm --filter @course-homework/web3-web test -- NotebookPage`

Expected: FAIL，页面不存在。

- [ ] **Step 3: 实现钱包与记事本组件**

`WalletPanel` 只负责钱包安装、连接、缩略地址、网络和切换按钮。`NotebookPage` 负责草稿、当前链上值、字节计数、操作按钮和阶段消息。交互阶段使用可访问的 `aria-live="polite"`，错误使用 `role="alert"`。

- [ ] **Step 4: 实现样式**

采用响应式单栏卡片；核心按钮在 320px 宽度仍可见。颜色不得作为状态唯一信息，focus 样式清晰，文本对比度至少满足 WCAG AA。不要引入动画库、Tailwind 或组件库。

- [ ] **Step 5: 运行前端测试、检查和类型检查**

Run: `pnpm --filter @course-homework/web3-web test`

Expected: PASS。

Run: `pnpm --filter @course-homework/web3-web check`

Expected: PASS。

Run: `pnpm --filter @course-homework/web3-web typecheck`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add homeworks/06-web3-dapp/web
git commit -m "feat: add Sepolia notebook interface"
```

---

### Task 8: 完成本地文档、聚合验证与外置 Chrome 验收准备

**Files:**
- Modify: `homeworks/06-web3-dapp/README.md`
- Create: `docs/qa/web3-onchain-notebook.md`
- Modify: `HOMEWORKS.md`
- Modify: `scripts/__tests__/monorepo-layout.test.mjs`

**Interfaces:**
- Produces: 可复现的本地命令、秘密边界、部署/销毁说明、状态证据和最终验收清单。

- [ ] **Step 1: 写失败的文档结构测试**

断言 README 包含 `pnpm web3:test`、`pnpm web3:typecheck`、`pnpm web3:build`、三个 keystore 变量名、Sepolia chain ID、Etherscan URL、公开地址变量名、Ignition 部署与验证命令；断言 QA 文档有本地/链上分离的状态表。

- [ ] **Step 2: 运行测试并确认红灯**

Run: `node --test scripts/__tests__/monorepo-layout.test.mjs`

Expected: FAIL，QA 或 README 片段缺失。

- [ ] **Step 3: 写 README 与 QA 清单**

README 解释“合约是后端”“call 不花 Gas，write 需要签名和测试 ETH”“ABI 是前端与合约的共同语言”。QA 明确：本地实现通过不等于 Sepolia 已部署，Sepolia 已部署不等于 Etherscan 已验证。

- [ ] **Step 4: 运行无秘密的本地验证**

Run: `pnpm web3:check`

Expected: PASS。

Run: `pnpm web3:test`

Expected: PASS。

Run: `pnpm web3:typecheck`

Expected: PASS。

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: 既有项目回归 PASS。`pnpm web3:build` 在尚未提供真实公开合约地址时必须明确失败，这是设计中的安全门，不得用零地址绕过。

- [ ] **Step 5: 提交本地实现证据**

```bash
git add HOMEWORKS.md docs/qa/web3-onchain-notebook.md homeworks/06-web3-dapp scripts/__tests__/monorepo-layout.test.mjs
git commit -m "docs: record local Web3 homework verification"
```

---

### Task 9: 部署 Sepolia、开源验证并完成真实前端交互

**Files:**
- Modify: `homeworks/06-web3-dapp/web/.env.local`（本机忽略，仅公开合约地址）
- Modify: `docs/qa/web3-onchain-notebook.md`
- Modify: `HOMEWORKS.md`

**Interfaces:**
- Consumes: 专用 MetaMask Sepolia 测试账户、少量 Sepolia ETH、Hardhat keystore 三项凭据。
- Produces: 合约地址、部署交易哈希、区块号、UTC 时间、已验证源码链接、读写/清空交易链接和可视验收结果。

- [ ] **Step 1: 在外置 Chrome 核对测试账户与余额**

每次点击前说明目的、位置和预期结果。确认当前 MetaMask 是专用测试账户、网络为 Sepolia；只在余额不足时打开可信水龙头。任何领水签名或账户暴露动作由用户确认。

- [ ] **Step 2: 交互式写入 Hardhat keystore**

使用 Hardhat 自带交互提示依次设置 `SEPOLIA_RPC_URL`、`SEPOLIA_PRIVATE_KEY`、`ETHERSCAN_API_KEY`。秘密不经过命令参数、聊天、剪贴板读取、截图或日志；Touch ID/设备密码交给用户完成。

- [ ] **Step 3: 部署前最终安全检查并请求确认**

Run: `pnpm web3:check && pnpm web3:test && pnpm web3:typecheck`

Expected: PASS。

显示将使用的公开钱包地址、Sepolia 网络、估算 Gas 和最大可接受测试 ETH 消耗；在执行下一条真实部署交易前请求用户明确确认。

- [ ] **Step 4: 用 Ignition 部署并同时验证**

Run: `pnpm --filter @course-homework/web3-contracts deploy:verify:sepolia`

Expected: Ignition 返回 `OnchainNotebookModule#OnchainNotebook` 地址；Etherscan verify 成功。若部署成功但验证失败，不重复部署，使用现有地址执行 `hardhat verify --network sepolia <address>`。

- [ ] **Step 5: 配置公开地址并完成生产构建**

把公开合约地址写入忽略的 `web/.env.local`：

```dotenv
VITE_ONCHAIN_NOTEBOOK_ADDRESS=0x实际部署地址
```

Run: `pnpm web3:build`

Expected: 合约和前端构建 PASS，构建产物包含公开地址但不包含任何私钥、RPC 凭据或 API key。

- [ ] **Step 6: 在外置 Chrome 完成真实闭环**

逐步验证：连接专用账户 → 错网提示/切换 → 读取 → 保存 → MetaMask 确认 → 等 receipt → 显示 hash → 刷新恢复 → 覆盖同一地址 → 清空 → 刷新为空。每个真实签名动作都在最终点击前再次解释并确认。

- [ ] **Step 7: 核对 Etherscan 证据**

必须看到：合约地址有 bytecode、部署交易成功、Contract 页源码已验证且 ABI 可读、至少一笔 `setNote` 和一笔 `clearNote` 交易。只记录公开地址、hash、区块号、UTC 时间和链接。

- [ ] **Step 8: 更新状态并提交最终证据**

只有对应证据真实存在时，才把 `HOMEWORKS.md` 的周日本地实现、Sepolia 部署、Etherscan 验证、前端可视验收分别改为 ✅。

Run: `pnpm web3:check && pnpm web3:test && pnpm web3:typecheck && pnpm web3:build`

Expected: 全部 PASS。

```bash
git add HOMEWORKS.md docs/qa/web3-onchain-notebook.md
git commit -m "docs: record Sepolia notebook acceptance"
```

不要推送；保留分支供用户审阅。
