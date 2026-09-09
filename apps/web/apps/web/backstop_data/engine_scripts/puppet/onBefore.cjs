module.exports = async (page) => {
	page.__visualPageErrors = [];
	page.on("pageerror", (error) => {
		page.__visualPageErrors.push(error.message);
	});
	await page.setRequestInterception(true);
	page.on("request", async (request) => {
		const url = request.url();
		const pathname = new URL(url).pathname;
		if (url.includes("portfolio-sync.baby2b.online/projects.json")) {
			await request.abort("blockedbyclient");
			return;
		}
		if (pathname === "/api/performance/status") {
			const now = new Date(Date.now() - 60_000);
			await request.respond({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					projectSlug: "performance-observability-control",
					controlState: "stopped",
					dataMode: "historical",
					cleanupVerified: true,
					expiresAt: null,
					estimatedCostUsd: 0.2,
					maximumRuntimeMinutes: 45,
					dispatchReadiness: {
						state: "ready",
						reason: "fixed_workflow_active",
						checkedAt: now.toISOString(),
						freshUntil: new Date(now.getTime() + 10 * 60_000).toISOString(),
					},
				}),
			});
			return;
		}
		if (pathname === "/api/performance/snapshot") {
			await request.respond({
				status: 404,
				contentType: "application/json",
				body: JSON.stringify({ error: "verified_snapshot_not_found" }),
			});
			return;
		}
		await request.continue();
	});
};
