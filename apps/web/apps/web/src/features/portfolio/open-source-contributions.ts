export type OpenSourcePullRequest = {
	label: string;
	href: string;
	contribution: string;
	issueHref?: string;
};

export type OpenSourceContribution = {
	project: string;
	stars: number;
	pullRequests: OpenSourcePullRequest[];
};

function pullRequestNumber(label: string) {
	return Number.parseInt(label.replace(/^#/, ""), 10) || 0;
}

export function orderOpenSourceContributions<T extends OpenSourceContribution>(items: T[]): T[] {
	return [...items]
		.sort((left, right) => right.stars - left.stars || left.project.localeCompare(right.project))
		.map((item) => ({
			...item,
			pullRequests: [...item.pullRequests].sort(
				(left, right) => pullRequestNumber(right.label) - pullRequestNumber(left.label),
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
