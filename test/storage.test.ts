import { describe, expect, it, vi } from "vitest";
import { webext } from "../src/driver";
import { createStorage } from "../src/storage";
import { fakeBrowser } from "./browser";

function getStorage() {
	return createStorage("test", {
		driver: webext({ browser: fakeBrowser }),
	});
}

describe("storage", () => {
	it("initial", async () => {
		const storage = getStorage();
		expect(await storage.get()).toBe(undefined);
	});

	it("set", async () => {
		const storage = getStorage();
		const cases = [
			123,
			"test",
			true,
			null,
			Number.NaN,
			Number.POSITIVE_INFINITY,
			{ 0: 123, "": { p1: [0, 1, 2] } },
			[0, [1], {}],
		];
		for (const val of cases) {
			await storage.set(val);
			expect(await storage.get()).toStrictEqual(val);
		}
	});

	it("watch", async () => {
		const storage = getStorage();
		const cb = vi.fn();
		await storage.watch(cb);

		await storage.set({ p1: 123 });
		expect(cb).toHaveBeenLastCalledWith({ p1: 123 });
		await fakeBrowser.storage.local.clear();
		expect(cb).toHaveBeenLastCalledWith(undefined);
	});
});
