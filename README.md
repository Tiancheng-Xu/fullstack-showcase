# Course Homework

课程必做作业与实践项目。该仓库与“学习笔记”仓库完全独立，只存放可运行代码、基础设施配置、测试和交付说明。

## 推荐实现顺序

1. Web 与 Serverless 基础：Hono、GitHub API、Drizzle、SAM
2. Go 与云原生部署：Go、ECR、ECS、ALB、Fargate、Cloud Map
3. 可靠性与发布：Synthetics、SNS/SQS、死信队列、API Canary、PR 独立环境
4. AI 工程：MCP、Agents、RAG、Rerank、Mastra、LangGraph
5. 游戏与图形：Phaser、Three.js、Babylon.js、Cocos、微信/抖音小游戏

完整验收项见 [HOMEWORKS.md](HOMEWORKS.md)。

## 当前前端基底

`apps/web` 已使用 Better-T-Stack 和 TC Flow 建立“育爱成长”移动端前端基底。当前只使用本地状态，后端会随课程进度逐步补全。

- [项目运行与扩展说明](apps/web/README.md)
- [UI 基底验收记录](docs/qa/nurture-bloom-ui-foundation.md)

## 目录约定

```text
apps/       可独立运行或部署的应用
packages/   跨应用共享代码
infra/      SAM、容器和云基础设施配置
docs/       架构图、运行手册和作业证据
```

每个应用至少提供：

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
