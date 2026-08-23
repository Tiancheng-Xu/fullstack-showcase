# 分布式 Evidence 迁移与旧项目退役设计

日期：2026-08-23

## 目标

不再把 Evidence 作为独立作品项目。每个已部署应用在自己的生产域名提供 `/evidence/`，并固定提供“作品集首页 / 项目主页 / 工作证明”三向导航。没有独立站点的 Skill、同步服务和内部控制能力由 `baby2b.online` 承载 Evidence 页面。

原 `baby2b-online-deployment-evidence` 中的正文、架构图、证据截图、资产摘要、限制和来源提交全部迁移并验收后，删除本地仓库、GitHub 远端仓库和 Cloudflare Pages 项目。

## 项目映射

| 原案例 | 新主页面 | 内容归属 |
| --- | --- | --- |
| BabySteps | `https://babysteps.baby2b.online/evidence/` | BabySteps 仓库 |
| Static-First Delivery | `https://babysteps.baby2b.online/evidence/` | 合并为 BabySteps 的渲染交付章节，不再作为独立项目 |
| Personal AI Agent | `https://personal-ai-agent.baby2b.online/evidence/` | Personal AI Agent 仓库 |
| Agent Market | `https://agent-market.baby2b.online/evidence/` | Agent Market 仓库现有页面 |
| GitHub Profile Studio | `https://baby2b.online/evidence/github-profile-studio/` | Dashboard 仓库，直至项目独立部署 |
| Portfolio Sync | `https://baby2b.online/evidence/portfolio-sync/` | Dashboard 仓库 |
| TC Flow | `https://baby2b.online/evidence/tc-workflow/` | Dashboard 仓库 |
| 性能观测与成本控制 | `https://baby2b.online/evidence/performance-observability-control/` | Dashboard 仓库 |

## 导航契约

每个 Evidence 页面必须提供三个真实链接：

1. 作品集首页：`https://baby2b.online/dashboard/`
2. 项目主页：对应项目生产主页；内部能力指向对应 Dashboard 项目页或控制页
3. 工作证明：当前 Evidence URL，并使用 `aria-current="page"`

Dashboard 卡片不得再指向 `evidence.baby2b.online`。独立 Evidence Hub 项目卡从 Dashboard 删除。

## 内容迁移原则

- 原案例正文按项目归属迁移，不压缩成只有标题和链接的占位页。
- 架构图、时序图和截图复制到目标仓库，并保留 SHA-256、字节数、替代文本和来源提交。
- 相同资产按摘要去重；项目已有更完整内容时合并章节，不覆盖更真实的新证据。
- `verified`、`implemented`、`pending`、`unverified` 状态原样保留，禁止因迁移升级状态。
- 不迁移私有路径、凭据、内部端点、账户标识、模型权重或原始私人数据。
- 所有架构图和证据图片继续支持站内全屏预览。

## 旧链接兼容

`evidence.baby2b.online` 不再由独立 Evidence 项目提供内容。迁移后把该自定义域名转移给 `fullstack-showcase`，由静态重定向规则返回永久跳转：

- `/babysteps/*`、`/static-first-delivery/*` → BabySteps `/evidence/`
- `/personal-ai-agent/*` → Personal AI Agent `/evidence/`
- `/agent-market/*` → Agent Market `/evidence/`
- `/github-profile-studio/*`、`/portfolio-sync/*`、`/tc-workflow/*` → Dashboard 对应 Evidence
- `/` → `https://baby2b.online/dashboard/`

重定向必须保留 HTTPS，不形成循环；验收同时检查状态码、最终 URL 和页面语义。

## 实施顺序

1. 冻结源仓库提交 SHA，生成案例、资产和摘要清单。
2. 先迁移 Personal AI Agent，并补项目内 `/evidence/`。
3. 合并 BabySteps 与 Static-First 内容，修正项目内 Evidence 返回入口。
4. 核对 Agent Market 现有 Evidence，统一返回 Dashboard 链接。
5. 把 GitHub Profile Studio、Portfolio Sync、TC Flow 内容迁入 Dashboard。
6. 更新 Dashboard 项目索引，移除 Evidence Hub 卡片和所有旧 Evidence 主链接。
7. 分项目执行测试、类型检查、构建、深链、404、响应式、图片摘要、公开内容和双向导航 Gate。
8. 依次发布项目 Preview；通过后发布各项目生产站和 Dashboard。
9. 把 `evidence.baby2b.online` 转移到 Dashboard 项目并验证全部永久跳转。
10. 生成最终迁移清单，证明原 6 个案例和全部资产均有目标位置。
11. 删除 Cloudflare `baby2b-evidence` Pages 项目、GitHub `baby2b-online-deployment-evidence` 仓库、本地仓库及其工作树。

## 删除 Gate

以下条件全部通过前不得删除源项目：

- 6 个原案例均有唯一目标页面，Agent Market 现有 Evidence 也通过互链检查。
- 目标页面 JavaScript 禁用时仍有可读标题和摘要，启用后可交互。
- 375、390、430、1440、1920 宽度无根级横向滚动，触控目标不小于 44px。
- 所有迁移资产摘要与源清单一致，公开内容扫描无凭据、私有路径和个人信息。
- Dashboard 静态索引与水合后链接一致，不存在空链接或回退到 `/dashboard` 的伪 Evidence。
- 旧 URL 全部返回 301/308 并到达语义正确的新页面。
- Cloudflare Production、custom domain、GitHub Actions 和公开读回通过。
- 目标仓库记录源仓库最后提交 SHA、迁移映射和限制。

## 回滚

删除前保留原项目运行不变；任何目标页面或重定向失败均停止删除。域名迁移失败时立即把自定义域名重新绑定原 Pages 项目。源项目一旦删除，不再依赖回滚，因此删除只能发生在最终迁移清单和生产读回全部通过之后。
