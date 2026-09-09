export type OpenSourcePullRequest = {
	label: string;
	href: string;
	contribution: string;
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
