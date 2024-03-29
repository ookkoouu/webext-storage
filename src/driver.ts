import type { Storage as ExtStorage } from "webextension-polyfill";
import { getExtensionStorage } from "./lib";
import type { JsonTransformer, StorageAreaName } from "./types";

export type StorageDriverWatchCallback<T> = (
	key: string,
	newValue?: T,
	oldValue?: T,
) => void;
export type StorageDriver<T> = {
	get: (key: string) => Promise<T | undefined>;
	set: (key: string, value: T) => Promise<void>;
	watch: (callback: StorageDriverWatchCallback<T>) => () => void;
};

type StorageAreaChanges = ExtStorage.StorageAreaOnChangedChangesType;
type StorageAreaChangedCallback = (changes: StorageAreaChanges) => void;
type DefaultDriverOptions = {
	area: StorageAreaName;
	transformer: JsonTransformer;
};

export class DefaultDriver<T> implements StorageDriver<T> {
	#storage: ExtStorage.StorageArea;
	#transformer: JsonTransformer;

	constructor(options?: Partial<DefaultDriverOptions>) {
		this.#storage = getExtensionStorage(options?.area ?? "local");
		if (options?.transformer) {
			this.#transformer = options.transformer;
		} else {
			this.#transformer = { replacer: (k, v) => v, reviver: (k, v) => v };
		}
	}

	#jsonParse(value: string): T {
		return JSON.parse(value, this.#transformer.reviver);
	}

	#jsonStringify(value: unknown): string {
		return JSON.stringify(value, this.#transformer.replacer);
	}

	async get(key: string): Promise<T | undefined> {
		const raw = await this.#storage.get(key);
		if (raw[key] === undefined && typeof raw[key] !== "string") return;
		const _ = this.#jsonParse(raw[key]);
		return _;
	}

	async set(key: string, value: T): Promise<void> {
		await this.#storage.set({ [key]: this.#jsonStringify(value) });
	}

	watch(callback: StorageDriverWatchCallback<T>): () => void {
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
