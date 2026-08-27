export type PerformanceApplication = {
	id: string;
	label: string;
	portfolioProjectId: string;
	controlProjectId: string | null;
};

export const PERFORMANCE_APPLICATIONS: PerformanceApplication[] = [
	{
		id: "babysteps",
		label: "BabySteps",
		portfolioProjectId: "babysteps",
		controlProjectId: "performance-observability-control",
	},
	{
		id: "agent-market",
		label: "Agent Market",
		portfolioProjectId: "agent-market",
		controlProjectId: null,
	},
	{
		id: "personal-ai-agent",
		label: "Personal AI Agent",
		portfolioProjectId: "personal-ai-agent",
		controlProjectId: null,
	},
	{
		id: "github-profile-studio",
		label: "GitHub Profile Studio",
		portfolioProjectId: "github-profile-studio",
		controlProjectId: null,
	},
];

export const getPerformanceApplication = (applicationId: string) =>
	PERFORMANCE_APPLICATIONS.find(({ id }) => id === applicationId);

export const performanceControlPath = (applicationId: string) =>
	`/performance-control/${encodeURIComponent(applicationId)}`;

export const performanceApplicationIdForControlProject = (
	controlProjectId: string,
) =>
	PERFORMANCE_APPLICATIONS.find(
		(application) => application.controlProjectId === controlProjectId,
	)?.id ?? controlProjectId;
