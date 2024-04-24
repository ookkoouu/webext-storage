import { webext } from "./driver";
import type {
	Driver,
	StorageAreaName,
	StorageValue,
	Unwatch,
	WatchCallback,
} from "./types";
import { parse, stringify } from "./utils";

export interface Storage<T extends StorageValue> {
	get: () => Promise<T | undefined>;
	set: (value: T) => Promise<void>;
	watch: (callback: WatchCallback<T>) => Unwatch;
}

export interface CreateStorageOptions {
	area?: StorageAreaName;
	driver?: Driver;
}

export function createStorage<T extends StorageValue>(
	key: string,
	opts: CreateStorageOptions = {},
): Storage<T> {
	const _key = key;
	const _area = opts.area ?? "local";
	const _driver = opts.driver ?? webext({ area: _area });

	return {
		async get() {
			const raw = await _driver.getItem(_key);
			if (typeof raw !== "string") return;
			return parse<T>(raw);
		},

		async set(value) {
			if (_driver.setItem === undefined) return;
			await _driver.setItem(_key, stringify(value), {});
		},

		watch(callback) {
			if (_driver.watch === undefined) {
				return () => undefined;
			}
			return _driver.watch(async () => {
				callback(await this.get());
			});
		},
	};
}
