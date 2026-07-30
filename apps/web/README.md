# 育爱成长（Nurture Bloom）

以 Stitch 交付的 Nurture Bloom UI 为视觉基底，使用 Better-T-Stack 生成工程骨架，并通过 TC Flow 完成任务拆分、测试、审查和验收。

## 当前阶段

这是课程作业的第一阶段前端基底：

- 四个页面：成长、时光、百科、我的
- 本地交互：新增记录、搜索、分类筛选、收藏、弹窗、提醒开关
- 无后端、无登录、无数据库、无远程 API
- 不上传私人图片；公开测试版本部署到独立 Cloudflare Pages 预览项目

课程后续可在不推翻 UI 的情况下逐步接入 Hono、Drizzle、AWS Lambda、ECS、SQS、Agent 与 RAG。

## 技术结构

仓库采用扁平化工作区结构，根目录脚本会选择 web 工作区：

```text
apps/web     React + Vite frontend
apps/api     future backend boundary; not built yet
packages/ui  reusable UI components and global styles
```

前端源码、静态资源和 Vite 配置都直接位于 `apps/web`。`apps/api` 是未来后端
边界，目前尚未构建；`packages/ui` 提供可复用 UI 组件和全局样式。

## 本地运行

在仓库根目录执行：

```bash
pnpm install
pnpm check
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

打开终端显示的本地地址，默认入口会跳转到 `/growth`。

Root scripts select the `apps/web` workspace.

`pnpm check` lints repository automation and root configuration with Biome.
Cloudflare preview CI installs from the repository root and runs `pnpm test`,
`pnpm typecheck`, and `pnpm build`; `pnpm dev` is for local development only.
Cloudflare deploys `apps/web/dist`.

## 验证

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm validate:preview
```

## 在线预览

同仓库 Pull Request 会通过 GitHub Actions 自动更新：

```text
https://course-homework-preview.pages.dev
```

工作流使用 GitHub Actions Secrets 保存 Cloudflare 凭据，Fork Pull Request
不会执行部署。当前项目仅为课程测试环境；生产发布将使用独立项目、独立
工作流和人工审批。

## 后续课程扩展点

1. 用 Hono 提供记录、百科和用户资料 API。
2. 用 Drizzle 将本地数组替换为数据库读写。
3. 用对象存储和签名 URL 实现家庭时光上传。
4. 增加登录、家庭成员和最小权限授权。
5. 加入 SQS 异步处理、通知和失败重试。
6. 接入育儿知识 RAG 与 Agent，但保留人工确认和来源展示。

密钥只能放在本机环境、CI Secret 或云端 Secret Manager 中，不能提交到仓库。
