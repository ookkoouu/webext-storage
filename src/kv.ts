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

export type KVEntries = { [P in string]: StorageValue };

export interface KVStorage<T extends KVEntries> {
	readonly init: T;
	get: () => Promise<T>;
	getItem: <K extends keyof T>(key: K) => Promise<T[K]>;
	reset: () => Promise<void>;
	set: (value: T) => Promise<void>;
	setItem: <K extends keyof T>(key: K, value: T[K]) => Promise<void>;
	watch: (callback: WatchCallback<T>) => Unwatch;
	watchItem: <K extends keyof T>(
		key: K,
		callback: WatchCallback<T[K]>,
	) => Unwatch;
}

export interface CreateKVStorageOptions<T> {
	area?: StorageAreaName;
	driver?: Driver;
	init: T;
}

export function createKVStorage<T extends KVEntries>(
	key: string,
	opts: CreateKVStorageOptions<T>,
): KVStorage<T> {
	const _key = key;
	const _area = opts.area ?? "local";
	const _driver = opts.driver ?? webext({ area: _area });
	const _init = structuredClone(opts.init);
	let _prevValue = {} as T;

	return {
		async get() {
			const raw = await _driver.getItem(_key);
			if (typeof raw !== "string") {
				return structuredClone(_init);
			}
			const val = parse<T>(raw);
			return val;
		},

		async getItem(key) {
			const val = await this.get();
			return val[key];
		},

		get init() {
			return structuredClone(_init);
		},

		async reset() {
			await this.set(_init);
		},

		async set(value) {
			if (_driver.setItem === undefined) return;
			await _driver.setItem(_key, stringify(value), {});
		},

		async setItem(key, value) {
			const val = await this.get();
			val[key] = value;
			await this.set(val);
		},

		watch(callback) {
			this.get().then((v) => {
				_prevValue = v;
			});
			return _driver.watch(async () => {
				const val = await this.get();
				callback(val);
				_prevValue = val;
			});
		},

		watchItem(key, callback) {
			return this.watch((newValue) => {
				if (newValue == null) {
					callback(_init[key]);
					return;
				}
				if (!equal(_prevValue[key], newValue[key])) {
					callback(newValue[key]);
				}
			});
		},
	};
}
