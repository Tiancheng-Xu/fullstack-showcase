# Cloudflare PR Preview Requirements

## Goal

为 `course-homework` 建立由 GitHub Actions 驱动的 Cloudflare Pages PR 预览环境，同时保留独立、受人工控制的生产发布环节。

## Requirements

- 同仓库 Pull Request 在创建、重新打开或更新时自动执行质量检查并发布预览。
- 所有同仓库 PR 更新同一个最小化 Cloudflare Pages 预览项目。
- 预览地址固定为 `https://course-homework-preview.pages.dev`。
- Fork PR 不得接触 Cloudflare 凭据。
- Cloudflare 令牌与账户标识仅存储在 GitHub Actions Secrets 中。
- 当前流程不得触发生产部署、修改生产域名或覆盖生产项目。
- 文档需要清楚区分预览发布与生产发布。

## Acceptance

- 工作流静态验证通过。
- Web 应用的测试、类型检查和生产构建通过。
- 测试 PR 的 GitHub Actions 成功。
- 测试 PR 自动刷新可访问的固定 `pages.dev` 预览地址。
- 生产发布仍是独立、人工控制的后续环节。
