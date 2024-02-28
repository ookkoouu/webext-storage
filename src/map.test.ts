import { describe, expect, it } from "vitest";
import { MapStorage } from "./map";

describe("get(deepEq)", () => {
	const tests: { name: string; input: [unknown, unknown] }[] = [
		{ name: "str", input: ["test_key", "test_value"] },
		{ name: "num", input: [1, 1234] },
		{ name: "bool", input: [false, true] },
		{ name: "obj", input: [{ key: "k" }, { value: "v" }] },
		{
			name: "arr",
			input: [
				[0, "key"],
				[1, "value"],
			],
		},
	];
	const others = structuredClone(
		Object.fromEntries(tests.map((t) => [t.name, t.input])),
	);

	const storage = new MapStorage("test", [], { deepEqual: true });
	for (const test of tests) {
		it(test.name, () => {
			storage.set(...test.input);
			const output = storage.get(others[test.name][0]);
			expect(output).toStrictEqual(test.input[1]);
		});
	}
});

describe("has(deepEq)", () => {
	const tests: { name: string; input: [unknown, unknown] }[] = [
		{ name: "str", input: ["test_key", "test_value"] },
		{ name: "num", input: [1, 1234] },
		{ name: "bool", input: [false, true] },
		{ name: "obj", input: [{ key: "k" }, { value: "v" }] },
		{
			name: "arr",
			input: [
				[0, "key"],
				[1, "value"],
			],
		},
	];
	const others = structuredClone(
		Object.fromEntries(tests.map((t) => [t.name, t.input])),
	);

	const storage = new MapStorage("test", [], { deepEqual: true });
	for (const test of tests) {
		it(test.name, () => {
			storage.set(...test.input);
			const output = storage.has(others[test.name][0]);
			expect(output).toBe(true);
		});
	}
});

describe("delete(deepEq)", () => {
	const tests: { name: string; input: [unknown, unknown] }[] = [
		{ name: "str", input: ["test_key", "test_value"] },
		{ name: "num", input: [1, 1234] },
		{ name: "bool", input: [false, true] },
		{ name: "obj", input: [{ key: "k" }, { value: "v" }] },
		{
			name: "arr",
			input: [
				[0, "key"],
				[1, "value"],
			],
		},
	];
	const others = structuredClone(
		Object.fromEntries(tests.map((t) => [t.name, t.input])),
	);

	const storage = new MapStorage("test", [], { deepEqual: true });
	for (const test of tests) {
		it(test.name, () => {
			storage.set(...test.input);
			expect(storage.get(test.input[0])).not.toBe(undefined);
			const output = storage.delete(others[test.name][0]);
			expect(output).toBe(true);
			expect(storage.get(test.input[0])).toBe(undefined);
		});
	}
});
