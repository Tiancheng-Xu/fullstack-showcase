import { useEffect, useMemo, useState } from "react";
import {
	CircleDollarSign,
	CloudCog,
	LockKeyhole,
	Play,
	ShieldCheck,
	Square,
} from "lucide-react";

import { PROJECTS_INDEX } from "@/data/portfolio-projects";
import { resolvePerformanceView } from "@/features/performance/performance-state";
import { PerformanceStatusCard } from "@/features/performance/performance-status-card";
import type { PerformanceControlState } from "@/features/performance/performance-types";
import { PortfolioPageShell } from "@/features/portfolio/portfolio-page-shell";
import { Button } from "@web/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@web/ui/components/card";

const START_STEPS = [
	"确认上一次临时 Stack、项目 Schema、项目角色和临时队列已经清理干净。",
	"由 Cloudflare Access 独立 MFA 校验唯一操作者，再签发一次性控制 nonce。",
	"Worker 每次签发 GitHub App JWT、交换短期 installation token，只派发 BabySteps 的 aws-performance-control.yml。",
	"45 分钟 TTL 或 USD 0.20 费用上限触发停止与清理，故障时失败关闭。",
];

const STOP_STEPS = [
	"先停止接收新事件，再读取主队列和 DLQ 深度，按策略排空或明确丢弃。",
	"生成最后一份不可覆盖快照，写入摘要并切换为历史数据模式。",
	"停止一次性 ECS 任务，删除项目 Schema、项目角色和精确命名的临时 Stack。",
	"只有回调确认项目资源为空且共享基础设施未变，才恢复为可启动状态。",
];

type PublicControlStatus = {
	controlState: PerformanceControlState;
	cleanupVerified: boolean;
	expiresAt: string | null;
	estimatedCostUsd: number;
	maximumRuntimeMinutes: number;
};
type ControlSession = {
	nonce: string;
	expiresAt: string;
	mfaVerified: boolean;
	estimatedCostUsd: number;
	maximumRuntimeMinutes: number;
};

const defaultStatus: PublicControlStatus = {
	controlState: "unknown",
	cleanupVerified: false,
	expiresAt: null,
	estimatedCostUsd: 0.2,
	maximumRuntimeMinutes: 45,
};

export function PerformanceControlContent({ projectId }: { projectId: string }) {
	const project = PROJECTS_INDEX[projectId];
	const [status, setStatus] = useState(defaultStatus);
	const [session, setSession] = useState<ControlSession | null>(null);
	const [notice, setNotice] = useState("正在校验 Cloudflare Access MFA 会话…");
	const [pending, setPending] = useState<"start" | "stop" | null>(null);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!project?.performance) return;
		const query = `?project=${encodeURIComponent(projectId)}`;
		void Promise.all([
			fetch(`/api/performance/status${query}`).then(async (response) => {
				if (!response.ok) throw new Error("status_unavailable");
				setStatus((await response.json()) as PublicControlStatus);
			}),
			fetch(`/api/performance/control/session${query}`, {
				method: "POST",
				headers: { accept: "application/json" },
			}).then(async (response) => {
				if (!response.ok) {
					throw new Error(
						response.status === 401 ? "access_required" : "session_unavailable",
					);
				}
				setSession((await response.json()) as ControlSession);
				setNotice("MFA 已验证");
			}),
		]).catch((error: unknown) => {
			setSession(null);
			setNotice(
				error instanceof Error && error.message === "access_required"
					? "需要通过 Cloudflare Access 独立 MFA"
					: "控制会话不可用，写操作保持关闭",
			);
		});
	}, [project?.performance, projectId]);

	useEffect(() => {
		if (!status.expiresAt) return;
		const timer = window.setInterval(() => setNow(Date.now()), 1_000);
		return () => window.clearInterval(timer);
	}, [status.expiresAt]);

	useEffect(() => {
		if (!project?.performance) return;
		let disposed = false;
		const refreshStatus = async () => {
			try {
				const response = await fetch(
					`/api/performance/status?project=${encodeURIComponent(projectId)}`,
				);
				if (response.ok && !disposed) {
					setStatus((await response.json()) as PublicControlStatus);
				}
			} catch {
				// Public status failures never unlock controls or invent state.
			}
		};
		const active = [
			"starting",
			"running",
			"degraded",
			"stopping",
			"cleanup_required",
		].includes(status.controlState);
		const interval = window.setInterval(
			() => void refreshStatus(),
			active ? 5_000 : 30_000,
		);
		const untilExpiry = status.expiresAt
			? Math.max(0, Date.parse(status.expiresAt) - Date.now())
			: null;
		const expiryTimer =
			untilExpiry === null || untilExpiry > 2_147_483_647
				? null
				: window.setTimeout(() => void refreshStatus(), untilExpiry);
		return () => {
			disposed = true;
			window.clearInterval(interval);
			if (expiryTimer !== null) window.clearTimeout(expiryTimer);
		};
	}, [project?.performance, projectId, status.controlState, status.expiresAt]);

	const remaining = useMemo(() => {
		if (!status.expiresAt) return null;
		const seconds = Math.max(
			0,
			Math.ceil((Date.parse(status.expiresAt) - now) / 1_000),
		);
		return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
	}, [now, status.expiresAt]);

	if (!project?.performance) {
		return (
			<PortfolioPageShell
				current="project"
				description="只有已登记性能观测契约的项目才能进入固定动作控制面。"
				evidenceUrl="/dashboard"
				eyebrow="Project Control"
				projectHomeUrl="/dashboard"
				title="项目不可控制"
			>
				<div className="mx-auto max-w-3xl">
					<Card>
						<CardHeader>
							<h2 className="font-serif font-bold text-2xl">访问范围</h2>
							<CardDescription>
								只有已登记性能观测契约的项目才能进入固定动作控制面。
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</PortfolioPageShell>
		);
	}

	const performanceView = resolvePerformanceView(project.performance);
	const latestSource = performanceView.snapshot?.source;
	const canStart =
		Boolean(session?.mfaVerified) &&
		status.controlState === "stopped" &&
		status.cleanupVerified &&
		!pending;
	const canStop =
		Boolean(session?.mfaVerified) &&
		["starting", "running", "degraded", "failed", "cleanup_required"].includes(
			status.controlState,
		) &&
		!pending;

	const requestControl = async (action: "start" | "stop") => {
		if (!session) return;
		setPending(action);
		setNotice(
			action === "start"
				? "正在提交启动请求…"
				: "正在提交停止与清理请求…",
		);
		try {
			const response = await fetch(
				`/api/performance/control/${action}?project=${encodeURIComponent(projectId)}`,
				{
					method: "POST",
					headers: {
						"x-control-nonce": session.nonce,
						"idempotency-key": crypto.randomUUID(),
					},
				},
			);
			const body = (await response.json()) as Partial<PublicControlStatus> & {
				error?: string;
			};
			if (!response.ok) throw new Error(body.error ?? "control_failed");
			setStatus((current) => ({ ...current, ...body }));
			setSession(null);
			setNotice(
				action === "start"
					? "启动请求已受理，等待固定工作流回调"
					: "停止与清理请求已受理",
			);
		} catch {
			setSession(null);
			setNotice("操作未完成；状态未被伪造，请重新通过 MFA 获取单次会话");
		} finally {
			setPending(null);
		}
	};

	return (
		<PortfolioPageShell
			current="project"
			description="公开状态和可信历史快照保持可读；资源写操作由 Cloudflare Access 独立 MFA、单次 nonce 与固定 GitHub workflow 共同保护。"
			evidenceUrl={`/evidence/${project.id}`}
			eyebrow={`Project Control · ${project.title}`}
			projectHomeUrl={`/performance-control?project=${project.id}`}
			title="性能观测成本控制"
		>
			<div className="mx-auto max-w-5xl space-y-6">
				<PerformanceStatusCard
					projectId={project.id}
					projectName={project.title}
					status={{
						...performanceView,
						controlState:
							status.controlState === "unknown"
								? performanceView.controlState
								: status.controlState,
					}}
				/>
				{latestSource ? (
					<section className="border border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
						<h2 className="font-serif font-bold text-xl">
							最近一次云端验收已完成并清理
						</h2>
						<p className="mt-2 text-sm leading-relaxed">
							当前展示 Run #{latestSource.workflowRunId} 的真实合成闭环历史快照，不把它冒充生产趋势或当前运行数据。
						</p>
						<a
							className="mt-4 inline-flex min-h-11 items-center gap-2 border border-emerald-800 px-4 py-3 font-bold text-sm"
							href={`https://github.com/${latestSource.repository}/actions/runs/${latestSource.workflowRunId}`}
							rel="noreferrer"
							target="_blank"
						>
							查看 GitHub Run #{latestSource.workflowRunId}
						</a>
					</section>
				) : null}
				<header className="border border-[#c7ced8] bg-[#f8f3e8] p-6 sm:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p className="font-bold text-xs uppercase tracking-[0.16em] text-[#5a6470]">
								固定动作控制面 · {project.title}
							</p>
							<h2 className="mt-2 font-serif font-bold text-2xl">
								固定动作与安全边界
							</h2>
							<p className="mt-3 max-w-3xl text-[#344252] text-sm leading-relaxed">
								这里只允许启动观测与安全停止两条固定动作，不接收仓库、workflow、区域、时长、费用或 AWS 资源参数。
							</p>
						</div>
						<span className="inline-flex min-h-11 items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-2 font-bold text-amber-950 text-xs">
							<LockKeyhole aria-hidden="true" size={16} />
							{notice}
						</span>
					</div>
					<div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
						<p>预计增量费用上限：USD {status.estimatedCostUsd.toFixed(2)}</p>
						<p>最长运行：{status.maximumRuntimeMinutes} 分钟</p>
						<p>{remaining ? `剩余时间：${remaining}` : "倒计时：未运行"}</p>
					</div>
				</header>

				{status.controlState === "cleanup_required" ||
				!status.cleanupVerified ? (
					<p className="border border-red-400 bg-red-50 p-4 font-bold text-red-900">
						清理未验证：禁止再次启动，只允许安全停止/恢复工作流。
					</p>
				) : null}

				<section className="grid gap-5 lg:grid-cols-2">
					<LifecycleCard
						buttonLabel="启动性能观测"
						description="只在清理门禁通过后创建单实例临时资源。"
						disabled={!canStart}
						icon={<Play aria-hidden="true" size={18} />}
						onClick={() => void requestControl("start")}
						steps={START_STEPS}
						title="安全启动"
					/>
					<LifecycleCard
						buttonLabel="安全停止性能观测"
						description="保留最后可信结果后精确清理项目资源。"
						disabled={!canStop}
						icon={<Square aria-hidden="true" size={17} />}
						onClick={() => void requestControl("stop")}
						steps={STOP_STEPS}
						title="安全停止"
					/>
				</section>

				<section className="grid gap-4 md:grid-cols-3">
					<BoundaryCard
						body="Cloudflare Access 校验 JWT 签名、iss、aud、exp 和唯一 operator allowlist。"
						icon={<ShieldCheck aria-hidden="true" size={19} />}
						title="MFA 与身份"
					/>
					<BoundaryCard
						body="每次控制操作交换短期 installation token，只派发 Tiancheng-Xu/babysteps 的固定 GitHub Actions 工作流 aws-performance-control.yml；运行资源复用共享 VPC、NAT、RDS。"
						icon={<CloudCog aria-hidden="true" size={19} />}
						title="派发边界"
					/>
					<BoundaryCard
						body="45 分钟、USD 0.20、单实例；TTL 或故障进入清理优先的失败关闭状态。"
						icon={<CircleDollarSign aria-hidden="true" size={19} />}
						title="费用边界"
					/>
				</section>
			</div>
		</PortfolioPageShell>
	);
}

function LifecycleCard({
	buttonLabel,
	description,
	disabled,
	icon,
	onClick,
	steps,
	title,
}: {
	buttonLabel: string;
	description: string;
	disabled: boolean;
	icon: React.ReactNode;
	onClick: () => void;
	steps: string[];
	title: string;
}) {
	return (
		<Card>
			<CardHeader>
				<h2 className="font-medium text-sm">{title}</h2>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<ol className="space-y-3 text-sm text-muted-foreground">
					{steps.map((step, index) => (
						<li className="flex items-start gap-3" key={step}>
							<span className="grid size-6 shrink-0 place-items-center bg-[#0f2d4d] font-bold text-white text-xs">
								{index + 1}
							</span>
							<span className="pt-0.5 leading-relaxed">{step}</span>
						</li>
					))}
				</ol>
				<Button
					className="min-h-11 w-full"
					disabled={disabled}
					onClick={onClick}
					type="button"
				>
					{icon}
					{buttonLabel}
				</Button>
			</CardContent>
		</Card>
	);
}

function BoundaryCard({
	body,
	icon,
	title,
}: {
	body: string;
	icon: React.ReactNode;
	title: string;
}) {
	return (
		<article className="border border-[#d8cfbd] bg-white/85 p-5">
			<div className="flex items-center gap-2 font-bold">
				{icon}
				<h2>{title}</h2>
			</div>
			<p className="mt-3 text-[#4d5863] text-sm leading-relaxed">{body}</p>
		</article>
	);
}
