export type SafetyFinding = Readonly<{
	category: "api-key" | "private-key" | "password" | "phone" | "email";
	start: number;
	end: number;
}>;

const patterns: readonly Readonly<{
	category: SafetyFinding["category"];
	pattern: RegExp;
}>[] = [
	{
		category: "private-key",
		pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
	},
	{
		category: "api-key",
		pattern:
			/\b(?:api[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]\s*[^\s"'`]+/gi,
	},
	{
		category: "password",
		pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*[^\s"'`]+/gi,
	},
	{ category: "phone", pattern: /(?<!\d)1[3-9]\d{9}(?!\d)/g },
	{ category: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
];

export function scanOutboundText(text: string): readonly SafetyFinding[] {
	const findings: SafetyFinding[] = [];
	for (const { category, pattern } of patterns) {
		pattern.lastIndex = 0;
		for (const match of text.matchAll(pattern)) {
			const start = match.index;
			if (start === undefined) {
				continue;
			}
			findings.push({ category, start, end: start + match[0].length });
		}
	}
	return findings.sort(
		(left, right) => left.start - right.start || left.end - right.end,
	);
}
