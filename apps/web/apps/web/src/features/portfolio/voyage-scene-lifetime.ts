export function createVoyageSceneLifetime(signal?: AbortSignal) {
	let disposed = false;
	const cleanups: Array<() => void> = [];
	const waiting = new Set<() => void>();
	let cleanupFailure: AggregateError | undefined;
	const cancelled = () => new DOMException("Voyage scene initialization was cancelled", "AbortError");
	const assertActive = () => {
		if (cleanupFailure) throw cleanupFailure;
		if (disposed) throw cancelled();
	};
	const dispose = () => {
		if (disposed) return;
		disposed = true;
		signal?.removeEventListener("abort", onAbort);
		const errors: unknown[] = [];
		for (const cleanup of cleanups.splice(0).reverse()) {
			try { cleanup(); } catch (error) { errors.push(error); }
		}
		if (errors.length) cleanupFailure = new AggregateError(errors, "Voyage scene cleanup failed");
		for (const cancel of [...waiting]) cancel();
		waiting.clear();
		if (cleanupFailure) throw cleanupFailure;
	};
	const onAbort = () => {
		const hasWaitingConsumer = waiting.size > 0;
		try { dispose(); } catch (error) {
			// Pending consumers receive the cleanup error through their Promise.
			// An active scene has no waiter, so report without an event exception.
			if (!hasWaitingConsumer) console.error("Voyage scene cleanup failed", error);
		}
	};
	const fail = (error: unknown): never => {
		try { dispose(); } catch (cleanupError) {
			throw new AggregateError([error, cleanupError], "Voyage scene initialization and cleanup failed", { cause: error });
		}
		if (cleanupFailure && cleanupFailure !== error) {
			throw new AggregateError([error, cleanupFailure], "Voyage scene initialization and cleanup failed", { cause: error });
		}
		throw error;
	};
	const register = (cleanup: () => void) => {
		if (disposed) cleanup();
		else cleanups.push(cleanup);
	};
	const wait = <T>(operation: Promise<T>, discard?: (value: T) => void): Promise<T> => new Promise((resolve, reject) => {
		const cancel = () => reject(cleanupFailure || cancelled());
		// Observe the original operation even when already cancelled, so a late
		// network rejection cannot become an unhandled rejection.
		operation.then((value) => {
			waiting.delete(cancel);
			if (disposed) {
				try { discard?.(value); } catch (error) { console.error("Cancelled scene asset cleanup failed", error); }
				cancel();
			}
			else resolve(value);
		}, (error) => {
			waiting.delete(cancel);
			reject(error);
		});
		if (disposed) cancel();
		else waiting.add(cancel);
	});
	signal?.addEventListener("abort", onAbort, { once: true });
	if (signal?.aborted) onAbort();
	return { dispose, fail, register, wait, assertActive, get disposed() { return disposed; } };
}

export type VoyageSceneLifetime = ReturnType<typeof createVoyageSceneLifetime>;
