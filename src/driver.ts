import type { Storage as ExtStorage } from "webextension-polyfill";
import { getExtensionStorage } from "./lib";
import type { JsonTransformer, StorageAreaName } from "./types";

export type StorageDriverWatchCallback<T> = (
	key: string,
	newValue?: T,
	oldValue?: T,
) => void;
export type StorageDriver = {
	get: <T>(key: string) => Promise<T | undefined>;
	set: <T>(key: string, value: T) => Promise<void>;
	watch: <T>(callback: StorageDriverWatchCallback<T>) => () => void;
};

type StorageAreaChanges = ExtStorage.StorageAreaOnChangedChangesType;
type StorageAreaChangedCallback = (changes: StorageAreaChanges) => void;
type DefaultDriverOptions = {
	area: StorageAreaName;
	copyLocal: boolean;
	namespace: string;
	transformer: JsonTransformer;
};

const defaultNamespace = "webextstorage_";

export class DefaultDriver implements StorageDriver {
	#storage: ExtStorage.StorageArea;
	#isCopy: boolean;
	#namespace: string;
	#transformer: JsonTransformer;

	constructor(options?: Partial<DefaultDriverOptions>) {
		this.#storage = getExtensionStorage(options?.area ?? "local");
		this.#isCopy = options?.copyLocal ?? false;
		this.#namespace = options?.namespace || defaultNamespace;
		if (options?.transformer) {
			this.#transformer = options.transformer;
		} else {
			this.#transformer = { replacer: (k, v) => v, reviver: (k, v) => v };
		}
	}

	#jsonParse<T>(value: string): T {
		return JSON.parse(value, this.#transformer.reviver);
	}

	#jsonStringify(value: unknown): string {
		return JSON.stringify(value, this.#transformer.replacer);
	}

	#copyLocalstorage<T>(key: string, value: T) {
		if (window?.origin == null || !window.origin.startsWith("https://")) return;
		window.localStorage.setItem(this.#namespace + key, JSON.stringify(value));
	}

	async get<T>(key: string): Promise<T | undefined> {
		const raw = await this.#storage.get(key);
		if (raw[key] === undefined && typeof raw[key] !== "string") return;
		const val = this.#jsonParse<T>(raw[key]);
		return val;
	}

	async set<T>(key: string, value: T): Promise<void> {
		await this.#storage.set({ [key]: this.#jsonStringify(value) });
		if (this.#isCopy) {
			this.#copyLocalstorage(key, value);
		}
	}

	watch<T>(callback: StorageDriverWatchCallback<T>): () => void {
		const _cb: StorageAreaChangedCallback = (change) => {
			for (const [k, v] of Object.entries(change)) {
				const newValue =
					v.newValue !== undefined
						? (this.#jsonParse(v.newValue) as T)
						: undefined;
				const oldValue =
					v.oldValue !== undefined
						? (this.#jsonParse(v.oldValue) as T)
						: undefined;
				callback(k, newValue, oldValue);
			}
		};
		this.#storage.onChanged.addListener(_cb);
		return () => this.#storage.onChanged.removeListener(_cb);
	}
}

type LocalstorageDriverOptions = {
	namespace: string;
	transformer: JsonTransformer;
};

export class LocalstorageDriver implements StorageDriver {
	#namespace: string;
	#storage: Storage;
	#transformer: JsonTransformer;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	#watchers: Set<StorageDriverWatchCallback<any>> = new Set();

	constructor(opts?: Partial<LocalstorageDriverOptions>) {
		this.#namespace = opts?.namespace || defaultNamespace;
		if (window?.localStorage == null) {
			throw new Error("localStorage is undefined");
		}
		this.#storage = window.localStorage;
		this.#transformer = opts?.transformer ?? {
			replacer: (_, v) => v,
			reviver: (_, v) => v,
		};

		window.addEventListener("storage", (e) => {
			if (e.key == null || !e.key.startsWith(this.#namespace)) return;
			// biome-ignore lint/complexity/noForEach: <explanation>
			this.#watchers.forEach((cb) => {
				cb(this.#unwrapKey(e.key as string), e.newValue, e.oldValue);
			});
		});
	}

	#wrapKey(key: string) {
		return this.#namespace + key;
	}
	#unwrapKey(key: string) {
		if (!key.startsWith(this.#namespace)) return key;
		return key.replace(new RegExp(`^${this.#namespace}`), "");
	}

	async get<T>(key: string): Promise<T | undefined> {
		const val = this.#storage.getItem(this.#wrapKey(key));
		if (val == null) return undefined;
		return JSON.parse(val, this.#transformer.reviver) as T;
	}

	async set<T>(key: string, value: T): Promise<void> {
		const oldValue = await this.get(key);
		this.#storage.setItem(
			this.#wrapKey(key),
			JSON.stringify(value, this.#transformer.replacer),
		);
		// biome-ignore lint/complexity/noForEach: <explanation>
		this.#watchers.forEach((cb) => {
			cb(key, value, oldValue);
		});
	}

	watch<T>(callback: StorageDriverWatchCallback<T>): () => void {
		this.#watchers.add(callback);
		return () => this.#watchers.delete(callback);
	}
}
