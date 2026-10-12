import data from "./project-prd-evidence.json";

export type ProjectPrdEvidence = {
	id: string;
	title: string;
	sourceId: string;
	reviewedAt: string;
	status: string;
	positioning: string;
	mechanisms: string[];
	historicalEvidence: string;
	currentBoundary: string;
	projectUrl: string | null;
	evidenceUrl: string;
};

export const PROJECT_PRD_EVIDENCE: ProjectPrdEvidence[] = data.entries;
export const PRD_EVIDENCE_COVERAGE = data;

export function getProjectPrdEvidence(projectId: string) {
	return PROJECT_PRD_EVIDENCE.find(({ id }) => id === projectId);
}

export function projectPrdSummaryUrl(entry: ProjectPrdEvidence) {
	return `${entry.evidenceUrl}#prd-design`;
}
