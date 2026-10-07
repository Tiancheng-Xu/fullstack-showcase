# OSS 状态刷新

Dashboard 和 `/open-source/` 共用 `open-source-data.ts` 的人工审核修复描述，以及 `open-source-status.json` 的 GitHub 核验快照。

Portfolio Sync 只收录作者自有、非 fork 的项目发布清单，**不刷新外部 OSS PR**。其同步时间不能代表 OSS 状态新鲜度。

每轮 OSS 跟进及发布作品集前，在仓库根目录运行：

```sh
pnpm oss:refresh
pnpm test
pnpm typecheck
pnpm build
```

刷新需要已登录的 GitHub CLI。它只读取人工收录的真实 PR 链接，核验作者为 Tiancheng-Xu，并取得状态、草稿标志、合并时间和仓库 stars。任何请求失败、数据缺失或作者不符时保留原快照，不发布部分结果。不扫描或自动收录其他人的 PR。

新贡献需先核验公开 PR 与 Issue，再在人工索引补充准确描述，随后刷新快照。未公开代码、候选、认领及等待执行的 CI 不算已交付贡献。已关闭未合并的 PR 不计入 merged/open；低于 1,000 stars 的历史记录保留在源索引但不公开展示。

两处页面显示快照核验时间，不声称实时更新。状态更新仍需正常的测试、审核、PR 和 Git 集成 Pages 发布；刷新快照不等于已上线。不可绕过发布门禁，也不可通过项目清单同步时间推断 OSS 已更新。
