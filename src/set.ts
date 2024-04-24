import equal from "fast-deep-equal";
import { webext } from "./driver";
import type {
	Driver,
	StorageAreaName,
	StorageValue,
	Unwatch,
	WatchCallback,
} from "./types";
import { parse, stringify } from "./utils";

export interface SetStorage<T extends StorageValue> {
	add: (value: T) => Promise<T[]>;
	clear: () => Promise<void>;
	delete: (value: T) => Promise<boolean>;
	entries: () => Promise<[T, T][]>;
	forEach: (callback: (value: T, value2: T, set: T[]) => unknown) => void;
	has: (value: T) => Promise<boolean>;
	keys: () => Promise<T[]>;
	values: () => Promise<T[]>;
	watch: (callback: WatchCallback<T[]>) => Unwatch;
}

export interface CreateSetStorageOptions {
	area?: StorageAreaName;
	driver?: Driver;
}

export function createSetStorage<T extends StorageValue>(
	key: string,
	opts: CreateSetStorageOptions = {},
): SetStorage<T> {
	const _key = key;
	const _area = opts.area ?? "local";
	const _driver = opts.driver ?? webext({ area: _area });

	const _get = async () => {
		const raw = await _driver.getItem(_key);
		if (typeof raw !== "string") {
			return [] as T[];
		}

		const val = parse<T>(raw);
		if (!Array.isArray(val)) {
			return [] as T[];
		}
		return val as T[];
	};

	const _set = async (value: T[]) => {
		await _driver.setItem?.(_key, stringify(value), {});
	};

	return {
		async add(value) {
			const val = await _get();
			const added = val.filter((e) => !equal(e, value));
			added.push(value);
			await _set(added);
			return added;
		},

		async clear() {
			await _set([]);
		},

		async delete(value) {
			const val = await _get();
			const removed = val.filter((e) => !equal(e, value));
			await _set(removed);
			return val.length !== removed.length;
		},

		async entries() {
			const val = await _get();
			return val.map((e) => [e, e]);
		},

		async forEach(callback) {
			const val = await _get();
			for (const e of val) {
				await callback(e, e, val);
			}
		},

		async has(value) {
			const val = await _get();
			return val.some((e) => equal(e, value));
		},

		async keys() {
			return await _get();
		},

		async values() {
			return await _get();
		},

		watch(callback) {
			if (_driver.watch === undefined) {
				return () => undefined;
			}
			return _driver.watch(async () => {
				callback(await _get());
			});
		},
	};
}
