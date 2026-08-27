const ci = process.argv.includes("--ci");
const enableControl = process.argv.includes("--enable-control");

const required = (name, fallback) => {
	const value = process.env[name] || (ci ? fallback : "");
	if (!value) throw new Error(`Missing required configuration: ${name}`);
	return value;
};

const totpSecret = process.env.TOTP_SECRET || (ci ? "JBSWY3DPEHPK3PXP" : "");

const config = {
	$schema: "../../node_modules/wrangler/config-schema.json",
	name: "baby2b-performance-control",
	main: "src/index.ts",
	compatibility_date: "2026-08-26",
	compatibility_flags: ["nodejs_compat"],
	vars: {
		CONTROL_ENABLED: "false",
		CONTROL_ORIGIN: required("CONTROL_ORIGIN", "https://baby2b.online"),
		GITHUB_APP_ID: required("GITHUB_APP_ID", "1"),
		GITHUB_APP_INSTALLATION_ID: required("GITHUB_APP_INSTALLATION_ID", "1"),
	},
	d1_databases: [
		{
			binding: "CONTROL_DB",
			database_name: required("D1_DATABASE_NAME", "baby2b-performance-control"),
			database_id: required(
				"D1_DATABASE_ID",
				"00000000-0000-0000-0000-000000000001",
			),
			migrations_dir: "migrations",
		},
	],
	r2_buckets: [
		{
			binding: "SNAPSHOTS",
			bucket_name: required(
				"R2_BUCKET_NAME",
				"baby2b-performance-snapshots-ci",
			),
		},
	],
	triggers: { crons: ["*/5 * * * *"] },
	observability: { enabled: true, head_sampling_rate: 0.1 },
};

if (enableControl) {
	const d1Id = config.d1_databases[0].database_id;
	const productionComplete =
		!ci &&
		config.vars.CONTROL_ORIGIN === "https://baby2b.online" &&
		/^[A-Z2-7]{16,128}$/.test(totpSecret) &&
		/^[1-9][0-9]*$/.test(config.vars.GITHUB_APP_ID) &&
		/^[1-9][0-9]*$/.test(config.vars.GITHUB_APP_INSTALLATION_ID) &&
		/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(d1Id) &&
		d1Id !== "00000000-0000-0000-0000-000000000000" &&
		!config.r2_buckets[0].bucket_name.endsWith("-ci");
	if (!productionComplete) {
		throw new Error(
			"--enable-control requires complete production identifiers and origin",
		);
	}
	config.vars.CONTROL_ENABLED = "true";
}

process.stdout.write(`${JSON.stringify(config, null, 2)}\n`);
