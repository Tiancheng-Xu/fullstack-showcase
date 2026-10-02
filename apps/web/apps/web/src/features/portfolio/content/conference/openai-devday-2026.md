---
title: "DevDay 2026 Recap｜OpenAI 官方发布总览"
project: "AI 前瞻会议"
conference: "OpenAI DevDay 2026"
type: "conference-summary"
status: "官方摘要已整理"
event_date: "2026-09-29"
reviewed: "2026-09-29"
source_type: "官方会后回顾"
tags: ["会议摘要", "OpenAI", "Agent", "Codex", "开发者平台"]
aliases: ["OpenAI DevDay 2026 官方总结"]
---
# DevDay 2026 Recap｜OpenAI 官方发布总览

## 一句话

OpenAI 把本届发布重点放在“长期运行的 Agent + 可执行的开发平台 + ChatGPT 作为人和 Agent 的共享工作空间”：模型负责推理，Codex/API/插件负责行动，团队空间、连接器和权限设置负责把行动嵌入真实工作流。

## 资料性质与证据边界

- **资料类型：** OpenAI 官方会后回顾（公司发布摘要），不是会议逐字稿或完整演讲稿。
- **本页范围：** 按官方回顾归纳其列出的产品与平台发布，并保留官方所述的计划、预览和可用范围。
- **不代表：** 本页没有观看或复核任何回放，也没有独立验证 OpenAI 对模型能力、用户规模、速度、价格或安全机制的宣传数据；没有逐分钟时间线。
- **整理原则：** “现已推出”“限量预览”“即将推出”和“未来计划”分开记录，不能把发布会上宣布的功能一概当成人人当前可用。

## 发布主线

### 1. 从问答助手走向常驻 Agent 与新模型层级

- **dots：** OpenAI 将其描述为可持续承担职责的常驻 Agent，能在用户连接的应用中工作，并可按用户设定的目标与自主权限主动执行任务。官方回顾列出的可用范围是：符合条件地区的 Pro 与 Business Premium；Enterprise、Edu、Healthcare 是管理员启用后可试用的 Beta，默认关闭。
- **GPT‑6.1 Sol：** OpenAI 称这是 GPT‑6 Sol 的升级，重点突出 Agent 编码、电脑操作和专业工作，并称其以标准输入、输出 Token 价格的五分之一，提供接近 Astra 的智能水平。官方称 API、Plus、Pro、Business、Enterprise、Edu 可用。性能与价格比较均为发布方陈述，实际效果需要按任务和计费口径验证。
- **Ultrafast：** 新增优先速度的付费层级。官方称 Codex 最高约 300 Token/秒（最高 8 倍），API 最高 6 倍；GPT‑6 Astra Ultrafast 当时已在 API，以及 Pro 500、Enterprise 的 ChatGPT Work/Codex 中提供；GPT‑6.1 Sol Ultrafast 则标为即将推出。
- **Private Intelligence：** 面向企业的数据保护方案。OpenAI 描述了 Zero Data Retention 与 Private Safety Processing 的组合，以及计划于当年秋季预览、结合机密计算和可验证控制的 Private Inference。该项属于官方安全能力说明，不等于对具体部署、威胁模型或合规性的独立审计。

### 2. 把 Codex 从代码助手扩成可持续运行的工程执行环境

- **Codex in the cloud：** 可从电脑、手机远程或云端发起任务；可复用开发环境，以共享的设置和权限缩短任务启动准备。官方列出 Plus、Pro、Business、Healthcare、Education、Enterprise 等计划。
- **Codex CLI 更新：** 增加语音启动/指挥任务、`/agents` 多 Agent 视图，并改进委派与跟踪、提示词编辑、会话续跑、worktree 工作流和长会话终端显示；官方称所有计划可用。
- **Code Review：** 桌面端可查看跨项目变更摘要与 diff，并询问 Codex；可针对 GitHub Pull Request 或 GitLab Merge Request 进行审阅，云端自动审阅可先做一轮检查。官方称所有计划可用。
- **Codex Security Cloud：** 可按需或定期扫描 GitHub 仓库并跟踪新提交；官方称系统会调查发现、去重并准备修复，可在电脑关闭时于云端运行，并包含 Daybreak Blue 模型访问。回顾列出的适用计划为 Pro、Business、Enterprise、Edu（桌面端和 Web）。
- **Decisions API：** 将 Luna 的决策限制在开发者预先定义的问题与有限答案中，可用文本或图片提供上下文，面向分类、路由请求或选择 Agent 下一步动作；发布时为限量预览。
- **Agents API 电脑操作：** 将电脑操作能力加入 Agents API，并带入多 Agent、工具搜索、工具调用和上下文压缩能力；OpenAI 承担底层基础设施。官方列出的场景包括 API，以及 Pro 500、Enterprise 中的 Codex/ChatGPT Work。
- **AWS Bedrock Managed Agents：** OpenAI 与 Amazon 合作，将 Agents API 能力做成原生 AWS 托管 Agent，官方称 Agent 可完全运行在 AWS 并接入 AWS 资源。选型时仍需核对实际区域、服务边界、数据流和责任划分。

### 3. 把 ChatGPT 打造成可扩展的应用入口

- **Plugin extensions：** 开发者可为插件创建侧边栏入口、交互面板和受支持文件类型的查看器；官方称所有计划可用。
- **Plugin Creator 与分发：** 改进插件创建、提交反馈、目录排序和推荐；用户自行选择插件并批准其访问权限。
- **Sites 托管插件：** Sites 可以承载受支持的 ChatGPT 插件；工作区同伴可使用同一应用，但连接的数据和权限仍按各自用户配置。官方列出的计划为 Business、Enterprise、Healthcare、Edu。
- **MCP Events：** 支持提议中的 MCP Events 规范，使连接应用发生事件时可以触发插件自动化，例如检测项目板新增任务后读取关联文档并草拟计划。要点是从“人发起一次工具调用”走向“事件触发持续工作”；真实部署要额外设计授权、去重、重试与审计。
- **可分享的 Profiles：** 汇集 Sites 和插件供他人发现复用；工作区内可分享 Skills。官方列出的计划为 Business、Enterprise。
- **Sign in with ChatGPT：** 官方称可在 16 个合作伙伴中使用计划额度并通过 ChatGPT 身份登录，身份功能全球开放；计划额度只适用于参与工具中的 Plus/Pro 用户。合作伙伴与资格以官方页面当时列示为准。
- **OpenAI Marketplace：** 符合条件的企业客户可把部分现有 OpenAI 承诺额度用于获批合作软件。官方称首批 32 家合作伙伴覆盖创意（如 Adobe、Figma）、客户体验、法律、网络安全和开源模型托管（如 Baseten）；这是企业采购与分发安排，不应误读为所有用户都可用的开放应用商店。

### 4. 把个人对话转成团队与文档协作

- **ChatGPT Space：** 为团队提供共享知识、页面和工作空间，ChatGPT 可按团队指令整理内容；官方称 Pro、Business、Enterprise 的桌面端和 Web 可用，移动端可查找、阅读和分享，移动端创建/编辑当时仍在开发中。
- **Pages：** 面向人和 Agent 协作的文档，可以在其中写作、研究、生成图表/图像和可视化，并邀请团队贡献想法与反馈；官方称 Pro、Business、Enterprise 可用。
- **Collaborative slides：** 计划支持团队和 Agent 实时共同编辑幻灯片、评论，并在 ChatGPT 演示或导出到 PowerPoint/Google Slides；官方当时称将在未来几周推出，不能记为已全面上线。
- **Teams 与共享任务：** 可组建团队共享 Pages、Slides、插件、表格，并委派周期性工作；连接工具可按计划或新邮件、Slack 消息等事件收集信息并采取行动。官方列出的计划为 Business、Enterprise。
- **Slack/Teams 中的 @ChatGPT：** 可在频道、线程或私信中调用 ChatGPT，并使用管理员连接的工具或用户自己的权限；官方列出的计划为 Business、Enterprise。
- **Meetings plugin：** 在 ChatGPT Space 保存会议摘要和行动项，可保持私有或分享，再用于更新项目计划/起草跟进。官方称 macOS 桌面端 Pro、Business 提供 Beta，Enterprise 即将推出；音频在笔记生成后删除、不能回放，是发布方对功能行为的描述。

### 5. 通过订阅和伙伴渠道扩展用量

- **Pro 500：** 新增 Pro 层级，官方称其用量上限为 ChatGPT Plus 的 25 倍，并包含 Ultrafast；官方称当时已推出。
- **Marketplace 企业承诺额度：** 将 OpenAI 的企业承诺额度部分用于获批伙伴软件，意在降低企业采购与组合工具的摩擦；具体可抵扣范围和资格须以合同/官方条款为准。

## 对开发者与技术团队的实践启示

1. **以任务闭环而非模型榜单评估 Agent。** 从目标输入、上下文获取、工具/电脑操作、审批、长任务恢复到结果校验，定义端到端成功条件；分别测错误动作、重复执行、越权和中断恢复。
2. **把自主权拆成可配置权限。** 常驻 Agent、MCP 事件和团队连接器会把一次性问答变为持续授权。先列出可读/可写资源、允许的动作、触发条件、人工审批点、撤权路径和审计日志，再逐步提高自治程度。
3. **把速度、价格与质量放在同一张成本表。** GPT‑6.1 Sol 与 Ultrafast 的官方对比是候选基准，不是所有任务的结论；用真实提示、上下文长度、输出 Token、重试率和人工返工率测单位有效任务成本。
4. **先确定工作负载与信任边界，再选运行环境。** 本地桌面、OpenAI 云环境和 Bedrock/AWS 托管方案会带来不同的数据流、网络边界和运维责任。逐项核验区域、日志、保留期、密钥、工具连接和责任共担，不能只看“可在云端运行”字样。
5. **把代码审查与安全扫描接入现有交付门禁。** Codex 的云端审阅和安全扫描可用于初筛；高风险变更仍需要复现、测试、人工安全审阅和依赖/权限检查，不能把自动生成的修复直接视为验证通过。
6. **把插件生态当成产品分发面，也当成权限面。** 插件、Sites、Marketplace、Profiles 和登录/用量合作伙伴扩大了触达与组合能力，同时增加身份、数据授权、版本、供应链和撤销管理工作。
7. **团队空间会要求新的知识治理。** 共享 Space、Pages、会议笔记和自动任务能减少上下文搬运，但需要明确来源、可见范围、保留与删除策略，以及谁能让 Agent 更新共享知识。

## 风险、限制与待核验项

- 本文基于单一发布方会后回顾。用户规模、模型能力、Token 速度/价格比、隐私保护承诺、合作伙伴数量及功能状态均保留为 OpenAI 的说法，不视为独立验证。
- 页面写出的“可用”“Beta”“限量预览”“即将推出”与适用计划/地区是发布时口径，后续可能变化；实际使用前需核对官方产品文档、账户计划、地区和管理员配置。
- 长期 Agent、电脑操作、自动触发和连接器会扩大误操作与数据暴露的影响面；需审查最小权限、人工确认、沙箱、操作记录、回滚和紧急停止机制。
- Private Intelligence/Private Inference 的发布说明不是合规认证或第三方安全审计；对监管、数据驻留或高敏行业场景，应索取适用的正式技术/合规文档。
- DevDay 的具体演讲逐字内容、演示细节、问答与未被官方回顾涵盖的议题，本页均未覆盖；目前不将其补写成演讲逐场总结。

## 官方来源

- [DevDay 2026 Recap（OpenAI 英文官方回顾）](https://openai.com/index/devday-2026-recap/)
- [DevDay 2026 回顾（OpenAI 简体中文官方回顾）](https://openai.com/zh-Hans-CN/index/devday-2026-recap/)
- [Announcing OpenAI DevDay 2026（会前公告）](https://openai.com/index/devday-2026/)
- [OpenAI DevDay 2026 官方活动入口](https://devday.openai.com/)

## 返回

- [[30-AI前瞻会议/OpenAI DevDay 2026/README|OpenAI DevDay 2026]]
- [[30-AI前瞻会议/README|AI 前瞻会议]]
- [[30-AI前瞻会议/整理队列|整理队列]]
