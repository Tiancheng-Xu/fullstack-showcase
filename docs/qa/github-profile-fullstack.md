# GitHub 个人资料全栈作业验收记录

作业 ID：`AI-FULLSTACK-GITHUB-PROFILE`

## 当前结论

- 本地实现：✅ 已完成自动化验证。
- 本地可视验收：✅ 2026-07-31 已在 Codex 内置浏览器完成读取、编辑、保存、刷新恢复、幂等保存与安全错误检查。
- AWS 迁移：⏳ 后续专题完成 SAM、VPC、IAM 和云端验证。
- Go 迁移：⏳ 在本地 JavaScript 链路完整验收后继续。

以上状态相互独立。本记录只能证明本地闭环完成，不能作为 AWS 已完成的证据。

## 架构链路

```text
React 表单
  -> Vite /api 代理
  -> Hono API
  -> macOS 钥匙串凭据提供器
  -> GitHub GET /user
  -> Zod 字段白名单
  -> Drizzle 仓储
  -> Node SQLite
```

浏览器只能提交 `displayName` 与 `bio`。保存前，后端重新读取 GitHub ID、登录名、头像、主页、仓库数、关注者和创建时间，阻止浏览器伪造不可变字段。

## 自动化证据

截至 2026-07-31：

- API：8 个测试文件、29 项测试通过；
- Web：5 个测试文件、20 项测试通过；
- 结构与密钥边界：13 项测试通过；
- API 与 Web TypeScript 类型检查通过；
- API ESM 构建与 Web Vite 生产构建通过；
- Drizzle 迁移一致性检查通过；
- Biome 检查通过；
- Web 构建已生成 `homework.github-profile` 独立路由包。
- 首次运行会自动创建 `apps/api/data` 并完成迁移；
- 实际启动后 `/health` 返回 200；
- 未保存钥匙串凭据时 `/api/github/me` 返回安全的 503 `GITHUB_TOKEN_MISSING`，不包含钥匙串输出、堆栈或令牌值。

统一复验命令：

```bash
pnpm check
pnpm test
pnpm typecheck
pnpm build
```

## Drizzle 增删字段证据

迁移顺序：

1. `*_create_github_profiles`：创建初始表，包含临时 `location`；
2. `*_add_profile_metrics`：增加 `bio`、`public_repos`、`followers`、`synced_at`；
3. `*_remove_location`：删除 `location`。

迁移测试先向初始表写入 `location = 'New York'`，再执行后两次迁移，并验证：

- `location` 已移除；
- GitHub ID、登录名和显示名称保持不变；
- 仓库数与关注者不能为负数；
- 登录名保持唯一；
- 重复保存同一 GitHub ID 只保留一行并更新最新资料。

## 凭据记录

- 钥匙串项目名称：`course-homework.github-profile`
- 账户名称：`Tiancheng-Xu`
- GitHub 资源所有者：`Tiancheng-Xu`
- 仓库范围：仅公开仓库只读；无私有仓库、组织或写权限
- 账户权限：0
- 令牌值：禁止记录
- 过期日期：2026-10-29（90 天）
- 本机访问控制：仅为该钥匙串项目允许 macOS 系统工具 `/usr/bin/security`；同一 macOS 用户下的其他本地进程也可能调用该工具，因此该设置仅用于本地课程验收，完成后应撤销令牌并移除授权
- GitHub 撤销入口：Developer Settings → Personal access tokens → Fine-grained tokens
- 本机删除入口：钥匙串访问 → 搜索项目名称 → 删除

## 内置浏览器验收

- [x] 在 Codex 内置浏览器打开 `http://localhost:3001/homework/github-profile`；
- [x] 页面不存在令牌或密码输入框；结构检查得到密码输入框 0、token/secret 命名输入框 0；
- [x] 读取后显示 `Tiancheng-Xu`、头像、公开主页、3 个公开仓库、0 位关注者及创建日期；
- [x] 编辑显示名称为 `徐天成（AI 全栈）`、简介为 `学习用｜AI 全栈课程作业` 并保存，页面出现“资料已保存”；
- [x] 刷新页面后从数据库恢复编辑后的显示名称与简介；
- [x] 重复保存后 `github_profiles` 表仍只有一行，登录名为 `Tiancheng-Xu`；
- [x] 临时把钥匙串名称和位置改为 `course-homework.github-profile.disabled` 后，页面只显示“尚未在系统钥匙串中保存 GitHub 访问凭据”，未显示令牌、堆栈、路径或系统输出；
- [x] 恢复钥匙串名称和位置后，再次读取成功并显示 GitHub 当前公开值 `徐天成` 与 `学习用`。

补充观察：直接调用本地 `/api/github/me` 返回 200 和白名单公开字段；响应不包含令牌。数据库只保存公开资料，PAT 只保存在 macOS 登录钥匙串中。

## 本地清理

撤销 GitHub 令牌并删除钥匙串项目后，删除本地数据库：

```bash
rm apps/api/data/github-profile.sqlite
```

数据库、WAL 文件、环境文件、日志、钥匙串导出和敏感截图均不得提交 Git。
