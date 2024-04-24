/**
 * @license MIT License, Copyright (c) 2022 Aaron
 * @link https://github.com/aklinker1/webext-core/blob/36627f1d2a4f78e9d32abaf56507e41d6c26fcc1/packages/fake-browser/src/apis/storage.ts
 */
import type { Browser, Events, Storage } from "webextension-polyfill";

interface FakeBrowser extends Browser {
	reset: () => void;
}

function isAccepableValue(value: unknown): boolean {
	if (value === undefined) return false;
	if (
		typeof value === "number" &&
		Number.isNaN(value) &&
		!Number.isFinite(value)
	) {
		return false;
	}
	return true;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type EventCallback = (...args: any[]) => any;

type EventWithTrigger<TCallback extends EventCallback> =
	Events.Event<TCallback> & {
		/**
		 * Manually trigger the event and return the results from all the active listeners.
		 */
		trigger(...args: Parameters<TCallback>): Promise<ReturnType<TCallback>[]>;
		/**
		 * Remove all listeners from the event.
		 */
		removeAllListeners(): void;
	};

function defineEventWithTrigger<
	T extends EventCallback,
>(): EventWithTrigger<T> {
	const listeners: T[] = [];

	return {
		hasListener(callback) {
			return listeners.includes(callback);
		},
		hasListeners() {
			return listeners.length > 0;
		},
		addListener(callback) {
			listeners.push(callback);
		},
		removeListener(callback) {
			const index = listeners.indexOf(callback);
			if (index >= 0) listeners.splice(index, 1);
		},
		removeAllListeners() {
			listeners.length = 0;
		},
		async trigger(...args) {
			return await Promise.all(listeners.map((l) => l(...args)));
		},
	};
}

const globalOnChanged =
	defineEventWithTrigger<
		(changes: Record<string, Storage.StorageChange>, areaName: string) => void
	>();

type StorageAreaWithTrigger = Storage.StorageArea & {
	resetState(): void;
	onChanged: {
		trigger(
			changes: Storage.StorageAreaOnChangedChangesType,
		): Promise<unknown[]>;
		removeAllListeners(): void;
	};
};

type StorageArea = "local" | "managed" | "session" | "sync";
function defineStorageArea(area: StorageArea): StorageAreaWithTrigger {
	const data: Map<string, unknown> = new Map();
	const onChanged =
		defineEventWithTrigger<
			(changes: Storage.StorageAreaOnChangedChangesType) => void
		>();

	function getKeyList(keys: string | string[]): string[] {
		return Array.isArray(keys) ? keys : [keys];
	}

	return {
		resetState() {
			onChanged.removeAllListeners();
			data.clear();
		},
		async clear() {
			const changes: Record<string, Storage.StorageChange> = {};
			for (const [key, value] of data.entries()) {
				changes[key] = { oldValue: value };
			}
			data.clear();
			await onChanged.trigger(changes);
			await globalOnChanged.trigger(changes, area);
		},
		async get(keys?) {
			if (keys == null) return Object.fromEntries(data.entries());
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const res: Record<string, any> = {};
			if (typeof keys === "object" && !Array.isArray(keys)) {
				// Return all the keys + the values as the defaults
				for (const key of Object.keys(keys)) {
					res[key] = data.get(key) ?? keys[key];
				}
			} else {
				// return just the keys or null
				for (const key of getKeyList(keys)) {
					if (data.has(key)) {
						res[key] = data.get(key);
					}
				}
			}
			return res;
		},
		async remove(keys) {
			const changes: Record<string, Storage.StorageChange> = {};
			for (const key of getKeyList(keys)) {
				const oldValue = data.get(key);
				changes[key] = { oldValue };
				data.delete(key);
			}
			await onChanged.trigger(changes);
			await globalOnChanged.trigger(changes, area);
		},
		async set(items) {
			const changes: Record<string, Storage.StorageChange> = {};
			for (const [key, newValue] of Object.entries(items)) {
				// ignore undefined values
				if (!isAccepableValue(newValue)) continue;

				const oldValue = data.get(key);
				changes[key] = { oldValue, newValue };

				data.set(key, newValue);
			}
			await onChanged.trigger(changes);
			await globalOnChanged.trigger(changes, area);
		},
		onChanged,
	};
}

const localStorage = {
	...defineStorageArea("local"),
	QUOTA_BYTES: 5242880 as const,
};
const managedStorage = {
	...defineStorageArea("managed"),
	QUOTA_BYTES: 5242880 as const,
};
const sessionStorage = {
	...defineStorageArea("session"),
	QUOTA_BYTES: 10485760 as const,
};
const syncStorage = {
	...defineStorageArea("sync"),
	MAX_ITEMS: 512 as const,
	MAX_WRITE_OPERATIONS_PER_HOUR: 1800 as const,
	MAX_WRITE_OPERATIONS_PER_MINUTE: 120 as const,
	QUOTA_BYTES: 102400 as const,
	QUOTA_BYTES_PER_ITEM: 8192 as const,
	getBytesInUse: () => {
		throw Error("Browser.storage.sync.getBytesInUse not implemented.");
	},
};

const storage = {
	resetState() {
		localStorage.resetState();
		managedStorage.resetState();
		sessionStorage.resetState();
		syncStorage.resetState();
		globalOnChanged.removeAllListeners();
	},
	local: localStorage,
	managed: managedStorage,
	session: sessionStorage,
	sync: syncStorage,
	onChanged: globalOnChanged,
};

export const fakeBrowser: FakeBrowser = {
	runtime: {
		id: "fake-browser",
	},
	storage,
	reset() {
		storage.resetState();
	},
} as unknown as FakeBrowser;
