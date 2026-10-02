---
title: "Berkeley Agentic AI Summit 2026 官方会后总结"
project: "AI 前瞻会议"
conference: "Berkeley Agentic AI Summit 2026"
type: "conference-summary"
status: "官方会后总结已整理，非逐场文字稿"
event_date: "2026-08-19"
reviewed: "2026-09-10"
tags: ["会议总结", "Berkeley", "Agentic AI", "官方摘要"]
source: "https://berkeleyrdi.substack.com/p/agentic-ai-weekly-berkeley-rdi-august-330"
---
# Berkeley Agentic AI Summit 2026 官方会后总结

> [!warning] 证据边界
> 本页整理 Berkeley RDI 2026-08-19 发布的官方会后文章，覆盖多场 plenary、panel 和 fireside chat 的合并观点；它不是 Dawn Song - Opening Remarks 的逐句文字稿，也不替代视频复核。

## 一句话结论

大会把 Agentic AI 的竞争重点从“单一模型能力”推进到“模型周围的完整系统”：运行时基础设施、工具与上下文、权限和策略、评测、可观测性、软件工程流程，以及支持持续学习和自主发现的组织机制。

## 核心观察

### 1. 模型只是系统的一部分

- 长时任务和复杂任务让 memory、tools、context management、sandbox、identity、policy enforcement、orchestration 与 heterogeneous compute 成为决定实际效果的关键层。
- Agent workload 更长、更动态、更难预测，传统模型服务的容量和成本假设不再够用。

### 2. Harness 成为新的工程层

- 人类工程重点从逐行编写代码，转向设计 agent 的工作环境：提供工具、上下文、约束、测试、部署和信任边界。
- 当 agent 可以提交代码、创建 PR 和修复缺陷时，CI、评审系统和上下文护栏决定了可委托的范围。

### 3. 评测与安全进入运行时

- 静态 benchmark 不能覆盖生产环境中的长尾失败；trace、实验、异常检测和持续反馈需要成为日常运行基础设施。
- 权限与安全控制应尽量落在技术边界和运行环境中，而不是只依赖人工流程。
- 多 agent 协作会引入协同、竞争和策略性行为，评测对象需要从单 agent 扩展到 agent 之间的动态。

### 4. 从工作流走向自主发现

- 文章把 literature ingestion、假设生成、建模、仿真、实验和反馈串成一个自主发现循环。
- 未来的瓶颈不只在模型，而在全栈协同、实验记忆、agent-to-agent 通信、共享记忆和受限访问。

## 对本知识库的启发

1. 记录 agent 系统时，要同时记录模型、harness、工具、身份、权限、评测和可观测性。
2. “能调用工具”不等于“可安全自主运行”；应把授权范围、失败恢复和审计链作为单独字段。
3. 多场合并总结只能作为方向性证据；涉及某位演讲者的具体论断，仍需回到对应视频、字幕或官方逐场摘要。

## 来源与限制

- [Berkeley RDI 官方会后文章：Agentic AI Weekly | August 19, 2026](https://berkeleyrdi.substack.com/p/agentic-ai-weekly-berkeley-rdi-august-330)
- [Berkeley RDI 官方大会日程与录像入口](https://rdi.berkeley.edu/events/agentic-ai-summit)
- 本页为中文整理和归纳；未把文章中的观点逐条归属于 Dawn Song 的 Opening Remarks。

## 返回

- [[30-AI前瞻会议/Berkeley Agentic AI Summit 2026/README|Berkeley Agentic AI Summit 2026]]
- [[30-AI前瞻会议/整理队列|整理队列]]
