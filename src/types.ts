export type JsonTransformer = {
	replacer: (key: string, value: unknown) => unknown;
	reviver: (key: string, value: unknown) => unknown;
};

export type StorageArea = chrome.storage.StorageArea;
export type StorageAreaName = keyof Pick<
	typeof chrome.storage,
	"local" | "sync" | "session"
>;
type StorageAreaChangedCallback = Parameters<
	typeof chrome.storage.local.onChanged.addListener
>[0];
export type StorageChanges = Parameters<StorageAreaChangedCallback>[0];
export type StorageChange<T = unknown> = { newValue?: T; oldValue?: T };
export type StorageChangedCallback<T> = (change: StorageChange<T>) => void;
export type ExtensionStorage = typeof chrome.storage;

export type KVEntries = Record<string, unknown>;
export type WatchCallback<T> = (change: Required<StorageChange<T>>) => void;
export type Watcher<T extends KVEntries> = {
	[K in keyof T]: {
		key: K;
		callback: WatchCallback<T[K]>;
	};
}[keyof T];
