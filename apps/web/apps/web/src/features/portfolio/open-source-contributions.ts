export type OpenSourcePullRequest = {
	label: string;
	href: string;
	contribution: string;
	issueHref?: string;
	draft?: boolean;
};

export type OpenSourceContribution = {
	project: string;
	stars: number;
	pullRequests: OpenSourcePullRequest[];
};

type VerifiedOpenSourceSnapshot = {
	repositories: Record<string, number>;
	pullRequests: Record<
		string,
		{ state: string; mergedAt: string | null; draft: boolean }
	>;
};

// Curated text is separate from status: old array placement is never evidence.
export function reconcileOpenSourceContributions(
	items: OpenSourceContribution[],
	snapshot: VerifiedOpenSourceSnapshot,
): { merged: OpenSourceContribution[]; open: OpenSourceContribution[] } {
	const groups = {
		merged: new Map<string, OpenSourceContribution>(),
		open: new Map<string, OpenSourceContribution>(),
	};
	const seen = new Set<string>();
	for (const item of items) {
		for (const pr of item.pullRequests) {
			if (seen.has(pr.href)) continue;
			seen.add(pr.href);
			const key = new URL(pr.href).pathname.split("/").slice(1, 3).join("/");
			const stars = snapshot.repositories[key];
			const verified = snapshot.pullRequests[pr.href];
			if (
				!Number.isInteger(stars) ||
				stars < 0 ||
				!verified ||
				!["OPEN", "CLOSED", "MERGED"].includes(verified.state) ||
				typeof verified.draft !== "boolean" ||
				(verified.state === "MERGED"
					? typeof verified.mergedAt !== "string" || !Number.isFinite(Date.parse(verified.mergedAt))
					: verified.mergedAt !== null)
			) {
				throw new Error(`Missing or invalid verified OSS metadata: ${pr.href}`);
			}
			if (stars < 1000 || verified.state === "CLOSED") continue;
			const group = groups[verified.state === "MERGED" ? "merged" : "open"];
			const contribution = group.get(item.project) ?? {
				project: item.project,
				stars,
				pullRequests: [],
			};
			contribution.pullRequests.push({ ...pr, draft: verified.draft });
			group.set(item.project, contribution);
		}
	}
	return {
		merged: orderOpenSourceContributions([...groups.merged.values()]),
		open: orderOpenSourceContributions([...groups.open.values()]),
	};
}

function pullRequestNumber(label: string) {
	return Number.parseInt(label.replace(/^#/, ""), 10) || 0;
}

export function orderOpenSourceContributions<T extends OpenSourceContribution>(
	items: T[],
): T[] {
	return [...items]
		.sort(
			(left, right) =>
				right.stars - left.stars || left.project.localeCompare(right.project),
		)
		.map((item) => ({
			...item,
			pullRequests: [...item.pullRequests].sort(
				(left, right) =>
					pullRequestNumber(right.label) - pullRequestNumber(left.label),
			),
		}));
}

export type OpenSourceRepositoryDetail = {
	project: string;
	stars: number;
	href: string;
	merged: number;
	open: number;
	pullRequests: Array<OpenSourcePullRequest & { status: "merged" | "open" }>;
};

export function buildOpenSourceRepositoryDetails(
	mergedItems: OpenSourceContribution[],
	openItems: OpenSourceContribution[],
): OpenSourceRepositoryDetail[] {
	const repositories = new Map<string, OpenSourceRepositoryDetail>();

	for (const [items, status] of [
		[mergedItems, "merged"],
		[openItems, "open"],
	] as const) {
		for (const item of orderOpenSourceContributions(items)) {
			const repository = repositories.get(item.project) ?? {
				project: item.project,
				stars: item.stars,
				href: item.pullRequests[0]?.href.replace(/\/pull\/\d+.*$/, "") ?? "#",
				merged: 0,
				open: 0,
				pullRequests: [],
			};
			repository.stars = Math.max(repository.stars, item.stars);
			repository[status] += item.pullRequests.length;
			repository.pullRequests.push(
				...item.pullRequests.map((pullRequest) => ({ ...pullRequest, status })),
			);
			repositories.set(item.project, repository);
		}
	}

	return [...repositories.values()].sort(
		(left, right) =>
			Number(right.merged > 0) - Number(left.merged > 0) ||
			right.stars - left.stars ||
			left.project.localeCompare(right.project),
	);
}
