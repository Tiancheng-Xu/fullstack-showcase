export interface RegisteredPerformanceProject {
	projectSlug: string;
	repository: string;
	defaultBranch: string;
	githubEnvironment: string;
	workflow: string;
	awsResourcePrefix: string;
	maximumRuntimeMinutes: number;
	estimatedCostUsd: number;
}

const projects: Record<string, RegisteredPerformanceProject> = {
	"performance-observability-control": {
		projectSlug: "performance-observability-control",
		repository: "Tiancheng-Xu/babysteps",
		defaultBranch: "main",
		githubEnvironment: "aws-performance",
		workflow: "aws-performance-control.yml",
		awsResourcePrefix: "babysteps-performance-",
		maximumRuntimeMinutes: 45,
		estimatedCostUsd: 0.2,
	},
};

export const getRegisteredProject = (projectSlug: string) =>
	projects[projectSlug];

export const listRegisteredProjects = () => Object.values(projects);
