import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Use the current shared policy module, with its defaults and scanner intact.
// This output check complements the full repository-policy CI gate.
export async function verifyBuiltPublicContent({
	root,
	policyScript,
	buildOutput,
}) {
	if (!policyScript) throw new Error("--policy-script is required");
	const policy = await import(pathToFileURL(resolve(policyScript)).href);
	if (
		typeof policy.scanCandidateTree !== "function" ||
		!Array.isArray(policy.DEFAULT_BLOCKED_TERMS) ||
		!Array.isArray(policy.DEFAULT_PUBLIC_OUTPUT_ONLY_TERMS)
	) {
		throw new Error("shared repository policy exports are unavailable");
	}
	const violations = policy
		.scanCandidateTree(resolve(root), {
			revision: "HEAD",
			buildOutputPaths: [buildOutput],
		})
		.filter(({ scope }) => scope === "build-output");
	return {
		scope: "build-output",
		buildOutput,
		defaultTermCount:
			policy.DEFAULT_BLOCKED_TERMS.length +
			policy.DEFAULT_PUBLIC_OUTPUT_ONLY_TERMS.length,
		violations,
	};
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	const options = new Map();
	for (let index = 2; index < process.argv.length; index += 2) {
		options.set(process.argv[index], process.argv[index + 1]);
	}
	const result = await verifyBuiltPublicContent({
		root:
			options.get("--root") ?? resolve(import.meta.dirname, "../../../../.."),
		policyScript: options.get("--policy-script"),
		buildOutput: options.get("--build-output") ?? "apps/web/apps/web/dist",
	});
	console.log(JSON.stringify(result, null, 2));
	if (result.violations.length > 0) process.exitCode = 1;
}
