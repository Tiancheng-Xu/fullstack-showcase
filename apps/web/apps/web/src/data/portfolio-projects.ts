import type { PerformanceProjectStatus } from "@/features/performance/performance-types";

export type RenderingMode =
	| "SSR"
	| "Edge SSR"
	| "SSG"
	| "CSR"
	| "Hydration"
	| "CSR Fallback"
	| "Client-only Web3"
	| "Cloud Preview Pending";

export type EvidenceState = "本地已实现" | "设计已确认" | "云端未部署";

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
	status: "已完成" | "进行中";
	progress: number;
	architecture: string;
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

const EVIDENCE_BASE_URL = "https://evidence.baby2b.online";

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
	{
		id: "agent-market",
		title: "Agent Market",
		desc: "面向 AI Agent 的可验证任务市场，已接入本地 Ollama、DeepSeek、Kimi、Qwen、Zhipu 与多 Agent GraphQL 编排预览。",
		status: "进行中",
		progress: 78,
		architecture:
			"Cloudflare Pages Edge SSR + Local Runtime/Tunnel + provider API adapters + GraphQL DAG orchestration + Evidence gate。",
		evidenceUrl: "https://evidence.baby2b.online/agent-market/",
		repo: "Tiancheng-Xu/agent-market",
		skills: ["React", "TypeScript", "Cloudflare", "Ollama", "GraphQL", "Solidity"],
		evidence: [
			"Cloudflare Preview 已通过 Edge SSR、404、Catalog 与 Evidence 读回",
			"公开 Agent Catalog 返回 22 个脱敏 agent，覆盖本地模型与 provider API 模型",
			"重要节点 Evidence ledger 已记录 verified / implemented / pending 边界",
		],
		details: [
			"一期聚焦 Agent 注册、任务生命周期、可解释匹配、YD 托管结算、仲裁与 Evidence-first 交付。",
			"当前公开链接使用 Cloudflare Preview；本地 Runtime 未挂载到 Preview 时，Live chat 会明确显示 offline。",
			"Kimi 默认走 Moonshot China endpoint 与 kimi-k2.7-code；非默认模型保持 pending-smoke。",
		],
		renderingModes: ["Edge SSR", "Hydration", "Client-only Web3", "Cloud Preview Pending"],
		ownerPage: "https://agent-market.baby2b.online/",
		sourceUpdatedAt: "2026-08-22",
	},
	{
		id: "performance-observability-control",
		title: "性能观测与成本控制",
		desc: "为 AWS 性能观测链路补齐可信快照、启停控制、清理验证和可追溯 Evidence。",
		status: "进行中",
		progress: 55,
		architecture:
			"Cloudflare 状态与控制面 + GitHub Actions 固定工作流 + AWS 临时观测资源 + D1 审计状态 + R2 不可变快照。",
		evidenceUrl: "/evidence/performance-observability-control",
		repo: "Tiancheng-Xu/fullstack-showcase",
		skills: ["Performance SDK", "Cloudflare", "AWS", "Evidence"],
		evidence: [
			"停服时只展示最后一次校验通过的真实快照",
			"启停、清理和共享资源保护边界",
			"运行架构、发布流程、关键时序与明确非目标",
		],
		details: [
			"本地状态模型、公共状态卡、Evidence 页面、D1 状态机、R2 快照校验和公开只读接口已实现并由测试约束。",
			"控制写入口保持失败关闭；Access、GitHub App、Actions 与 AWS 观测资源仍未部署，没有真实快照时明确显示无数据，不生成演示指标。",
		],
		performance: {
			projectId: "performance-observability-control",
			projectName: "性能观测与成本控制",
			controlState: "stopped",
			liveHealthy: false,
			latestSnapshot: null,
		},
		caseStudy: {
			stateNotice:
				"本地状态模型、Dashboard/Evidence、D1/R2 契约和公开只读 Worker 已实现；控制写入口保持失败关闭，Access、GitHub App、Actions 与 AWS 运行栈未部署，因此当前没有可展示的真实性能快照。",
			requirements: [
				{
					requirement: "性能 SDK、日志接收、清洗与可视化",
					implementation:
						"定义可验证的快照契约和公共状态卡；云端采集、队列、清洗任务按临时资源设计。",
					code: "src/features/performance/performance-state.ts",
					proof:
						"performance-state.test.ts 与页面集成测试通过后记录到交付 Evidence。",
					state: "本地已实现",
				},
				{
					requirement: "观测服务停止或故障时展示上一次结果",
					implementation:
						"controlState 与 dataMode 分离；仅接受摘要、来源和百分位字段全部通过校验的快照。",
					code: "src/features/performance/performance-status-card.tsx",
					proof: "无快照时页面显示“暂无可信快照”，不会生成模拟数据。",
					state: "本地已实现",
				},
				{
					requirement: "Dashboard 与 Evidence 都提供启停入口",
					implementation:
						"两页复用同一状态卡并指向唯一、受 Cloudflare Access 保护的控制面。",
					code: "src/features/portfolio/dashboard-content.tsx 与 evidence-content.tsx",
					proof: "页面级回归测试验证统一状态和入口 URL。",
					state: "本地已实现",
				},
				{
					requirement: "启停、清理、权限与成本可审计",
					implementation:
						"D1 保存状态/操作记录，R2 保存不可变快照；公开接口验证摘要并支持 ETag，控制写入口在 Access 与 GitHub App 接通前失败关闭。",
					code: "apps/performance-control-worker/src/{state-machine,snapshot,worker}.ts；GitHub Actions 工作流待部署",
					proof:
						"Worker 状态机、快照和只读 API 共 13 个测试通过；真实云端 run、资源清单和清理验证待补。",
					state: "本地已实现",
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
		id: "personal-ai-agent",
		title: "Personal AI Agent 模型训练与本地推理",
		desc: "独立完成 Qwen3-8B 双卡 QLoRA、冻结集对照、GGUF 量化与 Mac/Ollama 离线交付；公开模型门禁与能力边界。",
		status: "已完成",
		progress: 100,
		architecture:
			"数据审计 → SFT 320/40/40 → 单节点双 RTX 5090 D NF4 QLoRA → 冻结评测 → Adapter 合并 → F16→Q4_K_M GGUF → SHA-256 → Mac/Ollama 离线验收。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/personal-ai-agent/`,
		repo: "Tiancheng-Xu/personal-ai-agent",
		skills: [
			"Qwen3-8B",
			"QLoRA / NF4",
			"CUDA / NCCL",
			"GGUF / Q4_K_M",
			"Ollama",
		],
		evidence: [
			"双 RTX 5090 D、NCCL 通信与公平吞吐基准",
			"冻结集 Base F1 0.1481 → Adapter F1 0.2297，32 胜 / 3 平 / 5 负",
			"5.03 GB Q4_K_M GGUF 产物哈希与 Mac/Ollama 验收",
			"13 项脱敏资产、真实问答和双站发布记录",
		],
		details: [
			"训练、冻结评测、量化和本机交付已完成；双卡吞吐 6.59 samples/s，相对单卡加速 1.743×。",
			"v4.1 独立行为门禁仅通过 4/26，不能描述为独立全能知识模型。",
			"公开成功问答来自同项目 8B QLoRA 基线，不是 v4.1 全门禁通过证明。",
			"RAG、引用校验和多 Agent 是产品补偿架构；未审计到的运行时能力不标为已验证。",
		],
		ownerPage: "https://personal-ai-agent.baby2b.online/",
		renderingModes: ["CSR"],
	},
	{
		id: "github-profile-studio",
		title: "GitHub Profile Studio",
		desc: "本地优先的 GitHub 公开资料工作台，前后端与双运行时已完成，公网部署仍在规划。",
		status: "进行中",
		progress: 85,
		architecture:
			"React/TanStack Router + Hono/Node 或 Go 双后端 + GitHub REST API + SQLite/Drizzle + macOS 钥匙串。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/github-profile-studio/`,
		repo: "Tiancheng-Xu/github-profile-studio",
		skills: ["React", "TypeScript", "Vite", "证据化交付"],
		evidence: ["本地全栈与双后端实现", "安全边界、测试与 CI 可审查"],
		details: [
			"服务端读取公开 GitHub 资料，浏览器只编辑显示名称和简介，数据幂等写入 SQLite。",
			"主要难点是让 Node 与 Go 后端保持同一 API/迁移契约，并确保凭据永不进入浏览器或公开错误。",
		],
		renderingModes: ["CSR"],
	},
	{
		id: "baby2b-deployment-evidence",
		title: "Baby2B Evidence Hub",
		desc: "集中发布真实项目的工作证明、架构说明、验证结果与交付限制。",
		status: "已完成",
		progress: 100,
		architecture:
			"发布流水线入口 + 日志与回滚记录 + 结果归档，形成可追溯的交付闭环。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/`,
		repo: "Tiancheng-Xu/baby2b-online-deployment-evidence",
		skills: ["Cloudflare Pages", "部署验证", "交付文档", "日志归档"],
		evidence: ["发布流程文档", "部署结果与验证记录"],
		details: [
			"主要沉淀发布过程中的关键日志、脚本与回滚记录。",
			"主要难点是让证据材料和真实发布动作保持一致，避免只留下不可复现的截图。",
		],
		renderingModes: ["SSG", "Hydration", "CSR Fallback"],
	},
	{
		id: "portfolio-sync",
		title: "Portfolio Sync",
		desc: "GitHub App 与 Cloudflare Worker 驱动的作品集同步系统，把真实项目仓库的发布清单自动汇总到 Dashboard。",
		status: "已完成",
		progress: 100,
		architecture:
			"GitHub Webhook + HMAC 验签 + 只读 Installation Token + Cloudflare Worker/KV + Dashboard 运行时合并 + 30 分钟定时兜底。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/portfolio-sync/`,
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
		],
		details: [
			"仓库存在 Baby2B 发布清单且声明 Evidence URL 时才进入作品集，避免把学习仓库和普通实验误收录。",
			"主要难点是同时处理 webhook 验签、短期安装令牌、KV 最终一致性与主站静态回退。",
		],
		ownerPage: "https://portfolio-sync.baby2b.online/health",
	},
	{
		id: "tc-workflow",
		title: "TC Flow 2.1",
		desc: "本地 Skill 与工程工作流，把 Feature 开发拆成可恢复、可审查、可阻断的 N1-N8 交付流程。",
		status: "已完成",
		progress: 100,
		architecture:
			"N1-N8 节点主链 + Task Review Gate + P0/PII/Fallback/Human Gate + Checkpoint/RunResult 持久化。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/tc-workflow/`,
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
	},
	{
		id: "babysteps",
		title: "BabySteps",
		desc: "家庭成长 DApp，并以真实生产链验证 Edge SSR、安全摘要壳、精确水合、浏览器能力激活与一次性纯 CSR 降级。",
		status: "已完成",
		progress: 100,
		architecture:
			"Cloudflare Pages Advanced Worker Edge SSR → marker/path/version 水合门禁 → client-only 身份/钱包/Web3/性能 SDK → pure CSR fallback；built Worker 运行矩阵进入共享 Gate。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/babysteps/`,
		repo: "Tiancheng-Xu/babysteps",
		skills: [
			"Static-First Delivery",
			"Edge SSR",
			"React Hydration",
			"Cloudflare Pages",
			"BrowserRouter",
			"Release Gate",
		],
		evidence: [
			"九条生产路由、尾斜杠、真实 404、API/资产直通和缓存策略",
			"完整 React Stream 超时、late error 与 one-shot CSR fallback",
			"216 项 Web 测试、22 项 Node Gate 与 560,008-byte server artifact",
			"Cloudflare Preview/Production、自定义域名、pages.dev、TLS 与响应头验证",
		],
		details: [
			"公开页面由边缘服务器输出安全、可读的摘要壳；身份、钱包、链上交互和性能 SDK 只在浏览器水合后激活。",
			"项目发现反向更新 shared standard、JS detector、TC Flow N6 和 GitHub reusable workflow。",
			"原 Dashboard 与 Evidence 的 SSG 路线只保留为兼容性回归，不再承担主工作证明。",
		],
		ownerPage: "https://babysteps.baby2b.online/",
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
			href: `/performance-control?project=${project.id}`,
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
