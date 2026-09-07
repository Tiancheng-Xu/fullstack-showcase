export const DEFAULT_GITHUB_TIMEOUT_MS = 5_000;

export async function withGitHubTimeout<T>(
	operation: (signal: AbortSignal) => Promise<T>,
	timeoutMs = DEFAULT_GITHUB_TIMEOUT_MS,
): Promise<T> {
	const controller = new AbortController();
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_resolve, reject) => {
		timeoutId = setTimeout(() => {
			controller.abort();
			reject(new DOMException("GitHub request timed out", "TimeoutError"));
		}, timeoutMs);
	});

	try {
		return await Promise.race([operation(controller.signal), timeout]);
	} finally {
		if (timeoutId !== undefined) clearTimeout(timeoutId);
	}
}
