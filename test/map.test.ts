import { beforeEach, describe, expect, it, vi } from "vitest";
import { webext } from "../src/driver";
import { type MapStorage, createMapStorage } from "../src/map";
import type { StorageValue } from "../src/types";
import { fakeBrowser } from "./browser";

function getStorage<
	K extends StorageValue,
	V extends StorageValue,
>(): MapStorage<K, V> {
	return createMapStorage("test", {
		driver: webext({ browser: fakeBrowser }),
	});
}

beforeEach(() => {
	fakeBrowser.reset();
});

it("init", async () => {
	const storage = getStorage();
	expect(await storage.get("k1")).toBe(undefined);
	expect(await storage.has("k2")).toBe(false);
	expect(await storage.entries()).toStrictEqual([]);
});

describe("get/set", () => {
	const storage = getStorage();
	const cases: { name: string; input: StorageValue; expect: unknown }[] = [
		{
			name: "number",
			input: 123,
			expect: 123,
		},
		{
			name: "string",
			input: "test",
			expect: "test",
		},
		{
			name: "boolean",
			input: true,
			expect: true,
		},
		{
			name: "null",
			input: null,
			expect: null,
		},
		{
			name: "nan",
			input: Number.NaN,
			expect: Number.NaN,
		},
		{
			name: "infinity",
			input: Number.POSITIVE_INFINITY,
			expect: Number.POSITIVE_INFINITY,
		},
		{
			name: "object",
			input: { 0: 123, "": { p1: [0, 1, 2] } },
			expect: { 0: 123, "": { p1: [0, 1, 2] } },
		},
		{
			name: "array",
			input: [0, [Number.NaN], {}],
			expect: [0, [Number.NaN], {}],
		},
	];

	for (const c of cases) {
		fakeBrowser.reset();
		it(c.name, async () => {
			await storage.set(c.input, c.input);
			expect(await storage.get(c.input)).toStrictEqual(c.expect);
		});
	}
});

it("watch", async () => {
	const storage = getStorage();
	const cb = vi.fn();
	await storage.watch(cb);

	await storage.set("e1", "abc");
	expect(cb).toHaveBeenLastCalledWith([["e1", "abc"]]);
	await fakeBrowser.storage.local.clear();
	expect(cb).toHaveBeenLastCalledWith([]);
});
