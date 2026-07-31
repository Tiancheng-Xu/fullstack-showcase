# GitHub 个人资料 Go API

这是 Hono 作业的本地 Go 迁移版本。Hono 继续监听 3000；Go 默认仅在本机回环地址 `127.0.0.1:3002` 监听，并实现相同的四个路由与 JSON 合约。

## 安全边界

- GitHub 凭据只从 macOS 钥匙串服务 `course-homework.github-profile`、账户 `Tiancheng-Xu` 读取；
- 浏览器、环境文件、SQLite、日志、测试夹具和 API 响应都不保存真实令牌；
- Go 只保留 GitHub ID、登录名、姓名、简介、头像、公开主页、公开仓库数、关注者和创建时间；
- `KEYCHAIN_SERVICE` 与 `KEYCHAIN_ACCOUNT` 只是非敏感查询标签。

## 本地运行

从仓库根目录执行：

```bash
pnpm dev:go
```

该命令先运行 Go 迁移器，再启动：

- Go API：`http://localhost:3002`
- React：`http://localhost:3001/homework/github-profile`
- Vite `/api` 代理：`http://localhost:3002`

Go 默认复用：

- 数据库：`apps/api/data/github-profile.sqlite`
- 迁移：`apps/api/drizzle`

从 `apps/api-go` 单独运行时，相对路径分别是 `../api/data/github-profile.sqlite` 与 `../api/drizzle`。

## 质量门

根命令会同时验证 Hono、Go 和 React：

```bash
pnpm check
pnpm test
pnpm typecheck
pnpm build
```

Go 专用命令：

```bash
pnpm test:go
pnpm typecheck:go
pnpm build:go
```

可选的非敏感覆盖项：`GO_API_HOST`、`GO_API_PORT`、`DB_FILE_NAME`、`MIGRATIONS_DIR`、`KEYCHAIN_SERVICE`、`KEYCHAIN_ACCOUNT`。`GO_API_HOST` 只接受 `localhost` 或明确的 IP 地址；如改为非回环地址，需自行评估局域网暴露风险。

本模块只完成本地 Go 迁移，不包含 AWS、ECR、ECS、ALB、Fargate、Cloud Map、推送或生产部署。
