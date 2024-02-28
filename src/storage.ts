import deepEqual from "fast-deep-equal";
import { nanoid } from "nanoid";
import { DefaultDriver, StorageDriver } from "./driver";
import { mergeDefault } from "./lib";

import type {
	IStorage,
	StorageOptions,
	Unwatcher,
	WatchCallback,
} from "./types";

const defaultOptions: Partial<StorageOptions> = {
	area: "local",
	sync: true,
};

export class Storage<T> implements IStorage<T> {
	readonly key: string;
	readonly defaultValue: T;
	#cache: T;
	#driver: StorageDriver<T>;
	#options = defaultOptions;
	#watchers: Map<string, WatchCallback<T>>;

	constructor(key: string, defaultValue: T, options?: Partial<StorageOptions>) {
		this.key = key;
		this.defaultValue = defaultValue;
		this.#cache = defaultValue;
		this.#watchers = new Map();

		this.#options = mergeDefault(defaultOptions, options);
		this.#driver = new DefaultDriver({
			area: this.#options.area,
			transformer: this.#options.transformer,
		});

		this.#driver.watch((key, nv, ov) => this.#changedPublisher(key, nv, ov));
		if (this.#options.sync) {
			this.#startSync();
		}
		// restore cache
		this.get();
	}

	#startSync() {
		this.#driver.watch((key, newValue) => {
			if (key === this.key && newValue !== undefined) {
				this.#cache = newValue;
			}
		});
	}

	#changedPublisher(key: string, newValue?: T, oldValue?: T) {
		if (key !== this.key) return;
		if (newValue === undefined) {
			return;
		}
		if (deepEqual(newValue, oldValue)) return;
		for (const [, watcher] of this.#watchers) {
			watcher(newValue, oldValue);
		}
	}

	async get(): Promise<T> {
		const value = await this.#driver.get(this.key);
		if (value === undefined) return structuredClone(this.defaultValue);
		this.#cache = value;
		return value;
	}

	getSync(): T {
		return this.#cache;
	}

	async set(value: T): Promise<void> {
		this.#cache = value;
		return this.#driver.set(this.key, value);
	}

	setSync(value: T): void {
		this.#cache = value;
		this.set(this.#cache);
	}

	async reset(): Promise<void> {
		this.#cache = this.defaultValue;
		return this.set(this.#cache);
	}

	watch(callback: WatchCallback<T>): Unwatcher {
		const id = nanoid(12);
		this.#watchers.set(id, callback);
		const unwatcher = () => {
			this.#watchers.delete(id);
		};
		unwatcher.id = id;
		return unwatcher as Unwatcher;
	}

	unwatch(id?: string): void {
		if (id !== undefined) {
			this.#watchers.delete(id);
		} else {
			this.#watchers.clear();
		}
	}
}
