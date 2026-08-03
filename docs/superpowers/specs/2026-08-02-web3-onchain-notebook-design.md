# Web3 链上记事本 DApp 设计

**日期：** 2026-08-02

**状态：** 已完成方案讨论，等待书面确认

**作业范围：** 周日作业“开发人生的第一个 DApp”；周六私人银行与 ETH 红包只整理独立验收证据，不与本项目代码混放

## 1. 目标与完成标准

在 `homeworks/06-web3-dapp` 下完成一个可独立运行的链上记事本：用户通过 MetaMask 连接 Sepolia 测试网，读取自己钱包地址对应的公开笔记，签名交易以保存、修改或清空笔记，并能在刷新页面后从链上重新读取。

作业只有同时满足以下条件才算完成：

1. Vite + React + TypeScript 前端可本地启动。
2. 前端使用 wagmi 与 MetaMask 连接，不在页面或仓库保存私钥。
3. Solidity 合约由 Hardhat 3 开发并通过自动化测试。
4. 合约部署至 Sepolia，并记录部署地址和交易哈希。
5. 合约源码在 Sepolia Etherscan 完成开源验证。
6. 前端完成连接钱包、切换网络、读笔记、写笔记、清空笔记、等待交易确认和刷新恢复。
7. QA 文档记录可复现步骤、Etherscan 链接和截图位置，但不记录私钥、助记词、RPC 密钥或 API 密钥。

课程学习笔记明确要求 Vite + React、wagmi、Hardhat、Sepolia、水龙头、开源验证与前后端交互；本设计全部覆盖。RainbowKit/ConnectKit 在原始作业中属于推荐工具，因此首版采用 wagmi 原生连接器，避免为单钱包教学项目增加 WalletConnect 项目 ID 和额外 UI 依赖。

## 2. 目录边界

Web3 作业拥有独立目录，不修改现有 GitHub Profile、Go 或模型训练功能：

```text
homeworks/06-web3-dapp/
├── README.md                 # 学习路径、本地运行、部署、验证与验收说明
├── package.json              # Web3 作业自己的聚合命令
├── contracts/               # Hardhat 3 合约工程
│   ├── contracts/
│   ├── ignition/modules/
│   ├── test/
│   ├── hardhat.config.ts
│   └── package.json
└── web/                     # Vite + React + TypeScript + wagmi 前端
    ├── src/
    ├── package.json
    └── vite.config.ts
```

根工作区只增加 `homeworks/*/*` 的 pnpm workspace 匹配和 Web3 聚合验证命令，不把 Web3 代码塞进已有 `apps/web`。这样课程作业可以单独启动、测试和提交证据，也不会改变现有应用的运行时。

## 3. 方案选择

### 采用方案：每个钱包一条公开笔记

合约使用 `mapping(address => string)` 保存笔记。`msg.sender` 只能修改或清空自己地址对应的值，任何人都可以按地址读取公开内容。

选择原因：

- 能完整展示链上持久化、钱包身份、读操作与写交易。
- 权限模型简单、可解释、容易测试，不需要管理员。
- 比“全站只有一条共享笔记”更能体现 `msg.sender`。
- 比“多条笔记数组 + 索引 + 删除洞位”更符合第一次 DApp 的最小范围。

未采用方案：

- **全局共享单笔记：** 最简单，但任意用户会覆盖别人内容，无法体现地址隔离。
- **每人多笔记 CRUD：** 功能更完整，但需要 ID、数组/映射组合、分页和更多 Gas，不符合本次 YAGNI 范围。

## 4. 智能合约设计

合约名为 `OnchainNotebook`，Solidity 版本固定为 `0.8.28`，与当前 Hardhat 3/Etherscan 官方示例兼容。

公开接口：

```solidity
error NoteTooLong(uint256 actualLength, uint256 maximumLength);

event NoteUpdated(address indexed author, string note);
event NoteCleared(address indexed author);

function getNote(address author) external view returns (string memory);
function setNote(string calldata note) external;
function clearNote() external;
```

规则：

- 每个地址最多保存一条笔记。
- `setNote` 接受空字符串以保持 ABI 简单，但前端清空操作必须调用 `clearNote`，从而产生语义明确的事件。
- 笔记最大长度为 UTF-8 编码后的 280 字节，而不是 280 个 JavaScript 字符；合约通过 `bytes(note).length` 强制执行。
- 超长时使用自定义错误 `NoteTooLong(actualLength, 280)` 回滚。
- `setNote` 成功后发出 `NoteUpdated(msg.sender, note)`。
- `clearNote` 删除调用者的映射值并发出 `NoteCleared(msg.sender)`。
- 合约不接收 ETH、不实现 owner、不提供管理员后门，也不升级。

测试至少覆盖：初始值为空、地址间隔离、写入和覆盖、清空、事件内容、280 字节边界成功、281 字节回滚，以及多字节字符按 UTF-8 字节数计算。

## 5. 部署与密钥边界

部署使用 Hardhat 3 + Ignition。Sepolia 配置通过 Hardhat `configVariable` 读取：

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`
- `ETHERSCAN_API_KEY`

这些值存入 Hardhat 的本机加密 keystore；不写入 `.env`、终端命令参数、聊天、截图、日志或 Git。部署账户必须是用户已经确认的 MetaMask 专用 Sepolia 测试账户，不使用主钱包。

部署流程：

1. 在 MetaMask 确认测试账户和 Sepolia 网络。
2. 通过官方/可信水龙头领取只够部署与测试的 Sepolia ETH。
3. 本地编译和测试全部通过后，用 Ignition 部署。
4. 记录合约地址、部署交易哈希、区块号与 UTC 时间。
5. 使用 Hardhat verify 插件提交完全一致的源码和编译设置。
6. 只有 Etherscan `Contract` 页显示源码已验证，才把“开源验证”标记为完成。

任何需要 MetaMask 签名、输入设备密码、读取剪贴板秘密或创建外部凭据的步骤，都在最终动作前由用户明确确认或亲自完成。

## 6. 前端架构

前端采用纯客户端渲染（CSR），因为钱包对象只存在于浏览器。CSR 不等于保密：打包后的 ABI、合约地址和界面代码都公开；真正的权限由合约中的 `msg.sender` 保证。

核心模块：

- `config/wagmi.ts`：只配置 Sepolia、HTTP transport 和 injected/MetaMask 连接器。
- `contracts/onchainNotebook.ts`：导出经过 TypeScript 推断的 ABI、Sepolia 地址和字节上限。
- `features/notebook/useNotebook.ts`：组合 wagmi 读取、模拟写入、发送交易、等待回执和刷新缓存。
- `features/notebook/NotebookPage.tsx`：仅负责页面状态与用户操作。
- `components/WalletPanel.tsx`：连接、断开、地址显示和网络切换。
- `lib/noteBytes.ts`：使用 `TextEncoder` 计算 UTF-8 字节数，和合约规则保持一致。

数据流：

```text
MetaMask 连接
  → 校验 chainId = Sepolia
  → useReadContract(getNote, 当前地址)
  → 用户编辑本地草稿
  → simulateContract(setNote/clearNote)
  → MetaMask 展示并签名交易
  → useWaitForTransactionReceipt 等待确认
  → 使 getNote 查询失效并从链上重新读取
```

页面状态必须明确区分：未安装钱包、未连接、网络错误、读取中、可编辑、等待签名、链上确认中、成功和失败。交易哈希出现后提供 Sepolia Etherscan 链接。

## 7. 界面与交互

页面采用单栏学习型布局，核心操作始终可见：

1. 顶部说明这是 Sepolia 测试网，测试币没有真实价值。
2. 钱包卡片显示连接状态、缩略地址、网络和“连接/切换网络”按钮。
3. 记事本卡片显示链上当前值与可编辑文本框。
4. 计数器同时显示“字节数 / 280”和直观说明；超限时禁止提交。
5. “保存到链上”触发 MetaMask 签名；“清空链上笔记”是独立且有确认语义的操作。
6. 写入过程中禁用重复提交，但不遮挡当前笔记。
7. 成功后显示交易已确认以及 Etherscan 链接；失败时保留草稿供用户重试。

不加入后端数据库、登录系统、服务端 Token、富文本、图片上传、共享编辑或主网支持。

## 8. 错误处理

- **未安装 MetaMask：** 显示安装说明，不尝试写交易。
- **拒绝连接/签名：** 转换为可理解提示，保留草稿，不把钱包原始错误堆栈直接展示给用户。
- **网络不正确：** 只允许请求切换到 Sepolia；未切换前禁止合约写入。
- **RPC 读取失败：** 显示重试按钮；不把失败误显示为空笔记。
- **字节超限：** 前端提前阻止，合约再次强制校验，形成双重边界。
- **交易回滚或确认失败：** 显示失败阶段和可重试操作；不提前显示“已保存”。
- **合约地址未配置：** 构建阶段失败，而不是运行时连接零地址。

## 9. 测试与验收

自动化分层：

- 合约：Hardhat Solidity/TypeScript 测试验证真实合约行为和事件。
- 前端单元测试：字节计数、错误归类和视图状态。
- 前端组件测试：未连接、错误网络、读成功、写入等待、确认成功与失败恢复。
- 结构测试：确保 Web3 目录独立、密钥文件被忽略、README 和部署模块齐全。
- 聚合验证：`pnpm web3:check`、`pnpm web3:test`、`pnpm web3:typecheck`、`pnpm web3:build`。

本地可视验收使用 Codex 内置浏览器打开 Vite 页面，逐步验证：

1. 未连接状态不会读取伪数据。
2. MetaMask 连接的是专用测试账户。
3. 错误网络会要求切换 Sepolia。
4. 连接后能读取当前链上笔记。
5. 保存后等待真实交易确认并显示哈希。
6. 刷新页面后值仍从链上恢复。
7. 再次保存会覆盖同一地址的笔记，而不是增加数据库行。
8. 清空后刷新仍为空。
9. Etherscan 能查看部署交易、交互交易和已验证源码。

## 10. 作业状态记录

`HOMEWORKS.md` 将新增独立 Web3 里程碑，并分别记录：

- 周六合约源码/编译证据
- 周六部署/交互证据
- 周日本地实现
- 周日 Sepolia 部署
- 周日 Etherscan 开源验证
- 周日前端可视交互验收

当前周六 Remix 页面已经重新编译 `SimpleBank.sol` 与 `RedPacket.sol`，编译产物存在；但当前 Remix 的 `Deployed Contracts = 0`，因此历史部署不能由当前页面证明。状态必须如实写成“源码与编译已验证，部署证据待补”，不能因为曾经操作过就标记部署完成。

## 11. 参考依据

- 本地课程笔记：`09-Web3与智能合约/33-智能合约设计2/作业-链上记事本DApp.md`
- [Hardhat 3 官方文档](https://hardhat.org/)
- [wagmi 官方文档](https://wagmi.sh/)
- [viem Chains 官方文档](https://viem.sh/docs/chains/introduction)
- [Etherscan：使用 Hardhat 验证合约](https://docs.etherscan.io/contract-verification/verify-with-hardhat)
