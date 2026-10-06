export type ConferenceEntry = {
  slug: string;
  title: string;
  event: string;
  date: string;
  reviewed: string;
  status: "官方文字稿已整理" | "官方演讲全文已整理" | "官方摘要已整理" | "演讲内容已整理" | "官方发布总览已整理";
  summary: string;
  source: string;
};

// Only material traceable to public, official text belongs in this archive.
export const conferenceEntries: ConferenceEntry[] = [
  {
    slug: "yunqi-2026",
    title: "吴泳铭：机器智能时代与阿里巴巴全栈 AI 战略路线图",
    event: "云栖大会 2026",
    date: "2026.09.22",
    reviewed: "2026.09.28",
    status: "官方演讲全文已整理",
    summary: "依据阿里巴巴集团刊载的演讲全文，整理模型、芯片与云三层基础设施路线，并区分长期预测、公司目标与已验证事实。",
    source: "https://www.alibabagroup.com/zh-CN/document-2039431633571938304",
  },
  {
    slug: "yunqi-2026-agentic-os",
    title: "AI Agent 原生操作系统：论坛会后回顾",
    event: "云栖大会 2026",
    date: "2026.09.23",
    reviewed: "2026.10.02",
    status: "官方摘要已整理",
    summary: "依据龙蜥社区账号的会后文字回顾，整理 Agentic OS 运行底座、系统维护、端边云协同与 SkillHub 质量推荐；不是演讲全文，产品效果仍属发布方陈述。",
    source: "https://developer.aliyun.com/article/1767343",
  },
  {
    slug: "openai-devday-2026",
    title: "OpenAI DevDay 2026：官方发布总览",
    event: "OpenAI DevDay 2026",
    date: "2026.09.29",
    reviewed: "2026.09.29",
    status: "官方摘要已整理",
    summary: "依据官方 Recap 整理模型与常驻 Agent、Codex 工程执行、ChatGPT 应用入口和团队协作等发布主线，并保留风险与待核验项。",
    source: "https://openai.com/index/devday-2026-recap/",
  },
  {
    slug: "berkeley-agentic-ai-2026",
    title: "Berkeley Agentic AI Summit：官方会后总结",
    event: "Berkeley Agentic AI Summit 2026",
    date: "2026.08.01–02",
    reviewed: "2026.09.10",
    status: "官方摘要已整理",
    summary: "根据主办方会后文字总结，整理模型之外的 Harness、运行时评测与安全，以及从工作流走向自主发现的观察；不推断单场演讲细节。",
    source: "https://berkeleyrdi.substack.com/p/agentic-ai-weekly-berkeley-rdi-august-330",
  },
  {
    slug: "waic-2026",
    title: "WAIC 2026：大会趋势汇总",
    event: "WAIC 2026",
    date: "2026.07.17–20",
    reviewed: "2026.09.28",
    status: "官方摘要已整理",
    summary: "依据上海市政府公开论坛报道整理大会趋势，同时说明资料覆盖范围，不把单篇报道扩写成全场结论。",
    source: "https://www.shanghai.gov.cn/nw15343/20260721/f4009638961a4ccea7ccbfc8ac5936a3.html",
  },
  {
    slug: "baai-2026-rl",
    title: "Rediscovering Reinforcement Learning：演讲总结",
    event: "北京智源大会 2026",
    date: "2026.06.12–13",
    reviewed: "2026.09.12",
    status: "演讲内容已整理",
    summary: "围绕长期回报、信用分配、Actor-Critic、奖励设计及其向 Agent 工程的迁移，保留演讲内容与工程推论的边界。",
    source: "https://hub.baai.ac.cn/view/55498",
  },
  {
    slug: "build-2026-harness",
    title: "Claw 与 Agent Harness：Microsoft Foundry 演讲总结",
    event: "Microsoft Build 2026 · BRK243",
    date: "2026.06.02–03",
    reviewed: "2026.09.12",
    status: "官方文字稿已整理",
    summary: "依据官方 Session 文字稿与摘要，整理 Foundry 的三层结构、现成与自建 Harness 路线，以及上下文、恢复、身份、观测和评测。",
    source: "https://build.microsoft.com/en-US/sessions/BRK243",
  },
  {
    slug: "build-2026-agent-control",
    title: "跨框架 Agent 观测与控制：Build 演讲总结",
    event: "Microsoft Build 2026 · BRK250",
    date: "2026.06.02–03",
    reviewed: "2026.09.12",
    status: "官方摘要已整理",
    summary: "依据官方 Session 摘要，整理 Agent 失败类型、策略驱动评测、运行时检查点以及评测与控制的分工；不标作完整文字稿。",
    source: "https://build.microsoft.com/en-US/sessions/1774018716553001rOhY",
  },
  {
    slug: "build-2026-windows-ml",
    title: "Expand local AI reach with Windows ML：官方文字整理",
    event: "Microsoft Build 2026 · OD851",
    date: "2026.06.02–03",
    reviewed: "2026.10.02",
    status: "官方摘要已整理",
    summary: "依据 Build 2026 官方发布、Windows AI 产品页及 2025 年 Windows ML 机制资料，梳理端侧 AI 接入分层、ORT/EP 硬件适配和模型准备；单场全文待核对，验收清单为整理者推导。",
    source: "https://blogs.windows.com/windowsdeveloper/2026/06/02/build-2026-furthering-windows-as-the-trusted-platform-for-development/",
  },
  {
    slug: "google-cloud-next-2026-data-agents",
    title: "New data agents across the Agentic Data Cloud",
    event: "Google Cloud Next 2026",
    date: "2026.06.15（发布）",
    reviewed: "2026.10.06",
    status: "官方摘要已整理",
    summary: "依据 Google Cloud 官方发布文章，整理 Conversational Analytics、Data Agents、Managed MCP 与受治理的数据上下文；区分 Preview、GA 和发布方效果陈述，不标作 Transcript，也不代表本机运行过云服务。",
    source: "https://cloud.google.com/blog/products/data-analytics/new-data-agents-across-the-agentic-data-cloud",
  },
  {
    slug: "google-io-2026",
    title: "Google I/O 2026 Developer Keynote：Agent 工具链",
    event: "Google I/O 2026",
    date: "2026.05.19",
    reviewed: "2026.10.01",
    status: "官方摘要已整理",
    summary: "依据 Google 开发者官方摘要，整理从 IDE 到 Agent 平台、从原型到部署、Android 构建与 Web Agent 验证工具的主线。",
    source: "https://developers.googleblog.com/en/all-the-news-from-the-google-io-2026-developer-keynote/",
  },
  {
    slug: "nvidia-gtc-2026",
    title: "NVIDIA GTC 2026 Keynote：发布总览",
    event: "NVIDIA GTC 2026",
    date: "2026.03.15–19",
    reviewed: "2026.09.13",
    status: "官方发布总览已整理",
    summary: "依据 NVIDIA 官方新闻资料，按 Agentic AI 基础设施、Agent 开发平台和 Physical AI 三条主线整理；不把尚未复核的字幕当成现场结论。",
    source: "https://nvidianews.nvidia.com/online-press-kit/gtc-2026-news",
  },
];
