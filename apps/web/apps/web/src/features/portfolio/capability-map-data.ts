export type CapabilityTone = "violet" | "blue" | "vermilion" | "jade";

export type CapabilityNode = {
	id: string;
	iconSlug: string;
  label: string;
  summary: string;
  projectIds: string[];
  evidence: string;
  linkLabel?: string;
};

export type CapabilityDomain = {
  id: string;
  label: string;
  subtitle: string;
  tone: CapabilityTone;
  nodes: CapabilityNode[];
};

const evidence = {
  agent: "https://agent-market.baby2b.online/evidence/",
  babySteps: "https://babysteps.baby2b.online/evidence/",
  dashboard: "https://baby2b.online/evidence/fullstack-showcase",
  personalAgent: "https://personal-ai-agent.baby2b.online/evidence/",
  profileStudio: "https://baby2b.online/evidence/github-profile-studio",
  performance: "https://baby2b.online/evidence/performance-observability-control",
  tcFlow: "https://baby2b.online/evidence/tc-workflow",
};

export const CAPABILITY_DOMAINS: CapabilityDomain[] = [
  {
    id: "ai-agent",
    label: "AI / Agent",
    subtitle: "模型、检索、工具与评测闭环",
    tone: "violet",
    nodes: [
			{ id: "qwen3-qlora", iconSlug: "huggingface", label: "Qwen3 / QLoRA", summary: "双卡 QLoRA 微调、模型合并、GGUF 量化与本地推理交付。", projectIds: ["personal-ai-agent"], evidence: evidence.personalAgent },
			{ id: "rag-rerank", iconSlug: "langchain", label: "RAG / Rerank", summary: "把检索、重排与事实边界组合为可审查的知识增强链路。", projectIds: ["personal-ai-agent", "agent-market"], evidence: evidence.personalAgent },
			{ id: "agent-runtime", iconSlug: "anthropic", label: "Agent Runtime", summary: "以任务状态、权限和运行证据约束 Agent 的真实执行范围。", projectIds: ["agent-market"], evidence: evidence.agent },
			{ id: "tool-calling", iconSlug: "bruno", label: "Tool Calling", summary: "编排受控工具调用，并保留失败、降级和权限边界。", projectIds: ["agent-market", "personal-ai-agent"], evidence: evidence.agent },
			{ id: "mcp-memory", iconSlug: "redis", label: "MCP / Memory", summary: "组织工具协议、上下文和可恢复记忆，不把本地状态冒充线上能力。", projectIds: ["personal-ai-agent"], evidence: evidence.personalAgent },
			{ id: "evaluation", iconSlug: "jest", label: "Evaluation", summary: "冻结评测集、回归 Gate 与 Evidence 共同证明模型和流程结果。", projectIds: ["personal-ai-agent", "tc-workflow"], evidence: evidence.personalAgent },
    ],
  },
  {
    id: "full-stack",
    label: "Full Stack",
    subtitle: "多运行时全栈产品工程",
    tone: "blue",
    nodes: [
			{ id: "react-tanstack", iconSlug: "react", label: "React / TanStack", summary: "构建可路由、可水合、可测试的复杂前端产品。", projectIds: ["fullstack-showcase", "github-profile-studio"], evidence: evidence.dashboard },
			{ id: "typescript", iconSlug: "typescript", label: "TypeScript", summary: "以类型合同贯穿浏览器、服务端、构建和自动化脚本。", projectIds: ["fullstack-showcase", "agent-market"], evidence: evidence.dashboard },
			{ id: "hono-go", iconSlug: "go", label: "Hono / Go", summary: "用同一 API 契约验证 Hono/Node 与 Go 双后端。", projectIds: ["github-profile-studio"], evidence: evidence.profileStudio },
			{ id: "cocos-creator", iconSlug: "cocos", label: "Cocos Creator", summary: "以 Cocos Creator 构建可运行的虚拟办公室，让 Agent Market 的任务协作以交互式场景呈现。", projectIds: ["agent-market"], evidence: "https://agent-market.baby2b.online/office/", linkLabel: "查看虚拟办公室 →" },
			{ id: "postgres-sqlite", iconSlug: "postgresql", label: "PostgreSQL / SQLite", summary: "覆盖生产聚合数据链路与本地优先状态存储。", projectIds: ["babysteps", "github-profile-studio"], evidence: evidence.babySteps },
			{ id: "edge-ssr", iconSlug: "cloudflare-workers", label: "Edge SSR / Hydration", summary: "静态首屏、精确水合门禁和纯 CSR 降级保持同一事实。", projectIds: ["babysteps", "fullstack-showcase"], evidence: evidence.babySteps },
    ],
  },
  {
    id: "web3-trust",
    label: "Web3 / Trust",
    subtitle: "链上状态与可信交付",
    tone: "vermilion",
    nodes: [
			{ id: "solidity-evm", iconSlug: "solidity", label: "Solidity / EVM", summary: "实现任务、仲裁与状态锚定的智能合约边界。", projectIds: ["agent-market", "babysteps"], evidence: evidence.agent },
			{ id: "sepolia", iconSlug: "ethereum", label: "Sepolia", summary: "使用独立 RPC 回读交易回执和最终链上状态。", projectIds: ["agent-market"], evidence: evidence.agent },
			{ id: "wagmi-viem", iconSlug: "wagmi", label: "Wagmi / Viem", summary: "组织前端链上读取、钱包状态与网络边界。", projectIds: ["agent-market", "babysteps"], evidence: evidence.agent },
			{ id: "wallet-auth", iconSlug: "ethereum", label: "Wallet / Auth", summary: "隔离身份、钱包、签名与浏览器可见信息。", projectIds: ["babysteps", "agent-market"], evidence: evidence.babySteps },
			{ id: "langgraph-dag", iconSlug: "langchain", label: "LangGraph DAG", summary: "用结构化 DAG 表达多 Agent 任务协作，而非假装实时自治。", projectIds: ["agent-market"], evidence: evidence.agent },
			{ id: "onchain-evidence", iconSlug: "chainlink", label: "On-chain Evidence", summary: "把链上回执、版本和公开 Evidence 严格绑定。", projectIds: ["agent-market"], evidence: evidence.agent },
    ],
  },
  {
    id: "cloud-engineering",
    label: "Cloud / Engineering",
    subtitle: "云边协同与质量门禁",
    tone: "jade",
    nodes: [
			{ id: "cloudflare", iconSlug: "cloudflare-workers", label: "Pages / Workers", summary: "Cloudflare Edge SSR、Workers 与公开生产路由交付。", projectIds: ["fullstack-showcase", "babysteps"], evidence: evidence.dashboard },
			{ id: "aws-serverless", iconSlug: "aws-ecs", label: "AWS Serverless / ECS", summary: "临时性能链路按预算启动、精确回读并验证零残留。", projectIds: ["babysteps"], evidence: evidence.performance },
			{ id: "github-oidc", iconSlug: "github", label: "GitHub OIDC", summary: "以仓库身份和最小权限调用云端验证器，不保存长期密钥。", projectIds: ["shared-evidence-verifier"], evidence: "https://baby2b.online/evidence/shared-evidence-verifier" },
			{ id: "cicd-preview", iconSlug: "git", label: "CI/CD / Preview", summary: "Repository Policy、Preview、Production 与精确 SHA 组成发布 Gate。", projectIds: ["fullstack-showcase"], evidence: evidence.dashboard },
			{ id: "performance", iconSlug: "webgpu", label: "Performance", summary: "Core Web Vitals、导航、资源和队列状态均以真实样本与置信度呈现。", projectIds: ["babysteps", "performance-observability-control"], evidence: evidence.performance },
			{ id: "tc-flow", iconSlug: "github", label: "TC Flow / Quality Gate", summary: "N1-N8 检查点、Review、回归和证据门禁支持复杂任务恢复。", projectIds: ["tc-workflow"], evidence: evidence.tcFlow },
    ],
  },
];

export function getCapabilityNode(id: string) {
  return CAPABILITY_DOMAINS.flatMap((domain) => domain.nodes).find(
    (node) => node.id === id,
  );
}
