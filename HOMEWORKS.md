# 必做作业清单

以下内容按依赖关系重新编排；原始日期保留用于对照，但实现以里程碑为单位推进。

## 里程碑 1：Web、数据库与 Serverless（原 06/27）

- 使用 Hono 开发一个接口和一个页面，并用 AWS SAM 部署。
- 开发表单页面，通过个人 Token 获取 GitHub 账户信息。
- 使用 Drizzle 完成字段增加和删除。
- 使用 SAM 将服务与数据库配置到同一个 VPC：一个可访问外网的子网，另外两个子网用于 Lambda。
- 编写 GitHub Actions，通过最小权限 IAM 角色部署项目。
- 使用自己的 JavaScript 工作流完成代码开发。

### 当前完成状态

| 作业 ID | 本地实现 | 本地可视验收 | AWS 迁移 | 验收证据 |
|---|---|---|---|---|
| `AI-FULLSTACK-GITHUB-PROFILE` | ✅ 自动化验证通过 | ✅ Codex 内置浏览器验收通过 | ⏳ 待后续专题 | [本地验收记录](docs/qa/github-profile-fullstack.md) |

状态检查必须分别读取“本地实现”“本地可视验收”和“AWS 迁移”，不得因本地代码通过而推断云端已完成。只有内置浏览器完成读取、保存、刷新恢复和安全错误检查后，才能把“本地可视验收”改为 ✅。

## 里程碑 2：Go 与云原生（原 07/11）

- 搭建 Go 环境，连接数据库，并迁移部分 Node.js 数据库代码。
- 使用 GitHub 用户名生成个人介绍前端。
- 使用 ECR、ECS、ALB、Fargate 部署服务，并通过 Cloud Map 连接 Lambda 接口。
- 基于 PR 创建独立开发环境，使用 Cloudflare、CodeBuild 和三个最小权限 IAM 角色完成 Go 版本。

### 当前完成状态

| 作业 ID | 本地 Go 迁移 | 本地可视验收 | 云原生部署 | 验收证据 |
|---|---|---|---|---|
| `AI-FULLSTACK-GITHUB-PROFILE-GO` | ✅ Go API、共享迁移与 SQLite 仓储通过 | ✅ Codex 内置浏览器通过 Go 3002 验收 | ⏳ ECR、ECS、ALB、Fargate、Cloud Map 待后续专题 | [本地验收记录](docs/qa/github-profile-fullstack.md#go-本地迁移验收) |

本地 Go 完成不代表云原生部署完成；只有真实云端资源、权限、费用边界和外部验收全部通过后，才能更新“云原生部署”。

## 里程碑 3：可靠性、异步系统与 AIOps（原 07/18）

- 完成 AWS Synthetics 巡检任务。
- 在已有 GitHub 项目中实现 SNS、SQS 和死信队列场景。
- 对 API 执行 Canary 灰度发布。
- 完整开发一个 AIOps Agent；AWS 部署必做，本地部署选做。
- 如果进行本地开发，实现自己的 MCP Server，并由 Agent 调用。

## 里程碑 4：RAG 与 Agent 编排（原 07/25、07/26）

- 准备冰箱、彩电、显示器维修 Markdown 文档。
- 准备向量数据库和向量模型，用 Mastra 写入维修文档。
- 将已有 Agent 接入 RAG，并且必须加入 Rerank。
- 使用 Mastra Client 开发前端并调用 Mastra 接口。
- 使用 LangGraph 实现 Agent 编排器。
- 选做：把向量数据库工作流的历史经验整理为 Markdown 并入库。
- 选做：结合底座模型、LoRA 和向量数据库进行内容润色；本机不配置训练环境。

实际实现保留原作业名称，知识材料改为严格只读的“一灯学习笔记”；先在 NVIDIA CUDA 远程机器上对 `Qwen/Qwen3-8B` 进行 QLoRA 训练，再建设 Qdrant、BGE-M3、BM25/RRF、Mastra Rerank、Mastra Client 与 LangGraph 流程。本机 Mac 不承担训练。

综合产品实现为“一灯 Agent”：课程知识助理与面试教练优先用大白话组织知识网络，同时提供 `grill-me`、架构顾问、项目读取/修改/测试、增量索引、长期学习记忆、官方知识最小单元回写，以及 Codex、Claude Code、Cherry Studio/Ollama 跨平台离线能力。创建或扩大付费资源仍需当次明确确认。正式设计见 [综合设计](docs/superpowers/specs/2026-08-02-yideng-agent-rag-training-design.md)，当前训练计划见 [正式训练计划](docs/superpowers/plans/2026-08-02-qwen3-formal-training.md)。

### 当前完成状态

| 作业 ID | Smoke 准备 | 正式训练数据 | NVIDIA CUDA 训练 | RAG、Agent 与跨平台 | 验收证据 |
|---|---|---|---|---|---|
| `AI-RAG-AGENT-ORCHESTRATION` | ✅ v1 共 63 条：50 train / 7 validation / 6 frozen test | ⏳ 至少 300 train，独立 validation/test 另计 | ⏳ 实际硬件待付费启动后核验 | ⏳ Qdrant、Rerank、Mastra Client、LangGraph、记忆和平台适配 | [本地准备记录](homeworks/04-rag-agent-orchestration/docs/local-preparation-2026-08-02.md) |

本地 Ollama 草稿生成和 50 条 smoke 不等于正式训练；只有正式 release 至少 300 条 train、独立验证/冻结测试与泄漏检查通过，并取得 NVIDIA GPU/CUDA 预检、正式 QLoRA 日志、Adapter 哈希、base 对比和 Mac GGUF/Ollama 验收后，才能更新“NVIDIA CUDA 训练”。原课程的 RAG、Rerank、Mastra Client 与 LangGraph 仍是独立必做门槛，不能被 QLoRA 替代。

## 里程碑 5：游戏与 3D（原 07/18、07/26）

- 了解 Three.js 和 Phaser，并完成一款 Phaser 2D 游戏。
- 使用 TRELLIS.2 生成 3D 模型并部署到 Babylon.js；本机不安装模型训练环境。
- 注册微信小游戏个人账号，使用 Cocos 开发小游戏。
- 接入微信广告 SDK，实现通过广告获取游戏道具和过关逻辑，并提交审核。
- 申请抖音小游戏，复用同类广告与过关逻辑。
- 选做：使用 Codex + Blender MCP 创建场景并加载到 Babylon.js。
- 选做：用 TRELLIS.2 生成场景汽车并导入 Blender。

## 里程碑 6：Web3 与 DApp（08/01、08/02）

### 08/01：Solidity 合约

1. 完成私人银行合约。
2. 完成 ETH 抢红包合约。

### 08/02：人生的第一个 DApp

1. 新建 Vite + React 前端项目，开发一个链上记事本。
2. 前端使用 wagmi。
3. 使用 Hardhat 开发并部署智能合约，同时领取水龙头测试币用于验收。
4. 将合约部署到 Sepolia 测试链，并在 [Sepolia Etherscan](https://sepolia.etherscan.io/) 查看。
5. 对测试链合约完成源码开源验证。
6. 可选：使用 [RainbowKit](https://rainbowkit.com/) 或 [ConnectKit](https://family.co/docs/connectkit) 完成钱包连接界面。
7. 完成前端与链上合约的读取、写入和交易状态交互。

本里程碑中的“后端”默认指部署在 Sepolia 上的智能合约及其链上状态，不额外要求传统服务器，除非课程后续补充要求。

### 当前完成状态

| 作业 ID | 本地实现 | 测试链部署与验证 | 验收证据 |
|---|---|---|---|
| `WEB3-PRIVATE-BANK` | ✅ 用户确认已完成 | ⏳ 待补记录 | ⏳ 待补源码、交易或部署证据 |
| `WEB3-ETH-RED-PACKET` | ✅ 用户确认已完成 | ⏳ 待补记录 | ⏳ 待补源码、交易或部署证据 |
| `WEB3-ONCHAIN-NOTEBOOK` | ⏳ 待实施 | ⏳ Sepolia 部署与源码验证 | ⏳ 待补本地交互和 Etherscan 证据 |

## 通用完成标准

- 所有密钥只放在本机钥匙串、CI Secret 或云端 Secret Manager，不提交仓库。
- 每个可部署应用都有一条可复现的本地验证命令。
- 云端资源均记录架构、权限边界、销毁方法和费用风险。
- 每项作业通过 PR 合并，CI 必须通过后才算完成。
