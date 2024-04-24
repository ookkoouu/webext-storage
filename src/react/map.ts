import { useCallback, useEffect, useState } from "react";
import type { MapStorage } from "../map";
import type { StorageValue } from "../types";

export type MapStorageHook<K, V> = readonly [
	value: Array<[K, V]>,
	map: {
		clear(): Promise<void>;
		delete(key: K): Promise<boolean>;
		get(key: K): Promise<V | undefined>;
		has(key: K): Promise<boolean>;
		set(key: K, value: V): Promise<void>;
	},
];

export function useMapStorage<K extends StorageValue, V extends StorageValue>(
	storage: MapStorage<K, V>,
): MapStorageHook<K, V> {
	const [renderValue, setRenderValue] = useState<Array<[K, V]>>([]);

	const clear = useCallback(() => storage.clear(), [storage]);
	const _delete = useCallback((key: K) => storage.delete(key), [storage]);
	const get = useCallback((key: K) => storage.get(key), [storage]);
	const has = useCallback((key: K) => storage.has(key), [storage]);
	const set = useCallback(
		(key: K, value: V) => storage.set(key, value),
		[storage],
	);

	useEffect(() => {
		(async () => {
			setRenderValue(await storage.entries());
		})();

		const unwatch = storage.watch((newValue) => {
			if (newValue === undefined) return;
			setRenderValue(newValue);
		});

		return () => {
			unwatch();
		};
	}, [storage]);

	return [
		renderValue,
		{
			clear,
			delete: _delete,
			get,
			has,
			set,
		},
	] as const;
}
