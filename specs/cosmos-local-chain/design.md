# cosmos-local-chain - 技术设计

## 架构

在 `apps/cosmos-local-chain/` 下建立独立应用目录，使用 Ignite CLI `v29.8.0` 的 `scaffold chain --no-module` 生成标准 Cosmos SDK 链。链只使用框架内置账户、银行、质押和共识能力，不添加自定义模块。

项目私有 `.tools/` 保存 Ignite，可重建 `.local/` 保存节点主目录和 keyring-test。`scripts/` 封装安装、启动、转账、查询和停止；`tests/` 对真实本地链执行行为测试；`evidence/public/` 保存可提交的公开链证据，`evidence/local/` 保存被忽略的运行材料。

## 固定接口

- Chain ID：`babysteps-local-1`
- Address prefix：`baby`
- Denom：`ubaby`
- Roles：`validator`、`alice`、`bob`
- RPC：`127.0.0.1:26657`
- REST：`127.0.0.1:1317`
- 聚合命令：`make bootstrap`、`make test`、`make demo`、`make stop`

## 数据与安全

三个角色的创世分配由 `cosmos-chain/config.yml` 冻结。钱包使用本应用独立的 test keyring；公开证据只允许地址、余额、交易哈希、交易 JSON、区块 JSON 和高度摘要。脚本不得输出助记词或私钥，停止操作必须校验 PID 归属。

## 错误处理

启动、RPC 就绪、交易确认和新区块等待均设置有限超时。任意 RPC 错误、非零交易码、余额差额错误、高度不增长或清理失败都会让命令返回非零状态；证据只在全部断言通过后更新。

## 测试

自行编写的脚本采用测试先行。集成测试运行真实单验证人链，完成账户查询、`bank send`、交易查询、区块查询和高度增长验证。Ignite 生成代码只运行其构建与现有测试，不复制上游框架测试。

## 完整用户审阅规格

详细设计、目录、数据流、边界和完成标准见 `docs/superpowers/specs/2026-08-23-cosmos-local-chain-design.md`。

