import {
	buildOpenSourceRepositoryDetails,
	orderOpenSourceContributions,
} from "@/features/portfolio/open-source-contributions";

// Keep lower-star historical work in this source file, but not on the public page.
// Re-check the upstream star count before updating these snapshots.
const PUBLIC_MINIMUM_STARS = 1000;

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
	{
		project: "Vite",
		stars: 82851,
		pullRequests: [
			{
				label: "#23235",
				href: "https://github.com/vitejs/vite/pull/23235",
				contribution: "补充 SSR server-only module reload 文档",
			},
		],
	},
	{
		project: "pnpm",
		stars: 36719,
		pullRequests: [
			{
				label: "#14674",
				href: "https://github.com/pnpm/pnpm/pull/14674",
				contribution: "在安全支持策略中列出 pnpm v12",
			},
		],
	},
	{
		project: "Tabler Icons",
		stars: 21826,
		pullRequests: [
			{
				label: "#1590",
				href: "https://github.com/tabler/tabler-icons/pull/1590",
				contribution: "修复 SolidJS source export 的 Vite SSR 入口扩展名",
			},
		],
	},
	{
		project: "Project NOMAD",
		stars: 38830,
		pullRequests: [
			{
				label: "#1358",
				href: "https://github.com/Crosstalk-Solutions/project-nomad/pull/1358",
				contribution: "修复 Night Ops 暗色主题 WCAG 对比度，并补充回归测试（合并至 dev）",
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
].filter(({ stars }) => stars >= PUBLIC_MINIMUM_STARS));
export const openSourceContributionsInReview = orderOpenSourceContributions([
	{
		project: "Deno",
		stars: 108444,
		pullRequests: [
			{
				label: "#36855",
				href: "https://github.com/denoland/deno/pull/36855",
				contribution: "保留同步子进程的 stdio 文件描述符",
			},
			{
				label: "#36851",
				href: "https://github.com/denoland/deno/pull/36851",
				contribution: "测试失败时避免输出 Rust backtrace",
			},
			{
				label: "#36849",
				href: "https://github.com/denoland/deno/pull/36849",
				contribution: "在 registerHooks 中暴露模块格式",
			},
		],
	},
	{
		project: "Vite",
		stars: 82851,
		pullRequests: [
			{
				label: "#23499",
				href: "https://github.com/vitejs/vite/pull/23499",
				contribution: "初始化失败后释放旧环境",
			},
		],
	},
	{
		project: "MCP Servers",
		stars: 90176,
		pullRequests: [
			{
				label: "#4810",
				href: "https://github.com/modelcontextprotocol/servers/pull/4810",
				contribution: "将 session resources 限定到所属 server",
			},
		],
	},
	{
		project: "VS Code",
		stars: 192574,
		pullRequests: [
			{
				label: "#335428",
				href: "https://github.com/microsoft/vscode/pull/335428",
				contribution: "支持编辑器拖放时使用鼠标修饰键",
			},
		],
	},
	{
		project: "quicklink",
		stars: 11292,
		pullRequests: [
			{
				label: "#501",
				href: "https://github.com/GoogleChromeLabs/quicklink/pull/501",
				contribution: "为页面描述使用唯一值",
			},
		],
	},
	{
		project: "GoogleTest",
		stars: 39544,
		pullRequests: [
			{
				label: "#5092",
				href: "https://github.com/google/googletest/pull/5092",
				contribution: "避免 INSTANTIATE_TEST_SUITE_P 参数遮蔽",
			},
			{
				label: "#5091",
				href: "https://github.com/google/googletest/pull/5091",
				contribution: "CTest 捕获 Windows stdout 时保留强制 ANSI 颜色",
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
	{
		project: "RTK",
		stars: 82144,
		pullRequests: [
			{
				label: "#3933",
				href: "https://github.com/rtk-ai/rtk/pull/3933",
				contribution: "让 Ruff format 路由匹配首个参数",
			},
			{
				label: "#3922",
				href: "https://github.com/rtk-ai/rtk/pull/3922",
				contribution: "新增 gitleaks TOML filter，保留关键 findings 与扫描摘要",
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
				contribution: "自守护命令退出时保留路由；原 PR 尚未合并，后续上游 #444 标注共同作者",
			},
		],
	},
	{
		project: "wagmi",
		stars: 6750,
		pullRequests: [
			{
				label: "#5250",
				href: "https://github.com/wevm/wagmi/pull/5250",
				issueHref: "https://github.com/wevm/wagmi/issues/5248",
				contribution:
					"保留未配置 connector chain 时的兼容行为，并从默认 client 转发 dataSuffix",
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
		project: "cmux",
		stars: 27541,
		pullRequests: [
			{
				label: "#15795",
				href: "https://github.com/manaflow-ai/cmux/pull/15795",
				contribution: "恢复通过旧版浏览器回退路径重新打开时的会话交互状态",
			},
		],
	},
	{
		project: "Avante",
		stars: 18171,
		pullRequests: [
			{
				label: "#3266",
				href: "https://github.com/avante-corp/avante.nvim/pull/3266",
				contribution: "草稿 PR：在 Provider 切换列表标注 ACP 类型，同时保持既有标签与 API",
			},
		],
	},
	{
		project: "OpenResearch",
		stars: 6331,
		pullRequests: [
			{
				label: "#477",
				href: "https://github.com/alphaXiv/OpenResearch/pull/477",
				contribution: "草稿 PR：展示实验最近一次运行耗时，运行中每秒刷新计时",
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
].filter(({ stars }) => stars >= PUBLIC_MINIMUM_STARS));

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

const OPEN_SOURCE_REPOSITORY_FALLBACK_KEYS = new Set([
	"alphaxiv--openresearch",
	"avante-corp--avante.nvim",
	"crosstalk-solutions--project-nomad",
	"googlechromelabs--quicklink",
	"google--googletest",
	"manaflow-ai--cmux",
	"microsoft--vscode",
	"wevm--wagmi",
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
	if (!assetKey || OPEN_SOURCE_REPOSITORY_FALLBACK_KEYS.has(assetKey)) {
		return OPEN_SOURCE_REPOSITORY_ICON_FALLBACK;
	}
	return assetKey
		? `/assets/portfolio/repository-icons/${assetKey}.${OPEN_SOURCE_REPOSITORY_PNG_KEYS.has(assetKey) ? "png" : "svg"}`
		: OPEN_SOURCE_REPOSITORY_ICON_FALLBACK;
}

export const openSourceRepositories = openSourceRepositoryDetails.map(
	({ pullRequests: _pullRequests, ...repository }) => repository,
);
