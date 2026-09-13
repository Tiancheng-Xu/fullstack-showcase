import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CAPABILITY_DOMAINS } from "../capability-map-data";
import {
	getOpenSourceRepositoryIconSrc,
	OPEN_SOURCE_REPOSITORY_ICON_FALLBACK,
	openSourceRepositoryDetails,
} from "../open-source-data";
import { OPEN_SOURCE_PARTICLE_DOMAINS } from "../technology-particle-backdrop";
import {
	resolveTechnologyParticleIconSrc,
	TECHNOLOGY_PARTICLE_ICON_FALLBACK,
} from "../technology-capability-particle-scene";

describe("CAP-004 particle data contracts", () => {
	const publicDirectory = resolve(process.cwd(), "public");

	it("builds the open-source backdrop from repository data without skill nodes", () => {
		const repositoryNodes = OPEN_SOURCE_PARTICLE_DOMAINS.flatMap(
			(domain) => domain.nodes,
		);
		const capabilityNodeIds = new Set(
			CAPABILITY_DOMAINS.flatMap((domain) => domain.nodes).map(
				(node) => node.id,
			),
		);

		expect(repositoryNodes).toHaveLength(openSourceRepositoryDetails.length);
		expect(repositoryNodes.map((node) => node.particleLabel)).toEqual(
			openSourceRepositoryDetails.map((repository) => repository.project),
		);
		expect(
			repositoryNodes.some((node) => capabilityNodeIds.has(node.id)),
		).toBe(false);
	});

	it("uses only local repository icons and the local GitHub fallback", () => {
		const repositoryNodes = OPEN_SOURCE_PARTICLE_DOMAINS.flatMap(
			(domain) => domain.nodes,
		);

		expect(
			repositoryNodes.every((node) => node.iconSrc.startsWith("/assets/")),
		).toBe(true);
		expect(
			repositoryNodes.every((node) => !node.iconSrc.includes("github.com")),
		).toBe(true);
		expect(
			repositoryNodes.every(
				(node) =>
					node.fallbackIconSrc === OPEN_SOURCE_REPOSITORY_ICON_FALLBACK,
			),
		).toBe(true);
		const iconSources = openSourceRepositoryDetails.map((repository) =>
			getOpenSourceRepositoryIconSrc(repository.href),
		);
		expect(iconSources.some((source) => source.endsWith(".png"))).toBe(true);
		expect(iconSources.some((source) => source.endsWith(".svg"))).toBe(true);
		expect(
			repositoryNodes.every((node) =>
				existsSync(join(publicDirectory, node.iconSrc.slice(1))),
			),
		).toBe(true);
		expect(
			existsSync(
				join(publicDirectory, OPEN_SOURCE_REPOSITORY_ICON_FALLBACK.slice(1)),
			),
		).toBe(true);
	});

	it("keeps direct iconSrc backward compatible with the iconSlug contract", () => {
		expect(
			resolveTechnologyParticleIconSrc({
				id: "repository",
				iconSrc: "/assets/portfolio/repository-icons/example.svg",
				iconSlug: "react",
			}),
		).toBe("/assets/portfolio/repository-icons/example.svg");
		expect(
			resolveTechnologyParticleIconSrc({ id: "react", iconSlug: "react" }),
		).toBe("/assets/portfolio/tech-icons/react.svg");
		expect(resolveTechnologyParticleIconSrc({ id: "missing" })).toBe(
			TECHNOLOGY_PARTICLE_ICON_FALLBACK,
		);
	});

	it("leaves the homepage capability scene contract at all curated skill nodes", () => {
		const capabilityNodes = CAPABILITY_DOMAINS.flatMap(
			(domain) => domain.nodes,
		);

		expect(capabilityNodes).toHaveLength(41);
		expect(capabilityNodes.every((node) => Boolean(node.iconSlug))).toBe(true);
		expect(
			capabilityNodes.some((node) => node.id.startsWith("open-source-")),
		).toBe(false);
	});
});
