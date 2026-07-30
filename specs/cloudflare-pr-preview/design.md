# Cloudflare PR Preview Design

完整设计见：

- `docs/superpowers/specs/2026-07-29-cloudflare-pr-preview-design.md`

核心决策：

- 使用一个稳定的 Pages 测试项目 `course-homework-preview`，优先实现最小可视环境。
- 同仓库 PR 和手动触发均可运行测试、类型检查、构建与部署。
- Fork PR 不执行部署，因此无法读取 Cloudflare Secrets。
- GitHub Actions 使用仅有当前账户 Pages Write 权限的 API Token。
- 生产发布保留为后续独立工作流和独立 Pages 项目，必须由人工触发和审批。
