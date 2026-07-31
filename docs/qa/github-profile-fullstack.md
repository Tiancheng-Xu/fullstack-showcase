# GitHub 个人资料全栈作业验收记录

作业 ID：`AI-FULLSTACK-GITHUB-PROFILE`

## 当前结论

- 本地实现：✅ 已完成自动化验证。
- 本地可视验收：✅ 2026-07-31 已在 Codex 内置浏览器完成读取、编辑、保存、刷新恢复、幂等保存与安全错误检查。
- AWS 迁移：⏳ 后续专题完成 SAM、VPC、IAM 和云端验证。
- Go 本地迁移：✅ 2026-07-31 已完成完整兼容 API、共享 Drizzle 迁移、SQLite 仓储和内置浏览器验收。
- Go 云原生部署：⏳ ECR、ECS、ALB、Fargate 与 Cloud Map 留待后续专题。

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

Go 版本保留相同边界，并与 Hono 并存：

```text
React /api
  -> Hono :3000（保留）
  -> Go net/http :3002（本地迁移）
      -> macOS 钥匙串
      -> GitHub GET /user
      -> database/sql + modernc SQLite
      -> 同一个 github_profiles 表和 __drizzle_migrations 账本
```

## 自动化证据

截至 2026-07-31：

- API：8 个测试文件、31 项测试通过；
- Web：5 个测试文件、20 项测试通过；
- Go：43 个顶层测试及其子测试通过，竞态检测通过；
- 结构与密钥边界：15 项测试通过；
- API 与 Web TypeScript 类型检查通过；
- API ESM 构建与 Web Vite 生产构建通过；
- Drizzle 迁移一致性检查通过；
- Biome 检查通过；
- Web 构建已生成 `homework.github-profile` 独立路由包。
- Go `go vet`、gofmt 门禁与独立二进制构建通过；
- Node 与 Go 迁移器双向复用真实 SQLite 文件均通过，迁移账本始终为三条；
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

根命令已经包含 Go 门禁；也可单独运行：

```bash
pnpm test:go
pnpm typecheck:go
pnpm build:go
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

## Go 本地迁移验收

### 迁移与接口

- [x] Go 1.26 使用 CGo-free `modernc.org/sqlite`；
- [x] Go 默认仅监听 `127.0.0.1:3002`，避免携带本机钥匙串能力的课程服务意外暴露到局域网；
- [x] Go 直接读取现有 `apps/api/drizzle` 三份 SQL，复现目录顺序、statement breakpoint、SHA-256、UTC 时间戳和 `__drizzle_migrations` 账本；
- [x] Node 先迁移后由 Go 接管、Go 先迁移后由 Node 接管的真实跨运行时测试均通过；
- [x] 空库迁移、重复迁移、Drizzle 已有账本识别、哈希冲突拒绝和失败事务回滚均有测试；
- [x] `GET /health` 在 3002 返回 200 和 `{"status":"ok"}`；
- [x] Go 实现 `/api/github/me`、GET/POST `/api/github-profile`，JSON 与安全错误码保持一致；
- [x] Hono 与 Go 均把数据库失败映射为 500 `PERSISTENCE_FAILED`；
- [x] `API_PROXY_TARGET` 只用于 Vite 服务端代理配置，不使用 `VITE_` 前缀，不进入浏览器代码。
- [x] 独立代码审查发现的并发 upsert 返回漂移、GitHub 必填字段缺失、日志换行注入和钥匙串输出无流式上限均已加入先失败后通过的回归测试；姓名与简介裁剪语义也与 JavaScript 对齐。

### Codex 内置浏览器观察

- [x] 仅使用 Codex 内置浏览器打开 `http://localhost:3001/homework/github-profile`，未切换 Chrome；
- [x] 初始状态显示“尚未保存 GitHub 资料”，密码输入框为 0，正文无 Token 字样；
- [x] 通过 Go 3002 读取 `@Tiancheng-Xu` 成功，页面显示当时 GitHub 返回的 0 个公开仓库、0 位关注者和创建日期；
- [x] 临时编辑为 `徐天成（Go 验收）`、`Go API 本地迁移验收`，保存后刷新仍恢复相同值；
- [x] 不改字段再次保存，SQLite 查询仍为一行，迁移账本为三条；
- [x] 使用不存在的非敏感 `KEYCHAIN_SERVICE` 重启 Go 后，页面只显示“尚未在系统钥匙串中保存 GitHub 访问凭据”，未显示命令路径、退出码或令牌前缀；
- [x] 恢复默认服务名后再次读取成功；最终把资料恢复为原值 `徐天成`、`学习用`，保存并刷新确认；
- [x] 本地开发进程和本次新建的内置浏览器验收标签页均已正常关闭。

### 实施复盘

- Go HTTP 测试曾把 typed nil `*bytes.Buffer` 传入 `io.Writer`，导致测试日志写入崩溃；测试辅助函数现显式转换真正的 nil，避免接口 nil 陷阱。
- 直接 `go build ./cmd/server` 曾产生源码目录二进制；构建命令现固定写入被忽略的 `apps/api-go/.build/`，根构建门禁复验无工作区污染。
- Vite 配置首次未符合 Biome 单行格式；项目既有 `pnpm check` 已准确拦截，使用项目格式器修复后全量门禁重新通过。
- 最终验证首次从 `apps/api-go` 目录调用 pnpm，导致验证范围意外缩小为 Go 包；最终命令固定从仓库根目录运行，并用 `go -C apps/api-go test -race ./...` 保持 Go 模块定位，不再切换 pnpm 的工作区范围。
- 独立审查指出本地服务默认监听所有网卡会扩大钥匙串能力边界；默认地址现固定为回环地址，显式主机覆盖需通过配置校验，未知路径日志只记录静态 `<unmatched>` 标识，避免控制字符伪造日志行。

这些问题分别增加了回归保护或确定性构建路径；没有把一次性业务错误扩写成不必要的全局流程规则。

## 本地清理

撤销 GitHub 令牌并删除钥匙串项目后，删除本地数据库：

```bash
rm apps/api/data/github-profile.sqlite
```

数据库、WAL 文件、环境文件、日志、钥匙串导出和敏感截图均不得提交 Git。
