---
title: "Google I/O 2026 Developer keynote：Agent 开发平台与工具链"
project: "AI 前瞻会议"
conference: "Google I/O 2026"
type: "conference-session"
status: "官方摘要已整理"
reviewed: "2026-10-01"
speaker: "The Google I/O team"
tags: ["会议演讲", "Google", "Agent", "开发工具"]
source:
  - "https://developers.googleblog.com/en/all-the-news-from-the-google-io-2026-developer-keynote/"
---
# Google I/O 2026 Developer keynote：Agent 开发平台与工具链

> [!summary] 一句话
> Google 将 I/O 开发者主题演讲概括为从 AI 助手转向可跨工作流行动的 Agent，并展示了 Agent 编排与托管、Android/Web 开发工具、浏览器工具接口和实时验证能力的组合。

## 基本信息

- 会议：[[30-AI前瞻会议/Google IO 2026/README|Google I/O 2026]]
- 官方资料标题：All the news from the Google I/O 2026 Developer keynote
- 资料类型：Google Developers Blog 官方主题演讲回顾，不是 Transcript。
- 发布日期：2026-05-19；本地核对：2026-10-01。
- 官方回顾：[Google Developers Blog](https://developers.googleblog.com/en/all-the-news-from-the-google-io-2026-developer-keynote/)

## 官方摘要提炼

### 1. Agent 编排从 IDE 功能扩展成平台能力

官方回顾把 Antigravity 2.0 与 Antigravity CLI 列为复杂任务的 Agent 编排入口，可拆分专业子 Agent；同时宣称内置跨平台终端沙箱、凭证遮蔽和强化的 Git 策略。它呈现的重点不只是“调用多个模型”，还包括让 Agent 在受约束的开发环境里运行。

### 2. 从原型到部署的托管路径

Google AI Studio 增加原生 Kotlin 支持、Google Workspace 集成、Cloud Run 一键部署和 Firebase 服务，并支持将完整项目状态导出到 Antigravity。Gemini API 的 Managed Agents 则以单次 API 调用提供预配置 Agent 与远程沙箱；另有 Antigravity SDK，允许自行控制 Agent harness 并部署到自有基础设施。官方摘要由此给出托管与自建两条路径，但没有在这篇回顾中比较它们的费用、数据边界或运维负担。

### 3. Android 开发工具把 Agent 接到真实构建环节

稳定版 Android CLI 面向 Agent 开放 Android Studio 的重型操作，包括获取 Android SDK、在设备上运行应用等；Google 还开源了 Jetpack Compose 与 Navigation 3 迁移等技能。Android Bench 被介绍为面向 Android 开发任务的模型榜单，回顾称当周加入 Gemma 4 等开放权重模型。Android Studio 的迁移 Agent 则处于预览阶段，目标是把 React Native、Web 框架或 iOS 源代码迁移为原生 Kotlin Android 应用。

### 4. Web Agent 需要结构化接口与验证工具

WebMCP 被描述为一项提议中的开放 Web 标准，让网站暴露结构化工具（如 JavaScript 函数和 HTML 表单）供浏览器 Agent 调用；其 Chrome 149 origin trial 和 Gemini in Chrome 支持均按官方公布的实验/计划状态记录。Modern Web Guidance 处于 early preview，提供面向编码 Agent 的专家审阅技能，并结合 Baseline 目标。Chrome DevTools for agents 的方向是把质量审计、真实用户体验模拟、调试优化和会话自动连接/交接纳入 Agent 工作流。HTML-in-Canvas 则处于 origin trial，目标是让 Canvas 中的 DOM 内容仍保持可搜索、可访问和可交互。

## 实践启示（基于官方摘要的工程推论）

1. **先划分托管与自建边界。** 以数据驻留、凭证接触面、运行隔离、网络出口、成本和运维责任比较 Managed Agents 与自部署 harness，而不是只比较启动速度。
2. **把“Agent 会执行”变成可检查的权限契约。** 在沙箱中限制文件、网络和终端能力；凭证遮蔽及 Git 策略需通过负向测试确认，不能仅凭产品描述认定安全。
3. **让开发 Agent 使用标准化的验证回路。** Android CLI、WebMCP 和 Chrome DevTools 的组合提示：Agent 可操作构建/浏览器，也要能读取测试结果、无障碍状态与性能信号，并在变更后复验。
4. **迁移 Agent 先用于可回滚、小批量任务。** 对跨框架迁移保留源分支、自动化测试、差异审查和人工批准；“几周变几小时”是回顾中的价值主张，不应当作普遍实测保证。

## 风险与证据限制

- 本页依据一篇 Google 官方开发者主题演讲回顾，属于官方摘要，不是完整演讲稿、独立评测或视频复核。
- 沙箱、凭证遮蔽、Git 策略及生产率效果均是发布方介绍；这篇来源未提供威胁模型、基准方法或独立测量数据。
- WebMCP、Modern Web Guidance、Android migration agent、HTML-in-Canvas 等项目的实验、预览或计划状态按原文保留，不能写成普遍可用的稳定功能。
- 本轮没有打开、观看、下载或处理回放，也没有生成逐分钟时间线。

## 返回

- [[30-AI前瞻会议/Google IO 2026/README|Google I/O 2026]]
- [[30-AI前瞻会议/整理队列|整理队列]]
