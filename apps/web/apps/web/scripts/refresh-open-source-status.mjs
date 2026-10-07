import { execFileSync } from "node:child_process";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function collectRepositories(source) {
	const hrefs = [
		...new Set(
			source.match(/https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/g),
		),
	].sort();
	if (!hrefs.length) throw new Error("No curated OSS PR links found");
	const repositories = new Map();
	for (const href of hrefs) {
		const [, owner, name, , number] = new URL(href).pathname.split("/");
		const key = `${owner}/${name}`;
		if (!repositories.has(key)) repositories.set(key, { owner, name, prs: [] });
		repositories.get(key).prs.push({ href, number: Number(number) });
	}
	return repositories;
}

export function buildSnapshot(repositories, result) {
	if (result.errors)
		throw new Error("GitHub returned incomplete OSS status data");
	const snapshot = {
		verifiedAt: new Date().toISOString(),
		repositories: {},
		pullRequests: {},
	};
	for (const [i, [key, { prs }]] of [...repositories].entries()) {
		const repository = result.data?.[`r${i}`];
		if (
			!Number.isInteger(repository?.stargazerCount) ||
			repository.stargazerCount < 0
		)
			throw new Error(`Missing repository: ${key}`);
		snapshot.repositories[key] = repository.stargazerCount;
		for (const [j, { href }] of prs.entries()) {
			const pr = repository[`p${j}`];
			if (
				!pr ||
				!["OPEN", "CLOSED", "MERGED"].includes(pr.state) ||
				pr.author?.login !== "Tiancheng-Xu" ||
				typeof pr.isDraft !== "boolean" ||
				(pr.state === "MERGED"
					? typeof pr.mergedAt !== "string" || !Number.isFinite(Date.parse(pr.mergedAt))
					: pr.mergedAt !== null)
			) {
				throw new Error(
					`Missing or invalid PR metadata or unexpected author: ${href}`,
				);
			}
			snapshot.pullRequests[href] = {
				state: pr.state,
				mergedAt: pr.mergedAt,
				draft: pr.isDraft,
			};
		}
	}
	return snapshot;
}

function refresh() {
	const dataUrl = new URL(
		"../src/features/portfolio/open-source-data.ts",
		import.meta.url,
	);
	const snapshotUrl = new URL(
		"../src/features/portfolio/open-source-status.json",
		import.meta.url,
	);
	const repositories = collectRepositories(readFileSync(dataUrl, "utf8"));
	const fields = [...repositories.values()].map(
		({ owner, name, prs }, i) =>
			`r${i}:repository(owner:${JSON.stringify(owner)},name:${JSON.stringify(name)}){stargazerCount ${prs
				.map(
					({ number }, j) =>
						`p${j}:pullRequest(number:${number}){state mergedAt isDraft author{login}}`,
				)
				.join(" ")}}`,
	);
	const result = JSON.parse(
		execFileSync(
			"gh",
			["api", "graphql", "-f", `query=query{${fields.join(" ")}}`],
			{
				encoding: "utf8",
				timeout: 60_000,
				maxBuffer: 2 * 1024 * 1024,
			},
		),
	);
	const snapshot = buildSnapshot(repositories, result);
	// Replace atomically only after every curated PR has been checked.
	const temporaryUrl = new URL(
		`${snapshotUrl.pathname}.${process.pid}.tmp`,
		snapshotUrl,
	);
	writeFileSync(temporaryUrl, `${JSON.stringify(snapshot, null, 2)}\n`, {
		flag: "wx",
	});
	renameSync(temporaryUrl, snapshotUrl);
	console.log(
		`Verified ${Object.keys(snapshot.pullRequests).length} PRs in ${repositories.size} repositories at ${snapshot.verifiedAt}`,
	);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
	refresh();
