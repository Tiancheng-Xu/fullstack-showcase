# 性能控制调度就绪 Gate 设计

## 背景

当前生产控制状态为 `stopped + cleanupVerified=true`，TOTP 限流状态也已清空，但 BabySteps 的 GitHub workflow 当前是 `disabled_manually`。用户仍能看到 TOTP 输入界面，只有在后续 dispatch 阶段才会失败。

这会把两个不同问题混在一起：

- **身份验证**：输入者是否持有正确的共享 TOTP。
- **调度就绪**：固定 GitHub workflow 是否存在、启用并能接受控制请求。

TOTP 类似门锁钥匙，workflow readiness 类似机房电源。钥匙正确不代表机器已经通电。系统必须先显示“机器是否可启动”，再让用户使用钥匙。

## 目标

1. 在用户输入 TOTP 前展示真实调度就绪状态。
2. workflow 被暂停、删除、移出默认分支或 GitHub App 无权限时，启动按钮保持禁用并给出精确原因。
3. 公共状态查询不直接调用 GitHub，不把 GitHub App token 暴露给浏览器。
4. `start` 在改变 D1 状态前重新执行一次服务端 readiness 检查，避免缓存竞态。
5. readiness 失败不得生成 AWS Runtime、不得进入 `cleanup_required`，因为此时尚无云资源需要清理。
6. stop/recovery 路径不受 readiness Gate 阻断；安全清理永远优先于启动可用性。

## 非目标

- 不在中央 Worker 中接收任意 repository、workflow、ref 或 AWS 资源名。
- 不自动启用被人工暂停的 GitHub workflow。
- 不用普通 CI 成功替代控制 workflow readiness。
- 不把已有 AWS Evidence 自动升级为“可由中央控制器启停”。
- 不在本设计中新增 Agent Market、Personal AI Agent 或 GitHub Profile Studio 的注册项。

## 状态模型

新增独立的调度就绪状态，不复用 AWS Runtime 的 `controlState`：

```text
unknown
  -> checking
  -> ready
  -> workflow_disabled
  -> workflow_missing
  -> app_unavailable
  -> permission_denied
  -> stale
```

公共状态只返回稳定状态，不暴露 GitHub 响应正文、installation ID、JWT、Token 或私有错误栈。

建议响应片段：

```json
{
  "dispatchReadiness": {
    "state": "workflow_disabled",
    "checkedAt": "2026-09-04T00:00:00.000Z",
    "freshUntil": "2026-09-04T00:05:00.000Z",
    "reason": "fixed_workflow_not_active"
  }
}
```

## 深模块边界

### Project Registry

每个项目静态声明：

- GitHub owner/repository。
- 默认分支。
- 固定 workflow path。
- GitHub Environment。
- AWS Region。
- AWS 资源前缀。
- 最大运行时长与固定增量费用上限。

这些字段只能来自服务端 allowlist，客户端 project ID 只用于选择已注册记录。

### GitHub Readiness Probe

使用 GitHub App 私钥生成短期 App JWT，再换取短期 installation token，依次验证：

1. App 对目标仓库仍有安装。
2. Actions workflow API 能按注册表中的固定文件名解析 workflow，并返回匹配的固定路径。
3. Actions workflow API 返回 `state=active`。
4. installation token 对 Actions workflow dispatch 具备最小权限；只读探测不额外申请 Contents 权限。

Probe 只执行 GET；不得自动 enable、dispatch 或修改仓库设置。

### D1 Readiness Cache

D1 保存：

- `project_slug`。
- readiness state。
- 脱敏 reason code。
- checked/fresh timestamps。
- probe generation。

不保存 GitHub JWT、installation token、私钥、原始 GitHub 错误正文或 installation ID。

### Public Status

`GET /api/performance/status` 只读 D1 缓存，不同步访问 GitHub。缓存过期时返回 `stale`，启动按钮 fail-closed；公开状态仍保持可读。

### TOTP Session

请求顺序：

```text
Origin check
  -> registry check
  -> cached readiness == ready
  -> TOTP rate-limit check
  -> TOTP verify
  -> issue one-time nonce
```

readiness 不可用时不消费失败次数，也不签发 nonce。

### Start Command

启动顺序：

```text
nonce + origin + idempotency validation
  -> live GitHub readiness recheck
  -> D1 compare-and-swap to starting
  -> fixed workflow dispatch
  -> record operation
```

如果 live readiness 在 CAS 前失败：

- 返回 `409 control_not_ready` 或 `503 github_control_unavailable`。
- D1 Runtime state 保持 `stopped`。
- nonce 可按安全策略作废，避免重放。
- 不进入 `cleanup_required`。

GitHub dispatch 使用当前返回 Run 详情的 API 合同：

- 不立即重发。
- 只有收到并校验 `workflow_run_id` 才把请求视为已受理。
- 响应丢失或缺少 Run ID 时进入 degraded 并禁止新 start；不能用时间窗口猜测某个 Run 属于本次 operation。
- 后续只允许同 operation/generation 的签名回调收口；`stopped` 必须同时证明 cleanup 与 zero-residual。

### Stop / Recovery

停止与恢复不能依赖普通 readiness Gate：即使 workflow 被禁用，也必须保留显式的安全恢复入口。若固定 stop workflow 不可用，操作员只能通过已有 recovery workflow 和精确资源清单执行 fail-closed 清理。

## 前端行为

| readiness | 启动按钮 | TOTP 输入 | 用户文案 |
| --- | --- | --- | --- |
| ready | 可用 | 可用 | 控制入口已就绪 |
| checking | 禁用 | 禁用 | 正在确认固定工作流 |
| workflow_disabled | 禁用 | 禁用 | GitHub 控制工作流已暂停 |
| workflow_missing | 禁用 | 禁用 | 默认分支缺少固定控制工作流 |
| app_unavailable | 禁用 | 禁用 | GitHub App 当前不可用 |
| permission_denied | 禁用 | 禁用 | GitHub App 权限不足 |
| stale / unknown | 禁用 | 禁用 | 就绪状态过期，禁止启动 |

停止按钮只由 Runtime 状态决定。只要存在 starting、running、degraded、failed 或 cleanup-required 状态，停止/恢复入口必须优先显示。

## 确定性 Gates

1. Registry 拒绝未注册项目与客户端传入的 repository/workflow/ref。
2. readiness probe 覆盖 active、disabled、missing、404 installation、403 permission、timeout 和 malformed response。
3. 公共状态不包含 Token、JWT、installation ID、私钥、GitHub 原始错误或 AWS ARN。
4. readiness 非 ready 时不调用 TOTP verifier、不增加失败计数、不签发 nonce。
5. start live recheck 失败时不修改 Runtime state、不创建 operation、不 dispatch。
6. dispatch 接受后网络不确定时不重复提交相同 operation。
7. stop/recovery 不被 readiness Gate 阻断。
8. 375/390/430/1440 显示原因且按钮状态可读；无横向溢出、无 pageerror。
9. Worker test、typecheck、D1 migration、dry-run deploy、Web test/typecheck/build 全部通过。
10. 生产只读回读先证明 readiness，再由用户单独授权 enable workflow；enable 后先运行 `preflight`，不得直接 start。

## 当前事实与迁移策略

- BabySteps registry 已存在，但 workflow 当前 `disabled_manually`，初始 readiness 应为 `workflow_disabled`。
- D1 当前 generation 7，Runtime 为 stopped，清理已验证，无 snapshot pointer。
- 当前 TOTP rate-limit scope 数为 0，不能把历史验证码错误继续显示为锁定。
- 历史 operations 中有 2 次 `dispatch_failed_no_workflow_run` 和 3 条旧 pending start；它们作为审计记录保留，不等同于当前 active operation。
- callback deliveries 有 applied 与 failed 历史记录，迁移不得覆盖或删除。
- 上线前先部署只读 readiness 字段和禁用 UI；确认生产语义后，再单独决定是否重新启用 GitHub workflow。
