import type { Storage as ExtStorage } from "webextension-polyfill";
import { getExtensionStorage } from "./lib";
import { defaultTransformer, mergeTransformer } from "./transformer";
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
	transformer: JsonTransformer;
};

export class DefaultDriver implements StorageDriver {
	#storage: ExtStorage.StorageArea;
	#transformer: JsonTransformer;
	constructor(options?: Partial<DefaultDriverOptions>) {
		this.#storage = getExtensionStorage(options?.area ?? "local");
		this.#transformer = mergeTransformer(
			defaultTransformer,
			options?.transformer,
		);
	}

	#jsonParse<T>(value: string): T {
		return JSON.parse(value, this.#transformer.reviver);
	}

	#jsonStringify(value: unknown): string {
		return JSON.stringify(value, this.#transformer.replacer);
	}

	async get<T>(key: string): Promise<T | undefined> {
		const raw = await this.#storage.get({ [key]: undefined });
		if (raw[key] === undefined && typeof raw[key] !== "string") return;
		return this.#jsonParse<T>(raw[key]);
	}

	async set<T>(key: string, value: T): Promise<void> {
		await this.#storage.set({ [key]: this.#jsonStringify(value) });
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
