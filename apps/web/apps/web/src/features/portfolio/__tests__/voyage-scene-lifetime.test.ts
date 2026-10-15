import { describe, expect, it } from "vitest";

import { createVoyageSceneLifetime } from "../voyage-scene-lifetime";

describe("voyage scene lifetime", () => {
	it("retains both initialization and cleanup errors while releasing other resources", () => {
		const lifetime = createVoyageSceneLifetime();
		const original = new Error("Controlled initialization failure");
		const cleanup = new Error("Controlled cleanup failure");
		let released = false;
		lifetime.register(() => { released = true; });
		lifetime.register(() => { throw cleanup; });
		let caught: unknown;
		try {
			lifetime.fail(original);
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(AggregateError);
		const combined = caught as AggregateError;
		expect(combined.cause).toBe(original);
		expect(combined.errors[0]).toBe(original);
		expect(combined.errors[1].errors).toEqual([cleanup]);
		expect(released).toBe(true);
		expect(() => lifetime.fail(original)).toThrow(AggregateError);
	});

	it("aborts pending initialization immediately and prevents late continuation", async () => {
		const controller = new AbortController();
		const lifetime = createVoyageSceneLifetime(controller.signal);
		const resources = ["engine", "scene"];
		lifetime.register(() => { resources.splice(resources.indexOf("engine"), 1); });
		lifetime.register(() => { resources.splice(resources.indexOf("scene"), 1); });
		let resolveAsset!: (value: number) => void;
		let continuation = 0;
		const outcome = lifetime.wait(new Promise<number>((resolve) => { resolveAsset = resolve; }))
			.then(() => { continuation++; }).catch((error: unknown) => error);
		controller.abort();
		expect(resources).toEqual([]);
		expect(await outcome).toMatchObject({ name: "AbortError" });
		resolveAsset(42);
		await Promise.resolve();
		expect(continuation).toBe(0);
	});

	it("manual disposal cancels pending work without an external signal", async () => {
		const lifetime = createVoyageSceneLifetime();
		const outcome = lifetime.wait(new Promise<void>(() => {})).catch((error: unknown) => error);
		lifetime.dispose();
		expect(await outcome).toMatchObject({ name: "AbortError" });
		expect(() => lifetime.assertActive()).toThrow();
	});

	it("releases resources once in reverse registration order", () => {
		const controller = new AbortController();
		const lifetime = createVoyageSceneLifetime(controller.signal);
		const released: string[] = [];
		lifetime.register(() => { released.push("engine"); });
		lifetime.register(() => { released.push("scene"); });
		lifetime.dispose();
		lifetime.dispose();
		controller.abort();
		expect(released).toEqual(["scene", "engine"]);
	});

	it("keeps successful work active until its owner disposes it", async () => {
		const lifetime = createVoyageSceneLifetime();
		let live = true;
		lifetime.register(() => { live = false; });
		expect(await lifetime.wait(Promise.resolve(42))).toBe(42);
		expect(live).toBe(true);
		lifetime.dispose();
		expect(live).toBe(false);
	});

	it("rejects initialization with an already aborted signal", async () => {
		const controller = new AbortController();
		controller.abort();
		const lifetime = createVoyageSceneLifetime(controller.signal);
		expect(() => lifetime.assertActive()).toThrow();
		await expect(lifetime.wait(Promise.resolve(42))).rejects.toMatchObject({ name: "AbortError" });
	});

	it("still releases other resources when one cleanup fails", async () => {
		const lifetime = createVoyageSceneLifetime();
		const released: string[] = [];
		const outcome = lifetime.wait(new Promise<void>(() => {})).catch((error: unknown) => error);
		lifetime.register(() => { released.push("engine"); });
		lifetime.register(() => { throw new Error("Controlled cleanup failure"); });
		lifetime.register(() => { released.push("scene"); });
		expect(() => lifetime.dispose()).toThrow(AggregateError);
		expect(released).toEqual(["scene", "engine"]);
		expect(await outcome).toBeInstanceOf(AggregateError);
	});

	it("preserves the original initialization failure", async () => {
		const lifetime = createVoyageSceneLifetime();
		const error = new Error("Controlled asset failure");
		await expect(lifetime.wait(Promise.reject(error))).rejects.toBe(error);
		lifetime.dispose();
	});

	it("discards assets that arrive after cancellation", async () => {
		const controller = new AbortController();
		const lifetime = createVoyageSceneLifetime(controller.signal);
		const asset = { live: true };
		let finish!: (value: typeof asset) => void;
		const outcome = lifetime.wait(new Promise<typeof asset>((resolve) => { finish = resolve; }), (value) => { value.live = false; }).catch((error: unknown) => error);
		controller.abort();
		expect(await outcome).toMatchObject({ name: "AbortError" });
		finish(asset);
		await Promise.resolve();
		expect(asset.live).toBe(false);
	});

	it("reports abort cleanup failure through the waiting consumer instead of the event", async () => {
		const controller = new AbortController();
		const lifetime = createVoyageSceneLifetime(controller.signal);
		const events: ErrorEvent[] = [];
		const onError = (event: ErrorEvent) => { events.push(event); };
		window.addEventListener("error", onError);
		try {
			let released = false;
			lifetime.register(() => { released = true; });
			lifetime.register(() => { throw new Error("Controlled abort cleanup failure"); });
			const outcome = lifetime.wait(new Promise<void>(() => {})).catch((error: unknown) => error);
			controller.abort();
			expect(await outcome).toBeInstanceOf(AggregateError);
			expect(released).toBe(true);
			expect(events).toEqual([]);
		} finally { window.removeEventListener("error", onError); }
	});
});
