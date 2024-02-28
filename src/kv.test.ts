import { describe, expect, it } from "vitest";
import { KVStorage } from "./kv";

describe("get/set", () => {
	const entries = {
		str: "",
		num: 0,
		bool: false,
		obj: { a: [123] },
		arr: [0, "", false, { "": 0 }],
	};
	type Testcase<T, K extends keyof T = keyof T> = {
		name: K;
		input: T[K];
	};
	const tests: Testcase<typeof entries>[] = [
		{ name: "str", input: "test" },
		{ name: "num", input: 123 },
		{ name: "bool", input: true },
		{ name: "obj", input: { a: [345] } },
		{ name: "arr", input: ["test", true, 1, { "": 1 }] },
	];

	for (const test of tests) {
		it(test.name, () => {
			const storage1 = new KVStorage("test", entries);
			const storage2 = new KVStorage("test", entries);

			storage1.setItem(test.name, test.input);
			const output = storage1.getItem(test.name);
			expect(output).toStrictEqual(test.input);

			const output2 = storage2.getItem(test.name);
			expect(output2).toStrictEqual(test.input);
		});
	}
});
