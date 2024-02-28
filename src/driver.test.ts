import { fakeBrowser } from "@webext-core/fake-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultDriver } from "./driver";

describe("get/set", () => {
	const tests: { name: string; input: unknown; expect: unknown }[] = [
		{ name: "number", input: 123, expect: 123 },
		{ name: "string", input: "test", expect: "test" },
		{ name: "boolean", input: false, expect: false },
		{ name: "null", input: null, expect: null },
		{ name: "undefined", input: undefined, expect: undefined },

		{
			name: "record",
			input: { 1: 123, "": { pp1: true }, p3: [{ a: 1, b: 2 }] },
			expect: { 1: 123, "": { pp1: true }, p3: [{ a: 1, b: 2 }] },
		},
		{
			name: "array",
			input: ["test", [4, { a: [{ b: 5 }, { c: 6 }] }]],
			expect: ["test", [4, { a: [{ b: 5 }, { c: 6 }] }]],
		},
	];

	beforeEach(() => {
		fakeBrowser.reset();
	});
	const driver = new DefaultDriver();
	for (const test of tests) {
		it(test.name, async () => {
			await driver.set(test.name, structuredClone(test.input));
			const output = await driver.get(test.name);
			expect(output).toStrictEqual(test.expect);
		});
	}
});

describe("watch", () => {
	const tests: { name: string; input: unknown }[] = [
		{ name: "number", input: 123 },
		{ name: "string", input: "test" },
		{ name: "boolean", input: false },
		{ name: "null", input: null },
		{
			name: "record",
			input: { 1: 123, "": { pp1: true }, p3: [{ a: 1, b: 2 }] },
		},
		{ name: "array", input: ["test", [4, { a: [{ b: 5 }, { c: 6 }] }]] },
	];

	beforeEach(() => {
		fakeBrowser.reset();
	});
	const driver = new DefaultDriver();
	for (const test of tests) {
		const mockCb = vi.fn();
		it(test.name, async () => {
			driver.watch(mockCb);
			await driver.set(test.name, test.input);
			expect(mockCb).toHaveBeenLastCalledWith(test.name, test.input, null);
		});
	}
});
