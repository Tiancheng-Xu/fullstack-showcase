# 周六 Remix 合约验收记录

**验收环境：** 外置 Chrome 中的 Remix 2.5.3；Remix VM（Osaka）。以下地址和余额都是临时 VM 状态，不是 Sepolia 链上证据。

## SimpleBank

- 页面可见短地址：`0xD4F...2cbee`。
- 部署后存入 `1 ETH`。
- `getBalance()` 读取到 `1000000000000000000` wei。
- 取出 `0.4 ETH` 后，最终内部余额为 `0.6 ETH`，合约余额也为 `0.6 ETH`。

## RedPacket

- 页面可见短地址：`0x332...D4B6D`。
- 构造参数为 `c=2`、`_isEqual=true`，部署 value 为 `2 ETH`。
- Account 2 和 Account 3 各领取 `1 ETH`。
- 最终 `count=0`，合约余额为 `0 ETH`。

## 失败路径与覆盖边界

- 成功交易后，Remix 记录了 3 次重复领取尝试，均以 `count must > 0` 回滚，且没有改变上述最终状态。
- 自动化交互曾出现异常；本记录保留该事实，并以外置 Chrome 中实际可见的 Remix VM 结果作为本次验收依据。
- `refund()` 的 24 小时到期分支没有等待真实时间验证，当前标记为**未覆盖**；未将其伪造为完成。

## 证据解释

本记录只证明当时 Remix VM（Osaka）中的本地 EVM 交互。它不构成 Sepolia 部署、交易确认或 Etherscan 源码验证的证据；这些周日 DApp 验收项仍需单独完成。
