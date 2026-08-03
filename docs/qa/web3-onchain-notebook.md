# BabySteps 链上记事本验收记录

## 状态

| 验收项 | 状态 | 证据 |
|---|---|---|
| P0 本地链上便签实现 | ✅ | 合约、wagmi hook 与页面测试通过；280 UTF-8 字节限制、覆盖保存和清空当前值已实现 |
| P1 本地 BabySteps 实现 | ✅ | 三类活动、UTC+8 每日限制、成长星、四阶段星宝和独立活动界面已实现 |
| P1 本地可转积分实现 | ✅ | 双账本、直接赠送、余额读取、交易状态和赠送页面已通过专项测试 |
| 本地自动化验证 | ✅ | Web3 合约 27 项、前端 121 项；仓库结构 20 项、API 31 项、Web 23 项及 Go 全包测试通过 |
| 本地可视验收 | ✅ | 外置 Chrome + MetaMask 连接 Sepolia；页面刷新、钱包切换、输入边界和交易状态均已观察 |
| Sepolia 部署 | ✅ | 合约 `0xeb7216…FCDaD`，部署交易 `0x2128ff…f674a`，区块 `11411013` |
| Etherscan 开源验证 | ✅ | Contract Source Code Verified，Exact Match；合约名 `OnchainNotebook` |
| Sepolia P0 交互 | ✅ | 已保存、刷新读取、覆盖、两步清空并恢复原文；所有事件均由公开 RPC 复核 |
| Sepolia P1 交互 | ✅ | Meal/Walk/Read 分别增加 3/5/7，累计值到 15、阶段到 Star；同日按钮进入冷却状态 |
| Sepolia P1 积分转让交互 | ✅ | 向两个测试地址赠送 2 和 3；主地址可转余额为 10，收款余额为 2/3，累计成长值不受赠送影响 |

本页外部状态只在直接观察 Chrome、MetaMask、公开 RPC 与 Etherscan 证据后更新。

## 已实现边界

- 活动枚举固定为 `Meal = 0`、`Walk = 1`、`Read = 2`，奖励为 3、5、7。
- 同一钱包的同一活动在 `UTC+8` 自然日内最多记录一次，钱包之间互不影响。
- 阶段阈值为 Egg 0–2、Sprout 3–7、Explorer 8–14、Star 15 及以上。
- 累计成长值只由本钱包活动增加且不因转出减少；可转余额可以在 Sepolia 地址间赠送。
- 收到的可转余额可以再次赠送，但不会增加收款钱包的累计成长值或星宝阶段。
- 成长星不是 ERC-20，没有授权、市场、价格、兑换、提现或主网部署声明。
- 活动调用没有儿童文本、照片、健康或位置字段；成长星没有价格、兑换、授权或提现能力。
- 便签和成长功能在合约、hook、页面与测试中保持独立。
- 清空便签只删除当前状态，历史交易和历史输入仍可能被公开追溯。

## 本地自动化证据

2026-08-03 在隔离工作树运行：

| 命令 | 结果 |
|---|---|
| `pnpm web3:check` | ✅ 合约 4 个检查文件、前端 44 个检查文件通过（仅保留 4 个无障碍减弱动画所需警告） |
| `pnpm web3:test` | ✅ 合约 27 项、前端 121 项通过 |
| `pnpm web3:typecheck` | ✅ 合约与前端 TypeScript 检查通过 |
| `pnpm web3:build` | ✅ 使用真实 Sepolia 合约地址完成生产构建 |
| `pnpm check` | ✅ 仓库 Biome 与 Go 格式检查通过 |
| `pnpm test` | ✅ 结构 20 项、API 31 项、Go 全包、Web 23 项通过 |
| `pnpm typecheck` | ✅ API、Go、Web 检查通过 |
| `pnpm build` | ✅ API、Go、现有 Web 生产构建成功 |
| `git diff --check` | ✅ 无空白错误 |

这里的 `pnpm build` 是现有课程主应用的仓库级构建；BabySteps 由独立的
`pnpm web3:build` 使用真实 `VITE_ONCHAIN_NOTEBOOK_ADDRESS` 完成生产构建。

## 本地可视验收清单

- [x] Chrome 打开本地页面，桌面布局无横向溢出；响应式边界由前端测试覆盖。
- [x] 只连接专用 MetaMask 测试账户，并显示 Sepolia 网络。
- [x] P0：读取便签、保存、刷新恢复、覆盖、两步确认清空当前值并恢复原文。
- [x] P0：页面明确说明历史交易仍公开，且拒绝超过 280 UTF-8 字节的内容。
- [x] P0：便签已经为空时禁用清空按钮，防止再次发送无效 Gas 交易。
- [x] P1：读取真实成长星、阶段和当天三个活动状态。
- [x] P1：钱包签名、广播等待、链上确认和错误状态均可见。
- [x] P1：记录活动后积分按 3/5/7 增长，刷新后恢复。
- [x] P1：同日三个活动显示各自冷却文案且领取按钮不可用；UTC+8 边界由合约测试覆盖。
- [x] P1：两个专用测试地址完成赠送，刷新后双方可转余额正确。
- [x] P1：赠送前后双方累计成长值和星宝阶段均不因收发积分改变。
- [x] P1：零地址、本人地址、零数量、小数和余额不足均被页面或合约安全拒绝。
- [x] 成功交易链接打开 Sepolia Etherscan 对应交易。
- [x] 页面没有输入、显示或上传儿童隐私资料的入口。

## Sepolia 公开证据

### 部署与源码验证

- 合约地址：[`0xeb7216D50a2708a59fef5322e452e34382aFCDaD`](https://sepolia.etherscan.io/address/0xeb7216D50a2708a59fef5322e452e34382aFCDaD#code)
- 部署交易：[`0x2128ff…f674a`](https://sepolia.etherscan.io/tx/0x2128ff833511d6f6c03d9c60ab6f161f62909e6f00fedd80710a8826495f674a)
- 区块与时间：`11411013`，`2026-08-03T14:42:48.000Z`
- Etherscan：`Source Code Verified · Exact Match`，合约名 `OnchainNotebook`
- Sourcify：[`chainId 11155111` 源码匹配](https://sourcify.dev/server/repo-ui/11155111/0xeb7216D50a2708a59fef5322e452e34382aFCDaD)

### P0 链上便签

| 操作 | 交易 | 区块 | UTC |
|---|---|---:|---|
| 初次保存 | [`0xd2e33a…af08`](https://sepolia.etherscan.io/tx/0xd2e33abadd8a51a95e4d2631b7e763b3e3f72ff0ebe58d14a9af10e0bcecaf08) | 11411067 | 2026-08-03 |
| 覆盖为验证文字 | [`0xfe5cca…a347`](https://sepolia.etherscan.io/tx/0xfe5ccafa0df32769fc13b690c9869bd69dab392eb81621eabd14882b30eaa347) | 11411295 | 2026-08-03T15:41:36Z |
| 清空当前显示 | [`0x1333fd…43cb`](https://sepolia.etherscan.io/tx/0x1333fd4bf6818149fb5d6673d97ad9dac1ae66e111a9e0c4d2d2da3940d943cb) | 11411312 | 2026-08-03T15:45:12Z |
| 重复清空（幂等） | [`0x0b82a5…e5a9`](https://sepolia.etherscan.io/tx/0x0b82a5f4eb07dfd702f9a66446bf45d8c9fbc712ebda0b371e993a1a112ae5a9) | 11411316 | 2026-08-03T15:46:00Z |
| 恢复原文 | [`0x080bd2…0120`](https://sepolia.etherscan.io/tx/0x080bd2ffa9438deadde53c52eb1d3b86daed3ebf5198e6bc822a4e6fb62d0120) | 11411322 | 2026-08-03T15:47:12Z |

两笔连续 `NoteCleared` 都成功且没有丢失额外数据，但第二笔浪费了测试币 Gas。现场复盘后已增加前端保护：当前链上便签为空时禁用清空按钮，并补充回归测试。

### P1 活动与成长星

| 操作 | 公开结果 | 交易 |
|---|---|---|
| Read | +7，累计 7，Sprout | [`0x9b6ac8…61e2`](https://sepolia.etherscan.io/tx/0x9b6ac8207945aa4710373640754db41bd707bf39d8f897a6577d680087ab61e2) |
| Meal | +3，累计 10，Explorer | [`0x820841…a535`](https://sepolia.etherscan.io/tx/0x820841766e0140cdc3d5ac9b6d8613408f67b9f59da3e32fe2cbc6ec35fda535) |
| Walk | +5，累计 15，Star | [`0x3478ad…7c40`](https://sepolia.etherscan.io/tx/0x3478ad79c9d03e63d8a4d2cfa99036a3a1bb29cd014f32ea7275b6ca59a07c40) |
| 赠送 2 | 收款测试地址 `0x6465…9417` 余额 2 | [`0x1121a7…3d2f`](https://sepolia.etherscan.io/tx/0x1121a7f74db2501175b1c1eeda1bac3d946218f8f5472f6503344bead43a3d2f) |
| 赠送 3 | 收款测试地址 `0xf078…0a9a` 余额 3 | [`0x7245b1…e58`](https://sepolia.etherscan.io/tx/0x7245b1faaee699600d534e8fb9f5583d4443a108d18778014529af3c9879fe58) |

最终主测试地址显示累计养成值 `15`、可赠送成长星 `10`；Meal、Walk、Read 分别显示“还不饿”“正在休息”“还在回味故事”，页面不公开下一次可领取时间。

本文只记录公开测试链证据。未记录私钥、助记词、Hardhat keystore 密码、RPC 凭据、API Key、儿童资料或真实资产钱包。
