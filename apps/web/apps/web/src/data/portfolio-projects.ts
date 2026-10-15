import type { PerformanceProjectStatus } from "@/features/performance/performance-types";
import {
	performanceApplicationIdForControlProject,
	performanceControlPath,
} from "./performance-applications";

export type RenderingMode =
	| "SSR"
	| "Edge SSR"
	| "SSG"
	| "CSR"
	| "Hydration"
	| "CSR Fallback"
	| "Client-only Web3"
	| "Cloud Preview Pending";

export type EvidenceState =
	| "本地已实现"
	| "设计已确认"
	| "云端未部署"
	| "云端已验证";

export type EvidenceRequirement = {
	requirement: string;
	implementation: string;
	code: string;
	proof: string;
	state: EvidenceState;
};

export type EvidenceSection = {
	title: string;
	state: EvidenceState;
	summary: string;
	steps: string[];
};

export type EvidenceCaseStudy = {
	stateNotice: string;
	requirements: EvidenceRequirement[];
	sections: EvidenceSection[];
};

export type PortfolioProject = {
	id: string;
	title: string;
	desc: string;
	summaryPoints?: string[];
	status: "已完成" | "进行中";
	progress: number;
	architecture: string;
	architectureAsset?: string;
	evidenceUrl?: string;
	repo?: string;
	skills: string[];
	evidence: string[];
	details: string[];
	renderingModes?: RenderingMode[];
	ownerPage?: string;
	sourceUpdatedAt?: string;
	performance?: PerformanceProjectStatus;
	caseStudy?: EvidenceCaseStudy;
};

export type ProjectPageLink = {
	id: "control" | "project" | "evidence";
	label: "控制面" | "项目主页" | "工作证明";
	href: string;
};

const DASHBOARD_EVIDENCE_BASE_URL = "https://baby2b.online/evidence";

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
	{
		id: "office-workflow-agent",
		title: "OfficeFlow 办公流程 Agent",
		desc: "把业务口语整理为可人核的字段与采购草稿，经版本批准执行后独立核对记录；多源材料与外贸差异分析作为扩展设计。",
		summaryPoints: [
			"可信输入：分清品名规格、数量与单位；缺项或歧义保留原话并补全，资料理解不直接获得业务执行权限。",
			"可靠执行：批准绑定当前内容与目标；API 与隔离浏览器分工，持久动作账本防重复，结果未知只核对原记录。",
			"扩展设计：OCR / ASR 材料消费、来源引用和差异清单与解析引擎分开；通用文档解析核心规划页区提取、质量报告和严格导出，尚未实现。已有合成工作区生产交付采用规则提案且模型关闭，不换算真实采购收益。",
		],
		status: "已完成",
		progress: 100,
		architecture: "业务需求 → 结构化字段 → 人工版本审批 → API / Browser 执行 → 独立结果核对与恢复；规则提案与模型能力分层。",
		evidenceUrl: "https://office-workflow-agent.baby2b.online/evidence/",
		repo: "Tiancheng-Xu/office-workflow-agent",
		skills: ["Agent Workflow", "Human Approval", "Structured Input", "API / Browser", "Idempotency", "Recovery"],
		evidence: ["生产入口与项目自有 Evidence", "当前合成工作区、规则提案与模型关闭范围分别说明"],
		details: ["本人主控产品需求、方案与交付，围绕可信输入、审批版本和业务核对组织流程。", "项目级上线不等于 OCR 增强已验收，也不等于已经接入真实企业采购数据。"],
		ownerPage: "https://office-workflow-agent.baby2b.online/",
		sourceUpdatedAt: "2026-10-08",
	},
	{
		id: "aladdin",
		title: "Aladdin Web3 Agent",
		desc: "AI Agent 分布式任务调度 / Web3 Agent 平台，主控本人负责的应用链路与全栈交付，连接任务输入、异步执行和结果反馈。",
		summaryPoints: [
			"业务编排：任务发布与编辑、分类、预算、技能和交付物构成可核对输入；自动拆解与人工编排分开，职责按具体模块展开。",
			"异步执行：React / Next.js、GraphQL、PostgreSQL / pgvector 与任务服务协作，以请求 ID、Webhook / SSE、消息队列和并发控制串联状态。",
			"结果交付：联调 MetaMask、托管 / 结算、IPFS / 链上证据与内容流程；Agent Market / BabySteps 是同一兼职下的产品，不重复计为任职。",
		],
		status: "已完成",
		progress: 100,
		architecture:
			"React / Vite / Next.js / TypeScript Web 端 → GraphQL 与任务服务 → PostgreSQL / pgvector → Webhook / SSE、消息队列与 AWS 异步执行 → MetaMask、智能合约及 IPFS / 链上结果证据。",
		skills: [
			"React",
			"Vite",
			"Next.js",
			"TypeScript",
			"PostgreSQL / pgvector",
			"GraphQL",
			"Webhook / SSE",
			"Message Queue",
			"MetaMask",
			"Smart Contract",
			"IPFS",
			"AWS",
		],
		evidence: [
			"参与任务发布 / 编辑、语义分类、子任务拆解、Agent 匹配派发、执行状态与结果聚合的应用流程",
			"协同 PostgreSQL / pgvector、GraphQL、Webhook / SSE、消息队列和 AWS 完成异步任务、并发控制及状态联调",
			"参与 MetaMask 签名、合约托管 / 结算、IPFS / 链上结果证据和端到端验证",
			"参与剧本、角色、场景、分镜、视频片段到最终合成的 AI 内容工作流",
		],
		details: [
			"参与 Job 表单与发布链路，整理分类、标签、预算、时限、技能和交付物，并支持自动拆解后的人工调整。",
			"参与 Agent 匹配派发、生命周期、异步反馈和结果聚合，通过请求 ID、Webhook / SSE、消息队列与并发控制串联任务状态。",
			"参与 MetaMask 签名、智能合约托管 / 结算、IPFS / 链上结果证据及端到端联调。",
			"参与 AI 内容工作流，将创意逐步推进为剧本、角色、场景、分镜、视频片段及最终合成。",
			"该条目依据本人实际参与经历整理；未附公开仓库或线上 Evidence，不与 Agent Market 的交付证据混用。",
			"以一段真实参与的应用 / API 为例，说明输入、异步状态、失败反馈与验收；未确认的训练、合约和云运维责任不纳入个人交付范围。",
		],
	},
	{
		id: "agent-market",
		architectureAsset:
			"architecture/agent-market.visual-check.1440x900.light.png",
		title: "Agent Market",
		desc: "面向任务交付的 Agent 协作平台，将需求组织为计划、候选选择、审批、质量复核与可追溯交付；历史生产版本与当前增强分开说明。",
		summaryPoints: [
			"业务与控制：已完成 Queen / DAG 任务编排与候选分配，模型只提建议；确定性 Gate、版本批准和独立质量复核决定能否继续执行。",
			"交付与恢复：已完成 Checkpoint 与动作账本，分别记录流程进度和核对外部效果；结果未知先对账，不因重试重复结算。公开 Evidence 按对应发布版本核对。",
			"增强范围：企业身份、跨部门许可和文档版本审批与钱包权限分离；System-One、模型评测和私有概率图按实际实现与设计边界分别说明，未交付设计不计入已完成能力。",
		],
		status: "已完成",
		progress: 100,
		architecture:
			"Edge SSR + React Hydration + GraphQL / LangGraph DAG + Node / Hono、Python 与 Go 多运行时服务 + PostgreSQL Checkpoint + 异步队列 / DLQ + 信誉评分与 LLM 评测；以结构化任务状态支撑暂停恢复、人工介入和复杂任务分发。",
		evidenceUrl: "https://agent-market.baby2b.online/evidence/",
		repo: "Tiancheng-Xu/agent-market",
		skills: [
			"Web3",
			"AI Agents",
			"LangGraph",
			"Multi-Agent",
			"Checkpoint / Resume",
			"Queue / DLQ",
			"LLM Evaluation",
			"REST / GraphQL",
			"Trust / Auth",
			"React",
			"TypeScript",
			"Sepolia",
			"Cloudflare Pages",
			"Evidence",
			"TC Flow",
		],
		evidence: [
			"Cloudflare Production、项目自有 Evidence、深链 SSR 与真实 404 已完成语义回读",
			"24 笔 Sepolia V3 状态交易全部成功，覆盖 DAG 锚定、接单、异议、仲裁、质押返还与收益领取",
			"AWS V2 已以 verified-production 完成浏览器到 HMAC API、SNS/SQS、Lambda、ECS Fargate、PostgreSQL 与聚合回读闭环，并记录暂停、零队列与零 ECS Task",
			"最终发布闭环已由 PR #28 合并；source 0c47139946c274d93db024b47c151aececb40376、PR Verify Run 34706347471、Cloudflare Production deployment 与自定义域 /evidence/ 均完成语义核验，未知路由返回 404。",
		],
		details: [
			"Cloudflare Web、AWS V2 Runtime 与 Sepolia V3 分别为 verified-production，三套证据互不替代；本地 Transaction Engine、视觉与模型证据仍仅为 verified-local。",
			"AWS V2 运行证据来自项目自有 2026-08-27 closure JSON；公开 Evidence 已修正陈旧文件名，并由服务端首屏直接输出完整证据链。",
			"Sepolia 验证使用单一测试钱包复用多个角色，不等同于多钱包生产隔离证明，也不证明网页生产环境直接提交交易。",
      "业务录屏版本绑定 source 2dfe6d0aa6fa40b65762c07ed687921233b0e0c6、Cloudflare Production deployment d8cf5994-ce54-47f1-8979-0c799eca8b79 与 main Actions Run 34697552824；录屏入口保持 /evidence/agent-market-v3-full-workflow.mp4，Range 请求返回 206。",
      "Evidence 发布版本绑定 source a9278665d25dad64ab22477a10a39974a2712744、Cloudflare Production deployment de287f0d-8e89-4eca-bb0c-b08a1fb5af8f；PR #27 已合并，PR Verify Run 34705871834。",
			"最终发布版本绑定 source 0c47139946c274d93db024b47c151aececb40376、PR Verify Run 34706347471 与 Cloudflare Production deployment 8c556e3b-c4de-4c43-a6d4-ce1c6582f074；PR #28 已合并，部署状态 Active，部署页与自定义域 /evidence/ 均完成核验，未知路由返回 404。",
      "生产录屏只证明生产 UI 流程，不作为实时市场成交或 AWS Runtime 证据。本轮未触发 AWS mutation、钱包签名、Sepolia 交易或模型 Runtime。",
			"2026-10-02 静态回读本地 3bde30f 工作分支：操作账本区分 busy、committed 与 uncertain；持久审批绑定 scope、task、revision 和 fingerprint。代码存在不等于本人逐项负责，也不替代当前运行验证。",
			"标准 MCP 业务工具生命周期、冻结标注质量评估与影子校准仍待补证；HTTP reader、占位 cost / latency 和历史冷启动记录不替代这些验收。",
		],
		renderingModes: ["Edge SSR", "Hydration", "Client-only Web3"],
		ownerPage: "https://agent-market.baby2b.online/",
		sourceUpdatedAt: "2026-09-07",
	},
	{
		id: "performance-observability-control",
		architectureAsset:
			"architecture/performance-observability-control.visual-check.1440x900.light.png",
		title: "性能观测与成本控制",
		desc: "将按需性能采样、数据来源、资源启停和历史快照分开，避免闲置运行与过期数据伪装成实时指标。",
		summaryPoints: [
			"数据可信：Core Web Vitals、资源阶段耗时与样本分母一起展示；区分新鲜、历史、未知与不可用，不把无数据填成零。",
			"生命周期：受保护控制面经固定工作流启停，nonce、幂等、代次与签名回调限制重复或过期操作；停机保留不可变快照。",
			"验证与成本：受控实验、生产用户监测和完整远端启停分别验收；小样本不外推稳定 p95，历史精确清理不证明当前全账户零费用。",
		],
		status: "进行中",
		progress: 85,
		architecture:
			"Cloudflare 状态与控制面 + GitHub Actions 固定工作流 + AWS 临时观测资源 + D1 审计状态 + R2 不可变快照。",
		evidenceUrl: `${DASHBOARD_EVIDENCE_BASE_URL}/performance-observability-control`,
		repo: "Tiancheng-Xu/fullstack-showcase",
		skills: ["Performance SDK", "Cloudflare", "AWS", "Evidence"],
		evidence: [
			"Run 33160455921 生成 415 个受控浏览器事件，Cleaner 写入 103 条并完成项目资源归零",
			"Recovery Run 33244161458 通过官方 Artifact 证明精确 Stack 不存在、17 个启用 Region 活跃项目资源为 0，共享 Foundation 保持受保护",
			"Run 33279132965 以 5 条代表性路由、85 个唯一事件和 14/14 accepted batches 验证 CLS、INP、完整导航分项、逐指标回读与零残留清理",
			"停服时只展示最后一次校验通过的真实快照，不冒充实时趋势",
			"启停、清理和共享资源保护边界",
			"运行架构、发布流程、关键时序与明确非目标",
		],
		details: [
			"控制面使用站内 TOTP、单次 nonce、幂等控制、固定 BabySteps workflow、HMAC 回调和不可变快照；公开页按应用切换，不暴露通用 AWS 管理权限。",
			"BabySteps Run 33160455921 记录 LCP/FCP 各 1 个样本、TTFB 1 个样本和 79 个脚本资源样本；单样本指标必须标记低置信度。",
			"Cleaner 写入 103 条，但清理前仍有 80 条可见消息，因此不宣称队列全量排空；项目 Schema、Stack 与 12 类项目资源已清理，共享基础设施受保护。",
			"后续源 Run 33232356133 未上传完整 Artifact，不能替换可信快照；Recovery Run 33244161458 只证明精确清理和零活跃残留，不证明实时 AWS 管线运行。",
			"最新 Run 33279132965 已完成唯一 eventId 最终对账、SQS/DLQ 全状态归零、Schema absence、Stack absence 与 12 类项目资源归零；INP n=1 仍明确标为低置信度。中央数值卡在导入精确机器分位数前继续保留既有可信快照。",
		],
		performance: {
			projectId: "performance-observability-control",
			projectName: "性能观测与成本控制",
			controlState: "stopped",
			liveHealthy: false,
			latestSnapshot: {
				captureId: "aws-run-33160455921",
				capturedAt: "2026-08-28T00:00:00.000Z",
				window: "1h-controlled",
				kind: "synthetic-closed-loop",
				source: {
					repository: "Tiancheng-Xu/babysteps",
					commitSha: "e40008e056d24199641fa978142f706051889f3b",
					workflowRunId: "33160455921",
					sdkVersion: "commit:e40008e056d2",
					cleanerVersion: "commit:e40008e056d2",
				},
				method: { percentile: "nearest-rank", sampleRate: 1 },
				metrics: [
					{
						name: "LCP",
						unit: "ms",
						page: "/performance",
						route: "/performance",
						sampleCount: 1,
						p50: 960,
						p75: 960,
						p95: 960,
						errorCount: 0,
					},
					{
						name: "FCP",
						unit: "ms",
						page: "all",
						route: "all",
						sampleCount: 1,
						p50: 960,
						p75: 960,
						p95: 960,
						errorCount: 0,
					},
					{
						name: "TTFB",
						unit: "ms",
						page: "all",
						route: "all",
						sampleCount: 1,
						p50: 8.5,
						p75: 8.5,
						p95: 8.5,
						errorCount: 0,
					},
					{
						name: "resource.script.duration",
						unit: "ms",
						page: "all",
						route: "all",
						sampleCount: 79,
						p50: 104.1,
						p75: 138.2,
						p95: 171.4,
						errorCount: 0,
					},
				],
				filters: {
					environment: "evidence",
					projectId: "performance-observability-control",
					cleanup: "verified",
				},
				schemaVersion: "performance-snapshot/v1",
				digest:
					"sha256:caeb28578ac4990c2eb1a8bb543ca3fb967adce7fa7b93ba848109fa0b504644",
			},
		},
		caseStudy: {
			stateNotice:
				"BabySteps AWS 临时观测链已完成 Run 33160455921 并精确清理；当前展示受控浏览器历史快照，不是持续生产趋势。LCP、FCP 与 TTFB 各只有 1 个样本，必须按低置信度解读；队列也未证明全量排空。",
			requirements: [
				{
					requirement: "性能 SDK、日志接收、清洗与可视化",
					implementation:
						"定义可验证的快照契约和公共状态卡；云端采集、队列、清洗任务按临时资源设计。",
					code: "src/features/performance/performance-state.ts",
					proof:
						"GitHub Run 33160455921 记录 415 个受控浏览器事件，Cleaner 写入 103 条；Dashboard 保存 LCP/FCP/TTFB 与脚本资源聚合。",
					state: "云端已验证",
				},
				{
					requirement: "观测服务停止或故障时展示上一次结果",
					implementation:
						"controlState 与 dataMode 分离；仅接受摘要、来源和百分位字段全部通过校验的快照。",
					code: "src/features/performance/performance-status-card.tsx",
					proof:
						"AWS Stack 清理后页面展示 Run 33160455921 的 historical 快照，并明确标注单样本与未全量排空边界。",
					state: "云端已验证",
				},
				{
					requirement: "Dashboard 与 Evidence 都提供启停入口",
					implementation:
						"两页复用同一状态卡并指向唯一、由站内 TOTP 与单次 nonce 保护的控制面。",
					code: "src/features/portfolio/dashboard-content.tsx 与 evidence-content.tsx",
					proof: "页面级回归测试验证统一状态和入口 URL。",
					state: "本地已实现",
				},
				{
					requirement: "启停、清理、权限与成本可审计",
					implementation:
						"D1 保存状态、TOTP 错误计数与操作记录，R2 保存不可变快照；公开接口验证摘要并支持 ETag，控制写入口在 GitHub App 接通前失败关闭。",
					code: "apps/performance-control-worker/src/{state-machine,snapshot,worker}.ts；GitHub Actions 工作流待部署",
					proof:
						"Run 33160455921 记录 Cleaner exitCode=0、Schema/Stack 删除成功、12 类项目资源为 0，共享资源保持 protected。",
					state: "云端已验证",
				},
			],
			sections: [
				{
					title: "运行架构",
					state: "设计已确认",
					summary:
						"公开页面只读 D1 投影；受保护控制面经 GitHub App 触发固定工作流，AWS 运行栈复用共享网络和数据库基础设施。",
					steps: [
						"浏览器读取 Dashboard 或 Evidence，Cloudflare Worker 返回带 ETag 的公开状态投影。",
						"状态卡把运行状态与数据模式分开：running 不等于一定已有快照，stopped 也可以安全展示历史快照。",
						"AWS 临时栈只创建项目范围的 API、SQS/DLQ、ECR、一次性 ECS task、Lambda、日志和安全组。",
						"清洗成功后写入应用级不可变 R2 快照，D1 只保存受信摘要与 latest 指针。",
					],
				},
				{
					title: "GitHub Actions 与发布",
					state: "设计已确认",
					summary:
						"Cloudflare 不持有通用 AWS 管理权限；GitHub App 只能派发仓库内固定的 validate、deploy、stop/cleanup 工作流。",
					steps: [
						"每次操作携带 operationId、generation 与幂等键，D1 先登记 pending。",
						"GitHub Environment OIDC 获取短期 AWS 凭据，角色只能管理精确项目名前缀资源。",
						"Webhook 使用 HMAC 校验，并以 operationId + generation + runId 做 CAS 更新，过期回调不能覆盖新状态。",
						"发布证据记录 commit SHA、workflow run、资源输出与清理结果，不保存长期密钥。",
					],
				},
				{
					title: "预览环境与灰度发布",
					state: "设计已确认",
					summary:
						"页面走 Cloudflare Preview 验证；AWS 观测链路以一次性短生命周期栈验收，不为每个 PR 常驻复制昂贵服务。",
					steps: [
						"PR 先运行类型、单测、构建、链接与预算门禁，再发布 Cloudflare Preview。",
						"控制面先在预览域名验证公开只读卡、Access 边界和固定工作流派发。",
						"AWS 验收采用小流量/合成请求闭环；单个 LCP 样本必须标为 synthetic-closed-loop，不冒充生产趋势。",
						"主版本只有在快照校验、DLQ 告警和清理验证均通过后才更新公开 latest 指针。",
					],
				},
				{
					title: "关键时序",
					state: "设计已确认",
					summary:
						"启动前先证明环境干净；停止时先封入口、再排空、留快照、删临时资源，最后才标记 stopped。",
					steps: [
						"启动：验证 cleanupVerified、临时栈/Schema/Role 为空 → 派发部署 → 健康检查 → running。",
						"采集：SDK 批量上报 → 队列 → 一次性 Cleaner → 聚合校验 → R2 快照 → D1 公共投影。",
						"停止：stopping → 禁止新写入 → 排空或按策略丢弃并记录队列/DLQ 数量 → 生成最终快照。",
						"清理：停止 ECS → 删除项目 Schema/Role → 删除精确项目栈 → 核对 AWS/DB 为空且共享资源未变。",
					],
				},
				{
					title: "权限、网络与安全边界",
					state: "设计已确认",
					summary:
						"公开面只读、控制面经 Access；AWS 使用按项目分离的短期 OIDC 角色，显式禁止删除共享资源。",
					steps: [
						"控制 API 校验 Cloudflare Access JWT 的 issuer、audience、expiry 和稳定身份 allowlist。",
						"Worker 不接收任意 AWS 参数，也不提供通用命令；只能选择允许的项目和固定动作。",
						"运行资源位于共享私网，复用共享 NAT、子网、RDS、ECS/OIDC 基础设施，不新建长期底座。",
						"公共审计脱敏管理员身份、私有 run URL、凭据和内部网络信息。",
					],
				},
				{
					title: "费用与共享基础设施",
					state: "设计已确认",
					summary:
						"目标是把增量费用压到按请求、按运行时长计费；长期资源统一复用，临时资源由项目工作流负责清理。",
					steps: [
						"复用共享 VPC、NAT、私有子网、受保护 RDS、ECS/OIDC、日志与制品基础设施。",
						"增量资源限制为项目 API、队列、短时 Cleaner task、少量日志和快照存储。",
						"停止入口必须先生成最终证据，再删除项目栈；共享 Foundation 永不由项目清理工作流删除。",
						"控制页展示预计资源、运行时长、队列状态和上次清理结果，避免“停了页面但云资源仍在”。",
					],
				},
				{
					title: "明确不做",
					state: "设计已确认",
					summary: "第一版主动排除高固定成本、高权限或超出当前交付闭环的能力。",
					steps: [
						"不采用 Athena、Glue、Firehose：当前数据量不足以抵消目录、管道和查询运维复杂度，SQS + 一次性 Cleaner 已能完成验收。",
						"不运行常驻 ECS：当前项目需要的是可复现清洗闭环，不需要为低频数据持续付费；改用按需 task。",
						"不为每个项目创建一套 OAuth/OIDC：复用受保护的账户级 OIDC provider，只把最小权限角色按项目隔离。",
						"不提供通用 AWS 管理控制台：避免把项目控制页变成高权限云控制面，用户只能执行固定启停动作。",
						"不允许 AI Agent 自动删除或重放资源：删除和 DLQ 重放会改变真实状态，必须由固定工作流、门禁和人工确认执行。",
					],
				},
			],
		},
	},
	{
		id: "shared-evidence-verifier",
		architectureAsset:
			"architecture/shared-evidence-verifier.visual-check.1440x900.light.png",
		title: "Shared Evidence Verifier",
		desc: "用共享身份与固定项目清单核对提交、生产页面和公开 Evidence，输出限定范围的脱敏检查记录。",
		summaryPoints: [
			"可信身份：GitHub OIDC 绑定仓库与分支，按最小权限取得短期云凭据，不存长期访问密钥。",
			"有界验证：固定清单串行核对 HTTP、页面语义与版本，限制响应、重试和日志；公开入口检查不代替私有 Runtime 或业务验收。",
			"结果与范围：历史 Run 33290528028 完成 6/6 串行项目检查，仅限该次公开交付；私有 head SHA 限制保留，新项目和新版本不能借用旧绿灯。",
		],
		status: "已完成",
		progress: 100,
		architecture:
			"固定项目清单 → GitHub OIDC（仓库身份与 main 绑定）→ AWS Budget Gate → 非 VPC Lambda 串行验证 → Production/Evidence HTTP 与语义检查 → 7 日脱敏 Artifact；不复制项目 Runtime。",
		evidenceUrl: `${DASHBOARD_EVIDENCE_BASE_URL}/shared-evidence-verifier`,
		repo: "Tiancheng-Xu/.github",
		skills: [
			"GitHub OIDC",
			"AWS Lambda",
			"CloudFormation",
			"Budget Gate",
			"Evidence",
			"Least Privilege",
		],
		evidence: [
			"共享验证 Run 33290528028 在固定 head 96d22e92b594 上完成 6/6 串行项目检查",
			"4 个公开仓库为 verified；2 个私有仓库为 verified-with-limitations，未把不可读取的仓库 SHA 冒充已核对",
			"预算门禁前后均为 $27.345 / $40，forecast unavailable；未升级套餐，也未创建 VPC、NAT、RDS、ECS 或 API Gateway",
			"共享 Stack 仅包含 2 个 IAM Role、1 个非 VPC Lambda 和 1 个 7 日 CloudWatch Log Group",
			"每个项目产出独立脱敏 Artifact，公开 URL、HTTP 语义、Evidence 入口和版本边界可追溯",
		],
		details: [
			"验证器不是业务运行时，也不证明项目内部功能、链上交易或模型能力；它只验证清单声明的公开交付面与证据入口。",
			"公开仓库可校验 main SHA；私有仓库在 GitHub App/OIDC 当前权限边界内无法读取 commit，因此保持 verified-with-limitations 和 headShaVerified=false。",
			"Lambda 按固定清单串行访问公开 HTTPS 端点，限制重试、响应体大小和日志字段；Token、Cookie、私有路径和响应正文不进入 Artifact。",
			"权威云端 Run 为 33290528028；实现 main 为 7473f746271e，验证器运行 head 为 96d22e92b594，二者分别证明 Evidence 发布与本次真实执行。",
		],
		ownerPage: "https://github.com/Tiancheng-Xu/.github",
		sourceUpdatedAt: "2026-08-30",
		caseStudy: {
			stateNotice:
				"共享 AWS 验证器已云端运行并保存脱敏 Artifact。公开仓库为 verified；私有仓库因当前读取权限限制，仅为 verified-with-limitations。",
			requirements: [
				{
					requirement: "固定身份与不可变来源",
					implementation:
						"GitHub Actions 通过 OIDC 获取短期 AWS 身份，工作流绑定 owner、repository ID、main 与精确 head SHA。",
					code: "Tiancheng-Xu/.github · reusable verifier workflow + CloudFormation",
					proof: "Run 33290528028 · head 96d22e92b594 · 6/6 jobs success",
					state: "云端已验证",
				},
				{
					requirement: "免费计划与成本保护",
					implementation:
						"部署和调用前执行 Budget Gate；复用一个非 VPC Lambda，不为每个项目创建业务 AWS Runtime。",
					code: "aws-budget-guard + tc-shared-evidence-verifier",
					proof:
						"before/after $27.345 / $40；forecast unavailable；Free plan unchanged",
					state: "云端已验证",
				},
				{
					requirement: "公开交付语义验证",
					implementation:
						"逐项目检查 Production、Evidence、HTTP 状态、最终 URL 和必要语义标记，而不是把 HTTP 200 直接当成功。",
					code: "fixed project manifest → verifier Lambda → per-project result",
					proof:
						"4 verified + 2 verified-with-limitations；每项目独立 Artifact",
					state: "云端已验证",
				},
				{
					requirement: "最小权限与隐私",
					implementation:
						"IAM 仅允许固定工作流调用验证器；日志和 Artifact 只保留脱敏摘要，不保存凭据、Cookie、正文或私有路径。",
					code: "2 IAM roles + 1 Lambda + 1 seven-day LogGroup",
					proof: "Stack UPDATE_COMPLETE；无 VPC/API/S3 bucket 新增",
					state: "云端已验证",
				},
			],
			sections: [
				{
					title: "运行架构",
					state: "云端已验证",
					summary:
						"共享层只负责验证公开交付事实，不侵入项目业务 Runtime；身份、预算、网络和 Evidence 形成四道边界。",
					steps: [
						"固定清单声明项目 ID、仓库、Production、Evidence 和允许验证的语义合同。",
						"GitHub OIDC 换取短期、最小权限 AWS 身份，不保存长期 AWS Key。",
						"Budget Gate 先判定成本边界，再调用单个非 VPC Lambda。",
						"Lambda 串行验证公开端点，输出每项目独立的脱敏 JSON Artifact。",
					],
				},
				{
					title: "串行验证时序",
					state: "云端已验证",
					summary:
						"一次 Run 内按固定顺序执行身份、预算、项目语义与结果分级；任何硬 Gate 失败都 fail-closed。",
					steps: [
						"Workflow 固定 ref 与 head SHA，校验调用来源。",
						"Budget Gate 读取实际用量和预算上限；不满足则停止。",
						"OIDC AssumeRole 后调用共享 Lambda，项目间不共享可变输入。",
						"公开仓库核对 SHA 与页面语义；私有仓库权限不足时降级为 verified-with-limitations。",
						"上传 7 日脱敏 Artifact，并由汇总 Job 核对 6/6 结果。",
					],
				},
				{
					title: "真实结果与限制",
					state: "云端已验证",
					summary:
						"本次运行证明共享验证链和公开交付入口可用，不把私有仓库、业务 Runtime 或外部云能力扩大为已验证。",
					steps: [
						"公开项目：fullstack-showcase、github-profile-studio、portfolio-sync、performance-observability-control 为 verified。",
						"私有项目：personal-ai-agent、tc-workflow 为 verified-with-limitations，headShaVerified=false。",
						"本次没有启动各项目 AWS Runtime、重放链上交易、上传模型权重或改变 Cloudflare 套餐。",
						"GitHub Actions 官方 action 的 Node 20 deprecation annotation 为已知非阻断警告。",
					],
				},
			],
		},
	},
	{
		id: "personal-ai-agent",
		architectureAsset:
			"architecture/personal-ai-agent.visual-check.1440x900.light.png",
		title: "Personal AI Agent 模型训练与本地推理",
		desc: "面向本机私有资料的可溯源本地知识问答，将历史 Qwen3-8B 训练交付与动态事实检索分开；业务工具与人工转接仍按系统方案描述。",
		summaryPoints: [
			"检索与引用：Markdown 分块，经 BM25 / 向量召回、RRF 与相关度重排组织证据；引用编号校验不等于逐主张语义支持，无证据应拒答。",
			"状态与评测：取消不继续降级返回；模型行为与检索质量分账。同一 49 条冻结集上 v2 bigram F1 为 0.2146、v3 为 0.2129，拒绝 v3 晋级，不当作 RAG 准确率。",
			"交付与方案：QLoRA、量化和 Ollama 为本机交付，公开 Evidence 为静态交付；知识图谱、业务工具与低置信度转人工仍按系统方案描述，真实生成与引用支持另行评测。",
		],
		status: "已完成",
		progress: 100,
		architecture:
			"训练历史：LlamaFactory + Qwen3-8B + NF4 QLoRA → Adapter 合并 → GGUF 量化 → Ollama；本地检索分支：Markdown → Qdrant / BM25 → RRF → Mastra / Ollama 相关度评分 → 引用规则 → LangGraph / SQLite Checkpoint；系统方案：业务工具与结构化规则 → 低置信度 / 敏感问题转人工。",
		evidenceUrl: "https://personal-ai-agent.baby2b.online/evidence/",
		repo: "Tiancheng-Xu/personal-ai-agent",
		skills: [
			"Qwen3-8B",
			"QLoRA / NF4",
			"LlamaFactory",
			"Intent Routing",
			"Knowledge Graph / RAG",
			"Qwen Embedding",
			"Tool Calling",
			"Human Handoff",
			"CUDA / NCCL",
			"GGUF / Q4_K_M",
			"Ollama",
		],
		evidence: [
			"双 RTX 5090 D、NCCL 通信与公平吞吐基准",
			"冻结集 Base F1 0.1481 → Adapter F1 0.2297，32 胜 / 3 平 / 5 负",
			"5.03 GB Q4_K_M GGUF 产物哈希与 Mac/Ollama 验收",
			"公开 Evidence JSON、20 个白名单资产及固定合成检索回归",
		],
		details: [
			"训练、冻结评测、量化和本机交付已完成；双卡吞吐 6.59 samples/s，相对单卡加速 1.743×。",
			"v4.1 独立行为门禁仅通过 4/26，不能描述为独立全能知识模型。",
			"公开成功问答来自同项目 8B QLoRA 基线，不是 v4.1 全门禁通过证明。",
			"2026-10-03 PR #13 / #14 已合并，生产 Evidence JSON 与 20 个公开资产已回读；只验证静态交付，不证明线上模型推理。",
			"当前 reranker 是 Mastra relevance scorer 对本地 Ollama 的评分适配，不因此称为专用 cross-encoder；模型 Reviewer / Arbiter 不等于人工审批。",
			"20 题合成 BM25 基线已跑；真实向量 / 混合 / 重排同数据比较、生成、逐主张语义引用支持与拒答统计仍待补证。个人训练、检索和编排责任分别核对，代理生成教学实验不算本人项目成果。",
		],
		ownerPage: "https://personal-ai-agent.baby2b.online/",
		renderingModes: ["CSR"],
	},
	{
		id: "fullstack-showcase",
		architectureAsset:
			"architecture/fullstack-showcase.visual-check.1440x900.light.png",
		title: "Showcase Dashboard",
		desc: "静态优先的作品系统，将经历、产品、公开 Evidence、开源贡献与学习分享组织成可追溯入口。",
		summaryPoints: [
			"内容与身份：人工审核决定项目定位、职责与证据链接；公开短摘要与私有事实源分开，设计能力不伪装成已验证交付。",
			"渲染与交互：SSG 先返回可读页面，水合后按需加载 Babylon 等交互；统一列表与详情返回路径，未知路由保持真实 404。",
			"同步与发布：Portfolio Sync 只为审核项目补充更新时间；内容经正常 PR、CI、预览和视觉门禁后发布，GitHub Profile 提炼同一事实，不机械复制。",
		],
		status: "已完成",
		progress: 100,
		architecture:
			"人工审核静态索引 + GitHub App/Cloudflare Worker 动态补充 + React SSG/Hydration + 项目自有 Evidence 深链 + 旧域名兼容重定向。",
		evidenceUrl: `${DASHBOARD_EVIDENCE_BASE_URL}/fullstack-showcase`,
		repo: "Tiancheng-Xu/fullstack-showcase",
		skills: ["React", "TypeScript", "SSG", "Hydration", "Cloudflare Pages"],
		evidence: [
			"静态索引与水合后 URL 保持一致，远端旧索引不能覆盖人工审核链接",
			"Dashboard 与内部 Evidence 生成可读 SSG HTML，并保留纯 CSR 降级",
			"项目自有 Evidence、旧域名重定向和发布清单由共享 Gate 约束",
		],
		details: [
			"Dashboard 展示已完成与进行中项目，状态和进度可同步，项目身份、标题、架构和 Evidence URL 由本地审核索引兜底。",
			"主要难点是避免 SSR 静态链接、水合后远端索引和旧 Evidence Hub 三套来源产生漂移。",
		],
		ownerPage: "https://baby2b.online/dashboard/",
		renderingModes: ["SSG", "Hydration", "CSR Fallback"],
	},
	{
		id: "github-profile-studio",
		architectureAsset:
			"architecture/github-profile-studio.visual-check.1440x900.light.png",
		title: "GitHub Profile Studio",
		desc: "同一前端契约下的 GitHub 资料审阅与白名单编辑工作台，兼容 Node / Go 后端并将结果保存到本地数据库。",
		summaryPoints: [
			"产品职责：只编辑显示名称与简介，身份和统计由服务端重取；保存写入本地 SQLite，不修改 GitHub 账号或 Profile README。",
			"统一契约：React / TanStack 前端复用 Hono / Node 与 Go API，运行时校验、幂等 upsert 和共享迁移保持边界一致。",
			"凭据与设计：令牌留服务端或 macOS 钥匙串，浏览器只接触白名单数据；公网 API / 容器托管按规划描述，不借公开 Evidence 页面证明服务运行。",
		],
		status: "进行中",
		progress: 85,
		architecture:
			"React/TanStack Router + Hono/Node 或 Go 双后端 + GitHub REST API + SQLite/Drizzle + macOS 钥匙串。",
		evidenceUrl: `${DASHBOARD_EVIDENCE_BASE_URL}/github-profile-studio`,
		repo: "Tiancheng-Xu/github-profile-studio",
		skills: ["React", "TypeScript", "Vite", "证据化交付"],
		evidence: ["本地全栈与双后端实现", "安全边界、测试与 CI 可审查"],
		details: [
			"服务端读取公开 GitHub 资料，浏览器只编辑显示名称和简介，数据幂等写入 SQLite。",
			"主要难点是让 Node 与 Go 后端保持同一 API/迁移契约，并确保凭据永不进入浏览器或公开错误。",
		],
		renderingModes: ["CSR"],
		ownerPage: "https://github.com/Tiancheng-Xu/github-profile-studio",
	},
	{
		id: "portfolio-sync",
		architectureAsset:
			"architecture/portfolio-sync.visual-check.1440x900.light.png",
		title: "Portfolio Sync",
		desc: "Showcase 的仓库事件同步子系统，将授权仓库的发布清单转为可核对索引，同时保留人工审核的项目身份。",
		summaryPoints: [
			"来源治理：过滤非授权、fork、归档与未声明有效发布清单的仓库；自动发现不等于自动进入公开作品集。",
			"事件与身份：Webhook 验原始字节的 HMAC，GitHub App 用短期只读 Installation Token 拉取清单，拒绝无效来源。",
			"一致性取舍：Worker / KV 保存索引，定时全量刷新补齐遗漏；主站只补充更新时间，不覆盖叙事或证据链接。当前增强已实现只读 OpenAPI 契约、摘要 / 按项目读取、分页与 ETag / 304 / HEAD，尚未部署。",
		],
		status: "已完成",
		progress: 100,
		architecture:
			"GitHub Webhook + HMAC 验签 + 只读 Installation Token + Cloudflare Worker/KV + Dashboard 运行时合并 + 30 分钟定时兜底。",
		evidenceUrl: `${DASHBOARD_EVIDENCE_BASE_URL}/portfolio-sync`,
		repo: "Tiancheng-Xu/fullstack-showcase/tree/main/workers/portfolio-sync-webhook",
		skills: [
			"GitHub App",
			"Cloudflare Workers",
			"Workers KV",
			"Webhook Security",
		],
		evidence: [
			"GitHub App 仅授予仓库内容只读权限",
			"Webhook 即时同步与定时全量刷新双链路",
			"增强测量：同一冻结的 13 项目样本，完整 / 摘要未压缩 UTF-8 响应体为 41,256 / 3,404 字节；304 与 HEAD 响应体为 0。这是固定样本回执，不是现网或 token / CPU 指标；增强尚未部署。",
		],
		details: [
			"仓库存在 Baby2B 发布清单且声明 Evidence URL 时才进入作品集，避免把学习仓库和普通实验误收录。",
			"主要难点是同时处理 webhook 验签、短期安装令牌、KV 最终一致性与主站静态回退。增强保留默认完整响应，将分页绑定快照与查询，避免混用不同版本。",
		],
		ownerPage:
			"https://github.com/Tiancheng-Xu/fullstack-showcase/tree/main/workers/portfolio-sync-webhook",
	},
	{
		id: "tc-workflow",
		title: "TC Flow 2.1",
		desc: "把 AI 辅助研发组织为契约、任务、独立 Review、Checkpoint 与整体验收的工程工作流。",
		summaryPoints: [
			"契约先行：明确范围、验收标准与 Agent / Skill / Tool 分工，发现输入或版本漂移时重新核对，而非沿用旧批准。",
			"恢复与审查：N1-N8 节点、检查点和 RunResult 留痕，失败回到对应节点；实现者、Review 和 QA 责任分离。",
			"交付分层：代码、局部测试、整品验收与生产回读分别记账；流程 Gate 约束交付，不保证任意项目自动完成，新 Adapter 按对应版本说明。",
		],
		status: "已完成",
		progress: 100,
		architecture:
			"N1-N8 节点主链 + Task Review Gate + P0/PII/Fallback/Human Gate + Checkpoint/RunResult 持久化。",
		evidenceUrl: `${DASHBOARD_EVIDENCE_BASE_URL}/tc-workflow`,
		repo: "Tiancheng-Xu/personal-skills/tree/main/skills/tc-flow",
		skills: ["TC Flow", "任务编排", "上下文治理", "验收闭环"],
		evidence: [
			"任务拆分、执行、验收链路可追踪",
			"流程中引入 evidence-first 的交付方式",
		],
		details: [
			"该条目用于展示流程编排实践与 Feature 交付闭环。",
			"主要难点是把执行记录、检查点和验收证据连接成可回看的工作流。",
		],
		ownerPage:
			"https://github.com/Tiancheng-Xu/personal-skills/tree/main/skills/tc-flow",
	},
	{
		id: "hatch-pet",
		title: "Hatch Pet",
		desc: "从概念或获准参考到角色一致性、动作与方向、审阅和安装包的宠物生成流程设计；公开入口展示产品规格。",
		summaryPoints: [
			"生成流程设计：先固定角色身份，再组织动作与方向；已批准行保持完整，不把单张好看的图片视为整包交付。",
			"质量机制设计：九种动作、16 个观察方向与 Codex v2 图集契约结合；确定性格式校验与独立视觉审查分别负责机械规则和语义。",
			"交付边界：本人确认的产品交付与当前公开规格分层；公开仓库未展示生成器或样例，取消、续跑和私有实现能力不凭 PRD 推定。",
		],
		status: "进行中",
		progress: 20,
		architecture:
			"概念 / 获准参考 → 角色身份基准 → 动画与方向姿态 → 几何及视觉质量门禁 → Codex v2 包；这是 PRD 目标，不代表公开实现已交付。",
		repo: "Tiancheng-Xu/hatch-pet",
		skills: ["Codex Pets", "Sprite Atlas", "Image Generation", "Visual QA"],
		evidence: ["公开仓库已发布脱敏 README 和 PRD；代码与宠物样例未公开。"],
		details: [
			"公开版本只定义输入输出、9 种动画状态、16 个方向、确定性校验与人工视觉审查；暂无可下载生成器。",
			"私人参考图、角色素材、运行日志和凭据不进入公开仓库；后续代码与示例需另行完成权利和隐私审查。",
		],
		ownerPage: "https://github.com/Tiancheng-Xu/hatch-pet",
		sourceUpdatedAt: "2026-09-20",
	},
	{
		id: "oss-contributions",
		title: "OSS 共建",
		desc: "围绕真实工具缺陷完成复现、根因定位、最小修复与上游评审协作，只认领本人贡献，不认领上游整体产品。",
		summaryPoints: [
			"复现与定位：先冻结失败条件和输入，再追踪兼容性、缓存、模块解析或工具协议的根因，避免只改表面现象。",
			"修复与回归：以最小变更和针对性测试支撑提交，明确本地工具限制与未运行项，接受上游代码审查和后续修订。",
			"贡献状态：已合并、开放 PR、调查中和本地未推送分别记录；沿用可核验贡献入口，不把历史数量或上游发布当作当前新成果。",
		],
		status: "进行中",
		progress: 60,
		architecture:
			"Issue claim → reproducible fixture → focused regression → minimal fix → upstream review；公开状态严格区分已合并、开放 PR 与调查中问题。",
		repo: "Tiancheng-Xu/Tiancheng-Xu",
		skills: ["TypeScript", "Deno", "Next.js", "MCP", "Web Performance"],
		evidence: [
			"9 个已合并贡献与 18 个开放 PR 持续接受上游评审",
			"Next.js #98732 已完成自定义缓存冷启动 500 的可复现验证",
			"Next.js #98791 已认领，正在追踪 pnpm hoisted-store 悬空链接问题",
		],
		details: [
			"只在确认无竞争后认领问题；没有可复现证据或必要验证工具时不推送。",
			"所有公开提交使用 Tiancheng-Xu 身份，状态页不把开放 PR 冒充为上游已接受。",
		],
		ownerPage: "https://github.com/Tiancheng-Xu",
		sourceUpdatedAt: "2026-09-17",
	},
	{
		id: "babysteps",
		architectureAsset: "architecture/babysteps.visual-check.1440x900.light.png",
		title: "BabySteps",
		desc: "访客优先的家庭成长产品，从轻量亲子任务进入成长积分、钱包交互与进阶证书体验；产品流程与链上事实分层核对。",
		summaryPoints: [
			"产品主线：无需钱包即可开始访客任务，再按需进入登录、成长积分与链上体验；访客本地进度不替代已购内容或证书授权。",
			"身份与资产：钱包连接、网络就绪、业务授权与交易成功分别判断；购买、完成与证书依据对应资源和回执，不由页面状态代替。",
			"渲染与边界：Edge SSR 返回安全摘要壳，按路径和版本水合浏览器能力；致命错误一次性 CSR 回退，可恢复错误留痕。进阶新流程与历史生产回执分账，不宣称育儿效果。",
		],
		status: "已完成",
		progress: 100,
		architecture:
			"Cloudflare Pages Advanced Worker Edge SSR → marker/path/version 水合门禁 → client-only 身份/钱包/Web3/性能 SDK → pure CSR fallback；built Worker 运行矩阵进入共享 Gate。",
		evidenceUrl: "https://babysteps.baby2b.online/evidence/",
		repo: "Tiancheng-Xu/babysteps",
		skills: [
			"Static-First Delivery",
			"Edge SSR",
			"React Hydration",
			"Cloudflare Pages",
			"BackstopJS",
			"Core Web Vitals",
			"BrowserRouter",
			"Release Gate",
		],
		evidence: [
			"九条生产路由、尾斜杠、真实 404、API/资产直通和缓存策略",
			"完整 React Stream 超时、late error 与 one-shot CSR fallback",
			"216 项 Web 测试、22 项 Node Gate 与 560,008-byte server artifact",
			"Cloudflare Preview/Production、自定义域名、pages.dev、TLS 与响应头验证",
			"性能页分层布局与 BackstopJS 视觉回归已通过 375/390/430/1440 生产 Gate，main 798f557、Verify Run 33229705200、Cloudflare Deployment 24c7af9c 均可追溯",
			"AWS Recovery Evidence 已由 main 121ebc47、Verify Run 33245253835 与 Cloudflare Deployment 11e51b2f 发布；Recovery Run 33244161458 证明精确 Stack 清理和零活跃项目残留",
			"多应用性能采样闭环已由 AWS Run 33279132965、Artifact 9722636468、main 424f82e7、Verify Run 33280854201 与 Cloudflare Deployment 202545f9 生产验证",
		],
		details: [
			"公开页面由边缘服务器输出安全、可读的摘要壳；身份、钱包、链上交互和性能 SDK 只在浏览器水合后激活。",
			"项目发现反向更新 shared standard、JS detector、TC Flow N6 和 GitHub reusable workflow。",
			"原 Dashboard 与 Evidence 的 SSG 路线只保留为兼容性回归，不再承担主工作证明。",
			"性能布局发布只修改 UI 与视觉 Gate，没有启动 AWS Runtime；真实 AWS 性能链仍由 Run 33160455921 单独证明。",
			"最新 Evidence 发布后浏览器埋点仍会调用性能 API；AWS Runtime 已关闭，因此 events/stats 返回 503 并诚实回退历史快照，不代表实时管线运行。",
			"新闭环覆盖 /、/tasks、/profile、/performance、/evidence，使用真实无副作用交互产生 INP，CLS 保留真实稳定样本；85 个唯一事件全部 accepted，清理后 AWS 项目资源为 0。",
			"2026-10-02 静态回读区分钱包连接、网络就绪与业务授权；性能按事件、版本和样本呈现，unknown / unavailable 不填 0。本轮未重跑链上、性能或发布验收，个人责任按模块确认。",
		],
		ownerPage: "https://babysteps.baby2b.online/",
		sourceUpdatedAt: "2026-08-29",
		renderingModes: [
			"Edge SSR",
			"Hydration",
			"CSR Fallback",
			"Client-only Web3",
		],
	},
];

const VERIFIED_RENDERING_MODES: Partial<Record<string, RenderingMode[]>> = {
	babysteps: ["Edge SSR", "Hydration", "CSR Fallback", "Client-only Web3"],
};

export function getProjectRenderingModes(project: PortfolioProject) {
	return project.renderingModes ?? VERIFIED_RENDERING_MODES[project.id] ?? [];
}

export function getProjectPageLinks(
	project: PortfolioProject,
): ProjectPageLink[] {
	const links: ProjectPageLink[] = [];
	if (project.performance) {
		links.push({
			id: "control",
			label: "控制面",
			href: performanceControlPath(
				performanceApplicationIdForControlProject(project.id),
			),
		});
	}
	if (project.ownerPage) {
		links.push({ id: "project", label: "项目主页", href: project.ownerPage });
	}
	if (project.evidenceUrl) {
		links.push({
			id: "evidence",
			label: "工作证明",
			href: project.evidenceUrl,
		});
	}
	return links;
}

export const PROJECTS_INDEX = PORTFOLIO_PROJECTS.reduce<
	Record<string, PortfolioProject>
>((acc, item) => {
	acc[item.id] = item;
	return acc;
}, {});
