import { spawn, spawnSync } from "node:child_process";

const command = process.argv[2];
if (!["reference", "test"].includes(command)) {
	throw new Error("Expected visual command: reference or test");
}

const run = (executable, args, options = {}) => {
	const result = spawnSync(executable, args, {
		cwd: process.cwd(),
		encoding: "utf8",
		stdio: "inherit",
		...options,
	});
	if (result.status !== 0) {
		throw new Error(`${executable} ${args.join(" ")} failed with status ${result.status ?? 1}`);
	}
};

run("pnpm", ["build"]);

const preview = spawn(
	process.execPath,
	["scripts/serve-visual-built.cjs", "4184"],
	{ cwd: process.cwd(), stdio: "inherit" },
);

const waitForPreview = async () => {
	for (let attempt = 0; attempt < 40; attempt += 1) {
		try {
			const response = await fetch("http://127.0.0.1:4184/dashboard");
			if (response.ok) return;
		} catch {}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error("Visual preview did not become ready on port 4184");
};

try {
	await waitForPreview();
	run("node", ["scripts/check-visual-route-gates.cjs"], {
		env: { ...process.env, BACKSTOP_VALIDATE_REVIEWED_ENVIRONMENT: "1" },
	});
	run(
		"pnpm",
		["exec", "backstop", command, "--config=backstop.config.cjs"],
		{
			env: {
				...process.env,
				BACKSTOP_VALIDATE_REVIEWED_ENVIRONMENT: "1",
			},
		},
	);
} finally {
	preview.kill("SIGTERM");
}
