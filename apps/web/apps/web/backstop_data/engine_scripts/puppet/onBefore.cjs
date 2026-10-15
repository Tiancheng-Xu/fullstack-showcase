module.exports = async (page) => {
	page.__visualPageErrors = [];
	// Full-document captures must rasterize offscreen backdrop-filter layers.
	// Responsive geometry/hit gates still run at the configured real viewport.
	const screenshot = page.screenshot.bind(page);
	page.screenshot = (options) => screenshot(
		options?.fullPage ? { ...options, captureBeyondViewport: false } : options,
	);
	page.on("pageerror", (error) => {
		page.__visualPageErrors.push(error.message);
	});
	await page.emulateTimezone("UTC");
	page.__visualLocaleSession = await page.target().createCDPSession();
	await page.__visualLocaleSession.send("Emulation.setLocaleOverride", {
		locale: "zh-CN",
	});
	await page.setExtraHTTPHeaders({ "Accept-Language": "zh-CN,zh;q=0.9" });
	// Fixed fixture time prevents freshness labels from becoming moving pixel targets.
	const fixtureTime = Date.parse("2026-10-13T12:00:00Z");
	await page.evaluateOnNewDocument((epoch) => {
		const RealDate = Date;
		function FixtureDate(...args) {
			if (!new.target) return new RealDate(epoch).toString();
			return Reflect.construct(RealDate, args.length ? args : [epoch], new.target);
		}
		Object.setPrototypeOf(FixtureDate, RealDate);
		FixtureDate.prototype = RealDate.prototype;
		FixtureDate.now = () => epoch;
		window.Date = FixtureDate;
	}, fixtureTime);
	await page.setRequestInterception(true);
	page.on("request", async (request) => {
		const url = request.url();
		const pathname = new URL(url).pathname;
		if (url.includes("portfolio-sync.baby2b.online/projects.json")) {
			await request.abort("blockedbyclient");
			return;
		}
		if (pathname === "/api/performance/status") {
			const now = new Date(fixtureTime - 60_000);
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
