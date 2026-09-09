# 作品集路由导航设计

## 目标

把顶部导航从“当前 Dashboard 内跳锚点”升级为真正的页面级导航，同时保持现有项目事实、撕纸玻璃视觉和项目自有 Evidence 边界不变。

## 路由合同

| 导航项 | 路由 | 职责 |
| --- | --- | --- |
| 作品集首页 | `/dashboard` | 个人简介、核心能力、代表项目和性能摘要 |
| 项目 | `/projects` | 全部项目的可筛选索引、状态、架构、技术栈和项目入口 |
| 工作证明 | `/evidence` | Evidence 导航索引，仅汇总并跳转到每个项目自己的 Evidence 页面 |

`/evidence/:projectId` 和 `/performance-control/:projectId` 保持现有合同。新增索引页不得创建新的中央 Evidence 内容副本。

## 信息架构

顶部导航只承担页面切换，不再包含 `#about`、`#skills`、`#projects` 等页内锚点。Dashboard 的移动端快捷导航继续承担页内目录职责，并使用明确的中文标签。

三个页面必须从 `PORTFOLIO_PROJECTS` 和现有同步合并逻辑读取项目事实。状态、进度、链接、技术栈和 Evidence 地址不得在新页面中复制为独立常量。

## 组件边界

- `PortfolioPrimaryNavigation`：统一渲染顶部三个页面路由，依据当前路径设置 `aria-current="page"`。
- `ProjectIndexPage`：从共享项目数据生成项目索引，不承担 Evidence 正文。
- `EvidenceIndexPage`：展示项目 Evidence 可用性和目标链接；缺少 Evidence 时诚实标记，不伪造完成状态。
- Dashboard 保留现有项目卡和个人简历内容，但顶部不再执行页内滚动。

共享导航由一个组件维护，Dashboard、项目索引和 Evidence 索引不得分别硬编码三套链接。

## 视觉合同

新增页面复用 `DESIGN.md` 和 `docs/design/torn-glass-project-direction.md`：宣纸背景、撕纸边缘、随背景着色的半透明玻璃、藏青正文和克制朱砂强调。顶部布局保持当前已确认结构，不重新设计品牌、印章或尺寸。

桌面端使用分层网格；375、390、430 像素下改为单列，触控目标不小于 44 像素，不允许根级横向溢出。

## 数据流与降级

1. SSR 使用静态 `PORTFOLIO_PROJECTS` 生成可读首屏。
2. Hydration 后尝试加载同步索引并通过现有 `mergePortfolioProjects` 合并。
3. 同步失败时保留静态项目索引，不显示伪错误状态。
4. 外部项目或 Evidence 链接保持普通 `<a>`，站内页面路由使用 TanStack Router `Link`。

## 路由与错误处理

- `/dashboard`、`/projects`、`/evidence` 必须支持 SSR/静态预渲染并返回可读 HTML。
- 未知路由在 Cloudflare Pages 语义 Gate 中必须保持真实 404。
- Evidence 链接为空时显示“尚无公开工作证明”，不得生成失效 URL。
- 外部链接保留安全的 `rel="noreferrer"`；新标签仅用于明确的外部目标。

## 验收 Gate

- 导航合同测试：三个顶部导航目标是独立路由，不含 Dashboard 页内锚点。
- 数据单一来源测试：项目和 Evidence 索引由共享项目数据生成。
- SSR 测试：三个路由首屏包含对应标题和项目链接。
- 路由测试：站内导航可达，未知路由保持 404 合同。
- TypeScript、全量 Web 测试、客户端构建、SSR 构建和预渲染全部通过。
- 375、390、430、1440 像素检查无根级横向溢出、无 `pageerror`。
- 用户人工审阅后再建立或更新视觉回归基线，禁止盲目批准像素差异。

## 非目标

- 不改变项目数量、状态、进度或生产验证等级。
- 不迁移或复制项目 Evidence 正文。
- 不修改 AWS、GitHub App、Cloudflare 发布或性能采集逻辑。
- 本地视觉确认前不推送、不发布。

## 架构图与文本布局工具

- 非 Skill 项目使用 Archify 的 Architecture 模式生成经过 schema/layout 校验的自包含静态 HTML，并在 `/evidence` 中延迟加载。图的事实输入仅来自当前审核项目架构字段，不据此升级验证状态。
- Skill/工作流类项目不生成虚假的系统运行时图，改为说明节点合同、Gate、Checkpoint 和 RunResult。
- Pretext 仅在 Canvas/SVG 手动文本流、虚拟列表或动态高度预计算等确实需要绕开 DOM reflow 的模块中使用。普通 Evidence 卡片继续使用浏览器原生 CSS 文本排版，避免无收益的运行时依赖。
