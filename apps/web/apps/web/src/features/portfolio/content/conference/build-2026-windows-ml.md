---
title: "Expand local AI reach with Windows ML"
project: "AI 前瞻会议"
conference: "Microsoft Build 2026"
type: "conference-talk"
status: "官方摘要已整理"
source_type: "官方开发者博客与产品技术页补充；单场全文待核对"
english_title: "Expand local AI reach with Windows ML"
speaker: "本轮未从可访问的官方文字来源确认"
reviewed: "2026-10-02"
tags: ["会议演讲", "Windows ML", "本地AI", "NPU"]
source: "https://build.microsoft.com/en-US/sessions/OD851"
---
# Expand local AI reach with Windows ML

> [!summary] 一句话
> Windows ML 试图用统一平台让自定义和开源模型跨 GPU、NPU 与 CPU 运行，并把模型准备和部署工具整合进开发流程。

## 阅读范围

保留单场名称和官方场次入口。本轮场次页未返回可读正文，因此以下是与主题相关的官方文字补充，**不是该演讲全文提炼**。Build 2026 博客用于说明大会发布背景，Windows AI 产品页用于说明核对时的产品分层，2025 年 Windows ML 发布文章用于补足底层机制；三者的时间与证据角色不能混同。

## 1. 三种接入路径，不是一个“大模型 API”

Windows AI 官方产品页区分：Windows AI APIs 提供现成端侧能力；Foundry Local 提供开源模型的本地集成；Windows ML 面向自带模型。选择应由“需要现成任务能力、模型目录，还是自己的模型”决定，不能只看设备有没有 NPU。[Windows AI 产品页](https://developer.microsoft.com/en-us/windows/ai)

## 2. Windows ML 解决运行时与硬件适配

2025 年官方 GA 文章说明：Windows ML 兼容 ONNX Runtime（ORT）；Execution Provider（EP，执行提供程序）把运行时连接到不同芯片，Windows 负责运行时及 EP 的分发维护。开发者可以复用 ONNX 模型，也可把 PyTorch 模型转换后部署。

硬件抽象并非承诺所有模型在所有设备上效果相同。文章支持通过设备策略选择低功耗 NPU 或高性能 GPU，也描述按设备获取 EP、模型提前编译等部署方式；这是适配机制，不是已完成的跨设备性能验收。[Windows ML GA 说明](https://blogs.windows.com/windowsdeveloper/2025/09/23/windows-ml-is-generally-available-empowering-developers-to-scale-local-ai-across-windows-devices/)

## 3. 模型准备必须和运行时分开看

官方产品页把 Windows ML CLI 标为预览，覆盖转换、优化和基准测试，并提供 Agent Skills；VS Code 工具入口则用于模型发现及开发部署。运行时能加载模型，不代表转换、量化、性能验证已自动通过。[Windows AI 产品页](https://developer.microsoft.com/en-us/windows/ai)

## 4. Build 2026 的新增背景：从文本能力走向本地 Agent

6 月 2 日大会博客介绍 Aion 1.0 Instruct 的文本任务方向，以及 Aion 1.0 Plan 的推理与工具调用方向；后者公布为 14B 参数、32K 上下文，面向具备相应能力的设备。博客同时介绍 Windows AI APIs 向更多 CPU/GPU 设备扩展。这里记录的是**发布当日公告**，不据此认定全部功能在 10 月已普遍可用。[Build 2026 Windows 官方发布](https://blogs.windows.com/windowsdeveloper/2026/06/02/build-2026-furthering-windows-as-the-trusted-platform-for-development/)

## 5. 实践启示：如何做一个可验收的端侧原型

以下是整理者根据上述架构推导的检查清单，不是演讲者原话，也不是本机执行结果。

1. 先冻结具体任务及验收样例，再选现成 AI API、Foundry Local 或自带模型路径。
2. 先建立可重复的基线，再比较候选硬件后端；记录首轮启动和后续推理，避免只报告热启动速度。
3. 每次模型转换或精度调整都回归输出质量；速度提高不能代替正确性验收。
4. 将模型、运行时、EP、驱动和设备信息一起记录，失败时才有可定位的环境。
5. 对缺少目标加速器、首次依赖未获取、离线启动及资源不足分别设计失败提示或回退策略。
6. 对 Agent 单独验收工具权限：本地执行不自动等于安全，模型能力和工具访问边界是两件事。

## 风险与待补证据

- 本轮没有读取单场 Transcript，没有确认演讲者、现场演示顺序或问答；状态仅为“官方摘要已整理”。
- 旧笔记关于“新增 WebNN 支持”的表述缺少本轮单场文字证据，本次不再作为演讲事实保留。WebNN 与 Windows ML 的具体集成、硬件/算子支持矩阵仍待官方场次文字或文档核对。
- “不按云端 token 计费”不能推导为零成本：设备投入、内存、电力、分发和维护仍需评估；本页未进行成本测试。
- 本页未做硬件实验、模型下载、视频观看、转录或逐分钟复核。产品页会变动，2025 年机制说明也不能替代当前版本兼容性清单。

## 来源与核对记录

- [官方场次入口 OD851](https://build.microsoft.com/en-US/sessions/OD851)：2026-10-02 本轮未获取可读正文，单场全文待官方文字资料；不认定网站永久失效。
- [Build 2026 Windows 官方发布](https://blogs.windows.com/windowsdeveloper/2026/06/02/build-2026-furthering-windows-as-the-trusted-platform-for-development/)：2026-06-02；作者 Pavan Davuluri；大会发布背景。
- [Windows AI 产品页](https://developer.microsoft.com/en-us/windows/ai)：2026-10-02 核对；产品与工具分层。
- [Windows ML GA 说明](https://blogs.windows.com/windowsdeveloper/2025/09/23/windows-ml-is-generally-available-empowering-developers-to-scale-local-ai-across-windows-devices/)：2025-09-23，页面另有 09-24 编辑说明；作者 Logan Iyer；历史机制背景。
