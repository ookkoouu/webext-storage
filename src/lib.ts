import type { Browser } from "webextension-polyfill";
import { StorageAreaName } from "./types";

declare global {
	// biome-ignore lint/style/noVar: <explanation>
	var chrome: Browser | undefined;
	// biome-ignore lint/style/noVar: <explanation>
	var browser: Browser | undefined;
}

export function getExtensionStorage(area: StorageAreaName) {
	const _browser = globalThis.chrome ?? globalThis.browser;
	const storage = _browser?.storage[area];
	if (storage === undefined) {
		throw new Error("This library must execute in browser extension context");
	}
	return storage;
}

export function mergeDefault<
	T extends Record<string, unknown> | Array<unknown>,
>(base: T, overwrite?: Partial<T>): T {
	if (overwrite === undefined) {
		return base;
	}
	const filteredOverwrites = Object.fromEntries(
		Object.entries(overwrite).filter(
			([k, v]) => Object.hasOwn(base, k) && v !== undefined,
		),
	);
	return { ...base, ...filteredOverwrites };
}

export function diffObject(
	newObject: Record<string, unknown>,
	oldObject: Record<string, unknown>,
) {
	Object.fromEntries(
		Object.entries(newObject).filter(([k, v]) => v !== oldObject[k]),
	);
}

export function clone(object: unknown) {
	return JSON.parse(JSON.stringify(object));
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
	if (typeof v !== "object" || v === null) return false;
	return v.constructor === undefined || v.constructor === Object;
}
