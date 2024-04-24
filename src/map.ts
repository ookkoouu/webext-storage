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

export interface MapStorage<K extends StorageValue, V extends StorageValue> {
	clear: () => Promise<void>;
	delete: (key: K) => Promise<boolean>;
	entries: () => Promise<[K, V][]>;
	forEach: (callback: (value: V, key: K, map: [K, V][]) => unknown) => void;
	get: (key: K) => Promise<V | undefined>;
	has: (key: K) => Promise<boolean>;
	keys: () => Promise<K[]>;
	set: (key: K, value: V) => Promise<void>;
	values: () => Promise<V[]>;
	watch: (callback: WatchCallback<[K, V][]>) => Unwatch;
}

export interface CreateMapStorageOptions {
	area?: StorageAreaName;
	driver?: Driver;
}

export function createMapStorage<
	K extends StorageValue,
	V extends StorageValue,
>(key: string, opts: CreateMapStorageOptions = {}): MapStorage<K, V> {
	const _key = key;
	const _area = opts.area ?? "local";
	const _driver = opts.driver ?? webext({ area: _area });

	const _get = async () => {
		const raw = await _driver.getItem(_key);
		if (typeof raw !== "string") {
			return [] as [K, V][];
		}

		const val = parse<[K, V][]>(raw);
		if (Array.isArray(val)) {
			return val as [K, V][];
		}
		return [] as [K, V][];
	};

	const _set = async (value: [K, V][]) => {
		await _driver.setItem?.(_key, stringify(value), {});
	};

	return {
		async clear() {
			await _set([]);
		},

		async delete(key) {
			const val = await _get();
			const removed = val.filter(([k]) => !equal(k, key));
			await _set(removed);
			return val.length !== removed.length;
		},

		async entries() {
			return await _get();
		},

		async forEach(callback) {
			const val = await _get();
			for (const [k, v] of val) {
				await callback(v, k, val);
			}
		},

		async get(key) {
			const val = await _get();
			return val.find(([k]) => equal(k, key))?.[1];
		},

		async has(key) {
			const val = await _get();
			return val.some(([k]) => equal(k, key));
		},

		async keys() {
			return (await _get()).map(([k]) => k);
		},

		async set(key, value) {
			const val = await _get();
			const added = val.filter(([k]) => !equal(k, key));
			added.push([key, value]);
			await _set(added);
		},

		async values() {
			return (await _get()).map(([_, v]) => v);
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
