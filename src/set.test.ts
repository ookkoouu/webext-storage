import { describe, expect, it } from "vitest";
import { SetStorage } from "./set";

describe("get/set", () => {
	const tests: { name: string; input: unknown }[] = [
		{ name: "str", input: "test" },
		{ name: "num", input: 123 },
		{ name: "bool", input: true },
		{ name: "obj", input: { a: [345] } },
		{ name: "arr", input: ["test", true, 1, { "": 1 }] },
	];

	for (const test of tests) {
		const storage = new SetStorage<unknown>("test", []);

		it(test.name, () => {
			storage.add(test.input);
			const output = [...storage.values()];
			expect(output).toStrictEqual([test.input]);
		});
	}
});

describe("has(deepEq)", () => {
	const tests: { name: string; input: unknown }[] = [
		{ name: "str", input: "test" },
		{ name: "num", input: 123 },
		{ name: "bool", input: true },
		{ name: "obj", input: { a: [345] } },
		{ name: "arr", input: ["test", true, 1, { "": 1 }] },
	];
	const others = structuredClone(
		Object.fromEntries(tests.map((t) => [t.name, t.input])),
	);

	const storage = new SetStorage<unknown>("test", [], { deepEqual: true });
	for (const test of tests) {
		it(test.name, () => {
			storage.add(test.input);
			const output = storage.has(others[test.name]);
			expect(output).toBe(true);
		});
	}
});

describe("delete(deepEq)", () => {
	const tests: { name: string; input: unknown }[] = [
		{ name: "str", input: "test" },
		{ name: "num", input: 123 },
		{ name: "bool", input: true },
		{ name: "obj", input: { a: [345] } },
		{ name: "arr", input: ["test", true, 1, { "": 1 }] },
	];
	const others = structuredClone(
		Object.fromEntries(tests.map((t) => [t.name, t.input])),
	);

	const storage = new SetStorage<unknown>("test", [], { deepEqual: true });
	for (const test of tests) {
		it(test.name, () => {
			storage.add(test.input);
			expect(storage.has(test.input)).not.toBe(undefined);
			const output = storage.delete(others[test.name]);
			expect(output).toBe(true);
			expect(storage.has(test.input)).toBe(false);
		});
	}
});
