import deepEqual from "fast-deep-equal";
import { Storage } from "./storage";
import type {
	IKVStorage,
	KVStorageOptions,
	Unwatcher,
	WatchCallback,
} from "./types";

export class KVStorage<T extends Record<string, unknown>>
	implements IKVStorage<T>
{
	#storage: Storage<T>;

	constructor(
		key: string,
		defaultValue: T,
		options?: Partial<KVStorageOptions>,
	) {
		this.#storage = new Storage(key, defaultValue, options);
		this.#storage.get();
	}

	get(): T {
		return this.#storage.getSync();
	}

	getItem<K extends keyof T>(key: K): T[K] {
		return this.get()[key];
	}

	set(value: T): void {
		this.#storage.set(value);
	}

	setItem<K extends keyof T>(key: K, value: T[K]): void {
		const cache = this.#storage.getSync();
		cache[key] = value;
		this.#storage.set(cache);
	}

	reset(): void {
		this.#storage.reset();
	}

	watchItem<K extends keyof T>(
		key: K,
		callback: WatchCallback<T[K]>,
	): Unwatcher {
		const itemCb = (newValue: T, oldValue?: T) => {
			const newItem = newValue[key];
			const oldItem = oldValue ? oldValue[key] : undefined;
			if (deepEqual(newItem, oldItem)) return;
			callback(newItem, oldItem);
		};
		return this.#storage.watch(itemCb);
	}

	watch(callback: WatchCallback<T>): Unwatcher {
		return this.#storage.watch(callback);
	}

	unwatch(id?: string | undefined): void {
		this.#storage.unwatch(id);
	}
}
