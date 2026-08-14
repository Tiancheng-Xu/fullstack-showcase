export type RenderingMode =
	| "SSR"
	| "Edge SSR"
	| "SSG"
	| "CSR"
	| "Hydration"
	| "CSR Fallback"
	| "Client-only Web3"
	| "Cloud Preview Pending";

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
};

const EVIDENCE_BASE_URL = "https://evidence.baby2b.online";

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
	{
		id: "personal-ai-agent",
		title: "Personal AI Agent 模型训练与本地推理",
		desc: "独立完成 Qwen3-8B 双卡 QLoRA、冻结集对照、GGUF 量化与 Mac/Ollama 离线交付；公开模型门禁与能力边界。",
		status: "已完成",
		progress: 100,
		architecture: "数据审计 → SFT 320/40/40 → 单节点双 RTX 5090 D NF4 QLoRA → 冻结评测 → Adapter 合并 → F16→Q4_K_M GGUF → SHA-256 → Mac/Ollama 离线验收。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/personal-ai-agent/`,
		repo: "Tiancheng-Xu/personal-ai-agent",
		skills: ["Qwen3-8B", "QLoRA / NF4", "CUDA / NCCL", "GGUF / Q4_K_M", "Ollama"],
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
		architecture: "React/TanStack Router + Hono/Node 或 Go 双后端 + GitHub REST API + SQLite/Drizzle + macOS 钥匙串。",
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
		architecture: "发布流水线入口 + 日志与回滚记录 + 结果归档，形成可追溯的交付闭环。",
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
		architecture: "GitHub Webhook + HMAC 验签 + 只读 Installation Token + Cloudflare Worker/KV + Dashboard 运行时合并 + 30 分钟定时兜底。",
		evidenceUrl: EVIDENCE_BASE_URL + "/portfolio-sync/",
		repo: "Tiancheng-Xu/fullstack-showcase/tree/main/workers/portfolio-sync-webhook",
		skills: ["GitHub App", "Cloudflare Workers", "Workers KV", "Webhook Security"],
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
		architecture: "N1-N8 节点主链 + Task Review Gate + P0/PII/Fallback/Human Gate + Checkpoint/RunResult 持久化。",
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
		id: "static-first-delivery",
		title: "Static-First Delivery",
		desc: "以 BabySteps 生产项目验证 Edge SSR、安全摘要壳、精确水合、浏览器能力激活与一次性纯 CSR 降级。",
		status: "已完成",
		progress: 100,
		architecture: "Cloudflare Pages Advanced Worker Edge SSR → marker/path/version 水合门禁 → client-only 身份/钱包/Web3/性能 SDK → pure CSR fallback；built Worker 运行矩阵进入共享 Gate。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/static-first-delivery/`,
		repo: "Tiancheng-Xu/babysteps",
		skills: ["Edge SSR", "React Hydration", "Cloudflare Pages", "BrowserRouter", "Release Gate"],
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
		renderingModes: ["Edge SSR", "Hydration", "CSR Fallback", "Client-only Web3"],
	},
];

const VERIFIED_RENDERING_MODES: Partial<Record<string, RenderingMode[]>> = {
	babysteps: [
		"Edge SSR",
		"Hydration",
		"CSR Fallback",
		"Client-only Web3",
	],
};

export function getProjectRenderingModes(project: PortfolioProject) {
	return project.renderingModes ?? VERIFIED_RENDERING_MODES[project.id] ?? [];
}

export const PROJECTS_INDEX = PORTFOLIO_PROJECTS.reduce<Record<string, PortfolioProject>>(
	(acc, item) => {
		acc[item.id] = item;
		return acc;
	},
	{},
);
