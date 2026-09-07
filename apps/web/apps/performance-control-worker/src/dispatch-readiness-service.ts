import {
	DISPATCH_READINESS_FRESHNESS_MS,
	probeGitHubWorkflowReadiness,
	type RegisteredWorkflowTarget,
} from "./dispatch-readiness";
import {
	claimDispatchReadinessProbe,
	completeDispatchReadinessProbe,
	type DispatchReadinessRow,
	type PublicDispatchReadiness,
	projectDispatchReadiness,
} from "./dispatch-readiness-cache";

type D1Result = { success?: boolean; meta?: { changes?: number } };

type D1BoundStatement = {
	first<T>(): Promise<T | null>;
	run(): Promise<D1Result>;
};

type D1PreparedStatement = {
	bind(...values: unknown[]): D1BoundStatement;
};

export type DispatchReadinessDatabase = {
	prepare(query: string): D1PreparedStatement;
};

type RefreshOptions = {
	database: DispatchReadinessDatabase;
	projectSlug: string;
	target: RegisteredWorkflowTarget;
	installationToken: () => Promise<string>;
	fetcher?: typeof fetch;
	now?: Date;
};

const selectDispatchReadiness = `
SELECT state, reason, checked_at, fresh_until, probe_generation
FROM dispatch_readiness
WHERE project_slug = ?1
`;

export const readDispatchReadiness = async (
	database: DispatchReadinessDatabase,
	projectSlug: string,
	now = new Date(),
): Promise<PublicDispatchReadiness> => {
	const row = await database
		.prepare(selectDispatchReadiness)
		.bind(projectSlug)
		.first<DispatchReadinessRow>();
	return projectDispatchReadiness(row, now);
};

export const refreshDispatchReadiness = async ({
	database,
	projectSlug,
	target,
	installationToken,
	fetcher,
	now = new Date(),
}: RefreshOptions): Promise<PublicDispatchReadiness> => {
	const probeToken = crypto.randomUUID();
	let claim: { probe_generation: number } | null;
	try {
		claim = await database
			.prepare(claimDispatchReadinessProbe)
			.bind(
				projectSlug,
				now.toISOString(),
				new Date(now.getTime() + DISPATCH_READINESS_FRESHNESS_MS).toISOString(),
				probeToken,
			)
			.first<{ probe_generation: number }>();
	} catch {
		claim = null;
	}
	if (!claim || !Number.isInteger(claim.probe_generation)) {
		return {
			state: "unknown",
			reason: "readiness_invalid",
			checkedAt: null,
			freshUntil: null,
		};
	}

	let token = "";
	try {
		token = await installationToken();
	} catch {
		token = "";
	}

	const result = await probeGitHubWorkflowReadiness(target, token, {
		fetcher,
		now,
	});
	let write: D1Result;
	try {
		write = await database
			.prepare(completeDispatchReadinessProbe)
			.bind(
				projectSlug,
				result.state,
				result.reason,
				result.checkedAt,
				result.freshUntil,
				probeToken,
				claim.probe_generation,
			)
			.run();
	} catch {
		return {
			state: "unknown",
			reason: "readiness_invalid",
			checkedAt: null,
			freshUntil: null,
		};
	}

	if (write.success !== true) {
		return {
			state: "unknown",
			reason: "readiness_invalid",
			checkedAt: null,
			freshUntil: null,
		};
	}
	if (write.meta?.changes === 0) {
		return {
			state: "unknown",
			reason: "readiness_invalid",
			checkedAt: null,
			freshUntil: null,
		};
	}

	return result;
};
