import data from "./commercial-exploration.json";

export type CommercialProject = (typeof data.projects)[number];
export const COMMERCIAL_PROJECTS = data.projects;
export const COMMERCIAL_PROJECT_IDS = new Set(COMMERCIAL_PROJECTS.map(({ id }) => id));
export const COMMERCIAL_REVIEWED_AT = data.reviewedAt;

export function excludeCommercialProjects<T extends { id: string }>(projects: readonly T[]): T[] {
	return projects.filter((project) => !COMMERCIAL_PROJECT_IDS.has(project.id));
}

export function getCommercialProject(id: string) {
	return COMMERCIAL_PROJECTS.find((project) => project.id === id);
}

export function commercialEvidencePath(project: CommercialProject) {
	return `/evidence/${project.id}`;
}
