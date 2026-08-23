import type { PortfolioProject } from "@/data/portfolio-projects";

const DEFAULT_SYNC_URL = "https://portfolio-sync.baby2b.online/projects.json";

export type PortfolioSyncEnvelope = {
	schemaVersion: 1;
	generatedAt: string;
	projectCount: number;
	projects: PortfolioProject[];
	status: "ready" | "warming";
};

function isProject(value: unknown): value is PortfolioProject {
	if (!value || typeof value !== "object") return false;
	const project = value as Partial<PortfolioProject>;
	return Boolean(
		project.id &&
			project.title &&
			project.desc &&
			project.architecture &&
			project.evidenceUrl &&
			project.repo &&
			Array.isArray(project.skills) &&
			Array.isArray(project.evidence) &&
			Array.isArray(project.details) &&
			(project.status === "已完成" || project.status === "进行中") &&
			typeof project.progress === "number",
	);
}

export async function loadSyncedPortfolio(signal?: AbortSignal) {
	const endpoint = import.meta.env.VITE_PORTFOLIO_SYNC_URL || DEFAULT_SYNC_URL;
	const response = await fetch(endpoint, {
		headers: { Accept: "application/json" },
		signal,
	});
	if (!response.ok) {
		throw new Error(`Portfolio sync unavailable (${response.status})`);
	}

	const value = (await response.json()) as Partial<PortfolioSyncEnvelope>;
	if (
		value.schemaVersion !== 1 ||
		!value.generatedAt ||
		!Array.isArray(value.projects) ||
		!value.projects.every(isProject)
	) {
		throw new Error("Portfolio sync returned an invalid envelope");
	}
	return value as PortfolioSyncEnvelope;
}

function projectKey(project: PortfolioProject) {
	return project.repo || project.id;
}

function isRetiredEvidenceHubProject(project: PortfolioProject) {
	return Boolean(
		project.repo === "Tiancheng-Xu/baby2b-online-deployment-evidence" ||
			project.id === "baby2b-online-deployment-evidence" ||
			project.id === "baby2b-deployment-evidence" ||
			project.evidenceUrl?.startsWith("https://evidence.baby2b.online"),
	);
}

export function mergePortfolioProjects(
	curated: PortfolioProject[],
	synced: PortfolioProject[],
) {
	const remoteByKey = new Map(
		synced.map((project) => [projectKey(project), project]),
	);
	const consumed = new Set<string>();
	const merged = curated.map((local) => {
		const remote =
			remoteByKey.get(projectKey(local)) ??
			synced.find((project) => project.id === local.id);
		if (!remote) return local;
		consumed.add(projectKey(remote));
		return {
			...remote,
			...local,
			status: remote.status,
			progress: remote.progress,
			evidenceUrl: local.evidenceUrl || remote.evidenceUrl,
			ownerPage: local.ownerPage || remote.ownerPage,
			sourceUpdatedAt: remote.sourceUpdatedAt,
		};
	});

	for (const project of synced) {
		if (
			!consumed.has(projectKey(project)) &&
			!isRetiredEvidenceHubProject(project)
		) {
			merged.push(project);
		}
	}
	return merged;
}
