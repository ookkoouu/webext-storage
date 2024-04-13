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
