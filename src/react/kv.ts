import { useCallback, useEffect, useState } from "react";
import type { KVEntries, KVStorage } from "../kv";
import type { StorageValue } from "../types";

export type KVStorageHook<T extends KVEntries> = readonly [
	value: T,
	kv: {
		set(value: T): Promise<void>;
		setItem<K extends keyof T>(key: K, value: T[K]): Promise<void>;
		reset(): Promise<void>;
	},
];

export type KVStorageItemHook<T extends StorageValue> = readonly [
	item: T,
	setItem: (value: T) => Promise<void>,
];

export const useKVStorage = <T extends KVEntries>(
	storage: KVStorage<T>,
): KVStorageHook<T> => {
	const [renderValue, setRenderValue] = useState(storage.init);

	const set = useCallback((value: T) => storage.set(value), [storage]);
	const setItem = useCallback(
		<K extends keyof T>(key: K, value: T[K]) => storage.setItem(key, value),
		[storage],
	);
	const reset = useCallback(() => storage.reset(), [storage]);

	useEffect(() => {
		(async () => {
			setRenderValue(await storage.get());
		})();

		const unwatch = storage.watch((newValue) => {
			if (newValue === undefined) return;
			setRenderValue(newValue);
		});

		return () => {
			unwatch();
		};
	}, [storage]);

	return [renderValue, { set, setItem, reset }] as const;
};

export const useKVStorageItem = <T extends KVEntries, K extends keyof T>(
	storage: KVStorage<T>,
	key: K,
) => {
	const [renderValue, setRenderValue] = useState(storage.init[key]);

	const setItem = useCallback(
		(value: T[K]) => storage.setItem(key, value),
		[storage, key],
	);

	useEffect(() => {
		(async () => {
			setRenderValue(await storage.getItem(key));
		})();

		const unwatch = storage.watchItem(key, (newValue) => {
			if (newValue === undefined) return;
			setRenderValue(newValue);
		});

		return () => {
			unwatch();
		};
	}, [storage, key]);

	return [renderValue, setItem] as const;
};
