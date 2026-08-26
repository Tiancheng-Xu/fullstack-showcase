# Cosmos SDK 本地自建链设计

**日期：** 2026-08-23

**状态：** A2 已确认，等待书面规格复核后进入实现计划

**Feature：** `cosmos-local-chain`

**合同哈希：** `97e86269840a8b079e7d1d034b107c5497443f8a32d525988bb265c4cc5996c5`

## 1. 目标

在合规主线中新增一个独立、可在本机重复运行的 Cosmos SDK 教学链。演示覆盖创世配置、验证人、钱包初始分配、Alice 向 Bob 转账、交易查询和持续出块，并导出不含助记词、私钥或本机运行目录的验收证据。

本 Feature 只实现 Cosmos 本地链。既有 BabySteps Sepolia 合约、RPC 配置和链上交易通过不可变提交 `d728315f1c34bd76377f2b302f9cc6f1ed9e3167` 只读复用；The Graph 相关成果继续由原有独立证据承载。本 Feature 不复制、不迁移、不重新部署，也不改变这些成果原有的验收状态。

## 2. 完成标准

以下条件必须同时满足：

1. 使用固定版本的 Ignite CLI 生成真实 Cosmos SDK 源码，仓库中保留可审阅的 Go 应用，而不是只提供命令截图。
2. 一条命令可以初始化并启动 `babysteps-local-1`，RPC 和 REST 只监听本机回环地址。
3. 创世配置包含一个验证人以及 Alice、Bob 两个演示钱包，并为三个账户分配明确数量的 `ubaby`。
4. Alice 可以向 Bob 广播一笔 `bank send`，脚本验证交易成功且 Bob 的余额按转账额增加。
5. 证据包含启动后的链 ID、最新高度、三个账户地址、转账前后余额、交易哈希、交易详情以及包含该交易的区块。
6. 等待新区块后高度必须增加，证明链在持续出块，而不是只写了静态创世文件。
7. 本机密钥环、助记词、私钥、PID、日志和可重建运行目录不得进入 Git。
8. 不创建云资源、不启动付费 RPC、不部署公开测试网、不推送或发布。

## 3. 技术选择

采用 Ignite CLI `v29.8.0` 生成 Cosmos SDK `v0.53` 系列应用。Ignite 是 Cosmos SDK 的标准脚手架路线，能够生成模块装配、命令行程序和本地开发配置；本项目使用内置 `auth`、`bank`、`staking` 等模块，不增加自定义业务模块。

脚手架命令固定为等价于：

```bash
ignite scaffold chain github.com/Tiancheng-Xu/babysteps-chain \
  --address-prefix baby \
  --default-denom ubaby \
  --no-module \
  --skip-git
```

不采用手写 Cosmos SDK App，因为会引入大量与目标无关的装配代码；不采用只有 Docker 镜像的方案，因为它无法清楚展示自建链源码；不增加自定义模块，因为标准 `bank` 转账已经完整覆盖钱包分发、交易与出块教学目标。

参考：

- [Ignite CLI 命令](https://docs.ignite.com/CLI-Commands/cli-commands)
- [Ignite v29 / Cosmos SDK v0.53 迁移说明](https://docs.ignite.com/migration/v29.0.0)
- [Cosmos SDK v0.53 交易生成、签名与广播](https://docs.cosmos.network/sdk/v0.53/user/run-node/txs)

## 4. 链参数

| 参数 | 固定值 | 用途 |
| --- | --- | --- |
| Chain ID | `babysteps-local-1` | 区分本机教学链 |
| 地址前缀 | `baby` | 生成 `baby1...` 账户地址 |
| 基础代币 | `ubaby` | 转账与质押的最小单位 |
| 验证人 | `validator` | 提交区块并维持本地链运行 |
| 发送方 | `alice` | 发起演示转账 |
| 接收方 | `bob` | 接收演示转账 |
| RPC | `127.0.0.1:26657` | 查询状态、交易与区块 |
| REST | `127.0.0.1:1317` | 查询账户余额等 Cosmos API |

创世余额使用明确但没有现实价值的教学数量。验证人质押后仍保留足够余额；Alice 的余额大于演示转账额和手续费；Bob 的初始余额非零，以便同时证明创世分发和转账增加。具体整数会在生成后的 `config.yml` 中冻结，并由测试读取真实链结果验证。

## 5. 目录边界

所有实现放在独立应用目录：

```text
apps/cosmos-local-chain/
├── README.md
├── Makefile
├── .gitignore
├── cosmos-chain/                 # Ignite 生成的 Cosmos SDK Go 源码
│   ├── app/
│   ├── cmd/
│   ├── proto/
│   ├── config.yml
│   └── go.mod
├── scripts/
│   ├── install-ignite.sh         # 安装到项目私有 .tools，不污染全局 PATH
│   ├── start-local.sh            # 重置并后台启动本地链，带超时和就绪检查
│   ├── run-demo.sh               # 查询余额、转账、查交易、等待新区块
│   ├── stop-local.sh             # 仅停止本项目记录的 PID
│   └── lib.sh                    # 路径、端口、JSON 和错误处理公共函数
├── tests/
│   └── local-chain-contract.sh   # 对真实本地链运行用户可见行为测试
└── evidence/
    ├── README.md                 # 证据字段、复现方式和隐私边界
    ├── public/                   # 可提交的脱敏 JSON 与摘要
    └── local/                    # 日志、PID、密钥环等，Git 忽略
```

Ignite 和 Go 依赖下载允许访问官方模块源，但工具安装目录固定在本应用的 `.tools/`，运行主目录固定在本应用的 `.local/`。两个目录均忽略，不读取或复用用户全局 Cosmos 钱包。

## 6. 数据流

完整演示流程如下：

```text
安装固定版本 Ignite
  -> 生成或构建 babysteps-chaind
  -> 按 config.yml 初始化创世状态和本地 keyring-test
  -> validator 启动并开始出块
  -> 查询 validator / alice / bob 地址和转账前余额
  -> alice 广播 bank send 到 bob
  -> 等待交易进入区块并查询 tx JSON
  -> 查询转账后余额并校验差额
  -> 等待至少一个新区块并校验高度增加
  -> 导出脱敏 evidence/public
  -> stop-local.sh 只停止本次 PID
```

脚本使用 `set -Eeuo pipefail`，所有路径都从脚本自身位置解析，不依赖调用者当前目录。启动脚本最多等待 120 秒；RPC 未就绪、交易 `code != 0`、余额不匹配、区块高度不增长或 PID 不属于本项目时立即失败并给出清晰错误。

## 7. 钱包与隐私边界

- 使用 Cosmos SDK 的 `test` keyring backend，仅限本机教学链。
- 脚本可以记录公开地址，但不得打印或保存助记词、私钥或 keyring 文件内容到公开证据。
- 每次彻底重置可重新生成演示钱包；验收要求的是可复现的角色与余额，不要求固定私钥或固定地址。
- `evidence/public` 只保存公开链状态；`.local`、`.tools`、PID、完整日志和运行时 keyring 全部忽略。
- 停止脚本只读取本项目 PID 文件，并在发送信号前核对进程命令，避免误停其他 Cosmos 或 Go 进程。

## 8. 测试策略

生成的 Ignite 框架代码属于工具生成代码，不为其重复编写 Cosmos SDK 上游单元测试。自行编写的脚本严格按 TDD 实现：先写真实行为测试并确认因命令或输出缺失而失败，再补最小脚本使其通过。

测试分三层：

1. **静态合同测试：** 检查必要命令可用、版本固定、目录不越界、公开证据不包含助记词或私钥字段。
2. **真实链集成测试：** 启动单验证人链，查询三个账户，执行真实 `bank send`，验证交易返回码、余额变化和区块高度增长。
3. **清理测试：** 正常完成或中途失败后都能停止本项目节点，且不留下监听 `26657` 或 `1317` 的本项目进程。

最终验收命令预计为：

```bash
make bootstrap
make test
make demo
make stop
```

实际命令会在实现计划中根据 Ignite v29.8.0 生成结果精确冻结；不得用降低断言、跳过失败步骤或提交静态伪造 JSON 的方式通过验收。

## 9. 与 BabySteps、RPC 和 The Graph 的边界

Cosmos 本地链用于证明能够创建并运行一条应用链；BabySteps Sepolia 资产用于证明 EVM RPC、交易回执和事件日志；The Graph 资产用于证明事件索引与 GraphQL 查询。三者是互补证据，不把 Cosmos 的 CometBFT RPC 描述成 EVM JSON-RPC，也不把直接 RPC 查询描述成 The Graph 索引结果。

只读复用基线：

- Git 提交：`d728315f1c34bd76377f2b302f9cc6f1ed9e3167`
- 证据文档：`docs/qa/web3-onchain-notebook.md`
- Web3 源码：`homeworks/06-web3-dapp/**`
- Sepolia 合约：`0xeb7216D50a2708a59fef5322e452e34382aFCDaD`
- 部署区块：`11411013`

这些路径只存在于既有 Web3 提交中，不复制到当前主线，也不在本 Feature 中修改。

## 10. 交付边界

本轮只完成本地实现、测试和脱敏证据。Push、PR、测试部署和公开发布均不在当前授权范围内；生产部署永久保持人工操作。若后续需要公开 Evidence，只能在本地 QA 通过且用户看过结果后另行确认。

