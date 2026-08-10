# 必做项目清单

以下内容按依赖关系重新编排；原始日期保留用于对照，但实现以里程碑为单位推进。

## 里程碑 1：Web、数据库与 Serverless（原 06/27）

- 使用 Hono 开发一个接口和一个页面，并用 AWS SAM 部署。
- 开发表单页面，通过个人 Token 获取 GitHub 账户信息。
- 使用 Drizzle 完成字段增加和删除。
- 使用 SAM 将服务与数据库配置到同一个 VPC：一个可访问外网的子网，另外两个子网用于 Lambda。
- 编写 GitHub Actions，通过最小权限 IAM 角色部署项目。
- 使用自己的 JavaScript 工作流完成代码开发。

## 里程碑 2：Go 与云原生（原 07/11）

- 搭建 Go 环境，连接数据库，并迁移部分 Node.js 数据库代码。
- 使用 GitHub 用户名生成个人介绍前端。
- 使用 ECR、ECS、ALB、Fargate 部署服务，并通过 Cloud Map 连接 Lambda 接口。
- 基于 PR 创建独立开发环境，使用 Cloudflare、CodeBuild 和三个最小权限 IAM 角色完成 Go 版本。

## 里程碑 3：可靠性、异步系统与 AIOps（原 07/18）

- 完成 AWS Synthetics 巡检任务。
- 在已有 GitHub 项目中实现 SNS、SQS 和死信队列场景。
- 对 API 执行 Canary 灰度发布。
- 完整开发一个 AIOps Agent；AWS 部署必做，本地部署选做。
- 如果进行本地开发，实现自己的 MCP Server，并由 Agent 调用。

## 里程碑 4：RAG 与 Agent 编排（原 07/25、07/26）

实际成果仓库：[`Tiancheng-Xu/personal-ai-agent`](https://github.com/Tiancheng-Xu/personal-ai-agent)（Private）。当前已完成 Qwen3-8B QLoRA、353/38/49 数据切分、冻结测试集 base/adapter 对照、GGUF 量化和 Mac Ollama 验收；下列 RAG、Rerank、Mastra Client 与 LangGraph 仍按未完成项管理。

- 准备冰箱、彩电、显示器维修 Markdown 文档。
- 准备向量数据库和向量模型，用 Mastra 写入维修文档。
- 将已有 Agent 接入 RAG，并且必须加入 Rerank。
- 使用 Mastra Client 开发前端并调用 Mastra 接口。
- 使用 LangGraph 实现 Agent 编排器。
- 选做：把向量数据库工作流的历史经验整理为 Markdown 并入库。
- 选做：结合底座模型、LoRA 和向量数据库进行内容润色；本机不配置训练环境。

## 里程碑 5：游戏与 3D（原 07/18、07/26）

- 了解 Three.js 和 Phaser，并完成一款 Phaser 2D 游戏。
- 使用 TRELLIS.2 生成 3D 模型并部署到 Babylon.js；本机不安装模型训练环境。
- 注册微信小游戏个人账号，使用 Cocos 开发小游戏。
- 接入微信广告 SDK，实现通过广告获取游戏道具和过关逻辑，并提交审核。
- 申请抖音小游戏，复用同类广告与过关逻辑。
- 选做：使用 Codex + Blender MCP 创建场景并加载到 Babylon.js。
- 选做：用 TRELLIS.2 生成场景汽车并导入 Blender。

## 通用完成标准

- 所有密钥只放在本机钥匙串、CI Secret 或云端 Secret Manager，不提交仓库。
- 每个可部署应用都有一条可复现的本地验证命令。
- 云端资源均记录架构、权限边界、销毁方法和费用风险。
- 每个项目通过 PR 合并，CI 必须通过后才算完成。
