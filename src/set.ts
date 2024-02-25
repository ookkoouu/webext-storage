import deepEqual from "fast-deep-equal";
import { mergeDefault } from "./lib";
import { Storage } from "./storage";
import type {
	ISetStorage,
	SetStorageOptions,
	StorageOptions,
	Unwatcher,
	WatchCallback,
} from "./types";

type Options = Omit<SetStorageOptions, keyof StorageOptions>;

const defaultOptions: Options = {
	deepEqual: false,
};

export class SetStorage<T> implements ISetStorage<T> {
	#storage: Storage<T[]>;
	#options: Options;
	defaultValue: T[];
	#cache: Set<T>;

	constructor(key: string, defaultValue: T[], options?: SetStorageOptions) {
		const _options = mergeDefault<Partial<SetStorageOptions>>(
			defaultOptions,
			options,
		);
		this.#storage = new Storage(key, defaultValue, _options);
		this.#options = { deepEqual: _options.deepEqual ?? false };
		this.#cache = new Set(defaultValue);
		this.defaultValue = defaultValue;
	}

	#save() {
		this.#storage.setSync([...this.#cache]);
	}

	reset() {
		this.#cache = new Set(this.defaultValue);
		this.#storage.reset();
	}

	add(value: T): this {
		this.#cache.add(value);
		this.#save();
		return this;
	}

	clear(): void {
		this.#cache.clear();
		this.#save();
	}

	delete(value: T): boolean {
		const res = this.#cache.delete(value);
		this.#save();
		return res;
	}

	forEach(
		callbackfn: (value: T, value2: T, set: Set<T>) => void,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		thisArg?: any,
	): void {
		this.#cache.forEach(callbackfn, thisArg);
	}

	has(value: T): boolean {
		if (this.#options.deepEqual) {
			for (const cacheValue of this.#cache) {
				if (deepEqual(value, cacheValue)) {
					return true;
				}
			}
			return false;
		}
		const res = this.#cache.has(value);
		this.#save();
		return res;
	}

	get size() {
		return this.#cache.size;
	}

	entries(): IterableIterator<[T, T]> {
		return this.#cache.entries();
	}

	keys(): IterableIterator<T> {
		return this.#cache.keys();
	}

	values(): IterableIterator<T> {
		return this.#cache.values();
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.#cache.values();
	}

	[Symbol.toStringTag] = "SetStorage";

	watch(callback: WatchCallback<Set<T>>): Unwatcher {
		return this.#storage.watch((newValue, oldValue) => {
			callback(new Set(newValue), oldValue ? new Set(oldValue) : undefined);
		});
	}

	unwatch(id?: string | undefined): void {
		this.#storage.unwatch(id);
	}
}
