import { beforeEach, describe, expect, it, vi } from "vitest";
import { webext } from "../src/driver";
import { type SetStorage, createSetStorage } from "../src/set";
import type { StorageValue } from "../src/types";
import { fakeBrowser } from "./browser";

function getStorage<T extends StorageValue>(): SetStorage<T> {
	return createSetStorage("test", {
		driver: webext({ browser: fakeBrowser }),
	});
}

beforeEach(() => {
	fakeBrowser.reset();
});

it("init", async () => {
	const storage = getStorage();
	expect(await storage.has("k1")).toBe(false);
	expect(await storage.entries()).toStrictEqual([]);
});

describe("get/set", () => {
	const storage = getStorage();
	const cases: { name: string; input: StorageValue }[] = [
		{
			name: "number",
			input: 123,
		},
		{
			name: "string",
			input: "test",
		},
		{
			name: "boolean",
			input: false,
		},
		{
			name: "null",
			input: null,
		},
		{
			name: "nan",
			input: Number.NaN,
		},
		{
			name: "infinity",
			input: Number.POSITIVE_INFINITY,
		},
		{
			name: "object",
			input: { 0: 123, "": { p1: [0, 1, 2] } },
		},
		{
			name: "array",
			input: [0, [1], {}],
		},
	];

	for (const c of cases) {
		fakeBrowser.reset();
		it(c.name, async () => {
			await storage.add(c.input);
			expect(await storage.has(c.input)).toBe(true);
		});
	}
});

it("watch", async () => {
	const storage = getStorage();
	const cb = vi.fn();
	await storage.watch(cb);

	await storage.add("abc");
	expect(cb).toHaveBeenLastCalledWith(["abc"]);
	await fakeBrowser.storage.local.clear();
	expect(cb).toHaveBeenLastCalledWith([]);
});
