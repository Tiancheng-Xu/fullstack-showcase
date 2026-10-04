# Stitch 家长端 UI 精确还原 — Requirements

## Goal

直接更新现有 V1 React 应用，使家长端页面以 Stitch 项目 `1860491822987812698` 的 `2026-07-31T05:52:49.662094Z` 快照为视觉和结构基准，并补齐快照中已经存在的流程页面。

## In Scope

- 只修改家长端 H5，不生成或展示课程实验页面。
- 复用现有 React、TanStack Router、Tailwind、Vitest 和 Testing Library。
- 直接修改现有 V1，不建立 V2 副本。
- 使用本地 Mock 数据；本 Feature 不接入 Hono、Go、数据库或真实媒体上传。
- 实现并连接以下路由：
  - `/login`
  - `/register`
  - `/onboarding`
  - `/growth`
  - `/growth/records`
  - `/vaccines`
  - `/moments`
  - `/moments/$momentId`
  - `/guide`
  - `/guide/$articleId`
  - `/me`
  - `/me/baby`
- 把 Stitch 图片资产复制到 Web `public` 目录，产品代码不得依赖 Stitch 远程 URL。
- 演示宝宝统一为“金金”，生日 `2026-01-16`；年龄文本从同一 Mock Profile 派生或统一读取。
- 保留添加成长记录、百科搜索/分类、时光收藏、提醒开关、退出确认等本地交互。

## Out of Scope

- 后端 API、认证持久化、数据库、对象存储、AWS 和生产部署。
- GitHub/Hono 课程实验页面。
- 真实账号、真实照片上传、家庭邀请和医疗判断。
- Stitch 中尚未设计的所有错误/空状态的视觉生成；本 Feature 只实现已有屏幕和必要的可访问降级状态。

## Acceptance Criteria

1. 未登录入口页 `/login`、`/register` 和 `/onboarding` 不显示家长端顶部栏与底部导航。
2. 登录、注册和建档表单具有标签、错误提示、提交状态和可运行的本地成功跳转。
3. `/growth` 使用“金金”资料并还原身高、体重、里程碑、疫苗和今日记录；可以打开记录类型选择。
4. `/growth/records` 展示四类记录筛选，支持打开并确认删除；删除后记录从当前列表移除。
5. `/vaccines` 展示完成/待完成状态、提醒开关、来源和固定医疗免责声明。
6. `/moments` 使用本地 Stitch 照片；收藏可切换；点击主卡进入 `/moments/$momentId`。
7. `/guide` 支持关键词与分类联合过滤；精选文章可进入 `/guide/$articleId`，详情显示来源、更新时间和免责声明。
8. `/me` 不再显示会员和收费云盘；支持提醒开关、编辑宝宝资料和退出确认；`/me/baby` 可本地保存资料。
9. 320px 以上无页面级横向滚动；390px 页面布局与最新 Stitch 快照一致；桌面端使用居中的移动内容列。
10. 所有新增交互通过 Testing Library；`pnpm test`、`pnpm typecheck` 和 `pnpm build` 通过。

## Evidence

- 每个 Task 的 RED/GREEN 测试输出。
- 390px 的登录、成长、记录、时光、百科和我的页面截图。
- 最终测试、类型检查、构建命令和退出码。
- `docs/qa/stitch-parent-ui-refresh/` 下的验收记录。
