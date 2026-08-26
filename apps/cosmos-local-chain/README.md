# Cosmos SDK 本地链演示

这个目录提供一条可重复启动的单验证人 Cosmos SDK 链，用本机钱包完成 Alice 向 Bob
的真实转账，并导出交易、区块、余额变化和持续出块证据。

整个演示只使用本机回环网络，不需要云主机、托管 RPC 或付费节点。BabySteps 已有的
Sepolia RPC 与 The Graph 成果保持不变，本模块只在证据摘要中引用其固定提交
`d728315f1c34bd76377f2b302f9cc6f1ed9e3167`，不会重复部署。

## 环境要求

- macOS 或常见 Unix 环境
- Go、Bash、Make、Git
- `curl`、`jq`、`openssl`、`shasum`、`perl`、`lsof`

Ignite 固定为 `v29.8.0`，由脚本从官方标签源码构建到目录内的 `.tools/`，不会修改
全局 Ignite。生成链固定使用 Cosmos SDK `v0.53.6` 和 CometBFT `v0.38.21`。

## 快速复现

```bash
cd apps/cosmos-local-chain
make start
make demo
make stop
```

也可以直接运行完整 Gate：

```bash
make test
```

完整 Gate 会覆盖固定工具链、创世分配、生命周期安全、畸形交易结果拒绝、真实转账、
区块内原始交易哈希复算、后续出块、证据脱敏和停止后端口释放。

## 链与钱包

| 项目 | 固定值 |
| --- | --- |
| Chain ID | `babysteps-local-1` |
| 最小单位 | `ubaby` |
| Validator 创世总额 | `1000000000ubaby` |
| Validator 初始质押 | `500000000ubaby` |
| Validator 初始可用余额 | `500000000ubaby` |
| Alice 初始余额 | `500000000ubaby` |
| Bob 初始余额 | `100000000ubaby` |
| Alice 转账金额 | `25000000ubaby` |
| 手续费 | `500ubaby` |

三个钱包只存在于被忽略的 `.local/` 测试 keyring 中。脚本不会输出助记词或私钥，这些
钱包也不能用于生产环境或承载真实资产。

## 本地网络边界

| 服务 | 地址 |
| --- | --- |
| REST API | `http://127.0.0.1:1317` |
| CometBFT RPC | `http://127.0.0.1:26657` |
| P2P | `127.0.0.1:26656` |

所有监听均绑定 `127.0.0.1`。启动脚本使用所有权标记、进程实例信息和原子生命周期锁，
拒绝删除未标记目录、符号链接目录或不匹配的进程。

## 三种查询方式的边界

| 方式 | 适合解决的问题 | 不负责的事情 |
| --- | --- | --- |
| 直接 RPC | 查询最新状态、指定交易、指定区块，适合即时核验 | 不自动形成长期业务实体和复杂聚合 |
| 事件索引 | 持续消费特定事件并写入自定义存储，规则最灵活 | 需要自行维护游标、重放、去重与数据模型 |
| The Graph | 把 EVM 日志映射成可通过 GraphQL 查询的实体 | 不证明 Cosmos 本地节点能启动、转账或持续出块 |

因此，本模块使用 Cosmos RPC 证明本地链运行闭环，同时复用 BabySteps 已有的 EVM RPC
与 The Graph 结果，避免把两个不同链环境的证据混为一谈。

## 证据

公开证据位于 [`evidence/public`](./evidence/public)，文件说明见
[`evidence/README.md`](./evidence/README.md)。每次 `make demo` 都先在临时目录生成并
验证完整的 8 个 JSON，再整体替换公开目录，不会把两次运行的文件混在一起。

运行态 `.local/`、私有工具 `.tools/` 和测试 keyring 不属于公开证据。
