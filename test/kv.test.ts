import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { webext } from "../src/driver";
import { type KVStorage, createKVStorage } from "../src/kv";
import type { StorageValue } from "../src/types";
import { fakeBrowser } from "./browser";

function getStorage<T extends Record<string, StorageValue>>(
	init: T,
): KVStorage<T> {
	return createKVStorage("test", {
		init,
		driver: webext({ browser: fakeBrowser }),
	});
}

describe("kv", () => {
	it("init", async () => {
		const storage = getStorage({ p1: 123 });
		expect(storage.init).toStrictEqual({ p1: 123 });
		expect(await storage.get()).toStrictEqual({ p1: 123 });
	});

	it("get/set", async () => {
		const storage = getStorage({ p1: 123 });
		await storage.set({ p1: 456 });
		expect(await storage.get()).toStrictEqual({ p1: 456 });
	});

	it("getItem/setItem", async () => {
		const storage = getStorage({ p1: "123" });
		await storage.setItem("p1", "456");
		expect(await storage.getItem("p1")).toBe("456");
	});

	it("reset", async () => {
		const storage = getStorage({ p1: "123" });
		await storage.setItem("p1", "");
		expect(await storage.getItem("p1")).toBe("");
		await storage.reset();
		expect(await storage.getItem("p1")).toBe("123");
	});

	it("watchItem", async () => {
		const storage = getStorage({ p1: 123 });
		const cb = vi.fn();
		await storage.watchItem("p1", cb);
		await storage.getItem("p1");

		await storage.setItem("p1", 456);
		expect(cb).toHaveBeenLastCalledWith(456);
		await fakeBrowser.storage.local.clear();
		expect(cb).toHaveBeenLastCalledWith(123);
	});
});
