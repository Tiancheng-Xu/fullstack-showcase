# Stitch 家长端 UI 精确还原 — Design

## Source of Truth

1. `specs/1.nurture-bloom-mvp/PRD.md`
2. `design/stitch/1860491822987812698/README.md`
3. 每个已映射屏幕的 `source.html`
4. 每个屏幕的 `reference.png` 或 `reference.jpg`
5. 现有 V1 React 组件和交互

标题相同的旧变体不作为实现基准。使用 `design/stitch/1860491822987812698/README.md` 的“当前实现基准”表选择 Screen ID。

## Architecture

- `AppShell` 根据当前路由选择 `auth` 或 `app` 模式。Auth 模式只显示简化品牌栏；App 模式显示固定顶部栏和四项底部导航。
- 页面继续使用 TanStack Router 文件路由；Feature 内容组件位于 `src/features/nurture/`。
- `data.ts` 提供单一 Mock 资料、记录、时光、文章和疫苗数据，页面不再各自写死宝宝姓名与年龄。
- 交互状态留在页面或专用 Hook 内；本阶段刷新后不保证持久化。
- Stitch 图片复制到 `/assets/nurture-bloom/stitch/`，并通过 `stitch-assets.ts` 的稳定常量引用。

## Visual Mapping

- 画布：移动端内容基准宽度 390px，桌面最大内容宽度 768px。
- 背景：`#fbf9f1`；卡片白色；主容器 24px 左右留白。
- 主色：`#ffb347`；文字主色 `#1b1c17`；辅助蓝 `#a7c7e7`；辅助绿 `#c1e1c1`。
- 字体：Quicksand + PingFang SC / Microsoft YaHei UI。
- 顶部栏 64px，底部导航 64px，并叠加 Safe Area。
- 卡片圆角 24–32px，输入框 16px，按钮使用全圆角。
- Shadow 使用低透明度暖色环境阴影；不使用强描边替代层级。

## Local Asset Names

| Public Path | Stitch Asset |
| --- | --- |
| `/assets/nurture-bloom/stitch/logo.jpg` | `6b9a13a86d32d6c7.jpg` |
| `/assets/nurture-bloom/stitch/register-sprout.jpg` | `908d19e3b9e1fdf0.jpg` |
| `/assets/nurture-bloom/stitch/onboarding-baby.jpg` | `babf93420ce792c3.jpg` |
| `/assets/nurture-bloom/stitch/baby-profile.jpg` | `d3aaadf871baaddd.jpg` |
| `/assets/nurture-bloom/stitch/growth-food.jpg` | `0981d39f64d2aabb.jpg` |
| `/assets/nurture-bloom/stitch/moment-laughing.jpg` | `301be15fb69a90aa.jpg` |
| `/assets/nurture-bloom/stitch/moment-hands.jpg` | `065acf81e9660996.jpg` |
| `/assets/nurture-bloom/stitch/moment-six-months.jpg` | `b3bc511c819535d6.jpg` |
| `/assets/nurture-bloom/stitch/moment-lullaby.jpg` | `3be9b01d6d8e6674.jpg` |
| `/assets/nurture-bloom/stitch/moment-crawling.jpg` | `bd37edd2b042b40b.jpg` |
| `/assets/nurture-bloom/stitch/article-feeding.jpg` | `c315d878c13af5c0.jpg` |
| `/assets/nurture-bloom/stitch/profile-mother.jpg` | `402ee49daf63113c.jpg` |
| `/assets/nurture-bloom/stitch/profile-baby.jpg` | `aa2868f26803841e.jpg` |
| `/assets/nurture-bloom/stitch/edit-baby.jpg` | `9c722c12d44e2510.jpg` |

## Route Behavior

- `/` 重定向 `/login`，以便演示完整家长入口。
- Auth 页的本地成功动作：
  - 登录成功 → `/growth`
  - 注册成功 → `/onboarding`
  - 建档成功 → `/growth`
- App 页保留四个一级导航；详情页顶部提供返回按钮，底部导航继续存在。
- 删除记录和退出使用可访问 Modal；Escape、关闭按钮和背景均可关闭。

## Test Strategy

- 组件行为：Testing Library + `userEvent`。
- 路由 Chrome：测试 `AppShell` 在 Auth/App 路由模式下的输出。
- 页面行为：直接渲染 Feature 组件并断言真实文本、状态和列表变化。
- 视觉：开发服务器 390px 自动截图 + Stitch 参考图人工差异检查。
- 回归：Vitest、Vite/TypeScript 构建。
