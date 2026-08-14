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
	ownerPage?: string;
};

const EVIDENCE_BASE_URL = "https://evidence.baby2b.online";

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
	{
		id: "personal-ai-agent",
		title: "Personal AI Agent",
		desc: "个人 AI Agent 尝试，围绕 LLM 微调、RAG 与多引擎编排展开。",
		status: "进行中",
		progress: 65,
		architecture: "LLM 编排层 + 检索层（RAG/向量）+ 外部工具调用适配层。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/personal-ai-agent/`,
		repo: "Tiancheng-Xu/personal-ai-agent",
		skills: ["LLM", "RAG", "QLoRA", "多模型编排"],
		evidence: [
			"Qwen3-8B QLoRA 与 GGUF 训练路径",
			"RAG / Rerank 以及多工具链接入设计",
		],
		details: [
			"仓库使用模型微调、检索增强与多模型路由试验。",
			"主要难点是把实验链路拆成可复用的检索、推理和工具适配边界。",
		],
	},
	{
		id: "github-profile-studio",
		title: "GitHub Profile Studio",
		desc: "公开仓库版本，完成了前端交付与可视化验收。",
		status: "已完成",
		progress: 100,
		architecture: "React 路由 + 页面卡片模型 + 证据数据索引，构建项目看板与 evidence 流程。",
		evidenceUrl: `${EVIDENCE_BASE_URL}/github-profile-studio/`,
		repo: "Tiancheng-Xu/github-profile-studio",
		skills: ["React", "TypeScript", "Vite", "证据化交付"],
		evidence: ["本地全栈实现", "可视验收记录完整"],
		details: [
			"面向 GitHub Profile 的结构化展示页面与配置能力。",
			"主要难点是把项目展示、证据入口和响应式布局组织成可维护的数据驱动结构。",
		],
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
];

export const PROJECTS_INDEX = PORTFOLIO_PROJECTS.reduce<Record<string, PortfolioProject>>(
	(acc, item) => {
		acc[item.id] = item;
		return acc;
	},
	{},
);
