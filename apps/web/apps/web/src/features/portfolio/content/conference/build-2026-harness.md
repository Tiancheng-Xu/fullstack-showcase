---
title: "Claw and agent harness in Microsoft Foundry"
project: "AI 前瞻会议"
conference: "Microsoft Build 2026"
type: "conference-talk"
status: "官方 AI Summary 与文字稿已整理"
reviewed: "2026-09-12"
tags: ["会议演讲", "Agent Harness", "Microsoft Foundry", "多智能体"]
source: "https://build.microsoft.com/en-US/sessions/BRK243"
---
# Claw and agent harness in Microsoft Foundry

> [!summary] 一句话
> Agent Harness（智能体运行框架）不是又一个模型，而是包在 Agent Loop（智能体循环）外面的完整运行系统：它持续整理上下文，接入工具、文件与记忆，管理长任务和多 Agent 协作，并把身份、权限、人工审批、监控和持续评测补齐，使 Agent 能进入真实组织长期工作。

## 演讲信息

- **会议**：Microsoft Build 2026
- **Session**：BRK243
- **演讲者**：Shawn Henry、Glenn Condron、Amanda Foster
- **时长**：约 45 分钟
- **主题**：Claw 型长期 Agent、Agent Harness、Microsoft Agent Framework、Foundry Hosted Agents、Teams / Microsoft 365 Copilot 协作

## 演讲要解决的问题

做出一个能回答问题的 Agent 原型并不难，困难从它离开开发者电脑后开始：

1. 一次任务可能持续数小时或数天，进程不能因为一次请求结束就丢失状态。
2. 上下文会持续增长，需要压缩、补充和分层，而不是把所有历史粗暴塞回模型。
3. Agent 要读文件、执行代码、连接 SharePoint 等企业系统，还要隔离每次执行的环境。
4. 一个 Agent 不可能擅长所有事情，需要协调研究、编码、数据处理等专门 Agent。
5. 高风险动作不能完全放任模型，需要人工审批、权限控制、审计和恢复机制。
6. 进入生产后必须知道 Agent 做了什么、为什么失败，以及修复后有没有真的变好。

演讲把这些包围模型的问题统一称为 **Agent Harness**。模型和 Agent Loop 只是“发动机”，Harness 才是让发动机能够持续、安全行驶的整辆车。

## Foundry 的三层结构

开场先把 Microsoft Foundry 拆成三个层次：

1. **Intelligence layer（智能层）**：提供可选择的模型，负责理解、推理与生成。
2. **Runtime layer（运行时层）**：托管和管理 Agent，承接状态、长任务、工具、文件、触发器、隔离环境与运行生命周期。
3. **Human-agent collaboration layer（人机协作层）**：让 Agent 进入 Teams、Microsoft 365 Copilot 等人类已经工作的界面，与用户和团队持续协作。

三层之下还需要共同的信任、安全和可观测基础。这个结构表达了一个很重要的工程判断：生产 Agent 的竞争不只发生在模型层，更发生在模型上下两侧的运行时和组织协作层。

## 逐段内容提炼

### 00:00–03:39：从模型平台转向 Agent 运行平台

Shawn Henry 说明，本场不再停留于“如何写一个 Prompt Agent”，而是讨论更复杂的 Claw 和 Harness。Foundry 不只是模型目录，它还要承接 Agent 的托管、运行与发布。接下来的重点会落在 Runtime 和 Collaboration 两层：怎样让 Agent 长期活着，怎样把它送进组织工作流，以及怎样运行超出简单问答范围的 Agent。

### 03:39–08:01：Agent Harness 到底是什么

Agent 的核心仍然是一个循环：读取当前上下文，判断下一步，调用工具取得新信息，再把结果放回上下文，直到目标完成。Harness 包裹并管理这个循环，主要负责：

- **Context management（上下文管理）**：控制上下文增长，在必要时压缩历史，并通过 Prompt、Skill 和消息补充任务所需信息。
- **Computer use tools（计算机工具）**：向 Agent 提供文件系统、代码执行环境和其他可操作资源，使它能完成接近人类知识工作的任务。
- **Memory（记忆）**：跨步骤或跨会话保留有用状态，避免每次从零开始。
- **Orchestration（编排）**：把不同能力的专门 Agent 组织成顺序、并行或监督式工作流。
- **Lifecycle hooks（生命周期钩子）**：在启动、调用工具、暂停、恢复和结束等节点接入业务逻辑。
- **Human in the loop（人在回路）**：对高风险或不可逆动作安排人工检查、批准或纠正。

“Harness 像汽车、Agent Loop 像发动机”的比喻，重点不在包装，而在责任划分：开发者不应该把状态、压缩、工具、安全和恢复逻辑全都混进模型提示词里。

### 08:01–21:21：Hermes——现成 Claw 型 Agent 的部署演示

Glenn Condron 演示 Hermes，一种围绕长期自主 Agent 构建的 Claw 型架构。它把记忆、工具和自主执行组合起来，可以运行在隔离 Sandbox（沙箱）或 Virtual Machine（虚拟机）中，并持续通过 Slack、Telegram 等渠道与人沟通。

演示中的 Hermes 使用 Foundry 托管的 Agent 和模型，并通过 MCP（Model Context Protocol，模型上下文协议）连接 SharePoint。这说明企业 Agent 的“工具”不是临时写死的函数，而可以是带身份和访问边界的企业服务连接。

Hermes 还引入了 **Routine（例行任务）**：Agent 不必一直消耗推理资源，但可以按计划唤醒，执行技能维护、备份和其他日常工作。Routine 把“永远在线”改造成“需要时被触发并保持连续性”，从而在自主性、成本和可靠性之间取得平衡。

这里也暴露出长期 Agent 的真正难点：每个实例都会积累自己的文件、状态和环境，使用时间越长越有个性，但故障恢复也越复杂。生产系统必须明确哪些状态是可重建的、哪些需要持久保存、环境损坏后从哪里恢复，不能只依赖进程一直不出问题。

### 21:21–35:01：用 Microsoft Agent Framework 自建 Harness

第二条路线不是直接使用现成 Claw，而是用 Microsoft Agent Framework 组装自己的 Harness。框架同时支持 Python 和 C#，把系统拆成三个层次：

1. **Agent Loop**：连接模型和工具；模型既可以来自 Foundry，也可以来自 OpenAI、Anthropic 或 Gemini 等提供方。
2. **Workflow**：组织多个 Agent，可按固定步骤执行，也可由 Supervisor（监督 Agent）规划和分派任务。
3. **Harness**：补上文件访问、代码执行、上下文管理、规划、记忆、监控和人工干预等通用能力。

编码演示从研究型 Agent 出发，为它逐步套上 Harness，并通过 Console UI（控制台界面）观察运行过程。官方示例仓库把学习路径拆成四级：基础研究 Agent、加入后台 Agent、加入数据处理、再加入代码执行。这个顺序很有价值，因为它让开发者逐层观察每增加一种能力后，状态、权限和失败面如何变化。

完成核心逻辑后，同一个 Harness 可以接入 AG-UI 一类前端协议和 Copilot Kit，进入图形界面并展示交互式数据；也可以部署到 Foundry，让平台继续负责运行监控和评测。换句话说，UI、模型提供方与部署平台可以替换，Harness 承载的任务结构和治理能力应尽可能复用。

### 35:01–44:03：从“聊天机器人”到组织中的 Agent 身份

Amanda Foster 演示把 Agent 发布到 Teams 或 Microsoft 365 Copilot。开发者配置后，可以把 Agent 分享给组织成员，让用户在已有协作界面中使用，而不是要求所有人另开一套工具。

随后介绍 **Autopilot agents（自动驾驶式智能体）**。它与普通助手的区别是拥有自己的组织身份，而不是永远冒用某个用户的身份执行：它可以主动发送消息、处理共享文档、跟进事项，并长期参与群聊或工作流。

演示中的 Work Stream Manager（工作流管理 Agent）包含入职配置、访问控制和群聊行为。Agent 只对被允许的成员和上下文作出反应，同时持续维护讨论状态。这意味着企业 Agent 的产品形态正在从“有人问才回答”转向“有职责、有身份、会持续跟进的数字同事”。

独立身份也带来治理价值：权限可以明确授予 Agent，动作可以归因到具体 Agent，日志、审计和撤权不必混在人类账号里。但这同样提高了设计要求——身份不是一张头像，而是权限边界、责任归属和生命周期管理的集合。

### 44:03–结束：三条落地路线

结尾把整场内容收束为三种使用方式：

1. **部署现成 Harness**：例如 Hermes，快速获得长期状态、工具、Routine 和消息渠道。
2. **构建自定义 Harness**：用 Microsoft Agent Framework 组合自己的 Agent Loop、Workflow 和通用运行能力。
3. **发布到企业协作环境**：通过 Foundry 把 Agent 送入 Teams 或 Microsoft 365 Copilot，并接入身份、监控和持续评测。

这三条路线并不互斥。团队可以先采用现成 Harness 验证业务，再把关键流程迁移到自定义实现，最后通过托管平台统一运行和治理。

## 三类演示对应的工程能力

| 演示 | 解决的问题 | 需要保留的工程能力 |
| --- | --- | --- |
| Hermes / Claw | 长期自主运行和跨会话连续性 | 沙箱、文件、记忆、Routine、消息通道、恢复 |
| Microsoft Agent Framework | 按业务需要自定义执行循环和多 Agent 协作 | Loop、Workflow、工具、上下文、人工审批、Telemetry |
| Foundry + Teams / M365 | 把 Agent 交付给组织并持续运营 | 托管、身份、发布、权限、审计、Observability、Continuous Evals |

## 官方示例仓库提供了什么

BRK243 官方仓库给出了可运行的 .NET 示例，要求 .NET 10 SDK、Azure CLI 和 Foundry 项目配置。示例不是一个“大而全”的最终应用，而是四个递进步骤：

1. `Harness_Step01_Research`：建立基础研究任务。
2. `Harness_Step02_Research_WithBackgroundAgents`：加入后台 Agent，把任务分给长期或异步工作者。
3. `Harness_Step03_DataProcessing`：让 Agent 处理结构化或派生数据。
4. `Harness_Step04_CodeExecution`：加入代码执行能力，也是风险显著上升的一步。

仓库同时提供共享控制台组件以及面向不同模型接口的共享实现。这里真正值得复用的是“逐级加能力”的教学方式：每增加工具或自治能力，都应同步增加权限、隔离、超时、日志和评测，而不是先把所有能力打开再补安全。

## 对实际 Agent 项目的启示

### 1. 先设计 Harness，再选最强模型

如果任务需要长时间运行，优先定义状态结构、检查点、工具权限、失败恢复和人工确认节点。模型可以替换，但散落在 Prompt 和业务代码中的运行逻辑很难迁移。

### 2. 把上下文当成受限资源

长期任务一定会遇到上下文膨胀。需要区分当前工作集、长期记忆、文件证据和可重新获取的数据，并明确压缩时哪些事实不能丢。Context Compaction（上下文压缩）是执行系统的一部分，不只是节省 Token 的技巧。

### 3. 自主性必须和可恢复性一起增加

Agent 能定时唤醒、后台执行和修改文件之后，必须同时具备幂等、检查点、重试上限、取消、状态回读和审计。只增加“能做什么”，不增加“出错后怎么停和恢复”，会把演示中的便利变成生产事故。

### 4. 多 Agent 不等于多开几个模型

合理的多 Agent 系统需要明确角色、输入输出契约、共享状态、任务所有权和汇总规则。Supervisor 只负责分派还不够，还要处理部分失败、重复执行和结果冲突。

### 5. 企业 Agent 需要独立身份

当 Agent 能发消息、改文档或触发流程时，使用独立身份比借用员工账号更容易做最小权限、撤权、归因和合规审计。身份本身应纳入部署和生命周期管理。

### 6. Observability 和 Evals 必须形成闭环

Tracing（链路追踪）回答“发生了什么”，Evaluation（评测）回答“结果好不好”。生产问题需要从失败样本进入评测集，再经过改动、回归验证和新版本发布，才能称为持续改进。

## 风险与边界

- **状态越持久，隐私和清理越困难**：需要为记忆、文件与日志设置保留周期和删除路径。
- **工具越强，攻击面越大**：代码执行、文件系统和企业数据连接必须放在隔离环境，并采用最小权限。
- **Routine 可能静默制造错误**：定时任务需要预算、超时、幂等和异常通知，不能因为无人值守就无人审计。
- **多模型兼容不等于行为一致**：更换模型提供方后，需要重新跑工具调用、规划、拒绝策略和长任务恢复评测。
- **Autopilot 不是普通机器人账号**：它能主动行动，必须有明确所有者、职责范围、撤权和停用机制。

## 大白话

模型像发动机，Agent Loop 决定发动机怎样反复工作，Harness 则是整辆车：方向盘、刹车、仪表盘、油路、安全带和维修记录都在这里。Claw 型 Agent 像一辆长期停在组织里的工作车，会定时出发、自己保存工具和路线；Foundry 则更像车队管理平台，负责身份、停车位、调度、监控和事故追踪。

真正的门槛不是“车能不能跑起来”，而是它跑几个月之后，出了问题能不能知道走过哪条路、谁给了权限、怎么安全停下，以及换发动机后是否仍能完成原来的工作。

## 证据与限制

- [Microsoft Build 官方 Session：视频、AI Summary、Slides 与 Transcript](https://build.microsoft.com/en-US/sessions/BRK243)
- [BRK243 官方示例仓库](https://github.com/microsoft/Build26-BRK243-claw-and-agent-harness-in-microsoft-foundry)
- [Microsoft Agent Framework at Build 2026](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-at-build-2026/)
- [Build and run agents at scale with Microsoft Foundry](https://devblogs.microsoft.com/foundry/agent-service-build2026/)
- 本页逐段时间线依据 Microsoft 官方 Session 页面提供的 AI Summary，并用官方演讲仓库和官方博客交叉核对产品结构与示例内容。
- 当前没有重新下载并逐句核对官方 Transcript，也没有通过本地视频四 Gate，因此状态仍是“官方 AI Summary 与文字稿已整理”，不能标成“视频已复核”。

## 相关概念

Agent Harness · Agent Loop · MCP（Model Context Protocol）· Context Compaction · Human in the Loop · Observability · Continuous Evals · Autopilot Agent

## 返回

- [[30-AI前瞻会议/Microsoft Build 2026/README|Microsoft Build 2026]]
