import { fakeBrowser } from "@webext-core/fake-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Storage } from "./storage";

describe("sync", async () => {
	const tests: { name: string; input: unknown }[] = [
		{ name: "1", input: 123 },
		{ name: "2", input: { a: [1, 2, 3], b: { c: null } } },
		{ name: "3", input: [{ a: 123 }, { a: 234 }] },
	];

	for (const test of tests) {
		it(test.name, async () => {
			const storage1 = new Storage<unknown>("test", {});
			const storage2 = new Storage<unknown>("test", {});
			await storage1.set(test.input);
			const output = await storage2.get();
			expect(output).toEqual(test.input);
		});
	}
});

describe("watch", () => {
	const tests: { name: string; input: unknown }[] = [
		{ name: "number", input: 123 },
		{ name: "string", input: "test" },
		{ name: "boolean", input: false },
		{
			name: "record",
			input: { 1: 123, "": { pp1: true }, p3: [{ a: 1, b: 2 }] },
		},
		{ name: "array", input: ["test", [4, { a: [{ b: 5 }, { c: 6 }] }]] },
	];

	beforeEach(() => {
		fakeBrowser.reset();
	});
	for (const test of tests) {
		const mockCb = vi.fn();
		it(test.name, async () => {
			const storage = new Storage<unknown>("test", {});
			storage.watch(mockCb);
			await storage.set(test.input);
			expect(mockCb).toHaveBeenLastCalledWith(test.input, null);
		});
	}
});
