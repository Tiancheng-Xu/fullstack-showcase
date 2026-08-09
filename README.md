# Fullstack Showcase

个人全栈、AI、Web3 与云工程作品 Dashboard。每个正式项目使用独立 GitHub 仓库；本仓库只负责项目索引、作业台账和统一入口，不再接收新的项目实现代码。

## 项目仓库

| 项目 | 仓库 | 可见性 | 当前状态 |
|---|---|---|---|
| Personal AI Agent | [Tiancheng-Xu/personal-ai-agent](https://github.com/Tiancheng-Xu/personal-ai-agent) | Private | Qwen3-8B QLoRA、冻结评测、GGUF、Mac Ollama 已完成；RAG / Rerank / Mastra / LangGraph 进行中 |
| GitHub Profile Studio | [Tiancheng-Xu/github-profile-studio](https://github.com/Tiancheng-Xu/github-profile-studio) | Public | 本地全栈实现与可视验收已完成 |
| Web3 AI | [Tiancheng-Xu/web3-ai](https://github.com/Tiancheng-Xu/web3-ai) | Private | Web3 项目独立维护 |
| Baby2B Deployment Evidence | [Tiancheng-Xu/baby2b-online-deployment-evidence](https://github.com/Tiancheng-Xu/baby2b-online-deployment-evidence) | Private | 部署证据与发布流程独立维护 |

Private 仓库只对授权账号可见；Dashboard 不复制私有源码、训练数据、模型权重或凭据。

> 历史 `apps/web` 是仓库改为 Dashboard 前留下的 UI 基底，暂时保留现场。后续迁移必须在独立仓库完成验证后再删除，不能直接破坏历史提交。

## 推荐实现顺序

1. Web 与 Serverless 基础：Hono、GitHub API、Drizzle、SAM
2. Go 与云原生部署：Go、ECR、ECS、ALB、Fargate、Cloud Map
3. 可靠性与发布：Synthetics、SNS/SQS、死信队列、API Canary、PR 独立环境
4. AI 工程：MCP、Agents、RAG、Rerank、Mastra、LangGraph
5. 游戏与图形：Phaser、Three.js、Babylon.js、Cocos、微信/抖音小游戏

完整验收项见 [HOMEWORKS.md](HOMEWORKS.md)。

## 历史前端基底

`apps/web` 是早期使用 Better-T-Stack 和 TC Flow 建立的“育爱成长”移动端前端基底。它不是新项目的承载目录。

- [项目运行与扩展说明](apps/web/README.md)
- [UI 基底验收记录](docs/qa/nurture-bloom-ui-foundation.md)

## Dashboard 约定

```text
apps/       可独立运行或部署的应用
packages/   跨应用共享代码
infra/      SAM、容器和云基础设施配置
docs/       架构图、运行手册和作业证据
```

每个独立项目仓库至少提供：

- `README.md`：目标、架构、启动与部署步骤
- `.env.example`：只写变量名和示例值，不提交密钥
- 自动化测试或最小可复现验证命令
- 作业验收证据：截图、日志或公开地址，放入对应应用的 `docs/`

## 本地环境

- macOS / Apple Silicon
- Node.js 22 + pnpm
- Go + gopls
- Docker CLI + Colima
- AWS CLI + SAM CLI（AWS 账号通过后再配置凭据）
- Wrangler、Cocos Creator、微信开发者工具、抖音开发者工具

启动容器环境：

```bash
colima start
docker version
```

不用容器时释放资源：

```bash
colima stop
```
