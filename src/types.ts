import type { Storage as ExtStorage } from "webextension-polyfill";

export type StorageAreaName = keyof Pick<
	ExtStorage.Static,
	"local" | "sync" | "session"
>;

export type JsonTransformer = {
	replacer: (key: string, value: unknown) => unknown;
	reviver: (key: string, value: unknown) => unknown;
};

export type StorageOptions = {
	area: StorageAreaName;
	sync: boolean;
	transformer: JsonTransformer;
};
export interface SetStorageOptions extends StorageOptions {
	deepEqual: boolean;
}
export interface MapStorageOptions extends StorageOptions {
	deepEqual: boolean;
}
export interface KVStorageOptions extends StorageOptions {}

export type WatchCallback<T> = (newValue: T, oldValue?: T) => void;
export type Unwatcher = {
	(): void;
	id: string;
};

/**
 * Enables to watch value changes
 */
export type Watchable<T> = {
	watch: (callback: WatchCallback<T>) => Unwatcher;
	/**
	 * Remove all watchers if `id` specified, otherwise remove all watchers.
	 * @param id
	 */
	unwatch: (id?: string) => void;
};

export interface IStorage<T> extends Watchable<T> {
	get: () => Promise<T>;
	getSync: () => T;
	set: (value: T) => Promise<void>;
	setSync: (value: T) => void;
	reset: () => Promise<void>;
}

export interface IKVStorage<T extends Record<string, unknown>>
	extends Watchable<T> {
	get: () => T;
	getItem: <K extends keyof T>(key: K) => T[K];
	set: (value: T) => void;
	setItem: <K extends keyof T>(key: K, value: T[K]) => void;
	reset: () => void;
	watchItem: <K extends keyof T>(
		key: K,
		callback: WatchCallback<T[K]>,
	) => Unwatcher;
}

export interface IMapStorage<K, V> extends Map<K, V>, Watchable<Map<K, V>> {
	reset: () => void;
	// toObject: () => Record<K, V>;
}

export interface ISetStorage<T> extends Set<T>, Watchable<Set<T>> {
	reset: () => void;
}
