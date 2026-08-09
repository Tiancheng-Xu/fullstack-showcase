import type {
	GitHubProfile,
	SaveGitHubProfileInput,
} from "@course-homework/api/contracts";
import { Button } from "@web/ui/components/button";
import { Input } from "@web/ui/components/input";
import { Label } from "@web/ui/components/label";
import { Textarea } from "@web/ui/components/textarea";
import {
	CalendarDays,
	Database,
	ExternalLink,
	GitBranch,
	RefreshCw,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	createGitHubProfileApi,
	type GitHubProfileApi,
} from "./github-profile-api";

export type { GitHubProfileApi } from "./github-profile-api";

interface StatusMessage {
	text: string;
	tone: "neutral" | "success" | "error";
}

const browserApi = createGitHubProfileApi();

function safeMessage(error: unknown): string {
	const code =
		typeof error === "object" && error !== null && "code" in error
			? String(error.code)
			: "UNKNOWN";
	const messages: Record<string, string> = {
		GITHUB_TOKEN_MISSING: "尚未在系统钥匙串中保存 GitHub 访问凭据。",
		GITHUB_AUTH_FAILED: "GitHub 访问凭据无效或已过期。",
		GITHUB_RATE_LIMITED: "GitHub 请求过于频繁，请稍后再试。",
		VALIDATION_FAILED: "请检查显示名称和个人简介。",
	};
	return messages[code] ?? "暂时无法保存资料，请稍后再试。";
}

function formInput(profile: GitHubProfile): SaveGitHubProfileInput {
	return {
		displayName: profile.displayName,
		bio: profile.bio,
	};
}

export function GitHubProfileContent({
	api = browserApi,
}: {
	api?: GitHubProfileApi;
}) {
	const [profile, setProfile] = useState<GitHubProfile | null>(null);
	const [displayName, setDisplayName] = useState("");
	const [bio, setBio] = useState("");
	const [loadingSaved, setLoadingSaved] = useState(true);
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState<StatusMessage | null>(null);
	const statusRef = useRef<HTMLDivElement>(null);

	const announce = (message: StatusMessage) => {
		setStatus(message);
	};

	useEffect(() => {
		if (status) {
			statusRef.current?.focus();
		}
	}, [status]);

	const showProfile = useCallback((nextProfile: GitHubProfile) => {
		setProfile(nextProfile);
		const input = formInput(nextProfile);
		setDisplayName(input.displayName ?? "");
		setBio(input.bio ?? "");
	}, []);

	useEffect(() => {
		let active = true;
		api
			.readSaved()
			.then((saved) => {
				if (active && saved) {
					showProfile(saved);
				}
			})
			.catch((error: unknown) => {
				if (active) {
					setStatus({ text: safeMessage(error), tone: "error" });
				}
			})
			.finally(() => {
				if (active) {
					setLoadingSaved(false);
				}
			});
		return () => {
			active = false;
		};
	}, [api, showProfile]);

	const readFromGitHub = async () => {
		setBusy(true);
		try {
			showProfile(await api.readFromGitHub());
			announce({ text: "GitHub 资料读取成功", tone: "success" });
		} catch (error) {
			announce({ text: safeMessage(error), tone: "error" });
		} finally {
			setBusy(false);
		}
	};

	const saveProfile = async () => {
		if (!profile) {
			return;
		}
		setBusy(true);
		try {
			const saved = await api.save({
				displayName: displayName.trim() || null,
				bio: bio.trim() || null,
			});
			showProfile(saved);
			announce({ text: "资料已保存", tone: "success" });
		} catch (error) {
			announce({ text: safeMessage(error), tone: "error" });
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="space-y-6">
			<section className="rounded-[2rem] bg-card p-6 shadow-card">
				<div className="flex items-start gap-4">
					<div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
						<GitBranch aria-hidden="true" size={28} />
					</div>
					<div>
						<p className="font-semibold text-primary text-xs">
							AI 全栈课程作业
						</p>
						<h1 className="mt-1 font-bold text-2xl">GitHub 个人资料作业</h1>
						<p className="mt-2 text-muted-foreground text-sm leading-6">
							GitHub 访问凭据只保存在服务端的系统钥匙串中，浏览器不会接触它。
						</p>
					</div>
				</div>
				<Button
					className="mt-5 h-11 w-full rounded-xl text-sm"
					disabled={busy || loadingSaved}
					onClick={readFromGitHub}
					type="button"
				>
					<RefreshCw aria-hidden="true" />
					读取我的 GitHub 资料
				</Button>
			</section>

			{loadingSaved ? (
				<section className="rounded-[2rem] bg-card p-6 text-center text-muted-foreground shadow-card">
					正在检查已保存资料…
				</section>
			) : profile ? (
				<ProfileReview
					bio={bio}
					busy={busy}
					displayName={displayName}
					onBioChange={setBio}
					onDisplayNameChange={setDisplayName}
					profile={profile}
				/>
			) : (
				<section className="rounded-[2rem] bg-card p-6 text-center shadow-card">
					<Database
						aria-hidden="true"
						className="mx-auto text-muted-foreground"
					/>
					<h2 className="mt-3 font-bold">尚未保存 GitHub 资料</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						先从 GitHub 读取，再确认并保存到本地数据库。
					</p>
				</section>
			)}

			<Button
				className="h-11 w-full rounded-xl text-sm"
				disabled={busy || loadingSaved || !profile}
				onClick={saveProfile}
				type="button"
			>
				<Database aria-hidden="true" />
				保存到数据库
			</Button>

			{status ? (
				<div
					aria-live="polite"
					className={`rounded-2xl border p-4 text-sm outline-none ${
						status.tone === "success"
							? "border-tertiary/30 bg-tertiary-soft text-tertiary"
							: status.tone === "error"
								? "border-destructive/30 bg-destructive/10 text-destructive"
								: "border-border bg-muted text-muted-foreground"
					}`}
					ref={statusRef}
					role="status"
					tabIndex={-1}
				>
					<span>{status.text}</span>
				</div>
			) : null}
		</div>
	);
}

function ProfileReview({
	profile,
	displayName,
	bio,
	busy,
	onDisplayNameChange,
	onBioChange,
}: {
	profile: GitHubProfile;
	displayName: string;
	bio: string;
	busy: boolean;
	onDisplayNameChange: (value: string) => void;
	onBioChange: (value: string) => void;
}) {
	return (
		<section className="space-y-5 rounded-[2rem] bg-card p-6 shadow-card">
			<div className="flex items-center gap-4">
				<img
					alt={`${profile.login} 的 GitHub 头像`}
					className="size-16 rounded-2xl border border-border object-cover"
					height={64}
					src={profile.avatarUrl}
					width={64}
				/>
				<div className="min-w-0">
					<h2 className="truncate font-bold text-xl">@{profile.login}</h2>
					<a
						className="mt-1 inline-flex items-center gap-1 text-primary text-sm hover:underline"
						href={profile.profileUrl}
						rel="noreferrer"
						target="_blank"
					>
						查看公开主页
						<ExternalLink aria-hidden="true" size={14} />
					</a>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-2 text-center text-xs">
				<Fact icon={GitBranch} text={`${profile.publicRepos} 个公开仓库`} />
				<Fact icon={Users} text={`${profile.followers} 位关注者`} />
				<Fact
					icon={CalendarDays}
					text={new Date(profile.githubCreatedAt).toLocaleDateString("zh-CN")}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="github-display-name">显示名称</Label>
				<Input
					className="h-11 rounded-xl text-sm"
					disabled={busy}
					id="github-display-name"
					maxLength={100}
					onChange={(event) => onDisplayNameChange(event.target.value)}
					value={displayName}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="github-bio">个人简介</Label>
				<Textarea
					className="min-h-28 rounded-xl text-sm"
					disabled={busy}
					id="github-bio"
					maxLength={500}
					onChange={(event) => onBioChange(event.target.value)}
					value={bio}
				/>
			</div>
			<p className="text-muted-foreground text-xs">
				头像、账号、仓库数和关注者由服务端重新读取，无法在浏览器中修改。
			</p>
		</section>
	);
}

type FactIcon = typeof GitBranch;

function Fact({ icon: Icon, text }: { icon: FactIcon; text: string }) {
	return (
		<div className="rounded-xl bg-muted/60 px-2 py-3 text-muted-foreground">
			<Icon
				aria-hidden="true"
				className="mx-auto mb-1 text-secondary"
				size={16}
			/>
			<span>{text}</span>
		</div>
	);
}
