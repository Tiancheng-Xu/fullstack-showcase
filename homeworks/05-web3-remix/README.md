# 周六 Remix 智能合约作业

本目录归档已在 Remix VM 中验证的两份课程合约源码，和周日的链上记事本 DApp（`homeworks/06-web3-dapp`）保持独立。

- `contracts/SimpleBank.sol`：存款、查询个人内部余额与提款。提款采用 Checks-Effects-Interactions 顺序：先扣内部余额，再转出 ETH。
- `contracts/RedPacket.sol`：支持等额或演示用随机金额的 ETH 红包；每个地址只能领取一次。

## Remix 复现要点

1. 在 Remix 2.5.3 选择 Solidity `^0.8.20` 编译器，并使用 Remix VM（Osaka）。
2. 部署 `SimpleBank` 后，用不同金额调用 `deposit()`、`getBalance()` 和 `withdraw(uint256)`。
3. 部署 `RedPacket` 时填写构造参数和 ETH value，再用不同 VM 账户调用 `grabRedPacket()`。
4. 详细的真实操作结果、已覆盖项目和未覆盖分支见 [`docs/qa/web3-saturday-contracts.md`](../../docs/qa/web3-saturday-contracts.md)。

## 课程安全边界

`RedPacket` 在非等额路径使用 `block.timestamp` 与地址哈希来生成演示金额。这不是安全随机数，且可能被区块生产者影响；该合约只适合课程演示，绝不能用于承载真实价值的红包。
