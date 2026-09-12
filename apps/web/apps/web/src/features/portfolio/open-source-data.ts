import {
	buildOpenSourceRepositoryDetails,
	orderOpenSourceContributions,
} from "@/features/portfolio/open-source-contributions";

export const openSourceContributions = orderOpenSourceContributions([
	{
		project: "PR-Agent",
		stars: 12907,
		pullRequests: [
			{
				label: "#3140",
				href: "https://github.com/The-PR-Agent/pr-agent/pull/3140",
				contribution: "移除失效的共享限流处理逻辑",
			},
			{
				label: "#3141",
				href: "https://github.com/The-PR-Agent/pr-agent/pull/3141",
				contribution: "修正 GitLab /ask_line 对旧侧行位置的处理",
			},
			{
				label: "#3142",
				href: "https://github.com/The-PR-Agent/pr-agent/pull/3142",
				contribution: "从用户帮助信息中隐藏已禁用命令",
			},
		],
	},
	{
		project: "ClawBox",
		stars: 27,
		pullRequests: [
			{
				label: "#774",
				href: "https://github.com/ID-Robots/clawbox/pull/774",
				contribution: "按 Provider 限定模型目录 fallback",
			},
		],
	},
	{
		project: "PySNMP MIBs",
		stars: 8,
		pullRequests: [
			{
				label: "#361",
				href: "https://github.com/pysnmp/mibs/pull/361",
				contribution: "修正 TCPIPX unspecified table row 类型",
			},
		],
	},
]);
export const openSourceContributionsInReview = orderOpenSourceContributions([
	{
		project: "Deno",
		stars: 108406,
		pullRequests: [
			{
				label: "#36794",
				href: "https://github.com/denoland/deno/pull/36794",
				contribution: "保留 CLI 入口前的 -- 分隔符",
			},
		],
	},
	{
		project: "RTK",
		stars: 79560,
		pullRequests: [
			{
				label: "#3933",
				href: "https://github.com/rtk-ai/rtk/pull/3933",
				contribution: "让 Ruff format 路由匹配首个参数",
			},
			{
				label: "#3922",
				href: "https://github.com/rtk-ai/rtk/pull/3922",
				contribution: "增加 gitleaks TOML 输出过滤",
			},
		],
	},
	{
		project: "pnpm",
		stars: 36465,
		pullRequests: [
			{
				label: "#14675",
				href: "https://github.com/pnpm/pnpm/pull/14675",
				contribution: "澄清 workspace package patterns",
			},
			{
				label: "#14674",
				href: "https://github.com/pnpm/pnpm/pull/14674",
				contribution: "在安全支持策略中列出 pnpm v12",
			},
		],
	},
	{
		project: "LiteLLM",
		stars: 58324,
		pullRequests: [
			{
				label: "#40183",
				href: "https://github.com/BerriAI/litellm/pull/40183",
				contribution: "补充 OpenRouter GPT-5.6 Sol 元数据",
			},
		],
	},
	{
		project: "Lightpanda",
		stars: 35173,
		pullRequests: [
			{
				label: "#3440",
				href: "https://github.com/lightpanda-io/browser/pull/3440",
				contribution: "在 computed styles 中保留 CSS 自定义属性",
			},
		],
	},
	{
		project: "Portless",
		stars: 12358,
		pullRequests: [
			{
				label: "#413",
				href: "https://github.com/vercel-labs/portless/pull/413",
				contribution: "自守护命令退出时保留路由",
			},
		],
	},
	{
		project: "Chrome DevTools MCP",
		stars: 51394,
		pullRequests: [
			{
				label: "#2686",
				href: "https://github.com/ChromeDevTools/chrome-devtools-mcp/pull/2686",
				contribution: "补充定时脚本导航回归测试",
			},
		],
	},
	{
		project: "Context Mode",
		stars: 21474,
		pullRequests: [
			{
				label: "#1128",
				href: "https://github.com/mksglu/context-mode/pull/1128",
				contribution: "修复 curl/wget 管道与多行路由边界",
			},
		],
	},
	{
		project: "MCP Servers",
		stars: 90176,
		pullRequests: [
			{
				label: "#4775",
				href: "https://github.com/modelcontextprotocol/servers/pull/4775",
				contribution: "让 filesystem server 输出 object input schema",
			},
		],
	},
	{
		project: "Tabler Icons",
		stars: 21631,
		pullRequests: [
			{
				label: "#1590",
				href: "https://github.com/tabler/tabler-icons/pull/1590",
				contribution: "保留 Vite SSR 所需的 SolidJS JSX source export",
			},
		],
	},
	{
		project: "Bitcoin Dev Kit",
		stars: 1067,
		pullRequests: [
			{
				label: "#2276",
				href: "https://github.com/bitcoindevkit/bdk/pull/2276",
				issueHref: "https://github.com/bitcoindevkit/bdk/issues/2274",
				contribution: "保留首个 floating transaction output",
			},
		],
	},
	{
		project: "Backstage",
		stars: 34376,
		pullRequests: [
			{
				label: "#35564",
				href: "https://github.com/backstage/backstage/pull/35564",
				contribution: "修复 undici 安全依赖告警",
			},
		],
	},
	{
		project: "BBj Language Server",
		stars: 13,
		pullRequests: [
			{
				label: "#665",
				href: "https://github.com/BBx-Kitchen/bbj-language-server/pull/665",
				contribution: "统一语言服务器日志输出格式",
			},
		],
	},
	{
		project: "Web Testownik",
		stars: 103,
		pullRequests: [
			{
				label: "#323",
				href: "https://github.com/Solvro/web-testownik/pull/323",
				contribution: "强化维护恢复处理",
			},
		],
	},
	{
		project: "Paperclip",
		stars: 0,
		pullRequests: [
			{
				label: "#2",
				href: "https://github.com/adamteale/paperclip/pull/2",
				contribution: "覆盖 runJob invocation scope resolution",
			},
		],
	},
	{
		project: "Slopshop",
		stars: 0,
		pullRequests: [
			{
				label: "#21",
				href: "https://github.com/fireship-dev/slopshop/pull/21",
				contribution: "强化逐用户限流",
			},
		],
	},
	{
		project: "Vite",
		stars: 82766,
		pullRequests: [
			{
				label: "#23235",
				href: "https://github.com/vitejs/vite/pull/23235",
				contribution: "补充 SSR server-only module reload 文档",
			},
		],
	},
	{
		project: "Google WebCrypto",
		stars: 116,
		pullRequests: [
			{
				label: "#398",
				href: "https://github.com/google/webcrypto.dart/pull/398",
				contribution: "提取 RSA-OAEP PKCS#8 导入示例",
			},
		],
	},
]);

export const openSourceRepositoryDetails = buildOpenSourceRepositoryDetails(
	openSourceContributions,
	openSourceContributionsInReview,
);

export const OPEN_SOURCE_REPOSITORY_ICON_FALLBACK =
	"/assets/portfolio/tech-icons/github.svg";

const OPEN_SOURCE_REPOSITORY_PNG_KEYS = new Set([
	"adamteale--paperclip",
	"backstage--backstage",
	"bbx-kitchen--bbj-language-server",
	"berriai--litellm",
	"bitcoindevkit--bdk",
	"chromedevtools--chrome-devtools-mcp",
	"denoland--deno",
	"fireship-dev--slopshop",
	"google--webcrypto.dart",
	"lightpanda-io--browser",
	"mksglu--context-mode",
	"modelcontextprotocol--servers",
	"pnpm--pnpm",
	"solvro--web-testownik",
	"tabler--tabler-icons",
	"vercel-labs--portless",
	"vitejs--vite",
]);

export function getOpenSourceRepositoryAssetKey(repositoryUrl: string) {
	const [owner, repository] = new URL(repositoryUrl).pathname
		.split("/")
		.filter(Boolean)
		.slice(0, 2);

	if (!owner || !repository) return null;

	return `${owner}--${repository}`
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-");
}

export function getOpenSourceRepositoryIconSrc(repositoryUrl: string) {
	const assetKey = getOpenSourceRepositoryAssetKey(repositoryUrl);
	return assetKey
		? `/assets/portfolio/repository-icons/${assetKey}.${OPEN_SOURCE_REPOSITORY_PNG_KEYS.has(assetKey) ? "png" : "svg"}`
		: OPEN_SOURCE_REPOSITORY_ICON_FALLBACK;
}

export const openSourceRepositories = openSourceRepositoryDetails.map(
	({ pullRequests: _pullRequests, ...repository }) => repository,
);
