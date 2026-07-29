# Nurture Bloom UI Foundation

## Decisions

- 保留 Better-T-Stack 生成的嵌套工作区，根命令只负责委托，避免手工拆散生成结构。
- 第一阶段严格使用本地类型化状态；页面组件不直接依赖 AWS SDK，为后续 API 替换保留边界。
- Stitch DESIGN.md 的颜色、圆角、阴影和间距集中映射到 Tailwind v4 语义令牌。
- 应用壳、导航、弹窗、状态标签、区块标题和浮动按钮抽为复用组件。
- 四个页面使用 TanStack Router 文件路由，根路径跳转到成长页。

## Reusable lessons

- Better-T-Stack 3.38.0 使用 `create-json --json`，显式配置时不要同时传 `yes: true`。
- Vite 配置需要从 `vitest/config` 引入 `defineConfig`，测试字段才能通过 TypeScript。
- 弹窗遮罩不能设置 `aria-hidden=true`，否则内部 dialog 会从无障碍树中消失。
- Testing Library 的全局 setup 应在每个测试后 cleanup，避免跨测试 DOM 污染。
- TanStack Router 的 typed Link 需要路由先存在；路由文件生成后再接入 typed navigation。
- 固定导航和超大圆角卡片应在 390px 与桌面宽度都做真实浏览器检查。

## Recovery notes

- 活跃工作树：`.tc-worktrees/nurture-bloom-ui-foundation-3f7ba54d`
- Better-T-Stack 应用：`apps/web/apps/web`
- 全局主题：`apps/web/packages/ui/src/styles/globals.css`
- 所有远程推送与生产部署均不在本 Feature 范围内。
