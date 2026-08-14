export interface RegisteredPerformanceProject {
	projectSlug: string;
	repository: string;
	githubEnvironment: string;
	startWorkflow: string;
	stopWorkflow: string;
	awsResourcePrefix: string;
	maximumRuntimeMinutes: number;
}

const projects: Record<string, RegisteredPerformanceProject> = {
	"performance-observability-control": {
		projectSlug: "performance-observability-control",
		repository: "Tiancheng-Xu/course-homework",
		githubEnvironment: "aws-performance",
		startWorkflow: "performance-start.yml",
		stopWorkflow: "performance-stop.yml",
		awsResourcePrefix: "course-performance-",
		maximumRuntimeMinutes: 45,
	},
};

export const getRegisteredProject = (projectSlug: string) => projects[projectSlug];

export const listRegisteredProjects = () => Object.values(projects);
