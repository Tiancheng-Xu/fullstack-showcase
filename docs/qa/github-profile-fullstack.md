# GitHub 个人资料全栈作业验收记录

作业 ID：`AI-FULLSTACK-GITHUB-PROFILE`

## 当前结论

- 本地实现：✅ 已完成自动化验证。
- 本地可视验收：⏸ Codex 内置浏览器执行通道未连接，尚未验收。
- AWS 迁移：⏳ 后续专题完成 SAM、VPC、IAM 和云端验证。
- Go 迁移：⏳ 在本地 JavaScript 链路完整验收后继续。

以上状态相互独立。本记录不能作为 AWS 已完成的证据，也不能在缺少可视检查时宣称本地闭环完全完成。

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
- 权限目标：无仓库权限、无组织权限、无写权限
- 令牌值：禁止记录
- 过期日期：尚未在图形界面创建，待可视验收时补充
- GitHub 撤销入口：Developer Settings → Personal access tokens → Fine-grained tokens
- 本机删除入口：钥匙串访问 → 搜索项目名称 → 删除

## 待完成的内置浏览器验收

- [ ] 打开 `http://localhost:3001/homework/github-profile`；
- [ ] 页面不存在令牌或密码输入框；
- [ ] 读取后显示 `Tiancheng-Xu` 与白名单字段；
- [ ] 编辑显示名称和简介并保存，出现“资料已保存”；
- [ ] 刷新页面后恢复数据库记录；
- [ ] 重复保存后数据库仍只有一行；
- [ ] 临时改名钥匙串项目时只出现安全错误，不显示令牌、堆栈或系统输出；
- [ ] 恢复钥匙串项目名称。

完成以上检查后，将 `HOMEWORKS.md` 的“本地可视验收”改为 ✅，并在本节记录观察结果与令牌过期日期，但绝不记录令牌值或敏感截图。

## 本地清理

撤销 GitHub 令牌并删除钥匙串项目后，删除本地数据库：

```bash
rm apps/api/data/github-profile.sqlite
```

数据库、WAL 文件、环境文件、日志、钥匙串导出和敏感截图均不得提交 Git。
