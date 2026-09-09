# 多应用性能控制接入门禁

## 结论

中央性能控制当前只有 BabySteps 具备完整的项目注册与固定工作流合同。其他应用页面只是统一导航入口，不代表已经获得 AWS 启停能力。

任何应用在满足下列全部条件前，必须继续显示“待接入”，不得复用 BabySteps 的项目标识、资源前缀或 Evidence 冒充独立控制闭环。

## 接入矩阵

| 应用 | 中央注册表 | 固定控制工作流 | 当前状态 | 下一道 Gate |
| --- | --- | --- | --- | --- |
| BabySteps | `performance-observability-control` | `Tiancheng-Xu/babysteps/.github/workflows/aws-performance-control.yml` | 已接入，但 GitHub workflow 为 `disabled_manually` | 重新登录 AWS 后只读盘点账号、预算、共享 Foundation 与零残留；再单独授权启用 workflow，先运行 `preflight`，不得直接 `start` |
| Agent Market | 无 | 当前 `main` 无可执行控制文件 | 待接入 | 项目仓库新增兼容中央协议的固定 workflow；旧 one-shot workflow 记录不得复用 |
| Personal AI Agent | 无 | 无 AWS 控制 workflow | 待接入 | 先确认是否存在需要临时 AWS Runtime 的真实产品需求；纯本地模型不应为满足页面按钮而制造云资源 |
| GitHub Profile Studio | 无 | 无 AWS 控制 workflow | 待接入 | 先定义最小、可清理、Free-plan-compatible 的观测工作负载；普通 CI 不算控制入口 |

## BabySteps 当前生产事实

- 公开状态 API：HTTP 200。
- `controlState=stopped`。
- `cleanupVerified=true`。
- `snapshotAvailable=false`。
- R2 最新可信快照：HTTP 404，`verified_snapshot_not_found`。
- 固定 workflow 最近可见的 schedule Runs 成功，但 schedule 成功只证明安全检查或 no-op，不证明启动过 AWS Runtime。
- workflow 当前被手动禁用，因此不能把页面上的可输入 TOTP 等同于最终 dispatch 可用。

## Agent Market 历史 workflow 边界

- GitHub workflow 记录 ID `339799196` 仍存在。
- 记录路径为 `.github/workflows/aws-one-shot-performance-proof.yml`，但当前 `main` 已无该文件。
- 最近三个历史运行均来自 `tc/phase2-closure`，结论依次为 failure、failure、cancelled。
- 它不是中央控制协议，不能接收受约束的 `action / operation_id / generation / expires_at / estimated_cost_usd` 输入，也不能据此开放中央启停按钮。
- Agent Market 已有 AWS V2 verified-production Evidence 与“可由中央控制器启停”是两个不同命题，前者不能自动证明后者。

## 固定控制协议

项目接入必须同时满足：

1. 仓库、workflow 文件、GitHub Environment、AWS Region 和资源前缀均由中央 allowlist 固定，客户端不得传入任意值。
2. GitHub App 只换取短期 installation token，不保存长期 GitHub Token。
3. GitHub Actions 只通过 OIDC 获取短期 AWS 凭据，信任策略绑定精确仓库、分支与 Environment。
4. `start` 前执行预算、Free-plan eligibility、共享 Foundation 复用、并发锁与零残留 Gate。
5. 每次运行携带不可伪造的 operation ID、generation、绝对 expiry 和固定费用上限。
6. 临时资源必须有 TTL、项目标签、精确清理 owner 和独立恢复 workflow。
7. 回调使用 HMAC、时间窗、delivery ID 去重和严格 Schema；失败必须进入诚实的 degraded、failed 或 cleanup-required 状态。
8. D1 保存状态机、nonce、幂等与审计；R2 只接受 create-only 的脱敏不可变快照。
9. 只有 Stack absence、Schema/Role absence、队列排空和项目资源清单归零后，才能回到 `stopped + cleanupVerified=true`。
10. 共享 VPC、NAT、RDS、OIDC、Artifact Bucket 与身份 Foundation 始终只读保护，项目清理不得删除。

## 当前禁止项

- AWS CLI 会话尚未重新认证，禁止根据陈旧目录推断实时账号或资源状态。
- 在预算和共享资源实时盘点完成前，禁止启用或 dispatch 任何 AWS start。
- 不得把普通 CI、静态 IaC 校验、历史截图、HTTP 200 或旧 AWS Evidence 写成当前可控制状态。
- 不得为了让所有页面显示“已接入”而复制 BabySteps 项目标识、数据库状态或 R2 快照。
- 不得创建会升级或使 AWS / Cloudflare 免费计划失效的资源或套餐。

## 下一执行顺序

1. 恢复最小权限 AWS 只读身份，不使用 root 做部署。
2. 重新执行实时 Budget Guard 与共享 Foundation inventory。
3. 核对 BabySteps workflow 的 GitHub App 安装、Environment、OIDC role、callback secret 和最小日志读权限。
4. 在明确的 GitHub 写授权下仅启用 workflow，先 dispatch `preflight`。
5. `preflight` 成功且不会创建项目 Runtime 后，再单独列出 `start` 的资源、费用、TTL、回滚和保护清单。
6. Agent Market 由其项目仓库实现兼容 workflow 并独立通过相同 Gate 后，才增加中央注册项。
7. Personal AI Agent 与 GitHub Profile Studio 保持 pending，直到存在真实、合理且免费计划兼容的 AWS 使用场景。
