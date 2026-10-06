---
title: "New data agents across the Agentic Data Cloud"
project: "AI 前瞻会议"
conference: "Google Cloud Next 2026"
type: "conference-session"
status: "官方摘要已整理"
source_type: "Google Cloud Blog 官方发布文章"
english_title: "New data agents across the Agentic Data Cloud"
speaker: ["Sean Rhee、Geeta Banda（Google Cloud）"]
reviewed: "2026-10-06"
tags: ["会议演讲", "Google Cloud", "Agentic Data Cloud", "Data Agent", "MCP"]
source: "https://cloud.google.com/blog/products/data-analytics/new-data-agents-across-the-agentic-data-cloud"
---
# New data agents across the Agentic Data Cloud

> [!summary] 证据状态
> 官方摘要已整理。本文依据 Google Cloud Blog 2026-06-15 官方发布文章；不是逐字 Transcript，也未观看或处理回放媒体。

## 资料定位

这篇会后官方文章把 Agentic Data Cloud 拆成三层：面向分析师的 Conversational Analytics、面向数据工程/科学/数据库管理员的 Data Agents，以及供开发者接入既有 Agent 生态的工具。核心问题是让 Agent 在企业实时数据和权限边界内行动，而不是只在静态文档上生成回答。

## 核心观点

1. **企业 Agent 的瓶颈是上下文与权限。** 传统数据架构容易让 Agent 使用过期数据，或因为缺乏细粒度访问控制而产生安全缺口。
2. **Conversational Analytics 覆盖多种数据面。** BigQuery、Lakehouse、AlloyDB、Spanner、Cloud SQL 和 Looker 提供自然语言查询、语义 grounding、根因分析、报告和可嵌入的对话入口；部分能力仍处于 Preview。
3. **Data Agents 从被动运维转向主动工作。** Data Engineering Agent 可把自然语言需求转成 SQL/Python、发现流水线故障并提出修复；Data Science Agent 辅助特征、Notebook 和文档；Database Observability/Onboarding Agent 则面向性能诊断与选型部署。
4. **Agent 结果要回到受治理的数据产品。** Looker Dashboard Agent、Gemini Enterprise 中的 Conversational Analytics 和 Deep Research Agent 将技术控制台能力包装成有权限、可引用的工作入口。
5. **工具层采用开放协议。** Data Agent Kit、数据库 Managed MCP Servers、Looker MCP Server 和 MCP Toolbox for Databases 1.0，分别覆盖 IDE/CLI 技能、数据库上下文、语义模型访问和生产化 MCP 基础设施。
6. **评测和准确率表述要保留发布方归属。** 文章对“近 100%”等效果描述属于 Google Cloud 发布方陈述；落地时应使用自己的 schema、权限、查询样本和故障场景重新验证。

## 按实施拆解

- **数据层：** 统一操作库、分析库和语义层的实时上下文，定义字段、更新时间和权限来源。
- **Agent 层：** 为数据工程、数据科学、数据库运维和业务分析分别配置专用工具，避免一个通用 Agent 获得过宽权限。
- **协议层：** 用 MCP/ADK 连接工具，但把工具目录、调用范围、审批和审计留在平台治理层。
- **评测层：** 同时测 SQL 正确性、权限拒绝、引用可追溯性、根因诊断、修复建议和长流程失败恢复。

## 实践启示

- 先做“只读数据 Agent”，把查询、解释和引用链跑通，再逐步开放修复或写入动作。
- 为每类 Data Agent 建立最小权限角色，并明确 Preview、GA、发布方自述和独立实测的状态差异。
- 把实时数据的 freshness、schema 漂移、权限变化和 MCP 服务健康度纳入 Agent 的可观测性，而不只监控模型延迟。

## 风险与证据限制

- 本页是 Google Cloud 官方产品摘要，不是独立评测、客户验收或逐字演讲稿。
- 多项能力标注 Preview 或选择性开放，实际可用性、区域、权限和计费需以当前文档与账号条件为准。
- 文章中的准确率、性能和“生产级”表述保留发布方归属；本机未运行 Google Cloud、MCP 或 Agent 示例。

## 官方来源

- [New data agents across the Agentic Data Cloud（Google Cloud Blog，2026-06-15）](https://cloud.google.com/blog/products/data-analytics/new-data-agents-across-the-agentic-data-cloud)
- [Google Cloud Next 2026 260 项发布总览](https://cloud.google.com/blog/topics/google-cloud-next/google-cloud-next-2026-wrap-up)

## 返回

- [[30-AI前瞻会议/Google Cloud Next 2026/README|Google Cloud Next 2026]]
