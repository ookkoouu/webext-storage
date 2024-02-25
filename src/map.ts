import deepEqual from "fast-deep-equal";
import { mergeDefault } from "./lib";
import { Storage } from "./storage";
import type {
	IMapStorage,
	MapStorageOptions,
	StorageOptions,
	Unwatcher,
	WatchCallback,
} from "./types";

type Options = Omit<MapStorageOptions, keyof StorageOptions>;

const defaultOptions: Options = {
	deepEqual: false,
};

export class MapStorage<K, V> implements IMapStorage<K, V> {
	#storage: Storage<[K, V][]>;
	#options: Options;
	defaultValue: [K, V][];
	#cache: Map<K, V>;

	constructor(
		key: string,
		defaultValue: [K, V][],
		options?: MapStorageOptions,
	) {
		const _options = mergeDefault<Partial<MapStorageOptions>>(
			defaultOptions,
			options,
		);
		this.#storage = new Storage(key, defaultValue, _options);
		this.#options = { deepEqual: _options.deepEqual ?? false };
		this.#cache = new Map(defaultValue);
		this.defaultValue = defaultValue;
	}

	#save() {
		this.#storage.setSync([...this.#cache]);
	}

	reset(): void {
		this.#cache = new Map(this.defaultValue);
		this.#storage.reset();
		this.#save();
	}

	clear(): void {
		this.#cache.clear();
		this.#save();
	}

	delete(key: K): boolean {
		if (this.#options.deepEqual) {
			for (const cacheKey of this.#cache.keys()) {
				if (deepEqual(key, cacheKey)) {
					const res = this.#cache.delete(cacheKey);
					this.#save();
					return res;
				}
				return false;
			}
		}
		const res = this.#cache.delete(key);
		this.#save();
		return res;
	}

	forEach(
		callbackfn: (value: V, key: K, map: Map<K, V>) => void,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		thisArg?: any,
	): void {
		this.#cache.forEach(callbackfn, thisArg);
	}

	get(key: K): V | undefined {
		if (this.#options.deepEqual) {
			for (const cacheKey of this.#cache.keys()) {
				if (deepEqual(key, cacheKey)) {
					return this.#cache.get(cacheKey);
				}
				return;
			}
		}
		return this.#cache.get(key);
	}

	has(key: K): boolean {
		if (this.#options.deepEqual) {
			for (const cacheKey of this.#cache.keys()) {
				if (deepEqual(key, cacheKey)) {
					return this.#cache.has(cacheKey);
				}
				return false;
			}
		}
		return this.#cache.has(key);
	}

	set(key: K, value: V): this {
		this.#cache.set(key, value);
		this.#save();
		return this;
	}

	get size(): number {
		return this.#cache.size;
	}

	entries(): IterableIterator<[K, V]> {
		return this.#cache.entries();
	}

	keys(): IterableIterator<K> {
		return this.#cache.keys();
	}

	values(): IterableIterator<V> {
		return this.#cache.values();
	}

	[Symbol.iterator](): IterableIterator<[K, V]> {
		return this.#cache.entries();
	}

	[Symbol.toStringTag] = "MapStorage";

	watch(callback: WatchCallback<Map<K, V>>): Unwatcher {
		return this.#storage.watch((newValue, oldValue) => {
			callback(new Map(newValue), oldValue ? new Map(oldValue) : undefined);
		});
	}

	unwatch(id?: string | undefined): void {
		this.#storage.unwatch(id);
	}
}
