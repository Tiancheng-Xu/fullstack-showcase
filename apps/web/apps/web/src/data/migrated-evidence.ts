import githubProfileStudio from "@/data/evidence/github-profile-studio.json";
import portfolioSync from "@/data/evidence/portfolio-sync.json";
import tcWorkflow from "@/data/evidence/tc-workflow.json";

export type MigratedEvidenceAsset = {
	id: string;
	file: string;
	title: string;
	alt: string;
	sha256: string;
	bytes: number;
};

type MetricCard = {
	label: string;
	value: string;
	detail: string;
	meaning: string;
};

type MeaningfulStep = {
	title: string;
	purpose: string;
	designReason: string;
	scope: string;
	expected: string;
	risks: string;
	observed: string;
	proof: string;
};

type ProofItem = {
	id: string;
	title: string;
	description: string;
	status: string;
	asset?: string;
	lookFor: string;
	proves: string;
};

type ArchitectureItem = {
	status: string;
	source?: string;
	description?: string;
	note?: string;
};

type DiagramNode = {
	id: string;
	label: string;
	detail: string;
	purpose?: string;
	pass?: string;
	block?: string;
	status: string;
};

type EvidenceDiagram = {
	id: string;
	eyebrow: string;
	title: string;
	plain: string;
	summary: string;
	nodes: DiagramNode[];
};

type EvidenceIncident = {
	id: string;
	title: string;
	plain: string;
	symptom: string;
	cause: string;
	fix: string;
	recheck: string;
};

export type MigratedEvidenceDocument = {
	kicker: string;
	subtitle: string;
	status: string;
	summary: string;
	model: string;
	scope: string;
	metrics: Record<string, string | number>;
	metricCards: MetricCard[];
	promotionItems: Array<{ label: string; value: string }>;
	story: {
		goal: string;
		result: string;
		steps: string[];
		terms: Array<{ name: string; meaning: string }>;
	};
	meaningfulSteps: MeaningfulStep[];
	architecture: Record<string, ArchitectureItem>;
	diagrams: EvidenceDiagram[];
	incidents: EvidenceIncident[];
	proof: ProofItem[];
	assets: MigratedEvidenceAsset[];
	experiments: Record<string, unknown>;
	integrity: Record<string, string>;
	integrityLabel: string;
	limitations: string[];
	provenance: {
		sourceRepository: string;
		sourceCommit: string;
		sourceManifestSha256: string;
	};
};

const SOURCE_REPOSITORY = "Tiancheng-Xu/baby2b-online-deployment-evidence";
const SOURCE_COMMIT = "0d4e161eaf18c85a114eafd50133c612b277f2f4";

function withProvenance(
	document: Omit<MigratedEvidenceDocument, "provenance">,
	sourceManifestSha256: string,
): MigratedEvidenceDocument {
	return {
		...document,
		provenance: {
			sourceRepository: SOURCE_REPOSITORY,
			sourceCommit: SOURCE_COMMIT,
			sourceManifestSha256,
		},
	};
}

const MIGRATED_EVIDENCE: Record<string, MigratedEvidenceDocument> = {
	"github-profile-studio": withProvenance(
		githubProfileStudio as Omit<MigratedEvidenceDocument, "provenance">,
		"73042bb5884aa740c7c474f94baab031fab8cd0a38998b27753433145f250e32",
	),
	"portfolio-sync": withProvenance(
		portfolioSync as Omit<MigratedEvidenceDocument, "provenance">,
		"af7270ee051b5f45009453cae60961de035206e0ce173f90501e3a469c123f26",
	),
	"tc-workflow": withProvenance(
		tcWorkflow as Omit<MigratedEvidenceDocument, "provenance">,
		"bb338a36c85c0b61e8267d2ede0ff058b2234812206562443976b712caa27aa8",
	),
};

export function getMigratedEvidence(projectId: string) {
	return MIGRATED_EVIDENCE[projectId];
}
