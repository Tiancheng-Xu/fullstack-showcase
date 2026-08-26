# 本地链公开证据索引

`public/` 固定只包含以下 8 个 JSON。它们由 `make demo` 在一次真实链运行中生成，并在
全部校验通过后整体发布。

| 文件 | 证明内容 |
| --- | --- |
| `run-summary.json` | Chain ID、转账金额、手续费、交易高度、后续高度、余额差值和复用证据提交 |
| `status-before.json` | 转账前节点高度、同步状态和最新区块时间 |
| `balances-before.json` | Validator、Alice、Bob 转账前的 `ubaby` 余额 |
| `broadcast.json` | 节点接受广播时返回的严格零错误码和交易哈希 |
| `tx.json` | 已提交交易、单个 `MsgSend`、发送方、接收方、金额和手续费 |
| `block.json` | 交易所在区块及原始交易字节 SHA-256 复算证明 |
| `balances-after.json` | 转账提交后的三个账户余额 |
| `status-after.json` | 高于交易高度的后续区块，证明链继续出块 |

## 核心验收关系

- Alice 差值：`-25000500ubaby`，即转账金额加手续费。
- Bob 差值：`+25000000ubaby`。
- Validator 可用余额差值：`0ubaby`。
- `block.json` 中原始交易字节复算的 SHA-256 必须等于查询交易哈希。
- `status-after.json` 的高度必须大于交易提交高度。
- `run-summary.json` 固定引用 BabySteps EVM 证据提交
  `d728315f1c34bd76377f2b302f9cc6f1ed9e3167`。

## 脱敏边界

公开 JSON 只包含地址、公开链状态、交易和区块数据，不包含助记词、私钥、种子短语、
本机绝对路径或测试 keyring 文件。生成脚本会拒绝字段缺失、类型错误、非零错误码、
收款方不符、金额不符或手续费不符的交易结果。

可用下面的命令检查文件数量和 JSON 格式：

```bash
test "$(find evidence/public -maxdepth 1 -type f -name '*.json' | wc -l | tr -d ' ')" = 8
for file in evidence/public/*.json; do jq -e . "$file" >/dev/null; done
```
