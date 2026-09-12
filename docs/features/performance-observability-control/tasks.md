# 性能观测控制任务

- [x] T-001：定义状态机、快照契约与回退策略，并用失败测试锁定行为。
- [x] T-002：实现 Dashboard / Evidence 共享性能状态卡、历史快照和控制入口。
- [x] T-003：把交付要求映射、完整架构、时序、Actions、预览/灰度、权限、成本和清理写入 Evidence。
- [x] T-004：实现 Cloudflare Worker 的 D1 状态、R2 不可变快照、TOTP 鉴权、幂等控制和公开投影。
- [x] T-005：实现固定 GitHub Actions 启停、TTL 恢复、AWS 预算门禁与精确清理。
- [ ] T-006：完成单元、集成、构建、类型、链接、响应式、敏感内容和一次真实云闭环验证。
  - [x] Worker 单元与集成测试：10 个测试文件、90 项通过（2026-09-12）。
  - [x] Web 回归测试：29 个测试文件、85 项通过（2026-09-12）。
  - [x] Worker 与全工作区 TypeScript 检查通过（2026-09-12）。
  - [x] 生产只读状态：`stopped + historical + cleanupVerified=true`。
  - [x] Run `34684132902` 已证明预算守卫会拒绝过期 ECS 例外；AWS 被封后重新禁用固定工作流。
  - [ ] [AWS 恢复后] 重新批准临时 ECS 例外，完成 GitHub OIDC / AWS 只读 `preflight`。
  - [ ] [AWS 恢复后] 通过 TOTP 完成一次 start -> snapshot -> stop/TTL -> zero-residue 生产闭环。
  - [ ] [AWS 恢复后] 将 R2 最新可信快照读回为 HTTP 200，并验证 AWS 零残留与共享资源未变。
  - [x] [非 AWS] 完成链接、响应式与敏感内容最终发布 Gate：Evidence 深链入口已修复，390/1440 零横向溢出，公开链接与构建产物已核对。
