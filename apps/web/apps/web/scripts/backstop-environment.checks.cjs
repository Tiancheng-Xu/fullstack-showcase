const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { createHash } = require("node:crypto");

test("pins software rasterization and preserves the separate software baseline", () => {
	const config = require("../backstop.config.cjs");
	assert.ok(config.engineOptions.args.includes("--disable-gpu"));
	assert.ok(config.paths.bitmaps_reference.includes("chrome155-darwin-arm64-software"));
});
const { runInNewContext } = require("node:vm");

const source = readFileSync(resolve(__dirname, "../backstop.config.cjs"), "utf8");

function loadConfig(overrides = {}) {
	const values = {
		browser: "Google Chrome 155.0.8059.85",
		platform: "darwin",
		architecture: "arm64",
		exists: true,
		...overrides,
	};
	const modules = {
		"node:child_process": { execFileSync: () => values.browser },
		"node:fs": { existsSync: () => values.exists },
		"node:os": {
			arch: () => values.architecture,
			platform: () => values.platform,
		},
	};
	const context = {
		module: { exports: {} },
		process: {
			env: {
				BACKSTOP_VALIDATE_REVIEWED_ENVIRONMENT: "1",
				BACKSTOP_CHROME_EXECUTABLE: "/isolated/chrome",
			},
		},
		require(name) {
			assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`);
			return modules[name];
		},
	};
	runInNewContext(source, context, { timeout: 1000 });
	return context.module.exports;
}

test("accepts only the pinned reviewed Chrome build", () => {
	assert.equal(loadConfig().engineOptions.executablePath, "/isolated/chrome");
	for (const browser of ["Google Chrome 153.0.8010.50", "Google Chrome 155.0.8059.40", "Google Chrome 155.0.8059.81", "Chromium 155.0.8059.80"]) {
		assert.throws(() => loadConfig({ browser }), /Visual environment mismatch/);
	}
});

test("rejects a different platform or architecture", () => {
	assert.throws(() => loadConfig({ platform: "linux" }), /Visual environment mismatch/);
	assert.throws(() => loadConfig({ architecture: "x64" }), /Visual environment mismatch/);
});

test("rejects an unavailable browser executable", () => {
	assert.throws(() => loadConfig({ exists: false }), /Reviewed Chrome executable is unavailable/);
});

test("preserves the rendering contract and mismatch threshold", () => {
	const config = loadConfig();
	assert.equal(config.visualEnvironment.locale, "zh-CN");
	assert.equal(config.visualEnvironment.timezone, "UTC");
	assert.equal(config.visualEnvironment.deviceScaleFactor, 1);
	assert.ok(config.scenarios.every((scenario) => scenario.misMatchThreshold === 0.1 && scenario.requireSameDimensions));
});

test("uses the explicitly adopted content revision separately from both old baselines", () => {
	assert.equal(loadConfig().paths.bitmaps_reference, "backstop_data/baselines/chrome155-darwin-arm64-software-xhs-20261020-8059-85/bitmaps_reference");
});

test("Xiaohongshu entry revision preserves prior references and reviewed release evidence", () => {
	const fs = require("node:fs");
	const path = require("node:path");
	const app = path.resolve(__dirname, "..");
	const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
	const parent = "chrome155-darwin-arm64-software-workflow-20261020-8059-85";
	const folder = path.join(app, "backstop_data/baselines/chrome155-darwin-arm64-software-xhs-20261020-8059-85");
	const receipt = JSON.parse(fs.readFileSync(path.join(folder, "acceptance.json"), "utf8"));
	const parentFile = path.join(app, "backstop_data/baselines", parent, "acceptance.json");
	assert.equal(receipt.parentBaseline, parent);
	assert.equal(sha256(fs.readFileSync(parentFile)), receipt.parentReceiptSha256);
	const previous = JSON.parse(fs.readFileSync(parentFile, "utf8"));
	const protectedReferences = [...previous.protectedPriorReferences, ...previous.references.map((row) => ({ file: `backstop_data/baselines/${parent}/bitmaps_reference/${row.file}`, sha256: row.sha256 }))];
	assert.deepEqual(receipt.protectedPriorReferences, protectedReferences);
	assert.equal(protectedReferences.length, 212);
	for (const row of protectedReferences) assert.equal(sha256(fs.readFileSync(path.join(app, row.file))), row.sha256);
	assert.equal(receipt.browser, "Google Chrome 155.0.8059.85");
	assert.equal(receipt.thresholdPercent, 0.1);
	assert.equal(receipt.requireSameDimensions, true);
	assert.equal(receipt.review.verdict, "pass");
	assert.equal(receipt.review.stableCandidateCases, 4);
	assert.equal(receipt.review.fullStagedCases, 38);
	assert.equal(receipt.review.unexplainedCases, 0);
	const expectedReviewers = [
		{ agentId: "01a161d1-25a7-76b0-baed-f74e7b345ff0", role: "ui" },
		{ agentId: "01a161d1-264a-7dd1-b21a-ebe899937e22", role: "gate" },
	];
	assert.deepEqual([...receipt.review.independentAgents].sort(), expectedReviewers.map((row) => row.agentId).sort());
	assert.equal(receipt.review.independentReviews.length, 2);
	for (const expected of expectedReviewers) {
		const review = receipt.review.independentReviews.find((row) => row.agentId === expected.agentId);
		assert.ok(review);
		assert.equal(review.role, expected.role);
		const bytes = fs.readFileSync(path.join(folder, review.file));
		assert.equal(sha256(bytes), review.sha256);
		const result = JSON.parse(bytes);
		assert.equal(result.agentId, expected.agentId);
		assert.equal(result.role, expected.role);
		assert.equal(result.verdict, "pass");
		assert.deepEqual(result.findings, []);
		assert.ok(result.scope);
	}
	assert.equal(receipt.references.length, 38);
	assert.equal(new Set(receipt.references.map((row) => row.file)).size, 38);
	const oldHashes = new Map(previous.references.map((row) => [row.file, row.sha256]));
	for (const row of receipt.references) {
		assert.equal(sha256(fs.readFileSync(path.join(folder, "bitmaps_reference", row.file))), row.sha256);
		if (row.origin === "reviewed-candidate") assert.ok([
			"fullstack_showcase_portfolio_dashboard_0_document_0_375px.png",
			"fullstack_showcase_portfolio_dashboard_0_document_1_390px.png",
			"fullstack_showcase_portfolio_dashboard_0_document_2_430px.png",
			"fullstack_showcase_portfolio_dashboard_0_document_3_1440px.png",
		].includes(row.file));
		else { assert.equal(row.origin, "carried-forward"); assert.equal(row.sha256, oldHashes.get(row.file)); }
	}
	assert.equal(receipt.references.filter((row) => row.origin === "reviewed-candidate").length, 4);
	assert.deepEqual(receipt.reports.map(({ kind, caseCount }) => ({ kind, caseCount })), [
		{ kind: "candidate-stability", caseCount: 4 },
		{ kind: "staged-release", caseCount: 38 },
	]);
	for (const report of receipt.reports) {
		const bytes = fs.readFileSync(path.join(folder, report.file));
		assert.equal(sha256(bytes), report.sha256);
		const result = JSON.parse(bytes);
		assert.equal(result.kind, report.kind);
		assert.equal(result.tests.length, report.caseCount);
		const expectedNames = receipt.references.filter((row) => report.kind === "staged-release" || row.origin === "reviewed-candidate").map((row) => row.file).sort();
		assert.deepEqual(result.tests.map((row) => row.file).sort(), expectedNames);
		for (const row of result.tests) {
			assert.equal(row.status, "pass");
			assert.equal(row.pair.requireSameDimensions, true);
			assert.equal(row.pair.misMatchThreshold, 0.1);
			assert.equal(row.pair.diff.isSameDimensions, true);
			const rawMismatch = row.pair.diff.rawMisMatchPercentage ?? row.pair.diff.misMatchPercentage;
			assert.ok((typeof rawMismatch === "number" || typeof rawMismatch === "string") && String(rawMismatch).trim() !== "");
			const mismatch = Number(rawMismatch);
			assert.ok(Number.isFinite(mismatch) && mismatch >= 0 && mismatch <= 0.1);
			assert.equal(sha256(fs.readFileSync(path.join(folder, row.pair.referenceImage))), row.pair.referenceSha256);
			assert.equal(sha256(fs.readFileSync(path.join(folder, row.pair.testImage))), row.pair.testSha256);
			assert.equal(row.pair.referenceSha256, receipt.references.find((reference) => reference.file === row.file).sha256);
		}
	}
});

test("preserves all sixty original reference PNG hashes", () => {
	const receipt = JSON.parse(readFileSync(resolve(__dirname, "../backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/acceptance.json"), "utf8"));
	assert.equal(receipt.protectedOriginalReferences.length, 60);
	for (const reference of receipt.protectedOriginalReferences) {
		const bytes = readFileSync(resolve(__dirname, "..", reference.file));
		assert.equal(createHash("sha256").update(bytes).digest("hex"), reference.sha256, reference.file);
	}
});

test("adopts exactly ten reviewed candidates and carries forward twenty-eight references", () => {
	const receipt = JSON.parse(readFileSync(resolve(__dirname, "../backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/acceptance.json"), "utf8"));
	assert.equal(receipt.references.length, 38);
	assert.equal(receipt.references.filter((entry) => entry.origin === "reviewed-candidate").length, 10);
	assert.equal(receipt.references.filter((entry) => entry.origin === "carried-forward").length, 28);
	assert.equal(receipt.humanApproval.adopted, true);
	assert.equal(receipt.thresholdPercent, 0.1);
	assert.equal(receipt.requireSameDimensions, true);
	for (const reference of receipt.references) {
		const bytes = readFileSync(resolve(__dirname, "../backstop_data/baselines/chrome155-darwin-arm64-software-content-20261015/bitmaps_reference", reference.file));
		assert.equal(createHash("sha256").update(bytes).digest("hex"), reference.sha256, reference.file);
	}
});

test("preserves all ninety-eight prior reference PNG hashes after the action revision", () => {
	const receipt = JSON.parse(readFileSync(resolve(__dirname, "../backstop_data/baselines/chrome155-darwin-arm64-software-actions-20261018/acceptance.json"), "utf8"));
	assert.equal(receipt.protectedPriorReferences.length, 98);
	for (const reference of receipt.protectedPriorReferences) {
		const bytes = readFileSync(resolve(__dirname, "..", reference.file));
		assert.equal(createHash("sha256").update(bytes).digest("hex"), reference.sha256, reference.file);
	}
});

test("adopts only nine attributed action references and carries forward twenty-nine", () => {
	const receipt = JSON.parse(readFileSync(resolve(__dirname, "../backstop_data/baselines/chrome155-darwin-arm64-software-actions-20261018/acceptance.json"), "utf8"));
	assert.equal(receipt.parentBaseline, "chrome155-darwin-arm64-software-content-20261015");
	assert.equal(receipt.humanApproval.adopted, true);
	assert.equal(receipt.thresholdPercent, 0.1);
	assert.equal(receipt.requireSameDimensions, true);
	assert.equal(receipt.references.length, 38);
	assert.equal(receipt.references.filter((entry) => entry.origin === "reviewed-candidate").length, 9);
	assert.equal(receipt.references.filter((entry) => entry.origin === "carried-forward").length, 29);
	assert.equal(receipt.review.unexplainedCases, 0);
	assert.equal(receipt.review.stableCandidateCases, 12);
	assert.equal(receipt.review.fullStagedCases, 38);
	for (const control of receipt.review.controlMetrics) assert.equal(control.oldControlExactDifferentPixels, 0);
	for (const reference of receipt.references) {
		const bytes = readFileSync(resolve(__dirname, "../backstop_data/baselines/chrome155-darwin-arm64-software-actions-20261018/bitmaps_reference", reference.file));
		assert.equal(createHash("sha256").update(bytes).digest("hex"), reference.sha256, reference.file);
	}
});

test("preserves prior images and adopts only independently reviewed commercial and narrative changes", () => {
	const baseline = "backstop_data/baselines/chrome155-darwin-arm64-software-commercial-20261018-8059-80";
	const receipt = JSON.parse(readFileSync(resolve(__dirname, "..", baseline, "acceptance.json"), "utf8"));
	assert.equal(receipt.parentBaseline, "chrome155-darwin-arm64-software-actions-20261018");
	assert.equal(receipt.browser, "Google Chrome 155.0.8059.80");
	assert.equal(receipt.thresholdPercent, 0.1);
	assert.equal(receipt.requireSameDimensions, true);
	assert.equal(receipt.protectedPriorReferences.length, 136);
	assert.equal(receipt.references.length, 38);
	assert.equal(receipt.references.filter((entry) => entry.origin === "reviewed-candidate").length, 10);
	assert.equal(receipt.references.filter((entry) => entry.origin === "carried-forward").length, 28);
	assert.equal(receipt.review.verdict, "pass");
	assert.equal(receipt.review.stableCandidateCases, 10);
	assert.equal(receipt.review.fullStagedCases, 38);
	assert.equal(receipt.review.unexplainedCases, 0);
	const parent = JSON.parse(readFileSync(resolve(__dirname, "../backstop_data/baselines/chrome155-darwin-arm64-software-actions-20261018/acceptance.json"), "utf8"));
	const parentHashes = new Map(parent.references.map((entry) => [entry.file, entry.sha256]));
	assert.equal(parentHashes.size, 38);
	assert.equal(new Set(receipt.references.map((entry) => entry.file)).size, 38);
	for (const reference of receipt.references) assert.ok(parentHashes.has(reference.file), reference.file);
	const assertCarriedForward = (references) => {
		for (const reference of references.filter((entry) => entry.origin === "carried-forward")) {
			assert.equal(reference.sha256, parentHashes.get(reference.file), `Carried reference must match parent: ${reference.file}`);
		}
	};
	assertCarriedForward(receipt.references);
	const carried = receipt.references.find((entry) => entry.origin === "carried-forward");
	assert.throws(() => assertCarriedForward([{ ...carried, sha256: "0".repeat(64) }]), /must match parent/);
	assert.throws(() => assertCarriedForward([{ ...carried, file: "unknown-reference.png" }]), /must match parent/);
	for (const reference of receipt.protectedPriorReferences) {
		assert.equal(createHash("sha256").update(readFileSync(resolve(__dirname, "..", reference.file))).digest("hex"), reference.sha256, reference.file);
	}
	for (const reference of receipt.references) {
		assert.equal(createHash("sha256").update(readFileSync(resolve(__dirname, "..", baseline, "bitmaps_reference", reference.file))).digest("hex"), reference.sha256, reference.file);
	}
});

test("covers sharing and long-title notes at desktop and mobile widths", () => {
	const config = loadConfig();
	for (const label of ["sharing", "ai-conferences", "ai-conference-note", "sharing-note"]) {
		assert.ok(config.scenarios.some((scenario) => scenario.label === label));
	}
	assert.equal(config.scenarios.reduce((count, scenario) => count + (scenario.viewports || config.viewports).length, 0), 38);
});

// The authorized Chrome patch migration is additive; no historical baseline is rewritten.
{
 const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
 const hash = bytes => require('node:crypto').createHash('sha256').update(bytes).digest('hex');
 require('node:test')('workflow .85 evidence pins actual reports, independent review and 174 prior image hashes', () => {
  const app = path.resolve(__dirname, '..');
  const parent = 'chrome155-darwin-arm64-software-commercial-20261018-8059-80';
  const folder = path.join(app, 'backstop_data/baselines/chrome155-darwin-arm64-software-workflow-20261020-8059-85');
  const parentBytes = fs.readFileSync(path.join(app, 'backstop_data/baselines', parent, 'acceptance.json'));
  // Anchored to the parent receipt in canonical main 5f686306 (tree 1049a307).
  assert.equal(hash(parentBytes), '7f89925c7b3d029916b4692ce1674fbd9d4b87b26499d3743780e001acb8a467');
  const prior = JSON.parse(parentBytes);
  const evidenceHashes = { 'stable-report.json': '0fe7b30a344b515314397c22398f7d4d6a93ad3a7bd8d57b25a4c74d9abcb5ce', 'staged-report.json': '86ab1bc246968f59d178e716f4ce3c5c906a77c245081e4d7fd398db4f4a0197', 'independent-review.json': '2cf26a318f94a99c654b68948e6b4fa09f3cefcbd685c5646159bddbf67fd88b' };
  const loadPinned = file => { const bytes = fs.readFileSync(path.join(folder, file)); assert.equal(hash(bytes), evidenceHashes[file]); return JSON.parse(bytes); };
  const stable = loadPinned('stable-report.json'), staged = loadPinned('staged-report.json'), review = loadPinned('independent-review.json');
  const receipt = JSON.parse(fs.readFileSync(path.join(folder, 'acceptance.json')));
  assert.equal(receipt.parentBaseline, parent);
  assert.equal(receipt.browser, 'Google Chrome 155.0.8059.85');
  assert.equal(receipt.thresholdPercent, 0.1); assert.equal(receipt.requireSameDimensions, true);
  assert.deepEqual(receipt.evidenceHashes, evidenceHashes);
  assert.equal(review.verdict, 'pass');
  assert.deepEqual(review.reviewers.map(r => [r.agentId, r.role, r.verdict]), [
   ['01a158a9-7fb7-7ea1-a1a6-39e113fa8cc5', 'standards-and-gate', 'ALLOW'],
   ['01a158a9-805e-7fe2-b7da-30317bf3bde1', 'spec-and-visual', 'ALLOW']
  ]);
  for (const r of review.reviewers) { assert.equal(r.transport, 'workflow-host-agent'); assert.equal(r.actualServiceModel, 'not-exposed'); }
  assert.equal(review.unchangedMainControls.baseCommit, '5f686306cd7a2bf8bace6e377c54ad4683ba0f8c');
  assert.equal(review.unchangedMainControls.rows.length, 8);
  const controlNames = prior.references.map(r => r.file).filter(n => n.includes('_projects_') || n.includes('_sharing_')).sort();
  assert.deepEqual(review.unchangedMainControls.rows.map(r => r.file).sort(), controlNames);
  for (const row of review.unchangedMainControls.rows) { assert.equal(row.status, 'pass'); assert.equal(row.candidateVsUnchangedMainDifferentChannelBytes, 0); assert.equal(row.controlSha256, stable.cases.find(r => r.file === row.file).referenceSha256); }
  assert.deepEqual(review.sourceFiles.map(r => r.file).sort(), ['backstop.config.cjs', 'public/portfolio/learning/customer-support-workflow-20261018.png', 'scripts/visual-environment.test.mjs', 'src/features/portfolio/__tests__/learning-workflow-figure.test.tsx', 'src/features/portfolio/dashboard-content.tsx', 'src/features/portfolio/learning-workflow-figure.tsx'].sort());
  for (const source of review.sourceFiles) assert.match(source.sha256, /^[0-9a-f]{64}$/);
  const expectedProtected = [...prior.protectedPriorReferences, ...prior.references.map(r => ({ file: 'backstop_data/baselines/' + parent + '/bitmaps_reference/' + r.file, sha256: r.sha256 }))];
  assert.equal(expectedProtected.length, 174); assert.deepEqual(receipt.protectedPriorReferences, expectedProtected);
  for (const item of expectedProtected) assert.equal(hash(fs.readFileSync(path.join(app, item.file))), item.sha256);
  const names = prior.references.map(r => r.file).sort();
  assert.equal(receipt.references.length, 38); assert.deepEqual(receipt.references.map(r => r.file).sort(), names);
  const figureNames = names.filter(n => n.includes('_dashboard_') || n.includes('_dashboard-resume-desktop_'));
  assert.equal(figureNames.length, 6); assert.deepEqual(review.visualCandidates.map(r => r.file).sort(), figureNames);
  assert.deepEqual(receipt.review, { verdict: 'pass', independentAgents: review.reviewers.map(r => r.agentId), stableCandidateCases: stable.cases.length, fullStagedCases: staged.cases.length, unexplainedCases: 0 });
  assert.equal(stable.kind, 'candidate-stability'); assert.equal(staged.kind, 'staged-release');
  for (const report of [stable, staged]) {
   assert.equal(report.browser, receipt.browser); assert.equal(report.thresholdPercent, 0.1); assert.equal(report.requireSameDimensions, true);
   assert.match(report.rawReportSha256, /^[0-9a-f]{64}$/); assert.deepEqual(report.sourceFiles, review.sourceFiles);
   assert.equal(report.cases.length, 38); assert.deepEqual(report.cases.map(r => r.file).sort(), names);
   assert.equal(report.backstopReport.tests.length, 38);
   assert.deepEqual(report.backstopReport.tests.map(r => r.file).sort(), names);
   for (const row of report.cases) {
    const actual = report.backstopReport.tests.find(r => r.file === row.file);
    assert.equal(actual.status, row.status); assert.equal(row.status, 'pass');
    assert.equal(actual.pair.diff.isSameDimensions, row.isSameDimensions); assert.equal(row.isSameDimensions, true);
    assert.equal(Number(actual.pair.diff.rawMisMatchPercentage ?? actual.pair.diff.misMatchPercentage), row.reportedMismatchPercent);
    assert.ok(Number.isFinite(row.reportedMismatchPercent) && row.reportedMismatchPercent >= 0 && row.reportedMismatchPercent <= 0.1);
    for (const [image, expected] of [[actual.pair.referenceImage, row.referenceSha256], [actual.pair.testImage, row.testSha256]]) {
     assert.match(expected, /^[0-9a-f]{64}$/);
     const resolved = path.resolve(app, image);
     assert.ok(resolved.startsWith(app + path.sep));
     assert.ok(fs.realpathSync(resolved).startsWith(fs.realpathSync(app) + path.sep));
     assert.equal(hash(fs.readFileSync(resolved)), expected);
    }
   }
  }
  for (const item of receipt.references) {
   assert.equal(hash(fs.readFileSync(path.join(folder, 'bitmaps_reference', item.file))), item.sha256);
   assert.equal(stable.cases.find(r => r.file === item.file).referenceSha256, item.candidateSha256);
   assert.equal(staged.cases.find(r => r.file === item.file).referenceSha256, item.sha256);
   if (figureNames.includes(item.file)) { assert.equal(item.attribution, 'workflow-figure'); assert.equal(item.candidateSha256, item.sha256); assert.equal(review.visualCandidates.find(r => r.file === item.file).sha256, item.sha256); }
   else { assert.equal(item.attribution, 'unchanged'); assert.equal(item.sha256, prior.references.find(r => r.file === item.file).sha256); }
  }
 });
}
