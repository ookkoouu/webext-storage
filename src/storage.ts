import deepEqual from "fast-deep-equal";
import { nanoid } from "nanoid";
import { DefaultDriver, StorageDriver } from "./driver";
import { mergeDefault } from "./lib";
import { defaultTransformer, mergeTransformer } from "./transformer";
import type {
	IStorage,
	StorageOptions,
	Unwatcher,
	WatchCallback,
} from "./types";

type Metadata = {
	/**
	 * updatedBy: last updated instance id
	 */
	ub: string;
	/**
	 * version
	 */
	v: number;
};
type StorageValue<T> = {
	/**
	 * value of user data
	 */
	v: T;
	/**
	 * metadata of storage item
	 */
	m: Metadata;
};

const defaultOptions: StorageOptions = {
	area: "local",
	sync: true,
	transformer: defaultTransformer,
	version: 1,
};

export class Storage<T> implements IStorage<T> {
	readonly key: string;
	readonly defaultValue: T;
	#cache: T;
	#driver: StorageDriver<StorageValue<T>>;
	#instanceId: string;
	#options = defaultOptions;
	#watchers: Map<string, WatchCallback<T>>;

	constructor(key: string, defaultValue: T, options?: Partial<StorageOptions>) {
		this.key = key;
		this.#instanceId = nanoid(8);
		this.defaultValue = defaultValue;
		this.#cache = defaultValue;
		this.#watchers = new Map();

		this.#options = mergeDefault(defaultOptions, options);
		if (options?.transformer !== undefined) {
			this.#options.transformer = mergeTransformer(
				this.#options.transformer,
				options.transformer,
			);
		}
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
		this.#driver.watch((_, newValue) => {
			if (newValue !== undefined) {
				this.#cache = newValue.v;
			}
		});
	}

	#changedPublisher(
		key: string,
		newValue?: StorageValue<T>,
		oldValue?: StorageValue<T>,
	) {
		if (key !== this.key) return;
		if (newValue === undefined) {
			return;
		}
		if (newValue.m.ub === this.#instanceId) return;
		if (deepEqual(newValue.v, oldValue?.v)) return;
		for (const [, watcher] of this.#watchers) {
			watcher(newValue.v, oldValue?.v);
		}
	}

	async #internalGet(): Promise<StorageValue<T> | undefined> {
		return await this.#driver.get(this.key);
	}

	async get(): Promise<T> {
		const raw = await this.#internalGet();
		if (raw === undefined) return structuredClone(this.defaultValue);
		this.#cache = raw.v;
		return raw.v;
	}

	getSync(): T {
		return this.#cache;
	}

	async #internalSet(value: T) {
		const raw: StorageValue<T> = {
			v: value,
			m: {
				ub: this.#instanceId,
				v: this.#options.version,
			},
		};
		await this.#driver.set(this.key, raw);
	}

	async set(value: T): Promise<void> {
		this.#cache = value;
		await this.#internalSet(value);
	}

	setSync(value: T): void {
		this.#cache = value;
		this.set(this.#cache);
	}

	async reset(): Promise<void> {
		this.#cache = this.defaultValue;
		await this.set(this.#cache);
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
