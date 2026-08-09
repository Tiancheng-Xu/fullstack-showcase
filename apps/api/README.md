# GitHub 个人资料 API

这是 AI 全栈章节第一项作业的本地后端：Hono 从 GitHub 读取当前用户资料，严格过滤字段，再通过 Drizzle 写入本地 SQLite。

## 凭据边界

创建由 `Tiancheng-Xu` 持有的 fine-grained personal access token：

- 设置明确的过期时间；
- 不授予仓库权限、组织权限或写权限；
- 令牌只保存到 macOS“钥匙串访问”的通用密码项目；
- 不把令牌放进终端、环境文件、浏览器存储、数据库、日志、截图或 Git。

在图形界面创建钥匙串项目时使用：

```text
钥匙串项目名称：course-homework.github-profile
账户名称：Tiancheng-Xu
密码：GitHub 创建页一次性显示的令牌
```

如果 macOS 要求 Touch ID 或设备登录密码，由设备所有者亲自完成系统授权。

`.env.example` 只包含非敏感的钥匙串查询标签、数据库路径和端口。

## 本地运行

在仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm --filter @course-homework/api db:migrate
pnpm dev
```

- API：`http://localhost:3000`
- Web：`http://localhost:3001/homework/github-profile`

完整质量门：

```bash
pnpm check
pnpm test
pnpm typecheck
pnpm build
```

## 撤销与删除

验收结束后：

1. 在 GitHub Developer Settings 撤销对应的 fine-grained token；
2. 在 macOS“钥匙串访问”删除 `course-homework.github-profile` 项目；
3. 删除 `apps/api/data/github-profile.sqlite`，清除本地持久化资料。

本阶段不部署 AWS；SAM、VPC、IAM 与云端验收在后续专题完成。
